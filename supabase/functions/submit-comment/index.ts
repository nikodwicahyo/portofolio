// Edge Function: submit-comment — rate-limited public comment intake.
// Deploy: supabase functions deploy submit-comment
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (set automatically).
//      COMMENT_HASH_SALT     — recommended; rotate to invalidate all IP buckets.
//      TURNSTILE_SECRET      — optional; when set, every post needs a Turnstile token.
// Client: src/utils/submitComment.js (the only write path — there is no direct
// insert fallback, and the table no longer grants INSERT to clients).

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { checkComment } from './rules.mjs';

const WINDOW_SECONDS = 30; // 1 comment per IP per 30s
const HOURLY_LIMIT = 20; // max 20 comments per IP per hour
const MAX_PAYLOAD_CHARS = 4096; // JSON payload is ~250 chars max

// The IP bucket must not be reversible. A constant salt published in the repo
// makes `ip_hash` an IPv4 address again (2^32 guesses), so the pepper comes
// from a secret: COMMENT_HASH_SALT if configured, otherwise the service-role
// key (always present in a function env, never in the client bundle).
const HASH_PEPPER =
  Deno.env.get('COMMENT_HASH_SALT') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
if (!HASH_PEPPER) console.error('[submit-comment] no hash pepper available — IP buckets are weak');

const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Optional CAPTCHA. The per-IP ledger alone cannot stop a scripted sender: a
// forged X-Forwarded-For mints a new bucket per request. Turnstile is the
// control that does not depend on the header; the global DB flood guard stays
// as the last-resort cap when no secret is configured.
async function turnstileOk(token: unknown, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true;
  // Cloudflare caps tokens at 2048 chars, tokens are single-use and expire
  // after 300s — a replay comes back as timeout-or-duplicate, i.e. success:false.
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET,
        response: token,
        remoteip: ip === 'unknown' ? undefined : ip,
      }),
      // Never let a slow Siteverify call hold the request open.
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json().catch(() => null);
    if (data?.success !== true) {
      console.warn('[submit-comment] turnstile rejected:', data?.['error-codes']?.join(',') || 'unknown');
    }
    return data?.success === true;
  } catch {
    // Fail closed: better a rejected comment than an open intake.
    console.error('[submit-comment] turnstile verify failed (network)');
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' });

  // Read bounded: the declared Content-Length is optional, so cap the body
  // itself instead of trusting the header.
  const raw = await req.text();
  if (raw.length > MAX_PAYLOAD_CHARS) return json(413, { error: 'Payload too large.' });

  let payload: { userName?: unknown; user_name?: unknown; content?: unknown; turnstileToken?: unknown };
  try {
    payload = JSON.parse(raw);
  } catch {
    return json(400, { error: 'Invalid JSON.' });
  }
  if (!payload || typeof payload !== 'object') return json(400, { error: 'Invalid JSON.' });
  // Accept both camelCase (canonical) and snake_case (legacy client). Length,
  // markup and link rules live in rules.mjs so the browser checks the same ones.
  const { name, body, error } = checkComment({
    userName: payload.userName ?? payload.user_name,
    content: payload.content,
  });
  if (error) return json(400, { error });

  // Trust the nearest (last) hop, not the first: the first value is whatever the
  // client sent, so `X-Forwarded-For: 1.2.3.4` would mint a fresh rate-limit
  // bucket per request. The edge proxy appends the address it actually saw last.
  // Verified by `npm run check-api -- --xff`; Turnstile is the control that
  // holds even if this assumption is wrong.
  const fwd = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
  const ip = fwd.split(',').map((s) => s.trim()).filter(Boolean).pop() || 'unknown';
  const ipHash = await sha256Hex(`comment-v1::${HASH_PEPPER}::${ip}`);

  if (!(await turnstileOk(payload.turnstileToken, ip))) {
    return json(403, { error: 'Please complete the verification and try again.', code: 'captcha_failed' });
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { data: recent, error: qErr } = await sb
    .from('comment_rate_limits')
    .select('created_at')
    .eq('ip_hash', ipHash)
    .gte('created_at', hourAgo)
    .order('created_at', { ascending: false })
    .limit(HOURLY_LIMIT);
  if (qErr) {
    console.error('[submit-comment] rate lookup failed:', qErr.message);
    return json(503, { error: 'Service temporarily unavailable.' });
  }
  if ((recent?.length || 0) >= HOURLY_LIMIT) {
    return json(429, { error: 'Too many comments. Please try again later.' });
  }
  const last = recent?.[0]?.created_at ? Date.parse(recent[0].created_at) : 0;
  if (Date.now() - last < WINDOW_SECONDS * 1000) {
    return json(429, { error: 'You are commenting too fast. Please wait a bit.' });
  }

  // Claim the slot before writing the comment: if the ledger write fails we
  // must not leave an unmetered comment behind. Rows are pruned after 24h by
  // the DB trigger (migration 20261024), so this stays bounded.
  const { data: slot, error: rlErr } = await sb
    .from('comment_rate_limits')
    .insert({ ip_hash: ipHash })
    .select('id')
    .single();
  if (rlErr) {
    console.error('[submit-comment] rate ledger write failed:', rlErr.message);
    return json(503, { error: 'Service temporarily unavailable.' });
  }

  const { data: inserted, error: iErr } = await sb
    .from('portfolio_comments')
    .insert({ user_name: name, content: body, is_pinned: false })
    .select('id')
    .single();
  if (iErr) {
    // Give the slot back so a transient failure does not lock the visitor out
    // for 30s/hour. Best-effort: the global guard is still in place if this fails.
    if (slot?.id) await sb.from('comment_rate_limits').delete().eq('id', slot.id);
    // DB-level flood guard (portfolio_comments_before_insert) is the backstop
    // when the per-IP ledger is bypassed; surface it as a normal rate limit.
    if (/comment_flood/i.test(iErr.message || '')) {
      return json(429, { error: 'Too many comments. Please try again later.' });
    }
    console.error('[submit-comment] insert failed:', iErr.message);
    return json(500, { error: 'Could not save your comment.' });
  }
  return json(200, { ok: true, id: inserted?.id });
});
