import { getSupabase } from "../supabase";
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
let cleanupFns = [];

export function onPortfolioDataUpdated(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(table) {
  listeners.forEach((cb) => {
    try {
      cb(table);
    } catch (e) {
      console.error(`[realtime] listener for "${table}" failed:`, e);
    }
  });
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

// Only invalidate stale entries on focus — avoids fetch storms that defeat TTL.
function onVisibilityChange() {
  if (document.visibilityState !== "visible") return;
  for (const t of TABLES) {
    if (t.visibility === false) continue;
    try {
      const raw = localStorage.getItem(t.cacheKey);
      if (!raw) invalidate(t.table);
    } catch { /* best-effort */ }
  }
}

function onStorageEvent(e) {
  if (e.key === INVALIDATE_KEY) invalidateAll();
}

export function initRealtimeSync() {
  if (channel) return () => shutdownRealtimeSync();
  const sb = getSupabase();
  if (!sb) {
    console.warn("[realtime] Supabase not configured, skipping.");
    return () => {};
  }
  channel = sb.channel("public:portfolio-sync");
  for (const { table } of TABLES) {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, () => invalidate(table));
  }
  channel.subscribe((status, err) => {
    if (err) console.error("[realtime] subscribe error:", err);
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.error(`[realtime] channel status: ${status}`);
    }
  });
  window.addEventListener("storage", onStorageEvent);
  document.addEventListener("visibilitychange", onVisibilityChange);
  cleanupFns = [
    () => window.removeEventListener("storage", onStorageEvent),
    () => document.removeEventListener("visibilitychange", onVisibilityChange),
  ];
  return () => shutdownRealtimeSync();
}

export function shutdownRealtimeSync() {
  try {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
    if (channel) {
      const sb = getSupabase();
      if (sb) sb.removeChannel(channel);
    }
  } catch { /* best-effort */ }
  channel = null;
}
