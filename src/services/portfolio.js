import { getSupabase } from '../supabase';
import { PROJECTS_CACHE_KEY } from '../utils/portfolioPrefetch';

// Single source of truth for tab order + queries.
// UI index === TABS index — fixes the old TAB_META/UI mismatch.
export const TABS = [
  { key: 'experiences', label: 'Experiences', order: { field: 'start_date', asc: false }, select: 'id,position,company,logo_url,start_date,end_date,location,description' },
  { key: 'projects', label: 'Projects', order: { field: 'id', asc: false }, select: 'id,title,description,img,link,github,tech_stack,features', storageKey: PROJECTS_CACHE_KEY },
  { key: 'certificates', label: 'Certificates', order: { field: 'id', asc: false }, select: 'id,img' },
  { key: 'tech_stacks', label: 'Tech Stack', order: { field: 'display_order', asc: true }, select: 'id,icon,name,display_order' },
];

export const tabCacheKey = (key) => TABS.find((t) => t.key === key)?.storageKey || key;

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
