import { cn } from '@/lib/utils'

const WorkerSectionCard = ({
  title,
  description,
  kicker,
  actions,
  className,
  contentClassName,
  children,
}) => {
  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-brand-muted/40 bg-gradient-to-b from-brand-light/95 to-brand-light/82 p-5 shadow-[0_14px_36px_rgba(33,42,49,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(33,42,49,0.22)] sm:p-6',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary/70 via-brand-dark/45 to-transparent"
      />

      {(title || description || actions || kicker) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {kicker ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                {kicker}
              </p>
            ) : null}
            {title ? <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-darkest">{title}</h2> : null}
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-dark/90">{description}</p>
            ) : null}
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}

      <div className={cn('space-y-4', contentClassName)}>{children}</div>
    </article>
  )
}

export default WorkerSectionCard
