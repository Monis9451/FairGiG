import { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import WorkerPageHeader from '@/components/worker/WorkerPageHeader'
import WorkerSectionCard from '@/components/worker/WorkerSectionCard'
import { useToast } from '@/hooks/useToast'
import { GRIEVANCE_STATUS_OPTIONS } from '@/features/verifier/constants'
import { parseApiError, parseTagsFromInput } from '@/features/worker/utils'
import {
  useAdvocateGrievanceQuery,
  useAdvocateGrievancesQuery,
  useUpdateAdvocateGrievanceMutation,
} from '@/hooks/useAdvocateQueries'
import WorkerContactBlock from '@/components/verifier/WorkerContactBlock'
import { workerPrimaryLabel } from '@/features/verifier/workerDisplay'
import { formatDate } from '@/utils/formatters'

const defaultFilters = {
  workerId: '',
  status: '',
  platform: '',
  category: '',
  search: '',
  tag: '',
}

const fieldClassName =
  'h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary'

function GrievanceDetailEditor({ grievance, onSave, isSaving }) {
  const [status, setStatus] = useState(grievance.status || 'open')
  const [platform, setPlatform] = useState(grievance.platform || '')
  const [category, setCategory] = useState(grievance.category || '')
  const [description, setDescription] = useState(grievance.description || '')
  const [tagsInput, setTagsInput] = useState(
    Array.isArray(grievance.tags) ? grievance.tags.join(', ') : ''
  )

  const canSave = Boolean(status && category.trim() && description.trim())

  const submit = () => {
    onSave({
      status,
      platform: platform.trim(),
      category: category.trim(),
      description: description.trim(),
      tags: parseTagsFromInput(tagsInput),
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-3 text-xs text-brand-muted">
        <WorkerContactBlock item={grievance} />
        <p className="mt-2">
          <span className="font-semibold text-brand-darkest">Created:</span> {formatDate(grievance.created_at)}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="adv_status">Status</Label>
          <select id="adv_status" className={fieldClassName} value={status} onChange={(event) => setStatus(event.target.value)}>
            {GRIEVANCE_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="adv_platform">Platform</Label>
          <Input
            id="adv_platform"
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
            placeholder="Uber"
          />
        </div>

        <div>
          <Label htmlFor="adv_category">Category</Label>
          <Input
            id="adv_category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="payment issue"
          />
        </div>

        <div>
          <Label htmlFor="adv_tags">Tags</Label>
          <Input
            id="adv_tags"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="deactivation, payout"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="adv_description">Description</Label>
        <textarea
          id="adv_description"
          rows={6}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full rounded-xl border border-brand-muted/50 bg-brand-light px-3 py-2 text-sm text-brand-darkest focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={submit}
          disabled={!canSave || isSaving}
          className="rounded-xl border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

const AdvocateGrievancesPage = () => {
  const { success: showSuccessToast, error: showErrorToast } = useToast()
  const [filtersDraft, setFiltersDraft] = useState(defaultFilters)
  const [filters, setFilters] = useState(defaultFilters)
  const [selectedGrievanceId, setSelectedGrievanceId] = useState('')

  const grievancesQuery = useAdvocateGrievancesQuery(filters)
  const updateGrievanceMutation = useUpdateAdvocateGrievanceMutation()

  const grievanceItems = useMemo(() => grievancesQuery.data?.items ?? [], [grievancesQuery.data?.items])

  const effectiveSelectedId =
    selectedGrievanceId && grievanceItems.some((item) => item.id === selectedGrievanceId)
      ? selectedGrievanceId
      : grievanceItems[0]?.id || ''

  const selectedListGrievance = useMemo(
    () => grievanceItems.find((item) => item.id === effectiveSelectedId) || null,
    [grievanceItems, effectiveSelectedId]
  )

  const grievanceDetailQuery = useAdvocateGrievanceQuery(effectiveSelectedId)

  const applyFilters = () => {
    setFilters({
      workerId: filtersDraft.workerId.trim(),
      status: filtersDraft.status,
      platform: filtersDraft.platform.trim(),
      category: filtersDraft.category.trim(),
      search: filtersDraft.search.trim(),
      tag: filtersDraft.tag.trim(),
    })
  }

  const resetFilters = () => {
    setFiltersDraft(defaultFilters)
    setFilters(defaultFilters)
    setSelectedGrievanceId('')
  }

  const updateFilterDraft = (field, value) => {
    setFiltersDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const selectedGrievance =
    grievanceDetailQuery.data?.grievance || grievanceDetailQuery.data || selectedListGrievance

  const isDetailLoading = grievanceDetailQuery.isLoading && !selectedListGrievance
  const isDetailError = grievanceDetailQuery.isError && !selectedListGrievance

  const onSaveDetail = (payload) => {
    if (!effectiveSelectedId) {
      return
    }

    updateGrievanceMutation.mutate(
      {
        id: effectiveSelectedId,
        ...payload,
      },
      {
        onSuccess: () => {
          showSuccessToast('Grievance updated successfully.')
        },
        onError: (error) => {
          showErrorToast(parseApiError(error))
        },
      }
    )
  }

  return (
    <div className="space-y-5">
      <WorkerPageHeader
        badge="Grievance Manager"
        title="Cross-Worker Grievance Review"
        description="Filter the dispute queue on the left and resolve individual cases from the detail workspace on the right."
        actions={
          <Button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition hover:opacity-90"
            onClick={() => {
              void grievancesQuery.refetch()
              void grievanceDetailQuery.refetch()
            }}
            disabled={grievancesQuery.isFetching || grievanceDetailQuery.isFetching}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <WorkerSectionCard
          kicker="Queue"
          title="Grievance List"
          description="Use filters to narrow by worker, status, platform, and tags."
        >
          <div className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="adv_filter_worker">Worker ID</Label>
                <Input
                  id="adv_filter_worker"
                  value={filtersDraft.workerId}
                  onChange={(event) => updateFilterDraft('workerId', event.target.value)}
                  placeholder="worker uuid"
                />
              </div>

              <div>
                <Label htmlFor="adv_filter_status">Status</Label>
                <select
                  id="adv_filter_status"
                  className={fieldClassName}
                  value={filtersDraft.status}
                  onChange={(event) => updateFilterDraft('status', event.target.value)}
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
                <Label htmlFor="adv_filter_platform">Platform</Label>
                <Input
                  id="adv_filter_platform"
                  value={filtersDraft.platform}
                  onChange={(event) => updateFilterDraft('platform', event.target.value)}
                  placeholder="Uber"
                />
              </div>

              <div>
                <Label htmlFor="adv_filter_category">Category</Label>
                <Input
                  id="adv_filter_category"
                  value={filtersDraft.category}
                  onChange={(event) => updateFilterDraft('category', event.target.value)}
                  placeholder="payment issue"
                />
              </div>

              <div>
                <Label htmlFor="adv_filter_tag">Tag</Label>
                <Input
                  id="adv_filter_tag"
                  value={filtersDraft.tag}
                  onChange={(event) => updateFilterDraft('tag', event.target.value)}
                  placeholder="deactivation"
                />
              </div>

              <div>
                <Label htmlFor="adv_filter_search">Search</Label>
                <Input
                  id="adv_filter_search"
                  value={filtersDraft.search}
                  onChange={(event) => updateFilterDraft('search', event.target.value)}
                  placeholder="description text"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                className="rounded-xl border border-brand-primary bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-light transition-opacity hover:opacity-90"
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
              <Button
                type="button"
                className="rounded-xl border border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-brand-darkest transition-opacity hover:opacity-90"
                onClick={resetFilters}
              >
                Reset
              </Button>
            </div>
          </div>

          {grievancesQuery.isLoading ? (
            <p className="text-sm text-brand-muted">Loading grievances...</p>
          ) : grievancesQuery.isError ? (
            <p className="text-sm text-brand-muted">{parseApiError(grievancesQuery.error)}</p>
          ) : grievanceItems.length === 0 ? (
            <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-3 text-sm text-brand-muted">
              No grievances matched the active filters.
            </p>
          ) : (
            <div className="space-y-2">
              {grievanceItems.map((item) => {
                const selected = item.id === effectiveSelectedId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedGrievanceId(item.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selected
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-brand-muted/35 bg-brand-light/70 hover:border-brand-primary/45'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-darkest">{item.category}</p>
                      <span className="text-xs uppercase tracking-wide text-brand-muted">{item.status}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-brand-muted">{item.description}</p>
                    <p className="mt-2 text-[11px] text-brand-muted">
                      {item.platform} • {formatDate(item.created_at)} • {workerPrimaryLabel(item)}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </WorkerSectionCard>

        <WorkerSectionCard
          kicker="Detail"
          title="Selected Grievance"
          description="Review and update one grievance at a time for accurate case handling."
        >
          {!effectiveSelectedId ? (
            <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-3 text-sm text-brand-muted">
              Select a grievance from the list to open its detail view.
            </p>
          ) : isDetailLoading ? (
            <p className="text-sm text-brand-muted">Loading grievance details...</p>
          ) : isDetailError ? (
            <p className="text-sm text-brand-muted">{parseApiError(grievanceDetailQuery.error)}</p>
          ) : selectedGrievance ? (
            <GrievanceDetailEditor
              key={`${selectedGrievance.id}-${selectedGrievance.status}-${selectedGrievance.updated_at || ''}`}
              grievance={selectedGrievance}
              onSave={onSaveDetail}
              isSaving={updateGrievanceMutation.isPending}
            />
          ) : (
            <p className="rounded-xl border border-brand-muted/35 bg-brand-light/70 p-3 text-sm text-brand-muted">
              Details are not available for this grievance.
            </p>
          )}
        </WorkerSectionCard>
      </div>
    </div>
  )
}

export default AdvocateGrievancesPage
