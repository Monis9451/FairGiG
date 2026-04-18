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
        'touch-manipulation overflow-hidden rounded-2xl border p-4 shadow-md shadow-brand-darkest/[0.07] sm:rounded-3xl sm:p-5',
        isFeed
          ? 'border-brand-muted/70 border-l-[4px] border-l-brand-primary bg-gradient-to-br from-white via-white to-brand-light/40 sm:border-l-[5px]'
          : 'border-brand-muted bg-white',
        className
      )}
    >
      {isFeed ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-primary/12 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-brand-primary sm:text-[11px]">
            Live
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted sm:text-xs">
            Approved
          </span>
        </div>
      ) : null}
      <div className="mb-3 flex flex-col gap-2 text-xs text-brand-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {post.platform ? (
            <span className="rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-semibold text-brand-dark sm:text-xs">
              {post.platform}
            </span>
          ) : null}
          {post.category ? (
            <span className="rounded-full border border-brand-muted/80 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-brand-darkest sm:text-xs">
              {post.category}
            </span>
          ) : null}
        </div>
        <span className="text-[11px] tabular-nums text-brand-muted sm:ml-auto sm:text-xs">{formatWhen(post.created_at)}</span>
      </div>
      {post.title ? (
        <h2 className="mb-2 text-[1.05rem] font-bold leading-snug text-brand-darkest sm:text-lg md:text-xl">
          {post.title}
        </h2>
      ) : null}
      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-brand-dark sm:text-sm md:text-[15px] md:leading-7">
        {post.body}
      </p>
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
      {footer ? (
        <div className="mt-4 border-t border-brand-light/90 pt-3 sm:mt-5 sm:pt-4">{footer}</div>
      ) : null}
    </article>
  )
}
