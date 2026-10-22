// Runnable check that prefetchPortfolioData coalesces concurrent calls.
// Regression it guards: App fired prefetch from two effects, and isFresh() only
// sees persisted cache, so a cold visit issued every table query twice.
// Run: npm test   (plain Node, no deps, no network)
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const src = await readFile(new URL("../src/utils/portfolioPrefetch.js", import.meta.url), "utf8");
// Imports stripped; the stubs below stand in for supabase/portfolio/image.
const body = src.split(/\r?\n/).filter((l) => !l.startsWith("import ")).join("\n");

const stubs = `
const PROJECTS_CACHE_KEY = "projects_v2";
const TABS = ["experiences", "projects", "certificates", "tech_stacks"]
  .map((key) => ({ key, select: "id,img", order: { field: "id", asc: false } }));
const tabCacheKey = (k) => TABS.find((t) => t.key === k)?.storageKey || k;
const primeImagePipeline = () => {};
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
let calls = 0;
const getSupabase = () => ({
  from: (key) => ({
    select: () => ({
      order: () => {
        calls++;
        return new Promise((r) => setTimeout(() => r({ data: [{ id: 1, img: key }], error: null }), 20));
      },
    }),
  }),
});
globalThis.__calls = () => calls;
globalThis.__store = store;
`;

const mod = await import(
  "data:text/javascript;base64," + Buffer.from(stubs + body).toString("base64")
);

await Promise.all([mod.prefetchPortfolioData(), mod.prefetchPortfolioData()]);
assert.equal(globalThis.__calls(), 4, "two concurrent prefetches must issue one query per table");

// Tables are now cached (isFresh) — a third call is a no-op, not a leak of the guard.
await mod.prefetchPortfolioData();
assert.equal(globalThis.__calls(), 4, "fresh cache must prevent refetch");

// Guard resets after settling: clearing cache refetches.
globalThis.__store.clear();
await mod.prefetchPortfolioData();
assert.equal(globalThis.__calls(), 8, "inflight guard must reset once the request settles");

console.log("ok - prefetch dedupe: 2 concurrent calls => 4 queries, resets after settle");
