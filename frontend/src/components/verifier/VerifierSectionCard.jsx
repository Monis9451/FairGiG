import { cn } from '@/lib/utils'

const VerifierSectionCard = ({ id, kicker, title, description, actions, className, children }) => {
  return (
    <section
      id={id}
      className={cn(
        'rounded-2xl border border-brand-darkest/10 bg-white/90 p-4 shadow-[0_1px_0_rgba(46,57,68,0.05)] sm:p-5',
        className
      )}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {kicker ? (
            <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">{kicker}</p>
          ) : null}
          <h2 className="mt-0.5 text-base font-semibold text-brand-darkest sm:text-lg">{title}</h2>
          {description ? <p className="mt-1 text-sm text-brand-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

export default VerifierSectionCard
