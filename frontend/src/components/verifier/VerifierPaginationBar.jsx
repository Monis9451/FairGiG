import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DEFAULT_SIZES = [10, 25, 50]

/**
 * @param {object} props
 * @param {number} [props.offset]
 * @param {number} [props.limit]
 * @param {number | null | undefined} props.total — null/undefined when unknown (e.g. client-filtered grievances)
 * @param {number} props.itemCount — rows on this page
 * @param {boolean} props.isLoading
 * @param {() => void} props.onPrev
 * @param {() => void} props.onNext
 * @param {(n: number) => void} props.onPageSizeChange
 * @param {number[]} [props.pageSizeOptions]
 */
const VerifierPaginationBar = ({
  offset = 0,
  limit = 25,
  total,
  itemCount,
  isLoading,
  onPrev,
  onNext,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_SIZES,
  className,
}) => {
  const hasTotal = typeof total === 'number' && total >= 0
  const start = itemCount === 0 ? 0 : offset + 1
  const end = offset + itemCount
  const totalPages = hasTotal ? Math.max(1, Math.ceil(total / limit)) : null
  const currentPage = limit > 0 ? Math.floor(offset / limit) + 1 : 1
  const canPrev = offset > 0 && !isLoading
  const canNext = hasTotal ? offset + itemCount < total : itemCount === limit && itemCount > 0 && !isLoading

  if (itemCount === 0 && offset === 0) {
    return null
  }

  const btnClass =
    'h-9 rounded-lg border border-brand-darkest/15 bg-white px-3 text-xs font-semibold text-brand-darkest disabled:opacity-40'

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-brand-darkest/10 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        className
      )}
    >
      <p className="text-xs text-brand-muted">
        {hasTotal ? (
          <>
            Showing{' '}
            <span className="font-medium tabular-nums text-brand-darkest">
              {start}–{end}
            </span>{' '}
            of{' '}
            <span className="font-medium tabular-nums text-brand-darkest">{total}</span>
            {totalPages ? (
              <>
                {' '}
                · page {currentPage} / {totalPages}
              </>
            ) : null}
          </>
        ) : (
          <>
            Rows{' '}
            <span className="font-medium tabular-nums text-brand-darkest">
              {start}–{end}
            </span>
            {itemCount === limit ? ' · Next page may have more' : ''}
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-brand-muted">
          Per page
          <select
            className="h-9 rounded-lg border border-brand-darkest/15 bg-white px-2 text-sm text-brand-darkest shadow-sm"
            value={limit}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={isLoading}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button type="button" className={btnClass} disabled={!canPrev} onClick={onPrev}>
            Previous
          </Button>
          <Button type="button" className={btnClass} disabled={!canNext} onClick={onNext}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default VerifierPaginationBar
