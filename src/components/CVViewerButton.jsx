import { useState, useEffect, lazy, Suspense } from "react";
import { trackEvent } from "../utils/analytics";
import { FileText, Loader2 } from "lucide-react";
import useInView from "../hooks/useInView";

// Supabase and the realtime listener are imported on demand so neither lands in
// the landing chunk; the section renders from cache first anyway.

// Split pdf.js out of the landing chunk: viewer loads only when opened.
const PDFViewerModal = lazy(() => import("./PDFViewerModal"));

const CV_CACHE_KEY = "public_cv";
const CV_TTL = 86400000;

const readCvCache = () => {
  try {
    const raw = localStorage.getItem(CV_CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !p.id) return null;
    if (p.timestamp && Date.now() - p.timestamp > CV_TTL) return null;
    return p;
  } catch { return null; }
};

const CVViewerButton = () => {
  const [inViewRef, inView] = useInView();
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openPdf, setOpenPdf] = useState(false);

  useEffect(() => {
    if (!inView) return undefined;
    let cancelled = false;
    setLoading(true);

    const applyCv = (data) => {
      if (cancelled) return;
      setCv(data || null);
      setLoading(false);
    };

    const fetchCVMeta = async () => {
      setLoading(true);
      try {
        const { getSupabase } = await import("../supabase");
        const sb = getSupabase();
        if (!sb) { applyCv(null); return; }
        const { data } = await sb
          .from("cv_documents")
          .select("id,filename,created_at,updated_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          try { localStorage.setItem(CV_CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() })); } catch { /* storage full */ }
        }
        applyCv(data || null);
      } catch {
        applyCv(readCvCache());
      }
    };

    const cached = readCvCache();
    if (cached) {
      applyCv(cached);
    } else {
      fetchCVMeta();
    }
    let unsub;
    import("../utils/realtimeSync")
      .then(({ onPortfolioDataUpdated }) => {
        if (cancelled) return;
        unsub = onPortfolioDataUpdated((table) => {
          if (table === "cv_documents") {
            try { localStorage.removeItem(CV_CACHE_KEY); } catch { /* noop */ }
            fetchCVMeta();
          }
        });
      })
      .catch(() => {});
    return () => { cancelled = true; unsub?.(); };
  }, [inView]);

  const handleView = async () => {
    if (cv?.file_data) {
      setOpenPdf(true);
      trackEvent('cv_view');
      return;
    }
    // ponytail: lazy full fetch only on click; metadata cache keeps mount free
    if (cv?.id) {
      setLoading(true);
      try {
        const { getSupabase } = await import("../supabase");
        const sb = getSupabase();
        if (sb) {
          const { data } = await sb.from("cv_documents").select("id,file_data,filename,created_at").eq("id", cv.id).maybeSingle();
          if (data?.file_data) {
            setCv(data);
            setLoading(false);
            setOpenPdf(true);
            trackEvent('cv_view');
            return;
          }
        }
      } catch { /* keep the button disabled instead of throwing */ }
      setLoading(false);
    }
  };

  const hasCv = Boolean(cv?.file_data || cv?.id);
  const disabled = loading || !hasCv;

  return (
    <>
      <button
        ref={inViewRef}
        onClick={handleView}
        disabled={disabled}
        data-aos="fade-up"
        data-aos-duration="800"
        className="w-full lg:w-auto sm:px-6 py-2 sm:py-3 rounded-lg bg-invert text-invert-text font-medium transition-all duration-300 hover:bg-invert-hover flex items-center justify-center lg:justify-start gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-invert"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
        {loading ? "Loading..." : hasCv ? "View My CV" : "No CV Available"}
      </button>

      {openPdf && (
        <Suspense fallback={null}>
          <PDFViewerModal
            pdfUrl={cv?.file_data}
            isOpen={openPdf}
            onClose={() => setOpenPdf(false)}
            showDownload
            filename={cv?.filename || "CV.pdf"}
            title={cv?.filename || "CV Document"}
          />
        </Suspense>
      )}
    </>
  );
};

export default CVViewerButton;
