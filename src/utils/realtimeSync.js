import { supabase } from "../supabase";
import { PROJECTS_CACHE_KEY } from "./portfolioPrefetch";

const TABLES = [
  { table: "projects", cacheKey: PROJECTS_CACHE_KEY },
  { table: "certificates", cacheKey: "certificates" },
  { table: "experiences", cacheKey: "experiences" },
  { table: "tech_stacks", cacheKey: "tech_stacks" },
  { table: "cv_documents", cacheKey: "public_cv", visibility: false },
];

const INVALIDATE_KEY = "portfolio_cache_invalidate";

const listeners = new Set();
let channel = null;

export function onPortfolioDataUpdated(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(table) {
  listeners.forEach((cb) => cb(table));
}

function invalidate(table) {
  const entry = TABLES.find((t) => t.table === table);
  if (!entry) return;
  try { localStorage.removeItem(entry.cacheKey); } catch { /* best-effort */ }
  notify(table);
}

function invalidateAll() {
  TABLES.forEach((t) => invalidate(t.table));
}

export function notifyPortfolioChanged() {
  try { localStorage.setItem(INVALIDATE_KEY, String(Date.now())); } catch { /* best-effort */ }
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") {
    TABLES.forEach((t) => { if (t.visibility !== false) invalidate(t.table); });
  }
}

export function initRealtimeSync() {
  if (channel) return channel;
  channel = supabase.channel("public:portfolio-sync");
  for (const { table } of TABLES) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, () => invalidate(table));
  }
  channel.subscribe();
  window.addEventListener("storage", (e) => {
    if (e.key === INVALIDATE_KEY) invalidateAll();
  });
  document.addEventListener("visibilitychange", onVisibilityChange);
  return channel;
}
