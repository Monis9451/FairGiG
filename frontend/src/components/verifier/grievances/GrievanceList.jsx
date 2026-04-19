import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { GRIEVANCE_STATUS_OPTIONS } from '@/features/verifier/constants'
import { badgeClassByStatus, parseApiError } from '@/features/verifier/utils'
import { formatDate } from '@/utils/formatters'

const selectClass =
  'h-10 w-full rounded-lg border border-brand-darkest/15 bg-white px-3 text-sm text-brand-darkest shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25'

const GrievanceCard = ({ item, onSaveStatus, updatingId }) => {
  const [status, setStatus] = useState(item.status)
  const busy = updatingId === item.id

  const dirty = status !== item.status

  return (
    <article className="rounded-xl border border-brand-darkest/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-brand-darkest">{item.category}</p>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
        >
          {item.status}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-brand-dark">{item.description}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
        <span>{item.platform}</span>
        <span aria-hidden="true">•</span>
        <span>{formatDate(item.created_at)}</span>
      </div>
      <p className="mt-2 font-mono text-xs text-brand-muted">Worker: {item.worker_id}</p>

      <div className="mt-4 border-t border-brand-darkest/10 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">Update status</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            id={`grievance_status_${item.id}`}
            className={selectClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={busy}
            aria-label={`Status for grievance ${item.id}`}
          >
            {GRIEVANCE_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Button
            type="button"
            className="h-10 shrink-0 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-brand-light hover:opacity-90 disabled:opacity-50"
            disabled={!dirty || busy}
            onClick={() => onSaveStatus(item.id, status)}
          >
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </article>
  )
}

const GrievanceList = ({ items, isLoading, isError, error, onSaveStatus, updatingId }) => {
  if (isLoading) {
    return (
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`grievance-skeleton-${index}`} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <p className="mt-4 text-sm text-brand-muted">{parseApiError(error)}</p>
  }

  if (items.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-dashed border-brand-darkest/15 bg-brand-light/30 p-4 text-sm text-brand-muted">
        No grievances match these filters.
      </p>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => (
        <GrievanceCard
          key={`${item.id}-${item.status}`}
          item={item}
          onSaveStatus={onSaveStatus}
          updatingId={updatingId}
        />
      ))}
    </div>
  )
}

export default GrievanceList
