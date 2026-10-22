// The one copy of the comment rules. Imported by the edge function, the
// browser client and scripts/security.test.mjs — a client-only mirror is what
// let <img onerror> through once while the server still only blocked <script>.

export const MAX_NAME = 15;
export const MAX_BODY = 200;
export const MAX_LINKS = 2;

// A tag starts with "<" plus a letter, "/", "!" or "?". So "<img", "</b>",
// "<!--" and "<?xml" are rejected while "<3" and "5 < 6" stay allowed.
const TAG = /<\s*\/?\s*[a-z!?]/i;
// \b keeps "metadata: foo" legal while "javascript:" / "data:" never are.
const SCHEME = /\b(?:javascript|vbscript|data):/i;

export function checkComment({ userName, content }) {
  const name = String(userName ?? '').trim();
  const body = String(content ?? '').trim();

  if (!name || !body) return { error: 'Please enter your name and message.' };
  if (name.length > MAX_NAME) return { error: `Name must be ${MAX_NAME} characters or fewer.` };
  if (body.length > MAX_BODY) return { error: `Message must be ${MAX_BODY} characters or fewer.` };
  if ([name, body].some((s) => TAG.test(s) || SCHEME.test(s))) {
    return { error: 'Links and markup are not allowed in comments.' };
  }
  if ((body.match(/https?:\/\//gi) || []).length > MAX_LINKS) {
    return { error: 'Links and markup are not allowed in comments.' };
  }

  return { name, body, error: null };
}
