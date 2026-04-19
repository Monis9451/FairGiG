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
  'h-11 w-full rounded-lg border border-brand-darkest/15 bg-white px-3 text-sm text-brand-darkest transition-colors focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20'

/** Minimal stat card: white surface, single hairline border, clear separation. */
const StatTile = ({ label, value, hint, emphasis }) => (
  <div
    className={cn(
      'flex flex-col rounded-lg border bg-white px-4 py-4',
      emphasis ? 'border-brand-primary border-l-[3px] border-l-brand-primary shadow-sm' : 'border-brand-darkest/12'
    )}
  >
    <p className="text-xs font-medium text-brand-muted">{label}</p>
    <p
      className={cn(
        'mt-2 text-xl font-semibold tabular-nums tracking-tight text-brand-darkest',
        emphasis && 'text-brand-primary'
      )}
    >
      {value}
    </p>
    {hint ? (
      <p className="mt-3 border-t border-brand-darkest/[0.06] pt-3 text-[11px] leading-relaxed text-brand-muted">
        {hint}
      </p>
    ) : null}
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
    <div className="space-y-8">
      <section className="border-b border-brand-darkest/10 pb-8">
        <h2 className="text-base font-semibold text-brand-darkest">Compare your pay</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-muted">
          City numbers use <span className="text-brand-darkest">verified</span> shifts only, same app as selected, in
          your city, over roughly the last {periodDays} days. Each rider&apos;s hourly is total net ÷ total hours; the
          city <span className="text-brand-darkest">middle rider</span> is the median of those — not one odd shift.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-xs">
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
              'rounded-lg border px-3 py-2.5 text-sm',
              cityZone
                ? 'border-brand-darkest/12 bg-white text-brand-darkest'
                : 'border-amber-200 bg-amber-50/80 text-amber-950'
            )}
          >
            <span className="font-medium text-brand-darkest">Your city</span>
            <span className="text-brand-muted"> — </span>
            {cityZone || 'Add a city in your profile to load benchmarks.'}
          </div>
        </div>
      </section>

      {benchmarkQuery.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-5 w-48 rounded-md" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      ) : benchmarkQuery.isError ? (
        <p className="rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-800">
          {parseApiError(benchmarkQuery.error)}
        </p>
      ) : !cityZone ? (
        <p className="rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm text-amber-950">
          Set your city in your profile so we can load other riders&apos; stats for your area.
        </p>
      ) : riders < 3 ? (
        <div className="rounded-lg border border-brand-darkest/12 bg-white p-4 text-sm">
          <p className="font-medium text-brand-darkest">Not enough riders to compare yet</p>
          <p className="mt-2 text-brand-muted">
            We need a few verified riders in <span className="text-brand-darkest">{cityZone}</span> on{' '}
            {selectedPlatform} in the last ~{periodDays} days. Try again later or another app if you use several.
          </p>
          <p className="mt-3 text-xs text-brand-muted">
            Sample now: {riders} rider{riders === 1 ? '' : 's'}, {shifts} verified shift
            {shifts === 1 ? '' : 's'}.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-brand-muted">
            <span className="inline-flex items-center gap-1.5 font-medium text-brand-darkest">
              <BarChart3 className="h-3.5 w-3.5 text-brand-muted" aria-hidden />
              Chart uses {chartData.length} verified shift{chartData.length === 1 ? '' : 's'} on this app
            </span>
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatTile
              label="Your hourly (this app)"
              value={myOverallHourly != null ? formatCurrency(myOverallHourly) : '—'}
              hint="Your verified shifts: total net ÷ total hours."
              emphasis
            />
            <StatTile
              label="City middle rider"
              value={formatCurrency(median)}
              hint="Half of riders earn more per hour than this, half earn less."
            />
            <StatTile
              label="City average rider"
              value={formatCurrency(average)}
              hint="Mean across riders; a few high earners can pull this up."
            />
            <StatTile
              label="Typical range (middle 50%)"
              value={p25 > 0 && p75 > 0 ? `${formatCurrency(p25)} – ${formatCurrency(p75)}` : '—'}
              hint="Most riders fall between these amounts."
            />
            <StatTile
              label="Based on"
              value={`${riders} riders`}
              hint={`${shifts} verified shifts, ~${periodDays} days, ${cityZone}.`}
            />
            <StatTile
              label="Quick read"
              value={quickLabel}
              hint={vsCity || 'Add verified shifts on this app to compare.'}
            />
          </div>

          <div className="flex gap-3 rounded-lg border border-brand-darkest/10 border-l-[3px] border-l-brand-primary bg-white px-4 py-3 text-xs leading-relaxed text-brand-dark">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
            <p className="text-brand-muted">
              <span className="font-medium text-brand-darkest">Chart:</span> Orange line is flat on purpose — one
              city-wide middle-rider value. Blue is your hourly per verified shift.
            </p>
          </div>

          {chartData.length === 0 ? (
            <p className="rounded-lg border border-brand-darkest/10 bg-white px-4 py-3 text-sm text-brand-muted">
              No verified shifts for {selectedPlatform} yet. Add or get shifts verified to see your line.
            </p>
          ) : (
            <div className="h-[min(22rem,50vh)] w-full min-h-[240px] rounded-lg border border-brand-darkest/12 bg-white p-3 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-muted)" opacity={0.25} />
                  <XAxis dataKey="dateLabel" tick={{ fill: 'var(--color-darkest)', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: 'var(--color-darkest)', fontSize: 11 }}
                    tickFormatter={(v) => `${v}`}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid rgba(33, 42, 49, 0.12)',
                      borderRadius: '8px',
                      color: 'var(--color-darkest)',
                      boxShadow: '0 4px 20px rgba(33, 42, 49, 0.08)',
                    }}
                    formatter={(value, name) => [formatCurrency(value), name]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="myHourly"
                    name="My hourly (this shift)"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cityTypical"
                    name="City middle rider (flat)"
                    stroke="#c2410c"
                    strokeWidth={2}
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
