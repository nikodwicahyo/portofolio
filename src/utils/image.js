// Supabase image-transformation URLs. Only rewrites Supabase storage public
// URLs; data:/blob:/external URLs pass through untouched. If the project has
// transformations disabled, params are ignored and the original is served,
// so this is a safe progressive enhancement.
export function optimizedImageUrl(url, { width = 800, quality = 70 } = {}) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('/storage/v1/object/public/')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}width=${width}&quality=${quality}`;
}
