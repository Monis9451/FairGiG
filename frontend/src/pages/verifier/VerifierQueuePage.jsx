import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import VerifierNoticeBanner from '@/components/verifier/VerifierNoticeBanner'
import VerifierPageHeader from '@/components/verifier/VerifierPageHeader'
import VerifierSectionCard from '@/components/verifier/VerifierSectionCard'
import QueueFilters from '@/components/verifier/queue/QueueFilters'
import QueueTable from '@/components/verifier/queue/QueueTable'
import { parseApiError } from '@/features/verifier/utils'
import { useVerifierShiftLogsQuery } from '@/hooks/useVerifierQueries'
import { updateVerifierShiftLogVerification } from '@/api/verifier'

const defaultShiftFilters = {
  workerId: '',
  status: 'pending',
  platform: '',
  from: '',
  to: '',
}

const VerifierQueuePage = () => {
  const queryClient = useQueryClient()

  const [notice, setNotice] = useState(null)
  const [verificationNotes, setVerificationNotes] = useState({})
  const [shiftFilterDraft, setShiftFilterDraft] = useState(defaultShiftFilters)
  const [shiftFilters, setShiftFilters] = useState(defaultShiftFilters)

  const shiftLogsQuery = useVerifierShiftLogsQuery(shiftFilters)

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
      setVerificationNotes((current) => ({
        ...current,
        [variables.shiftLogId]: '',
      }))
      refreshVerifierData()
    },
    onError: (error) => {
      setNotice({ type: 'error', message: parseApiError(error) })
    },
  })

  const unverifiableMutation = useMutation({
    mutationFn: ({ shiftLogId, reason }) =>
      updateVerifierShiftLogVerification({
        shiftLogId,
        status: 'unverifiable',
        anomalyExplanation: reason,
      }),
    onSuccess: (_data, variables) => {
      setNotice({ type: 'success', message: 'Shift log marked as unverifiable.' })
      setVerificationNotes((current) => ({
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

  const isRowBusy = (shiftLogId) => {
    const verifyBusy = verifyMutation.isPending && verifyMutation.variables?.shiftLogId === shiftLogId
    const flagBusy = flagMutation.isPending && flagMutation.variables?.shiftLogId === shiftLogId
    const unverifiableBusy =
      unverifiableMutation.isPending && unverifiableMutation.variables?.shiftLogId === shiftLogId

    return verifyBusy || flagBusy || unverifiableBusy
  }

  const handleVerify = (shiftLogId) => {
    setNotice(null)
    verifyMutation.mutate({ shiftLogId })
  }

  const handleFlag = (shiftLogId) => {
    const reason = String(verificationNotes[shiftLogId] || '').trim()

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

  const handleUnverifiable = (shiftLogId) => {
    const reason = String(verificationNotes[shiftLogId] || '').trim()

    if (!reason) {
      setNotice({
        type: 'error',
        message: 'An explanation is required when marking a shift log as unverifiable.',
      })
      return
    }

    setNotice(null)
    unverifiableMutation.mutate({ shiftLogId, reason })
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
    setShiftFilterDraft(defaultShiftFilters)
    setShiftFilters(defaultShiftFilters)
  }

  const updateDraftFilter = (field, value) => {
    setShiftFilterDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-5">
      <VerifierPageHeader
        badge="Primary Workflow"
        title="Verification Queue"
        description="Validate shift evidence and finalize each pending record as verified, flagged, or unverifiable."
        actions={
          <Button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition hover:opacity-90"
            onClick={() => shiftLogsQuery.refetch()}
            disabled={shiftLogsQuery.isFetching}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {shiftLogsQuery.isFetching ? 'Refreshing...' : 'Refresh Queue'}
          </Button>
        }
      />

      <VerifierNoticeBanner notice={notice} />

      <VerifierSectionCard
        kicker="Queue Filters"
        title="Filter Shift Logs"
        description="Scope the queue by worker, status, platform, or date range before review."
      >
        <QueueFilters
          filters={shiftFilterDraft}
          onChange={updateDraftFilter}
          onApply={applyShiftFilters}
          onReset={resetShiftFilters}
        />
        <QueueTable
          items={shiftItems}
          isLoading={shiftLogsQuery.isLoading}
          isError={shiftLogsQuery.isError}
          error={shiftLogsQuery.error}
          verificationNotes={verificationNotes}
          onVerificationNoteChange={(shiftLogId, value) =>
            setVerificationNotes((current) => ({
              ...current,
              [shiftLogId]: value,
            }))
          }
          onVerify={handleVerify}
          onFlag={handleFlag}
          onUnverifiable={handleUnverifiable}
          isRowBusy={isRowBusy}
        />
      </VerifierSectionCard>
    </div>
  )
}

export default VerifierQueuePage
