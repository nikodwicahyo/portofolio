export const isPdfUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  try {
    if (url.startsWith("data:")) {
      return url.startsWith("data:application/pdf");
    }
    const path = url.split("?")[0];
    return path.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
};

export const isImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  try {
    if (url.startsWith("data:")) {
      return url.startsWith("data:image/");
    }
    const path = url.split("?")[0].toLowerCase();
    return (
      path.endsWith(".png") ||
      path.endsWith(".jpg") ||
      path.endsWith(".jpeg") ||
      path.endsWith(".webp") ||
      path.endsWith(".gif") ||
      path.endsWith(".svg")
    );
  } catch {
    return false;
  }
};

export const isBase64DataUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("data:");
};

export const getFileType = (url) => {
  if (isPdfUrl(url)) return "pdf";
  return "image";
};

export const getBase64MimeType = (url) => {
  if (!isBase64DataUrl(url)) return null;
  try {
    const match = url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};
