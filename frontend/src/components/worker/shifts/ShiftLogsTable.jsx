import { Skeleton } from '@/components/ui/skeleton'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { formatCurrency, formatDate } from '@/utils/formatters'

const ShiftLogsTable = ({ shiftLogsQuery, shiftItems, parseApiError, badgeClassByStatus }) => {
  return (
    <WorkerSectionCard title="Recent Shift Logs">
      {shiftLogsQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`shift-log-skeleton-${index}`} className="h-12 w-full" />
          ))}
        </div>
      ) : shiftLogsQuery.isError ? (
        <p className="text-sm text-brand-muted">{parseApiError(shiftLogsQuery.error)}</p>
      ) : shiftItems.length === 0 ? (
        <p className="text-sm text-brand-muted">No shift logs yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-muted/50 text-left text-brand-muted">
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">Platform</th>
                <th className="px-3 py-2 font-semibold">Hours</th>
                <th className="px-3 py-2 font-semibold">Net</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {shiftItems.slice(0, 12).map((item) => (
                <tr key={item.id} className="border-b border-brand-muted/30">
                  <td className="px-3 py-2">{formatDate(item.date)}</td>
                  <td className="px-3 py-2">{item.platform}</td>
                  <td className="px-3 py-2">{Number(item.hours_worked || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">{formatCurrency(item.net_received)}</td>
                  <td className="px-3 py-2">
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
      )}
    </WorkerSectionCard>
  )
}

export default ShiftLogsTable
