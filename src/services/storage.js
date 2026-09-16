import { getSupabase } from '../supabase';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_SVG_BYTES = 512 * 1024;

// Raster only. SVG is handled via the sanitize-svg Edge Function path
// (see supabase/functions/sanitize-svg) — never uploaded raw.
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const RASTER_EXT = /\.(png|jpe?g|webp|gif)$/i;

export const ACCEPTED_SVG_TYPES = ['image/svg+xml'];

export function validateImageFile(file) {
  if (!file) return 'No file selected.';
  // file.type is attacker-controlled: reject empty AND non-allowlisted, plus extension check.
  if (!file.type || !ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Unsupported image type (PNG, JPG, WEBP, GIF only).';
  if (file.name && !RASTER_EXT.test(file.name)) return 'Unsupported file extension.';
  if (file.size > MAX_UPLOAD_BYTES) return 'File too large (max 5MB).';
  return null;
}

export function validateSvgFile(file) {
  if (!file) return 'No file selected.';
  if (file.type !== 'image/svg+xml' && !/\.svg$/i.test(file.name || '')) {
    return 'Only SVG files are accepted here.';
  }
  if (file.size > MAX_SVG_BYTES) return 'SVG too large (max 500KB).';
  return null;
}

export function validatePdfFile(file) {
  if (!file) return 'No file selected.';
  const byType = file.type === 'application/pdf';
  const byExt = /\.pdf$/i.test(file.name || '');
  if (!byType && !byExt) return 'Only PDF files are accepted here.';
  if (file.size > MAX_UPLOAD_BYTES) return 'File too large (max 5MB).';
  return null;
}

export async function hasPdfMagic(file) {
  try {
    const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    return String.fromCharCode(...head) === '%PDF-';
  } catch {
    return false;
  }
}

// Storage path from a public URL — handles ?t= cache-busters and folders.
export function storagePathFromUrl(publicUrl) {
  if (!publicUrl || typeof publicUrl !== 'string') return null;
  try {
    const u = new URL(publicUrl);
    const parts = u.pathname.split('/storage/v1/object/public/');
    if (parts.length === 2) return decodeURIComponent(parts[1].split('/').slice(1).join('/')) || null;
    const segs = u.pathname.split('/').filter(Boolean);
    return decodeURIComponent(segs[segs.length - 1]?.split('?')[0] || '') || null;
  } catch {
    const s = String(publicUrl).split('?')[0].split('/').filter(Boolean).pop();
    return s || null;
  }
}

export async function uploadImage(bucket, path, file) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured.');
  const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
}

export async function removeImage(bucket, publicUrl) {
  const p = storagePathFromUrl(publicUrl);
  if (!p) return;
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.storage.from(bucket).remove([p]);
  if (error) console.error(`[storage] remove ${bucket}/${p} failed:`, error.message);
}

// Bucket-aware delete: tech-stack icons live in svg-assets (SVG, via
// sanitize-svg) or project-images (raster). Derives the bucket from the URL
// so callers can't orphan files in the wrong bucket.
export async function removeImageByUrl(publicUrl, fallbackBucket) {
  const bucket = storageBucketFromUrl(publicUrl) || fallbackBucket;
  if (!bucket) return;
  return removeImage(bucket, publicUrl);
}

function storageBucketFromUrl(publicUrl) {
  if (!publicUrl || typeof publicUrl !== 'string') return null;
  try {
    const u = new URL(publicUrl);
    const parts = u.pathname.split('/storage/v1/object/public/');
    if (parts.length === 2) return decodeURIComponent(parts[1].split('/')[0] || '') || null;
    return null;
  } catch {
    return null;
  }
}
