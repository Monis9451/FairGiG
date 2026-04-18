import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import useAuthStore from '@/store/authStore'
import { getPlatformCityBenchmark, listWorkerShiftLogs } from '@/api/worker'
import { useMe } from '@/hooks/useAuth'
import WorkerPageHeader from '@/components/worker/WorkerPageHeader'
import WorkerBenchmarkCard from '@/components/worker/benchmark/WorkerBenchmarkCard'
import { WORKER_PLATFORM_OPTIONS } from '@/features/worker/constants'
import { buildBenchmarkChartData, parseApiError } from '@/features/worker/utils'

const WorkerBenchmarkPage = () => {
  const storeProfile = useAuthStore((state) => state.profile)
  const { data: meData } = useMe()

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

  const chartData = useMemo(
    () =>
      buildBenchmarkChartData({
        shiftItems,
        selectedPlatform,
        benchmarkMedian,
      }),
    [shiftItems, selectedPlatform, benchmarkMedian]
  )

  return (
    <div className="space-y-5">
      <WorkerPageHeader
        badge="Benchmark"
        title="Platform and City Trend"
        description="Compare your hourly outcomes against city medians with cleaner trend visuals and focused context."
      />

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
        parseApiError={parseApiError}
      />
    </div>
  )
}

export default WorkerBenchmarkPage
