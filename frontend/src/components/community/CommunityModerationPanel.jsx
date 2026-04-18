import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useCommunityModeration, usePatchCommunityPost } from '@/hooks/useCommunity'
import { CommunityPostCard } from '@/components/community/CommunityPostCard'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { fieldContainerVariant, fieldVariant } from '@/components/auth/AuthSplitCard'

const MODERATION_STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'removed', label: 'Removed' },
]

const NEXT_STATUS = [
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'removed', label: 'Removed' },
]

function initialModerationSelectStatus(post) {
  if (post.status === 'visible' || post.status === 'hidden' || post.status === 'removed') {
    return post.status
  }
  return 'visible'
}

function selectClassName() {
  return 'h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest focus:outline-none focus:ring-2 focus:ring-brand-primary'
}

function ModerationRow({ post }) {
  const patch = usePatchCommunityPost()
  const [status, setStatus] = useState(() => initialModerationSelectStatus(post))
  const [note, setNote] = useState(post.moderator_note ?? '')
  const [tags, setTags] = useState(Array.isArray(post.tags) ? post.tags.join(', ') : '')

  useEffect(() => {
    setStatus(initialModerationSelectStatus(post))
    setNote(post.moderator_note ?? '')
    setTags(Array.isArray(post.tags) ? post.tags.join(', ') : '')
  }, [post.id, post.status, post.moderator_note, post.tags])

  const handleSave = () => {
    patch.mutate({
      id: post.id,
      body: {
        status,
        moderator_note: note.trim() || null,
        tags: tags.trim() || undefined,
      },
    })
  }

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-primary">
        Current status: {post.status}
      </p>
    <CommunityPostCard
      post={post}
      footer={
        <div className="space-y-3 text-sm">
          <p className="font-mono text-xs text-brand-muted">
            author_id: <span className="text-brand-dark">{post.author_id}</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor={`mod-status-${post.id}`}>Set status</Label>
              <select
                id={`mod-status-${post.id}`}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={selectClassName()}
              >
                {NEXT_STATUS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor={`mod-note-${post.id}`}>Moderator note</Label>
              <input
                id={`mod-note-${post.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={selectClassName()}
                placeholder="Optional note to worker"
              />
            </div>
          </div>
          <div>
            <Label htmlFor={`mod-tags-${post.id}`}>Tags</Label>
            <input
              id={`mod-tags-${post.id}`}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={selectClassName()}
              placeholder="Comma-separated"
            />
          </div>
          {patch.isError ? (
            <p className="text-xs text-brand-muted">
              {patch.error?.response?.data?.error || 'Update failed.'}
            </p>
          ) : null}
          <Button
            type="button"
            disabled={patch.isPending}
            onClick={handleSave}
            className="h-10 rounded-full border-2 border-brand-primary bg-brand-primary px-6 text-xs font-bold uppercase tracking-wider text-brand-light hover:opacity-90 disabled:opacity-60"
          >
            {patch.isPending ? 'Saving…' : 'Apply'}
          </Button>
        </div>
      }
    />
    </div>
  )
}

export function CommunityModerationPanel() {
  const [queueFilter, setQueueFilter] = useState('')
  const mod = useCommunityModeration({ status: queueFilter })

  const items = mod.data?.pages.flatMap((p) => p.items) ?? []
  const total = mod.data?.pages[0]?.pagination?.total

  return (
    <div className="space-y-4">
      <motion.div
        variants={fieldContainerVariant}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-brand-muted bg-white p-4 shadow-sm sm:p-5"
      >
        <motion.div variants={fieldVariant} className="max-w-xs">
          <Label htmlFor="mod-queue-filter">Queue filter</Label>
          <select
            id="mod-queue-filter"
            value={queueFilter}
            onChange={(e) => setQueueFilter(e.target.value)}
            className={selectClassName()}
          >
            {MODERATION_STATUSES.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </motion.div>
        <p className="mt-2 text-xs text-brand-muted">
          {typeof total === 'number' ? `${total} post(s) in this filter.` : null} Author IDs are shown for
          moderation only.
        </p>
      </motion.div>

      {mod.isLoading ? (
        <p className="text-sm text-brand-muted">Loading queue…</p>
      ) : mod.isError ? (
        <p className="text-sm text-brand-muted">
          {mod.error?.response?.data?.error || 'Could not load moderation queue.'}
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-brand-muted bg-white p-8 text-center text-sm text-brand-muted">
          No posts in this queue.
        </p>
      ) : (
        <motion.ul variants={fieldContainerVariant} initial="hidden" animate="visible" className="space-y-4">
          {items.map((post) => (
            <motion.li key={post.id} variants={fieldVariant}>
              <ModerationRow post={post} />
            </motion.li>
          ))}
        </motion.ul>
      )}

      {mod.hasNextPage ? (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            disabled={mod.isFetchingNextPage}
            onClick={() => mod.fetchNextPage()}
            className="rounded-full border-2 border-brand-primary bg-transparent px-8 py-2 text-sm font-bold uppercase tracking-wider text-brand-primary hover:bg-brand-primary/10 disabled:opacity-60"
          >
            {mod.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
