import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

import useAuthStore from '@/store/authStore'
import { useMe } from '@/hooks/useAuth'
import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  analyzeWorkerShift,
  createWorkerGrievance,
  createWorkerShiftLog,
  getPlatformCityBenchmark,
  getWorkerCertificate,
  importWorkerShiftLogsCsv,
  listWorkerGrievances,
  listWorkerShiftLogs,
} from '@/api/worker'
import {
  formatCurrency,
  formatDate,
  formatHourlyRate,
  formatPercent,
} from '@/utils/formatters'

const PLATFORM_OPTIONS = ['Uber', 'FoodPanda', 'Bykea']

const shiftFormSchema = z
  .object({
    platform: z.string().min(1, 'Platform is required'),
    date: z.string().min(1, 'Date is required'),
    hours_worked: z.coerce
      .number({ invalid_type_error: 'Hours must be a number' })
      .gt(0, 'Hours must be greater than 0')
      .max(24, 'Hours cannot exceed 24'),
    gross_earned: z.coerce
      .number({ invalid_type_error: 'Gross earned must be a number' })
      .min(0, 'Gross earned cannot be negative'),
    deductions: z.coerce
      .number({ invalid_type_error: 'Deductions must be a number' })
      .min(0, 'Deductions cannot be negative'),
    net_received: z.coerce.number().min(0),
    screenshot_url: z.string().optional(),
  })
  .refine((values) => values.deductions <= values.gross_earned, {
    path: ['deductions'],
    message: 'Deductions cannot exceed gross earned',
  })

const grievanceFormSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(8, 'Description must be at least 8 characters'),
  tags: z.string().optional(),
})

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

  return error?.message || 'Something went wrong while calling the backend.'
}

const normalizeShiftPayload = (values) => ({
  platform: values.platform,
  date: values.date,
  hours_worked: Number(values.hours_worked),
  gross_earned: Number(values.gross_earned),
  deductions: Number(values.deductions),
  net_received: Number(values.net_received),
  screenshot_url: values.screenshot_url?.trim() || null,
})

const badgeClassByStatus = (status) => {
  if (status === 'verified') {
    return 'border-brand-primary/40 bg-brand-primary/20 text-brand-darkest'
  }

  if (status === 'pending') {
    return 'border-brand-muted/50 bg-brand-muted/25 text-brand-darkest'
  }

  if (status === 'flagged') {
    return 'border-brand-dark bg-brand-dark text-brand-light'
  }

  return 'border-brand-muted/50 bg-brand-light text-brand-darkest'
}

const grievanceBadgeClassByStatus = (status) => {
  if (status === 'resolved') {
    return 'border-brand-primary/40 bg-brand-primary/20 text-brand-darkest'
  }

  if (status === 'escalated') {
    return 'border-brand-dark bg-brand-dark text-brand-light'
  }

  return 'border-brand-muted/50 bg-brand-muted/25 text-brand-darkest'
}

