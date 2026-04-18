import { useMemo } from 'react'
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
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
    ? `${verificationSummary.pending} pending · ${verificationSummary.verified} verified · ${verificationSummary.flagged} flagged · ${verificationSummary.unverifiable} unverifiable`
    : null

  return (
    <div className="space-y-5">
      <WorkerPageHeader
        badge="Worker Dashboard"
        title="Earnings Operations Overview"
        description="Track verification health, jump into workflows, and manage your daily operations with a cleaner command center."
        summary={summaryText}
        actions={
          <>
            <Link
              to="/worker/shifts"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light shadow-[0_10px_20px_rgba(18,78,102,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95"
            >
              <ClipboardCheck size={15} aria-hidden="true" />
              Open Shifts
            </Link>
            <Link
              to="/worker/grievances"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-light/80"
            >
              <ShieldCheck size={15} aria-hidden="true" />
              Raise Issue
            </Link>
          </>
        }
      />

      {shiftLogsQuery.isError ? (
        <p className="rounded-xl border border-brand-muted/35 bg-brand-light/80 px-4 py-3 text-sm text-brand-muted">
          {parseApiError(shiftLogsQuery.error)}
        </p>
      ) : null}

      <WorkerStatsCards stats={stats} isLoading={shiftLogsQuery.isLoading} />

      <div className="grid gap-5 xl:grid-cols-3">
        <WorkerSectionCard
          kicker="Primary Workflow"
          title="Shift Operations"
          description="Capture shifts, upload proof, bulk import files, and run anomaly checks in one focused workspace."
          actions={
            <Link
              to="/worker/shifts"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-primary"
            >
              Open shifts
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          <div className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-3 text-sm text-brand-dark">
            <div className="flex items-center gap-2 font-semibold text-brand-darkest">
              <Workflow size={14} aria-hidden="true" />
              Recommended path
            </div>
            <p className="mt-2 leading-relaxed">
              Upload screenshot proof first, then save the shift, then run anomaly analysis on the same record.
            </p>
          </div>
        </WorkerSectionCard>

        <WorkerSectionCard
          kicker="Issue Desk"
          title="Grievance Follow-up"
          description="Submit dispute tickets with structured detail and track their status updates quickly."
          actions={
            <Link
              to="/worker/grievances"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-primary"
            >
              Open grievances
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          <div className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-3 text-sm leading-relaxed text-brand-dark">
            Keep descriptions concise and specific to speed up escalation decisions.
          </div>
        </WorkerSectionCard>

        <WorkerSectionCard
          kicker="Reporting"
          title="Certificate and Benchmark"
          description="Generate export-ready reports and compare your trend against platform city medians."
        >
          <div className="flex flex-wrap gap-2">
            <Link
              to="/worker/certificate"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-brand-muted bg-brand-light px-3 py-2 text-sm font-semibold text-brand-darkest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-light/80"
            >
              <FileText size={15} aria-hidden="true" />
              Certificate
            </Link>
            <Link
              to="/worker/benchmark"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-brand-muted bg-brand-light px-3 py-2 text-sm font-semibold text-brand-darkest shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-light/80"
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
