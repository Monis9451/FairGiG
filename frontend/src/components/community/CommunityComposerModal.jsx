import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useCreateCommunityPost } from '@/hooks/useCommunity'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fieldContainerVariant, fieldVariant } from '@/components/auth/AuthSplitCard'

const schema = z.object({
  title: z.string().optional(),
  body: z.string().min(1, 'Write something to share'),
  platform: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
})

export function CommunityComposerModal({ open, onClose }) {
  const createPost = useCreateCommunityPost()
  const {
    register,
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

  if (!open) return null

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
          onClose()
        },
      }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-darkest/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-brand-muted bg-brand-light shadow-2xl sm:rounded-3xl"
      >
        <div className="border-b border-brand-muted bg-white px-5 py-4 sm:px-6">
          <h2 id="composer-title" className="text-lg font-extrabold text-brand-darkest">
            New community post
          </h2>
          <p className="text-xs text-brand-muted">Submitted as pending until an advocate approves.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 sm:px-6 sm:py-5">
          <motion.div variants={fieldContainerVariant} initial="hidden" animate="visible" className="flex flex-col gap-4">
            <motion.div variants={fieldVariant}>
              <Label htmlFor="composer-body">Message</Label>
              <textarea
                id="composer-body"
                rows={5}
                {...register('body')}
                className="w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 py-2 text-sm text-brand-darkest placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="Share rate intel, platform issues, or tips (peers won’t see your name)."
              />
              {errors.body ? (
                <span className="text-xs text-brand-muted">{errors.body.message}</span>
              ) : null}
            </motion.div>
            <motion.div variants={fieldVariant}>
              <Label htmlFor="composer-title">Title (optional)</Label>
              <Input id="composer-title" {...register('title')} placeholder="Short headline" />
            </motion.div>
            <motion.div variants={fieldVariant} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="composer-platform">Platform (optional)</Label>
                <Input id="composer-platform" {...register('platform')} placeholder="e.g. Foodpanda" />
              </div>
              <div>
                <Label htmlFor="composer-category">Category (optional)</Label>
                <Input id="composer-category" {...register('category')} placeholder="default: general" />
              </div>
            </motion.div>
            <motion.div variants={fieldVariant}>
              <Label htmlFor="composer-tags">Tags (optional)</Label>
              <Input id="composer-tags" {...register('tags')} placeholder="Comma-separated" />
            </motion.div>
            {createPost.isError ? (
              <p className="text-sm text-brand-muted">
                {createPost.error?.response?.data?.error || 'Could not create post.'}
              </p>
            ) : null}
            <motion.div variants={fieldVariant} className="flex flex-wrap gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                className="h-11 flex-1 rounded-full border-2 border-brand-muted bg-white text-sm font-semibold text-brand-darkest hover:bg-brand-light sm:flex-none sm:px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPost.isPending}
                className="h-11 flex-1 rounded-full border-2 border-brand-primary bg-brand-primary text-sm font-bold uppercase tracking-wider text-brand-light hover:opacity-90 disabled:opacity-60 sm:flex-1"
              >
                {createPost.isPending ? 'Submitting…' : 'Submit'}
              </Button>
            </motion.div>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}
