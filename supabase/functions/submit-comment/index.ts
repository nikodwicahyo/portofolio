// Edge Function: submit-comment — rate-limited public comment intake.
// Deploy: supabase functions deploy submit-comment
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (set automatically).
// Client: src/utils/submitComment.js (falls back to direct insert if 404).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const WINDOW_SECONDS = 30; // 1 comment per IP per 30s
const HOURLY_LIMIT = 20; // max 20 comments per IP per hour
const MAX_NAME = 15;
const MAX_BODY = 200;

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' });

  let payload: { userName?: unknown; content?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON.' });
  }
  const name = String(payload.userName ?? '').trim();
  const body = String(payload.content ?? '').trim();
  if (!name || !body) return json(400, { error: 'Name and comment are required.' });
  if (name.length > MAX_NAME) return json(400, { error: `Name too long (max ${MAX_NAME}).` });
  if (body.length > MAX_BODY) return json(400, { error: `Comment too long (max ${MAX_BODY}).` });

  const fwd = req.headers.get('x-forwarded-for') || '';
  const ip = fwd.split(',')[0].trim() || 'unknown';
  const ipHash = await sha256Hex(`comment-v1::${ip}`);

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

  const { data: inserted, error: iErr } = await sb
    .from('portfolio_comments')
    .insert({ user_name: name, content: body, is_pinned: false })
    .select('id')
    .single();
  if (iErr) {
    console.error('[submit-comment] insert failed:', iErr.message);
    return json(500, { error: 'Could not save your comment.' });
  }
  await sb.from('comment_rate_limits').insert({ ip_hash: ipHash });
  return json(200, { ok: true, id: inserted?.id });
});
