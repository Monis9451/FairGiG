import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/utils/formatters'

const ShiftLogsTable = ({ shiftLogsQuery, shiftItems, parseApiError, badgeClassByStatus }) => {
  const rows = shiftItems.slice(0, 25)

  return (
    <section className="rounded-2xl border border-brand-muted/25 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-brand-darkest">Your shifts</h2>
      <p className="mt-1 text-sm text-brand-muted">Latest submissions and verification status.</p>

      <div className="mt-4">
        {shiftLogsQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full rounded-lg" />
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={`shift-log-skeleton-${index}`} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : shiftLogsQuery.isError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {parseApiError(shiftLogsQuery.error)}
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-brand-muted/40 bg-brand-light/30 px-3 py-6 text-center text-sm text-brand-muted">
            No shifts yet. Add one above or import a CSV.
          </p>
        ) : (
          <>
            <ul className="space-y-2 md:hidden">
              {rows.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-brand-muted/20 bg-brand-light/25 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-brand-darkest">{formatDate(item.date)}</p>
                      <p className="text-sm text-brand-muted">{item.platform}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm tabular-nums">
                    <span className="text-brand-muted">
                      {Number(item.hours_worked || 0).toFixed(1)} h
                    </span>
                    <span className="font-semibold text-brand-darkest">
                      {formatCurrency(item.net_received)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-hidden rounded-xl border border-brand-muted/20 md:block">
              <div className="max-h-[480px] overflow-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-brand-darkest text-brand-light">
                    <tr className="text-left text-xs uppercase tracking-wide">
                      <th className="px-3 py-2.5 font-semibold">Date</th>
                      <th className="px-3 py-2.5 font-semibold">Platform</th>
                      <th className="px-3 py-2.5 font-semibold">Hours</th>
                      <th className="px-3 py-2.5 font-semibold">Net</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-b border-brand-muted/15 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-brand-light/20'
                        }`}
                      >
                        <td className="px-3 py-2.5 font-medium text-brand-darkest">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-3 py-2.5 text-brand-darkest">{item.platform}</td>
                        <td className="px-3 py-2.5 tabular-nums text-brand-darkest">
                          {Number(item.hours_worked || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 font-semibold tabular-nums text-brand-darkest">
                          {formatCurrency(item.net_received)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
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
          </>
        )}
      </div>
    </section>
  )
}

export default ShiftLogsTable
