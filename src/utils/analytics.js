import { getSupabase } from '../supabase.js';

// ponytail: 1 table, no external script, no CSP change, no PII.
// Ceiling: coarse counts only; upgrade to Plausible when funnels matter.
const SESSION_KEY = 'analytics_session';
const QUEUE_KEY = 'analytics_queue_v1';

function sessionId() {
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch { return 'unknown'; }
}

export function trackEvent(name, meta = {}) {
  try {
    const allowed = ['contact_submit', 'cv_view', 'cv_download', 'project_click', 'project_detail_view', 'github_click'];
    if (!allowed.includes(name)) return;
    const sb = getSupabase();
    const row = {
      event: name,
      path: typeof window !== 'undefined' ? window.location.pathname.slice(0, 200) : null,
      meta: { ...meta, sid: sessionId() },
    };
    if (!sb) {
      // Offline queue: flush on next track.
      const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      q.push({ ...row, created_at: new Date().toISOString() });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-50)));
      return;
    }
    // Flush backlog first (best-effort, capped).
    try {
      const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      if (q.length > 0) {
        localStorage.removeItem(QUEUE_KEY);
        sb.from('portfolio_events').insert(q.slice(0, 50)).then(() => {}, () => {});
      }
    } catch { /* noop */ }
    sb.from('portfolio_events').insert(row).then(() => {}, () => {});
  } catch { /* never break UI for analytics */ }
}
