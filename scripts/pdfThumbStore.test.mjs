// Runnable check for the certificate-thumbnail reliability layer:
//   1. silentWarn refcount (concurrent pdf.js renders must not kill console.warn)
//   2. pdfThumbStore put/get roundtrip, LRU trim, and no-IndexedDB degradation
// Run: npm test   (plain Node, no deps, no network)

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const THUMB_URL = new URL("../src/utils/pdfThumbStore.js", import.meta.url);
const SILENT_URL = new URL("../src/utils/silentWarn.js", import.meta.url);

// Fresh module instance per call (data: URL + nonce bypasses the ESM cache),
// so each phase gets its own module-level dbPromise / refcount state.
let nonce = 0;
const loadFresh = async (url) => {
  const src = await readFile(url, "utf8");
  const code = `${src}\n// nonce ${++nonce}`;
  return import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
};

let passed = 0;
const ok = (name) => { passed += 1; console.log(`ok - ${name}`); };

// ---------- minimal in-memory indexedDB fake (only the subset the store uses) ----------
function installFakeIndexedDB() {
  const stores = new Map();
  const names = new Set();

  const track = (tx, fn) => {
    const req = { result: undefined, onsuccess: null, onerror: null };
    tx.pending += 1;
    queueMicrotask(() => {
      let okResult = true;
      try { req.result = fn(); } catch { okResult = false; }
      try { (okResult ? req.onsuccess : req.onerror)?.({ target: req }); } catch { /* assert below catches */ }
      tx.pending -= 1;
      if (tx.pending === 0 && !tx.finished) {
        tx.finished = true;
        queueMicrotask(() => (okResult ? tx.oncomplete : tx.onabort)?.());
      }
    });
    return req;
  };

  const dataFor = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };

  const transaction = (name) => {
    const tx = { pending: 0, finished: false, oncomplete: null, onerror: null, onabort: null };
    tx.objectStore = () => {
      const data = dataFor(name);
      return {
        get: (k) => track(tx, () => data.get(k)),
        put: (v, k) => track(tx, () => { data.set(k, v); return k; }),
        delete: (k) => track(tx, () => { data.delete(k); return k; }),
        count: () => track(tx, () => data.size),
        getAll: () => track(tx, () => [...data.values()]),
      };
    };
    return tx;
  };

  const db = {
    objectStoreNames: { contains: (n) => names.has(n) },
    createObjectStore: (n) => { names.add(n); dataFor(n); },
    transaction,
  };

  globalThis.indexedDB = {
    open() {
      const req = { result: null, onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null };
      queueMicrotask(() => {
        req.result = db;
        if (!names.has("thumbs")) req.onupgradeneeded?.({ target: req });
        req.onsuccess?.({ target: req });
      });
      return req;
    },
  };

  return { dataFor };
}

// ---------- 1. silentWarn: nested + out-of-order restore ----------
{
  const { silenceWarn } = await loadFresh(SILENT_URL);
  const original = console.warn;
  try {
    const restoreA = silenceWarn();
    assert.notEqual(console.warn, original, "silenced after first call");
    const restoreB = silenceWarn();
    restoreA();
    assert.notEqual(console.warn, original, "still silenced while B holds a reference");
    restoreB();
    assert.equal(console.warn, original, "original restored by last holder");
    restoreB(); // double restore must not go negative or corrupt state
    assert.equal(console.warn, original, "double restore is a no-op");
    const restoreC = silenceWarn();
    restoreC();
    assert.equal(console.warn, original, "subsequent cycle works after double restore");
    ok("silentWarn refcount survives nesting, out-of-order and double restore");
  } finally {
    console.warn = original;
  }
}

// ---------- 2. pdfThumbStore against the fake IDB ----------
const fake = installFakeIndexedDB();
{
  const { getThumb, putThumb } = await loadFresh(THUMB_URL);

  const blob = new Blob(["jpeg-bytes"], { type: "image/jpeg" });
  await putThumb("https://x.test/a.pdf", blob);
  const got = await getThumb("https://x.test/a.pdf");
  assert.ok(got, "roundtrip returns a record");
  assert.equal(got.size, blob.size, "blob survives roundtrip");
  ok("put/get roundtrip");

  assert.equal(await getThumb("https://x.test/missing.pdf"), null, "miss -> null");
  await putThumb("https://x.test/b.pdf", null);   // must never throw
  await putThumb(null, blob);                     // must never throw
  assert.equal(await getThumb(null), null);
  ok("null/miss inputs never throw");

  // LRU trim: MAX_ENTRIES is 60 in pdfThumbStore.js (update here if it changes).
  for (let i = 0; i < 65; i++) {
    await putThumb(`https://x.test/c${i}.pdf`, new Blob([`b${i}`], { type: "image/jpeg" }));
  }
  const data = fake.dataFor("thumbs");
  assert.equal(data.size, 60, "store capped at 60 entries");
  assert.equal(data.has("https://x.test/a.pdf"), false, "oldest entry evicted");
  assert.equal(data.has("https://x.test/c0.pdf"), false, "overflow entries evicted");
  assert.equal(data.has("https://x.test/c64.pdf"), true, "newest entry kept");
  assert.equal(await getThumb("https://x.test/c0.pdf"), null, "evicted entry reads as miss");
  ok("LRU trim caps at 60 and evicts oldest first");
}

// ---------- 3. degradation: no indexedDB at all ----------
delete globalThis.indexedDB;
{
  const { getThumb, putThumb } = await loadFresh(THUMB_URL);
  assert.equal(await getThumb("https://x.test/a.pdf"), null, "get degrades to null");
  await putThumb("https://x.test/a.pdf", new Blob(["x"])); // resolves, never throws
  ok("degrades to no-cache when IndexedDB is unavailable");
}

console.log(`\n${passed} checks passed`);
