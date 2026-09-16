// Supabase image pipeline — HD + fast.
//
// Root fix: transformations only work on /storage/v1/render/image/public/.
// The old `?width=&quality=` on /object/public/ URLs was silently ignored,
// so cards served raw originals with no retina variants.
// Non-Supabase (data:/blob:/external) URLs pass through untouched.

const SUPABASE_PUBLIC = '/storage/v1/object/public/';
const SUPABASE_RENDER = '/storage/v1/render/image/public/';

function splitQuery(url) {
  const i = url.indexOf('?');
  return i === -1 ? [url, ''] : [url.slice(0, i), url.slice(i + 1)];
}

// Already-transformed URL (has render path or width param) → use as-is.
function isTransformed(base, query) {
  return base.includes(SUPABASE_RENDER) || /(^|&)width=\d+/.test(query);
}

export function optimizedImageUrl(url, { width = 960, quality = 80 } = {}) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (!url.includes(SUPABASE_PUBLIC) && !url.includes(SUPABASE_RENDER)) return url;
  if (transformState === -1) return url; // transforms 403 on this project → serve raw
  const [base, query] = splitQuery(url);
  if (isTransformed(base, query)) return url;
  const renderBase = base.replace(SUPABASE_PUBLIC, SUPABASE_RENDER);
  const w = Math.max(1, Math.min(2000, Math.round(width) || 960));
  const q = Math.max(1, Math.min(100, Math.round(quality) || 80));
  const sep = query ? `${query}&` : '';
  // ponytail: width+quality only — CSS object-cover handles cropping, no server crop.
  return `${renderBase}?${sep}width=${w}&quality=${q}`;
}

// Transform capability probe — the /render/image/ endpoint 403s when Image
// Transformation is disabled on the project (verified: raw 200, render 403).
// First paint would otherwise burn one failed request per image before the
// LazyImage fallback rescues it — and any fallback hiccup shows "Failed to load".
// Prime once per session; when blocked, serve raw URLs directly (zero failures).
const TRANSFORM_FLAG_KEY = 'img_transform_v1';
const TRANSFORM_FLAG_TTL = 86400000;
let transformState = 0; // 0 unknown, 1 ok, -1 blocked
let probePromise = null;

try {
  const raw = localStorage.getItem(TRANSFORM_FLAG_KEY);
  if (raw) {
    const p = JSON.parse(raw);
    if (p && Date.now() - p.ts < TRANSFORM_FLAG_TTL) transformState = p.ok ? 1 : -1;
  }
} catch { /* best-effort */ }

function rememberTransform(ok) {
  transformState = ok ? 1 : -1;
  try { localStorage.setItem(TRANSFORM_FLAG_KEY, JSON.stringify({ ok, ts: Date.now() })); } catch { /* noop */ }
}

export function isTransformBlocked() {
  return transformState === -1;
}

export function primeImagePipeline(sampleUrl) {
  if (transformState !== 0 || probePromise || !sampleUrl || typeof sampleUrl !== 'string') return probePromise;
  if (!sampleUrl.includes(SUPABASE_PUBLIC) || sampleUrl.startsWith('data:') || sampleUrl.startsWith('blob:')) return probePromise;
  const testUrl = optimizedImageUrl(sampleUrl, { width: 640, quality: 70 });
  if (testUrl === sampleUrl) return probePromise;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  probePromise = fetch(testUrl, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' })
    .then((r) => rememberTransform(r.ok))
    .catch(() => rememberTransform(false))
    .finally(() => clearTimeout(timer));
  return probePromise;
}
// "url640 640w, url960 960w, ..." for retina sharpness; browser picks smallest sufficient.
// Blocked transforms → undefined (raw src already served, no stacked 403s).
export function projectSrcSet(url, widths = [640, 960, 1280]) {
  if (isTransformBlocked()) return undefined;
  if (!url || typeof url !== 'string') return undefined;
  if (url.startsWith('data:') || url.startsWith('blob:')) return undefined;
  if (!url.includes(SUPABASE_PUBLIC) && !url.includes(SUPABASE_RENDER)) return undefined;
  const [base, query] = splitQuery(url);
  if (isTransformed(base, query)) return undefined; // don't stack transforms
  return widths.map((w) => `${optimizedImageUrl(url, { width: w, quality: 80 })} ${w}w`).join(', ');
}

// Detail hero: bigger default, higher quality (fetched once per visit).
export function projectDetailUrl(url) {
  return optimizedImageUrl(url, { width: 1600, quality: 85 });
}

// Full original for lightbox / og:image — strip transform back to object URL.
export function fullHdUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const [base, query] = splitQuery(url);
  if (!base.includes(SUPABASE_RENDER)) return url;
  const orig = base.replace(SUPABASE_RENDER, SUPABASE_PUBLIC);
  // Preserve cache-buster (t=) but drop width/quality/resize/format.
  const kept = query.split('&').filter((p) => p && !/^(width|height|quality|resize|format)=/.test(p)).join('&');
  return kept ? `${orig}?${kept}` : orig;
}

// Runtime preconnect to the Supabase storage origin (env-specific, so it
// can't be hardcoded in index.html). Call once per origin — no-op afterwards.
const preconnected = new Set();
export function preconnectSupabase(url) {
  try {
    if (!url || typeof url !== 'string' || url.startsWith('data:') || url.startsWith('blob:')) return;
    const { origin } = new URL(url, window.location.href);
    if (preconnected.has(origin) || !origin.includes('supabase')) return;
    preconnected.add(origin);
    const l = document.createElement('link');
    l.rel = 'preconnect';
    l.href = origin;
    l.crossOrigin = 'anonymous';
    document.head.appendChild(l);
  } catch { /* best-effort */ }
}

// Client-side compress before upload: guarantees future originals are HD yet
// small. Downscales to maxEdge, encodes WebP (fallback JPEG). Returns a File.
// ponytail: canvas-only, no new dep; ceiling = main-thread encode (~100ms for 12MP).
export async function compressProjectImage(file, { maxEdge = 1920, quality = 0.82 } = {}) {
  if (!file || typeof file !== 'object' || !/^image\//.test(file.type || '')) return file;
  if ((file.type === 'image/webp' || file.type === 'image/jpeg') && file.size < 400 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    if (scale === 1 && (file.type === 'image/webp' || file.type === 'image/jpeg')) {
      bitmap.close?.();
      return file;
    }
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise((resolve) => {
      const done = (b) => resolve(b);
      try {
        if (canvas.toBlob) canvas.toBlob(done, 'image/webp', quality);
        else resolve(null);
      } catch { resolve(null); }
    });
    if (!blob || blob.size === 0) return file;
    // If WebP came out larger (flat PNG screenshots), keep original.
    if (blob.size >= file.size) return file;
    const name = (file.name || 'project').replace(/\.[a-z0-9]+$/i, '') + '.webp';
    return new File([blob], name, { type: 'image/webp' });
  } catch {
    return file; // never block upload on compression failure
  }
}
