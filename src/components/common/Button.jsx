const variantClasses = {
  primary: 'border border-primary/50 bg-primary/10 text-primary hover:bg-primary hover:text-background hover:border-primary',
  secondary: 'border border-secondary/50 bg-secondary/10 text-secondary hover:bg-secondary hover:text-background hover:border-secondary',
  locked: 'border border-status-locked/20 bg-transparent text-text-muted cursor-not-allowed',
}

export default function Button({ variant = 'primary', disabled = false, onClick, children }) {
  const base = 'w-full py-2.5 px-4 text-[11px] font-mono uppercase tracking-[0.2em] transition-all duration-200 text-center'
  const interactive = !disabled ? 'hover:shadow-glow-cyan active:scale-95' : ''
  const classes = `${base} ${variantClasses[disabled ? 'locked' : variant]} ${interactive}`

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
    >
      {children}
      {!disabled && <span className="ml-1 opacity-60">›</span>}
    </button>
  )
}
