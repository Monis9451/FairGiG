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
    <div className="border-t border-brand-light/90 pt-3 sm:pt-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            type="button"
            disabled={votingThis}
            onClick={() => toggleUpvote.mutate(post.id)}
            className={cn(
              'inline-flex min-h-[44px] flex-1 touch-manipulation items-center justify-center gap-2 rounded-2xl border-2 px-4 text-xs font-bold uppercase tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 sm:min-h-0 sm:flex-initial sm:rounded-full sm:py-2',
              upvoted
                ? 'border-brand-primary bg-brand-primary text-brand-light shadow-sm shadow-brand-primary/20'
                : 'border-brand-muted/90 bg-white text-brand-darkest hover:border-brand-primary/50 hover:bg-brand-primary/5'
            )}
          >
            <ThumbsUp className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} aria-hidden />
            <span className="tabular-nums">{upvoteCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={cn(
              'inline-flex min-h-[44px] flex-1 touch-manipulation items-center justify-center gap-2 rounded-2xl border-2 px-4 text-xs font-bold uppercase tracking-wide transition-all active:scale-[0.98] sm:min-h-0 sm:flex-initial sm:rounded-full sm:py-2',
              open
                ? 'border-brand-dark bg-brand-dark text-brand-light shadow-sm'
                : 'border-brand-muted/90 bg-white text-brand-darkest hover:border-brand-dark/35'
            )}
          >
            <MessageCircle className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} aria-hidden />
            <span className="tabular-nums">{commentCount}</span>
          </button>
        </div>
        {toggleUpvote.isError ? (
          <span className="text-xs text-brand-muted sm:flex-1">
            {toggleUpvote.error?.response?.data?.error || 'Could not update upvote.'}
          </span>
        ) : null}
      </div>

      {open ? (
        <div className="mt-3 rounded-2xl border border-brand-muted/70 bg-brand-light/50 p-3 shadow-inner shadow-brand-darkest/[0.03] sm:mt-4 sm:p-4">
          {commentsQuery.isLoading ? (
            <p className="text-xs text-brand-muted">Loading comments…</p>
          ) : commentsQuery.isError ? (
            <p className="text-xs text-brand-muted">
              {commentsQuery.error?.response?.data?.error || 'Comments failed to load.'}
            </p>
          ) : (
            <ul className="mb-3 max-h-52 space-y-2 overflow-y-auto overscroll-contain text-sm">
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
              rows={3}
              maxLength={4000}
              placeholder="Add a comment (anonymous in the feed)"
              className="min-h-[5rem] w-full flex-1 resize-y rounded-xl border-2 border-brand-primary/80 bg-white px-3 py-2.5 text-base text-brand-darkest placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/35 sm:min-h-[2.75rem] sm:text-sm"
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
              className="min-h-[48px] w-full shrink-0 touch-manipulation rounded-2xl border-2 border-brand-primary bg-brand-primary px-5 text-xs font-bold uppercase tracking-wider text-brand-light hover:opacity-90 active:scale-[0.99] disabled:opacity-50 sm:h-10 sm:w-auto sm:rounded-full"
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
