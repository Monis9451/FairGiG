import { create } from 'zustand'

const DEFAULT_DURATION_MS = 4_500

const useToastStore = create((set, get) => ({
  toasts: [],

  pushToast: (type, message, options = {}) => {
    const normalizedMessage = String(message || '').trim()
    if (!normalizedMessage) {
      return null
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const durationMs =
      Number.isFinite(options?.durationMs) && Number(options.durationMs) >= 0
        ? Number(options.durationMs)
        : DEFAULT_DURATION_MS

    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          type: type === 'success' ? 'success' : type === 'error' ? 'error' : 'info',
          message: normalizedMessage,
        },
      ],
    }))

    if (durationMs > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => {
        get().dismissToast(id)
      }, durationMs)
    }

    return id
  },

  dismissToast: (toastId) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    }))
  },

  clearToasts: () => {
    set({ toasts: [] })
  },
}))

export default useToastStore
