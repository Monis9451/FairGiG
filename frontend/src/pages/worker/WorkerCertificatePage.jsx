import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import useAuthStore from '@/store/authStore'
import { getWorkerCertificate } from '@/api/worker'
import { useMe } from '@/hooks/useAuth'
import WorkerNoticeBanner from '@/components/worker/WorkerNoticeBanner'
import WorkerPageHeader from '@/components/worker/WorkerPageHeader'
import CertificateReportCard from '@/components/worker/certificate/CertificateReportCard'
import { buildCertificatePrintHtml, parseApiError } from '@/features/worker/utils'

const WorkerCertificatePage = () => {
  const storeProfile = useAuthStore((state) => state.profile)
  const { data: meData } = useMe()

  const [notice, setNotice] = useState(null)
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
      setNotice({ type: 'error', message: 'Certificate data is not available yet.' })
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
      setNotice({ type: 'error', message: 'Load certificate data before printing.' })
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
      setNotice({ type: 'error', message: 'Unable to initialize print view.' })
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
          setNotice({
            type: 'error',
            message:
              'Printing was blocked by the browser. Allow popups and try Print Certificate again.',
          })
          return
        }

        setNotice({
          type: 'success',
          message: 'Opened printable certificate in a new tab. Use browser Print from that tab.',
        })
      }
    }, 250)
  }

  return (
    <div className="space-y-6">
      <WorkerPageHeader
        badge="Certificate"
        title="Verified Earnings Certificate"
        description="Generate machine-readable exports and print-ready statements scoped to your selected date range."
        summary={`Active range: ${filterSummary}`}
      />

      <WorkerNoticeBanner notice={notice} />

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
