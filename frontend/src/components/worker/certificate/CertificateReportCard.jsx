import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { formatCurrency, formatDate } from '@/utils/formatters'

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
      title="Certificate Report"
      description="Download or print your verified earnings certificate."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="certificate_from">From (optional)</Label>
          <Input
            id="certificate_from"
            type="date"
            value={certificateFilters.from}
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
            onChange={(event) =>
              setCertificateFilters((current) => ({ ...current, to: event.target.value }))
            }
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
          onClick={() => certificateQuery.refetch()}
          disabled={certificateQuery.isFetching}
        >
          {certificateQuery.isFetching ? 'Refreshing...' : 'Refresh Certificate'}
        </Button>

        <Button
          type="button"
          className="rounded-md border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
          onClick={onDownloadCertificateJson}
          disabled={!certificate || certificateQuery.isLoading}
        >
          Download JSON
        </Button>

        <Button
          type="button"
          className="rounded-md border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
          onClick={onPrintCertificate}
          disabled={!certificate || certificateQuery.isLoading}
        >
          Print Certificate
        </Button>
      </div>

      {certificateQuery.isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-6 w-56" />
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`certificate-summary-skeleton-${index}`} className="h-16 w-full" />
            ))}
          </div>
          <Skeleton className="h-44 w-full" />
        </div>
      ) : certificateQuery.isError ? (
        <p className="mt-4 text-sm text-brand-muted">{parseApiError(certificateQuery.error)}</p>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3 text-sm">
            <p>
              <span className="font-medium">Worker:</span> {certificate?.worker?.full_name || 'N/A'}
            </p>
            <p>
              <span className="font-medium">City:</span> {certificate?.worker?.city_zone || 'N/A'}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Verified Logs</p>
              <p className="mt-2 text-xl font-bold">{certificate?.summary?.total_verified_logs || 0}</p>
            </div>
            <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Total Hours</p>
              <p className="mt-2 text-xl font-bold">
                {Number(certificate?.summary?.total_hours || 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Total Deductions</p>
              <p className="mt-2 text-xl font-bold">
                {formatCurrency(certificate?.summary?.total_deductions || 0)}
              </p>
            </div>
            <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Total Net</p>
              <p className="mt-2 text-xl font-bold">{formatCurrency(certificate?.summary?.total_net || 0)}</p>
            </div>
          </div>

          {Array.isArray(certificate?.logs) && certificate.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-brand-muted/50 text-left text-brand-muted">
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Platform</th>
                    <th className="px-3 py-2 font-semibold">Hours</th>
                    <th className="px-3 py-2 font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {certificate.logs.slice(0, 8).map((item) => (
                    <tr key={item.id} className="border-b border-brand-muted/30">
                      <td className="px-3 py-2">{formatDate(item.date)}</td>
                      <td className="px-3 py-2">{item.platform}</td>
                      <td className="px-3 py-2">{Number(item.hours_worked || 0).toFixed(2)}</td>
                      <td className="px-3 py-2">{formatCurrency(item.net_received)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-brand-muted">No verified logs available for this range.</p>
          )}
        </div>
      )}
    </WorkerSectionCard>
  )
}

export default CertificateReportCard
