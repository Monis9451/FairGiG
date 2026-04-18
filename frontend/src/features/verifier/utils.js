import { getApiErrorMessage } from '@/lib/apiError'

export const badgeClassByStatus = (status) => {
  if (status === 'verified' || status === 'resolved') {
    return 'border-brand-primary/40 bg-brand-primary/20 text-brand-darkest'
  }

  if (status === 'pending' || status === 'open') {
    return 'border-brand-muted/50 bg-brand-muted/25 text-brand-darkest'
  }

  if (status === 'flagged' || status === 'escalated') {
    return 'border-brand-dark bg-brand-dark text-brand-light'
  }

  if (status === 'unverifiable') {
    return 'border-amber-500/60 bg-amber-100 text-amber-950'
  }

  return 'border-brand-muted/50 bg-brand-light text-brand-darkest'
}

export const parseApiError = (error) => {
  return getApiErrorMessage(error)
}
