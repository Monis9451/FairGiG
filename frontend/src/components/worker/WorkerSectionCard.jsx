const WorkerSectionCard = ({ title, description, children }) => {
  return (
    <article className="rounded-2xl border border-brand-muted/40 bg-brand-light/85 p-5 shadow-[0_12px_30px_rgba(46,57,68,0.14)] backdrop-blur-sm">
      <h2 className="text-lg font-semibold text-brand-darkest">{title}</h2>
      {description ? <p className="mb-4 mt-1 text-sm text-brand-muted">{description}</p> : null}
      {children}
    </article>
  )
}

export default WorkerSectionCard
