import { useState } from 'react'
import { supabase } from "../supabase";
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, LogIn, Sparkles, Eye, EyeOff } from 'lucide-react'
import Swal from 'sweetalert2'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      Swal.fire({ icon: 'error', title: 'Login Failed', text: error.message, confirmButtonColor: 'var(--invert)', confirmButtonTextColor: 'var(--invert-text)', background: 'var(--elevated)', color: 'var(--primary)' });
      setLoading(false);
      return
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      Swal.fire({ icon: 'error', title: 'Access Denied', text: 'You do not have admin access.', confirmButtonColor: 'var(--invert)', confirmButtonTextColor: 'var(--invert-text)', background: 'var(--elevated)', color: 'var(--primary)' });
      setLoading(false)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="relative group">
          <div className="relative bg-surface border border-edge rounded-2xl p-8 space-y-7">

            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-soft border border-edge">
                <Sparkles className="w-3.5 h-3.5 text-secondary" />
                <span className="text-primary text-xs font-medium">Admin Portal</span>
              </div>
              <h1 className="text-3xl font-bold text-primary">Welcome Back</h1>
              <p className="text-secondary text-sm">Sign in to manage your portfolio</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-secondary uppercase tracking-wider">Email</label>
                <div className="flex items-center bg-soft border border-edge rounded-xl overflow-hidden focus-within:border-edge-strong transition-colors">
                  <Mail className="w-4 h-4 text-muted ml-4 shrink-0" />
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent px-3 py-3 text-primary placeholder-muted text-sm outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-secondary uppercase tracking-wider">Password</label>
                <div className="flex items-center bg-soft border border-edge rounded-xl overflow-hidden focus-within:border-edge-strong transition-colors">
                  <Lock className="w-4 h-4 text-muted ml-4 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-transparent px-3 py-3 text-primary placeholder-muted text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="mr-4 shrink-0 text-muted hover:text-primary transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="relative group/btn w-full mt-1">
                <div className="relative h-11 bg-invert text-invert-text rounded-xl flex items-center justify-center gap-2 overflow-hidden hover:bg-invert-hover transition-colors">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="relative text-sm font-medium">Sign In</span>
                      <LogIn className="relative w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}