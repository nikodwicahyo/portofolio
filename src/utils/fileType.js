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

export const isBase64DataUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("data:");
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
