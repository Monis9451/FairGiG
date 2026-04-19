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
  useVerifierShiftLogStatusCountsQuery,
  useVerifierShiftLogsQuery,
  useVerifierVulnerabilityFlagsQuery,
} from '@/hooks/useVerifierQueries'
import { workerPrimaryLabel } from '@/features/verifier/workerDisplay'
import { parseApiError } from '@/features/verifier/utils'
import { formatCurrency, formatDate, formatPercent } from '@/utils/formatters'

const snapshotCardClass =
  'rounded-xl border border-brand-darkest/8 bg-white/80 px-3.5 py-3 shadow-[0_1px_0_rgba(46,57,68,0.06)] transition-colors hover:border-brand-darkest/15'

const VerifierOverviewPage = () => {
  const pingQuery = useVerifierPingQuery()
  const statusCountsQuery = useVerifierShiftLogStatusCountsQuery()
  const pendingPreviewQuery = useVerifierShiftLogsQuery({ status: 'pending', limit: 5, offset: 0 })
  const vulnerabilityQuery = useVerifierVulnerabilityFlagsQuery(20)
  const grievancesQuery = useVerifierGrievancesQuery({ status: 'open', limit: 8, offset: 0 })

  const byStatus = statusCountsQuery.data?.by_status ?? {}
  const pendingPreview = pendingPreviewQuery.data?.items ?? []
  const vulnerabilityWorkers = vulnerabilityQuery.data?.workers ?? []
  const grievanceItems = grievancesQuery.data?.items ?? []

  const statTiles = useMemo(
    () => [
      {
        label: 'Pending',
        value: byStatus.pending ?? 0,
        icon: ClipboardList,
        hint: 'Awaiting verifier action',
      },
      {
        label: 'Verified',
        value: byStatus.verified ?? 0,
        icon: CheckCircle2,
        hint: 'Approved shift logs',
      },
      {
        label: 'Flagged',
        value: byStatus.flagged ?? 0,
        icon: AlertTriangle,
        hint: 'Needs follow-up',
      },
      {
        label: 'Unverifiable',
        value: byStatus.unverifiable ?? 0,
        icon: Ban,
        hint: 'Could not verify',
      },
      {
        label: 'Risk flags',
        value: vulnerabilityWorkers.length,
        icon: ShieldAlert,
        hint: 'MoM income drop ≥ 20% (this scan)',
      },
      {
        label: 'Services',
        value: pingQuery.isLoading ? '…' : pingQuery.isError ? 'Offline' : 'OK',
        icon: Activity,
        hint: pingQuery.isError ? parseApiError(pingQuery.error) : 'API & earnings reachable',
        emphasis: pingQuery.isError,
      },
    ],
    [
      byStatus.flagged,
      byStatus.pending,
      byStatus.unverifiable,
      byStatus.verified,
      pingQuery.error,
      pingQuery.isError,
      pingQuery.isLoading,
      vulnerabilityWorkers.length,
    ]
  )

  const statsLoading =
    statusCountsQuery.isLoading || vulnerabilityQuery.isLoading || pingQuery.isLoading

  const refreshAll = () => {
    void pingQuery.refetch()
    void statusCountsQuery.refetch()
    void pendingPreviewQuery.refetch()
    void vulnerabilityQuery.refetch()
    void grievancesQuery.refetch()
  }

  return (
    <div className="space-y-8">
      <VerifierPageHeader
        badge="Verifier"
        title="Dashboard"
        description="Live totals from the earnings ledger, plus shortcuts into the queue, risk review, and grievances."
        actions={
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-xl border-brand-darkest/12 bg-white px-4 text-sm font-semibold text-brand-darkest shadow-sm"
            onClick={refreshAll}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {statusCountsQuery.isError ? (
        <p className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-900">
          Could not load shift totals: {parseApiError(statusCountsQuery.error)}
        </p>
      ) : null}

      <div>
        <VerifierStatsCards tiles={statTiles} isLoading={statsLoading} />
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-brand-muted">
          Shift numbers are full database counts. Risk flags reflect the current vulnerability scan only.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <VerifierSectionCard
          kicker="Next up"
          title="Pending shifts"
          description="Newest items waiting in the queue."
          className="ring-1 ring-brand-darkest/[0.06]"
          actions={
            <Link
              to="/verifier/queue"
              className="inline-flex items-center gap-1 rounded-lg text-sm font-semibold text-brand-primary hover:underline"
            >
              Open queue
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          {pendingPreviewQuery.isError ? (
            <p className="text-sm text-brand-muted">{parseApiError(pendingPreviewQuery.error)}</p>
          ) : pendingPreview.length === 0 ? (
            <p className="rounded-xl border border-dashed border-brand-darkest/12 bg-brand-light/25 p-4 text-sm text-brand-muted">
              No pending shifts — you are caught up.
            </p>
          ) : (
            <div className="space-y-2.5">
              {pendingPreview.map((item) => (
                <article key={item.id} className={snapshotCardClass}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-brand-darkest">{workerPrimaryLabel(item)}</p>
                    <span className="shrink-0 text-xs text-brand-muted">{formatDate(item.date)}</span>
                  </div>
                  <p className="truncate font-mono text-[10px] text-brand-muted" title={item.worker_id}>
                    {item.worker_id}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-darkest">{item.platform}</p>
                  <p className="text-xs text-brand-muted">Net {formatCurrency(item.net_received)}</p>
                </article>
              ))}
            </div>
          )}
        </VerifierSectionCard>

        <VerifierSectionCard
          kicker="Risk"
          title="Vulnerability"
          description="Largest verified income drops vs last month."
          className="ring-1 ring-brand-darkest/[0.06]"
          actions={
            <Link
              to="/verifier/vulnerability"
              className="inline-flex items-center gap-1 rounded-lg text-sm font-semibold text-brand-primary hover:underline"
            >
              Full list
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          {vulnerabilityQuery.isError ? (
            <p className="text-sm text-brand-muted">{parseApiError(vulnerabilityQuery.error)}</p>
          ) : vulnerabilityWorkers.length === 0 ? (
            <p className="rounded-xl border border-dashed border-brand-darkest/12 bg-brand-light/25 p-4 text-sm text-brand-muted">
              No workers above the threshold.
            </p>
          ) : (
            <div className="space-y-2.5">
              {vulnerabilityWorkers.slice(0, 5).map((item) => (
                <article key={`${item.worker_id}-${item.current_month}`} className={snapshotCardClass}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-brand-darkest">
                      {item.worker_name || 'Unknown worker'}
                    </p>
                    <span className="shrink-0 rounded-full bg-brand-dark/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-light">
                      {formatPercent(item.drop_percentage)}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[11px] text-brand-muted">{item.worker_id}</p>
                </article>
              ))}
            </div>
          )}
        </VerifierSectionCard>

        <VerifierSectionCard
          kicker="Disputes"
          title="Open grievances"
          description="Latest worker-submitted cases with status open."
          className="ring-1 ring-brand-darkest/[0.06]"
          actions={
            <Link
              to="/verifier/grievances"
              className="inline-flex items-center gap-1 rounded-lg text-sm font-semibold text-brand-primary hover:underline"
            >
              Manage
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          }
        >
          {grievancesQuery.isError ? (
            <p className="text-sm text-brand-muted">{parseApiError(grievancesQuery.error)}</p>
          ) : grievanceItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-brand-darkest/12 bg-brand-light/25 p-4 text-sm text-brand-muted">
              No open grievances.
            </p>
          ) : (
            <div className="space-y-2.5">
              {grievanceItems.slice(0, 5).map((item) => (
                <article key={item.id} className={snapshotCardClass}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-brand-darkest">{item.category}</p>
                    <span className="shrink-0 text-xs text-brand-muted">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-brand-muted">{item.description}</p>
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
