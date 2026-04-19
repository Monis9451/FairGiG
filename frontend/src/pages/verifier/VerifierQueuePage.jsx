import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import VerifierPageHeader from '@/components/verifier/VerifierPageHeader'
import VerifierSectionCard from '@/components/verifier/VerifierSectionCard'
import QueueFilters from '@/components/verifier/queue/QueueFilters'
import QueueTable from '@/components/verifier/queue/QueueTable'
import { parseApiError } from '@/features/verifier/utils'
import { useVerifierShiftLogsQuery } from '@/hooks/useVerifierQueries'
import { updateVerifierShiftLogVerification } from '@/api/verifier'
import { useToast } from '@/hooks/useToast'

const defaultShiftFilters = {
  workerId: '',
  status: 'pending',
  platform: '',
  from: '',
  to: '',
}

const VerifierQueuePage = () => {
  const queryClient = useQueryClient()
  const { success: showSuccessToast, error: showErrorToast } = useToast()

  const [verificationNotes, setVerificationNotes] = useState({})
  const [shiftFilterDraft, setShiftFilterDraft] = useState(defaultShiftFilters)
  const [shiftFilters, setShiftFilters] = useState(defaultShiftFilters)

  const shiftLogsQuery = useVerifierShiftLogsQuery(shiftFilters)

  const refreshVerifierData = () => {
    queryClient.invalidateQueries({ queryKey: ['verifier-shift-logs'] })
    queryClient.invalidateQueries({ queryKey: ['verifier-vulnerability-flags'] })
  }

  const verifyMutation = useMutation({
    meta: {
      disableSuccessToast: true,
      disableErrorToast: true,
    },
    mutationFn: ({ shiftLogId }) =>
      updateVerifierShiftLogVerification({
        shiftLogId,
        status: 'verified',
        anomalyExplanation: null,
      }),
    onSuccess: () => {
      showSuccessToast('Shift log marked as verified.')
      refreshVerifierData()
    },
    onError: (error) => {
      showErrorToast(parseApiError(error))
    },
  })

  const flagMutation = useMutation({
    meta: {
      disableSuccessToast: true,
      disableErrorToast: true,
    },
    mutationFn: ({ shiftLogId, reason }) =>
      updateVerifierShiftLogVerification({
        shiftLogId,
        status: 'flagged',
        anomalyExplanation: reason,
      }),
    onSuccess: (_data, variables) => {
      showSuccessToast('Shift log flagged with explanation.')
      setVerificationNotes((current) => ({
        ...current,
        [variables.shiftLogId]: '',
      }))
      refreshVerifierData()
    },
    onError: (error) => {
      showErrorToast(parseApiError(error))
    },
  })

  const unverifiableMutation = useMutation({
    meta: {
      disableSuccessToast: true,
      disableErrorToast: true,
    },
    mutationFn: ({ shiftLogId, reason }) =>
      updateVerifierShiftLogVerification({
        shiftLogId,
        status: 'unverifiable',
        anomalyExplanation: reason,
      }),
    onSuccess: (_data, variables) => {
      showSuccessToast('Shift log marked as unverifiable.')
      setVerificationNotes((current) => ({
        ...current,
        [variables.shiftLogId]: '',
      }))
      refreshVerifierData()
    },
    onError: (error) => {
      showErrorToast(parseApiError(error))
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
    verifyMutation.mutate({ shiftLogId })
  }

  const handleFlag = (shiftLogId) => {
    const reason = String(verificationNotes[shiftLogId] || '').trim()

    if (!reason) {
      showErrorToast('Flag reason is required when marking a shift log as flagged.')
      return
    }

    flagMutation.mutate({ shiftLogId, reason })
  }

  const handleUnverifiable = (shiftLogId) => {
    const reason = String(verificationNotes[shiftLogId] || '').trim()

    if (!reason) {
      showErrorToast('An explanation is required when marking a shift log as unverifiable.')
      return
    }

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
    <div className="space-y-6">
      <VerifierPageHeader
        badge="Queue"
        title="Shift verification"
        description="Confirm evidence, then mark each row verified, flagged, or unverifiable. Flag and unverifiable require a short note."
        actions={
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-lg border-brand-darkest/15 bg-white px-4 text-sm font-semibold text-brand-darkest shadow-sm"
            onClick={() => shiftLogsQuery.refetch()}
            disabled={shiftLogsQuery.isFetching}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {shiftLogsQuery.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      <VerifierSectionCard
        kicker="Filters & results"
        title="Shift logs"
        description="Narrow by worker, status, platform, or dates, then review the list below."
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
