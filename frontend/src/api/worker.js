import apiClient from '@/api/client'

const unwrapResponseData = (response) => {
  const payload = response?.data

  if (payload?.success === false) {
    throw new Error(payload.error || 'Request failed')
  }

  return payload?.data ?? payload
}

export const listWorkerShiftLogs = async ({ limit = 100, offset = 0, status, platform } = {}) => {
  const response = await apiClient.get('/api/v1/earnings/shift-logs', {
    params: {
      limit,
      offset,
      status,
      platform,
    },
  })

  return unwrapResponseData(response)
}

export const createWorkerShiftLog = async (payload) => {
  const response = await apiClient.post('/api/v1/earnings/shift-logs', payload)
  return unwrapResponseData(response)
}

export const uploadWorkerShiftScreenshot = async (file) => {
  const formData = new FormData()
  formData.append('screenshot', file)

  const response = await apiClient.post('/api/uploads/shift-screenshot', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return unwrapResponseData(response)
}

export const importWorkerShiftLogsCsv = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/api/v1/earnings/shift-logs/import-csv', formData)
  return unwrapResponseData(response)
}

export const analyzeWorkerShift = async (payload) => {
  const response = await apiClient.post('/api/v1/anomaly/analyze', payload)
  return unwrapResponseData(response)
}

export const getPlatformCityBenchmark = async ({ platform, cityZone }) => {
  const response = await apiClient.get('/api/analytics/benchmarks/platform-city', {
    params: {
      platform,
      city_zone: cityZone,
    },
  })

  return unwrapResponseData(response)
}

export const listWorkerGrievances = async ({
  limit = 50,
  offset = 0,
  status,
  platform,
  category,
  search,
} = {}) => {
  const response = await apiClient.get('/api/grievances', {
    params: {
      limit,
      offset,
      status,
      platform,
      category,
      search,
    },
  })

  return unwrapResponseData(response)
}

export const createWorkerGrievance = async (payload) => {
  const response = await apiClient.post('/api/grievances', payload)
  return unwrapResponseData(response)
}

export const getWorkerCertificate = async ({ workerId, from, to }) => {
  const response = await apiClient.get(`/api/certificates/workers/${workerId}/verified-logs`, {
    params: {
      from,
      to,
    },
  })

  return unwrapResponseData(response)
}

/** Weekly or monthly aggregates; excludes unverifiable logs from sums. */
export const getWorkerEarningsTrends = async ({
  granularity = 'month',
  lookbackMonths = 18,
  platform,
} = {}) => {
  const response = await apiClient.get('/api/analytics/worker/earnings-trends', {
    params: {
      granularity,
      lookback_months: lookbackMonths,
      platform: platform || undefined,
    },
  })

  return unwrapResponseData(response)
}
