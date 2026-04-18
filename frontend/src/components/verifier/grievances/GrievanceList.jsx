import { Skeleton } from '@/components/ui/skeleton'
import { badgeClassByStatus, parseApiError } from '@/features/verifier/utils'
import { formatDate } from '@/utils/formatters'

const GrievanceList = ({ items, isLoading, isError, error }) => {
  if (isLoading) {
    return (
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`grievance-skeleton-${index}`} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <p className="mt-3 text-sm text-brand-muted">{parseApiError(error)}</p>
  }

  if (items.length === 0) {
    return (
      <p className="mt-3 rounded-xl border border-brand-muted/35 bg-brand-light/70 p-3 text-sm text-brand-muted">
        No grievances found for these filters.
      </p>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-3 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold text-brand-darkest">{item.category}</p>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
            >
              {item.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-brand-dark">{item.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
            <span>{item.platform}</span>
            <span>•</span>
            <span>{formatDate(item.created_at)}</span>
          </div>
          <p className="mt-1 font-mono text-xs text-brand-muted">Worker: {item.worker_id}</p>
        </article>
      ))}
    </div>
  )
}

export default GrievanceList
