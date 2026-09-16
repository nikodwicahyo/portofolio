import { getSupabase } from '../supabase';

// Single source of truth for tab order + queries + cache keys.
// UI index === TABS index — fixes the old TAB_META/UI mismatch.
export const PROJECTS_CACHE_KEY = "projects_v2";
export const TABS = [
  { key: 'experiences', label: 'Experiences', order: { field: 'start_date', asc: false }, select: 'id,position,company,logo_url,start_date,end_date,location,description' },
  { key: 'projects', label: 'Projects', order: { field: 'id', asc: false }, select: 'id,title,description,img,link,github,tech_stack,features', storageKey: PROJECTS_CACHE_KEY },
  { key: 'certificates', label: 'Certificates', order: { field: 'id', asc: false }, select: 'id,img' },
  { key: 'tech_stacks', label: 'Tech Stack', order: { field: 'display_order', asc: true }, select: 'id,icon,name,display_order' },
];

export const tabCacheKey = (key) => TABS.find((t) => t.key === key)?.storageKey || key;

export const tabIndexForKey = (key) => TABS.findIndex((t) => t.key === key);

// Cross-component tab jump: sessionStorage covers remounts, the event covers
// the already-mounted (single-page anchor) case. Same-page, no new dep.
export const PORTFOLIO_TAB_EVENT = 'portfolio:goto-tab';

export function goToPortfolioTab(index) {
  const i = Number(index);
  if (!Number.isInteger(i) || i < 0 || i >= TABS.length) return;
  try { sessionStorage.setItem('portfolioTab', String(i)); } catch { /* best-effort */ }
  try { sessionStorage.setItem('scrollToPortfolio', 'true'); } catch { /* best-effort */ }
  try { window.dispatchEvent(new CustomEvent(PORTFOLIO_TAB_EVENT, { detail: i })); } catch { /* noop */ }
  try {
    const el = document.getElementById('Portofolio');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch { /* best-effort */ }
}

export async function fetchTabData(key, signal) {
  const meta = TABS.find((t) => t.key === key);
  if (!meta) throw new Error(`Unknown tab "${key}"`);
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured.');
  let q = sb.from(key).select(meta.select).order(meta.order.field, { ascending: meta.order.asc });
  if (signal && typeof q.abortSignal === 'function') q = q.abortSignal(signal);
  const { data, error } = await q;
  if (error) throw error;
  if (data === null) throw new Error(`Supabase returned null for "${key}"`);
  return data;
}
