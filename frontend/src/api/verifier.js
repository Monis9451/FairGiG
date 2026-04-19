import apiClient from '@/api/client'

const unwrapResponseData = (response) => {
  const payload = response?.data

  if (payload?.success === false) {
    throw new Error(payload.error || 'Request failed')
  }

  return payload?.data ?? payload
}

export const listVerifierShiftLogs = async ({
  workerId,
  status = 'pending',
  platform,
  from,
  to,
  limit = 50,
  offset = 0,
} = {}) => {
  const response = await apiClient.get('/api/v1/earnings/shift-logs', {
    params: {
      worker_id: workerId,
      status,
      platform,
      from,
      to,
      limit,
      offset,
    },
  })

  return unwrapResponseData(response)
}

export const updateVerifierShiftLogVerification = async ({
  shiftLogId,
  status,
  anomalyExplanation,
}) => {
  const payload = {
    status,
    anomaly_explanation: anomalyExplanation,
  }

  const response = await apiClient.patch(
    `/api/v1/earnings/shift-logs/${shiftLogId}/verification`,
    payload
  )

  return unwrapResponseData(response)
}

export const getVerifierVulnerabilityFlags = async ({ threshold = 20 } = {}) => {
  const response = await apiClient.get('/api/analytics/vulnerability-flags', {
    params: {
      threshold,
    },
  })

  return unwrapResponseData(response)
}

export const listVerifierGrievances = async ({
  workerId,
  status,
  platform,
  category,
  search,
  tag,
  limit = 30,
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

export const updateVerifierGrievance = async ({ grievanceId, status }) => {
  const response = await apiClient.patch(`/api/grievances/${grievanceId}`, {
    status,
  })

  return unwrapResponseData(response)
}

export const getVerifierPing = async () => {
  const response = await apiClient.get('/api/v1/verifier/ping')
  return unwrapResponseData(response)
}
