import { useState, useEffect, useCallback, useRef } from "react";
import { Modal, IconButton, Box, Backdrop, Typography, Menu, MenuItem, useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
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
  { label: "Fit width", value: null },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1 },
  { label: "125%", value: 1.25 },
  { label: "150%", value: 1.5 },
  { label: "200%", value: 2 },
];

const THUMB_WIDTH = 150;

const base64ToUint8Array = (base64) => {
  const stripped = base64.replace(/\s/g, "");
  const binaryString = atob(stripped);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const PDFViewerModal = ({ pdfUrl, isOpen, onClose, showDownload, filename = "document.pdf", title }) => {
  const isDesktop = useMediaQuery("(min-width:900px)");
  const [numPages, setNumPages] = useState(0);
  const [visiblePage, setVisiblePage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [displayZoom, setDisplayZoom] = useState("Fit");
  const [anchorEl, setAnchorEl] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const pdfRef = useRef(null);
  const containerRef = useRef(null);
  const pagesContainerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const fitScaleRef = useRef(1);
  const obRef = useRef(null);

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

  const renderThumbnails = useCallback(async (pdf) => {
    if (!pdf) return;
    const imgs = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const scale = THUMB_WIDTH / viewport.width;
      const thumbViewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = thumbViewport.width;
      canvas.height = thumbViewport.height;
      const ctx = canvas.getContext("2d");
      const warn = console.warn; console.warn = () => {};
      await page.render({ canvasContext: ctx, viewport: thumbViewport }).promise;
      console.warn = warn;
      imgs.push(canvas.toDataURL("image/jpeg", 0.6));
    }
    setThumbnails(imgs);
  }, []);

  useEffect(() => {
    if (!isOpen || !pdfUrl) return;
    let cancelled = false;
    setLoading(true);
    setNumPages(0);
    setVisiblePage(1);
    pdfRef.current = null;
    setZoom(null);
    setRotation(0);
    setDisplayZoom("Fit");
    setThumbnails([]);

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
        renderThumbnails(pdf);
      } catch (err) {
        if (!cancelled) console.error("PDF load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
        console.warn = warn;
      }
    };
    loadPdf();
    return () => { cancelled = true; };
  }, [pdfUrl, isOpen, renderThumbnails]);

  const renderAllPages = useCallback(async () => {
    const pdf = pdfRef.current;
    const container = pagesContainerRef.current;
    if (!pdf || !container) return;

    if (renderTaskRef.current) {
      try { await renderTaskRef.current.cancel(); } catch {}
    }

    const containerWidth = container.clientWidth || 800;
    const existing = container.querySelectorAll("[data-page]");

    try {
      if (existing.length === pdf.numPages) {
        for (const wrapper of existing) {
          const pageNum = Number(wrapper.dataset.page);
          const page = await pdf.getPage(pageNum);
          const canvas = wrapper.querySelector("canvas");
          if (!canvas) continue;

          const unscaled = page.getViewport({ scale: 1, rotation });
          const fitScale = containerWidth / unscaled.width;
          if (pageNum === 1) fitScaleRef.current = fitScale;
          const s = zoom !== null ? zoom : fitScale;
          const viewport = page.getViewport({ scale: s, rotation });

          const ctx = canvas.getContext("2d");
          const dpr = window.devicePixelRatio || 1;
          canvas.width = viewport.width * dpr;
          canvas.height = viewport.height * dpr;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          const warn = console.warn; console.warn = () => {};
          await page.render({ canvasContext: ctx, viewport }).promise;
          console.warn = warn;
        }
      } else {
        if (obRef.current) { obRef.current.disconnect(); obRef.current = null; }
        container.innerHTML = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);

          const wrapper = document.createElement("div");
          wrapper.style.cssText = "display:flex;flex-direction:column;align-items:center;padding-bottom:16px;width:100%;";
          wrapper.dataset.page = i;

          const canvas = document.createElement("canvas");
          wrapper.appendChild(canvas);
          container.appendChild(wrapper);

          const unscaled = page.getViewport({ scale: 1, rotation });
          const fitScale = containerWidth / unscaled.width;
          if (i === 1) fitScaleRef.current = fitScale;
          const s = zoom !== null ? zoom : fitScale;
          const viewport = page.getViewport({ scale: s, rotation });

          const ctx = canvas.getContext("2d");
          const dpr = window.devicePixelRatio || 1;
          canvas.width = viewport.width * dpr;
          canvas.height = viewport.height * dpr;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          const warn = console.warn; console.warn = () => {};
          await page.render({ canvasContext: ctx, viewport }).promise;
          console.warn = warn;
        }
      }

      if (obRef.current) obRef.current.disconnect();
      const pageEls = container.querySelectorAll("[data-page]");
      obRef.current = new IntersectionObserver(
        (entries) => {
          let maxRatio = 0;
          let best = 0;
          for (const entry of entries) {
            if (entry.intersectionRatio > maxRatio) {
              maxRatio = entry.intersectionRatio;
              best = Number(entry.target.dataset.page);
            }
          }
          if (best) setVisiblePage(best);
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1] }
      );
      for (const el of pageEls) obRef.current.observe(el);

      setDisplayZoom(zoom !== null ? Math.round((zoom !== null ? zoom : fitScaleRef.current) * 100) + "%" : "Fit");
    } catch (err) {
      if (err?.name !== "RenderingCancelledException") console.error("PDF render failed:", err);
    }
  }, [zoom, rotation]);

  useEffect(() => {
    if (!pdfRef.current || loading) return;
    const timer = setTimeout(renderAllPages, 0);
    return () => clearTimeout(timer);
  }, [renderAllPages, loading]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "=" || e.key === "+") { e.preventDefault(); handleZoomIn(); return; }
      if (e.key === "-") { e.preventDefault(); handleZoomOut(); return; }
      if (e.key === "0" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setZoom(null); return; }
      if (e.key === "r" || e.key === "R") { setRotation(r => (r + 90) % 360); return; }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    return () => { if (obRef.current) obRef.current.disconnect(); };
  }, []);

  const scrollToPage = (pageNum) => {
    const container = pagesContainerRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-page="${pageNum}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {isDesktop && thumbnails.length > 0 && (
            <Box
              sx={{
                width: 180, shrink: 0, overflow: "auto", bgcolor: "#0a0a1a",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 2, px: 1,
              }}
            >
              {thumbnails.map((src, i) => (
                <Box
                  key={i}
                  onClick={() => scrollToPage(i + 1)}
                  sx={{
                    width: "100%", cursor: "pointer", borderRadius: 1, overflow: "hidden",
                    border: visiblePage === i + 1 ? "2px solid #6366f1" : "2px solid transparent",
                    opacity: visiblePage === i + 1 ? 1 : 0.55,
                    transition: "all 0.2s",
                    "&:hover": { opacity: 1, borderColor: visiblePage === i + 1 ? "#6366f1" : "rgba(255,255,255,0.2)" },
                  }}
                >
                  <img src={src} alt={`Page ${i + 1}`} style={{ width: "100%", display: "block" }} />
                  <Typography sx={{ textAlign: "center", fontSize: 11, color: "gray", py: 0.3 }}>
                    {i + 1}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <Box
            ref={containerRef}
            sx={{ flex: 1, overflow: "auto", bgcolor: "#0d0d1a", position: "relative" }}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Typography sx={{ color: "gray" }}>Loading PDF...</Typography>
              </Box>
            ) : numPages === 0 ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Typography sx={{ color: "gray" }}>Failed to load PDF</Typography>
              </Box>
            ) : (
              <Box
                ref={pagesContainerRef}
                sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2 }}
              />
            )}
          </Box>
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
            <IconButton size="small" onClick={() => setZoom(null)} title="Fit width (Ctrl+0)"
              sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }, ml: 0.5 }}
            ><FitScreenIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate (R)"
              sx={{ color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" }, ml: 0.5 }}
            ><RotateRightIcon fontSize="small" /></IconButton>
          </Box>

          <Typography sx={{ color: "white", fontSize: 14 }}>
            Page {visiblePage} of {numPages || "—"}
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default PDFViewerModal;
