import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { getAdvocateBenchmarkComparison } from '@/api/advocate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import WorkerPageHeader from '@/components/worker/WorkerPageHeader'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { WORKER_PLATFORM_OPTIONS } from '@/features/worker/constants'
import { formatCurrency } from '@/utils/formatters'
import useAuthStore from '@/store/authStore'

const AdvocateBenchmarksPage = () => {
  const profileCity = useAuthStore((state) => state.profile?.city_zone)

  const initialCities = profileCity ? [profileCity] : []
  const [platform, setPlatform] = useState('Uber')
  const [cityDraft, setCityDraft] = useState(profileCity || '')
  const [selectedCities, setSelectedCities] = useState(initialCities)
  const [requestSpec, setRequestSpec] = useState({
    platform: 'Uber',
    cityZones: initialCities,
  })

  const benchmarkQuery = useQuery({
    queryKey: ['advocate-benchmark-compare', requestSpec.platform, requestSpec.cityZones.join('|')],
    queryFn: () => getAdvocateBenchmarkComparison(requestSpec),
    enabled: requestSpec.cityZones.length > 0,
    staleTime: 30_000,
  })

  const comparisonRows = useMemo(() => benchmarkQuery.data ?? [], [benchmarkQuery.data])

  const successfulRows = useMemo(
    () => comparisonRows.filter((row) => row.success),
    [comparisonRows]
  )

  const chartData = useMemo(
    () =>
      successfulRows.map((row) => ({
        cityLabel: row.city_zone,
        medianHourly: Number(row.median_hourly_pay || 0),
      })),
    [successfulRows]
  )

  const addCity = () => {
    const normalized = cityDraft.trim()
    if (!normalized) {
      return
    }

    const exists = selectedCities.some((city) => city.toLowerCase() === normalized.toLowerCase())
    if (exists) {
      setCityDraft('')
      return
    }

    setSelectedCities((current) => [...current, normalized])
    setCityDraft('')
  }

  const removeCity = (cityToRemove) => {
    setSelectedCities((current) => current.filter((city) => city !== cityToRemove))
  }

  const runComparison = () => {
    setRequestSpec({
      platform,
      cityZones: selectedCities,
    })
  }

  const hasFailedRows = comparisonRows.some((row) => !row.success)

  return (
    <div className="space-y-5">
      <WorkerPageHeader
        badge="Benchmarks"
        title="Platform Benchmark Comparison"
        description="Compare median and average hourly pay across multiple city zones for the selected platform."
      />

      <WorkerSectionCard
        kicker="Compare"
        title="City Benchmark Inputs"
        description="Add one or more city zones, then run a side-by-side benchmark comparison."
      >
        <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/70 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="adv_benchmark_platform">Platform</Label>
              <select
                id="adv_benchmark_platform"
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                className="h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {WORKER_PLATFORM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="adv_benchmark_city">City Zone</Label>
              <div className="flex gap-2">
                <Input
                  id="adv_benchmark_city"
                  value={cityDraft}
                  onChange={(event) => setCityDraft(event.target.value)}
                  placeholder="Lahore-Central"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addCity()
                    }
                  }}
                />
                <Button
                  type="button"
                  className="rounded-xl border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
                  onClick={addCity}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedCities.length === 0 ? (
              <p className="text-sm text-brand-muted">No city zones selected yet.</p>
            ) : (
              selectedCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => removeCity(city)}
                  className="rounded-full border border-brand-muted bg-brand-light px-3 py-1 text-xs font-semibold text-brand-darkest hover:border-brand-primary/50"
                  title="Remove city"
                >
                  {city} ×
                </button>
              ))
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={runComparison}
              disabled={selectedCities.length === 0}
              className="rounded-xl border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Compare Cities
            </Button>
          </div>
        </div>

        {benchmarkQuery.isLoading ? (
          <p className="text-sm text-brand-muted">Loading comparison...</p>
        ) : benchmarkQuery.isError ? (
          <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
            {benchmarkQuery.error?.response?.data?.error || benchmarkQuery.error?.message || 'Comparison failed.'}
          </p>
        ) : comparisonRows.length === 0 ? (
          <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 px-4 py-3 text-sm text-brand-muted">
            Select cities and run comparison to view benchmark data.
          </p>
        ) : (
          <div className="space-y-4">
            {chartData.length > 0 ? (
              <div className="rounded-2xl border border-brand-muted/35 bg-brand-light/75 p-3 shadow-inner sm:p-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="var(--color-muted)" opacity={0.5} />
                      <XAxis dataKey="cityLabel" tick={{ fill: 'var(--color-darkest)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'var(--color-darkest)', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-light)',
                          border: '1px solid var(--color-muted)',
                          borderRadius: '12px',
                          color: 'var(--color-darkest)',
                        }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Bar dataKey="medianHourly" fill="var(--color-primary)" name="Median Hourly Pay" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-brand-muted/35 bg-brand-light/70">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-brand-darkest text-brand-light">
                  <tr className="text-xs uppercase tracking-wide">
                    <th className="px-3 py-2">City Zone</th>
                    <th className="px-3 py-2">Median Hourly</th>
                    <th className="px-3 py-2">Average Hourly</th>
                    <th className="px-3 py-2">Riders (shifts)</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={`${row.city_zone}-${row.success ? 'ok' : 'error'}`} className="border-t border-brand-muted/35">
                      <td className="px-3 py-2 font-medium text-brand-darkest">{row.city_zone}</td>
                      <td className="px-3 py-2">{row.success ? formatCurrency(row.median_hourly_pay) : '—'}</td>
                      <td className="px-3 py-2">{row.success ? formatCurrency(row.average_hourly_pay) : '—'}</td>
                      <td className="px-3 py-2">
                        {row.success
                          ? `${row.sample_riders ?? row.sample_size ?? 0} (${row.sample_shifts ?? '—'})`
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-xs text-brand-muted">
                        {row.success ? 'Loaded' : row.error || 'Not available'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasFailedRows ? (
              <p className="text-xs text-brand-muted">
                Some city zones returned errors. Keep them in view for context, or remove and re-run.
              </p>
            ) : null}
          </div>
        )}
      </WorkerSectionCard>
    </div>
  )
}

export default AdvocateBenchmarksPage
