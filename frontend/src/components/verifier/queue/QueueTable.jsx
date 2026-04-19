import { Image as ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { workerPrimaryLabel } from '@/features/verifier/workerDisplay'
import { badgeClassByStatus, parseApiError } from '@/features/verifier/utils'
import { formatCurrency, formatDate } from '@/utils/formatters'

const actionRowClass = 'flex min-h-[2.75rem] flex-1 items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold sm:flex-none'

const QueueTable = ({
  items,
  pagination,
  isLoading,
  isError,
  error,
  verificationNotes,
  onVerificationNoteChange,
  onVerify,
  onFlag,
  onUnverifiable,
  isRowBusy,
}) => {
  const renderRowActions = (item) => {
    const rowBusy = isRowBusy(item.id)
    const isPending = item.status === 'pending'

    if (!isPending) {
      return <span className="text-xs text-brand-muted">No action</span>
    }

    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          className={`${actionRowClass} border border-brand-primary bg-brand-primary text-brand-light hover:opacity-90`}
          onClick={() => onVerify(item.id)}
          disabled={rowBusy}
        >
          Verify
        </Button>
        <Button
          type="button"
          className={`${actionRowClass} border border-brand-dark bg-brand-dark text-brand-light hover:opacity-90`}
          onClick={() => onFlag(item.id)}
          disabled={rowBusy}
        >
          Flag
        </Button>
        <Button
          type="button"
          className={`${actionRowClass} border border-amber-600/50 bg-amber-50 text-amber-950 hover:bg-amber-100`}
          onClick={() => onUnverifiable(item.id)}
          disabled={rowBusy}
        >
          Unverifiable
        </Button>
      </div>
    )
  }

  const renderNoteCell = (item) => {
    const isPending = item.status === 'pending'

    if (isPending) {
      return (
        <Input
          placeholder="Required for flag / unverifiable"
          value={verificationNotes[item.id] || ''}
          onChange={(event) => onVerificationNoteChange(item.id, event.target.value)}
          className="h-10 rounded-lg border-brand-darkest/15 text-sm"
        />
      )
    }

    return <p className="max-w-xs text-xs text-brand-muted">{item.anomaly_explanation || '—'}</p>
  }

  const renderScreenshot = (item, compact) => {
    if (!item.screenshot_url) {
      return <span className="text-xs text-brand-muted">No screenshot</span>
    }

    return (
      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        <a
          href={item.screenshot_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary underline-offset-2 hover:underline"
        >
          <ImageIcon size={13} aria-hidden="true" />
          Open
        </a>
        {!compact ? (
          <img
            src={item.screenshot_url}
            alt={`Shift screenshot for ${item.worker_id}`}
            className="h-16 w-24 rounded-md border border-brand-darkest/10 object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-5">
      {isLoading ? (
        <div className="space-y-2 rounded-xl border border-brand-darkest/10 bg-white p-4">
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`queue-skeleton-${index}`} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-brand-darkest/10 bg-white p-4 text-sm text-brand-muted">
          {parseApiError(error)}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-brand-darkest/15 bg-brand-light/30 p-4 text-sm text-brand-muted">
          No shift logs match these filters.
        </p>
      ) : (
        <>
          {pagination?.total != null ? (
            <p className="mb-3 text-xs text-brand-muted">
              Showing{' '}
              <span className="font-medium text-brand-darkest tabular-nums">
                {pagination.offset + 1}–{pagination.offset + items.length}
              </span>{' '}
              of{' '}
              <span className="font-medium text-brand-darkest tabular-nums">{pagination.total}</span> matching
              shifts
            </p>
          ) : null}
          <ul className="space-y-3 md:hidden">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-brand-darkest/10 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-brand-darkest">{formatDate(item.date)}</p>
                    <p className="mt-0.5 text-sm font-medium text-brand-darkest">{workerPrimaryLabel(item)}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-brand-muted" title={item.worker_id}>
                      {item.worker_id}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-brand-muted">Platform</p>
                    <p className="font-medium text-brand-darkest">{item.platform}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-brand-muted">Hours</p>
                    <p className="font-medium tabular-nums text-brand-darkest">
                      {Number(item.hours_worked || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] uppercase tracking-wide text-brand-muted">Net</p>
                    <p className="font-semibold tabular-nums text-brand-darkest">
                      {formatCurrency(item.net_received)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 border-t border-brand-darkest/10 pt-3">{renderScreenshot(item, true)}</div>
                <div className="mt-3 border-t border-brand-darkest/10 pt-3">{renderNoteCell(item)}</div>
                <div className="mt-3 border-t border-brand-darkest/10 pt-3">{renderRowActions(item)}</div>
              </li>
            ))}
          </ul>

          <div className="hidden md:block overflow-hidden rounded-xl border border-brand-darkest/10 bg-white shadow-sm">
            <div className="max-h-[560px] overflow-auto">
              <table className="min-w-[920px] w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 border-b border-brand-darkest/10 bg-brand-light/95 backdrop-blur-sm">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Worker</th>
                    <th className="px-3 py-3">Platform</th>
                    <th className="px-3 py-3">Hours</th>
                    <th className="px-3 py-3">Net</th>
                    <th className="px-3 py-3">Screenshot</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="min-w-[200px] px-3 py-3">Note</th>
                    <th className="min-w-[220px] px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`align-top border-b border-brand-darkest/8 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-brand-light/25'
                      }`}
                    >
                      <td className="px-3 py-3 text-brand-darkest">{formatDate(item.date)}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-brand-darkest">{workerPrimaryLabel(item)}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-brand-muted" title={item.worker_id}>
                          {item.worker_id}
                        </p>
                      </td>
                      <td className="px-3 py-3">{item.platform}</td>
                      <td className="px-3 py-3 tabular-nums">{Number(item.hours_worked || 0).toFixed(2)}</td>
                      <td className="px-3 py-3 tabular-nums font-medium">{formatCurrency(item.net_received)}</td>
                      <td className="px-3 py-3">{renderScreenshot(item, false)}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">{renderNoteCell(item)}</td>
                      <td className="px-3 py-3">{renderRowActions(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default QueueTable
