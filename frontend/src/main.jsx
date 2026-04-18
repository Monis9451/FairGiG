import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

import { getApiErrorMessage } from '@/lib/apiError'
import useToastStore from '@/store/toastStore'

import './index.css'
import App from './App.jsx'

const recentErrorTimestamps = new Map()

const shouldShowErrorToast = (key) => {
  const now = Date.now()
  const previous = recentErrorTimestamps.get(key)
  if (previous && now - previous < 4_000) {
    return false
  }

  recentErrorTimestamps.set(key, now)
  return true
}

const pushErrorToast = (error, keyPrefix = 'api') => {
  const message = getApiErrorMessage(error)
  const signature = `${keyPrefix}:${message}`

  if (!shouldShowErrorToast(signature)) {
    return
  }

  useToastStore.getState().pushToast('error', message)
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query?.meta?.disableErrorToast) {
        return
      }

      pushErrorToast(error, `query:${query?.queryHash || 'unknown'}`)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation?.meta?.disableErrorToast) {
        return
      }

      pushErrorToast(error, `mutation:${mutation?.mutationId || 'unknown'}`)
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation?.meta?.disableSuccessToast) {
        return
      }

      const successMessage =
        typeof mutation?.meta?.successMessage === 'string' && mutation.meta.successMessage.trim()
          ? mutation.meta.successMessage.trim()
          : 'Action completed successfully.'

      useToastStore.getState().pushToast('success', successMessage)
    },
  }),
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
