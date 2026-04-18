import { useQuery } from '@tanstack/react-query'
import {
  getVerifierPing,
  getVerifierVulnerabilityFlags,
  listVerifierGrievances,
  listVerifierShiftLogs,
} from '@/api/verifier'

export const verifierQueryKeys = {
  ping: ['verifier-ping'],
  shiftLogs: (filters) => ['verifier-shift-logs', filters],
  vulnerabilityFlags: (threshold) => ['verifier-vulnerability-flags', threshold],
  grievances: (filters) => ['verifier-grievances', filters],
}

export const useVerifierPingQuery = (options = {}) => {
  return useQuery({
    queryKey: verifierQueryKeys.ping,
    queryFn: getVerifierPing,
    staleTime: 60_000,
    ...options,
  })
}

export const useVerifierShiftLogsQuery = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: verifierQueryKeys.shiftLogs(filters),
    queryFn: () =>
      listVerifierShiftLogs({
        workerId: filters.workerId || undefined,
        status: filters.status || undefined,
        platform: filters.platform || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        limit: filters.limit ?? 60,
        offset: filters.offset ?? 0,
      }),
    staleTime: 20_000,
    ...options,
  })
}

export const useVerifierVulnerabilityFlagsQuery = (threshold = 20, options = {}) => {
  return useQuery({
    queryKey: verifierQueryKeys.vulnerabilityFlags(threshold),
    queryFn: () => getVerifierVulnerabilityFlags({ threshold }),
    staleTime: 20_000,
    ...options,
  })
}

export const useVerifierGrievancesQuery = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: verifierQueryKeys.grievances(filters),
    queryFn: () =>
      listVerifierGrievances({
        workerId: filters.workerId || undefined,
        status: filters.status || undefined,
        platform: filters.platform || undefined,
        category: filters.category || undefined,
        search: filters.search || undefined,
        tag: filters.tag || undefined,
        limit: filters.limit ?? 30,
        offset: filters.offset ?? 0,
      }),
    staleTime: 20_000,
    ...options,
  })
}
