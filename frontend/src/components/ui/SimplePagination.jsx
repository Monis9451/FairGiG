import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Prev / next with page indicator. Hides when totalPages <= 1.
 */
const SimplePagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPrev,
  onNext,
  className,
  itemLabel = 'items',
}) => {
  if (totalPages <= 1) {
    return null
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-brand-muted/25 bg-brand-light/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <p className="text-center text-xs text-brand-muted sm:text-left">
        Showing <span className="font-semibold tabular-nums text-brand-darkest">{start}</span>–
        <span className="font-semibold tabular-nums text-brand-darkest">{end}</span> of{' '}
        <span className="font-semibold tabular-nums text-brand-darkest">{totalItems}</span> {itemLabel}
      </p>
      <div className="flex items-center justify-center gap-2 sm:justify-end">
        <Button
          type="button"
          className="inline-flex h-11 min-w-[7rem] items-center justify-center gap-1 rounded-lg border-2 border-brand-muted/40 bg-white px-3 text-sm font-semibold text-brand-darkest touch-manipulation disabled:opacity-45"
          onClick={onPrev}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          Previous
        </Button>
        <span className="min-w-[5.5rem] text-center text-xs font-semibold tabular-nums text-brand-darkest">
          Page {page} / {totalPages}
        </span>
        <Button
          type="button"
          className="inline-flex h-11 min-w-[7rem] items-center justify-center gap-1 rounded-lg border-2 border-brand-muted/40 bg-white px-3 text-sm font-semibold text-brand-darkest touch-manipulation disabled:opacity-45"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

export default SimplePagination
