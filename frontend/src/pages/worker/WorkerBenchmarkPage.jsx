import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import useAuthStore from '@/store/authStore'
import { getPlatformCityBenchmark, listWorkerShiftLogs } from '@/api/worker'
import { useMe } from '@/hooks/useAuth'
import WorkerBenchmarkCard from '@/components/worker/benchmark/WorkerBenchmarkCard'
import { WORKER_PLATFORM_OPTIONS } from '@/features/worker/constants'
import {
  buildBenchmarkChartData,
  computeVerifiedHourlyForPlatform,
  parseApiError,
} from '@/features/worker/utils'

const WorkerBenchmarkPage = () => {
  const storeProfile = useAuthStore((state) => state.profile)
  const { data: meData, isPending: mePending } = useMe()

  const [selectedPlatform, setSelectedPlatform] = useState('Uber')

  const profile = meData?.profile || storeProfile || null
  const cityZone = profile?.city_zone || profile?.cityZone || ''

  const shiftLogsQuery = useQuery({
    queryKey: ['worker-shift-logs'],
    queryFn: () => listWorkerShiftLogs({ limit: 100, offset: 0 }),
    staleTime: 30_000,
  })

  const benchmarkQuery = useQuery({
    queryKey: ['worker-benchmark', selectedPlatform, cityZone],
    queryFn: () => getPlatformCityBenchmark({ platform: selectedPlatform, cityZone }),
    enabled: Boolean(selectedPlatform && cityZone),
    staleTime: 30_000,
  })

  const shiftItems = useMemo(() => shiftLogsQuery.data?.items ?? [], [shiftLogsQuery.data?.items])
  const benchmarkMedian = Number(benchmarkQuery.data?.median_hourly_pay || 0)

  const myOverallHourly = useMemo(
    () => computeVerifiedHourlyForPlatform(shiftItems, selectedPlatform),
    [shiftItems, selectedPlatform]
  )

  const chartData = useMemo(
    () =>
      buildBenchmarkChartData({
        shiftItems,
        selectedPlatform,
        benchmarkMedian,
      }),
    [shiftItems, selectedPlatform, benchmarkMedian]
  )

  const combinedError = benchmarkQuery.error || shiftLogsQuery.error

  if (mePending) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse space-y-4 pb-10">
        <div className="h-10 rounded-lg bg-brand-muted/20" />
        <div className="h-40 rounded-2xl bg-brand-muted/15" />
      </div>
    )
  }

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
        <h1 className="mt-2 text-xl font-bold tracking-tight text-brand-darkest sm:text-2xl">
          Pay vs city
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-brand-muted">
          See how your verified hourly pay on each app compares to the middle of other riders in your city — plain
          numbers, not statistics jargon.
        </p>
      </header>

      {(benchmarkQuery.isError || shiftLogsQuery.isError) && combinedError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {parseApiError(combinedError)}
        </p>
      ) : null}

      <WorkerBenchmarkCard
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        platformOptions={WORKER_PLATFORM_OPTIONS}
        cityZone={cityZone}
        benchmarkQuery={{
          ...benchmarkQuery,
          isLoading: benchmarkQuery.isLoading || shiftLogsQuery.isLoading,
          isError: benchmarkQuery.isError || shiftLogsQuery.isError,
          error: benchmarkQuery.error || shiftLogsQuery.error,
        }}
        chartData={chartData}
        myOverallHourly={myOverallHourly}
        parseApiError={parseApiError}
      />
    </div>
  )
}

export default WorkerBenchmarkPage
