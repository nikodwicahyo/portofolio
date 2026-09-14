import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getSupabase } from "../supabase";

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ checked: false, allowed: false });

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    const check = async () => {
      const sb = getSupabase();
      if (!sb) {
        if (alive) setState({ checked: true, allowed: false });
        return;
      }
      try {
        const { data: { user }, error: userErr } = await sb.auth.getUser();
        if (!alive || ctrl.signal.aborted) return;
        if (userErr || !user) {
          setState({ checked: true, allowed: false });
          return;
        }
        const { data: profile, error: profileErr } = await sb
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (!alive || ctrl.signal.aborted) return;
        if (profileErr) {
          console.error('[auth] profile fetch failed:', profileErr.message);
          setState({ checked: true, allowed: false });
          return;
        }
        setState({ checked: true, allowed: profile?.role === 'admin' });
      } catch (e) {
        if (alive) {
          console.error('[auth] check failed:', e?.message || e);
          setState({ checked: true, allowed: false });
        }
      }
    };

    check();
    const timeout = setTimeout(() => {
      // Fail closed if auth check hangs (network down, etc.).
      if (alive) setState((s) => (s.checked ? s : { checked: true, allowed: false }));
    }, 12000);
    const sb = getSupabase();
    const { data: sub } = sb?.auth.onAuthStateChange((evt, session) => {
      if (!alive) return;
      if (!session?.user) {
        setState({ checked: true, allowed: false });
      } else if (evt === 'SIGNED_IN' || evt === 'TOKEN_REFRESHED') {
        check();
      }
    }) || { data: null };
    return () => {
      alive = false;
      ctrl.abort();
      clearTimeout(timeout);
      try { sub?.subscription?.unsubscribe(); } catch { /* noop */ }
    };
  }, []);

  if (!state.checked) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-edge-strong border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!state.allowed) return <Navigate to="/login" replace />;

  return children
}
