import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import VerifierPageHeader from '@/components/verifier/VerifierPageHeader'
import VerifierPaginationBar from '@/components/verifier/VerifierPaginationBar'
import VerifierSectionCard from '@/components/verifier/VerifierSectionCard'
import GrievanceFilters from '@/components/verifier/grievances/GrievanceFilters'
import GrievanceList from '@/components/verifier/grievances/GrievanceList'
import { parseApiError } from '@/features/verifier/utils'
import { useVerifierGrievancesQuery } from '@/hooks/useVerifierQueries'
import { updateVerifierGrievance } from '@/api/verifier'
import { useToast } from '@/hooks/useToast'

const defaultGrievanceFilters = {
  workerId: '',
  status: '',
  platform: '',
  category: '',
  search: '',
  tag: '',
}

const VerifierGrievancesPage = () => {
  const queryClient = useQueryClient()
  const { success: showSuccessToast, error: showErrorToast } = useToast()

  const [grievanceFilterDraft, setGrievanceFilterDraft] = useState(defaultGrievanceFilters)
  const [grievanceFilters, setGrievanceFilters] = useState(defaultGrievanceFilters)
  const [listPaging, setListPaging] = useState({ page: 0, pageSize: 15 })

  const grievancesQuery = useVerifierGrievancesQuery({
    ...grievanceFilters,
    limit: listPaging.pageSize,
    offset: listPaging.page * listPaging.pageSize,
  })

  const updateStatusMutation = useMutation({
    meta: { disableSuccessToast: true, disableErrorToast: true },
    mutationFn: ({ grievanceId, status }) => updateVerifierGrievance({ grievanceId, status }),
    onSuccess: () => {
      showSuccessToast('Grievance status updated.')
      queryClient.invalidateQueries({ queryKey: ['verifier-grievances'] })
    },
    onError: (err) => {
      showErrorToast(parseApiError(err))
    },
  })

  const grievanceItems = useMemo(
    () => grievancesQuery.data?.items ?? [],
    [grievancesQuery.data?.items]
  )

  const grievancePagination = grievancesQuery.data?.pagination

  const applyGrievanceFilters = () => {
    setListPaging((p) => ({ ...p, page: 0 }))
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
    setGrievanceFilterDraft(defaultGrievanceFilters)
    setGrievanceFilters(defaultGrievanceFilters)
    setListPaging((p) => ({ ...p, page: 0 }))
  }

  const updateDraftFilter = (field, value) => {
    setGrievanceFilterDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSaveStatus = (grievanceId, status) => {
    updateStatusMutation.mutate({ grievanceId, status })
  }

  const offset = listPaging.page * listPaging.pageSize
  const goPrev = () => setListPaging((p) => ({ ...p, page: Math.max(0, p.page - 1) }))
  const goNext = () => setListPaging((p) => ({ ...p, page: p.page + 1 }))
  const onPageSizeChange = (pageSize) => setListPaging({ page: 0, pageSize })

  const showPagination =
    !grievancesQuery.isLoading && !grievancesQuery.isError && (grievanceItems.length > 0 || offset > 0)

  return (
    <div className="space-y-8">
      <VerifierPageHeader
        badge="Disputes"
        title="Grievances"
        description="Filter worker cases and update status when triage is complete (open, escalated, resolved)."
        actions={
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-xl border-brand-darkest/12 bg-white px-4 text-sm font-semibold text-brand-darkest shadow-sm"
            onClick={() => grievancesQuery.refetch()}
            disabled={grievancesQuery.isFetching}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {grievancesQuery.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      <VerifierSectionCard
        kicker="Triage"
        title="Case list"
        description="Use worker ID, status, platform, category, tags, or free-text search. Totals are exact unless tag or search filters are set."
        className="ring-1 ring-brand-darkest/[0.06]"
      >
        <GrievanceFilters
          filters={grievanceFilterDraft}
          onChange={updateDraftFilter}
          onApply={applyGrievanceFilters}
          onReset={resetGrievanceFilters}
        />

        <GrievanceList
          items={grievanceItems}
          isLoading={grievancesQuery.isLoading}
          isError={grievancesQuery.isError}
          error={grievancesQuery.error}
          onSaveStatus={handleSaveStatus}
          updatingId={updateStatusMutation.isPending ? updateStatusMutation.variables?.grievanceId : null}
        />
        {showPagination ? (
          <VerifierPaginationBar
            offset={offset}
            limit={listPaging.pageSize}
            total={grievancePagination?.total}
            itemCount={grievanceItems.length}
            isLoading={grievancesQuery.isFetching}
            onPrev={goPrev}
            onNext={goNext}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[10, 15, 25, 50]}
          />
        ) : null}
      </VerifierSectionCard>
    </div>
  )
}

export default VerifierGrievancesPage
