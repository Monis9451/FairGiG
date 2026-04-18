import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Filter } from 'lucide-react'
import { useCommunityFeed } from '@/hooks/useCommunity'
import { CommunityPostCard } from '@/components/community/CommunityPostCard'
import { CommunityPostEngagement } from '@/components/community/CommunityPostEngagement'
import { CommunityComposerInline } from '@/components/community/CommunityComposerInline'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { fieldContainerVariant, fieldVariant } from '@/components/auth/AuthSplitCard'

export function CommunityFeedPanel({ role }) {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [platform, setPlatform] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const apply = () => setFiltersOpen(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const feed = useCommunityFeed({
    search: debouncedSearch,
    category: category.trim(),
    platform: platform.trim(),
  })

  const items = feed.data?.pages.flatMap((p) => p.items) ?? []
  const total = feed.data?.pages[0]?.pagination?.total
  return (
    <div className="space-y-3 sm:space-y-4">
      {role === 'worker' ? <CommunityComposerInline /> : null}

      <motion.div
        variants={fieldContainerVariant}
        initial="hidden"
        animate="visible"
        className="overflow-hidden rounded-2xl border border-brand-muted/80 bg-white/95 shadow-md shadow-brand-darkest/[0.06] backdrop-blur-sm sm:rounded-3xl sm:p-1"
      >
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex w-full touch-manipulation items-center justify-between gap-3 px-4 py-3.5 text-left md:hidden"
          aria-expanded={filtersOpen}
        >
          <span className="flex items-center gap-2 text-sm font-bold text-brand-darkest">
            <Filter className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
            Search &amp; filters
          </span>
          <ChevronDown
            className={cn('h-5 w-5 shrink-0 text-brand-muted transition-transform', filtersOpen && 'rotate-180')}
            aria-hidden
          />
        </button>

        <div
          className={cn(
            'border-t border-brand-light px-4 pb-4 pt-2 md:block md:border-0 md:p-5',
            !filtersOpen && 'hidden md:block'
          )}
        >
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
            <motion.div variants={fieldVariant} className="min-w-0 flex-1 md:min-w-[12rem]">
              <Label htmlFor="feed-search" className="text-brand-dark">
                Search
              </Label>
              <Input
                id="feed-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Title, body, category…"
                className="min-h-11 text-base sm:text-sm"
              />
            </motion.div>
            <motion.div variants={fieldVariant} className="min-w-0 flex-1 md:min-w-[9rem]">
              <Label htmlFor="feed-category" className="text-brand-dark">
                Category
              </Label>
              <Input
                id="feed-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Filter"
                className="min-h-11 text-base sm:text-sm"
              />
            </motion.div>
            <motion.div variants={fieldVariant} className="min-w-0 flex-1 md:min-w-[9rem]">
              <Label htmlFor="feed-platform" className="text-brand-dark">
                Platform
              </Label>
              <Input
                id="feed-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Filter"
                className="min-h-11 text-base sm:text-sm"
              />
            </motion.div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-brand-muted sm:text-xs">
            {typeof total === 'number'
              ? `${total} visible post${total === 1 ? '' : 's'}${debouncedSearch ? ' (matching search)' : ''}. `
              : null}
            {role !== 'worker'
              ? 'Posts are anonymous — author is hidden.'
              : 'Your posts stay anonymous in this feed.'}
          </p>
        </div>
      </motion.div>

      {feed.isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-brand-muted/60 bg-white/80 px-4 py-6 text-sm text-brand-muted">
          <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-brand-primary/40" aria-hidden />
          Loading feed…
        </div>
      ) : feed.isError ? (
        <p className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-900">
          {feed.error?.response?.data?.error || 'Could not load the community feed.'}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-muted bg-white/90 px-4 py-10 text-center text-sm leading-relaxed text-brand-muted sm:px-8">
          No visible posts yet. Check back after advocates approve submissions.
        </p>
      ) : (
        <motion.ul
          variants={fieldContainerVariant}
          initial="hidden"
          animate="visible"
          className="space-y-3 sm:space-y-4"
        >
          {items.map((post) => (
            <motion.li key={post.id} variants={fieldVariant}>
              <CommunityPostCard
                post={post}
                variant="feed"
                footer={<CommunityPostEngagement post={post} />}
              />
            </motion.li>
          ))}
        </motion.ul>
      )}

      {feed.hasNextPage ? (
        <div className="flex justify-center px-1 pt-1 sm:pt-2">
          <Button
            type="button"
            disabled={feed.isFetchingNextPage}
            onClick={() => feed.fetchNextPage()}
            className="min-h-[48px] w-full max-w-md touch-manipulation rounded-2xl border-2 border-brand-primary bg-white px-6 text-sm font-bold uppercase tracking-wider text-brand-primary shadow-sm transition-colors hover:bg-brand-primary/5 active:scale-[0.99] disabled:opacity-60 sm:w-auto sm:rounded-full"
          >
            {feed.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
