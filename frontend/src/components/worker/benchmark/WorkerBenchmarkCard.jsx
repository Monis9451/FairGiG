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

import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { formatCurrency } from '@/utils/formatters'

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
    <WorkerSectionCard title="Earnings Benchmark Trend">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="benchmark_platform">Benchmark Platform</Label>
          <select
            id="benchmark_platform"
            value={selectedPlatform}
            onChange={(event) => setSelectedPlatform(event.target.value)}
            className="h-10 rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {platformOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-brand-muted">
          <p>City Zone: {cityZone || 'Not available'}</p>
          <p>
            Median hourly benchmark: {formatCurrency(Number(benchmarkQuery.data?.median_hourly_pay || 0))}
          </p>
        </div>
      </div>

      {benchmarkQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : benchmarkQuery.isError ? (
        <p className="text-sm text-brand-muted">{parseApiError(benchmarkQuery.error)}</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-brand-muted">
          No chart data yet for {selectedPlatform}. Add shift logs to see trend.
        </p>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 6 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-muted)" />
              <XAxis dataKey="dateLabel" tick={{ fill: 'var(--color-darkest)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--color-darkest)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-light)',
                  border: '1px solid var(--color-muted)',
                  color: 'var(--color-darkest)',
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="myHourly"
                name="My Hourly"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cityMedian"
                name="City Median"
                stroke="var(--color-dark)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </WorkerSectionCard>
  )
}

export default WorkerBenchmarkCard
