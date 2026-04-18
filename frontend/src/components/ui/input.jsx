export function Input({ className = '', autoComplete = 'off', ...props }) {
  return (
    <input
      autoComplete={autoComplete}
      data-lpignore="true"
      className={`h-10 w-full rounded-md border-2 border-brand-primary bg-brand-light px-3 text-sm text-brand-darkest placeholder:text-brand-muted placeholder:transition-all placeholder:duration-300 placeholder:ease-out placeholder:transform placeholder:translate-x-0 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:placeholder:-translate-x-3 focus:placeholder:opacity-0 ${className}`}
      {...props}
    />
  )
}
