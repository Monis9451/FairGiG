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

import { BarChart3 } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { formatCurrency } from '@/utils/formatters'

const selectClassName =
  'h-11 rounded-xl border border-brand-primary/35 bg-brand-light px-3 text-sm text-brand-darkest shadow-sm transition-all duration-200 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30'

const WorkerBenchmarkCard = ({
  selectedPlatform,
  setSelectedPlatform,
  platformOptions,
  cityZone,
  benchmarkQuery,
  chartData,
  parseApiError,
}) => {
  return (
    <WorkerSectionCard
      kicker="Trend Analysis"
      title="Earnings Benchmark Trend"
      description="Track your hourly trend against city medians to understand movement over recent shifts."
      actions={
        <span className="inline-flex items-center gap-1 rounded-full border border-brand-muted/40 bg-brand-light/80 px-2.5 py-1 text-xs font-semibold text-brand-dark">
          <BarChart3 size={13} aria-hidden="true" />
          {chartData.length} points
        </span>
      }
    >
      <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="benchmark_platform" className="text-xs uppercase tracking-[0.14em] text-brand-muted">
              Benchmark Platform
            </Label>
            <select
              id="benchmark_platform"
              value={selectedPlatform}
              onChange={(event) => setSelectedPlatform(event.target.value)}
              className={selectClassName}
            >
              {platformOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-brand-muted/35 bg-brand-light/85 px-3 py-2 text-sm text-brand-dark">
            <p>
              <span className="font-semibold">City Zone:</span> {cityZone || 'Not available'}
            </p>
            <p>
              <span className="font-semibold">Median hourly:</span>{' '}
              {formatCurrency(Number(benchmarkQuery.data?.median_hourly_pay || 0))}
            </p>
          </div>
        </div>

        {benchmarkQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        ) : benchmarkQuery.isError ? (
          <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
            {parseApiError(benchmarkQuery.error)}
          </p>
        ) : chartData.length === 0 ? (
          <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
            No chart data yet for {selectedPlatform}. Add shift logs to see trend.
          </p>
        ) : (
          <div className="h-80 w-full overflow-hidden rounded-2xl border border-brand-muted/35 bg-brand-light/82 p-3 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 16, right: 16, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-muted)" opacity={0.35} />
                <XAxis dataKey="dateLabel" tick={{ fill: 'var(--color-darkest)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--color-darkest)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-light)',
                    border: '1px solid var(--color-muted)',
                    borderRadius: '12px',
                    color: 'var(--color-darkest)',
                    boxShadow: '0 12px 24px rgba(33, 42, 49, 0.2)',
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="myHourly"
                  name="My Hourly"
                  stroke="var(--color-primary)"
                  strokeWidth={2.6}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="cityMedian"
                  name="City Median"
                  stroke="var(--color-dark)"
                  strokeWidth={2.2}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </WorkerSectionCard>
  )
}

export default WorkerBenchmarkCard
