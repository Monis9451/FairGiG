import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, BarChart3, FileCheck2, MessageSquareWarning, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getVerifierVulnerabilityFlags } from '@/api/verifier'
import { StaffMonitoringHub } from '@/components/staff/StaffMonitoringHub'
import WorkerPageHeader from '@/components/worker/WorkerPageHeader'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import useAuthStore from '@/store/authStore'
import { useAdvocateGrievancesQuery, useAdvocateModerationTotalsQuery } from '@/hooks/useAdvocateQueries'
import { parseApiError } from '@/features/worker/utils'

const statCardClass =
  'rounded-xl border border-brand-muted/35 bg-brand-light/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md'

const AdvocateOverviewPage = () => {
  const role = useAuthStore((state) => state.profile?.role)
  const roleLabel = role === 'analyst' ? 'Analyst' : 'Advocate'
  const basePath = role === 'analyst' ? '/analyst' : '/advocate'

  const vulnerabilityQuery = useQuery({
    queryKey: ['advocate-overview-vulnerability', 20],
    queryFn: () => getVerifierVulnerabilityFlags({ threshold: 20 }),
    staleTime: 20_000,
  })

  const openGrievancesQuery = useAdvocateGrievancesQuery({
    status: 'open',
    limit: 50,
    offset: 0,
  })

  const escalatedGrievancesQuery = useAdvocateGrievancesQuery({
    status: 'escalated',
    limit: 50,
    offset: 0,
  })

  const moderationTotalsQuery = useAdvocateModerationTotalsQuery()

  const metrics = useMemo(() => {
    return {
      vulnerabilityCount: vulnerabilityQuery.data?.count ?? 0,
      openGrievancesCount: openGrievancesQuery.data?.items?.length ?? 0,
      escalatedGrievancesCount: escalatedGrievancesQuery.data?.items?.length ?? 0,
      moderationPendingCount: moderationTotalsQuery.data?.pending ?? 0,
    }
  }, [
    escalatedGrievancesQuery.data?.items?.length,
    moderationTotalsQuery.data?.pending,
    openGrievancesQuery.data?.items?.length,
    vulnerabilityQuery.data?.count,
  ])

  const quickLinks = [
    {
      icon: AlertTriangle,
      title: 'Grievance Manager',
      description: 'Filter and resolve worker disputes from a detail-first workflow.',
      to: `${basePath}/grievances`,
    },
    {
      icon: BarChart3,
      title: 'City Benchmark Compare',
      description: 'Compare platform pay medians across multiple city zones.',
      to: `${basePath}/benchmarks`,
    },
    {
      icon: FileCheck2,
      title: 'Worker Certificates',
      description: 'Look up and export verified-earnings certificates by worker ID.',
      to: `${basePath}/certificates`,
    },
    {
      icon: MessageSquareWarning,
      title: 'Community Moderation',
      description: 'Jump to moderation queue and clear pending worker posts quickly.',
      to: '/community?tab=moderate',
    },
  ]

  const hasOverviewError =
    vulnerabilityQuery.isError ||
    openGrievancesQuery.isError ||
    escalatedGrievancesQuery.isError ||
    moderationTotalsQuery.isError

  return (
    <div className="space-y-5">
      <WorkerPageHeader
        badge={`${roleLabel} Dashboard`}
        title={`${roleLabel} Operations Hub`}
        description="Track moderation and grievance pressure in one place, then drill into analytics below."
      />

      {hasOverviewError ? (
        <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
          {parseApiError(
            vulnerabilityQuery.error ||
              openGrievancesQuery.error ||
              escalatedGrievancesQuery.error ||
              moderationTotalsQuery.error
          )}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className={statCardClass}>
          <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Income drop flags</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-darkest">{metrics.vulnerabilityCount}</p>
          <p className="mt-1 text-xs text-brand-muted">Workers over 20% month-on-month drop</p>
        </article>

        <article className={statCardClass}>
          <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Open grievances</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-darkest">{metrics.openGrievancesCount}</p>
          <p className="mt-1 text-xs text-brand-muted">Unresolved disputes requiring triage</p>
        </article>

        <article className={statCardClass}>
          <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Escalated grievances</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-darkest">{metrics.escalatedGrievancesCount}</p>
          <p className="mt-1 text-xs text-brand-muted">High-urgency items needing decisions</p>
        </article>

        <article className={statCardClass}>
          <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Pending moderation</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-darkest">{metrics.moderationPendingCount}</p>
          <p className="mt-1 text-xs text-brand-muted">Community posts waiting for approval</p>
        </article>
      </section>

      <WorkerSectionCard
        kicker="Quick Actions"
        title="Go Straight to Operations"
        description="Use these shortcuts for day-to-day advocate and analyst workflows."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {quickLinks.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className="group rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 transition-all duration-200 hover:border-brand-primary/55 hover:bg-brand-light"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-brand-darkest">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-brand-muted">{item.description}</p>
                </div>
                <item.icon className="h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-primary">
                Open
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </WorkerSectionCard>

      <StaffMonitoringHub />
    </div>
  )
}

export default AdvocateOverviewPage
