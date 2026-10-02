// ponytail: stdlib-only HEAD checks on hardcoded https URLs, no new dep.
// Ceiling: static strings only; DB-driven links are validated at runtime by safeExternalUrl.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const EXTRA = [join(ROOT, 'index.html')];

function collect(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) collect(p, out);
    else if (/\.(jsx?|tsx?|html)$/.test(p)) out.push(p);
  }
  return out;
}

const files = [...collect(SRC), ...EXTRA];
const urls = new Set();
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  // Match https://... and https://www... literals; skip template/localhost/supabase placeholders.
  const re = /https:\/\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+/g;
  for (const m of text.match(re) || []) {
    const clean = m.replace(/[)",'`;>\]]+$/, '');
    if (/supabase\.co|example\.com|localhost|vercel\.app$/.test(clean)) {
      // Keep production site URLs, skip env-specific/project URLs.
      if (!/nikodwicahyo\.vercel\.app|github\.com|linkedin\.com|instagram\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|formly\.email/.test(clean)) continue;
    }
    urls.add(clean);
  }
}

if (urls.size === 0) {
  console.log('check-links: no external URLs found.');
  process.exit(0);
}

let failed = 0;
const SKIP_HOST = /^(fonts\.googleapis\.com|fonts\.gstatic\.com)$/; // roots 404 by design; css2 URL is checked
const isPlaceholder = (u) => /username|yourproject|example\.com|\$/.test(u) || /https:\/\/[a-z]$/i.test(u) || u.endsWith('https://.');
const isPostOnly = (u) => /formly\.email\/submit/.test(u);
const isBotWalled = (u) => /linkedin\.com/.test(u); // 999 to bots; verified manually in browser
for (const u of [...urls].sort()) {
  if (isPlaceholder(u)) { console.log(`SKIP placeholder ${u}`); continue; }
  let host = '';
  let isRoot = false;
  try { const parsed = new URL(u); host = parsed.hostname; isRoot = parsed.pathname === '/'; } catch { console.log(`SKIP unparsable ${u}`); continue; }
  if (SKIP_HOST.test(host) && isRoot) { console.log(`SKIP infra-root ${u}`); continue; }
  if (isPostOnly(u)) {
    // POST-only endpoint: verify host is reachable instead of GETting the action.
    try {
      const host = new URL(u).origin;
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(host, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal });
      clearTimeout(t);
      console.log(`OK (host) ${u}`);
    } catch (e) { console.error(`BROKEN host ${u}: ${e?.message || e}`); failed++; }
    continue;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) {
      // Some hosts reject HEAD — retry GET once before failing.
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 15000);
      const res2 = await fetch(u, { method: 'GET', redirect: 'follow', signal: ctrl2.signal });
      clearTimeout(t2);
      if (!res2.ok) {
        if (isBotWalled(u)) { console.log(`WARN bot-walled ${res2.status} ${u}`); continue; }
        console.error(`BROKEN ${res2.status} ${u}`); failed++; continue;
      }
    }
    console.log(`OK ${u}`);
  } catch (e) {
    if (isBotWalled(u)) { console.log(`WARN bot-walled (fetch failed) ${u}`); continue; }
    console.error(`BROKEN (fetch failed) ${u}: ${e?.message || e}`);
    failed++;
  }
}
if (failed > 0) { console.error(`check-links: ${failed} broken link(s).`); process.exit(1); }
console.log(`check-links: ${urls.size} link(s) OK.`);
