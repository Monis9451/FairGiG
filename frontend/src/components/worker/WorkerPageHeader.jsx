const WorkerPageHeader = ({ badge, title, description, summary, actions }) => {
  return (
    <header className="rounded-2xl border border-brand-muted/40 bg-brand-light/85 p-5 shadow-[0_12px_35px_rgba(46,57,68,0.14)] backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {badge ? (
            <p className="inline-flex rounded-full border border-brand-primary/40 bg-brand-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-darkest">
              {badge}
            </p>
          ) : null}
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-brand-darkest sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-dark sm:text-base">
            {description}
          </p>
          {summary ? <p className="mt-2 text-xs text-brand-muted sm:text-sm">{summary}</p> : null}
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  )
}

export default WorkerPageHeader
