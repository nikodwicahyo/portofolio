// Public comment intake. All writes go through the submit-comment edge
// function: it owns the rate limit, length caps, CAPTCHA and markup filter, and
// the portfolio_comments table no longer grants INSERT to anon (see
// supabase/migrations/20261022_security_hardening.sql). Do not re-add a direct
// insert "fallback" — that is the bypass the policy used to allow.
import { checkComment } from '../../supabase/functions/submit-comment/rules.mjs';

export async function submitComment({ userName, content, turnstileToken }) {
  // Same rules module the edge function uses, so users get instant feedback and
  // the client mirror can never drift from what the server will accept.
  const { name, body, error } = checkComment({ userName, content });
  if (error) throw new Error(error);
  // ponytail: 1 comment per 30s per browser, mirrors server WINDOW_SECONDS.
  try {
    const last = Number(localStorage.getItem('comment_last_at') || 0);
    if (Date.now() - last < 30 * 1000) throw new Error('You are commenting too fast. Please wait a bit.');
  } catch (e) { if (e?.message?.includes('too fast')) throw e; }

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error('Commenting is unavailable right now. Please try again later.');
  }

  const payload = { userName: name, content: body };
  if (turnstileToken) payload.turnstileToken = turnstileToken;

  let res;
  try {
    res = await fetch(`${baseUrl}/functions/v1/submit-comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not reach the comment service. Please try again.');
  }

  if (!res.ok) {
    if (res.status === 429) throw new Error('You are commenting too fast. Please wait a bit.');
    let message = '';
    try {
      const data = await res.json();
      message = data?.error || data?.message || '';
    } catch {
      // non-JSON body; use the generic message below
    }
    throw new Error(message || 'Failed to post comment. Please try again.');
  }

  try { localStorage.setItem('comment_last_at', String(Date.now())); } catch { /* best-effort */ }
  return res.json().catch(() => undefined);
}
