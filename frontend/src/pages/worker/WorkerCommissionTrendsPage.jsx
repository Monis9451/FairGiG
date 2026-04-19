import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Percent } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getWorkerEarningsTrends } from '@/api/worker'
import { WORKER_PLATFORM_OPTIONS } from '@/features/worker/constants'
import { parseApiError } from '@/features/worker/utils'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPercent } from '@/utils/formatters'
const selectClassName =
  'h-11 w-full rounded-lg border border-brand-darkest/15 bg-white px-3 text-sm text-brand-darkest transition-colors focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20'

const LOOKBACK_OPTIONS = [
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
  { value: 18, label: '18 months' },
  { value: 24, label: '24 months' },
]

const formatMonthKey = (ym) => {
  if (!ym || String(ym).length < 7) return String(ym || '')
  const [y, m] = String(ym).split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return String(ym)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

const shortWeekLabel = (periodStart) => {
  const d = String(periodStart || '').slice(0, 10)
  if (d.length !== 10) return String(periodStart || '')
  const parsed = new Date(`${d}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const WorkerCommissionTrendsPage = () => {
  const [granularity, setGranularity] = useState('month')
  const [lookbackMonths, setLookbackMonths] = useState(12)
  const [platform, setPlatform] = useState('')

  const trendsQuery = useQuery({
    queryKey: ['worker-earnings-trends', granularity, lookbackMonths, platform, true],
    queryFn: () =>
      getWorkerEarningsTrends({
        granularity,
        lookbackMonths,
        platform: platform || undefined,
        verifiedOnly: true,
      }),
    staleTime: 45_000,
  })

  const chartData = useMemo(() => {
    const series = trendsQuery.data?.series ?? []
    return series.map((row) => {
      const pct =
        row.avg_commission_percent != null && Number.isFinite(Number(row.avg_commission_percent))
          ? Number(row.avg_commission_percent)
          : null
      const chartLabel =
        row.granularity === 'week' ? shortWeekLabel(row.period_start) : formatMonthKey(row.period_key)
      return {
        ...row,
        chartLabel,
        commissionPct: pct,
      }
    })
  }, [trendsQuery.data?.series])

  const hasCommissionPoints = chartData.some((r) => r.commissionPct != null && r.total_gross > 0)

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
        <div className="mt-3 flex flex-wrap items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-primary/30 bg-brand-primary/10 text-brand-primary">
            <Percent className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand-darkest sm:text-2xl">Platform cuts over time</h1>
            <p className="mt-1 max-w-2xl text-sm text-brand-muted">
              See how much of your <span className="font-medium text-brand-darkest">gross</span> went to fees and
              deductions each month or week—using only <span className="font-medium text-brand-darkest">verified</span>{' '}
              shifts, same idea as the staff dashboard but just for you.
            </p>
            <p className="mt-2 text-xs text-brand-muted">
              <Link
                to="/worker/benchmark"
                className="font-semibold text-brand-primary underline-offset-2 hover:underline"
              >
                Pay vs city
              </Link>{' '}
              — compare your hourly to other riders in your zone.
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-brand-muted/25 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="commission_granularity" className="text-xs font-medium text-brand-dark">
              Group by
            </Label>
            <select
              id="commission_granularity"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
              className={selectClassName}
            >
              <option value="month">Month</option>
              <option value="week">Week (starts Monday)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="commission_lookback" className="text-xs font-medium text-brand-dark">
              How far back
            </Label>
            <select
              id="commission_lookback"
              value={lookbackMonths}
              onChange={(e) => setLookbackMonths(Number(e.target.value))}
              className={selectClassName}
            >
              {LOOKBACK_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
            <Label htmlFor="commission_platform" className="text-xs font-medium text-brand-dark">
              App / platform
            </Label>
            <select
              id="commission_platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={selectClassName}
            >
              <option value="">All apps (combined per period)</option>
              {WORKER_PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-brand-muted">
          Each point is{' '}
          <span className="font-medium text-brand-darkest">total deductions divided by total gross</span> for that period.
          If you had no gross in a period, that point is skipped.
        </p>

        {trendsQuery.isLoading ? (
          <Skeleton className="mt-6 h-[min(22rem,50vh)] w-full min-h-[240px] rounded-xl" />
        ) : trendsQuery.isError ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">
            {parseApiError(trendsQuery.error)}
          </p>
        ) : !hasCommissionPoints ? (
          <p className="mt-6 rounded-lg border border-brand-muted/30 bg-brand-light/40 px-4 py-3 text-sm text-brand-muted">
            No verified shifts with gross in this range yet. Log shifts, get them verified, or widen the time window.
          </p>
        ) : (
          <div className="mt-6 h-[min(22rem,50vh)] w-full min-h-[240px] rounded-xl border border-brand-darkest/10 bg-white p-3 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-muted)" opacity={0.25} />
                <XAxis
                  dataKey="chartLabel"
                  tick={{ fill: 'var(--color-darkest)', fontSize: 11 }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: 'var(--color-darkest)', fontSize: 11 }}
                  width={44}
                  domain={[0, 'auto']}
                  tickFormatter={(v) => `${v}%`}
                  label={{
                    value: '% of gross',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 10, fill: 'var(--color-muted)' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid rgba(33, 42, 49, 0.12)',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                  formatter={(value) => (value != null ? formatPercent(Number(value)) : '—')}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.period_label || ''}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="commissionPct"
                  name="Fees & deductions (share of gross)"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  )
}

export default WorkerCommissionTrendsPage
