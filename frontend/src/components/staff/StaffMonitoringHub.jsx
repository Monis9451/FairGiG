import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  getCommissionTrends,
  getGrievanceCategoryWindow,
  getGrievanceClusters,
  getIncomeDistributionByZone,
  getIncomeVolatilityByZone,
} from '@/api/staffAnalytics'
import { getVerifierVulnerabilityFlags } from '@/api/verifier'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatPercent } from '@/utils/formatters'

const parseApiError = (error) => {
  const detail = error?.response?.data?.detail

  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (detail && typeof detail === 'object' && detail.message) {
    return detail.message
  }

  if (error?.response?.data?.error) {
    return error.response.data.error
  }

  return error?.message || 'Request failed. Please try again.'
}

const palette = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#ca8a04',
  '#9333ea',
  '#0891b2',
  '#ea580c',
  '#4f46e5',
]

export function StaffMonitoringHub() {
  const [vulnThresholdDraft, setVulnThresholdDraft] = useState('20')
  const [vulnThreshold, setVulnThreshold] = useState(20)
  const [commissionMonthsDraft, setCommissionMonthsDraft] = useState('12')
  const [commissionMonths, setCommissionMonths] = useState(12)
  const [volLookbackDraft, setVolLookbackDraft] = useState('24')
  const [volLookback, setVolLookback] = useState(24)
  const [clusterFocus, setClusterFocus] = useState('deactivation')

  const vulnerabilityQuery = useQuery({
    queryKey: ['staff-vulnerability-flags', vulnThreshold],
    queryFn: () => getVerifierVulnerabilityFlags({ threshold: vulnThreshold }),
    staleTime: 30_000,
  })

  const commissionQuery = useQuery({
    queryKey: ['staff-commission-trends', commissionMonths],
    queryFn: () => getCommissionTrends({ months: commissionMonths }),
    staleTime: 60_000,
  })

  const volatilityQuery = useQuery({
    queryKey: ['staff-income-volatility', volLookback],
    queryFn: () => getIncomeVolatilityByZone({ lookbackMonths: volLookback }),
    staleTime: 60_000,
  })

  const clustersQuery = useQuery({
    queryKey: ['staff-grievance-clusters', clusterFocus],
    queryFn: () => getGrievanceClusters({ focus: clusterFocus, limit: 800 }),
    staleTime: 45_000,
  })

  const categoryWindowQuery = useQuery({
    queryKey: ['staff-grievance-category-window', 7],
    queryFn: () => getGrievanceCategoryWindow({ days: 7 }),
    staleTime: 60_000,
  })

  const distributionQuery = useQuery({
    queryKey: ['staff-income-distribution-by-zone'],
    queryFn: () => getIncomeDistributionByZone({ lookbackMonths: 24, bins: 10 }),
    staleTime: 90_000,
  })

  const commissionChartData = useMemo(() => {
    const series = commissionQuery.data?.series ?? []
    if (series.length === 0) {
      return []
    }
    const months = [...new Set(series.map((s) => s.month))].sort()
    const platforms = [...new Set(series.map((s) => s.platform))].sort()

    return months.map((month) => {
      const row = { month }
      for (const p of platforms) {
        const point = series.find((s) => s.month === month && s.platform === p)
        row[p] = point != null ? point.avg_commission_percent : null
      }
      return row
    })
  }, [commissionQuery.data?.series])

  const commissionPlatforms = useMemo(() => {
    const series = commissionQuery.data?.series ?? []
    return [...new Set(series.map((s) => s.platform))].sort()
  }, [commissionQuery.data?.series])

  const volatilityChartData = useMemo(() => {
    const zones = volatilityQuery.data?.zones ?? []
    return zones.slice(0, 16).map((z) => ({
      ...z,
      label: `${z.city_zone.slice(0, 18)}${z.city_zone.length > 18 ? '…' : ''} · ${z.platform}`,
    }))
  }, [volatilityQuery.data?.zones])

  return (
    <div className="mt-8 space-y-10">
      <section className="rounded-xl border border-brand-muted/60 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-darkest">Income drop flags</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Workers whose verified net income fell month-over-month by more than the threshold (aggregate trend signal).
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor="vuln_threshold">Threshold %</Label>
              <Input
                id="vuln_threshold"
                className="mt-1 w-24"
                value={vulnThresholdDraft}
                onChange={(e) => setVulnThresholdDraft(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="mt-6 rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
              onClick={() => {
                const n = Number(vulnThresholdDraft)
                if (Number.isFinite(n) && n > 0) {
                  setVulnThreshold(n)
                }
              }}
            >
              Apply
            </Button>
          </div>
        </div>
        {vulnerabilityQuery.isLoading ? (
          <Skeleton className="mt-4 h-32 w-full" />
        ) : vulnerabilityQuery.isError ? (
          <p className="mt-4 text-sm text-red-600">{parseApiError(vulnerabilityQuery.error)}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <p className="mb-2 text-sm font-semibold text-brand-dark">
              {vulnerabilityQuery.data?.count ?? 0} workers over {vulnThreshold}% drop
              {(vulnerabilityQuery.data?.workers ?? []).length > 24 ? ' · showing first 24' : ''}
            </p>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-muted/50 text-xs uppercase text-brand-muted">
                  <th className="py-2 pr-2">Worker</th>
                  <th className="py-2 pr-2">City</th>
                  <th className="py-2 pr-2">Prior month</th>
                  <th className="py-2 pr-2">Current</th>
                  <th className="py-2">Drop</th>
                </tr>
              </thead>
              <tbody>
                {(vulnerabilityQuery.data?.workers ?? []).slice(0, 24).map((w) => (
                  <tr key={`${w.worker_id}-${w.current_month}`} className="border-b border-brand-light">
                    <td className="py-2 pr-2">
                      <p className="font-medium text-brand-darkest">
                        {w.worker_name?.trim() || w.worker_email?.trim() || 'Worker account'}
                      </p>
                      {w.worker_email && w.worker_name?.trim() ? (
                        <p className="text-xs text-brand-muted">{w.worker_email}</p>
                      ) : null}
                    </td>
                    <td className="py-2 pr-2 text-brand-muted">{w.city_zone || '—'}</td>
                    <td className="py-2 pr-2">{formatCurrency(w.previous_month_income)}</td>
                    <td className="py-2 pr-2">{formatCurrency(w.current_month_income)}</td>
                    <td className="py-2 font-semibold text-red-700">{formatPercent(w.drop_percentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-brand-muted/60 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-darkest">Commission rate by platform</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Mean deductions ÷ gross (verified logs), by month — proxy for platform take-rate changes.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor="comm_months">Months back</Label>
              <Input
                id="comm_months"
                className="mt-1 w-24"
                value={commissionMonthsDraft}
                onChange={(e) => setCommissionMonthsDraft(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="mt-6 rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
              onClick={() => {
                const n = Number(commissionMonthsDraft)
                if (Number.isFinite(n) && n >= 1 && n <= 36) {
                  setCommissionMonths(Math.floor(n))
                }
              }}
            >
              Apply
            </Button>
          </div>
        </div>
        {commissionQuery.isLoading ? (
          <Skeleton className="mt-4 h-72 w-full" />
        ) : commissionQuery.isError ? (
          <p className="mt-4 text-sm text-red-600">{parseApiError(commissionQuery.error)}</p>
        ) : commissionChartData.length === 0 ? (
          <p className="mt-4 text-sm text-brand-muted">Not enough verified earnings in this window.</p>
        ) : (
          <div className="mt-4 h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commissionChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  label={{ value: '% of gross', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                />
                <Tooltip formatter={(value) => (value != null ? `${Number(value).toFixed(1)}%` : '—')} />
                <Legend />
                {commissionPlatforms.map((p, i) => (
                  <Line
                    key={p}
                    type="monotone"
                    dataKey={p}
                    stroke={palette[i % palette.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-brand-muted/60 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-darkest">Income volatility by city zone</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Coefficient of variation of net hourly pay (verified): higher means more spread across workers in that zone.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor="vol_back">Lookback months</Label>
              <Input
                id="vol_back"
                className="mt-1 w-24"
                value={volLookbackDraft}
                onChange={(e) => setVolLookbackDraft(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="mt-6 rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
              onClick={() => {
                const n = Number(volLookbackDraft)
                if (Number.isFinite(n) && n >= 1 && n <= 48) {
                  setVolLookback(Math.floor(n))
                }
              }}
            >
              Apply
            </Button>
          </div>
        </div>
        {volatilityQuery.isLoading ? (
          <Skeleton className="mt-4 h-72 w-full" />
        ) : volatilityQuery.isError ? (
          <p className="mt-4 text-sm text-red-600">{parseApiError(volatilityQuery.error)}</p>
        ) : volatilityChartData.length === 0 ? (
          <p className="mt-4 text-sm text-brand-muted">No zone/platform groups met the minimum sample size.</p>
        ) : (
          <div className="mt-4 h-96 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={volatilityChartData}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                <YAxis type="category" dataKey="label" width={200} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'volatility_index_percent') {
                      return [`${Number(value).toFixed(1)}%`, 'CV (×100)']
                    }
                    return [value, name]
                  }}
                />
                <Bar dataKey="volatility_index_percent" fill="#2563eb" name="Volatility (CV ×100)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-brand-muted/60 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-darkest">Grievance clusters</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Grouped by platform, worker city zone, and category. Deactivation focus matches category/tags/text
              containing “deactiv”.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              className={
                clusterFocus === 'deactivation'
                  ? 'rounded-md border border-brand-primary bg-brand-primary px-3 py-2 text-sm font-semibold text-brand-light'
                  : 'rounded-md border border-brand-muted bg-white px-3 py-2 text-sm font-semibold text-brand-darkest'
              }
              onClick={() => setClusterFocus('deactivation')}
            >
              Deactivation focus
            </Button>
            <Button
              type="button"
              className={
                clusterFocus === 'all'
                  ? 'rounded-md border border-brand-primary bg-brand-primary px-3 py-2 text-sm font-semibold text-brand-light'
                  : 'rounded-md border border-brand-muted bg-white px-3 py-2 text-sm font-semibold text-brand-darkest'
              }
              onClick={() => setClusterFocus('all')}
            >
              All categories
            </Button>
          </div>
        </div>
        {clustersQuery.isLoading ? (
          <Skeleton className="mt-4 h-40 w-full" />
        ) : clustersQuery.isError ? (
          <p className="mt-4 text-sm text-red-600">{parseApiError(clustersQuery.error)}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <p className="mb-2 text-sm text-brand-muted">
              {clustersQuery.data?.total_in_focus ?? 0} grievances in focus · {clustersQuery.data?.cluster_count ?? 0}{' '}
              clusters (last {clustersQuery.data?.scan_limit ?? 0} scanned)
            </p>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-muted/50 text-xs uppercase text-brand-muted">
                  <th className="py-2 pr-2">Platform</th>
                  <th className="py-2 pr-2">City zone</th>
                  <th className="py-2 pr-2">Category</th>
                  <th className="py-2 pr-2">Count</th>
                  <th className="py-2 pr-2">Open / Esc / Res</th>
                  <th className="py-2">Top tags</th>
                </tr>
              </thead>
              <tbody>
                {(clustersQuery.data?.clusters ?? []).slice(0, 25).map((c) => (
                  <tr key={c.cluster_id} className="border-b border-brand-light">
                    <td className="py-2 pr-2 font-medium">{c.platform}</td>
                    <td className="py-2 pr-2 text-brand-muted">{c.city_zone}</td>
                    <td className="py-2 pr-2">{c.category}</td>
                    <td className="py-2 pr-2 font-semibold">{c.count}</td>
                    <td className="py-2 pr-2 text-xs text-brand-muted">
                      {c.by_status?.open ?? 0} / {c.by_status?.escalated ?? 0} / {c.by_status?.resolved ?? 0}
                    </td>
                    <td className="py-2 text-xs text-brand-dark">
                      {(c.top_tags ?? []).slice(0, 4).map((t) => `${t.tag} (${t.count})`).join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-brand-muted/60 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-brand-darkest">Top grievance categories (rolling 7 days)</h2>
        <p className="mt-1 text-sm text-brand-muted">Counts by platform × category for complaints filed in the last week.</p>
        {categoryWindowQuery.isLoading ? (
          <Skeleton className="mt-4 h-32 w-full" />
        ) : categoryWindowQuery.isError ? (
          <p className="mt-4 text-sm text-red-600">{parseApiError(categoryWindowQuery.error)}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-muted/50 text-xs uppercase text-brand-muted">
                  <th className="py-2 pr-2">Platform</th>
                  <th className="py-2 pr-2">Category</th>
                  <th className="py-2 pr-2">Count</th>
                  <th className="py-2">Open / Esc / Res</th>
                </tr>
              </thead>
              <tbody>
                {(categoryWindowQuery.data?.categories ?? []).slice(0, 20).map((row, i) => (
                  <tr key={`${row.platform}-${row.category}-${i}`} className="border-b border-brand-light">
                    <td className="py-2 pr-2 font-medium">{row.platform}</td>
                    <td className="py-2 pr-2">{row.category}</td>
                    <td className="py-2 pr-2 font-semibold">{row.count}</td>
                    <td className="py-2 text-xs text-brand-muted">
                      {row.by_status?.open ?? 0} / {row.by_status?.escalated ?? 0} / {row.by_status?.resolved ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-brand-muted/60 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-brand-darkest">Income distribution by city zone</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Verified hourly net: percentiles and histogram bins (equal width) per zone × platform.
        </p>
        {distributionQuery.isLoading ? (
          <Skeleton className="mt-4 h-40 w-full" />
        ) : distributionQuery.isError ? (
          <p className="mt-4 text-sm text-red-600">{parseApiError(distributionQuery.error)}</p>
        ) : (
          <div className="mt-4 space-y-6">
            {(distributionQuery.data?.zones ?? []).slice(0, 8).map((z) => (
              <div key={`${z.city_zone}-${z.platform}`} className="border-b border-brand-light pb-4 last:border-0">
                <p className="font-semibold text-brand-darkest">
                  {z.city_zone} · {z.platform}{' '}
                  <span className="text-sm font-normal text-brand-muted">(n={z.sample_size})</span>
                </p>
                <p className="mt-1 text-xs text-brand-muted">
                  p10 {formatCurrency(z.percentiles?.p10)} · p25 {formatCurrency(z.percentiles?.p25)} · p50{' '}
                  {formatCurrency(z.percentiles?.p50)} · p75 {formatCurrency(z.percentiles?.p75)} · p90{' '}
                  {formatCurrency(z.percentiles?.p90)}
                </p>
                <p className="mt-2 text-xs text-brand-muted">
                  Bins:{' '}
                  {(z.histogram ?? [])
                    .map((b) => `${formatCurrency(b.bucket_min)}–${formatCurrency(b.bucket_max)}: ${b.count}`)
                    .join(' · ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
