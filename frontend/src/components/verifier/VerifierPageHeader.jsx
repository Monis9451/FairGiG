import { cn } from '@/lib/utils'

const VerifierPageHeader = ({ badge, title, description, actions, className }) => {
  return (
    <header
      className={cn(
        'border-b border-brand-darkest/10 pb-6',
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {badge ? (
            <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">{badge}</p>
          ) : null}
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-brand-darkest sm:text-2xl">{title}</h1>
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
