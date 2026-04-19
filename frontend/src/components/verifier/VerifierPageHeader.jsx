import { cn } from '@/lib/utils'

const VerifierPageHeader = ({ badge, title, description, actions, className }) => {
  return (
    <header
      className={cn(
        'rounded-2xl border border-brand-darkest/8 bg-white/70 px-4 py-5 shadow-[0_1px_0_rgba(46,57,68,0.04)] backdrop-blur-sm sm:px-5',
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {badge ? (
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" aria-hidden="true" />
              {badge}
            </p>
          ) : null}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-darkest sm:text-[1.65rem] sm:leading-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}

export default VerifierPageHeader
