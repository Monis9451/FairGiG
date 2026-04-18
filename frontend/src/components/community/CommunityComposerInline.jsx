import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
    control,
    handleSubmit,
    reset,
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

  const bodyVal = useWatch({ control, name: 'body' })
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
        'overflow-hidden rounded-2xl border border-brand-muted/80 bg-white/95 shadow-md shadow-brand-darkest/[0.07] backdrop-blur-sm sm:rounded-3xl sm:p-0.5',
        className
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-5">
        <div className="flex gap-3 sm:gap-4">
          <ComposerAvatar />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <label htmlFor="inline-composer-body" className="sr-only">
                Post body
              </label>
              <textarea
                id="inline-composer-body"
                rows={4}
                {...register('body')}
                placeholder="What do you want to share? Rate intel, platform issues, tips — your name stays private in the feed."
                className="w-full resize-y rounded-xl border-2 border-brand-muted/90 bg-brand-light/35 px-3 py-3 text-base leading-relaxed text-brand-darkest placeholder:text-brand-muted focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/25 sm:px-4 sm:text-sm"
              />
              {errors.body ? (
                <p className="mt-1 text-xs text-amber-800">{errors.body.message}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setShowExtras((v) => !v)}
              className="flex min-h-[44px] touch-manipulation items-center gap-1 rounded-lg px-1 text-left text-xs font-semibold text-brand-primary hover:bg-brand-primary/5 hover:underline active:bg-brand-primary/10 sm:min-h-0"
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
                  <Input
                    id="inline-composer-title"
                    {...register('title')}
                    placeholder="Short title"
                    className="min-h-11 text-base sm:text-sm"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="inline-composer-platform" className="mb-1 block text-xs font-semibold text-brand-dark">
                      Platform
                    </label>
                    <Input
                      id="inline-composer-platform"
                      {...register('platform')}
                      placeholder="e.g. Foodpanda"
                      className="min-h-11 text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="inline-composer-category" className="mb-1 block text-xs font-semibold text-brand-dark">
                      Category
                    </label>
                    <Input
                      id="inline-composer-category"
                      {...register('category')}
                      placeholder="default: general"
                      className="min-h-11 text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="inline-composer-tags" className="mb-1 block text-xs font-semibold text-brand-dark">
                    Tags
                  </label>
                  <Input
                    id="inline-composer-tags"
                    {...register('tags')}
                    placeholder="Comma-separated"
                    className="min-h-11 text-base sm:text-sm"
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-brand-light/90 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
              <p className="text-[11px] leading-relaxed text-brand-muted sm:text-xs">
                Posts go to <strong className="text-brand-dark">pending</strong> until an advocate approves them for the
                feed.
              </p>
              <Button
                type="submit"
                disabled={createPost.isPending || !hasDraft}
                className="min-h-[48px] w-full touch-manipulation rounded-2xl border-2 border-brand-primary bg-brand-primary px-8 text-xs font-bold uppercase tracking-wider text-brand-light hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-auto sm:rounded-full"
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
