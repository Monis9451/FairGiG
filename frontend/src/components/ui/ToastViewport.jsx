import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

import useToastStore from '@/store/toastStore'

const toneByType = {
  success: {
    icon: CheckCircle2,
    container: 'border-emerald-500/45 bg-emerald-50 text-emerald-900',
    iconWrap: 'bg-emerald-500/15 text-emerald-700',
  },
  error: {
    icon: AlertTriangle,
    container: 'border-rose-500/45 bg-rose-50 text-rose-900',
    iconWrap: 'bg-rose-500/15 text-rose-700',
  },
  info: {
    icon: Info,
    container: 'border-brand-primary/35 bg-brand-light text-brand-darkest',
    iconWrap: 'bg-brand-primary/15 text-brand-primary',
  },
}

const ToastViewport = () => {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)

  if (!Array.isArray(toasts) || toasts.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(92vw,380px)] flex-col gap-2 sm:right-6 sm:top-6">
      {toasts.map((toast) => {
        const tone = toneByType[toast.type] || toneByType.info
        const Icon = tone.icon

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-3.5 py-3 shadow-[0_10px_24px_rgba(33,42,49,0.2)] ${tone.container}`}
            role="status"
            aria-live="polite"
          >
            <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone.iconWrap}`}>
              <Icon size={14} aria-hidden="true" />
            </span>

            <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/20 text-current/75 transition hover:text-current"
              aria-label="Dismiss notification"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastViewport
