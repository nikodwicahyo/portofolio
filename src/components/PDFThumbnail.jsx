import { useState, useEffect, useRef, memo } from "react";
import { preconnectSupabase } from "../utils/image";
import { getThumb, putThumb } from "../utils/pdfThumbStore";
import { silenceWarn } from "../utils/silentWarn";

// ponytail: pdf.js loads dynamically — a cache-hit visit never downloads the
// ~400KB main chunk or the ~1.2MB worker at all. Shared async chunk with
// PDFViewerModal (both import("pdfjs-dist")).
let pdfjsPromise = null;
const loadPdfjs = () => {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ])
      .then(([pdfjs, worker]) => {
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        return pdfjs;
      })
      .catch((err) => {
        pdfjsPromise = null;
        throw err;
      });
  }
  return pdfjsPromise;
};

// url -> object URL, session-lifetime LRU. IndexedDB covers cross-session.
const thumbUrls = new Map();
const CACHE_MAX = 20;
// url -> in-flight promise: concurrent mounts of one PDF share one render.
const inflight = new Map();

const touch = (url) => {
  const v = thumbUrls.get(url);
  thumbUrls.delete(url);
  thumbUrls.set(url, v);
};

const remember = (url, objUrl) => {
  thumbUrls.set(url, objUrl);
  if (thumbUrls.size > CACHE_MAX) {
    const oldest = thumbUrls.keys().next().value;
    if (oldest) {
      const revoked = thumbUrls.get(oldest);
      thumbUrls.delete(oldest);
      try { URL.revokeObjectURL(revoked); } catch { /* noop */ }
    }
  }
};

const base64ToUint8Array = (base64) => {
  const stripped = base64.replace(/\s/g, "");
  const binaryString = atob(stripped);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const getPDFData = (pdfUrl) => {
  if (pdfUrl.startsWith("data:application/pdf;base64,")) {
    const base64 = pdfUrl.split(",")[1];
    return { data: base64ToUint8Array(base64) };
  }
  return { url: pdfUrl };
};

const renderPdfBlob = async (pdfUrl) => {
  const pdfjsLib = await loadPdfjs();
  const pdfData = getPDFData(pdfUrl);
  const restoreWarn = silenceWarn();
  let pdf = null;
  try {
    const loadingTask = pdfjsLib.getDocument({ ...pdfData, verbosity: pdfjsLib.VerbosityLevel.ERRORS });
    pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    // HD: render at ~960px wide (not 1.0 scale) so the stretched thumbnail
    // stays sharp on retina. Capped for perf; results live in IndexedDB.
    // ponytail: one render per URL, no new dep; ceiling = ~3MP canvas encode.
    const baseViewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min(3, 960 / baseViewport.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;

    // toBlob encodes off the base64 string path: smaller memory, no giant
    // data: URLs held in the cache, blob goes straight into IndexedDB.
    const blob = await new Promise((resolve) => {
      try { canvas.toBlob(resolve, "image/jpeg", 0.85); } catch { resolve(null); }
    });
    if (!blob || blob.size === 0) throw new Error("PDF thumbnail encode failed");
    return blob;
  } finally {
    try { await pdf?.destroy(); } catch { /* already destroyed */ }
    restoreWarn();
  }
};

const ensureThumbUrl = (pdfUrl) => {
  const hit = thumbUrls.get(pdfUrl);
  if (hit) { touch(pdfUrl); return Promise.resolve(hit); }
  const pending = inflight.get(pdfUrl);
  if (pending) return pending;

  const p = (async () => {
    // First cert can be PDF-only — no LazyImage mounts, so preconnect here.
    preconnectSupabase(pdfUrl);
    let blob = await getThumb(pdfUrl); // null on miss or IDB unavailability
    if (!blob) {
      blob = await renderPdfBlob(pdfUrl);
      putThumb(pdfUrl, blob); // fire-and-forget; never blocks paint
    }
    const objUrl = URL.createObjectURL(blob);
    remember(pdfUrl, objUrl);
    return objUrl;
  })();
  inflight.set(pdfUrl, p);
  const done = () => inflight.delete(pdfUrl);
  p.then(done, done);
  return p;
};

const PDFThumbnail = memo(({ pdfUrl, className = "", style = {} }) => {
  // ponytail: sync cache init — back-switch renders instantly, no observer/pulse.
  const cached = thumbUrls.get(pdfUrl) ?? null;
  const [thumbnail, setThumbnail] = useState(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(!!cached);
  const ref = useRef(null);

  useEffect(() => {
    const hit = thumbUrls.get(pdfUrl);
    if (hit) {
      touch(pdfUrl);
      setThumbnail(hit);
      setIsVisible(true);
      return;
    }
    setThumbnail(null);
    setIsVisible(false);

    // Observe immediately — the old 200ms delay only slowed first paint.
    let observer = null;
    if (typeof IntersectionObserver !== "undefined" && ref.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: "200px" }
      );
      observer.observe(ref.current);
    } else {
      setIsVisible(true); // no observer support → just render
    }
    return () => { if (observer) observer.disconnect(); };
  }, [pdfUrl]);

  useEffect(() => {
    if (!isVisible || !pdfUrl) return;
    let cancelled = false;

    setLoading(true);
    setError(false);

    ensureThumbUrl(pdfUrl)
      .then((objUrl) => {
        if (!cancelled) {
          setThumbnail(objUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("PDFThumbnail error:", err);
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isVisible, pdfUrl]);

  if (error) {
    return (
      <div ref={ref} className={`w-full aspect-[16/11.5] bg-soft flex flex-col items-center justify-center gap-1.5 ${className}`} style={style}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <span className="text-xs text-muted">Failed to load</span>
      </div>
    );
  }

  return (
    <div ref={ref} className={`w-full aspect-[16/11.5] ${className}`} style={style}>
      {loading || !thumbnail ? (
        <div className="w-full h-full bg-soft animate-pulse" />
      ) : (
        <img
          src={thumbnail}
          alt="PDF Thumbnail"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
});

PDFThumbnail.displayName = "PDFThumbnail";

export default PDFThumbnail;
