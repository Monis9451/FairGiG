import { useState } from 'react'
import { MessageCircle, ThumbsUp } from 'lucide-react'
import { useAddComment, usePostComments, useToggleUpvote } from '@/hooks/useCommunity'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return String(iso)
  }
}

export function CommunityPostEngagement({ post }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const toggleUpvote = useToggleUpvote()
  const addComment = useAddComment()
  const commentsQuery = usePostComments(post.id, open)

  const upvoteCount = post.upvote_count ?? 0
  const upvoted = post.viewer_upvoted ?? false
  const commentCount = post.comment_count ?? 0
  const votingThis = toggleUpvote.isPending && toggleUpvote.variables === post.id

  return (
    <div className="border-t border-brand-light/90 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={votingThis}
          onClick={() => toggleUpvote.mutate(post.id)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50',
            upvoted
              ? 'border-brand-primary bg-brand-primary text-brand-light'
              : 'border-brand-muted bg-white text-brand-darkest hover:border-brand-primary/60 hover:bg-brand-primary/5'
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          <span>{upvoteCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors',
            open
              ? 'border-brand-dark bg-brand-dark text-brand-light'
              : 'border-brand-muted bg-white text-brand-darkest hover:border-brand-dark/40'
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          <span>{commentCount}</span>
        </button>
        {toggleUpvote.isError ? (
          <span className="text-xs text-brand-muted">
            {toggleUpvote.error?.response?.data?.error || 'Could not update upvote.'}
          </span>
        ) : null}
      </div>

      {open ? (
        <div className="mt-3 rounded-xl border border-brand-muted/80 bg-brand-light/40 p-3">
          {commentsQuery.isLoading ? (
            <p className="text-xs text-brand-muted">Loading comments…</p>
          ) : commentsQuery.isError ? (
            <p className="text-xs text-brand-muted">
              {commentsQuery.error?.response?.data?.error || 'Comments failed to load.'}
            </p>
          ) : (
            <ul className="mb-3 max-h-48 space-y-2 overflow-y-auto text-sm">
              {(commentsQuery.data || []).length === 0 ? (
                <li className="text-xs text-brand-muted">No comments yet. Be the first.</li>
              ) : (
                (commentsQuery.data || []).map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-white/60 bg-white/90 px-3 py-2 text-brand-dark shadow-sm"
                  >
                    <p className="whitespace-pre-wrap leading-snug">{c.body}</p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-brand-muted">
                      {formatWhen(c.created_at)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              maxLength={4000}
              placeholder="Add a comment (anonymous in the feed)"
              className="min-h-[2.75rem] w-full flex-1 rounded-md border-2 border-brand-primary bg-white px-3 py-2 text-sm text-brand-darkest placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <Button
              type="button"
              disabled={!draft.trim() || addComment.isPending}
              onClick={() =>
                addComment.mutate(
                  { postId: post.id, body: draft.trim() },
                  { onSuccess: () => setDraft('') }
                )
              }
              className="h-10 shrink-0 rounded-full border-2 border-brand-primary bg-brand-primary px-5 text-xs font-bold uppercase tracking-wider text-brand-light hover:opacity-90 disabled:opacity-50"
            >
              {addComment.isPending ? 'Posting…' : 'Post'}
            </Button>
          </div>
          {addComment.isError ? (
            <p className="mt-2 text-xs text-brand-muted">
              {addComment.error?.response?.data?.error || 'Could not post comment.'}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
