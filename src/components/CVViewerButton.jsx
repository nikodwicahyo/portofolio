import { useState, useEffect, lazy, Suspense } from "react";
import { getSupabase } from "../supabase";
import { onPortfolioDataUpdated } from "../utils/realtimeSync";
import { FileText, Loader2 } from "lucide-react";

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
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openPdf, setOpenPdf] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const applyCv = (data) => {
      if (cancelled) return;
      setCv(data || null);
      setLoading(false);
    };

    const fetchCVMeta = async () => {
      setLoading(true);
      const sb = getSupabase();
      if (!sb) { applyCv(null); return; }
      const { data } = await sb
        .from("cv_documents")
        .select("id,filename,created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        try { localStorage.setItem(CV_CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() })); } catch { /* storage full */ }
      }
      applyCv(data || null);
    };

    const cached = readCvCache();
    if (cached) {
      applyCv(cached);
    } else {
      fetchCVMeta();
    }
    const unsub = onPortfolioDataUpdated((table) => {
      if (table === "cv_documents") {
        try { localStorage.removeItem(CV_CACHE_KEY); } catch { /* noop */ }
        fetchCVMeta();
      }
    });
    return () => { cancelled = true; unsub(); };
  }, []);

  const handleView = async () => {
    if (cv?.file_data) {
      setOpenPdf(true);
      return;
    }
    // ponytail: lazy full fetch only on click; metadata cache keeps mount free
    if (cv?.id) {
      setLoading(true);
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb.from("cv_documents").select("id,file_data,filename,created_at").eq("id", cv.id).maybeSingle();
        if (data?.file_data) {
          setCv(data);
          setLoading(false);
          setOpenPdf(true);
          return;
        }
      }
      setLoading(false);
    }
  };

  const hasCv = Boolean(cv?.file_data || cv?.id);
  const disabled = loading || !hasCv;

  return (
    <>
      <button
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
