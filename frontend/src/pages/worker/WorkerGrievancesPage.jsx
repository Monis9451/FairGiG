import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, FilePenLine, Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'

import GrievanceFormCard from '@/components/worker/grievances/GrievanceFormCard'
import GrievanceListCard from '@/components/worker/grievances/GrievanceListCard'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
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
  const [mobileSection, setMobileSection] = useState('report')

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
    queryFn: () => listWorkerGrievances({ limit: 100, offset: 0 }),
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
      showSuccessToast('Report submitted. You can follow it under My reports.')
      setMobileSection('history')
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
    <div className="mx-auto max-w-6xl space-y-4 pb-10">
      <header className="flex flex-col gap-3 border-b border-brand-muted/20 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/worker"
            className="inline-flex min-h-[40px] items-center gap-1 text-xs font-semibold text-brand-primary hover:underline touch-manipulation"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Back to rider home
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-brand-darkest sm:text-2xl">
            Report a problem
          </h1>
          <p className="mt-1 max-w-xl text-sm text-brand-muted">
            Payments, account access, safety, or platform disputes — submit details here and watch for updates.
          </p>
        </div>
        <p className="text-xs tabular-nums text-brand-muted sm:text-right">
          <span className="font-semibold text-brand-darkest">{openCount}</span> open ·{' '}
          <span className="font-semibold text-brand-darkest">{escalatedCount}</span> escalated ·{' '}
          <span className="font-semibold text-brand-darkest">{resolvedCount}</span> resolved
        </p>
      </header>

      <nav
        className="sticky top-0 z-20 flex gap-2 rounded-xl border border-brand-muted/25 bg-white/95 p-2 shadow-sm backdrop-blur-md lg:hidden"
        aria-label="Report sections"
      >
        <button
          type="button"
          className={cn(
            'flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors touch-manipulation',
            mobileSection === 'report'
              ? 'bg-brand-primary text-brand-light shadow-sm'
              : 'border border-brand-muted/30 bg-brand-light/50 text-brand-darkest'
          )}
          onClick={() => setMobileSection('report')}
        >
          <FilePenLine className="h-4 w-4 shrink-0" aria-hidden />
          New report
        </button>
        <button
          type="button"
          className={cn(
            'flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors touch-manipulation',
            mobileSection === 'history'
              ? 'bg-brand-primary text-brand-light shadow-sm'
              : 'border border-brand-muted/30 bg-brand-light/50 text-brand-darkest'
          )}
          onClick={() => setMobileSection('history')}
        >
          <Inbox className="h-4 w-4 shrink-0" aria-hidden />
          My reports
          {grievanceItems.length > 0 ? (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                mobileSection === 'history' ? 'bg-white/20 text-brand-light' : 'bg-brand-darkest/10 text-brand-darkest'
              )}
            >
              {grievanceItems.length}
            </span>
          ) : null}
        </button>
      </nav>

      <p className="hidden text-center text-xs text-brand-muted lg:block">
        <span className="font-medium text-brand-darkest">Tip:</span> New report on the left, your existing cases on the
        right — or use the tabs above on your phone.
      </p>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div id="report-form" className={cn(mobileSection !== 'report' && 'hidden lg:block')}>
          <GrievanceFormCard
            registerGrievance={register}
            grievanceErrors={errors}
            onCreateGrievance={onCreateGrievance}
            platformOptions={WORKER_PLATFORM_OPTIONS}
            createGrievancePending={createGrievanceMutation.isPending}
          />
        </div>

        <div id="my-reports" className={cn(mobileSection !== 'history' && 'hidden lg:block')}>
          <GrievanceListCard
            grievancesQuery={grievancesQuery}
            grievanceItems={grievanceItems}
            parseApiError={parseApiError}
            badgeClassByStatus={grievanceBadgeClassByStatus}
          />
        </div>
      </div>
    </div>
  )
}

export default WorkerGrievancesPage
