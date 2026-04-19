import { useMemo, useState } from 'react'
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
import VerifierStatsCards from '@/components/verifier/VerifierStatsCards'
import {
  useVerifierGrievancesQuery,
  useVerifierPingQuery,
  useVerifierShiftLogStatusCountsQuery,
  useVerifierShiftLogsQuery,
  useVerifierVulnerabilityFlagsQuery,
} from '@/hooks/useVerifierQueries'
import WorkerContactBlock from '@/components/verifier/WorkerContactBlock'
import { parseApiError } from '@/features/verifier/utils'
import { formatCurrency, formatDate, formatPercent } from '@/utils/formatters'
import { cn } from '@/lib/utils'

const snapshotCardClass =
  'rounded-lg border border-brand-darkest/8 bg-white/90 px-3 py-2.5 shadow-[0_1px_0_rgba(46,57,68,0.05)]'

const OVERVIEW_TABS = [
  { id: 'pending', label: 'Pending', to: '/verifier/queue', linkLabel: 'Open queue' },
  { id: 'risk', label: 'Risk', to: '/verifier/vulnerability', linkLabel: 'Risk details' },
  { id: 'grievances', label: 'Grievances', to: '/verifier/grievances', linkLabel: 'All grievances' },
]

const VerifierOverviewPage = () => {
  const [snapTab, setSnapTab] = useState('pending')

  const pingQuery = useVerifierPingQuery()
  const statusCountsQuery = useVerifierShiftLogStatusCountsQuery()
  const pendingPreviewQuery = useVerifierShiftLogsQuery({ status: 'pending', limit: 5, offset: 0 })
  const vulnerabilityQuery = useVerifierVulnerabilityFlagsQuery(20)
  const grievancesQuery = useVerifierGrievancesQuery({ status: 'open', limit: 6, offset: 0 })

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

  const activeTabMeta = OVERVIEW_TABS.find((t) => t.id === snapTab) ?? OVERVIEW_TABS[0]

  return (
    <div className="space-y-8">
      <VerifierPageHeader
        badge="Verifier"
        title="Dashboard"
        description="Live totals from the earnings ledger. Use the tabs below for a compact snapshot — each panel scrolls on its own."
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

      <section className="overflow-hidden rounded-2xl border border-brand-darkest/10 bg-white/90 shadow-[0_1px_0_rgba(46,57,68,0.05)] ring-1 ring-brand-darkest/[0.06]">
        <div
          className="flex gap-1 overflow-x-auto border-b border-brand-darkest/10 bg-brand-light/35 p-2 sm:gap-2"
          role="tablist"
          aria-label="Dashboard snapshots"
        >
          {OVERVIEW_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={snapTab === t.id}
              className={cn(
                'shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm',
                snapTab === t.id
                  ? 'bg-white text-brand-darkest shadow-sm ring-1 ring-brand-darkest/10'
                  : 'text-brand-muted hover:bg-white/60 hover:text-brand-darkest'
              )}
              onClick={() => setSnapTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          <div className="max-h-[min(320px,52vh)] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pr-1">
            {snapTab === 'pending' ? (
              pendingPreviewQuery.isError ? (
                <p className="text-sm text-brand-muted">{parseApiError(pendingPreviewQuery.error)}</p>
              ) : pendingPreview.length === 0 ? (
                <p className="rounded-xl border border-dashed border-brand-darkest/12 bg-brand-light/25 p-4 text-sm text-brand-muted">
                  No pending shifts — you are caught up.
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingPreview.map((item) => (
                    <article key={item.id} className={snapshotCardClass}>
                      <div className="flex items-start justify-between gap-2">
                        <WorkerContactBlock item={item} className="min-w-0 flex-1" />
                        <span className="shrink-0 text-xs text-brand-muted">{formatDate(item.date)}</span>
                      </div>
                      <p className="mt-2 text-xs font-medium text-brand-darkest">{item.platform}</p>
                      <p className="text-xs text-brand-muted">Net {formatCurrency(item.net_received)}</p>
                    </article>
                  ))}
                </div>
              )
            ) : null}

            {snapTab === 'risk' ? (
              vulnerabilityQuery.isError ? (
                <p className="text-sm text-brand-muted">{parseApiError(vulnerabilityQuery.error)}</p>
              ) : vulnerabilityWorkers.length === 0 ? (
                <p className="rounded-xl border border-dashed border-brand-darkest/12 bg-brand-light/25 p-4 text-sm text-brand-muted">
                  No workers above the threshold.
                </p>
              ) : (
                <div className="space-y-2">
                  {vulnerabilityWorkers.slice(0, 6).map((item) => (
                    <article key={`${item.worker_id}-${item.current_month}`} className={snapshotCardClass}>
                      <div className="flex items-start justify-between gap-2">
                        <WorkerContactBlock
                          item={{
                            worker_id: item.worker_id,
                            worker_full_name: item.worker_name,
                            worker_email: item.worker_email,
                          }}
                          className="min-w-0 flex-1"
                        />
                        <span className="shrink-0 rounded-full bg-brand-dark/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-light">
                          {formatPercent(item.drop_percentage)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : null}

            {snapTab === 'grievances' ? (
              grievancesQuery.isError ? (
                <p className="text-sm text-brand-muted">{parseApiError(grievancesQuery.error)}</p>
              ) : grievanceItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-brand-darkest/12 bg-brand-light/25 p-4 text-sm text-brand-muted">
                  No open grievances.
                </p>
              ) : (
                <div className="space-y-2">
                  {grievanceItems.slice(0, 6).map((item) => (
                    <article key={item.id} className={snapshotCardClass}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-brand-darkest">{item.category}</p>
                        <span className="shrink-0 text-xs text-brand-muted">{formatDate(item.created_at)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-brand-muted">
                        {item.description}
                      </p>
                      <div className="mt-2 border-t border-brand-darkest/8 pt-2">
                        <WorkerContactBlock item={item} />
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : null}
          </div>

          <div className="mt-4 flex justify-end border-t border-brand-darkest/8 pt-3">
            <Link
              to={activeTabMeta.to}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline"
            >
              {activeTabMeta.linkLabel}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default VerifierOverviewPage
