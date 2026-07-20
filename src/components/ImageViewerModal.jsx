import { useEffect } from "react";
import { Modal, IconButton, Box, Fade, Backdrop } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const ImageViewerModal = ({ imageUrl, isOpen, onClose }) => {
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
      aria-labelledby="image-modal-modal-title"
      aria-describedby="image-modal-modal-description"
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
          width: "auto",
          maxWidth: "90vw",
          maxHeight: "90vh",
          m: 0,
          p: 0,
          outline: "none",
          "&:focus": {
            outline: "none",
          },
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 16,
            top: 16,
            color: "white",
            bgcolor: "rgba(0,0,0,0.6)",
            zIndex: 1,
            padding: 1,
            "&:hover": {
              bgcolor: "rgba(0,0,0,0.8)",
              transform: "scale(1.1)",
            },
          }}
          size="large"
        >
          <CloseIcon sx={{ fontSize: 24 }} />
        </IconButton>

        {/* Modal Image */}
        <img
          src={imageUrl}
          alt="Certificate Full View"
          style={{
            display: "block",
            maxWidth: "100%",
            maxHeight: "90vh",
            margin: "0 auto",
            objectFit: "contain",
          }}
        />
      </Box>
    </Modal>
  );
};

export default ImageViewerModal;
