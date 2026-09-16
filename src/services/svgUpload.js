import { getSupabase } from '../supabase';
import { validateSvgFile } from './storage.js';
import { sanitizeSvg } from './sanitizeSvg.js';

const SVG_BUCKET = 'svg-assets';

// Uploads an SVG: validate → sanitize locally → store sanitized bytes, never
// the original. No Edge Function involved (nothing to deploy, no CORS
// preflight, no gateway JWT). Write access is admin-only via storage RLS;
// icons render via <img>, which never executes embedded scripts.
// Returns the public URL. Throws with an actionable message — caller shows
// it and aborts the DB write.
export async function uploadSanitizedSvg(file) {
  const vErr = validateSvgFile(file);
  if (vErr) throw new Error(vErr);
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured.');
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) throw new Error('You must be signed in.');

  let text;
  try {
    text = await file.text();
  } catch {
    throw new Error('Could not read file.');
  }
  const clean = sanitizeSvg(text);
  if (!clean) throw new Error('SVG rejected: executable content detected.');

  const key = `tech-${Date.now()}-${Math.random().toString(36).slice(2)}.svg`;
  const { error } = await sb.storage.from(SVG_BUCKET).upload(
    key,
    new Blob([clean], { type: 'image/svg+xml' }),
    { contentType: 'image/svg+xml', upsert: false },
  );
  if (error) throw new Error(friendlyStorageError(error));
  const { data } = sb.storage.from(SVG_BUCKET).getPublicUrl(key);
  if (!data?.publicUrl) throw new Error('SVG upload returned no URL.');
  return data.publicUrl;
}

function friendlyStorageError(error) {
  const msg = error?.message || 'SVG upload failed.';
  if (/bucket not found/i.test(msg)) {
    return 'Storage bucket "svg-assets" is missing. Run the svg-assets SQL from the README, then retry.';
  }
  if (/row-level security|policy|permission|unauthorized/i.test(msg)) {
    return 'Upload denied by storage policy. Apply the svg-assets SQL from the README and confirm your user has the admin role.';
  }
  return msg;
}

export function isSvgFile(file) {
  if (!file) return false;
  return file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '');
}
