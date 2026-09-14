import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _client = null;
let _warned = false;

export function isSupabaseConfigured() {
  return Boolean(url && key);
}

function warnOnce() {
  if (_warned) return;
  _warned = true;
  console.error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env and restart the dev server.'
  );
}

// Lazy client: never throws at import time so ErrorBoundary can render
// a useful UI instead of a module-eval white screen.
export function getSupabase() {
  if (_client) return _client;
  if (!isSupabaseConfigured()) {
    warnOnce();
    return null;
  }
  _client = createClient(url, key);
  return _client;
}

// Back-compat: existing `import { supabase }` keeps working.
// Accessing it without config warns instead of crashing the bundle.
export const supabase = new Proxy(
  {},
  {
    get(_t, prop) {
      const c = getSupabase();
      if (!c) throw new Error('Supabase not configured. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
      return c[prop];
    },
  }
);
