import { getSupabase } from '../supabase';
import { validateSvgFile } from './storage.js';

// Uploads an SVG through the sanitize-svg Edge Function (admin JWT required).
// Returns the public URL of the sanitized object. Throws on validation or
// server failure — caller shows the message and aborts the DB write.
export async function uploadSanitizedSvg(file) {
  const vErr = validateSvgFile(file);
  if (vErr) throw new Error(vErr);
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured.');
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) throw new Error('You must be signed in.');
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) throw new Error('Supabase not configured.');

  const form = new FormData();
  form.append('file', file, file.name || 'icon.svg');
  const signal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(30000) : undefined;
  let res;
  try {
    res = await fetch(`${base}/functions/v1/sanitize-svg`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form,
      ...(signal ? { signal } : {}),
    });
  } catch (e) {
    if (e?.name === 'TimeoutError') throw new Error('SVG sanitizer timed out. Try again.');
    throw new Error('SVG sanitizer unavailable. Try again later.');
  }
  if (res.status === 404) {
    throw new Error('SVG sanitizer not deployed yet. Ask the admin to deploy supabase/functions/sanitize-svg.');
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    throw new Error('SVG sanitizer returned an invalid response.');
  }
  if (!res.ok) throw new Error(body?.error || 'SVG rejected by sanitizer.');
  if (!body?.publicUrl) throw new Error('SVG sanitizer returned no URL.');
  return body.publicUrl;
}

export function isSvgFile(file) {
  if (!file) return false;
  return file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '');
}
