import { cn } from '@/lib/utils'

const VerifierSectionCard = ({ id, kicker, title, description, actions, className, children }) => {
  return (
    <section
      id={id}
      className={cn(
        'rounded-2xl border border-brand-muted/40 bg-brand-light/85 p-5 shadow-[0_14px_35px_rgba(46,57,68,0.16)] backdrop-blur-sm',
        className
      )}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          {kicker ? <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">{kicker}</p> : null}
          <h2 className="mt-1 text-xl font-bold text-brand-darkest">{title}</h2>
          {description ? <p className="mt-1 text-sm text-brand-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

export default VerifierSectionCard
