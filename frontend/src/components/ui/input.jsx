import { cn } from '@/lib/utils'

export function Input({ className = '', autoComplete = 'off', ...props }) {
  return (
    <input
      autoComplete={autoComplete}
      data-lpignore="true"
      className={cn(
        'h-11 w-full rounded-lg border border-brand-darkest/15 bg-white px-3 text-sm text-brand-darkest',
        'placeholder:text-brand-muted/70',
        'transition-colors focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20',
        'disabled:cursor-not-allowed disabled:bg-brand-light/50 disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
}
