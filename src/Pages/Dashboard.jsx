import { useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Projects from './dashboard/Projects'
import Certificates from './dashboard/Certificates'
import Comments from './dashboard/Comments'
import Experiences from './dashboard/Experiences'
import TechStack from './dashboard/TechStack'
import CVDocuments from './dashboard/CVDocuments'
import { FolderGit2, Award, MessageSquare, LogOut, LayoutDashboard, Menu, Briefcase, Boxes, FileText, Sun, Moon, Home } from 'lucide-react'
import useTheme from '../hooks/useTheme'

const NAV_ITEMS = [
  { to: '/dashboard/projects', label: 'Projects', icon: FolderGit2 },
  { to: '/dashboard/experiences', label: 'Experiences', icon: Briefcase },
  { to: '/dashboard/certificates', label: 'Certificates', icon: Award },
  { to: '/dashboard/cv', label: 'CV', icon: FileText },
  { to: '/dashboard/tech-stacks', label: 'Tech Stacks', icon: Boxes },
  { to: '/dashboard/comments', label: 'Comments', icon: MessageSquare },
]

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full p-5 gap-5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-1 shrink-0">
        <div className="relative w-9 h-9 bg-soft rounded-xl border border-edge flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">Dashboard</p>
          <p className="text-xs text-muted">Admin Panel</p>
        </div>
      </div>

      {/* Badge */}
      <div className="shrink-0 px-3 py-2 rounded-full bg-soft border border-edge flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-primary text-xs font-medium">Portfolio Manager</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
        <p className="text-[10px] text-faint uppercase tracking-widest px-3 mb-2 shrink-0">Menu</p>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const currentPath = location.pathname.replace(/\/$/, '')
          const active = currentPath === to || currentPath.startsWith(to + '/')
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium shrink-0 ${
                active
                  ? 'bg-soft-strong border border-edge-strong text-primary'
                  : 'text-secondary hover:text-primary hover:bg-soft border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="shrink-0 flex flex-row sm:flex-col gap-2 sm:gap-1 pt-2 border-t border-edge justify-center sm:justify-start">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex items-center justify-center sm:justify-start gap-3 px-3 py-2.5 rounded-xl text-secondary hover:text-primary hover:bg-soft border border-transparent transition-all duration-200 text-sm"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          <span className="hidden sm:inline">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* Back to Home */}
        <Link
          to="/"
          onClick={() => setSidebarOpen(false)}
          aria-label="Back to Home"
          className="flex items-center justify-center sm:justify-start gap-3 px-3 py-2.5 rounded-xl text-secondary hover:text-primary hover:bg-soft border border-transparent transition-all duration-200 text-sm"
        >
          <Home className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Back to Home</span>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          aria-label="Sign Out"
          className="flex items-center justify-center sm:justify-start gap-3 px-3 py-2.5 rounded-xl text-muted hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/15 transition-all duration-200 text-sm"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    // Kunci: TIDAK pakai overflow-hidden di sini supaya scrollbar main bisa diklik
    <div className="flex text-primary" style={{ height: '100dvh' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop: sticky, tinggi 100dvh */}
      <aside
        className="hidden lg:flex w-60 shrink-0 flex-col border-r border-edge bg-sidebar"
        style={{ height: '100dvh', position: 'sticky', top: 0 }}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar - mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 flex flex-col border-r border-edge bg-sidebar transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-edge bg-sidebar shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg border border-edge text-secondary hover:text-primary transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-primary">Dashboard</span>
        </div>

        {/* Hanya main yang overflow-y-auto — scrollbar bisa diklik normal */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route index element={<Navigate to="/dashboard/projects" replace />} />
            <Route path="projects" element={<Projects />} />
            <Route path="experiences" element={<Experiences />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="cv" element={<CVDocuments />} />
            <Route path="tech-stacks" element={<TechStack />} />
            <Route path="comments" element={<Comments />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}