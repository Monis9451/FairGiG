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

/** Sample size per stat; API does not return DB totals — numbers are “in this sample”. */
const OVERVIEW_SAMPLE_LIMIT = 200
const SAMPLE_STAT_HINT = `Sample: up to ${OVERVIEW_SAMPLE_LIMIT} most recent rows per status (not full queue totals).`

const snapshotCardClass =
  'rounded-lg border border-brand-darkest/10 bg-brand-light/40 px-3 py-2.5 transition-colors hover:bg-brand-light/70'

const VerifierOverviewPage = () => {
  const pingQuery = useVerifierPingQuery()
  const pendingQuery = useVerifierShiftLogsQuery({ status: 'pending', limit: OVERVIEW_SAMPLE_LIMIT, offset: 0 })
  const verifiedQuery = useVerifierShiftLogsQuery({ status: 'verified', limit: OVERVIEW_SAMPLE_LIMIT, offset: 0 })
  const flaggedQuery = useVerifierShiftLogsQuery({ status: 'flagged', limit: OVERVIEW_SAMPLE_LIMIT, offset: 0 })
  const unverifiableQuery = useVerifierShiftLogsQuery({
    status: 'unverifiable',
    limit: OVERVIEW_SAMPLE_LIMIT,
    offset: 0,
  })
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
        label: 'Pending (sample)',
        value: pendingItems.length,
        icon: ClipboardList,
        hint: SAMPLE_STAT_HINT,
      },
      {
        label: 'Verified (sample)',
        value: verifiedItems.length,
        icon: CheckCircle2,
        hint: SAMPLE_STAT_HINT,
      },
      {
        label: 'Flagged (sample)',
        value: flaggedItems.length,
        icon: AlertTriangle,
        hint: SAMPLE_STAT_HINT,
      },
      {
        label: 'Unverifiable (sample)',
        value: unverifiableItems.length,
        icon: Ban,
        hint: SAMPLE_STAT_HINT,
      },
      {
        label: 'Risk flags',
        value: vulnerabilityWorkers.length,
        icon: ShieldAlert,
        hint: 'Workers over 20% MoM drop (current query).',
      },
      {
        label: 'Verifier ping',
        value: pingQuery.isLoading ? '…' : pingQuery.isError ? 'Offline' : 'OK',
        icon: Activity,
        hint: pingQuery.isError ? parseApiError(pingQuery.error) : 'Gateway / earnings reachability.',
        emphasis: pingQuery.isError,
      },
    ],
    [
      flaggedItems.length,
      pendingItems.length,
      pingQuery.error,
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
    <div className="space-y-6">
      <VerifierPageHeader
        badge="Verifier"
        title="Overview"
        description="Queue health, risk signals, and open disputes at a glance. Stat tiles use a fixed sample so you can spot spikes without implying full database counts."
        actions={
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-lg border-brand-darkest/15 bg-white px-4 text-sm font-semibold text-brand-darkest shadow-sm"
            onClick={refreshAll}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <VerifierStatsCards tiles={statTiles} isLoading={statsLoading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <VerifierSectionCard
          kicker="Queue"
          title="Latest pending"
          description="Most recent rows waiting for review."
          actions={
            <Link
              to="/verifier/queue"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary"
            >
              Open queue
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          {pendingQuery.isError ? (
            <p className="text-sm text-brand-muted">{parseApiError(pendingQuery.error)}</p>
          ) : pendingItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-brand-darkest/15 bg-brand-light/30 p-4 text-sm text-brand-muted">
              No pending logs in this sample.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingItems.slice(0, 5).map((item) => (
                <article key={item.id} className={snapshotCardClass}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-brand-darkest">{item.worker_id}</p>
                    <span className="text-xs text-brand-muted">{formatDate(item.date)}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-brand-darkest">{item.platform}</p>
                  <p className="text-xs text-brand-muted">Net {formatCurrency(item.net_received)}</p>
                </article>
              ))}
            </div>
          )}
        </VerifierSectionCard>

        <VerifierSectionCard
          kicker="Risk"
          title="Vulnerability alerts"
          description="Month-on-month verified income drops above the default 20% threshold."
          actions={
            <Link
              to="/verifier/vulnerability"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary"
            >
              Details
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          {vulnerabilityQuery.isError ? (
            <p className="text-sm text-brand-muted">{parseApiError(vulnerabilityQuery.error)}</p>
          ) : vulnerabilityWorkers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-brand-darkest/15 bg-brand-light/30 p-4 text-sm text-brand-muted">
              No workers exceed the threshold right now.
            </p>
          ) : (
            <div className="space-y-2">
              {vulnerabilityWorkers.slice(0, 5).map((item) => (
                <article key={`${item.worker_id}-${item.current_month}`} className={snapshotCardClass}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-brand-darkest">
                      {item.worker_name || 'Unknown worker'}
                    </p>
                    <span className="rounded-full border border-brand-dark/20 bg-brand-dark px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-light">
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
          kicker="Disputes"
          title="Open grievances"
          description="Recent open cases (latest 20)."
          actions={
            <Link
              to="/verifier/grievances"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary"
            >
              All grievances
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          {grievancesQuery.isError ? (
            <p className="text-sm text-brand-muted">{parseApiError(grievancesQuery.error)}</p>
          ) : grievanceItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-brand-darkest/15 bg-brand-light/30 p-4 text-sm text-brand-muted">
              No open grievances in this sample.
            </p>
          ) : (
            <div className="space-y-2">
              {grievanceItems.slice(0, 5).map((item) => (
                <article key={item.id} className={snapshotCardClass}>
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
