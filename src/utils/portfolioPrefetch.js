import { getSupabase } from "../supabase";
import { TABS, tabCacheKey, PROJECTS_CACHE_KEY } from "../services/portfolio";
import { primeImagePipeline } from "./image";

export { PROJECTS_CACHE_KEY };

const TAB_META = TABS;

const CACHE_TTL = 86400000;
const MAX_CACHE_BYTES = 100 * 1024;

const cacheKey = (meta) => tabCacheKey(meta.key);

export function clearStaleCache() {
  try {
    for (const k of ["projects", "public_cv", "dashboard_tech_stacks", "dashboard_tech_stacks_ts", "dashboard_tech_stacks_v2"]) localStorage.removeItem(k);
  } catch { /* best-effort */ }
  try {
    for (const meta of TAB_META) {
      const raw = localStorage.getItem(cacheKey(meta));
      if (raw && raw.length > MAX_CACHE_BYTES) localStorage.removeItem(cacheKey(meta));
    }
  } catch { /* best-effort */ }
}

function isFresh(meta) {
  try {
    const raw = localStorage.getItem(cacheKey(meta));
    if (!raw) return false;
    const p = JSON.parse(raw);
    return !Array.isArray(p) && p.data?.length > 0 && Date.now() - p.timestamp < CACHE_TTL;
  } catch {
    return false;
  }
}

function save(meta, data) {
  if (!data || data.length === 0) return;
  const payload = JSON.stringify({ data, timestamp: Date.now() });
  if (payload.length > MAX_CACHE_BYTES) return;
  for (let i = 0; i < 2; i++) {
    try { localStorage.setItem(cacheKey(meta), payload); return; }
    catch { if (i === 0) TAB_META.forEach((m) => { try { localStorage.removeItem(cacheKey(m)); } catch { /* noop */ } }); }
  }
}

export async function prefetchPortfolioData() {
  const sb = getSupabase();
  if (!sb) return;
  // Parallel with per-table timeout; AbortSignal is actually wired now.
  await Promise.allSettled(
    TAB_META.filter((m) => !isFresh(m)).map(async (meta) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      try {
        let q = sb.from(meta.key).select(meta.select).order(meta.order.field, { ascending: meta.order.asc });
        if (typeof q.abortSignal === 'function') q = q.abortSignal(ctrl.signal);
        const { data, error } = await q;
        if (!error && data) {
          save(meta, data);
          // Prime transform probe with the first project image (off critical path).
          if (meta.key === 'projects' && data[0]?.img) {
            try { primeImagePipeline(data[0].img); } catch { /* best-effort */ }
          }
        }
      } catch (e) {
        if (e?.name !== 'AbortError') console.error(`[prefetch:${meta.key}]`, e?.message || e);
      } finally {
        clearTimeout(timer);
      }
    })
  );
}
