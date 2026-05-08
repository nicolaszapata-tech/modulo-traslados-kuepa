const variantClasses = {
  active: 'bg-status-active text-background',
  development: 'bg-status-development text-background',
  locked: 'bg-status-locked text-text-primary',
  beta: 'bg-secondary text-background',
  prod: 'bg-primary text-background',
}

export default function Badge({ variant = 'active', children }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
