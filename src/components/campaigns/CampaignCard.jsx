const statusConfig = {
  active: {
    borderColor: 'border-primary/30',
    accentColor: 'text-primary',
    bgColor: 'bg-background-card',
    badgeColor: 'text-status-active border-status-active/30 bg-status-active/10',
    badgeLabel: 'ACTIVO',
    buttonLabel: 'INICIAR MISIÓN',
    buttonStyle: 'border border-primary/50 bg-primary/10 text-primary hover:bg-primary hover:text-background cursor-pointer',
    hoverEffect: 'hover:border-primary/70 hover:bg-background-elevated hover:shadow-glow-cyan',
    cornerClass: 'corner-box',
    opacity: 'opacity-100',
    dotColor: 'bg-status-active',
  },
  development: {
    borderColor: 'border-secondary/30',
    accentColor: 'text-secondary',
    bgColor: 'bg-background-card',
    badgeColor: 'text-status-development border-status-development/30 bg-status-development/10',
    badgeLabel: 'EN DESARROLLO',
    buttonLabel: 'PRÓXIMAMENTE',
    buttonStyle: 'border border-secondary/50 bg-secondary/10 text-secondary hover:bg-secondary hover:text-background cursor-pointer',
    hoverEffect: 'hover:border-secondary/70 hover:bg-background-elevated',
    cornerClass: 'corner-box',
    opacity: 'opacity-100',
    dotColor: 'bg-status-development',
  },
  locked: {
    borderColor: 'border-status-locked/20',
    accentColor: 'text-text-muted',
    bgColor: 'bg-background-card/50',
    badgeColor: 'text-text-muted border-text-muted/20 bg-text-muted/10',
    badgeLabel: 'BLOQUEADO',
    buttonLabel: 'ACCESO RESTRINGIDO',
    buttonStyle: 'border border-status-locked/20 bg-transparent text-text-muted cursor-not-allowed',
    hoverEffect: '',
    cornerClass: 'corner-box-locked',
    opacity: 'opacity-50',
    dotColor: 'bg-status-locked',
  },
}

export default function CampaignCard({ title, description, icon, status = 'active', onClick, index = 0 }) {
  const config = statusConfig[status]
  const isLocked = status === 'locked'

  return (
    <div
      className={`
        ${config.bgColor} border ${config.borderColor}
        ${config.hoverEffect} ${config.opacity} ${config.cornerClass}
        transition-all duration-300
        flex items-stretch relative
      `}
    >
      {/* Left: Index + Icon */}
      <div className={`w-24 flex-shrink-0 flex flex-col items-center justify-center border-r ${config.borderColor} p-4 gap-3`}>
        <span className={`font-mono text-xs ${config.accentColor} opacity-40`}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="text-4xl">{icon}</div>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      </div>

      {/* Center: Info */}
      <div className="flex-1 px-6 py-5 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className={`text-[9px] font-mono tracking-[0.3em] uppercase border px-2 py-0.5 ${config.badgeColor}`}>
            {config.badgeLabel}
          </span>
        </div>
        <h3 className={`font-display font-black text-lg uppercase tracking-wider ${config.accentColor} mb-1`}>
          {title}
        </h3>
        <p className="text-text-secondary text-sm leading-relaxed">
          {description}
        </p>
      </div>

      {/* Right: Button */}
      <div className={`w-48 flex-shrink-0 flex items-center justify-center border-l ${config.borderColor} p-4`}>
        <button
          disabled={isLocked}
          onClick={isLocked ? undefined : onClick}
          className={`w-full py-2.5 px-4 text-[11px] font-mono uppercase tracking-[0.2em] transition-all duration-200 text-center active:scale-95 ${config.buttonStyle}`}
        >
          {config.buttonLabel} {!isLocked && <span className="opacity-60">›</span>}
        </button>
      </div>
    </div>
  )
}
