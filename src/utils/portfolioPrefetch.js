import { supabase } from "../supabase";

const TAB_META = [
  { key: 'projects', order: { field: 'id', asc: false }, select: 'id,title,description,img,link' },
  { key: 'certificates', order: { field: 'id', asc: false }, select: 'id,img' },
  { key: 'experiences', order: { field: 'start_date', asc: false }, select: 'id,position,company,logo_url,start_date,end_date,location,description' },
  { key: 'tech_stacks', order: { field: 'display_order', asc: true }, select: 'id,icon,name,display_order' },
];

const CACHE_TTL = 3600000;

function isFresh(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const p = JSON.parse(raw);
    return !Array.isArray(p) && p.data?.length > 0 && Date.now() - p.timestamp < CACHE_TTL;
  } catch {
    return false;
  }
}

function save(key, data) {
  if (data.length === 0) return;
  for (let i = 0; i < 2; i++) {
    try { localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() })); return; }
    catch { if (i === 0) TAB_META.forEach(({ key: k }) => localStorage.removeItem(k)); }
  }
}

export async function prefetchPortfolioData() {
  for (const meta of TAB_META) {
    if (isFresh(meta.key)) continue;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const { data, error } = await supabase
        .from(meta.key)
        .select(meta.select)
        .order(meta.order.field, { ascending: meta.order.asc });
      clearTimeout(timer);
      if (!error && data) save(meta.key, data);
    } catch {
      clearTimeout(timer);
    }
  }
}
