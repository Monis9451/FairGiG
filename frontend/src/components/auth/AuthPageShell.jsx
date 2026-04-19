import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'

export function AuthLogo({ className }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-brand-primary text-brand-light',
        className ?? 'h-9 w-9'
      )}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" fill="none" className="h-[1.125rem] w-[1.125rem]">
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

/**
 * Single-column auth layout: light surface, hairline border, no split panels or gradients.
 */
export function AuthPageShell({ title, description, children, footer }) {
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto w-full max-w-[420px] px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-brand-muted transition-colors hover:text-brand-darkest"
        >
          ← Home
        </Link>

        <div className="mt-6 rounded-xl border border-brand-darkest/10 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          <div className="mb-6 flex items-center gap-3">
            <AuthLogo />
            <span className="text-base font-semibold text-brand-darkest">FairGig</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-brand-darkest">{title}</h1>
          {description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">{description}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  )
}
