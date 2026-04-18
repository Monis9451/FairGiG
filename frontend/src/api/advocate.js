import apiClient from '@/api/client'
import { getPlatformCityBenchmark, getWorkerCertificate } from '@/api/worker'

const unwrapResponseData = (response) => {
  const payload = response?.data

  if (payload?.success === false) {
    throw new Error(payload.error || 'Request failed')
  }

  return payload?.data ?? payload
}

const extractApiError = (error) => {
  const detail = error?.response?.data?.detail

  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (detail && typeof detail === 'object' && detail.message) {
    return detail.message
  }

  if (error?.response?.data?.error) {
    return error.response.data.error
  }

  return error?.message || 'Request failed'
}

export const listAdvocateGrievances = async ({
  workerId,
  status,
  platform,
  category,
  search,
  tag,
  limit = 40,
  offset = 0,
} = {}) => {
  const response = await apiClient.get('/api/grievances', {
    params: {
      worker_id: workerId,
      status,
      platform,
      category,
      search,
      tag,
      limit,
      offset,
    },
  })

  return unwrapResponseData(response)
}

export const getAdvocateGrievanceById = async (id) => {
  const response = await apiClient.get(`/api/grievances/${id}`)
  return unwrapResponseData(response)
}

export const updateAdvocateGrievance = async ({
  id,
  status,
  platform,
  category,
  description,
  tags,
}) => {
  const response = await apiClient.patch(`/api/grievances/${id}`, {
    status,
    platform,
    category,
    description,
    tags,
  })

  return unwrapResponseData(response)
}

export const getAdvocateBenchmarkComparison = async ({ platform, cityZones = [] }) => {
  const uniqueCityZones = [...new Set(cityZones.map((city) => String(city ?? '').trim()).filter(Boolean))]

  if (!platform || uniqueCityZones.length === 0) {
    return []
  }

  const settled = await Promise.allSettled(
    uniqueCityZones.map((cityZone) => getPlatformCityBenchmark({ platform, cityZone }))
  )

  return settled.map((result, index) => {
    const cityZone = uniqueCityZones[index]

    if (result.status === 'fulfilled') {
      return {
        success: true,
        error: null,
        ...result.value,
        city_zone: result.value?.city_zone || cityZone,
      }
    }

    return {
      success: false,
      platform,
      city_zone: cityZone,
      error: extractApiError(result.reason),
    }
  })
}

export const getAdvocateCertificateByWorker = async ({ workerId, from, to }) => {
  return getWorkerCertificate({ workerId, from, to })
}

export const getAdvocateModerationQueueTotals = async () => {
  const statuses = ['pending', 'visible', 'hidden', 'removed']

  const responses = await Promise.all(
    statuses.map((status) =>
      apiClient.get('/api/community/moderation', {
        params: {
          status,
          limit: 1,
          offset: 0,
        },
      })
    )
  )

  const totals = statuses.reduce((accumulator, status, index) => {
    const payload = unwrapResponseData(responses[index])
    const total = Number(payload?.pagination?.total ?? 0)
    accumulator[status] = Number.isFinite(total) ? total : 0
    return accumulator
  }, {})

  return {
    ...totals,
    total:
      (totals.pending || 0) +
      (totals.visible || 0) +
      (totals.hidden || 0) +
      (totals.removed || 0),
  }
}
