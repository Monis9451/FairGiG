import { motion } from 'framer-motion'
import { useCommunityMine } from '@/hooks/useCommunity'
import { CommunityPostCard } from '@/components/community/CommunityPostCard'
import { Button } from '@/components/ui/button'
import { fieldContainerVariant, fieldVariant } from '@/components/auth/AuthSplitCard'

function statusBadge(status) {
  const base = 'rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide'
  switch (status) {
    case 'visible':
      return `${base} bg-brand-primary/15 text-brand-primary`
    case 'pending':
      return `${base} border border-brand-primary/40 text-brand-primary`
    case 'hidden':
    case 'removed':
      return `${base} bg-brand-muted/25 text-brand-dark`
    default:
      return `${base} bg-brand-light text-brand-muted`
  }
}

export function CommunityMinePanel({ onOpenComposer }) {
  const mine = useCommunityMine()

  if (mine.isLoading) {
    return <p className="text-sm text-brand-muted">Loading your posts…</p>
  }
  if (mine.isError) {
    return (
      <p className="text-sm text-brand-muted">
        {mine.error?.response?.data?.error || 'Could not load your posts.'}
      </p>
    )
  }

  const items = mine.data?.items ?? []

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {typeof onOpenComposer === 'function' ? (
          <Button
            type="button"
            onClick={onOpenComposer}
            className="h-10 w-full rounded-full border-2 border-brand-primary bg-brand-primary text-sm font-bold uppercase tracking-wider text-brand-light hover:opacity-90 sm:w-auto sm:px-8"
          >
            New post
          </Button>
        ) : null}
        <p className="rounded-2xl border border-dashed border-brand-muted bg-white p-8 text-center text-sm text-brand-muted">
          You have not submitted any community posts yet. Create one with <strong>New post</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {typeof onOpenComposer === 'function' ? (
        <Button
          type="button"
          onClick={onOpenComposer}
          className="h-10 w-full rounded-full border-2 border-brand-primary bg-brand-primary text-sm font-bold uppercase tracking-wider text-brand-light hover:opacity-90 sm:w-auto sm:px-8"
        >
          New post
        </Button>
      ) : null}
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
            footer={
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={statusBadge(post.status)}>{post.status}</span>
                  {post.moderator_note ? (
                    <span className="text-brand-muted">
                      Note: <span className="text-brand-dark">{post.moderator_note}</span>
                    </span>
                  ) : null}
                </div>
                {post.status === 'pending' ? (
                  <p className="text-xs text-brand-muted">An advocate will review your submission.</p>
                ) : null}
              </div>
            }
          />
        </motion.li>
      ))}
    </motion.ul>
    </div>
  )
}
