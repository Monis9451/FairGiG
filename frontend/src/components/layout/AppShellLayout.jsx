import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  Home,
  LayoutDashboard,
  Menu,
  MessageCircle,
  ShieldAlert,
  X,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { cn } from '@/lib/utils'

function LogoCompact() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-dark text-brand-light shadow-[0_10px_18px_rgba(18,78,102,0.4)]">
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

  if (role === 'worker') {
    return [
      { to: '/worker', label: 'Home', end: true, icon: LayoutDashboard },
      { to: '/worker/shifts', label: 'My shifts', end: true, icon: ClipboardCheck },
      { to: '/worker/grievances', label: 'Report issue', end: true, icon: AlertTriangle },
      { to: '/worker/certificate', label: 'Earnings letter', end: true, icon: FileCheck2 },
      { to: '/worker/benchmark', label: 'Pay vs city', end: true, icon: BarChart3 },
      { to: '/community', label: 'Community', end: false, icon: MessageCircle },
    ]
  }

  if (role === 'verifier') {
    return [
      { to: '/verifier', label: 'Overview', end: true, icon: LayoutDashboard },
      { to: '/verifier/queue', label: 'Queue', end: true, icon: ClipboardCheck },
      {
        to: '/verifier/vulnerability',
        label: 'Risk flags',
        end: true,
        icon: ShieldAlert,
      },
      { to: '/verifier/grievances', label: 'Grievances', end: true, icon: AlertTriangle },
      { to: '/community', label: 'Community', end: false, icon: MessageCircle },
    ]
  }

  if (role === 'advocate' || role === 'analyst') {
    const basePath = role === 'analyst' ? '/analyst' : '/advocate'

    return [
      { to: basePath, label: 'Dashboard', end: true, icon: LayoutDashboard },
      { to: `${basePath}/monitoring`, label: 'Monitoring', end: true, icon: Activity },
      { to: `${basePath}/grievances`, label: 'Grievances', end: true, icon: AlertTriangle },
      { to: `${basePath}/benchmarks`, label: 'Benchmarks', end: true, icon: BarChart3 },
      { to: `${basePath}/certificates`, label: 'Certificates', end: true, icon: FileCheck2 },
      { to: '/community?tab=moderate', label: 'Community', end: false, icon: MessageCircle },
    ]
  }

  const homePath = role === 'analyst' ? '/analyst' : role ? `/${role}` : '/'

  return [
    { to: homePath, label: 'Home', end: true, icon: Home },
    { to: '/community', label: 'Community', end: false, icon: MessageCircle },
  ]
}

const navLinkClass = ({ isActive }) =>
  cn(
    'group relative flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 touch-manipulation md:min-h-0 md:py-3',
    isActive
      ? 'bg-gradient-to-r from-brand-primary to-brand-dark text-brand-light shadow-[0_10px_18px_rgba(18,78,102,0.35)] ring-1 ring-white/20'
      : 'text-brand-light/75 hover:bg-white/10 hover:text-white hover:ring-1 hover:ring-white/15'
  )

function SidebarFooter({ profileName, role, onLogout }) {
  return (
    <div className="mt-auto border-t border-white/10 p-4">
      <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
        <p className="truncate text-xs font-semibold text-brand-light/85">{profileName || 'Signed in'}</p>
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-brand-light/45">
          {role || '—'}
        </p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-3 w-full min-h-[44px] rounded-xl border border-white/25 bg-white/[0.02] py-2.5 text-xs font-bold uppercase tracking-wider text-brand-light transition-all duration-200 hover:bg-white/10 hover:shadow-md touch-manipulation"
      >
        Log out
      </button>
    </div>
  )
}

function SidebarNav({ navItems, onNavigate }) {
  return (
    <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3" aria-label="Main navigation">
      {navItems.map((item) => (
        <NavLink
          key={`${item.to}-${item.label}`}
          to={item.to}
          end={item.end}
          className={navLinkClass}
          onClick={() => onNavigate?.()}
        >
          {({ isActive }) => (
            <>
              <item.icon className="h-5 w-5 shrink-0 opacity-95 transition-transform duration-200 group-hover:scale-105" strokeWidth={2} aria-hidden />
              <span>{item.label}</span>
              <span
                className={cn(
                  'ml-auto h-1.5 w-1.5 rounded-full bg-current transition-opacity duration-200',
                  isActive ? 'opacity-100' : 'opacity-0'
                )}
              />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShellLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const role = useAuthStore((s) => s.profile?.role)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navItems = useNavItems()

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

  return (
    <div className="min-h-screen bg-brand-light">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-brand-dark/70 bg-gradient-to-r from-brand-darkest via-brand-darkest to-brand-dark px-3 text-brand-light shadow-lg md:hidden">
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
          'fixed inset-y-0 left-0 z-50 flex w-[min(19rem,88vw)] flex-col border-r border-white/10 bg-gradient-to-b from-brand-darkest to-[#18222a] shadow-2xl transition-transform duration-200 ease-out md:hidden',
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
        <SidebarNav navItems={navItems} onNavigate={() => setMobileOpen(false)} />
        <SidebarFooter profileName={profile?.full_name} role={role} onLogout={logout} />
      </aside>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-gradient-to-b from-brand-darkest to-[#18222a] md:flex">
        <div className="border-b border-white/10 p-4">
          <LogoCompact />
        </div>
        <SidebarNav navItems={navItems} />
        <SidebarFooter profileName={profile?.full_name} role={role} onLogout={logout} />
      </aside>

      <div className="min-h-screen md:ml-64">
        <Outlet />
      </div>
    </div>
  )
}
