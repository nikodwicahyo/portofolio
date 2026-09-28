// Persistent PDF thumbnail store — JPEG blobs in IndexedDB, keyed by source URL.
// Survives reloads (unlike the in-memory Map), so repeat visits skip the pdf.js
// chunk, the PDF download, and the canvas render entirely.
// ponytail: raw IDB, no dep. Every path resolves — unavailable IDB (private
// mode, quota) just degrades to "no cross-session cache".

const DB_NAME = "portfolio_pdf_thumbs";
const STORE = "thumbs";
const MAX_ENTRIES = 60;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") { resolve(null); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

// Out-of-line keys (key = PDF url), records carry { url, blob, ts }.
function run(mode, fn) {
  return openDb().then((db) => new Promise((resolve) => {
    if (!db) { resolve(undefined); return; }
    try {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      const req = fn(store);
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => resolve(undefined);
      tx.onabort = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  }));
}

// -> Blob | null. Never rejects.
export async function getThumb(url) {
  if (!url) return null;
  try {
    const rec = await run("readonly", (store) => store.get(url));
    return rec && rec.blob ? rec.blob : null;
  } catch {
    return null;
  }
}

// Store + trim to MAX_ENTRIES (oldest-ts first) inside one transaction.
// Never rejects.
export async function putThumb(url, blob) {
  if (!url || !blob) return;
  try {
    const db = await openDb();
    if (!db) return;
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        store.put({ url, blob, ts: Date.now() }, url);
        const countReq = store.count();
        countReq.onsuccess = () => {
          if (countReq.result <= MAX_ENTRIES) return;
          const allReq = store.getAll();
          allReq.onsuccess = () => {
            const rows = (allReq.result || []).slice().sort((a, b) => a.ts - b.ts);
            const excess = rows.length - MAX_ENTRIES;
            for (let i = 0; i < excess; i++) store.delete(rows[i].url);
          };
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch { /* best-effort */ }
}
