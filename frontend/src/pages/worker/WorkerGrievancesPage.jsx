import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import WorkerPageHeader from '@/components/worker/WorkerPageHeader'
import GrievanceFormCard from '@/components/worker/grievances/GrievanceFormCard'
import GrievanceListCard from '@/components/worker/grievances/GrievanceListCard'
import { useToast } from '@/hooks/useToast'
import { createWorkerGrievance, listWorkerGrievances } from '@/api/worker'
import { WORKER_PLATFORM_OPTIONS } from '@/features/worker/constants'
import { grievanceFormSchema } from '@/features/worker/schemas'
import {
  grievanceBadgeClassByStatus,
  parseApiError,
  parseTagsFromInput,
} from '@/features/worker/utils'

const WorkerGrievancesPage = () => {
  const queryClient = useQueryClient()
  const { success: showSuccessToast, error: showErrorToast } = useToast()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(grievanceFormSchema),
    defaultValues: {
      platform: 'Uber',
      category: 'payment issue',
      description: '',
      tags: '',
    },
  })

  const selectedPlatform = useWatch({ control, name: 'platform' }) || 'Uber'

  const grievancesQuery = useQuery({
    queryKey: ['worker-grievances'],
    queryFn: () => listWorkerGrievances({ limit: 30, offset: 0 }),
    staleTime: 30_000,
  })

  const grievanceItems = useMemo(
    () => grievancesQuery.data?.items ?? [],
    [grievancesQuery.data?.items]
  )

  const openCount = useMemo(
    () => grievanceItems.filter((item) => item.status === 'open').length,
    [grievanceItems]
  )
  const escalatedCount = useMemo(
    () => grievanceItems.filter((item) => item.status === 'escalated').length,
    [grievanceItems]
  )
  const resolvedCount = useMemo(
    () => grievanceItems.filter((item) => item.status === 'resolved').length,
    [grievanceItems]
  )

  const createGrievanceMutation = useMutation({
    meta: {
      disableSuccessToast: true,
      disableErrorToast: true,
    },
    mutationFn: (payload) => createWorkerGrievance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-grievances'] })
      reset({
        platform: selectedPlatform,
        category: 'payment issue',
        description: '',
        tags: '',
      })
      showSuccessToast('Grievance submitted successfully.')
    },
    onError: (error) => {
      showErrorToast(parseApiError(error))
    },
  })

  const onCreateGrievance = handleSubmit((values) => {
    createGrievanceMutation.mutate({
      platform: values.platform,
      category: values.category,
      description: values.description.trim(),
      tags: parseTagsFromInput(values.tags),
    })
  })

  return (
    <div className="space-y-6">
      <WorkerPageHeader
        badge="Grievances"
        title="Issue Tracking and Follow-up"
        description="Submit disputes with cleaner forms and monitor progression through open, escalated, and resolved stages."
        summary={`${openCount} open · ${escalatedCount} escalated · ${resolvedCount} resolved`}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <GrievanceFormCard
          registerGrievance={register}
          grievanceErrors={errors}
          onCreateGrievance={onCreateGrievance}
          platformOptions={WORKER_PLATFORM_OPTIONS}
          createGrievancePending={createGrievanceMutation.isPending}
        />

        <GrievanceListCard
          grievancesQuery={grievancesQuery}
          grievanceItems={grievanceItems}
          parseApiError={parseApiError}
          badgeClassByStatus={grievanceBadgeClassByStatus}
        />
      </section>
    </div>
  )
}

export default WorkerGrievancesPage
