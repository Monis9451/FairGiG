const WorkerPageHeader = ({ badge, title, description, summary, actions }) => {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-brand-muted/40 bg-gradient-to-br from-brand-light via-brand-light/95 to-brand-primary/10 p-5 shadow-[0_16px_40px_rgba(33,42,49,0.2)] sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-primary/15 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-brand-dark/10 blur-2xl"
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="relative z-10">
          {badge ? (
            <p className="inline-flex rounded-full border border-brand-primary/35 bg-brand-light/85 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary shadow-sm">
              {badge}
            </p>
          ) : null}
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-brand-darkest sm:text-3xl lg:text-[2rem]">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-dark/90 sm:text-base">
            {description}
          </p>
          {summary ? (
            <p className="mt-3 rounded-xl border border-brand-muted/35 bg-brand-light/70 px-3 py-2 text-xs text-brand-muted sm:text-sm">
              {summary}
            </p>
          ) : null}
        </div>

        {actions ? <div className="relative z-10 shrink-0">{actions}</div> : null}
      </div>
    </header>
  )
}

export default WorkerPageHeader
