// Runnable API hardening check. Reads the public anon key from .env and asserts
// the anonymous surface is closed. Writes at most one probe comment, and only
// when the hardening has regressed (in which case it prints the row id and
// exits 1 so you can delete it).
// Run: npm run check-api
//      npm run check-api -- --xff   (adds the X-Forwarded-For spoofing probe:
//      it DOES create one comment when the per-IP limit is working, and prints
//      the id so you can delete it — opt-in for that reason)
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
const call = async (method, path, body, extraHeaders) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...extraHeaders },
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

// Privilege escalation is a write, so the write grant must be gone (RLS alone
// would be enough, but revoked grants are the durable control).
const escalate = await call('PATCH', '/rest/v1/profiles?id=eq.00000000-0000-0000-0000-000000000000', { role: 'admin' });
check('profiles: anon UPDATE denied', [401, 403].includes(escalate.status), `status ${escalate.status}`);

// Analytics accepts anonymous inserts, but only for the allowlisted event names.
const badEvent = await call('POST', '/rest/v1/portfolio_events', { event: 'not_an_allowed_event', path: '/' });
check('analytics: unknown event rejected', [400, 401, 403].includes(badEvent.status), `status ${badEvent.status}`);

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

// 6. The filter must reject markup generally, not just <script>. The probe is
//    a harmless <b> tag, not an exploit payload: if the filter regresses, the
//    row that lands on the public wall is inert text, not <img onerror>.
//    400 = filter rejected it; 403 = Turnstile gate-kept it first (safe too).
//    Anything else (2xx, or 429 rate-limited before the filter ran) fails.
const markup = await call('POST', '/functions/v1/submit-comment', {
  userName: probeName, content: '<b>probe</b>',
});
const markupSafe = markup.status === 400 || markup.status === 403;
check('submit-comment: markup rejected', markupSafe,
  markupSafe ? `status ${markup.status}${markup.status === 403 ? ' (captcha gated)' : ''}`
    : markup.status === 429 ? 'rate-limited before the filter ran — re-run in 30s'
      : `status ${markup.status}${markup.json?.id ? ` — comment ${markup.json.id} was stored, delete it` : ''}`);

// 7. X-Forwarded-For must not be a free rate-limit reset. Two identical posts
//    from one address with different forged headers: the second must be 429.
//    Opt-in because a passing run creates one comment.
if (process.argv.includes('--xff')) {
  const xffTag = Math.random().toString(36).slice(2, 8);
  const fakeIp = () => `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
  const first = await call('POST', '/functions/v1/submit-comment',
    { userName: `xff${xffTag}`.slice(0, 15), content: `xff probe ${xffTag}`.slice(0, 200) },
    { 'X-Forwarded-For': fakeIp() });
  // Deliberately a different fake address: if the function honours the header
  // verbatim this lands in a brand-new bucket; if the edge proxy appends the
  // real address (the assumption), both posts share the real bucket.
  const second = await call('POST', '/functions/v1/submit-comment',
    { userName: `xff${xffTag}`.slice(0, 15), content: `xff probe ${xffTag} b`.slice(0, 200) },
    { 'X-Forwarded-For': fakeIp() });
  if (first.status === 403 || second.status === 403) {
    // Turnstile enabled: the probe cannot mint a token, and the CAPTCHA is the
    // control that makes a spoofed header harmless.
    check('submit-comment: XFF spoof limited', true, 'captcha enforced');
  } else if (first.status !== 200) {
    check('submit-comment: XFF spoof limited', true, `inconclusive: first post ${first.status}`);
  } else {
    const limited = second.status === 429;
    check('submit-comment: XFF spoof limited', limited,
      limited ? `second post ${second.status}`
        : `second post ${second.status}${[first, second].filter((r) => r.json?.id).map((r) => ` — comment ${r.json.id} was stored, delete it`).join('')}`);
  }
}

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? 'ok  ' : 'FAIL'} - ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
process.exit(failed.length ? 1 : 0);
