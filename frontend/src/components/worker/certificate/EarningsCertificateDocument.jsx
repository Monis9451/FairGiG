import { formatCurrency, formatDate } from '@/utils/formatters'
import { cn } from '@/lib/utils'

const rangeDescription = (filters) => {
  const from = filters?.from ? formatDate(filters.from) : 'Start of your records'
  const to = filters?.to ? formatDate(filters.to) : 'Latest verified shift'
  return `${from} — ${to}`
}

/**
 * Live on-screen certificate / letter layout. Matches print styling (brand colors).
 */
const EarningsCertificateDocument = ({
  certificate,
  className,
  previewMaxHeightClass = 'max-h-[min(520px,55vh)]',
  showFooter = true,
}) => {
  const worker = certificate?.worker || {}
  const summary = certificate?.summary || {}
  const filters = certificate?.filters || {}
  const logs = Array.isArray(certificate?.logs) ? certificate.logs : []

  const issuedLabel = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const statItems = [
    { label: 'Verified shifts', value: String(summary.total_verified_logs ?? 0) },
    { label: 'Total hours', value: Number(summary.total_hours || 0).toFixed(2) },
    { label: 'Total gross', value: formatCurrency(summary.total_gross || 0) },
    { label: 'Total deductions', value: formatCurrency(summary.total_deductions || 0) },
    { label: 'Total net paid', value: formatCurrency(summary.total_net || 0), emphasis: true },
  ]

  return (
    <div
      className={cn(
        'certificate-doc rounded-2xl border-2 border-[#124E66]/25 bg-gradient-to-b from-[#D3D9D4]/40 to-[#D3D9D4]/15 p-4 shadow-inner sm:p-6',
        className
      )}
    >
      <div className="mx-auto max-w-[720px] rounded-xl border border-[#124E66]/20 bg-white shadow-[0_8px_40px_rgba(18,78,102,0.12)]">
        <header className="rounded-t-[10px] bg-[#124E66] px-5 py-4 text-white sm:px-6 sm:py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">FairGig</p>
          <h2 className="mt-1 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            Verified earnings statement
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-white/85 sm:text-sm">
            Income summary from platform shift logs that have been <strong className="font-semibold">verified</strong>{' '}
            in FairGig for the period below.
          </p>
        </header>

        <div className="space-y-5 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-3 border-b border-[#748D92]/25 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#748D92]">Worker</p>
              <p className="mt-1 text-lg font-bold text-[#212A31]">{worker.full_name || '—'}</p>
              <p className="mt-0.5 text-xs text-[#748D92]">
                ID: <span className="font-mono text-[#2E3944]">{worker.id || '—'}</span>
              </p>
              {worker.city_zone ? (
                <p className="mt-1 text-sm text-[#2E3944]">City / zone: {worker.city_zone}</p>
              ) : null}
            </div>
            <div className="rounded-lg border border-[#124E66]/20 bg-[#124E66]/5 px-3 py-2 text-xs sm:text-right">
              <p className="font-semibold text-[#124E66]">Period covered</p>
              <p className="mt-1 text-[#2E3944]">{rangeDescription(filters)}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-[#748D92]">Issued on</p>
              <p className="font-medium text-[#212A31]">{issuedLabel}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#748D92]">Totals (verified only)</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {statItems.map((item) => (
                <li
                  key={item.label}
                  className={cn(
                    'rounded-lg border px-3 py-2.5',
                    item.emphasis
                      ? 'border-[#124E66]/35 bg-[#124E66]/8'
                      : 'border-[#748D92]/20 bg-[#D3D9D4]/15'
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#748D92]">{item.label}</p>
                  <p
                    className={cn(
                      'mt-1 text-base font-bold tabular-nums text-[#212A31]',
                      item.emphasis && 'text-[#124E66]'
                    )}
                  >
                    {item.value}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#748D92]">Shift detail</p>
            {logs.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-[#748D92]/35 bg-[#D3D9D4]/20 px-3 py-6 text-center text-sm text-[#748D92]">
                No verified shifts in this date range.
              </p>
            ) : (
              <div
                className={cn(
                  'mt-3 overflow-auto rounded-lg border border-[#748D92]/20',
                  previewMaxHeightClass
                )}
              >
                <table className="w-full min-w-[560px] border-collapse text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 z-[1] bg-[#212A31] text-[#D3D9D4]">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold uppercase tracking-wide">Date</th>
                      <th className="px-3 py-2.5 font-semibold uppercase tracking-wide">Platform</th>
                      <th className="px-3 py-2.5 font-semibold uppercase tracking-wide">Hours</th>
                      <th className="px-3 py-2.5 font-semibold uppercase tracking-wide">Gross</th>
                      <th className="px-3 py-2.5 font-semibold uppercase tracking-wide">Deductions</th>
                      <th className="px-3 py-2.5 font-semibold uppercase tracking-wide">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((item, index) => (
                      <tr
                        key={item.id}
                        className={cn(
                          'border-b border-[#748D92]/15',
                          index % 2 === 0 ? 'bg-white' : 'bg-[#D3D9D4]/12'
                        )}
                      >
                        <td className="px-3 py-2 text-[#212A31]">{formatDate(item.date)}</td>
                        <td className="px-3 py-2 text-[#2E3944]">{item.platform}</td>
                        <td className="px-3 py-2 tabular-nums text-[#2E3944]">
                          {Number(item.hours_worked || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-[#2E3944]">
                          {formatCurrency(item.gross_earned)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-[#2E3944]">
                          {formatCurrency(item.deductions)}
                        </td>
                        <td className="px-3 py-2 font-semibold tabular-nums text-[#124E66]">
                          {formatCurrency(item.net_received)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {logs.length > 0 ? (
              <p className="mt-2 text-center text-[10px] text-[#748D92] sm:hidden">Scroll sideways for all columns</p>
            ) : null}
          </div>

          {showFooter ? (
            <footer className="border-t border-[#748D92]/20 pt-4 text-[10px] leading-relaxed text-[#748D92] sm:text-xs">
              <p>
                This statement reflects <strong className="font-medium text-[#2E3944]">verified</strong> earnings rows
                stored in FairGig. It is provided for your records and does not replace official tax or legal documents.
                For questions, use Report a problem in the app.
              </p>
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default EarningsCertificateDocument
