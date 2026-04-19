import { Loader2 } from 'lucide-react'

import EarningsCertificateDocument from '@/components/worker/certificate/EarningsCertificateDocument'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const filterInputClassName =
  'h-11 rounded-lg border border-brand-muted/40 bg-white text-base shadow-sm transition-colors focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/25 sm:text-sm'

const CertificateReportCard = ({
  certificate,
  certificateQuery,
  certificateFilters,
  setCertificateFilters,
  onDownloadCertificateJson,
  onPrintCertificate,
  parseApiError,
}) => {
  const hasData = Boolean(certificate)
  const showPreviewSkeleton = certificateQuery.isLoading
  const showRefetchOverlay = certificateQuery.isFetching && hasData

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-brand-muted/25 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-brand-darkest">Date range</h2>
        <p className="mt-1 text-sm text-brand-muted">
          The preview and PDF update automatically when you change dates (verified shifts only).
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="certificate_from" className="text-xs font-medium text-brand-dark">
              From (optional)
            </Label>
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
          <div className="space-y-1.5">
            <Label htmlFor="certificate_to" className="text-xs font-medium text-brand-dark">
              To (optional)
            </Label>
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

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            className="h-11 w-full rounded-lg bg-brand-primary font-semibold text-brand-light sm:w-auto sm:min-w-[200px]"
            onClick={onPrintCertificate}
            disabled={!certificate || certificateQuery.isLoading}
          >
            Print / Save as PDF
          </Button>
          <Button
            type="button"
            className="h-11 w-full rounded-lg border-2 border-brand-muted/40 bg-white font-semibold text-brand-darkest sm:w-auto"
            onClick={onDownloadCertificateJson}
            disabled={!certificate || certificateQuery.isLoading}
          >
            Download JSON
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-brand-darkest">Live preview</h2>
            <p className="text-sm text-brand-muted">Matches what you get when you print or save as PDF.</p>
          </div>
          {certificateQuery.isFetching ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Updating…
            </p>
          ) : null}
        </div>

        {certificateQuery.isError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {parseApiError(certificateQuery.error)}
          </p>
        ) : showPreviewSkeleton ? (
          <div className="space-y-3 rounded-2xl border border-brand-muted/25 bg-brand-light/30 p-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid gap-2 sm:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <div className="relative">
            <div
              className={cn(
                'transition-opacity duration-200',
                showRefetchOverlay && 'pointer-events-none opacity-60'
              )}
            >
              <EarningsCertificateDocument
                certificate={certificate}
                previewMaxHeightClass="max-h-[min(560px,60vh)]"
              />
            </div>
            {showRefetchOverlay ? (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/50 backdrop-blur-[1px]"
                role="status"
                aria-live="polite"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-white px-4 py-2 text-sm font-semibold text-brand-darkest shadow-md">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-primary" aria-hidden />
                  Refreshing statement…
                </span>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}

export default CertificateReportCard
