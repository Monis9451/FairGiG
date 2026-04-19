import { useMemo } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bike,
  ClipboardCheck,
  FileText,
  MapPin,
  MessageCircle,
  PlusCircle,
  ShieldAlert,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import WorkerStatsCards from '@/components/worker/WorkerStatsCards'
import { listWorkerShiftLogs } from '@/api/worker'
import { useMe } from '@/hooks/useAuth'
import { buildWorkerDashboardMetrics, buildWorkerStats, normalizePlatformName, parseApiError, shiftBadgeClassByStatus } from '@/features/worker/utils'
import { formatCurrency, formatDate } from '@/utils/formatters'

const greetingForHour = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const WorkerOverviewPage = () => {
  const { data: meData } = useMe()
  const profile = meData?.profile

  const shiftLogsQuery = useQuery({
    queryKey: ['worker-shift-logs'],
    queryFn: () => listWorkerShiftLogs({ limit: 100, offset: 0 }),
    staleTime: 30_000,
  })

  const shiftItems = useMemo(() => shiftLogsQuery.data?.items ?? [], [shiftLogsQuery.data?.items])
  const stats = useMemo(() => buildWorkerStats(shiftItems), [shiftItems])
  const metrics = useMemo(() => buildWorkerDashboardMetrics(shiftItems), [shiftItems])

  const verificationSummary = meData?.earnings_verification_summary
  const firstName = profile?.full_name?.trim()?.split(/\s+/)[0] || 'there'
  const city = profile?.city_zone?.trim()
  const greet = greetingForHour()

  const quickActions = [
    {
      to: '/worker/shifts',
      title: 'Add shift',
      subtitle: 'Uber, Foodpanda, Bykea…',
      icon: PlusCircle,
      emphasis: 'heroGreen',
      className:
        'border-emerald-500/40 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-[0_12px_28px_rgba(5,150,105,0.35)]',
    },
    {
      to: '/worker/grievances',
      title: 'Report a problem',
      subtitle: 'Payment, ban, safety…',
      icon: ShieldAlert,
      emphasis: 'heroInk',
      className:
        'border-brand-primary/30 bg-gradient-to-br from-brand-primary to-brand-dark text-brand-light shadow-[0_12px_28px_rgba(18,78,102,0.3)]',
    },
    {
      to: '/community',
      title: 'Community',
      subtitle: 'Tips from other riders',
      icon: MessageCircle,
      emphasis: 'card',
      className: 'border-brand-muted/40 bg-brand-light text-brand-darkest shadow-md',
    },
    {
      to: '/worker/certificate',
      title: 'Earnings letter',
      subtitle: 'Verified shifts summary',
      icon: FileText,
      emphasis: 'card',
      className: 'border-brand-muted/40 bg-brand-light text-brand-darkest shadow-md',
    },
    {
      to: '/worker/benchmark',
      title: 'City pay check',
      subtitle: 'Your pay vs city average',
      icon: BarChart3,
      emphasis: 'card',
      className: 'border-brand-muted/40 bg-brand-light text-brand-darkest shadow-md',
    },
    {
      to: '/worker/shifts',
      title: 'All my shifts',
      subtitle: 'List & compare pay',
      icon: ClipboardCheck,
      emphasis: 'card',
      className: 'border-brand-muted/40 bg-brand-light text-brand-darkest shadow-md',
    },
  ]

  return (
    <div className="space-y-5 pb-10">
      {/* Rider hero — Uber/Foodpanda-style: big earnings, clear CTAs */}
      <section className="relative overflow-hidden rounded-3xl border border-brand-dark/20 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-brand-darkest px-4 py-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.45)] sm:px-6 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-brand-primary/25 blur-3xl"
        />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
              <Bike className="h-3.5 w-3.5" aria-hidden />
              Rider home
            </div>
            <div>
              <p className="text-sm font-medium text-white/70">{greet}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl lg:text-[2rem]">
                {firstName}
              </h1>
              {city ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/75">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                  {city}
                </p>
              ) : null}
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                Add shifts, track verification, and report issues — like the earnings summary in ride-hailing apps.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:max-w-md lg:w-auto lg:min-w-[280px]">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200/90">Last 7 days</p>
              <p className="text-[10px] text-white/55">Net amount from shifts you logged in the last 7 days</p>
              <p className="mt-2 text-3xl font-black tabular-nums tracking-tight sm:text-4xl">
                {formatCurrency(metrics.weekNet)}
              </p>
              <p className="mt-1 text-xs text-white/60">
                Last ~30 days: <span className="font-semibold text-white/85">{formatCurrency(metrics.monthNet)}</span>
              </p>
            </div>
            <Link
              to="/worker/shifts"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-brand-darkest shadow-lg transition-transform active:scale-[0.99] touch-manipulation hover:bg-white/95"
            >
              <PlusCircle className="h-5 w-5 text-emerald-600" aria-hidden />
              Add today&apos;s shift
            </Link>
          </div>
        </div>

        {verificationSummary ? (
          <div className="relative z-10 mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-xs sm:text-sm">
            <span className="font-semibold text-white/90">Verification:</span>
            <span className="text-white/75">
              <span className="text-amber-200">{verificationSummary.pending}</span> waiting
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/75">
              <span className="text-emerald-200">{verificationSummary.verified}</span> cleared
            </span>
            <span className="text-white/40">·</span>
            <span className="text-white/75">
              <span className="text-rose-200">{verificationSummary.flagged}</span> need fix
            </span>
            {verificationSummary.unverifiable > 0 ? (
              <>
                <span className="text-white/40">·</span>
                <span className="text-white/75">
                  <span className="text-white/60">{verificationSummary.unverifiable}</span> can&apos;t verify
                </span>
              </>
            ) : null}
          </div>
        ) : null}
      </section>

      {metrics.needsAttention > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-bold">Action suggested</p>
            <p className="mt-1 text-amber-950/85">
              <strong>{metrics.needsAttention}</strong> shift log{metrics.needsAttention === 1 ? ' is' : 's are'} still pending
              or flagged — the verifier may need clearer proof.{' '}
              <Link to="/worker/shifts" className="font-bold underline underline-offset-2 hover:no-underline">
                Open shifts
              </Link>
            </p>
          </div>
        </div>
      ) : null}

      {shiftLogsQuery.isError ? (
        <p className="rounded-xl border border-brand-muted/35 bg-brand-light/80 px-4 py-3 text-sm text-brand-muted">
          {parseApiError(shiftLogsQuery.error)}
        </p>
      ) : null}

      <WorkerStatsCards stats={stats} isLoading={shiftLogsQuery.isLoading} riderMode />

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted">Quick actions</h2>
        <p className="mt-1 text-xs text-brand-dark/75">Large buttons — easy to tap on your phone</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.to + action.title}
              to={action.to}
              className={`group flex min-h-[88px] items-center gap-3 rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] touch-manipulation ${action.className}`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 group-hover:opacity-95 ${
                  action.emphasis === 'heroGreen'
                    ? 'bg-white/15 ring-white/25'
                    : action.emphasis === 'heroInk'
                      ? 'bg-brand-light/15 ring-brand-light/30'
                      : 'bg-brand-muted/15 ring-brand-muted/25'
                }`}
              >
                <action.icon className="h-6 w-6" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-tight">{action.title}</p>
                <p
                  className={`mt-0.5 text-xs leading-snug ${
                    action.emphasis === 'heroGreen'
                      ? 'text-white/85'
                      : action.emphasis === 'heroInk'
                        ? 'text-brand-light/85'
                        : 'text-brand-dark/70'
                  }`}
                >
                  {action.subtitle}
                </p>
              </div>
              <ArrowRight
                className={`h-5 w-5 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5 ${
                  action.emphasis === 'heroGreen' || action.emphasis === 'heroInk' ? 'text-brand-light' : 'text-brand-darkest'
                }`}
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-brand-muted/35 bg-brand-light/90 p-4 shadow-[0_12px_32px_rgba(33,42,49,0.1)] sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted">Recent shifts</h2>
            <p className="mt-1 text-xs text-brand-dark/75">Newest first — platform and status</p>
          </div>
          <Link
            to="/worker/shifts"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {shiftLogsQuery.isLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-brand-muted/20" />
            ))}
          </div>
        ) : metrics.recent.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-brand-muted/50 bg-brand-light/60 px-4 py-6 text-center text-sm text-brand-muted">
            No shifts saved yet. Start with &quot;Add today&apos;s shift&quot; above.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-brand-muted/25 rounded-2xl border border-brand-muted/25 bg-brand-light/80">
            {metrics.recent.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-4">
                <div className="min-w-0">
                  <p className="font-semibold text-brand-darkest">{formatDate(row.date)}</p>
                  <p className="text-xs text-brand-muted">{normalizePlatformName(row.platform)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums text-brand-darkest">{formatCurrency(row.net_received)}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${shiftBadgeClassByStatus(row.status)}`}
                  >
                    {row.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default WorkerOverviewPage
