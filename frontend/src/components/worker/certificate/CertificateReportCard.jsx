import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { formatCurrency, formatDate } from '@/utils/formatters'

const filterInputClassName =
  'h-11 rounded-xl border border-brand-primary/35 bg-brand-light/90 shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-brand-primary/30'

const CertificateReportCard = ({
  certificate,
  certificateQuery,
  certificateFilters,
  setCertificateFilters,
  onDownloadCertificateJson,
  onPrintCertificate,
  parseApiError,
}) => {
  return (
    <WorkerSectionCard
      kicker="Reporting"
      title="Certificate Report"
      description="Download or print your verified earnings certificate with date-range control."
      contentClassName="space-y-5"
    >
      <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Date range</p>

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="certificate_from">From (optional)</Label>
            <Input
              id="certificate_from"
              type="date"
              value={certificateFilters.from}
              className={filterInputClassName}
              onChange={(event) =>
                setCertificateFilters((current) => ({ ...current, from: event.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="certificate_to">To (optional)</Label>
            <Input
              id="certificate_to"
              type="date"
              value={certificateFilters.to}
              className={filterInputClassName}
              onChange={(event) =>
                setCertificateFilters((current) => ({ ...current, to: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light shadow-[0_10px_20px_rgba(18,78,102,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:translate-y-0 disabled:opacity-60"
            onClick={() => certificateQuery.refetch()}
            disabled={certificateQuery.isFetching}
          >
            {certificateQuery.isFetching ? 'Refreshing...' : 'Refresh Certificate'}
          </Button>

          <Button
            type="button"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-light/80 disabled:translate-y-0 disabled:opacity-60"
            onClick={onDownloadCertificateJson}
            disabled={!certificate || certificateQuery.isLoading}
          >
            Download JSON
          </Button>

          <Button
            type="button"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-light/80 disabled:translate-y-0 disabled:opacity-60"
            onClick={onPrintCertificate}
            disabled={!certificate || certificateQuery.isLoading}
          >
            Print Certificate
          </Button>
        </div>
      </div>

      {certificateQuery.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-56 rounded-lg" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`certificate-summary-skeleton-${index}`} className="h-20 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      ) : certificateQuery.isError ? (
        <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
          {parseApiError(certificateQuery.error)}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <p>
                <span className="font-semibold">Worker:</span> {certificate?.worker?.full_name || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">City:</span> {certificate?.worker?.city_zone || 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-brand-muted/35 bg-gradient-to-br from-brand-primary/15 to-brand-light p-3.5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Verified Logs</p>
              <p className="mt-2 text-xl font-bold text-brand-darkest">
                {certificate?.summary?.total_verified_logs || 0}
              </p>
            </div>
            <div className="rounded-xl border border-brand-muted/35 bg-gradient-to-br from-brand-darkest/10 to-brand-light p-3.5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Total Hours</p>
              <p className="mt-2 text-xl font-bold text-brand-darkest">
                {Number(certificate?.summary?.total_hours || 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-xl border border-brand-muted/35 bg-gradient-to-br from-brand-muted/28 to-brand-light p-3.5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Total Deductions</p>
              <p className="mt-2 text-xl font-bold text-brand-darkest">
                {formatCurrency(certificate?.summary?.total_deductions || 0)}
              </p>
            </div>
            <div className="rounded-xl border border-brand-muted/35 bg-gradient-to-br from-brand-primary/22 to-brand-light p-3.5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Total Net</p>
              <p className="mt-2 text-xl font-bold text-brand-darkest">
                {formatCurrency(certificate?.summary?.total_net || 0)}
              </p>
            </div>
          </div>

          {Array.isArray(certificate?.logs) && certificate.logs.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-brand-muted/35 bg-brand-light/75">
              <div className="max-h-[460px] overflow-auto">
                <table className="min-w-[680px] border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-brand-darkest text-brand-light">
                    <tr className="text-left text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Platform</th>
                      <th className="px-4 py-3 font-semibold">Hours</th>
                      <th className="px-4 py-3 font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificate.logs.slice(0, 20).map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-b border-brand-muted/25 transition-colors hover:bg-brand-primary/10 ${
                          index % 2 === 0 ? 'bg-brand-light/90' : 'bg-brand-light/70'
                        }`}
                      >
                        <td className="px-4 py-3 text-brand-darkest">{formatDate(item.date)}</td>
                        <td className="px-4 py-3 text-brand-darkest">{item.platform}</td>
                        <td className="px-4 py-3 text-brand-darkest">{Number(item.hours_worked || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 font-semibold text-brand-darkest">{formatCurrency(item.net_received)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
              No verified logs available for this range.
            </p>
          )}
        </div>
      )}
    </WorkerSectionCard>
  )
}

export default CertificateReportCard
