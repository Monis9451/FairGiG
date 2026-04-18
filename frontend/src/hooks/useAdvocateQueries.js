import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getAdvocateGrievanceById,
  getAdvocateModerationQueueTotals,
  listAdvocateGrievances,
  updateAdvocateGrievance,
} from '@/api/advocate'

export const advocateQueryKeys = {
  grievances: (filters) => ['advocate-grievances', filters],
  grievanceDetail: (grievanceId) => ['advocate-grievance-detail', grievanceId],
  moderationTotals: ['advocate-community-moderation-totals'],
}

export const useAdvocateGrievancesQuery = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: advocateQueryKeys.grievances(filters),
    queryFn: () =>
      listAdvocateGrievances({
        workerId: filters.workerId || undefined,
        status: filters.status || undefined,
        platform: filters.platform || undefined,
        category: filters.category || undefined,
        search: filters.search || undefined,
        tag: filters.tag || undefined,
        limit: filters.limit ?? 40,
        offset: filters.offset ?? 0,
      }),
    staleTime: 20_000,
    ...options,
  })
}

export const useAdvocateGrievanceQuery = (grievanceId, options = {}) => {
  return useQuery({
    queryKey: advocateQueryKeys.grievanceDetail(grievanceId),
    queryFn: () => getAdvocateGrievanceById(grievanceId),
    enabled: Boolean(grievanceId),
    staleTime: 15_000,
    ...options,
  })
}

export const useUpdateAdvocateGrievanceMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => updateAdvocateGrievance(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['advocate-grievances'] })
      queryClient.invalidateQueries({ queryKey: advocateQueryKeys.moderationTotals })
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: advocateQueryKeys.grievanceDetail(variables.id),
        })
      }
    },
  })
}

export const useAdvocateModerationTotalsQuery = (options = {}) => {
  return useQuery({
    queryKey: advocateQueryKeys.moderationTotals,
    queryFn: getAdvocateModerationQueueTotals,
    staleTime: 20_000,
    ...options,
  })
}
