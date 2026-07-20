import { useState } from "react";
import { Box, Typography } from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PDFThumbnail from "./PDFThumbnail";
import PDFViewerModal from "./PDFViewerModal";
import ImageViewerModal from "./ImageViewerModal";
import { isPdfUrl } from "../utils/fileType";

const Certificate = ({ ImgSertif }) => {
  const [openPdf, setOpenPdf] = useState(false);
  const [openImage, setOpenImage] = useState(false);
  const isPdf = isPdfUrl(ImgSertif);

  const handleOpen = () => {
    if (isPdf) {
      setOpenPdf(true);
    } else {
      setOpenImage(true);
    }
  };

  const handleClosePdf = () => setOpenPdf(false);
  const handleCloseImage = () => setOpenImage(false);

  return (
    <Box component="div" sx={{ width: "100%" }}>
      {/* Thumbnail Container */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
            "& .overlay": {
              opacity: 1,
            },
            "& .hover-content": {
              transform: "translate(-50%, -50%)",
              opacity: 1,
            },
            "& .certificate-image": {
              filter: "contrast(1.05) brightness(1) saturate(1.1)",
            },
          },
        }}
      >
        {/* Certificate Content */}
        <Box
          sx={{
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              zIndex: 1,
            },
          }}
        >
          {isPdf ? (
            <Box
              onClick={handleOpen}
              sx={{
                position: "relative",
                cursor: "pointer",
                "&:hover": {
                  "& .pdf-badge": { opacity: 1 },
                },
              }}
            >
              <PDFThumbnail pdfUrl={ImgSertif} />
              <Box
                className="pdf-badge"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  bgcolor: "#ef4444",
                  color: "white",
                  px: 1,
                  py: 0.3,
                  borderRadius: 0.75,
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1.4,
                  letterSpacing: 0.5,
                  opacity: 0.8,
                  transition: "opacity 0.3s ease",
                  zIndex: 3,
                }}
              >
                PDF
              </Box>
            </Box>
          ) : (
            <img
              className="certificate-image"
              src={ImgSertif}
              alt="Certificate"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                objectFit: "cover",
                filter: "contrast(1.10) brightness(0.9) saturate(1.1)",
                transition: "filter 0.3s ease",
                aspectRatio: "16/11.5",
              }}
              onClick={handleOpen}
            />
          )}
        </Box>

        {/* Hover Overlay */}
        <Box
          className="overlay"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0,
            transition: "all 0.3s ease",
            cursor: "pointer",
            zIndex: 2,
          }}
          onClick={handleOpen}
        >
          {/* Hover Content */}
          <Box
            className="hover-content"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -60%)",
              opacity: 0,
              transition: "all 0.4s ease",
              textAlign: "center",
              width: "100%",
              color: "white",
            }}
          >
            {isPdf ? (
              <PictureAsPdfIcon
                sx={{
                  fontSize: 40,
                  mb: 1,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                }}
              />
            ) : (
              <FullscreenIcon
                sx={{
                  fontSize: 40,
                  mb: 1,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                }}
              />
            )}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              View Certificate
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* PDF Modal */}
      <PDFViewerModal
        pdfUrl={ImgSertif}
        isOpen={openPdf}
        onClose={handleClosePdf}
        title="Certificate"
        filename="Certificate.pdf"
      />

      {/* Image Modal */}
      <ImageViewerModal
        imageUrl={ImgSertif}
        isOpen={openImage}
        onClose={handleCloseImage}
      />
    </Box>
  );
};

export default Certificate;
