import { Skeleton } from '@/components/ui/skeleton'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { formatDate } from '@/utils/formatters'

const GrievanceListCard = ({ grievancesQuery, grievanceItems, parseApiError, badgeClassByStatus }) => {
  return (
    <WorkerSectionCard title="My Recent Grievances">
      {grievancesQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`grievance-skeleton-${index}`} className="h-20 w-full" />
          ))}
        </div>
      ) : grievancesQuery.isError ? (
        <p className="text-sm text-brand-muted">{parseApiError(grievancesQuery.error)}</p>
      ) : grievanceItems.length === 0 ? (
        <p className="text-sm text-brand-muted">No grievances submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {grievanceItems.slice(0, 8).map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-brand-muted/40 bg-brand-light px-3 py-3"
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
              {Array.isArray(item.tags) && item.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.tags.slice(0, 4).map((tag) => (
                    <span
                      key={`${item.id}-${tag}`}
                      className="rounded-full border border-brand-muted/50 px-2 py-0.5 text-xs text-brand-dark"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </WorkerSectionCard>
  )
}

export default GrievanceListCard
