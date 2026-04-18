import { useEffect, useState } from 'react'
import { Home, Menu, MessageCircle, X } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { cn } from '@/lib/utils'

function LogoCompact() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-brand-light shadow-md shadow-brand-primary/30">
        <svg viewBox="0 0 32 32" fill="none" className="h-4 w-4" aria-hidden="true">
          <path
            d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M16 8L22 12V20L16 24L10 20V12L16 8Z"
            fill="currentColor"
            fillOpacity="0.35"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="font-extrabold tracking-tight text-brand-light">FairGig</span>
    </div>
  )
}

/** Baseline nav for all roles; tighten per-role later. */
function useNavItems() {
  const role = useAuthStore((s) => s.profile?.role)
  const homePath = role === 'analyst' ? '/analyst' : `/${role}`
  return [
    { to: homePath, label: 'Home', end: true, icon: Home },
    { to: '/community', label: 'Community', end: false, icon: MessageCircle },
  ]
}

export function AppShellLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const role = useAuthStore((s) => s.profile?.role)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navItems = useNavItems()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const logout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const linkClass = ({ isActive }) =>
    cn(
      'flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors touch-manipulation md:min-h-0 md:py-3',
      isActive
        ? 'bg-brand-primary text-brand-light shadow-md shadow-brand-primary/25'
        : 'text-brand-light/88 hover:bg-white/10 hover:text-white'
    )

  const SidebarFooter = () => (
    <div className="mt-auto border-t border-white/10 p-4">
      <p className="truncate text-xs font-medium text-brand-light/80">{profile?.full_name || 'Signed in'}</p>
      <p className="mb-3 truncate text-[10px] font-bold uppercase tracking-wider text-brand-light/45">
        {role || '—'}
      </p>
      <button
        type="button"
        onClick={logout}
        className="w-full min-h-[44px] rounded-xl border border-white/25 py-2.5 text-xs font-bold uppercase tracking-wider text-brand-light transition-colors hover:bg-white/10 touch-manipulation"
      >
        Log out
      </button>
    </div>
  )

  const SidebarNav = ({ onNavigate } = {}) => (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Main navigation">
      {navItems.map(({ to, label, end, icon: Icon }) => (
        <NavLink
          key={`${to}-${label}`}
          to={to}
          end={end}
          className={linkClass}
          onClick={() => onNavigate?.()}
        >
          <Icon className="h-5 w-5 shrink-0 opacity-95" strokeWidth={2} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-brand-light">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-brand-dark/80 bg-brand-darkest px-3 text-brand-light md:hidden">
        <LogoCompact />
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="app-mobile-drawer"
          onClick={() => setMobileOpen(true)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-white/10 touch-manipulation active:scale-[0.98]"
        >
          <Menu className="h-6 w-6" strokeWidth={2} aria-hidden />
          <span className="sr-only">Open menu</span>
        </button>
      </header>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-brand-darkest/55 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        id="app-mobile-drawer"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(19rem,88vw)] flex-col border-r border-white/10 bg-brand-darkest shadow-2xl transition-transform duration-200 ease-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <LogoCompact />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-white/10 touch-manipulation"
          >
            <X className="h-6 w-6" aria-hidden />
            <span className="sr-only">Close menu</span>
          </button>
        </div>
        <SidebarNav onNavigate={() => setMobileOpen(false)} />
        <SidebarFooter />
      </aside>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-brand-darkest md:flex">
        <div className="border-b border-white/10 p-4">
          <LogoCompact />
        </div>
        <SidebarNav />
        <SidebarFooter />
      </aside>

      <div className="min-h-screen md:ml-64">
        <Outlet />
      </div>
    </div>
  )
}
