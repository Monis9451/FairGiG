export function Button({ className = '', type = 'button', ...props }) {
  return <button type={type} className={className} {...props} />
}
