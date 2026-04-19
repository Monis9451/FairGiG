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

import { BarChart3, Info } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/utils/formatters'
import { cn } from '@/lib/utils'

const selectClassName =
  'h-11 w-full rounded-lg border border-brand-muted/40 bg-white px-3 text-sm text-brand-darkest shadow-sm transition-colors focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/25'

const StatTile = ({ label, value, hint, emphasis }) => (
  <div
    className={cn(
      'rounded-xl border px-3 py-3 sm:px-4',
      emphasis
        ? 'border-brand-primary/35 bg-brand-primary/10'
        : 'border-brand-muted/25 bg-brand-light/40'
    )}
  >
    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">{label}</p>
    <p className={cn('mt-1 text-lg font-bold tabular-nums text-brand-darkest', emphasis && 'text-brand-primary')}>
      {value}
    </p>
    {hint ? <p className="mt-1 text-[11px] leading-snug text-brand-muted">{hint}</p> : null}
  </div>
)

const WorkerBenchmarkCard = ({
  selectedPlatform,
  setSelectedPlatform,
  platformOptions,
  cityZone,
  benchmarkQuery,
  chartData,
  myOverallHourly,
  parseApiError,
}) => {
  const d = benchmarkQuery.data || {}
  const median = Number(d.median_hourly_pay || 0)
  const average = Number(d.average_hourly_pay || 0)
  const p25 = Number(d.p25_hourly_pay || 0)
  const p75 = Number(d.p75_hourly_pay || 0)
  const riders = Number(d.sample_riders ?? d.sample_size ?? 0)
  const shifts = Number(d.sample_shifts ?? 0)
  const periodDays = Number(d.period_days ?? 120)

  const diff =
    myOverallHourly != null && median > 0 ? Number((myOverallHourly - median).toFixed(2)) : null
  const diffPct =
    diff != null && median > 0 ? Number(((diff / median) * 100).toFixed(1)) : null

  const vsCity =
    diff == null || median <= 0
      ? null
      : diffPct != null && Math.abs(diffPct) < 3
        ? `Very close to the city middle rider (within about ${Math.abs(diffPct)}%).`
        : diff >= 0
          ? `About ${formatCurrency(Math.abs(diff))} per hour above the city middle (~${diffPct >= 0 ? '+' : ''}${diffPct}% vs middle rider).`
          : `About ${formatCurrency(Math.abs(diff))} per hour below the city middle (~${diffPct}%).`

  const quickLabel =
    diff == null || median <= 0
      ? '—'
      : diffPct != null && Math.abs(diffPct) < 3
        ? 'Close to middle'
        : diff > 0
          ? 'Above middle'
          : 'Below middle'

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-brand-muted/25 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-brand-darkest">Compare your pay</h2>
        <p className="mt-1 text-sm text-brand-muted">
          City numbers use <strong className="font-medium text-brand-darkest">verified</strong> shifts only, same app
          as selected, in your city, over roughly the last {periodDays} days. We take each rider&apos;s overall hourly
          (total net ÷ total hours), then show the <strong className="font-medium text-brand-darkest">middle rider</strong>{' '}
          (median) — not one stuck shift.
        </p>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-[200px]">
            <Label htmlFor="benchmark_platform" className="text-xs font-medium text-brand-dark">
              App / platform
            </Label>
            <select
              id="benchmark_platform"
              value={selectedPlatform}
              onChange={(event) => setSelectedPlatform(event.target.value)}
              className={cn(selectClassName, 'mt-1.5')}
            >
              {platformOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div
            className={cn(
              'rounded-xl border px-3 py-2 text-sm',
              cityZone
                ? 'border-brand-muted/30 bg-brand-light/50 text-brand-darkest'
                : 'border-amber-300/60 bg-amber-50 text-amber-950'
            )}
          >
            <p>
              <span className="font-semibold">Your city:</span>{' '}
              {cityZone || 'Add a city in your profile to load benchmarks.'}
            </p>
          </div>
        </div>
      </section>

      {benchmarkQuery.isLoading ? (
        <div className="space-y-4 rounded-2xl border border-brand-muted/25 bg-white p-4">
          <Skeleton className="h-6 w-64" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : benchmarkQuery.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {parseApiError(benchmarkQuery.error)}
        </p>
      ) : !cityZone ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Set your city in your profile so we can load other riders&apos; stats for your area.
        </p>
      ) : riders < 3 ? (
        <div className="rounded-2xl border border-brand-muted/30 bg-brand-light/40 p-4 text-sm text-brand-dark">
          <p className="font-semibold text-brand-darkest">Not enough riders to compare yet</p>
          <p className="mt-2 text-brand-muted">
            We need a few verified riders in <strong>{cityZone}</strong> on {selectedPlatform} in the last ~{periodDays}{' '}
            days. Check back later, or try another app from the list if you work on more than one.
          </p>
          <p className="mt-2 text-xs text-brand-muted">
            Current sample: {riders} rider{riders === 1 ? '' : 's'}, {shifts} verified shift
            {shifts === 1 ? '' : 's'}.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted">
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-muted/35 bg-white px-2.5 py-1 font-semibold text-brand-darkest">
              <BarChart3 size={13} aria-hidden />
              Your chart: {chartData.length} verified shift{chartData.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StatTile
              label="Your hourly (this app)"
              value={myOverallHourly != null ? formatCurrency(myOverallHourly) : '—'}
              hint="All your verified shifts on this app (total net ÷ total hours)."
              emphasis
            />
            <StatTile
              label="City middle rider"
              value={formatCurrency(median)}
              hint="Half of riders in your city earn more per hour than this, half earn less (same rules as above)."
            />
            <StatTile
              label="City average rider"
              value={formatCurrency(average)}
              hint="Simple average across riders — can be pulled up by a few high earners."
            />
            <StatTile
              label="Typical range (middle 50%)"
              value={
                p25 > 0 && p75 > 0 ? `${formatCurrency(p25)} – ${formatCurrency(p75)}` : '—'
              }
              hint="Most riders fall between these hourly amounts (not the very lowest or highest)."
            />
            <StatTile
              label="Based on"
              value={`${riders} riders`}
              hint={`${shifts} verified shifts over ~${periodDays} days in ${cityZone}.`}
            />
            <StatTile
              label="Quick read"
              value={quickLabel}
              hint={vsCity || 'Log verified shifts on this app to see how you stack up.'}
            />
          </div>

          <div className="flex gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-3 py-2 text-xs text-brand-darkest">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
            <p>
              The <strong>orange line</strong> in the chart is flat on purpose: it is one city-wide &quot;middle
              rider&quot; number, not a day-by-day city average. <strong>Blue</strong> is your hourly on each verified
              shift.
            </p>
          </div>

          {chartData.length === 0 ? (
            <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
              No verified shifts for {selectedPlatform} yet. Add or get shifts verified to see your line.
            </p>
          ) : (
            <div className="h-[min(22rem,50vh)] w-full min-h-[240px] overflow-hidden rounded-2xl border border-brand-muted/25 bg-brand-light/50 p-2 sm:p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-muted)" opacity={0.35} />
                  <XAxis dataKey="dateLabel" tick={{ fill: 'var(--color-darkest)', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: 'var(--color-darkest)', fontSize: 11 }}
                    tickFormatter={(v) => `PKR ${v}`}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-light)',
                      border: '1px solid var(--color-muted)',
                      borderRadius: '12px',
                      color: 'var(--color-darkest)',
                      boxShadow: '0 12px 24px rgba(33, 42, 49, 0.2)',
                    }}
                    formatter={(value, name) => [formatCurrency(value), name]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="myHourly"
                    name="My hourly (this shift)"
                    stroke="var(--color-primary)"
                    strokeWidth={2.6}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cityTypical"
                    name="City middle rider (flat)"
                    stroke="#c2410c"
                    strokeWidth={2.2}
                    strokeDasharray="6 4"
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default WorkerBenchmarkCard
