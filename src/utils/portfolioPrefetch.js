import { supabase } from "../supabase";

export const PROJECTS_CACHE_KEY = "projects_v2";

export function clearStaleCache() {
  try {
    for (const k of ["projects", "public_cv", "dashboard_tech_stacks", "dashboard_tech_stacks_ts"]) localStorage.removeItem(k);
  } catch { /* best-effort */ }
  try {
    for (const meta of TAB_META) {
      const raw = localStorage.getItem(cacheKey(meta));
      if (raw && raw.length > MAX_CACHE_BYTES) localStorage.removeItem(cacheKey(meta));
    }
  } catch { /* best-effort */ }
}

const TAB_META = [
  { key: 'projects', order: { field: 'id', asc: false }, select: 'id,title,description,img,link,github,tech_stack,features', storageKey: PROJECTS_CACHE_KEY },
  { key: 'certificates', order: { field: 'id', asc: false }, select: 'id,img' },
  { key: 'experiences', order: { field: 'start_date', asc: false }, select: 'id,position,company,logo_url,start_date,end_date,location,description' },
  { key: 'tech_stacks', order: { field: 'display_order', asc: true }, select: 'id,icon,name,display_order' },
];

const CACHE_TTL = 86400000;
const MAX_CACHE_BYTES = 100 * 1024;

const cacheKey = (meta) => meta.storageKey || meta.key;

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
  if (data.length === 0) return;
  const payload = JSON.stringify({ data, timestamp: Date.now() });
  if (payload.length > MAX_CACHE_BYTES) return;
  for (let i = 0; i < 2; i++) {
    try { localStorage.setItem(cacheKey(meta), payload); return; }
    catch { if (i === 0) TAB_META.forEach((m) => localStorage.removeItem(cacheKey(m))); }
  }
}

export async function prefetchPortfolioData() {
  for (const meta of TAB_META) {
    if (isFresh(meta)) continue;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const { data, error } = await supabase
        .from(meta.key)
        .select(meta.select)
        .order(meta.order.field, { ascending: meta.order.asc });
      clearTimeout(timer);
      if (!error && data) save(meta, data);
    } catch {
      clearTimeout(timer);
    }
  }
}
