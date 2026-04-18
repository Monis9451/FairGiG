import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/utils/formatters'

const WorkerStatsCards = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <article
            key={`worker-stats-skeleton-${index}`}
            className="rounded-xl border border-brand-muted/50 bg-brand-light p-4"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
          </article>
        ))}
      </section>
    )
  }

  const tiles = [
    { key: 'total', label: 'Total Logs', value: stats.total },
    { key: 'verified', label: 'Verified', value: stats.verified },
    { key: 'pending', label: 'Pending', value: stats.pending },
    { key: 'flagged', label: 'Flagged', value: stats.flagged },
    { key: 'unverifiable', label: 'Unverifiable', value: stats.unverifiable },
    { key: 'averageHourly', label: 'Avg Hourly', value: formatCurrency(stats.averageHourly) },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {tiles.map((tile) => (
        <article
          key={tile.key}
          className="rounded-xl border border-brand-muted/50 bg-brand-light p-4 shadow-sm"
        >
          <p className="text-xs uppercase tracking-wide text-brand-muted">{tile.label}</p>
          <p className="mt-2 text-2xl font-bold text-brand-darkest">{tile.value}</p>
        </article>
      ))}
    </section>
  )
}

export default WorkerStatsCards
