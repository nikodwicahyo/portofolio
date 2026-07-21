import { useState, useEffect, useCallback, useRef } from "react";
import { Modal, IconButton, Box, Backdrop, Typography, Menu, MenuItem } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { isBase64DataUrl } from "../utils/fileType";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const ZOOM_PRESETS = [
  { label: "Fit to page", value: null },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1 },
  { label: "125%", value: 1.25 },
  { label: "150%", value: 1.5 },
  { label: "200%", value: 2 },
];

const base64ToUint8Array = (base64) => {
  const stripped = base64.replace(/\s/g, "");
  const binaryString = atob(stripped);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const PDFViewerModal = ({ pdfUrl, isOpen, onClose, showDownload, filename = "document.pdf", title }) => {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [displayZoom, setDisplayZoom] = useState("Fit");
  const [anchorEl, setAnchorEl] = useState(null);
  const canvasRef = useRef(null);
  const pdfRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const fitScaleRef = useRef(1);

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    if (isBase64DataUrl(pdfUrl)) {
      const base64 = pdfUrl.split(",")[1];
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
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
    setZoom(null);
    setRotation(0);
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
      const unscaled = page.getViewport({ scale: 1, rotation });
      const fitScale = Math.min(containerWidth / unscaled.width, containerHeight / unscaled.height, 5);
      fitScaleRef.current = fitScale;
      const effectiveScale = zoom !== null ? zoom : fitScale;
      const viewport = page.getViewport({ scale: effectiveScale, rotation });

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

      setDisplayZoom(zoom !== null ? Math.round(effectiveScale * 100) + "%" : "Fit");
    } catch (err) {
      if (err?.name !== "RenderingCancelledException") console.error("PDF render failed:", err);
    }
  }, [currentPage, zoom, rotation]);

  useEffect(() => {
    if (!pdfRef.current || loading) return;
    const timer = setTimeout(renderPage, 0);
    return () => clearTimeout(timer);
  }, [renderPage, loading]);

  useEffect(() => {
    if (!isOpen || !pdfRef.current || loading) return;
    const onResize = () => { if (zoom === null) renderPage(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen, loading, zoom, renderPage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!isOpen || !container) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(prev => {
        const base = prev ?? fitScaleRef.current;
        return Math.max(0.1, Math.min(10, base * (e.deltaY > 0 ? 0.8 : 1.25)));
      });
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "=" || e.key === "+") { e.preventDefault(); handleZoomIn(); return; }
      if (e.key === "-") { e.preventDefault(); handleZoomOut(); return; }
      if (e.key === "0" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setZoom(null); return; }
      if (e.key === "r" || e.key === "R") { setRotation(r => (r + 90) % 360); return; }
      if (e.key === "ArrowLeft") { setCurrentPage(p => Math.max(1, p - 1)); return; }
      if (e.key === "ArrowRight") { setCurrentPage(p => Math.min(numPages, p + 1)); return; }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, numPages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleZoomIn = () => setZoom(prev => {
    const base = prev ?? fitScaleRef.current;
    return Math.min(10, base * 1.25);
  });

  const handleZoomOut = () => setZoom(prev => {
    const base = prev ?? fitScaleRef.current;
    return Math.max(0.1, base / 1.25);
  });

  const handleZoomPreset = (value) => {
    setZoom(value);
    setAnchorEl(null);
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
          sx: { backgroundColor: "rgba(0, 0, 0, 0.9)", backdropFilter: "blur(5px)" },
        },
      }}
      sx={{
        display: "flex", alignItems: "center", justifyContent: "center", margin: 0, padding: 0,
        "& .MuiBackdrop-root": { backgroundColor: "rgba(0, 0, 0, 0.9)" },
      }}
    >
      <Box
        sx={{
          position: "relative", width: "95vw", height: "95vh", maxWidth: "100%", maxHeight: "100%",
          bgcolor: "#1a1a2e", borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            px: 3, py: 2, bgcolor: "#0a0a1a",
            borderBottom: "1px solid rgba(255,255,255,0.1)", shrink: 0,
          }}
        >
          <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }} noWrap>
            {title || "PDF Viewer"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {showDownload && (
              <IconButton onClick={handleDownload} title="Download PDF"
                sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }} size="large"
              ><DownloadIcon /></IconButton>
            )}
            <IconButton onClick={onClose}
              sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }} size="large"
            ><CloseIcon /></IconButton>
          </Box>
        </Box>

        <Box
          ref={containerRef}
          sx={{
            flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: "#0d0d1a", position: "relative",
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
            display: "flex", alignItems: "center", justifyContent: "space-between",
            px: 3, py: 1, bgcolor: "#0a0a1a",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={handleZoomOut} title="Zoom Out (Ctrl+-)"
              sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
            ><ZoomOutIcon fontSize="small" /></IconButton>

            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: "flex", alignItems: "center", gap: 0.3, cursor: "pointer",
                color: "white", fontSize: 13, minWidth: 40, textAlign: "center", px: 1, py: 0.3, borderRadius: 1,
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)", color: "#a78bfa" },
              }}
            >
              <span>{displayZoom}</span>
              <ArrowDropDownIcon sx={{ fontSize: 16, opacity: 0.7 }} />
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              PaperProps={{
                sx: { bgcolor: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", mt: 0.5 },
              }}
            >
              {ZOOM_PRESETS.map((p) => (
                <MenuItem
                  key={p.label}
                  onClick={() => handleZoomPreset(p.value)}
                  selected={zoom === p.value}
                  sx={{ color: zoom === p.value ? "#a78bfa" : "white", fontSize: 13, "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
                >{p.label}</MenuItem>
              ))}
            </Menu>

            <IconButton size="small" onClick={handleZoomIn} title="Zoom In (Ctrl++)"
              sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
            ><ZoomInIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => setZoom(null)} title="Fit to page (Ctrl+0)"
              sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }, ml: 0.5 }}
            ><FitScreenIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate (R)"
              sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }, ml: 0.5 }}
            ><RotateRightIcon fontSize="small" /></IconButton>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton size="small" disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              sx={{ color: "white", "&:disabled": { opacity: 0.3 } }}
            ><ChevronLeftIcon /></IconButton>
            <Typography sx={{ color: "white", fontSize: 14 }}>{currentPage} / {numPages}</Typography>
            <IconButton size="small" disabled={currentPage >= numPages}
              onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
              sx={{ color: "white", "&:disabled": { opacity: 0.3 } }}
            ><ChevronRightIcon /></IconButton>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default PDFViewerModal;
