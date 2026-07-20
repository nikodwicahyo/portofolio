import { useState, useEffect, useCallback, useRef } from "react";
import { Modal, IconButton, Box, Backdrop, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import { isBase64DataUrl } from "../utils/fileType";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const base64ToUint8Array = (base64) => {
  const stripped = base64.replace(/\s/g, "");
  const binaryString = atob(stripped);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const PDFViewerModal = ({ pdfUrl, isOpen, onClose, showDownload, filename = "document.pdf", title }) => {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [renderKey, setRenderKey] = useState(0);
  const [zoom, setZoom] = useState(null);
  const [displayZoom, setDisplayZoom] = useState("Fit");
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const zoomRef = useRef(null);
  const fitScaleRef = useRef(1);

  const getEffectiveScale = useCallback((pageWidth, pageHeight, containerWidth, containerHeight) => {
    if (zoomRef.current !== null) return zoomRef.current;
    const fit = Math.min(containerWidth / pageWidth, containerHeight / pageHeight, 2);
    fitScaleRef.current = fit;
    return fit;
  }, []);

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    if (isBase64DataUrl(pdfUrl)) {
      const base64 = pdfUrl.split(",")[1];
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      a.href = URL.createObjectURL(blob);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } else {
      a.href = pdfUrl;
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [pdfUrl, filename]);

  useEffect(() => {
    if (!isOpen || !pdfUrl) return;
    let cancelled = false;
    setLoading(true);
    setCurrentPage(1);
    setNumPages(0);
    pdfRef.current = null;
    zoomRef.current = null;
    setZoom(null);
    setDisplayZoom("Fit");

    const loadPdf = async () => {
      const warn = console.warn; console.warn = () => {};
      try {
        const src = isBase64DataUrl(pdfUrl)
          ? { data: base64ToUint8Array(pdfUrl.split(",")[1]) }
          : { url: pdfUrl };
        const pdf = await pdfjsLib.getDocument({ ...src, verbosity: pdfjsLib.VerbosityLevel.ERRORS }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
      } catch (err) {
        if (!cancelled) console.error("PDF load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
        console.warn = warn;
      }
    };
    loadPdf();
    return () => { cancelled = true; };
  }, [pdfUrl, isOpen]);

  const renderPage = useCallback(async () => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!pdf || !canvas || !container) return;

    if (renderTaskRef.current) {
      try { await renderTaskRef.current.cancel(); } catch {}
    }

    try {
      const page = await pdf.getPage(currentPage);
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const unscaled = page.getViewport({ scale: 1 });
      const effectiveScale = getEffectiveScale(unscaled.width, unscaled.height, containerWidth, containerHeight);
      const viewport = page.getViewport({ scale: effectiveScale });

      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const warn = console.warn; console.warn = () => {};
      renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;
      console.warn = warn;

      const pct = zoomRef.current !== null ? Math.round(effectiveScale * 100) + "%" : "Fit";
      setDisplayZoom(pct);
    } catch (err) {
      if (err?.name !== "RenderingCancelledException") console.error("PDF render failed:", err);
    }
  }, [currentPage, getEffectiveScale]);

  useEffect(() => {
    if (!pdfRef.current || loading) return;
    const timer = setTimeout(renderPage, 0);
    return () => clearTimeout(timer);
  }, [renderPage, loading, renderKey]);

  useEffect(() => {
    if (!isOpen || !pdfRef.current || loading) return;
    const onResize = () => {
      if (zoomRef.current === null) setRenderKey(k => k + 1);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen, loading]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const container = containerRef.current;
    if (!isOpen || !container) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.8 : 1.25;
      const prev = zoomRef.current ?? fitScaleRef.current;
      zoomRef.current = Math.max(0.1, Math.min(10, prev * delta));
      setZoom(zoomRef.current);
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleZoomIn = () => {
    const prev = zoomRef.current ?? fitScaleRef.current;
    zoomRef.current = Math.min(10, prev * 1.25);
    setZoom(zoomRef.current);
  };

  const handleZoomOut = () => {
    const prev = zoomRef.current ?? fitScaleRef.current;
    zoomRef.current = Math.max(0.1, prev / 1.25);
    setZoom(zoomRef.current);
  };

  const handleFit = () => {
    zoomRef.current = null;
    setZoom(null);
    setRenderKey(k => k + 1);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="pdf-viewer-modal-title"
      BackdropComponent={Backdrop}
      slotProps={{
        backdrop: {
          timeout: 300,
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(5px)",
          },
        },
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: 0,
        padding: 0,
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.9)",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "95vw",
          height: "95vh",
          maxWidth: "100%",
          maxHeight: "100%",
          bgcolor: "#1a1a2e",
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            bgcolor: "#0a0a1a",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            shrink: 0,
          }}
        >
          <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }} noWrap>
            {title || "PDF Viewer"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {showDownload && (
              <IconButton
                onClick={handleDownload}
                title="Download PDF"
                sx={{
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                }}
                size="large"
              >
                <DownloadIcon />
              </IconButton>
            )}
            <IconButton
              onClick={onClose}
              sx={{
                color: "white",
                bgcolor: "rgba(255,255,255,0.1)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
              }}
              size="large"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box
          ref={containerRef}
          sx={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#0d0d1a",
            position: "relative",
          }}
        >
          {loading ? (
            <Typography sx={{ color: "gray" }}>Loading PDF...</Typography>
          ) : numPages === 0 ? (
            <Typography sx={{ color: "gray" }}>Failed to load PDF</Typography>
          ) : (
            <canvas ref={canvasRef} style={{ display: "block" }} />
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 1,
            bgcolor: "#0a0a1a",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={handleZoomOut}
              title="Zoom Out"
              sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Typography
              sx={{
                color: "white",
                fontSize: 13,
                minWidth: 40,
                textAlign: "center",
                cursor: "pointer",
                "&:hover": { color: "#a78bfa" },
              }}
              onClick={handleFit}
              title="Fit to page"
            >
              {displayZoom}
            </Typography>
            <IconButton
              size="small"
              onClick={handleZoomIn}
              title="Zoom In"
              sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleFit}
              title="Fit to page"
              sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }, ml: 0.5 }}
            >
              <FitScreenIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              size="small"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              sx={{ color: "white", "&:disabled": { opacity: 0.3 } }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Typography sx={{ color: "white", fontSize: 14 }}>
              {currentPage} / {numPages}
            </Typography>
            <IconButton
              size="small"
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              sx={{ color: "white", "&:disabled": { opacity: 0.3 } }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default PDFViewerModal;
