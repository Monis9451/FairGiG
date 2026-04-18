import { motion } from 'framer-motion'
import { useCommunityMine } from '@/hooks/useCommunity'
import { CommunityPostCard } from '@/components/community/CommunityPostCard'
import { CommunityComposerInline } from '@/components/community/CommunityComposerInline'
import { PostStatusBadge } from '@/components/community/PostStatusBadge'
import { fieldContainerVariant, fieldVariant } from '@/components/auth/motionVariants'

export function CommunityMinePanel() {
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
        <CommunityComposerInline />
        <p className="rounded-2xl border border-dashed border-brand-muted bg-white p-8 text-center text-sm text-brand-muted">
          You have not submitted any community posts yet. Use the composer above — posts appear here after you submit.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <CommunityComposerInline />
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
                  <PostStatusBadge status={post.status} />
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
