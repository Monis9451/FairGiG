import { useMemo } from 'react'
import { ArrowRight, BarChart3, FileText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import WorkerPageHeader from '@/components/worker/WorkerPageHeader'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import WorkerStatsCards from '@/components/worker/WorkerStatsCards'
import { listWorkerShiftLogs } from '@/api/worker'
import { useMe } from '@/hooks/useAuth'
import { buildWorkerStats, parseApiError } from '@/features/worker/utils'

const WorkerOverviewPage = () => {
  const { data: meData } = useMe()

  const shiftLogsQuery = useQuery({
    queryKey: ['worker-shift-logs'],
    queryFn: () => listWorkerShiftLogs({ limit: 100, offset: 0 }),
    staleTime: 30_000,
  })

  const shiftItems = useMemo(() => shiftLogsQuery.data?.items ?? [], [shiftLogsQuery.data?.items])
  const stats = useMemo(() => buildWorkerStats(shiftItems), [shiftItems])

  const verificationSummary = meData?.earnings_verification_summary
  const summaryText = verificationSummary
    ? `Verification summary: ${verificationSummary.pending} pending, ${verificationSummary.verified} verified, ${verificationSummary.flagged} flagged, ${verificationSummary.unverifiable} unverifiable${verificationSummary.last_shift_log_at ? ` · last log ${verificationSummary.last_shift_log_at}` : ''}`
    : null

  return (
    <div className="space-y-5">
      <WorkerPageHeader
        badge="Worker Dashboard"
        title="Earnings Operations Overview"
        description="Track your verification status, access critical actions faster, and jump directly to focused workflow pages."
        summary={summaryText}
      />

      {shiftLogsQuery.isError ? (
        <p className="rounded-xl border border-brand-muted/35 bg-brand-light/80 px-4 py-3 text-sm text-brand-muted">
          {parseApiError(shiftLogsQuery.error)}
        </p>
      ) : null}

      <WorkerStatsCards stats={stats} isLoading={shiftLogsQuery.isLoading} />

      <div className="grid gap-5 xl:grid-cols-3">
        <WorkerSectionCard
          title="Shift Workflows"
          description="Log shifts, upload screenshots, import CSV, and run anomaly checks from one focused page."
        >
          <Link
            to="/worker/shifts"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-primary bg-brand-primary px-3 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
          >
            Open Shifts Page
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </WorkerSectionCard>

        <WorkerSectionCard
          title="Grievances"
          description="Submit and monitor issue tickets with dedicated status views and cleaner triage layout."
        >
          <Link
            to="/worker/grievances"
            className="inline-flex items-center gap-2 rounded-lg border border-brand-muted bg-brand-light px-3 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
          >
            <ShieldCheck size={15} aria-hidden="true" />
            Open Grievances
          </Link>
        </WorkerSectionCard>

        <WorkerSectionCard
          title="Certificate and Benchmark"
          description="Access printable certificate reports and benchmark trend charts in dedicated pages."
        >
          <div className="flex flex-wrap gap-2">
            <Link
              to="/worker/certificate"
              className="inline-flex items-center gap-2 rounded-lg border border-brand-muted bg-brand-light px-3 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
            >
              <FileText size={15} aria-hidden="true" />
              Certificate
            </Link>
            <Link
              to="/worker/benchmark"
              className="inline-flex items-center gap-2 rounded-lg border border-brand-muted bg-brand-light px-3 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
            >
              <BarChart3 size={15} aria-hidden="true" />
              Benchmark
            </Link>
          </div>
        </WorkerSectionCard>
      </div>
    </div>
  )
}

export default WorkerOverviewPage
