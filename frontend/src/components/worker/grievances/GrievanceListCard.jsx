import { useEffect, useMemo, useState } from 'react'

import SimplePagination from '@/components/ui/SimplePagination'
import { Skeleton } from '@/components/ui/skeleton'
import { sortGrievancesNewestFirst } from '@/features/worker/utils'
import { formatDate } from '@/utils/formatters'

const PAGE_SIZE = 10

const GrievanceListCard = ({ grievancesQuery, grievanceItems, parseApiError, badgeClassByStatus }) => {
  const [page, setPage] = useState(1)
  const sorted = useMemo(() => sortGrievancesNewestFirst(grievanceItems), [grievanceItems])
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageSafe = Math.min(Math.max(1, page), totalPages)

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const rows = useMemo(
    () => sorted.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [sorted, pageSafe]
  )

  return (
    <section className="rounded-2xl border border-brand-muted/25 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-brand-darkest">Your reports</h2>
      <p className="mt-1 text-sm text-brand-muted">Newest first — 10 per page.</p>

      <div className="mt-4 space-y-3">
        {grievancesQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`grievance-skeleton-${index}`} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : grievancesQuery.isError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {parseApiError(grievancesQuery.error)}
          </p>
        ) : sorted.length === 0 ? (
          <p className="rounded-lg border border-dashed border-brand-muted/40 bg-brand-light/30 px-3 py-6 text-center text-sm text-brand-muted">
            No reports yet. Use &quot;New report&quot; to submit an issue.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {rows.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-brand-muted/20 bg-brand-light/25 px-3 py-3 sm:px-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-brand-darkest sm:text-base">{item.category}</p>
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-brand-dark">{item.description}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-brand-muted">
                    <span>{item.platform}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>

                  {Array.isArray(item.tags) && item.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.tags.slice(0, 6).map((tag) => (
                        <span
                          key={`${item.id}-${tag}`}
                          className="rounded-full border border-brand-muted/35 bg-white px-2 py-0.5 text-[11px] font-medium text-brand-dark"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>

            <SimplePagination
              page={pageSafe}
              totalPages={totalPages}
              totalItems={sorted.length}
              pageSize={PAGE_SIZE}
              itemLabel="reports"
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </>
        )}
      </div>
    </section>
  )
}

export default GrievanceListCard
