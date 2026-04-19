import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const VerifierStatsCards = ({ tiles, isLoading }) => {
  const skeletonCount = Math.max(tiles.length, 4)

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <div
              key={`verifier-stats-skeleton-${index}`}
              className="rounded-lg border border-brand-darkest/10 bg-white p-4"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-8 w-14" />
            </div>
          ))
        : tiles.map((tile) => {
            const Icon = tile.icon

            return (
              <article
                key={tile.label}
                className={cn(
                  'rounded-xl border bg-white/95 px-3 py-3.5 shadow-[0_1px_0_rgba(46,57,68,0.05)] sm:px-4',
                  tile.emphasis ? 'border-brand-primary border-l-[3px] border-l-brand-primary' : 'border-brand-darkest/10'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">{tile.label}</p>
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-brand-darkest/8 text-brand-darkest">
                    <Icon size={14} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-2 text-xl font-semibold tabular-nums leading-none text-brand-darkest">{tile.value}</p>
                {tile.hint ? <p className="mt-1.5 text-[10px] leading-snug text-brand-muted">{tile.hint}</p> : null}
              </article>
            )
          })}
    </section>
  )
}

export default VerifierStatsCards
