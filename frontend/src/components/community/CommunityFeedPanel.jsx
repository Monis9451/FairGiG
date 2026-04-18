import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useCommunityFeed } from '@/hooks/useCommunity'
import { CommunityPostCard } from '@/components/community/CommunityPostCard'
import { CommunityPostEngagement } from '@/components/community/CommunityPostEngagement'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { fieldContainerVariant, fieldVariant } from '@/components/auth/AuthSplitCard'

export function CommunityFeedPanel({ role, onOpenComposer }) {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [platform, setPlatform] = useState('')

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
  const showWorkerCta = role === 'worker' && typeof onOpenComposer === 'function'

  return (
    <div className="space-y-4">
      <motion.div
        variants={fieldContainerVariant}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-brand-muted bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <motion.div variants={fieldVariant} className="min-w-[140px] flex-1">
            <Label htmlFor="feed-search">Search</Label>
            <Input
              id="feed-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Title, body, category…"
            />
          </motion.div>
          <motion.div variants={fieldVariant} className="min-w-[120px] flex-1">
            <Label htmlFor="feed-category">Category</Label>
            <Input
              id="feed-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Filter"
            />
          </motion.div>
          <motion.div variants={fieldVariant} className="min-w-[120px] flex-1">
            <Label htmlFor="feed-platform">Platform</Label>
            <Input
              id="feed-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="Filter"
            />
          </motion.div>
          {showWorkerCta ? (
            <motion.div variants={fieldVariant} className="sm:ml-auto">
              <Label className="invisible hidden sm:block">.</Label>
              <Button
                type="button"
                onClick={onOpenComposer}
                className="h-10 w-full rounded-full border-2 border-brand-primary bg-brand-primary px-6 text-xs font-bold uppercase tracking-wider text-brand-light hover:opacity-90 sm:w-auto"
              >
                New post
              </Button>
            </motion.div>
          ) : null}
        </div>
        <p className="text-xs text-brand-muted">
          {typeof total === 'number'
            ? `${total} visible post${total === 1 ? '' : 's'}${debouncedSearch ? ' (matching search)' : ''}.`
            : null}
          {role !== 'worker' ? ' Posts are anonymous — author is hidden.' : ' Your posts stay anonymous in this feed.'}
        </p>
      </motion.div>

      {feed.isLoading ? (
        <p className="text-sm text-brand-muted">Loading feed…</p>
      ) : feed.isError ? (
        <p className="text-sm text-brand-muted">
          {feed.error?.response?.data?.error || 'Could not load the community feed.'}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-muted bg-white/80 p-8 text-center text-sm text-brand-muted">
          No visible posts yet. Check back after advocates approve submissions.
        </p>
      ) : (
        <motion.ul
          variants={fieldContainerVariant}
          initial="hidden"
          animate="visible"
          className="space-y-4"
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
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            disabled={feed.isFetchingNextPage}
            onClick={() => feed.fetchNextPage()}
            className="rounded-full border-2 border-brand-primary bg-transparent px-8 py-2 text-sm font-bold uppercase tracking-wider text-brand-primary hover:bg-brand-primary/10 disabled:opacity-60"
          >
            {feed.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
