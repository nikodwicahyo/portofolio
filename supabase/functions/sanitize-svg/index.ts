// Edge Function: sanitize-svg — admin-only SVG intake with server-side sanitization.
// Raw SVG uploads to public buckets are forbidden; dashboard sends SVGs here.
// Deploy: supabase functions deploy sanitize-svg
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const MAX_SVG_BYTES = 512 * 1024;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Deterministic sanitizer for icon-style SVGs. Anything structural outside
// this allowlist is stripped; if scriptable content survives, reject.
function sanitizeSvg(raw: string): string | null {
  let s = raw;
  // Drop XML processing instructions except a leading <?xml ...?> prolog.
  s = s.replace(/<\?(?!xml\b)[\s\S]*?\?>/gi, '');
  // Drop DOCTYPE entirely (no entities / external DTD → no XXE/billion-laughs).
  s = s.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  // Drop HTML comment conditional / all comments (hides payloads).
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  // Drop script blocks and foreignObject (HTML embedding).
  s = s.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  s = s.replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '');
  s = s.replace(/<(handler|listener|set|animate)[\s>][\s\S]*?(<\/\1\s*>|\/>)/gi, '');
  // Drop event-handler attributes (onload, onclick, ...). [\s/] covers
  // <svg onload=...> and <svg/onload=...> spellings.
  s = s.replace(/[\s/]on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // Neutralize javascript:/data:text/html hrefs (keep #fragment + https).
  s = s.replace(/\s+(xlink:)?href\s*=\s*("|\')\s*javascript:[^"\']*("|\')/gi, ' href="#removed"');
  s = s.replace(/\s+(xlink:)?href\s*=\s*("|\')\s*data:text\/html[^"\']*("|\')/gi, ' href="#removed"');
  // Final gate: nothing executable may remain.
  const bad =
    /<script|on\w+\s*=|foreignObject|<!ENTITY|javascript:|data:text\/html|data:image\/svg|vbscript:/i.test(s);
  if (bad) return null;
  if (!/<svg[\s>]/i.test(s)) return null;
  return s;
}

function storageKey(): string {
  const rand = crypto.randomUUID();
  return `tech-${Date.now()}-${rand}.svg`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = createClient(url, anon);
  const admin = createClient(url, service);

  // 1. caller must be signed in ...
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'Sign in required.' });
  const { data: { user }, error: uErr } = await auth.auth.getUser(token);
  if (uErr || !user) return json(401, { error: 'Invalid session.' });

  // 2. ... and an admin (server-side check, not client role).
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') return json(403, { error: 'Admin only.' });

  // 3. parse + validate file.
  let file: File | null = null;
  try {
    const form = await req.formData();
    const v = form.get('file');
    if (v instanceof File) file = v;
  } catch {
    return json(400, { error: 'Invalid multipart body.' });
  }
  if (!file) return json(400, { error: 'No file provided.' });
  if (file.size > MAX_SVG_BYTES) return json(400, { error: 'SVG too large (max 500KB).' });
  const name = file.name || '';
  if (file.type !== 'image/svg+xml' && !/\.svg$/i.test(name)) {
    return json(400, { error: 'Only SVG files are accepted here.' });
  }

  // 4. sanitize.
  let text: string;
  try {
    text = await file.text();
  } catch {
    return json(400, { error: 'Could not read file.' });
  }
  if (text.length > MAX_SVG_BYTES * 2) return json(400, { error: 'SVG too large.' });
  const clean = sanitizeSvg(text);
  if (!clean) return json(400, { error: 'SVG rejected: executable content detected.' });

  // 5. store sanitized bytes, never the original.
  const key = storageKey();
  const { error: upErr } = await admin.storage
    .from('svg-assets')
    .upload(key, new Blob([clean], { type: 'image/svg+xml' }), {
      contentType: 'image/svg+xml',
      upsert: false,
    });
  if (upErr) {
    console.error('[sanitize-svg] upload failed:', upErr.message);
    return json(500, { error: 'Could not store sanitized SVG.' });
  }
  const { data } = admin.storage.from('svg-assets').getPublicUrl(key);
  return json(200, { ok: true, publicUrl: data.publicUrl });
});
