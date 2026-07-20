import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const thumbnailCache = new Map();

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
    return thumbnailCache.get(url);
  }

  const pdfData = getPDFData(url);
  const loadingTask = pdfjsLib.getDocument(pdfData);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext("2d");
  const task = page.render({ canvasContext: ctx, viewport });
  await task.promise;

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  thumbnailCache.set(url, dataUrl);
  return dataUrl;
};

const PDFThumbnail = ({ pdfUrl, className = "", style = {} }) => {
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (thumbnailCache.has(pdfUrl)) {
      setThumbnail(thumbnailCache.get(pdfUrl));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
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
      <div ref={ref} className={`w-full aspect-[16/11.5] bg-white/5 flex flex-col items-center justify-center gap-1.5 ${className}`} style={style}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <span className="text-xs text-gray-500">Failed to load</span>
      </div>
    );
  }

  return (
    <div ref={ref} className={`w-full aspect-[16/11.5] ${className}`} style={style}>
      {loading || !thumbnail ? (
        <div className="w-full h-full bg-white/5 animate-pulse" />
      ) : (
        <img
          src={thumbnail}
          alt="PDF Thumbnail"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default PDFThumbnail;
