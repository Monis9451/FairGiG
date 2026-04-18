import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { cn } from '@/lib/utils'

function LogoMark({ className }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-brand-light shadow-md shadow-brand-primary/25',
        className
      )}
    >
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
  )
}

export function DashboardHeader({ title, subtitle, backHref, backLabel = 'Dashboard' }) {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-dark/80 bg-brand-darkest/95 text-brand-light backdrop-blur-md supports-[backdrop-filter]:bg-brand-darkest/90">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <LogoMark />
          <div className="min-w-0 py-0.5">
            <h1 className="truncate text-base font-extrabold leading-tight tracking-tight sm:text-lg md:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="line-clamp-2 text-[11px] leading-snug text-brand-light/75 sm:line-clamp-1 sm:text-xs md:text-sm">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto sm:justify-start sm:gap-2.5">
          {backHref ? (
            <Link
              to={backHref}
              className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full border border-brand-light/40 px-4 text-xs font-semibold text-brand-light transition-colors hover:bg-brand-light/10 active:scale-[0.98] sm:min-h-0 sm:min-w-0 sm:px-4 sm:text-sm"
            >
              {backLabel}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-[44px] touch-manipulation items-center justify-center rounded-full border-2 border-brand-light/80 px-4 text-[10px] font-bold uppercase tracking-wider text-brand-light transition-colors hover:bg-brand-light hover:text-brand-darkest active:scale-[0.98] sm:min-h-0 sm:px-4 sm:text-xs md:text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
