import { cn } from '@/lib/utils'

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return String(iso)
  }
}

export function CommunityPostCard({ post, className, footer, variant = 'default' }) {
  const isFeed = variant === 'feed'
  return (
    <article
      className={cn(
        'rounded-2xl border border-brand-muted p-4 shadow-md shadow-brand-darkest/5 sm:p-5',
        isFeed
          ? 'border-l-[5px] border-l-brand-primary bg-gradient-to-br from-white to-brand-light/35'
          : 'bg-white',
        className
      )}
    >
      {isFeed ? (
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-brand-primary">
            Live
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-brand-muted">
            Approved post
          </span>
        </div>
      ) : null}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
        {post.platform ? (
          <span className="rounded-full bg-brand-light px-2 py-0.5 font-medium text-brand-dark">
            {post.platform}
          </span>
        ) : null}
        {post.category ? (
          <span className="rounded-full border border-brand-muted px-2 py-0.5 font-medium text-brand-darkest">
            {post.category}
          </span>
        ) : null}
        <span className="ml-auto">{formatWhen(post.created_at)}</span>
      </div>
      {post.title ? (
        <h2 className="mb-2 text-base font-bold text-brand-darkest sm:text-lg">{post.title}</h2>
      ) : null}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-dark">{post.body}</p>
      {Array.isArray(post.tags) && post.tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
      {footer ? <div className="mt-4 border-t border-brand-light pt-3">{footer}</div> : null}
    </article>
  )
}
