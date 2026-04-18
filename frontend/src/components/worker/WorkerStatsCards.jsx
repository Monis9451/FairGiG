import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileStack,
  ShieldAlert,
  Wallet,
} from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/utils/formatters'

const WorkerStatsCards = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <article
            key={`worker-stats-skeleton-${index}`}
            className="rounded-2xl border border-brand-muted/40 bg-brand-light/90 p-4"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
          </article>
        ))}
      </section>
    )
  }

  const tiles = [
    {
      key: 'total',
      label: 'Total Logs',
      value: stats.total,
      icon: FileStack,
      tone: 'from-brand-darkest/15 to-brand-dark/5',
    },
    {
      key: 'verified',
      label: 'Verified',
      value: stats.verified,
      icon: CheckCircle2,
      tone: 'from-brand-primary/25 to-brand-primary/8',
    },
    {
      key: 'pending',
      label: 'Pending',
      value: stats.pending,
      icon: Clock3,
      tone: 'from-brand-muted/30 to-brand-muted/10',
    },
    {
      key: 'flagged',
      label: 'Flagged',
      value: stats.flagged,
      icon: AlertTriangle,
      tone: 'from-brand-dark/30 to-brand-dark/8',
    },
    {
      key: 'unverifiable',
      label: 'Unverifiable',
      value: stats.unverifiable,
      icon: ShieldAlert,
      tone: 'from-amber-300/35 to-amber-100/30',
    },
    {
      key: 'averageHourly',
      label: 'Avg Hourly',
      value: formatCurrency(stats.averageHourly),
      icon: Wallet,
      tone: 'from-brand-primary/22 to-brand-light/70',
    },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {tiles.map((tile) => (
        <article
          key={tile.key}
          className={`group relative overflow-hidden rounded-2xl border border-brand-muted/35 bg-gradient-to-br ${tile.tone} p-4 shadow-[0_10px_24px_rgba(33,42,49,0.13)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(33,42,49,0.18)]`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs uppercase tracking-wide text-brand-muted">{tile.label}</p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-muted/30 bg-brand-light/70 text-brand-darkest">
              <tile.icon size={15} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-brand-darkest">{tile.value}</p>
        </article>
      ))}
    </section>
  )
}

export default WorkerStatsCards
