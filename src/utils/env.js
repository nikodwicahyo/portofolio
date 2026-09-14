// Central env access + validation. All VITE_ keys documented in .env.example.
const read = (k) => import.meta.env[k];

export const env = {
  supabaseUrl: read('VITE_SUPABASE_URL'),
  supabaseAnonKey: read('VITE_SUPABASE_ANON_KEY'),
  formlyKey: read('VITE_FORMLY_ACCESS_KEY'),
  presenceApi: read('VITE_PRESENCE_API') || '',
};

export function assertSupabase() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. See .env.example.');
  }
}
