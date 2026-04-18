import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronDown, ChevronUp } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { useCreateCommunityPost } from '@/hooks/useCommunity'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const schema = z.object({
  title: z.string().optional(),
  body: z.string().min(1, 'Write something to share'),
  platform: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
})

function ComposerAvatar() {
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const initial = (
    profile?.full_name?.trim()?.[0] ||
    user?.email?.trim()?.[0] ||
    '?'
  ).toUpperCase()

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-dark text-sm font-bold text-brand-light shadow-md ring-2 ring-white"
      aria-hidden
    >
      {initial}
    </div>
  )
}

export function CommunityComposerInline({ className }) {
  const [showExtras, setShowExtras] = useState(false)
  const createPost = useCreateCommunityPost()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      body: '',
      platform: '',
      category: '',
      tags: '',
    },
  })

  const bodyVal = watch('body')
  const hasDraft = Boolean(String(bodyVal || '').trim())

  const onSubmit = (data) => {
    createPost.mutate(
      {
        body: data.body.trim(),
        title: data.title?.trim() || undefined,
        platform: data.platform?.trim() || undefined,
        category: data.category?.trim() || undefined,
        tags: data.tags?.trim() || undefined,
      },
      {
        onSuccess: () => {
          reset()
          setShowExtras(false)
        },
      }
    )
  }

  return (
    <section
      className={cn(
        'rounded-2xl border border-brand-muted bg-white p-4 shadow-md shadow-brand-darkest/5 sm:p-5',
        className
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-3 sm:gap-4">
          <ComposerAvatar />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <label htmlFor="inline-composer-body" className="sr-only">
                Post body
              </label>
              <textarea
                id="inline-composer-body"
                rows={3}
                {...register('body')}
                placeholder="What do you want to share? Rate intel, platform issues, tips — your name stays private in the feed."
                className="w-full resize-y rounded-xl border-2 border-brand-muted bg-brand-light/40 px-4 py-3 text-sm text-brand-darkest placeholder:text-brand-muted focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
              {errors.body ? (
                <p className="mt-1 text-xs text-amber-800">{errors.body.message}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setShowExtras((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
            >
              {showExtras ? (
                <>
                  <ChevronUp className="h-4 w-4" aria-hidden />
                  Hide optional details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" aria-hidden />
                  Add headline, platform, category, or tags
                </>
              )}
            </button>

            {showExtras ? (
              <div className="space-y-3 rounded-xl border border-brand-light bg-brand-light/30 p-3 sm:p-4">
                <div>
                  <label htmlFor="inline-composer-title" className="mb-1 block text-xs font-semibold text-brand-dark">
                    Headline (optional)
                  </label>
                  <Input id="inline-composer-title" {...register('title')} placeholder="Short title" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="inline-composer-platform" className="mb-1 block text-xs font-semibold text-brand-dark">
                      Platform
                    </label>
                    <Input id="inline-composer-platform" {...register('platform')} placeholder="e.g. Foodpanda" />
                  </div>
                  <div>
                    <label htmlFor="inline-composer-category" className="mb-1 block text-xs font-semibold text-brand-dark">
                      Category
                    </label>
                    <Input id="inline-composer-category" {...register('category')} placeholder="default: general" />
                  </div>
                </div>
                <div>
                  <label htmlFor="inline-composer-tags" className="mb-1 block text-xs font-semibold text-brand-dark">
                    Tags
                  </label>
                  <Input id="inline-composer-tags" {...register('tags')} placeholder="Comma-separated" />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-brand-light pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-brand-muted">
                Posts go to <strong className="text-brand-dark">pending</strong> until an advocate approves them for the
                feed.
              </p>
              <Button
                type="submit"
                disabled={createPost.isPending || !hasDraft}
                className="h-10 shrink-0 rounded-full border-2 border-brand-primary bg-brand-primary px-8 text-xs font-bold uppercase tracking-wider text-brand-light hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createPost.isPending ? 'Posting…' : 'Post'}
              </Button>
            </div>

            {createPost.isError ? (
              <p className="text-sm text-brand-muted">
                {createPost.error?.response?.data?.error || 'Could not create post.'}
              </p>
            ) : null}
          </div>
        </div>
      </form>
    </section>
  )
}
