import { cn } from '@/lib/utils'

const STYLES = {
  pending: 'border-amber-400/80 bg-amber-100 text-amber-950 shadow-sm shadow-amber-900/10',
  visible: 'border-emerald-400/80 bg-emerald-100 text-emerald-950 shadow-sm shadow-emerald-900/10',
  hidden: 'border-slate-400/70 bg-slate-200 text-slate-800',
  removed: 'border-red-400/80 bg-red-100 text-red-950 shadow-sm shadow-red-900/10',
}

export function PostStatusBadge({ status, className }) {
  const key = String(status || '').toLowerCase()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
        STYLES[key] || 'border-brand-muted bg-brand-light text-brand-dark',
        className
      )}
    >
      {status}
    </span>
  )
}
