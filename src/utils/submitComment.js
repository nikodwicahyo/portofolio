import { getSupabase } from '../supabase.js';

export async function submitComment({ userName, content }) {
  const name = String(userName ?? '').trim();
  const body = String(content ?? '').trim();

  if (!name || !body) throw new Error('Please enter your name and message.');
  if (name.length > 15) throw new Error('Name must be 15 characters or fewer.');
  if (body.length > 200) throw new Error('Message must be 200 characters or fewer.');

  // ponytail: is_pinned hardcoded, never caller-controlled.
  const payload = { user_name: name, content: body, is_pinned: false };
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const fallbackInsert = async () => {
    const sb = getSupabase();
    if (!sb) throw new Error('Failed to post comment. Please try again.');
    const { error } = await sb.from('portfolio_comments').insert([
      { content: body, user_name: name, is_pinned: false, created_at: new Date().toISOString() },
    ]);
    if (error) throw new Error('Failed to post comment. Please try again.');
  };

  if (!baseUrl) {
    console.warn('submit-comment function URL unconfigured, falling back to direct insert.');
    return fallbackInsert();
  }

  try {
    const res = await fetch(`${baseUrl}/functions/v1/submit-comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error('You are commenting too fast. Please wait a bit.');
      let message = '';
      try {
        const data = await res.json();
        message = data?.error || data?.message || '';
      } catch {
        // ignore parse errors, use fallback message below
      }
      throw new Error(message || 'Failed to post comment. Please try again.');
    }
    return res.json().catch(() => undefined);
  } catch (err) {
    if (err instanceof TypeError) {
      console.warn('submit-comment function unavailable, falling back to direct insert.', err);
      return fallbackInsert();
    }
    throw err;
  }
}
