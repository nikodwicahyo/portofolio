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
  if (isImageUrl(url) || isBase64DataUrl(url)) return "image";
  return "unknown";
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

// Allow-list for external links rendered into <a href>.
// Returns a safe URL or null (caller renders plain text instead).
// Blocks javascript:, data:, vbscript:, blob: — bare domains get https://.
export function safeExternalUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const t = url.trim();
  if (!t) return null;
  if (/^(https?:\/\/|mailto:)/i.test(t)) return t;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/\S*)?$/i.test(t)) return `https://${t}`;
  return null;
};
