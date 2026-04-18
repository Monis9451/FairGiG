import { Skeleton } from '@/components/ui/skeleton'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { formatCurrency, formatDate } from '@/utils/formatters'

const ShiftLogsTable = ({ shiftLogsQuery, shiftItems, parseApiError, badgeClassByStatus }) => {
  return (
    <WorkerSectionCard
      kicker="History"
      title="Recent Shift Logs"
      description="Review your latest submissions and track verification status in one clean table."
      contentClassName="space-y-0"
    >
      {shiftLogsQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`shift-log-skeleton-${index}`} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : shiftLogsQuery.isError ? (
        <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
          {parseApiError(shiftLogsQuery.error)}
        </p>
      ) : shiftItems.length === 0 ? (
        <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
          No shift logs yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-muted/35 bg-brand-light/75">
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-[720px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-brand-darkest text-brand-light">
                <tr className="text-left text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Platform</th>
                  <th className="px-4 py-3 font-semibold">Hours</th>
                  <th className="px-4 py-3 font-semibold">Net</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {shiftItems.slice(0, 20).map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-brand-muted/25 transition-colors hover:bg-brand-primary/10 ${
                      index % 2 === 0 ? 'bg-brand-light/90' : 'bg-brand-light/70'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-brand-darkest">{formatDate(item.date)}</td>
                    <td className="px-4 py-3 text-brand-darkest">{item.platform}</td>
                    <td className="px-4 py-3 text-brand-darkest">{Number(item.hours_worked || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold text-brand-darkest">{formatCurrency(item.net_received)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </WorkerSectionCard>
  )
}

export default ShiftLogsTable
