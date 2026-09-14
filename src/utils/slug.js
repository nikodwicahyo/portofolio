export const toSlug = (title) => {
  if (!title || typeof title !== "string") return "untitled";
  const s = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "untitled";
};

export const normalizeSlug = (slug) => {
  if (!slug) return "";
  return String(slug).trim().toLowerCase().replace(/-+/g, "-").replace(/^-|-$/g, "");
};