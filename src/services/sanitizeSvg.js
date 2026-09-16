// Deterministic sanitizer for icon-style SVGs — same rules as the former
// supabase/functions/sanitize-svg (removed: an undeployed Edge Function can
// never pass the browser's CORS preflight). Anything structural outside this
// allowlist is stripped; if scriptable content survives, reject (null).
// Icons render via <img> (no script execution context); only admins can
// write to the svg-assets bucket (storage RLS).
export function sanitizeSvg(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw;
  // Drop XML processing instructions except a leading <?xml ...?> prolog.
  s = s.replace(/<\?(?!xml\b)[\s\S]*?\?>/gi, '');
  // Drop DOCTYPE entirely (no entities / external DTD → no XXE/billion-laughs).
  s = s.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  // Drop HTML comment conditional / all comments (hides payloads).
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  // Drop script blocks and foreignObject (HTML embedding).
  s = s.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  s = s.replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '');
  s = s.replace(/<(handler|listener|set|animate)[\s>][\s\S]*?(<\/\1\s*>|\/>)/gi, '');
  // Drop event-handler attributes (onload, onclick, ...). [\s/] covers
  // <svg onload=...> and <svg/onload=...> spellings.
  s = s.replace(/[\s/]on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // Neutralize javascript:/data:text/html hrefs (keep #fragment + https).
  s = s.replace(/\s+(xlink:)?href\s*=\s*("|\')\s*javascript:[^"\']*("|\')/gi, ' href="#removed"');
  s = s.replace(/\s+(xlink:)?href\s*=\s*("|\')\s*data:text\/html[^"\']*("|\')/gi, ' href="#removed"');
  // Final gate: nothing executable may remain.
  const bad =
    /<script|on\w+\s*=|foreignObject|<!ENTITY|javascript:|data:text\/html|data:image\/svg|vbscript:/i.test(s);
  if (bad) return null;
  if (!/<svg[\s>]/i.test(s)) return null;
  return s;
}
