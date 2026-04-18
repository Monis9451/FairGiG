import apiClient from '@/api/client'

const unwrapResponseData = (response) => {
  const payload = response?.data

  if (payload?.success === false) {
    throw new Error(payload.error || 'Request failed')
  }

  return payload?.data ?? payload
}

export const getCommissionTrends = async ({ months = 12 } = {}) => {
  const response = await apiClient.get('/api/analytics/commission-trends', {
    params: { months },
  })
  return unwrapResponseData(response)
}

export const getIncomeVolatilityByZone = async ({
  lookbackMonths = 24,
  platform,
  minSamples = 5,
} = {}) => {
  const response = await apiClient.get('/api/analytics/income-volatility-by-zone', {
    params: {
      lookback_months: lookbackMonths,
      platform: platform || undefined,
      min_samples: minSamples,
    },
  })
  return unwrapResponseData(response)
}

export const getGrievanceClusters = async ({ focus = 'deactivation', limit = 500 } = {}) => {
  const response = await apiClient.get('/api/analytics/grievance-clusters', {
    params: { focus, limit },
  })
  return unwrapResponseData(response)
}

export const getGrievanceCategoryWindow = async ({ days = 7 } = {}) => {
  const response = await apiClient.get('/api/analytics/grievance-category-window', {
    params: { days },
  })
  return unwrapResponseData(response)
}

export const getIncomeDistributionByZone = async ({
  lookbackMonths = 24,
  platform,
  minSamples = 8,
  bins = 10,
} = {}) => {
  const response = await apiClient.get('/api/analytics/income-distribution-by-zone', {
    params: {
      lookback_months: lookbackMonths,
      platform: platform || undefined,
      min_samples: minSamples,
      bins,
    },
  })
  return unwrapResponseData(response)
}