const parseTagsFromInput = (value) => {
  if (!value || typeof value !== 'string') {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildCertificatePrintHtml = (certificate) => {
  const worker = certificate?.worker || {}
  const summary = certificate?.summary || {}
  const filters = certificate?.filters || {}
  const logs = certificate?.logs || []

  const rows = logs
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(formatDate(item.date))}</td>
          <td>${escapeHtml(item.platform)}</td>
          <td>${escapeHtml(Number(item.hours_worked || 0).toFixed(2))}</td>
          <td>${escapeHtml(formatCurrency(item.net_received))}</td>
          <td>${escapeHtml(item.status)}</td>
        </tr>
      `
    )
    .join('')

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>FairGig Certificate</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; margin: 24px; }
          h1 { margin: 0 0 8px; }
          p { margin: 4px 0; }
          .meta { margin-bottom: 16px; }
          .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 16px 0; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>FairGig Verified Earnings Certificate</h1>
        <div class="meta">
          <p><strong>Worker:</strong> ${escapeHtml(worker.full_name || 'N/A')}</p>
          <p><strong>Worker ID:</strong> ${escapeHtml(worker.id || 'N/A')}</p>
          <p><strong>City:</strong> ${escapeHtml(worker.city_zone || 'N/A')}</p>
          <p><strong>Filters:</strong> From ${escapeHtml(filters.from || 'Start')} to ${escapeHtml(filters.to || 'Now')}</p>
        </div>

        <div class="summary">
          <div class="card"><strong>Verified Logs</strong><br/>${escapeHtml(summary.total_verified_logs || 0)}</div>
          <div class="card"><strong>Total Hours</strong><br/>${escapeHtml(Number(summary.total_hours || 0).toFixed(2))}</div>
          <div class="card"><strong>Total Gross</strong><br/>${escapeHtml(formatCurrency(summary.total_gross || 0))}</div>
          <div class="card"><strong>Total Net</strong><br/>${escapeHtml(formatCurrency(summary.total_net || 0))}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Platform</th>
              <th>Hours</th>
              <th>Net</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5">No verified logs found for selected range.</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `
}

const WorkerDashboard = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const clearAuth = useAuthStore((state) => state.clearAuth)
  const storeProfile = useAuthStore((state) => state.profile)

  const [notice, setNotice] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [anomalyResult, setAnomalyResult] = useState(null)
  const [certificateFilters, setCertificateFilters] = useState({ from: '', to: '' })

  const { data: meData } = useMe()

  const profile = meData?.profile || storeProfile || null
  const workerId = meData?.user?.id || profile?.id || ''
  const cityZone = profile?.city_zone || profile?.cityZone || ''

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
      date: new Date().toISOString().slice(0, 10),
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

  const {
    register: registerGrievance,
    handleSubmit: handleSubmitGrievance,
    reset: resetGrievance,
    formState: { errors: grievanceErrors },
  } = useForm({
    resolver: zodResolver(grievanceFormSchema),
    defaultValues: {
      platform: 'Uber',
      category: 'payment issue',
      description: '',
      tags: '',
    },
  })

  useEffect(() => {
    const net = Math.max(watchedGross - watchedDeductions, 0)
    setValue('net_received', Number(net.toFixed(2)), { shouldValidate: true })
  }, [watchedGross, watchedDeductions, setValue])

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

  const grievancesQuery = useQuery({
    queryKey: ['worker-grievances'],
    queryFn: () => listWorkerGrievances({ limit: 30, offset: 0 }),
    staleTime: 30_000,
  })

  const certificateQuery = useQuery({
    queryKey: ['worker-certificate', workerId, certificateFilters.from, certificateFilters.to],
    queryFn: () =>
      getWorkerCertificate({
        workerId,
        from: certificateFilters.from || undefined,
        to: certificateFilters.to || undefined,
      }),
    enabled: Boolean(workerId),
    staleTime: 30_000,
  })

  const shiftItems = useMemo(() => shiftLogsQuery.data?.items ?? [], [shiftLogsQuery.data?.items])
  const grievanceItems = useMemo(
    () => grievancesQuery.data?.items ?? [],
    [grievancesQuery.data?.items]
  )
  const certificate = certificateQuery.data || null

  const buildAnalyzePayload = (currentShift) => {
    const verifiedHistory = shiftItems
      .filter(
        (item) =>
          item?.status === 'verified' &&
          item?.platform === currentShift.platform &&
          item?.date !== currentShift.date
      )
      .slice(0, 30)
      .map((item) => ({
        date: item.date,
        platform: item.platform,
        gross_earned: Number(item.gross_earned || 0),
        deductions: Number(item.deductions || 0),
        net_received: Number(item.net_received || 0),
      }))

    const payload = {
      current_shift: {
        date: currentShift.date,
        platform: currentShift.platform,
        gross_earned: Number(currentShift.gross_earned || 0),
        deductions: Number(currentShift.deductions || 0),
        net_received: Number(currentShift.net_received || 0),
      },
      platform: currentShift.platform,
    }

    if (verifiedHistory.length > 0) {
      payload.history = verifiedHistory
    }

    return payload
  }

  const analyzeMutation = useMutation({
    mutationFn: (payload) => analyzeWorkerShift(payload),
    onSuccess: (data) => {
      setAnomalyResult(data)
      setNotice({
        type: data?.is_anomaly ? 'error' : 'success',
        message: data?.explanation || 'Anomaly analysis completed.',
      })
    },
    onError: (error) => {
      setNotice({ type: 'error', message: parseApiError(error) })
    },
  })

  const createShiftMutation = useMutation({
    mutationFn: (payload) => createWorkerShiftLog(payload),
    onSuccess: (data) => {
      const created = data?.shift_log
      setNotice({ type: 'success', message: 'Shift log created successfully.' })
      queryClient.invalidateQueries({ queryKey: ['worker-shift-logs'] })

      if (created) {
        analyzeMutation.mutate(buildAnalyzePayload(created))
      }

      reset({
        platform: selectedPlatform,
        date: new Date().toISOString().slice(0, 10),
        hours_worked: 8,
        gross_earned: 0,
        deductions: 0,
        net_received: 0,
        screenshot_url: '',
      })
    },
    onError: (error) => {
      setNotice({ type: 'error', message: parseApiError(error) })
    },
  })

  const csvImportMutation = useMutation({
    mutationFn: (file) => importWorkerShiftLogsCsv(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['worker-shift-logs'] })
      setCsvFile(null)
      setNotice({
        type: 'success',
        message: `CSV import done: ${data?.inserted_rows || 0} rows inserted.`,
      })
    },
    onError: (error) => {
      setNotice({ type: 'error', message: parseApiError(error) })
    },
  })

  const createGrievanceMutation = useMutation({
    mutationFn: (payload) => createWorkerGrievance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-grievances'] })
      resetGrievance({
        platform: selectedPlatform,
        category: 'payment issue',
        description: '',
        tags: '',
      })
      setNotice({ type: 'success', message: 'Grievance submitted successfully.' })
    },
    onError: (error) => {
      setNotice({ type: 'error', message: parseApiError(error) })
    },
  })

  const stats = useMemo(() => {
    const total = shiftItems.length
    const verified = shiftItems.filter((item) => item.status === 'verified').length
    const pending = shiftItems.filter((item) => item.status === 'pending').length
    const flagged = shiftItems.filter((item) => item.status === 'flagged').length

    const averageHourly =
      total > 0
        ? shiftItems
            .map((item) => formatHourlyRate(item.net_received, item.hours_worked))
            .reduce((sum, value) => sum + value, 0) / total
        : 0

    return {
      total,
      verified,
      pending,
      flagged,
      averageHourly: Number(averageHourly.toFixed(2)),
    }
  }, [shiftItems])

  const chartData = useMemo(() => {
    const benchmarkMedian = Number(benchmarkQuery.data?.median_hourly_pay || 0)

    return shiftItems
      .filter((item) => item.platform === selectedPlatform)
      .map((item) => ({
        rawDate: item.date,
        dateLabel: formatDate(item.date),
        myHourly: formatHourlyRate(item.net_received, item.hours_worked),
        cityMedian: benchmarkMedian,
      }))
      .sort((first, second) => new Date(first.rawDate) - new Date(second.rawDate))
      .slice(-20)
  }, [shiftItems, benchmarkQuery.data, selectedPlatform])

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const onCreateShift = handleSubmit((values) => {
    setNotice(null)
    createShiftMutation.mutate(normalizeShiftPayload(values))
  })

  const onAnalyzeCurrentShift = async () => {
    const valid = await trigger(['platform', 'date', 'gross_earned', 'deductions', 'net_received'])
    if (!valid) {
      setNotice({ type: 'error', message: 'Fix form validation errors before anomaly analysis.' })
      return
    }

    const values = getValues()
    const currentShift = normalizeShiftPayload(values)
    analyzeMutation.mutate(buildAnalyzePayload(currentShift))
  }

  const onImportCsv = () => {
    if (!csvFile) {
      setNotice({ type: 'error', message: 'Select a CSV file before importing.' })
      return
    }

    if (!csvFile.name.toLowerCase().endsWith('.csv')) {
      setNotice({ type: 'error', message: 'Only .csv files are supported.' })
      return
    }

    setNotice(null)
    csvImportMutation.mutate(csvFile)
  }

  const onCreateGrievance = handleSubmitGrievance((values) => {
    setNotice(null)
    createGrievanceMutation.mutate({
      platform: values.platform,
      category: values.category,
      description: values.description.trim(),
      tags: parseTagsFromInput(values.tags),
    })
  })

  const onDownloadCertificateJson = () => {
    if (!certificate) {
      setNotice({ type: 'error', message: 'Certificate data is not available yet.' })
      return
    }

    const blob = new Blob([JSON.stringify(certificate, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fairgig-certificate-${workerId || 'worker'}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const onPrintCertificate = () => {
    if (!certificate) {
      setNotice({ type: 'error', message: 'Load certificate data before printing.' })
      return
    }

    const printableHtml = buildCertificatePrintHtml(certificate)
    const printFrame = document.createElement('iframe')
    printFrame.setAttribute('aria-hidden', 'true')
    printFrame.style.position = 'fixed'
    printFrame.style.right = '0'
    printFrame.style.bottom = '0'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    printFrame.style.border = '0'
    document.body.appendChild(printFrame)

    const frameWindow = printFrame.contentWindow
    if (!frameWindow) {
      document.body.removeChild(printFrame)
      setNotice({ type: 'error', message: 'Unable to initialize print view.' })
      return
    }

    frameWindow.document.open()
    frameWindow.document.write(printableHtml)
    frameWindow.document.close()

    const cleanUp = () => {
      if (printFrame.parentNode) {
        document.body.removeChild(printFrame)
      }
    }

    const cleanUpTimer = window.setTimeout(cleanUp, 60_000)
    frameWindow.onafterprint = () => {
      window.clearTimeout(cleanUpTimer)
      cleanUp()
    }

    window.setTimeout(() => {
      try {
        frameWindow.focus()
        frameWindow.print()
      } catch {
        window.clearTimeout(cleanUpTimer)
        cleanUp()

        const fallbackBlob = new Blob([printableHtml], { type: 'text/html' })
        const fallbackUrl = URL.createObjectURL(fallbackBlob)
        const fallbackWindow = window.open(fallbackUrl, '_blank')
        window.setTimeout(() => URL.revokeObjectURL(fallbackUrl), 30_000)

        if (!fallbackWindow) {
          setNotice({
            type: 'error',
            message:
              'Printing was blocked by the browser. Allow popups and try Print Certificate again.',
          })
          return
        }

        setNotice({
          type: 'success',
          message: 'Opened printable certificate in a new tab. Use browser Print from that tab.',
        })
      }
    }, 250)
  }

  return (
    <AppShell
      title="Worker Dashboard"
      subtitle="Log shifts, run anomaly checks, track grievances, and access your certificate report."
      profile={profile}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {notice ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              notice.type === 'error'
                ? 'border-brand-dark bg-brand-dark text-brand-light'
                : 'border-brand-primary/40 bg-brand-primary/15 text-brand-darkest'
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {shiftLogsQuery.isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <article
                  key={`stats-skeleton-${index}`}
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-3 h-8 w-16" />
                </article>
              ))
            : [
                <article
                  key="stats-total"
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-muted">Total Logs</p>
                  <p className="mt-2 text-2xl font-bold">{stats.total}</p>
                </article>,
                <article
                  key="stats-verified"
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-muted">Verified</p>
                  <p className="mt-2 text-2xl font-bold">{stats.verified}</p>
                </article>,
                <article
                  key="stats-pending"
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-muted">Pending</p>
                  <p className="mt-2 text-2xl font-bold">{stats.pending}</p>
                </article>,
                <article
                  key="stats-flagged"
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-muted">Flagged</p>
                  <p className="mt-2 text-2xl font-bold">{stats.flagged}</p>
                </article>,
                <article
                  key="stats-hourly"
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-muted">Avg Hourly</p>
                  <p className="mt-2 text-2xl font-bold">{formatCurrency(stats.averageHourly)}</p>
                </article>,
              ]}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-lg border border-brand-muted/50 bg-brand-light p-5">
            <h2 className="text-lg font-semibold">Log a Shift</h2>
            <p className="mb-4 mt-1 text-sm text-brand-muted">
              Submit one shift record. Net received is auto-calculated.
            </p>

            <form className="space-y-4" onSubmit={onCreateShift}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <select
                    id="platform"
                    {...register('platform')}
                    className="h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    {PLATFORM_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.platform ? (
                    <p className="mt-1 text-xs text-brand-muted">{errors.platform.message}</p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...register('date')} />
                  {errors.date ? (
                    <p className="mt-1 text-xs text-brand-muted">{errors.date.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="hours_worked">Hours Worked</Label>
                  <Input id="hours_worked" type="number" step="0.1" {...register('hours_worked')} />
                  {errors.hours_worked ? (
                    <p className="mt-1 text-xs text-brand-muted">{errors.hours_worked.message}</p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="gross_earned">Gross Earned</Label>
                  <Input id="gross_earned" type="number" step="0.01" {...register('gross_earned')} />
                  {errors.gross_earned ? (
                    <p className="mt-1 text-xs text-brand-muted">{errors.gross_earned.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="deductions">Deductions</Label>
                  <Input id="deductions" type="number" step="0.01" {...register('deductions')} />
                  {errors.deductions ? (
                    <p className="mt-1 text-xs text-brand-muted">{errors.deductions.message}</p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="net_received">Net Received</Label>
                  <Input id="net_received" type="number" step="0.01" {...register('net_received')} readOnly />
                </div>
              </div>

              <div>
                <Label htmlFor="screenshot_url">Screenshot URL (optional)</Label>
                <Input
                  id="screenshot_url"
                  type="url"
                  placeholder="https://..."
                  {...register('screenshot_url')}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
                  disabled={createShiftMutation.isPending}
                >
                  {createShiftMutation.isPending ? 'Saving...' : 'Save Shift'}
                </Button>

                <Button
                  type="button"
                  className="rounded-md border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
                  onClick={onAnalyzeCurrentShift}
                  disabled={analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Current Shift'}
                </Button>
              </div>
            </form>
          </article>

          <article className="rounded-lg border border-brand-muted/50 bg-brand-light p-5">
            <h2 className="text-lg font-semibold">CSV Import</h2>
            <p className="mb-4 mt-1 text-sm text-brand-muted">
              Upload a UTF-8 CSV with at least 10 rows and required earnings columns.
            </p>

            <div className="space-y-4">
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  setCsvFile(file)
                }}
              />

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
                  onClick={onImportCsv}
                  disabled={csvImportMutation.isPending}
                >
                  {csvImportMutation.isPending ? 'Importing...' : 'Import CSV'}
                </Button>

                {csvFile ? (
                  <p className="text-sm text-brand-muted">Selected: {csvFile.name}</p>
                ) : (
                  <p className="text-sm text-brand-muted">No file selected</p>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-brand-muted/50 bg-brand-light p-4">
              <h3 className="font-semibold">Anomaly Result</h3>
              {anomalyResult ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    {anomalyResult.is_anomaly ? 'Anomaly detected' : 'No anomaly detected'}
                  </p>
                  <p>
                    <span className="font-medium">Explanation:</span> {anomalyResult.explanation}
                  </p>
                  <p>
                    <span className="font-medium">Z-score:</span> {anomalyResult.z_score}
                  </p>
                  <p>
                    <span className="font-medium">Drop:</span> {formatPercent(anomalyResult.percent_drop)}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-brand-muted">No anomaly run yet.</p>
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-lg border border-brand-muted/50 bg-brand-light p-5">
            <h2 className="text-lg font-semibold">Grievances</h2>
            <p className="mb-4 mt-1 text-sm text-brand-muted">
              Raise an issue and track your grievance statuses.
            </p>

            <form className="space-y-4" onSubmit={onCreateGrievance}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="grievance_platform">Platform</Label>
                  <select
                    id="grievance_platform"
                    {...registerGrievance('platform')}
                    className="h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    {PLATFORM_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {grievanceErrors.platform ? (
                    <p className="mt-1 text-xs text-brand-muted">{grievanceErrors.platform.message}</p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="grievance_category">Category</Label>
                  <Input
                    id="grievance_category"
                    placeholder="payment issue"
                    {...registerGrievance('category')}
                  />
                  {grievanceErrors.category ? (
                    <p className="mt-1 text-xs text-brand-muted">{grievanceErrors.category.message}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <Label htmlFor="grievance_description">Description</Label>
                <textarea
                  id="grievance_description"
                  rows={4}
                  className="min-h-[110px] w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 py-2 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Describe what happened and why this should be reviewed."
                  {...registerGrievance('description')}
                />
                {grievanceErrors.description ? (
                  <p className="mt-1 text-xs text-brand-muted">{grievanceErrors.description.message}</p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="grievance_tags">Tags (optional, comma separated)</Label>
                <Input id="grievance_tags" placeholder="late payout, deduction mismatch" {...registerGrievance('tags')} />
              </div>

              <Button
                type="submit"
                className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
                disabled={createGrievanceMutation.isPending}
              >
                {createGrievanceMutation.isPending ? 'Submitting...' : 'Submit Grievance'}
              </Button>
            </form>

            <div className="mt-6">
              <h3 className="font-semibold">My Recent Grievances</h3>
              {grievancesQuery.isLoading ? (
                <div className="mt-3 space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={`grievance-skeleton-${index}`} className="h-20 w-full" />
                  ))}
                </div>
              ) : grievancesQuery.isError ? (
                <p className="mt-2 text-sm text-brand-muted">{parseApiError(grievancesQuery.error)}</p>
              ) : grievanceItems.length === 0 ? (
                <p className="mt-2 text-sm text-brand-muted">No grievances submitted yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {grievanceItems.slice(0, 6).map((item) => (
                    <article
                      key={item.id}
                      className="rounded-lg border border-brand-muted/40 bg-brand-light px-3 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-brand-darkest">{item.category}</p>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${grievanceBadgeClassByStatus(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-brand-dark">{item.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                        <span>{item.platform}</span>
                        <span>•</span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                      {Array.isArray(item.tags) && item.tags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.tags.slice(0, 4).map((tag) => (
                            <span
                              key={`${item.id}-${tag}`}
                              className="rounded-full border border-brand-muted/50 px-2 py-0.5 text-xs text-brand-dark"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </article>

          <article className="rounded-lg border border-brand-muted/50 bg-brand-light p-5">
            <h2 className="text-lg font-semibold">Certificate Report</h2>
            <p className="mb-4 mt-1 text-sm text-brand-muted">
              Download or print your verified earnings certificate.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="certificate_from">From (optional)</Label>
                <Input
                  id="certificate_from"
                  type="date"
                  value={certificateFilters.from}
                  onChange={(event) =>
                    setCertificateFilters((current) => ({ ...current, from: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="certificate_to">To (optional)</Label>
                <Input
                  id="certificate_to"
                  type="date"
                  value={certificateFilters.to}
                  onChange={(event) =>
                    setCertificateFilters((current) => ({ ...current, to: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
                onClick={() => certificateQuery.refetch()}
                disabled={certificateQuery.isFetching}
              >
                {certificateQuery.isFetching ? 'Refreshing...' : 'Refresh Certificate'}
              </Button>

              <Button
                type="button"
                className="rounded-md border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
                onClick={onDownloadCertificateJson}
                disabled={!certificate || certificateQuery.isLoading}
              >
                Download JSON
              </Button>

              <Button
                type="button"
                className="rounded-md border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
                onClick={onPrintCertificate}
                disabled={!certificate || certificateQuery.isLoading}
              >
                Print Certificate
              </Button>
            </div>

            {certificateQuery.isLoading ? (
              <div className="mt-6 space-y-3">
                <Skeleton className="h-6 w-56" />
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={`certificate-summary-skeleton-${index}`} className="h-16 w-full" />
                  ))}
                </div>
                <Skeleton className="h-44 w-full" />
              </div>
            ) : certificateQuery.isError ? (
              <p className="mt-4 text-sm text-brand-muted">{parseApiError(certificateQuery.error)}</p>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3 text-sm">
                  <p>
                    <span className="font-medium">Worker:</span> {certificate?.worker?.full_name || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">City:</span> {certificate?.worker?.city_zone || 'N/A'}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3">
                    <p className="text-xs uppercase tracking-wide text-brand-muted">Verified Logs</p>
                    <p className="mt-2 text-xl font-bold">{certificate?.summary?.total_verified_logs || 0}</p>
                  </div>
                  <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3">
                    <p className="text-xs uppercase tracking-wide text-brand-muted">Total Hours</p>
                    <p className="mt-2 text-xl font-bold">
                      {Number(certificate?.summary?.total_hours || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3">
                    <p className="text-xs uppercase tracking-wide text-brand-muted">Total Deductions</p>
                    <p className="mt-2 text-xl font-bold">
                      {formatCurrency(certificate?.summary?.total_deductions || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3">
                    <p className="text-xs uppercase tracking-wide text-brand-muted">Total Net</p>
                    <p className="mt-2 text-xl font-bold">
                      {formatCurrency(certificate?.summary?.total_net || 0)}
                    </p>
                  </div>
                </div>

                {Array.isArray(certificate?.logs) && certificate.logs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-brand-muted/50 text-left text-brand-muted">
                          <th className="px-3 py-2 font-semibold">Date</th>
                          <th className="px-3 py-2 font-semibold">Platform</th>
                          <th className="px-3 py-2 font-semibold">Hours</th>
                          <th className="px-3 py-2 font-semibold">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificate.logs.slice(0, 8).map((item) => (
                          <tr key={item.id} className="border-b border-brand-muted/30">
                            <td className="px-3 py-2">{formatDate(item.date)}</td>
                            <td className="px-3 py-2">{item.platform}</td>
                            <td className="px-3 py-2">{Number(item.hours_worked || 0).toFixed(2)}</td>
                            <td className="px-3 py-2">{formatCurrency(item.net_received)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-brand-muted">No verified logs available for this range.</p>
                )}
              </div>
            )}
          </article>
        </section>

        <section className="rounded-lg border border-brand-muted/50 bg-brand-light p-5">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="benchmark_platform">Benchmark Platform</Label>
              <select
                id="benchmark_platform"
                value={selectedPlatform}
                onChange={(event) => setValue('platform', event.target.value)}
                className="h-10 rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {PLATFORM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-brand-muted">
              <p>City Zone: {cityZone || 'Not available'}</p>
              <p>
                Median hourly benchmark:{' '}
                {formatCurrency(Number(benchmarkQuery.data?.median_hourly_pay || 0))}
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
        </section>

        <section className="rounded-lg border border-brand-muted/50 bg-brand-light p-5">
          <h2 className="mb-3 text-lg font-semibold">Recent Shift Logs</h2>
          {shiftLogsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`table-skeleton-${index}`} className="h-12 w-full" />
              ))}
            </div>
          ) : shiftLogsQuery.isError ? (
            <p className="text-sm text-brand-muted">{parseApiError(shiftLogsQuery.error)}</p>
          ) : shiftItems.length === 0 ? (
            <p className="text-sm text-brand-muted">No shift logs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-brand-muted/50 text-left text-brand-muted">
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Platform</th>
                    <th className="px-3 py-2 font-semibold">Hours</th>
                    <th className="px-3 py-2 font-semibold">Net</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftItems.slice(0, 12).map((item) => (
                    <tr key={item.id} className="border-b border-brand-muted/30">
                      <td className="px-3 py-2">{formatDate(item.date)}</td>
                      <td className="px-3 py-2">{item.platform}</td>
                      <td className="px-3 py-2">{Number(item.hours_worked || 0).toFixed(2)}</td>
                      <td className="px-3 py-2">{formatCurrency(item.net_received)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default WorkerDashboard
