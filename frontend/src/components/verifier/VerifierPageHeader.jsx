import { cn } from '@/lib/utils'

const VerifierPageHeader = ({ badge, title, description, actions, className }) => {
  return (
    <header
      className={cn(
        'rounded-2xl border border-brand-muted/40 bg-brand-light/80 p-5 shadow-[0_12px_35px_rgba(46,57,68,0.18)] backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {badge ? (
            <p className="inline-flex rounded-full border border-brand-primary/40 bg-brand-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-darkest">
              {badge}
            </p>
          ) : null}
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-brand-darkest sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-dark sm:text-base">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}

export default VerifierPageHeader
