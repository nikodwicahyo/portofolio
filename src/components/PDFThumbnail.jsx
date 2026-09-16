import { useState, useEffect, useRef, memo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const thumbnailCache = new Map();
const CACHE_MAX = 20;

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

const renderPDFToDataUrl = async (url) => {
  if (thumbnailCache.has(url)) {
    const val = thumbnailCache.get(url);
    thumbnailCache.delete(url);
    thumbnailCache.set(url, val);
    return val;
  }

    const pdfData = getPDFData(url);
    const warn = console.warn; console.warn = () => {};
    let pdf = null;
    try {
      const loadingTask = pdfjsLib.getDocument({ ...pdfData, verbosity: pdfjsLib.VerbosityLevel.ERRORS });
      pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      // HD: render at ~960px wide (not 1.0 scale) so the stretched thumbnail
      // stays sharp on retina. Capped for perf; result is LRU-cached above.
      // ponytail: one render per URL, no new dep; ceiling = ~3MP canvas encode.
      const baseViewport = page.getViewport({ scale: 1.0 });
      const scale = Math.min(3, 960 / baseViewport.width);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const ctx = canvas.getContext("2d");
      const task = page.render({ canvasContext: ctx, viewport });
      await task.promise;

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    thumbnailCache.set(url, dataUrl);
    if (thumbnailCache.size > CACHE_MAX) {
      const oldest = thumbnailCache.keys().next().value;
      if (oldest) thumbnailCache.delete(oldest);
    }
    return dataUrl;
  } finally {
    try { await pdf?.destroy(); } catch { /* already destroyed */ }
    console.warn = warn;
  }
};

const PDFThumbnail = memo(({ pdfUrl, className = "", style = {} }) => {
  // ponytail: sync cache init — back-switch renders instantly, no observer/pulse.
  const cached = thumbnailCache.get(pdfUrl) ?? null;
  const [thumbnail, setThumbnail] = useState(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(!!cached);
  const ref = useRef(null);

  useEffect(() => {
    const hit = thumbnailCache.get(pdfUrl);
    if (hit) {
      setThumbnail(hit);
      setIsVisible(true);
      return;
    }
    setThumbnail(null);
    setIsVisible(false);

    let observer = null;
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: "200px" }
      );
      if (ref.current) observer.observe(ref.current);
    }, 200);

    return () => { clearTimeout(timer); if (observer) observer.disconnect(); };
  }, [pdfUrl]);

  useEffect(() => {
    if (!isVisible || !pdfUrl) return;
    let cancelled = false;

    setLoading(true);
    setError(false);

    renderPDFToDataUrl(pdfUrl)
      .then((dataUrl) => {
        if (!cancelled) {
          setThumbnail(dataUrl);
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
