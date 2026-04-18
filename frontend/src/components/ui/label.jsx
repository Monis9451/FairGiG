export function Label({ className = '', ...props }) {
  return <label className={`mb-1.5 block text-sm font-medium text-brand-darkest ${className}`} {...props} />
}
