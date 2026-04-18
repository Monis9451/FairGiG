import { Skeleton } from '@/components/ui/skeleton'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { formatDate } from '@/utils/formatters'

const GrievanceListCard = ({ grievancesQuery, grievanceItems, parseApiError, badgeClassByStatus }) => {
  return (
    <WorkerSectionCard
      kicker="Tracking"
      title="My Recent Grievances"
      description="Monitor submitted issues, status changes, and key metadata at a glance."
      contentClassName="space-y-0"
    >
      {grievancesQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`grievance-skeleton-${index}`} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : grievancesQuery.isError ? (
        <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
          {parseApiError(grievancesQuery.error)}
        </p>
      ) : grievanceItems.length === 0 ? (
        <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
          No grievances submitted yet.
        </p>
      ) : (
        <div className="space-y-3">
          {grievanceItems.slice(0, 12).map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-brand-muted/35 bg-brand-light/80 px-4 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(33,42,49,0.14)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-brand-darkest sm:text-base">{item.category}</p>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
                >
                  {item.status}
                </span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-brand-dark">{item.description}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                <span>{item.platform}</span>
                <span>•</span>
                <span>{formatDate(item.created_at)}</span>
              </div>

              {Array.isArray(item.tags) && item.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.slice(0, 4).map((tag) => (
                    <span
                      key={`${item.id}-${tag}`}
                      className="rounded-full border border-brand-muted/45 bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-dark"
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
