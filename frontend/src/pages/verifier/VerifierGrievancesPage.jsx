import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import VerifierPageHeader from '@/components/verifier/VerifierPageHeader'
import VerifierSectionCard from '@/components/verifier/VerifierSectionCard'
import GrievanceFilters from '@/components/verifier/grievances/GrievanceFilters'
import GrievanceList from '@/components/verifier/grievances/GrievanceList'
import { useVerifierGrievancesQuery } from '@/hooks/useVerifierQueries'

const defaultGrievanceFilters = {
  workerId: '',
  status: '',
  platform: '',
  category: '',
  search: '',
  tag: '',
}

const VerifierGrievancesPage = () => {
  const [grievanceFilterDraft, setGrievanceFilterDraft] = useState(defaultGrievanceFilters)
  const [grievanceFilters, setGrievanceFilters] = useState(defaultGrievanceFilters)

  const grievancesQuery = useVerifierGrievancesQuery(grievanceFilters)

  const grievanceItems = useMemo(
    () => grievancesQuery.data?.items ?? [],
    [grievancesQuery.data?.items]
  )

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
    setGrievanceFilterDraft(defaultGrievanceFilters)
    setGrievanceFilters(defaultGrievanceFilters)
  }

  const updateDraftFilter = (field, value) => {
    setGrievanceFilterDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  return (
    <div className="space-y-5">
      <VerifierPageHeader
        badge="Disputes"
        title="Grievances Overview"
        description="Review worker disputes with verifier-level filters for status, category, platform, and tags."
        actions={
          <Button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition hover:opacity-90"
            onClick={() => grievancesQuery.refetch()}
            disabled={grievancesQuery.isFetching}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {grievancesQuery.isFetching ? 'Refreshing...' : 'Refresh List'}
          </Button>
        }
      />

      <VerifierSectionCard
        kicker="Filter View"
        title="Find Relevant Grievances"
        description="Apply targeted filters to investigate specific worker complaints quickly."
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
        />
      </VerifierSectionCard>
    </div>
  )
}

export default VerifierGrievancesPage
