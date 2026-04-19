import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import useAuthStore from '@/store/authStore'
import { getWorkerCertificate } from '@/api/worker'
import { useMe } from '@/hooks/useAuth'
import CertificateReportCard from '@/components/worker/certificate/CertificateReportCard'
import { useToast } from '@/hooks/useToast'
import { buildCertificatePrintHtml, parseApiError } from '@/features/worker/utils'

const WorkerCertificatePage = () => {
  const storeProfile = useAuthStore((state) => state.profile)
  const { data: meData, isPending: mePending } = useMe()
  const { success: showSuccessToast, error: showErrorToast } = useToast()

  const [certificateFilters, setCertificateFilters] = useState({ from: '', to: '' })

  const profile = meData?.profile || storeProfile || null
  const workerId = meData?.user?.id || profile?.id || ''

  const certificateQuery = useQuery({
    queryKey: ['worker-certificate', workerId, certificateFilters.from, certificateFilters.to],
    queryFn: () =>
      getWorkerCertificate({
        workerId,
        from: certificateFilters.from || undefined,
        to: certificateFilters.to || undefined,
      }),
    enabled: Boolean(workerId),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

  const certificate = certificateQuery.data || null

  const filterSummary = useMemo(() => {
    if (!certificateFilters.from && !certificateFilters.to) {
      return 'Full range'
    }

    return `${certificateFilters.from || 'Start'} to ${certificateFilters.to || 'Now'}`
  }, [certificateFilters.from, certificateFilters.to])

  const onDownloadCertificateJson = () => {
    if (!certificate) {
      showErrorToast('Certificate data is not available yet.')
      return
    }

    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fairgig-certificate-${workerId || 'worker'}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const onPrintCertificate = () => {
    if (!certificate) {
      showErrorToast('Load your statement first, then try Print / Save as PDF.')
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
          showErrorToast('Printing was blocked. Allow popups and try Print / Save as PDF again.')
          return
        }

        showSuccessToast('Opened your statement in a new tab — use Print, then choose Save as PDF if you like.')
      }
    }, 250)
  }

  if (mePending) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse space-y-4 pb-10">
        <div className="h-10 rounded-lg bg-brand-muted/20" />
        <div className="h-40 rounded-2xl bg-brand-muted/15" />
        <div className="h-96 rounded-2xl bg-brand-muted/15" />
      </div>
    )
  }

  if (!workerId) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-brand-muted/30 bg-white p-6 text-center text-sm text-brand-muted">
        We couldn&apos;t load your worker profile. Please sign in again.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10">
      <header className="border-b border-brand-muted/20 pb-4">
        <Link
          to="/worker"
          className="inline-flex min-h-[40px] items-center gap-1 text-xs font-semibold text-brand-primary hover:underline touch-manipulation"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Back to rider home
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-brand-darkest sm:text-2xl">
          Earnings letter
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-brand-muted">
          Verified shift totals for banks, landlords, or your own records. Preview updates when you pick dates; use{' '}
          <strong className="font-semibold text-brand-darkest">Print / Save as PDF</strong> for a branded copy.
        </p>
        <p className="mt-2 text-xs tabular-nums text-brand-muted">
          Active range: <span className="font-semibold text-brand-darkest">{filterSummary}</span>
        </p>
      </header>

      <CertificateReportCard
        certificate={certificate}
        certificateQuery={certificateQuery}
        certificateFilters={certificateFilters}
        setCertificateFilters={setCertificateFilters}
        onDownloadCertificateJson={onDownloadCertificateJson}
        onPrintCertificate={onPrintCertificate}
        parseApiError={parseApiError}
      />
    </div>
  )
}

export default WorkerCertificatePage
