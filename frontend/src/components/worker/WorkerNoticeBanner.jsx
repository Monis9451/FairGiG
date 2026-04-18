import { AlertTriangle, CheckCircle2 } from 'lucide-react'

const WorkerNoticeBanner = ({ notice }) => {
  if (!notice) {
    return null
  }

  const isError = notice.type === 'error'
  const Icon = isError ? AlertTriangle : CheckCircle2

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium shadow-[0_8px_18px_rgba(33,42,49,0.12)] ${
        isError
          ? 'border-brand-dark/70 bg-gradient-to-r from-brand-dark to-brand-darkest text-brand-light'
          : 'border-brand-primary/35 bg-gradient-to-r from-brand-primary/15 to-brand-light text-brand-darkest'
      }`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          isError ? 'bg-white/15 text-brand-light' : 'bg-brand-primary/20 text-brand-primary'
        }`}
      >
        <Icon size={14} aria-hidden="true" />
      </span>
      <span className="leading-relaxed">{notice.message}</span>
    </div>
  )
}

export default WorkerNoticeBanner
