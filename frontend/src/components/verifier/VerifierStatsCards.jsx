import { Skeleton } from '@/components/ui/skeleton'

const VerifierStatsCards = ({ tiles, isLoading }) => {
  const skeletonCount = Math.max(tiles.length, 4)

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, index) => (
            <article
              key={`verifier-stats-skeleton-${index}`}
              className="rounded-xl border border-brand-muted/45 bg-brand-light/80 p-4 backdrop-blur-sm"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
            </article>
          ))
        : tiles.map((tile) => {
            const Icon = tile.icon

            return (
              <article
                key={tile.label}
                className={`rounded-xl border border-brand-muted/45 bg-gradient-to-br ${tile.tone} p-4 shadow-[0_8px_24px_rgba(46,57,68,0.12)]`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-brand-muted">{tile.label}</p>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-muted/35 bg-brand-light/60 text-brand-darkest">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold leading-none text-brand-darkest">{tile.value}</p>
              </article>
            )
          })}
    </section>
  )
}

export default VerifierStatsCards
