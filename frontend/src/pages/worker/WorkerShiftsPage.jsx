import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import WorkerPageHeader from '@/components/worker/WorkerPageHeader'
import ShiftFormCard from '@/components/worker/shifts/ShiftFormCard'
import CsvImportCard from '@/components/worker/shifts/CsvImportCard'
import ShiftLogsTable from '@/components/worker/shifts/ShiftLogsTable'
import {
  analyzeWorkerShift,
  createWorkerShiftLog,
  importWorkerShiftLogsCsv,
  listWorkerShiftLogs,
  uploadWorkerShiftScreenshot,
} from '@/api/worker'
import { WORKER_PLATFORM_OPTIONS, MAX_SCREENSHOT_BYTES, MAX_SCREENSHOT_MB } from '@/features/worker/constants'
import { shiftFormSchema } from '@/features/worker/schemas'
import {
  buildAnalyzePayload,
  normalizeShiftPayload,
  parseApiError,
  shiftBadgeClassByStatus,
} from '@/features/worker/utils'
import { useToast } from '@/hooks/useToast'

const getTodayLocalDate = () => {
  const now = new Date()
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

const WorkerShiftsPage = () => {
  const queryClient = useQueryClient()
  const { success: showSuccessToast, error: showErrorToast } = useToast()

  const [csvFile, setCsvFile] = useState(null)
  const [anomalyResult, setAnomalyResult] = useState(null)
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [uploadedScreenshot, setUploadedScreenshot] = useState(null)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    trigger,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      platform: 'Uber',
      date: getTodayLocalDate(),
      hours_worked: 8,
      gross_earned: 0,
      deductions: 0,
      net_received: 0,
      screenshot_url: '',
    },
  })

  const selectedPlatform = useWatch({ control, name: 'platform' }) || 'Uber'
  const watchedGross = Number(useWatch({ control, name: 'gross_earned' }) || 0)
  const watchedDeductions = Number(useWatch({ control, name: 'deductions' }) || 0)
  const watchedScreenshotUrl = useWatch({ control, name: 'screenshot_url' }) || ''
  const screenshotPreviewUrl = useMemo(
    () => (screenshotFile ? URL.createObjectURL(screenshotFile) : ''),
    [screenshotFile]
  )

  useEffect(() => {
    const net = Math.max(watchedGross - watchedDeductions, 0)
    setValue('net_received', Number(net.toFixed(2)), { shouldValidate: true })
  }, [watchedGross, watchedDeductions, setValue])

  useEffect(
    () => () => {
      if (screenshotPreviewUrl) {
        URL.revokeObjectURL(screenshotPreviewUrl)
      }
    },
    [screenshotPreviewUrl]
  )

  const shiftLogsQuery = useQuery({
    queryKey: ['worker-shift-logs'],
    queryFn: () => listWorkerShiftLogs({ limit: 100, offset: 0 }),
    staleTime: 30_000,
  })

  const shiftItems = useMemo(() => shiftLogsQuery.data?.items ?? [], [shiftLogsQuery.data?.items])
  const pendingCount = useMemo(
    () => shiftItems.filter((item) => item.status === 'pending').length,
    [shiftItems]
  )
  const verifiedCount = useMemo(
    () => shiftItems.filter((item) => item.status === 'verified').length,
    [shiftItems]
  )

  const analyzeMutation = useMutation({
    meta: {
      disableSuccessToast: true,
      disableErrorToast: true,
    },
    mutationFn: (payload) => analyzeWorkerShift(payload),
    onSuccess: (data) => {
      setAnomalyResult(data)

      const explanation =
        data?.explanation ||
        data?.insufficient_reason ||
        'Anomaly analysis completed, but no explanation was returned.'

      if (data?.ready === false || data?.is_anomaly) {
        showErrorToast(explanation)
        return
      }

      showSuccessToast(explanation)
    },
    onError: (error) => {
      showErrorToast(parseApiError(error))
    },
  })

  const createShiftMutation = useMutation({
    meta: {
      disableSuccessToast: true,
      disableErrorToast: true,
    },
    mutationFn: (payload) => createWorkerShiftLog(payload),
    onSuccess: () => {
      showSuccessToast('Shift saved successfully.')
      queryClient.invalidateQueries({ queryKey: ['worker-shift-logs'] })

      // Do not auto-call anomaly here: it doubles latency and fails the whole flow with 502/504
      // if the anomaly service is down or slow. Workers can run "Check anomaly" when needed.

      setScreenshotFile(null)
      setUploadedScreenshot(null)

      reset({
        platform: selectedPlatform,
        date: getTodayLocalDate(),
        hours_worked: 8,
        gross_earned: 0,
        deductions: 0,
        net_received: 0,
        screenshot_url: '',
      })
    },
    onError: (error) => {
      showErrorToast(parseApiError(error))
    },
  })

  const csvImportMutation = useMutation({
    meta: {
      disableSuccessToast: true,
      disableErrorToast: true,
    },
    mutationFn: (file) => importWorkerShiftLogsCsv(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['worker-shift-logs'] })
      setCsvFile(null)
      showSuccessToast(`CSV import done: ${data?.inserted_rows || 0} rows inserted.`)
    },
    onError: (error) => {
      showErrorToast(parseApiError(error))
    },
  })

  const uploadScreenshotMutation = useMutation({
    meta: {
      disableSuccessToast: true,
      disableErrorToast: true,
    },
    mutationFn: (file) => uploadWorkerShiftScreenshot(file),
  })

  const onSelectScreenshotFile = (file) => {
    setUploadedScreenshot(null)
    setValue('screenshot_url', '', {
      shouldValidate: true,
      shouldDirty: true,
    })

    if (!file) {
      setScreenshotFile(null)
      return
    }

    if (!String(file.type || '').toLowerCase().startsWith('image/')) {
      setScreenshotFile(null)
      showErrorToast('Invalid screenshot type. Please upload JPG, PNG, or WEBP.')
      return
    }

    if (file.size > MAX_SCREENSHOT_BYTES) {
      setScreenshotFile(null)
      showErrorToast(`Screenshot exceeds ${MAX_SCREENSHOT_MB} MB limit.`)
      return
    }

    setScreenshotFile(file)
  }

  const onCreateShift = handleSubmit(async (values) => {
    let screenshotUrl = String(values.screenshot_url || '').trim()

    if (!screenshotUrl && !screenshotFile) {
      showErrorToast('Screenshot is compulsory before saving the shift.')
      return
    }

    if (!screenshotUrl && screenshotFile) {
      try {
        const uploadData = await uploadScreenshotMutation.mutateAsync(screenshotFile)
        const screenshot = uploadData?.screenshot || uploadData
        const secureUrl = screenshot?.secure_url

        if (!secureUrl) {
          showErrorToast('Screenshot upload completed but URL is missing in response.')
          return
        }

        screenshotUrl = secureUrl
        setUploadedScreenshot(screenshot)
        setValue('screenshot_url', secureUrl, {
          shouldValidate: true,
          shouldDirty: true,
        })
      } catch (error) {
        showErrorToast(parseApiError(error))
        return
      }
    }

    createShiftMutation.mutate(
      normalizeShiftPayload({
        ...values,
        screenshot_url: screenshotUrl,
      })
    )
  })

  const onAnalyzeCurrentShift = async () => {
    const valid = await trigger(['platform', 'date', 'gross_earned', 'deductions', 'net_received'])
    if (!valid) {
      showErrorToast('Fix form validation errors before anomaly analysis.')
      return
    }

    const values = getValues()
    const currentShift = normalizeShiftPayload(values)
    analyzeMutation.mutate(buildAnalyzePayload(currentShift))
  }

  const onImportCsv = () => {
    if (!csvFile) {
      showErrorToast('Select a CSV file before importing.')
      return
    }

    if (!csvFile.name.toLowerCase().endsWith('.csv')) {
      showErrorToast('Only .csv files are supported.')
      return
    }

    csvImportMutation.mutate(csvFile)
  }

  return (
    <div className="space-y-6">
      <WorkerPageHeader
        badge="Shift Operations"
        title="Log, Upload, Analyze"
        description="Capture complete evidence, save faster, and run anomaly checks without leaving the workflow."
        summary={`${shiftItems.length} logs tracked · ${pendingCount} pending · ${verifiedCount} verified`}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <ShiftFormCard
          register={register}
          errors={errors}
          onSubmit={onCreateShift}
          platformOptions={WORKER_PLATFORM_OPTIONS}
          onSelectScreenshotFile={onSelectScreenshotFile}
          maxScreenshotMb={MAX_SCREENSHOT_MB}
          screenshotFile={screenshotFile}
          uploadScreenshotPending={uploadScreenshotMutation.isPending}
          uploadedScreenshot={uploadedScreenshot}
          screenshotPreviewUrl={screenshotPreviewUrl}
          watchedScreenshotUrl={watchedScreenshotUrl}
          savePending={createShiftMutation.isPending}
          analyzePending={analyzeMutation.isPending}
          onAnalyzeCurrentShift={onAnalyzeCurrentShift}
        />

        <CsvImportCard
          csvFile={csvFile}
          setCsvFile={setCsvFile}
          onImportCsv={onImportCsv}
          csvImportPending={csvImportMutation.isPending}
          anomalyResult={anomalyResult}
          analyzePending={analyzeMutation.isPending}
        />
      </section>

      <ShiftLogsTable
        shiftLogsQuery={shiftLogsQuery}
        shiftItems={shiftItems}
        parseApiError={parseApiError}
        badgeClassByStatus={shiftBadgeClassByStatus}
      />
    </div>
  )
}

export default WorkerShiftsPage
