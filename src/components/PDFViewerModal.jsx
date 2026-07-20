import { useState, useEffect, useCallback, useRef } from "react";
import { Modal, IconButton, Box, Backdrop, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import { isBase64DataUrl } from "../utils/fileType";

const PDFViewerModal = ({ pdfUrl, isOpen, onClose, showDownload, filename = "document.pdf", title }) => {
  const [iframeSrc, setIframeSrc] = useState(null);
  const blobUrlRef = useRef(null);

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
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    } else {
      a.href = pdfUrl;
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [pdfUrl, filename]);

  useEffect(() => {
    let cancelled = false;

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setIframeSrc(null);

    if (!isOpen || !pdfUrl) return;

    if (isBase64DataUrl(pdfUrl)) {
      const base64 = pdfUrl.split(",")[1];
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setIframeSrc(url);
    } else {
      fetch(pdfUrl)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.blob();
        })
        .then(blob => {
          if (cancelled) return;
          const file = new File([blob], filename || "document.pdf", { type: "application/pdf" });
          const url = URL.createObjectURL(file);
          blobUrlRef.current = url;
          setIframeSrc(url);
        })
        .catch(() => {
          if (!cancelled) setIframeSrc(pdfUrl);
        });
    }

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [pdfUrl, isOpen, filename]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="pdf-viewer-modal-title"
      aria-describedby="pdf-viewer-modal-description"
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 300,
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          backdropFilter: "blur(5px)",
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
        {/* Header */}
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
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.2)",
                  },
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
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.2)",
                },
              }}
              size="large"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* PDF iframe */}
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          {iframeSrc ? (
            <iframe
              src={iframeSrc}
              title="PDF Viewer"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "gray",
              }}
            >
              Loading PDF...
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default PDFViewerModal;
