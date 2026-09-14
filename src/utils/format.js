// Single date/format helpers — replaces ~5 duplicated formatters.
export function formatDateShort(d) {
  if (!d) return 'Present';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return '—';
  return t.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function formatDateLong(d) {
  if (!d) return 'Present';
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return '—';
  return t.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const t = new Date(dateStr);
  if (Number.isNaN(t.getTime())) return '';
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return formatDateFull(dateStr);
}

export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight `query` inside `text` without stateful /g test().
export function highlightParts(text, query) {
  if (!query) return [text];
  const q = query.trim();
  if (!q) return [text];
  return String(text).split(new RegExp(`(${escapeRegExp(q)})`, 'i'));
}
