import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import WorkerNoticeBanner from '@/components/worker/WorkerNoticeBanner'
import WorkerPageHeader from '@/components/worker/WorkerPageHeader'
import GrievanceFormCard from '@/components/worker/grievances/GrievanceFormCard'
import GrievanceListCard from '@/components/worker/grievances/GrievanceListCard'
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

  const [notice, setNotice] = useState(null)

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

  const createGrievanceMutation = useMutation({
    mutationFn: (payload) => createWorkerGrievance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-grievances'] })
      reset({
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

  const onCreateGrievance = handleSubmit((values) => {
    setNotice(null)
    createGrievanceMutation.mutate({
      platform: values.platform,
      category: values.category,
      description: values.description.trim(),
      tags: parseTagsFromInput(values.tags),
    })
  })

  return (
    <div className="space-y-5">
      <WorkerPageHeader
        badge="Grievances"
        title="Issue Tracking and Follow-up"
        description="Submit disputes with clean metadata and track status progression without clutter from unrelated widgets."
      />

      <WorkerNoticeBanner notice={notice} />

      <section className="grid gap-5 xl:grid-cols-2">
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
