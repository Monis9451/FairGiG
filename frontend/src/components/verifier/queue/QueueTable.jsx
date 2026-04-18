import { Image as ImageIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { badgeClassByStatus, parseApiError } from '@/features/verifier/utils'
import { formatCurrency, formatDate } from '@/utils/formatters'

const QueueTable = ({
  items,
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
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-brand-muted/35 bg-brand-light/70">
      {isLoading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`queue-skeleton-${index}`} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="p-4 text-sm text-brand-muted">{parseApiError(error)}</p>
      ) : items.length === 0 ? (
        <p className="p-4 text-sm text-brand-muted">No shift logs match current filters.</p>
      ) : (
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-[1120px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-brand-darkest text-brand-light">
              <tr className="text-left text-xs uppercase tracking-wide">
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-3 py-3 font-semibold">Worker</th>
                <th className="px-3 py-3 font-semibold">Platform</th>
                <th className="px-3 py-3 font-semibold">Hours</th>
                <th className="px-3 py-3 font-semibold">Net</th>
                <th className="px-3 py-3 font-semibold">Screenshot</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Note</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const rowBusy = isRowBusy(item.id)
                const isPending = item.status === 'pending'

                return (
                  <tr
                    key={item.id}
                    className={`align-top transition-colors hover:bg-brand-primary/10 ${
                      index % 2 === 0 ? 'bg-brand-light/90' : 'bg-brand-light/70'
                    }`}
                  >
                    <td className="px-3 py-3">{formatDate(item.date)}</td>
                    <td className="px-3 py-3 font-mono text-xs">{item.worker_id}</td>
                    <td className="px-3 py-3">{item.platform}</td>
                    <td className="px-3 py-3">{Number(item.hours_worked || 0).toFixed(2)}</td>
                    <td className="px-3 py-3">{formatCurrency(item.net_received)}</td>
                    <td className="px-3 py-3">
                      {item.screenshot_url ? (
                        <div className="space-y-2">
                          <a
                            href={item.screenshot_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary underline-offset-2 hover:underline"
                          >
                            <ImageIcon size={13} aria-hidden="true" />
                            Open image
                          </a>
                          <img
                            src={item.screenshot_url}
                            alt={`Shift screenshot for ${item.worker_id}`}
                            className="h-16 w-24 rounded-md border border-brand-muted/50 object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-brand-muted">No screenshot</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {isPending ? (
                        <Input
                          placeholder="Required for flag or unverifiable"
                          value={verificationNotes[item.id] || ''}
                          onChange={(event) => onVerificationNoteChange(item.id, event.target.value)}
                          className="h-9"
                        />
                      ) : (
                        <p className="max-w-xs text-xs text-brand-muted">{item.anomaly_explanation || '-'}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isPending ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            className="rounded-lg border border-brand-primary bg-brand-primary px-3 py-1.5 text-xs font-semibold text-brand-light transition-opacity hover:opacity-90"
                            onClick={() => onVerify(item.id)}
                            disabled={rowBusy}
                          >
                            Verify
                          </Button>
                          <Button
                            type="button"
                            className="rounded-lg border border-brand-dark bg-brand-dark px-3 py-1.5 text-xs font-semibold text-brand-light transition-opacity hover:opacity-90"
                            onClick={() => onFlag(item.id)}
                            disabled={rowBusy}
                          >
                            Flag
                          </Button>
                          <Button
                            type="button"
                            className="rounded-lg border border-amber-600/70 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-950 transition-opacity hover:opacity-90"
                            onClick={() => onUnverifiable(item.id)}
                            disabled={rowBusy}
                          >
                            Unverifiable
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-brand-muted">No action</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default QueueTable
