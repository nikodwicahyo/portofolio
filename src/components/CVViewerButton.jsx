import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { FileText, Loader2 } from "lucide-react";
import PDFViewerModal from "./PDFViewerModal";

const CVViewerButton = () => {
  const [cv, setCv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openPdf, setOpenPdf] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = localStorage.getItem("public_cv");
    if (cached) {
      try { const p = JSON.parse(cached); if (Date.now() - p.ts < 86400000) { setCv(p.data || null); setLoading(false); return; } } catch {}
    }
    const fetchCV = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("cv_documents")
        .select("id,file_data,filename,created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setCv(data || null);
        setLoading(false);
        if (data) {
          try { localStorage.setItem("public_cv", JSON.stringify({ data, ts: Date.now() })); } catch {}
        }
      }
    };
    fetchCV();
    return () => { cancelled = true; };
  }, []);

  const handleView = () => {
    if (cv?.file_data) {
      setOpenPdf(true);
    }
  };

  const disabled = loading || !cv?.file_data;

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
        {loading ? "Loading..." : cv?.file_data ? "View My CV" : "No CV Available"}
      </button>

      <PDFViewerModal
        pdfUrl={cv?.file_data}
        isOpen={openPdf}
        onClose={() => setOpenPdf(false)}
        showDownload
        filename={cv?.filename || "CV.pdf"}
        title={cv?.filename || "CV Document"}
      />
    </>
  );
};

export default CVViewerButton;
