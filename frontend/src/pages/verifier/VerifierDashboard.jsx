import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import useAuthStore from '@/store/authStore'
import { useMe } from '@/hooks/useAuth'
import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getVerifierPing,
  getVerifierVulnerabilityFlags,
  listVerifierGrievances,
  listVerifierShiftLogs,
  updateVerifierShiftLogVerification,
} from '@/api/verifier'
import { formatCurrency, formatDate, formatPercent } from '@/utils/formatters'

const SHIFT_STATUS_OPTIONS = ['pending', 'verified', 'flagged']
const GRIEVANCE_STATUS_OPTIONS = ['open', 'escalated', 'resolved']

const badgeClassByStatus = (status) => {
  if (status === 'verified' || status === 'resolved') {
    return 'border-brand-primary/40 bg-brand-primary/20 text-brand-darkest'
  }

  if (status === 'pending' || status === 'open') {
    return 'border-brand-muted/50 bg-brand-muted/25 text-brand-darkest'
  }

  if (status === 'flagged' || status === 'escalated') {
    return 'border-brand-dark bg-brand-dark text-brand-light'
  }

  return 'border-brand-muted/50 bg-brand-light text-brand-darkest'
}

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

const VerifierDashboard = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const clearAuth = useAuthStore((state) => state.clearAuth)
  const storeProfile = useAuthStore((state) => state.profile)

  const [notice, setNotice] = useState(null)
  const [flagReasons, setFlagReasons] = useState({})

  const [shiftFilterDraft, setShiftFilterDraft] = useState({
    workerId: '',
    status: 'pending',
    platform: '',
    from: '',
    to: '',
  })
  const [shiftFilters, setShiftFilters] = useState({
    workerId: '',
    status: 'pending',
    platform: '',
    from: '',
    to: '',
  })

  const [grievanceFilterDraft, setGrievanceFilterDraft] = useState({
    workerId: '',
    status: '',
    platform: '',
    category: '',
    search: '',
    tag: '',
  })
  const [grievanceFilters, setGrievanceFilters] = useState({
    workerId: '',
    status: '',
    platform: '',
    category: '',
    search: '',
    tag: '',
  })

  const [thresholdDraft, setThresholdDraft] = useState('20')
  const [activeThreshold, setActiveThreshold] = useState(20)

  const { data: meData } = useMe()
  const profile = meData?.profile || storeProfile || null

  const pingQuery = useQuery({
    queryKey: ['verifier-ping'],
    queryFn: getVerifierPing,
    staleTime: 60_000,
  })

  const shiftLogsQuery = useQuery({
    queryKey: ['verifier-shift-logs', shiftFilters],
    queryFn: () =>
      listVerifierShiftLogs({
        workerId: shiftFilters.workerId || undefined,
        status: shiftFilters.status || undefined,
        platform: shiftFilters.platform || undefined,
        from: shiftFilters.from || undefined,
        to: shiftFilters.to || undefined,
        limit: 60,
        offset: 0,
      }),
    staleTime: 20_000,
  })

  const vulnerabilityQuery = useQuery({
    queryKey: ['verifier-vulnerability-flags', activeThreshold],
    queryFn: () => getVerifierVulnerabilityFlags({ threshold: activeThreshold }),
    staleTime: 20_000,
  })

  const grievancesQuery = useQuery({
    queryKey: ['verifier-grievances', grievanceFilters],
    queryFn: () =>
      listVerifierGrievances({
        workerId: grievanceFilters.workerId || undefined,
        status: grievanceFilters.status || undefined,
        platform: grievanceFilters.platform || undefined,
        category: grievanceFilters.category || undefined,
        search: grievanceFilters.search || undefined,
        tag: grievanceFilters.tag || undefined,
        limit: 30,
        offset: 0,
      }),
    staleTime: 20_000,
  })

  const refreshVerifierData = () => {
    queryClient.invalidateQueries({ queryKey: ['verifier-shift-logs'] })
    queryClient.invalidateQueries({ queryKey: ['verifier-vulnerability-flags'] })
  }

  const verifyMutation = useMutation({
    mutationFn: ({ shiftLogId }) =>
      updateVerifierShiftLogVerification({
        shiftLogId,
        status: 'verified',
        anomalyExplanation: null,
      }),
    onSuccess: () => {
      setNotice({ type: 'success', message: 'Shift log marked as verified.' })
      refreshVerifierData()
    },
    onError: (error) => {
      setNotice({ type: 'error', message: parseApiError(error) })
    },
  })

  const flagMutation = useMutation({
    mutationFn: ({ shiftLogId, reason }) =>
      updateVerifierShiftLogVerification({
        shiftLogId,
        status: 'flagged',
        anomalyExplanation: reason,
      }),
    onSuccess: (_data, variables) => {
      setNotice({ type: 'success', message: 'Shift log flagged with explanation.' })
      setFlagReasons((current) => ({
        ...current,
        [variables.shiftLogId]: '',
      }))
      refreshVerifierData()
    },
    onError: (error) => {
      setNotice({ type: 'error', message: parseApiError(error) })
    },
  })

  const shiftItems = useMemo(() => shiftLogsQuery.data?.items ?? [], [shiftLogsQuery.data?.items])
  const grievanceItems = useMemo(
    () => grievancesQuery.data?.items ?? [],
    [grievancesQuery.data?.items]
  )
  const vulnerabilityWorkers = useMemo(
    () => vulnerabilityQuery.data?.workers ?? [],
    [vulnerabilityQuery.data?.workers]
  )

  const shiftStats = useMemo(() => {
    const total = shiftItems.length
    const pending = shiftItems.filter((item) => item.status === 'pending').length
    const verified = shiftItems.filter((item) => item.status === 'verified').length
    const flagged = shiftItems.filter((item) => item.status === 'flagged').length

    return {
      total,
      pending,
      verified,
      flagged,
    }
  }, [shiftItems])

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  const isRowBusy = (shiftLogId) => {
    const verifyBusy =
      verifyMutation.isPending && verifyMutation.variables?.shiftLogId === shiftLogId
    const flagBusy = flagMutation.isPending && flagMutation.variables?.shiftLogId === shiftLogId

    return verifyBusy || flagBusy
  }

  const handleVerify = (shiftLogId) => {
    setNotice(null)
    verifyMutation.mutate({ shiftLogId })
  }

  const handleFlag = (shiftLogId) => {
    const reason = String(flagReasons[shiftLogId] || '').trim()

    if (!reason) {
      setNotice({
        type: 'error',
        message: 'Flag reason is required when marking a shift log as flagged.',
      })
      return
    }

    setNotice(null)
    flagMutation.mutate({ shiftLogId, reason })
  }

  const applyShiftFilters = () => {
    setShiftFilters({
      workerId: shiftFilterDraft.workerId.trim(),
      status: shiftFilterDraft.status,
      platform: shiftFilterDraft.platform.trim(),
      from: shiftFilterDraft.from,
      to: shiftFilterDraft.to,
    })
  }

  const resetShiftFilters = () => {
    const resetValue = {
      workerId: '',
      status: 'pending',
      platform: '',
      from: '',
      to: '',
    }

    setShiftFilterDraft(resetValue)
    setShiftFilters(resetValue)
  }

  const applyGrievanceFilters = () => {
    setGrievanceFilters({
      workerId: grievanceFilterDraft.workerId.trim(),
      status: grievanceFilterDraft.status,
      platform: grievanceFilterDraft.platform.trim(),
      category: grievanceFilterDraft.category.trim(),
      search: grievanceFilterDraft.search.trim(),
      tag: grievanceFilterDraft.tag.trim(),
    })
  }

  const resetGrievanceFilters = () => {
    const resetValue = {
      workerId: '',
      status: '',
      platform: '',
      category: '',
      search: '',
      tag: '',
    }

    setGrievanceFilterDraft(resetValue)
    setGrievanceFilters(resetValue)
  }

  const applyThreshold = () => {
    const next = Number(thresholdDraft)

    if (!Number.isFinite(next) || next <= 0) {
      setNotice({ type: 'error', message: 'Threshold must be a positive number.' })
      return
    }

    setNotice(null)
    setActiveThreshold(Number(next.toFixed(2)))
  }

  return (
    <AppShell
      title="Verifier Dashboard"
      subtitle="Review pending shift logs, flag anomalies, and monitor vulnerable workers."
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
                  key={`verifier-stats-skeleton-${index}`}
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-3 h-8 w-16" />
                </article>
              ))
            : [
                <article
                  key="verifier-stats-total"
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-muted">Logs Listed</p>
                  <p className="mt-2 text-2xl font-bold">{shiftStats.total}</p>
                </article>,
                <article
                  key="verifier-stats-pending"
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-muted">Pending</p>
                  <p className="mt-2 text-2xl font-bold">{shiftStats.pending}</p>
                </article>,
                <article
                  key="verifier-stats-verified"
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-muted">Verified</p>
                  <p className="mt-2 text-2xl font-bold">{shiftStats.verified}</p>
                </article>,
                <article
                  key="verifier-stats-flagged"
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-muted">Flagged</p>
                  <p className="mt-2 text-2xl font-bold">{shiftStats.flagged}</p>
                </article>,
                <article
                  key="verifier-stats-ping"
                  className="rounded-lg border border-brand-muted/50 bg-brand-light p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-muted">Verifier Ping</p>
                  <p className="mt-2 text-lg font-semibold">
                    {pingQuery.isLoading
                      ? 'Checking...'
                      : pingQuery.isError
                        ? 'Unavailable'
                        : 'OK'}
                  </p>
                </article>,
              ]}
        </section>

        <section className="rounded-lg border border-brand-muted/50 bg-brand-light p-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Verification Queue</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Review shift logs and move pending records to verified or flagged.
              </p>
            </div>

            <Button
              type="button"
              className="rounded-md border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
              onClick={() => shiftLogsQuery.refetch()}
              disabled={shiftLogsQuery.isFetching}
            >
              {shiftLogsQuery.isFetching ? 'Refreshing...' : 'Refresh Queue'}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <Label htmlFor="shift_filter_worker_id">Worker ID</Label>
              <Input
                id="shift_filter_worker_id"
                placeholder="worker uuid"
                value={shiftFilterDraft.workerId}
                onChange={(event) =>
                  setShiftFilterDraft((current) => ({ ...current, workerId: event.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="shift_filter_status">Status</Label>
              <select
                id="shift_filter_status"
                className="h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
                value={shiftFilterDraft.status}
                onChange={(event) =>
                  setShiftFilterDraft((current) => ({ ...current, status: event.target.value }))
                }
              >
                {SHIFT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="shift_filter_platform">Platform</Label>
              <Input
                id="shift_filter_platform"
                placeholder="Uber"
                value={shiftFilterDraft.platform}
                onChange={(event) =>
                  setShiftFilterDraft((current) => ({ ...current, platform: event.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="shift_filter_from">From</Label>
              <Input
                id="shift_filter_from"
                type="date"
                value={shiftFilterDraft.from}
                onChange={(event) =>
                  setShiftFilterDraft((current) => ({ ...current, from: event.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="shift_filter_to">To</Label>
              <Input
                id="shift_filter_to"
                type="date"
                value={shiftFilterDraft.to}
                onChange={(event) =>
                  setShiftFilterDraft((current) => ({ ...current, to: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
              onClick={applyShiftFilters}
            >
              Apply Filters
            </Button>
            <Button
              type="button"
              className="rounded-md border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
              onClick={resetShiftFilters}
            >
              Reset
            </Button>
          </div>

          <div className="mt-5">
            {shiftLogsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-9 w-full" />
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={`queue-skeleton-${index}`} className="h-14 w-full" />
                ))}
              </div>
            ) : shiftLogsQuery.isError ? (
              <p className="text-sm text-brand-muted">{parseApiError(shiftLogsQuery.error)}</p>
            ) : shiftItems.length === 0 ? (
              <p className="text-sm text-brand-muted">No shift logs match current filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[980px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-brand-muted/50 text-left text-brand-muted">
                      <th className="px-3 py-2 font-semibold">Date</th>
                      <th className="px-3 py-2 font-semibold">Worker</th>
                      <th className="px-3 py-2 font-semibold">Platform</th>
                      <th className="px-3 py-2 font-semibold">Hours</th>
                      <th className="px-3 py-2 font-semibold">Net</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                      <th className="px-3 py-2 font-semibold">Flag Reason</th>
                      <th className="px-3 py-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftItems.map((item) => {
                      const rowBusy = isRowBusy(item.id)
                      const isPending = item.status === 'pending'

                      return (
                        <tr key={item.id} className="border-b border-brand-muted/30 align-top">
                          <td className="px-3 py-2">{formatDate(item.date)}</td>
                          <td className="px-3 py-2 font-mono text-xs">{item.worker_id}</td>
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
                          <td className="px-3 py-2">
                            {isPending ? (
                              <Input
                                placeholder="Required when flagging"
                                value={flagReasons[item.id] || ''}
                                onChange={(event) =>
                                  setFlagReasons((current) => ({
                                    ...current,
                                    [item.id]: event.target.value,
                                  }))
                                }
                                className="h-9"
                              />
                            ) : (
                              <p className="max-w-xs text-xs text-brand-muted">
                                {item.anomaly_explanation || '-'}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {isPending ? (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  className="rounded-md border border-brand-primary bg-brand-primary px-3 py-1.5 text-xs font-semibold text-brand-light transition-opacity hover:opacity-90"
                                  onClick={() => handleVerify(item.id)}
                                  disabled={rowBusy}
                                >
                                  Verify
                                </Button>
                                <Button
                                  type="button"
                                  className="rounded-md border border-brand-dark bg-brand-dark px-3 py-1.5 text-xs font-semibold text-brand-light transition-opacity hover:opacity-90"
                                  onClick={() => handleFlag(item.id)}
                                  disabled={rowBusy}
                                >
                                  Flag
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-brand-muted">No action</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-lg border border-brand-muted/50 bg-brand-light p-5">
            <h2 className="text-lg font-semibold">Vulnerability Flags</h2>
            <p className="mb-4 mt-1 text-sm text-brand-muted">
              Workers with month-on-month verified income drop above threshold are flagged.
            </p>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label htmlFor="vulnerability_threshold">Threshold (%)</Label>
                <Input
                  id="vulnerability_threshold"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={thresholdDraft}
                  onChange={(event) => setThresholdDraft(event.target.value)}
                  className="w-40"
                />
              </div>

              <Button
                type="button"
                className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
                onClick={applyThreshold}
              >
                Apply Threshold
              </Button>

              <Button
                type="button"
                className="rounded-md border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
                onClick={() => vulnerabilityQuery.refetch()}
                disabled={vulnerabilityQuery.isFetching}
              >
                {vulnerabilityQuery.isFetching ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3">
                <p className="text-xs uppercase tracking-wide text-brand-muted">Active Threshold</p>
                <p className="mt-2 text-xl font-bold">{formatPercent(activeThreshold)}</p>
              </div>
              <div className="rounded-lg border border-brand-muted/50 bg-brand-light p-3">
                <p className="text-xs uppercase tracking-wide text-brand-muted">Flagged Workers</p>
                <p className="mt-2 text-xl font-bold">{vulnerabilityWorkers.length}</p>
              </div>
            </div>

            {vulnerabilityQuery.isLoading ? (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={`vulnerability-skeleton-${index}`} className="h-16 w-full" />
                ))}
              </div>
            ) : vulnerabilityQuery.isError ? (
              <p className="mt-3 text-sm text-brand-muted">{parseApiError(vulnerabilityQuery.error)}</p>
            ) : vulnerabilityWorkers.length === 0 ? (
              <p className="mt-3 text-sm text-brand-muted">
                No workers currently exceed the threshold.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {vulnerabilityWorkers.map((item) => (
                  <article
                    key={`${item.worker_id}-${item.current_month}`}
                    className="rounded-lg border border-brand-muted/40 bg-brand-light p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-brand-darkest">
                        {item.worker_name || 'Unknown Worker'}
                      </p>
                      <span className="rounded-full border border-brand-dark bg-brand-dark px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-light">
                        Drop {formatPercent(item.drop_percentage)}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-brand-muted">{item.worker_id}</p>
                    <div className="mt-2 grid gap-2 text-sm text-brand-dark md:grid-cols-2">
                      <p>
                        <span className="font-medium">Previous:</span> {item.previous_month} ({formatCurrency(item.previous_month_income)})
                      </p>
                      <p>
                        <span className="font-medium">Current:</span> {item.current_month} ({formatCurrency(item.current_month_income)})
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-brand-muted">City: {item.city_zone || 'N/A'}</p>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-lg border border-brand-muted/50 bg-brand-light p-5">
            <h2 className="text-lg font-semibold">Grievances Overview</h2>
            <p className="mb-4 mt-1 text-sm text-brand-muted">
              View grievances across workers with verifier-level filters.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="grievance_filter_worker_id">Worker ID</Label>
                <Input
                  id="grievance_filter_worker_id"
                  value={grievanceFilterDraft.workerId}
                  onChange={(event) =>
                    setGrievanceFilterDraft((current) => ({
                      ...current,
                      workerId: event.target.value,
                    }))
                  }
                  placeholder="worker uuid"
                />
              </div>

              <div>
                <Label htmlFor="grievance_filter_status">Status</Label>
                <select
                  id="grievance_filter_status"
                  className="h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  value={grievanceFilterDraft.status}
                  onChange={(event) =>
                    setGrievanceFilterDraft((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="">all</option>
                  {GRIEVANCE_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="grievance_filter_platform">Platform</Label>
                <Input
                  id="grievance_filter_platform"
                  value={grievanceFilterDraft.platform}
                  onChange={(event) =>
                    setGrievanceFilterDraft((current) => ({
                      ...current,
                      platform: event.target.value,
                    }))
                  }
                  placeholder="Uber"
                />
              </div>

              <div>
                <Label htmlFor="grievance_filter_category">Category</Label>
                <Input
                  id="grievance_filter_category"
                  value={grievanceFilterDraft.category}
                  onChange={(event) =>
                    setGrievanceFilterDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  placeholder="payment issue"
                />
              </div>

              <div>
                <Label htmlFor="grievance_filter_tag">Tag</Label>
                <Input
                  id="grievance_filter_tag"
                  value={grievanceFilterDraft.tag}
                  onChange={(event) =>
                    setGrievanceFilterDraft((current) => ({
                      ...current,
                      tag: event.target.value,
                    }))
                  }
                  placeholder="late payout"
                />
              </div>

              <div>
                <Label htmlFor="grievance_filter_search">Search</Label>
                <Input
                  id="grievance_filter_search"
                  value={grievanceFilterDraft.search}
                  onChange={(event) =>
                    setGrievanceFilterDraft((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                  placeholder="description or category"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                className="rounded-md border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
                onClick={applyGrievanceFilters}
              >
                Apply Filters
              </Button>
              <Button
                type="button"
                className="rounded-md border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
                onClick={resetGrievanceFilters}
              >
                Reset
              </Button>
            </div>

            {grievancesQuery.isLoading ? (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={`grievance-skeleton-${index}`} className="h-20 w-full" />
                ))}
              </div>
            ) : grievancesQuery.isError ? (
              <p className="mt-3 text-sm text-brand-muted">{parseApiError(grievancesQuery.error)}</p>
            ) : grievanceItems.length === 0 ? (
              <p className="mt-3 text-sm text-brand-muted">No grievances found for these filters.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {grievanceItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-lg border border-brand-muted/40 bg-brand-light px-3 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold text-brand-darkest">{item.category}</p>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClassByStatus(item.status)}`}
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
                    <p className="mt-1 font-mono text-xs text-brand-muted">Worker: {item.worker_id}</p>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </AppShell>
  )
}

export default VerifierDashboard
