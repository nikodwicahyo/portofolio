// Sanitized storage keys — neutralizes path traversal (/, .., %2f),
// control chars and overlong names in user-supplied filenames.
const SAFE_EXT = /^[a-z0-9]{1,5}$/;

export function toStorageKey(prefix, originalName, fallbackExt = 'png') {
  const name = String(originalName || '');
  const hasExt = name.slice(1).includes('.'); // ignore leading dotfiles like .htaccess
  const rawExt = hasExt ? name.split('.').pop() : '';
  const cleanExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
  const ext = SAFE_EXT.test(cleanExt) ? cleanExt : fallbackExt;
  const safePrefix = String(prefix || 'file').toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(0, 24) || 'file';
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return `${safePrefix}-${Date.now()}-${rand}.${ext}`;
}
