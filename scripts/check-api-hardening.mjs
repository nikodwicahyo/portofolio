// Runnable API hardening check. Reads the public anon key from .env and asserts
// the anonymous surface is closed. Writes at most one probe comment, and only
// when the hardening has regressed (in which case it prints the row id and
// exits 1 so you can delete it).
// Run: npm run check-api
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const BASE = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const KEY = env.VITE_SUPABASE_ANON_KEY;
if (!BASE || !KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const results = [];
const call = async (method, path, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
};

const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
};

// 1. Direct comment insert must be rejected by grant/RLS (401/403) or a
//    constraint (400). A 2xx means the write path reopened.
const probeName = `selftest${Date.now().toString(36).slice(-4)}`;
const probe = await call('POST', '/rest/v1/portfolio_comments', {
  user_name: probeName, content: 'hardening check', is_pinned: false,
});
const probeDenied = [400, 401, 403].includes(probe.status);
check('comments: anon INSERT denied', probeDenied,
  probeDenied ? `status ${probe.status}`
    : `status ${probe.status}${probe.json?.id ? ` — row ${probe.json.id} was created, delete it` : ''}`);

// 2. Internal tables must not be readable.
const limits = await call('GET', '/rest/v1/comment_rate_limits?select=*&limit=1');
check('comment_rate_limits: denied', [401, 403].includes(limits.status), `status ${limits.status}`);

const profiles = await call('GET', '/rest/v1/profiles?select=role&limit=1');
check('profiles: no rows for anon', [401, 403].includes(profiles.status) || (Array.isArray(profiles.json) && profiles.json.length === 0),
  `status ${profiles.status}, rows ${Array.isArray(profiles.json) ? profiles.json.length : '?'}`);

// 3. Storage listing must be closed, but public files must still load.
const list = await call('POST', '/storage/v1/object/list/cv-documents', { prefix: '', limit: 1 });
check('storage: anon list denied', [401, 403].includes(list.status) || (Array.isArray(list.json) && list.json.length === 0),
  `status ${list.status}, items ${Array.isArray(list.json) ? list.json.length : '?'}`);

const cv = await call('GET', '/rest/v1/cv_documents?select=file_data&limit=1');
const publicUrl = Array.isArray(cv.json) ? cv.json[0]?.file_data : null;
if (publicUrl && /^https?:/.test(publicUrl)) {
  let ok = false;
  try { ok = (await fetch(publicUrl)).ok; } catch { /* network */ }
  check('storage: public file still served', ok, publicUrl.replace(/\/[^/]+$/, '/…'));
}

// 4. Signups closed (hosted toggle, not SQL).
const settings = await fetch(`${BASE}/auth/v1/settings`, { headers: { apikey: KEY } })
  .then((r) => r.json()).catch(() => null);
check('auth: signups disabled', settings?.disable_signup === true,
  settings ? `disable_signup=${settings.disable_signup}` : 'unreachable');

// 5. Comment intake function is deployed.
const fn = await call('GET', '/functions/v1/submit-comment');
check('edge fn deployed', fn.status === 405, `status ${fn.status}`);

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? 'ok  ' : 'FAIL'} - ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
process.exit(failed.length ? 1 : 0);
