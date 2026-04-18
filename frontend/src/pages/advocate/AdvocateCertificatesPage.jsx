import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Printer, RefreshCw } from 'lucide-react'

import { getAdvocateCertificateByWorker } from '@/api/advocate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import WorkerPageHeader from '@/components/worker/WorkerPageHeader'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { useToast } from '@/hooks/useToast'
import { buildCertificatePrintHtml, parseApiError } from '@/features/worker/utils'
import { formatCurrency, formatDate } from '@/utils/formatters'

const actionButtonClass =
  'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'

const AdvocateCertificatesPage = () => {
  const { success: showSuccessToast, error: showErrorToast } = useToast()
  const [lookupDraft, setLookupDraft] = useState({
    workerId: '',
    from: '',
    to: '',
  })
  const [lookup, setLookup] = useState({
    workerId: '',
    from: '',
    to: '',
  })

  const certificateQuery = useQuery({
    queryKey: ['advocate-certificate', lookup.workerId, lookup.from, lookup.to],
    queryFn: () =>
      getAdvocateCertificateByWorker({
        workerId: lookup.workerId,
        from: lookup.from || undefined,
        to: lookup.to || undefined,
      }),
    enabled: Boolean(lookup.workerId),
    staleTime: 30_000,
  })

  const certificate = certificateQuery.data || null

  const runLookup = () => {
    const workerId = lookupDraft.workerId.trim()
    if (!workerId) {
      showErrorToast('Enter a worker ID before searching.')
      return
    }

    setLookup({
      workerId,
      from: lookupDraft.from,
      to: lookupDraft.to,
    })
  }

  const onDownloadCertificateJson = () => {
    if (!certificate) {
      showErrorToast('Certificate data is not available yet.')
      return
    }

    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fairgig-certificate-${lookup.workerId || 'worker'}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const onPrintCertificate = () => {
    if (!certificate) {
      showErrorToast('Load certificate data before printing.')
      return
    }

    const printableHtml = buildCertificatePrintHtml(certificate)
    const printFrame = document.createElement('iframe')
    printFrame.setAttribute('aria-hidden', 'true')
    printFrame.style.position = 'fixed'
    printFrame.style.right = '0'
    printFrame.style.bottom = '0'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    printFrame.style.border = '0'
    document.body.appendChild(printFrame)

    const frameWindow = printFrame.contentWindow
    if (!frameWindow) {
      document.body.removeChild(printFrame)
      showErrorToast('Unable to initialize print view.')
      return
    }

    frameWindow.document.open()
    frameWindow.document.write(printableHtml)
    frameWindow.document.close()

    const cleanUp = () => {
      if (printFrame.parentNode) {
        document.body.removeChild(printFrame)
      }
    }

    const cleanUpTimer = window.setTimeout(cleanUp, 60_000)
    frameWindow.onafterprint = () => {
      window.clearTimeout(cleanUpTimer)
      cleanUp()
    }

    window.setTimeout(() => {
      try {
        frameWindow.focus()
        frameWindow.print()
      } catch {
        window.clearTimeout(cleanUpTimer)
        cleanUp()

        const fallbackBlob = new Blob([printableHtml], { type: 'text/html' })
        const fallbackUrl = URL.createObjectURL(fallbackBlob)
        const fallbackWindow = window.open(fallbackUrl, '_blank')
        window.setTimeout(() => URL.revokeObjectURL(fallbackUrl), 30_000)

        if (!fallbackWindow) {
          showErrorToast('Printing was blocked by the browser. Allow popups and try again.')
          return
        }

        showSuccessToast('Opened printable certificate in a new tab. Use browser Print from that tab.')
      }
    }, 250)
  }

  return (
    <div className="space-y-5">
      <WorkerPageHeader
        badge="Certificates"
        title="Worker Certificate Lookup"
        description="Paste a worker ID, optionally set a date range, and fetch verified earnings certificates for export or print."
      />

      <WorkerSectionCard
        kicker="Lookup"
        title="Certificate Query"
        description="Best UX for demos: one worker ID field with optional date range filters."
      >
        <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="adv_certificate_worker">Worker ID</Label>
              <Input
                id="adv_certificate_worker"
                value={lookupDraft.workerId}
                onChange={(event) =>
                  setLookupDraft((current) => ({
                    ...current,
                    workerId: event.target.value,
                  }))
                }
                placeholder="UUID"
              />
            </div>

            <div>
              <Label htmlFor="adv_certificate_from">From (Optional)</Label>
              <Input
                id="adv_certificate_from"
                type="date"
                value={lookupDraft.from}
                onChange={(event) =>
                  setLookupDraft((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="adv_certificate_to">To (Optional)</Label>
              <Input
                id="adv_certificate_to"
                type="date"
                value={lookupDraft.to}
                onChange={(event) =>
                  setLookupDraft((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              className={`${actionButtonClass} border-brand-primary bg-brand-primary text-brand-light shadow-[0_8px_18px_rgba(18,78,102,0.28)] hover:-translate-y-0.5 hover:shadow-[0_12px_22px_rgba(18,78,102,0.34)]`}
              onClick={runLookup}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Fetch Certificate
            </Button>

            <Button
              type="button"
              className={`${actionButtonClass} border-brand-muted/60 bg-brand-light text-brand-darkest hover:border-brand-primary/45 hover:bg-white`}
              onClick={onDownloadCertificateJson}
              disabled={!certificate || certificateQuery.isLoading}
            >
              <Download size={15} aria-hidden="true" />
              Download JSON
            </Button>

            <Button
              type="button"
              className={`${actionButtonClass} border-brand-muted/60 bg-brand-light text-brand-darkest hover:border-brand-primary/45 hover:bg-white`}
              onClick={onPrintCertificate}
              disabled={!certificate || certificateQuery.isLoading}
            >
              <Printer size={15} aria-hidden="true" />
              Print Certificate
            </Button>
          </div>
        </div>

        {!lookup.workerId ? (
          <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
            Enter a worker ID and click Fetch Certificate.
          </p>
        ) : certificateQuery.isLoading ? (
          <p className="text-sm text-brand-muted">Loading certificate...</p>
        ) : certificateQuery.isError ? (
          <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
            {parseApiError(certificateQuery.error)}
          </p>
        ) : certificate ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/78 p-4 text-sm shadow-sm">
              <p>
                <span className="font-semibold">Worker:</span> {certificate?.worker?.full_name || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Worker ID:</span> {certificate?.worker?.id || lookup.workerId}
              </p>
              <p>
                <span className="font-semibold">City:</span> {certificate?.worker?.city_zone || 'N/A'}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-brand-muted/35 bg-brand-light/82 p-3.5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-brand-muted">Verified Logs</p>
                <p className="mt-2 text-xl font-extrabold text-brand-darkest">
                  {certificate?.summary?.total_verified_logs || 0}
                </p>
              </div>
              <div className="rounded-xl border border-brand-muted/35 bg-brand-light/82 p-3.5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-brand-muted">Total Hours</p>
                <p className="mt-2 text-xl font-extrabold text-brand-darkest">
                  {Number(certificate?.summary?.total_hours || 0).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-brand-muted/35 bg-brand-light/82 p-3.5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-brand-muted">Total Deductions</p>
                <p className="mt-2 text-xl font-extrabold text-brand-darkest">
                  {formatCurrency(certificate?.summary?.total_deductions || 0)}
                </p>
              </div>
              <div className="rounded-xl border border-brand-muted/35 bg-brand-light/82 p-3.5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-brand-muted">Total Net</p>
                <p className="mt-2 text-xl font-extrabold text-brand-darkest">
                  {formatCurrency(certificate?.summary?.total_net || 0)}
                </p>
              </div>
            </div>

            {Array.isArray(certificate?.logs) && certificate.logs.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-brand-muted/35 bg-brand-light/75 shadow-inner">
                <div className="max-h-[520px] overflow-auto">
                  <table className="min-w-[760px] border-collapse text-sm">
                    <thead className="sticky top-0 z-10 bg-brand-darkest text-brand-light">
                      <tr className="text-left text-xs uppercase tracking-wide">
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Platform</th>
                        <th className="px-4 py-3 font-semibold">Hours</th>
                        <th className="px-4 py-3 font-semibold">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificate.logs.slice(0, 40).map((item, index) => (
                        <tr
                          key={item.id}
                          className={`transition-colors hover:bg-brand-primary/10 ${
                            index % 2 === 0 ? 'bg-brand-light/90' : 'bg-brand-light/70'
                          }`}
                        >
                          <td className="px-4 py-3">{formatDate(item.date)}</td>
                          <td className="px-4 py-3 font-semibold">{item.platform}</td>
                          <td className="px-4 py-3">{Number(item.hours_worked || 0).toFixed(2)}</td>
                          <td className="px-4 py-3">{formatCurrency(item.net_received)}</td>
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
        ) : null}
      </WorkerSectionCard>
    </div>
  )
}

export default AdvocateCertificatesPage
