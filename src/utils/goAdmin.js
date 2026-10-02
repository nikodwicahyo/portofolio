import { getSupabase } from '../supabase.js';

// Hidden admin entry: active session → /dashboard, otherwise → /login.
// Entry point only — permissions stay enforced by ProtectedRoute + RLS.
// Never throws; falls back to /login so the shortcut/dot always do something.
export async function adminPath() {
  try {
    const sb = getSupabase();
    if (!sb) return '/login';
    const { data } = await sb.auth.getSession();
    return data?.session ? '/dashboard' : '/login';
  } catch {
    return '/login';
  }
}

export async function goAdmin(navigate) {
  const path = await adminPath();
  try {
    navigate(path);
  } catch {
    window.location.href = path;
  }
}
