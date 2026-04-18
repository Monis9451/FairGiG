import { useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import VerifierPageHeader from '@/components/verifier/VerifierPageHeader'
import VerifierSectionCard from '@/components/verifier/VerifierSectionCard'
import VerifierStatsCards from '@/components/verifier/VerifierStatsCards'
import {
  useVerifierGrievancesQuery,
  useVerifierPingQuery,
  useVerifierShiftLogsQuery,
  useVerifierVulnerabilityFlagsQuery,
} from '@/hooks/useVerifierQueries'
import { parseApiError } from '@/features/verifier/utils'
import { formatCurrency, formatDate, formatPercent } from '@/utils/formatters'

const VerifierOverviewPage = () => {
  const pingQuery = useVerifierPingQuery()
  const pendingQuery = useVerifierShiftLogsQuery({ status: 'pending', limit: 50, offset: 0 })
  const verifiedQuery = useVerifierShiftLogsQuery({ status: 'verified', limit: 50, offset: 0 })
  const flaggedQuery = useVerifierShiftLogsQuery({ status: 'flagged', limit: 50, offset: 0 })
  const unverifiableQuery = useVerifierShiftLogsQuery({ status: 'unverifiable', limit: 50, offset: 0 })
  const vulnerabilityQuery = useVerifierVulnerabilityFlagsQuery(20)
  const grievancesQuery = useVerifierGrievancesQuery({ status: 'open', limit: 20, offset: 0 })

  const pendingItems = pendingQuery.data?.items ?? []
  const verifiedItems = verifiedQuery.data?.items ?? []
  const flaggedItems = flaggedQuery.data?.items ?? []
  const unverifiableItems = unverifiableQuery.data?.items ?? []
  const vulnerabilityWorkers = vulnerabilityQuery.data?.workers ?? []
  const grievanceItems = grievancesQuery.data?.items ?? []

  const statTiles = useMemo(
    () => [
      {
        label: 'Pending Queue',
        value: pendingItems.length,
        icon: ClipboardList,
        tone: 'from-brand-muted/30 to-brand-muted/5',
      },
      {
        label: 'Verified Logs',
        value: verifiedItems.length,
        icon: CheckCircle2,
        tone: 'from-brand-primary/25 to-brand-primary/5',
      },
      {
        label: 'Flagged Logs',
        value: flaggedItems.length,
        icon: AlertTriangle,
        tone: 'from-brand-dark/30 to-brand-dark/5',
      },
      {
        label: 'Unverifiable Logs',
        value: unverifiableItems.length,
        icon: Ban,
        tone: 'from-amber-200/80 to-amber-50/40',
      },
      {
        label: 'Vulnerability Flags',
        value: vulnerabilityWorkers.length,
        icon: ShieldAlert,
        tone: 'from-brand-darkest/20 to-brand-dark/5',
      },
      {
        label: 'Verifier Ping',
        value: pingQuery.isLoading ? 'Checking...' : pingQuery.isError ? 'Unavailable' : 'OK',
        icon: Activity,
        tone: 'from-brand-primary/25 to-brand-primary/5',
      },
    ],
    [
      flaggedItems.length,
      pendingItems.length,
      pingQuery.isError,
      pingQuery.isLoading,
      unverifiableItems.length,
      verifiedItems.length,
      vulnerabilityWorkers.length,
    ]
  )

  const statsLoading =
    pendingQuery.isLoading ||
    verifiedQuery.isLoading ||
    flaggedQuery.isLoading ||
    unverifiableQuery.isLoading ||
    vulnerabilityQuery.isLoading ||
    pingQuery.isLoading

  const refreshAll = () => {
    void pingQuery.refetch()
    void pendingQuery.refetch()
    void verifiedQuery.refetch()
    void flaggedQuery.refetch()
    void unverifiableQuery.refetch()
    void vulnerabilityQuery.refetch()
    void grievancesQuery.refetch()
  }

  return (
    <div className="space-y-5">
      <VerifierPageHeader
        badge="Verifier Dashboard"
        title="Earnings Review Control Center"
        description="Track verification throughput, monitor risk signals, and move quickly into queue-level decisions."
        actions={
          <Button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-primary bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-light transition hover:opacity-90"
            onClick={refreshAll}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh Overview
          </Button>
        }
      />

      <VerifierStatsCards tiles={statTiles} isLoading={statsLoading} />

      <div className="grid gap-5 xl:grid-cols-3">
        <VerifierSectionCard
          kicker="Queue Snapshot"
          title="Next Pending Logs"
          description="Most recent records waiting for verifier action."
          actions={
            <Link
              to="/verifier/queue"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-primary"
            >
              Open queue
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          {pendingQuery.isError ? (
            <p className="text-sm text-brand-muted">{parseApiError(pendingQuery.error)}</p>
          ) : pendingItems.length === 0 ? (
            <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-3 text-sm text-brand-muted">
              No pending logs available.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingItems.slice(0, 5).map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-brand-darkest">{item.worker_id}</p>
                    <span className="text-xs text-brand-muted">{formatDate(item.date)}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-brand-darkest">{item.platform}</p>
                  <p className="text-xs text-brand-muted">Net: {formatCurrency(item.net_received)}</p>
                </article>
              ))}
            </div>
          )}
        </VerifierSectionCard>

        <VerifierSectionCard
          kicker="Risk Snapshot"
          title="Top Vulnerability Alerts"
          description="Income drop outliers based on current 20% threshold."
          actions={
            <Link
              to="/verifier/vulnerability"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-primary"
            >
              Open vulnerability
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          {vulnerabilityQuery.isError ? (
            <p className="text-sm text-brand-muted">{parseApiError(vulnerabilityQuery.error)}</p>
          ) : vulnerabilityWorkers.length === 0 ? (
            <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-3 text-sm text-brand-muted">
              No workers exceed the current threshold.
            </p>
          ) : (
            <div className="space-y-2">
              {vulnerabilityWorkers.slice(0, 5).map((item) => (
                <article
                  key={`${item.worker_id}-${item.current_month}`}
                  className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-brand-darkest">
                      {item.worker_name || 'Unknown Worker'}
                    </p>
                    <span className="rounded-full border border-brand-dark bg-brand-dark px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-light">
                      {formatPercent(item.drop_percentage)} drop
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-brand-muted">{item.worker_id}</p>
                </article>
              ))}
            </div>
          )}
        </VerifierSectionCard>

        <VerifierSectionCard
          kicker="Disputes Snapshot"
          title="Open Grievances"
          description="Recent worker grievances requiring active monitoring."
          actions={
            <Link
              to="/verifier/grievances"
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brand-primary"
            >
              Open grievances
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          {grievancesQuery.isError ? (
            <p className="text-sm text-brand-muted">{parseApiError(grievancesQuery.error)}</p>
          ) : grievanceItems.length === 0 ? (
            <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-3 text-sm text-brand-muted">
              No open grievances currently.
            </p>
          ) : (
            <div className="space-y-2">
              {grievanceItems.slice(0, 5).map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-brand-darkest">{item.category}</p>
                    <span className="text-xs text-brand-muted">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-brand-muted">{item.description}</p>
                </article>
              ))}
            </div>
          )}
        </VerifierSectionCard>
      </div>
    </div>
  )
}

export default VerifierOverviewPage
