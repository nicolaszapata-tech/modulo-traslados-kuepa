import { useState } from 'react'

export default function Header() {
  const [isBeta, setIsBeta] = useState(true)

  return (
    <header className="h-16 bg-background-elevated/90 backdrop-blur border-b border-primary/20 flex items-center px-8 sticky top-0 z-50">
      {/* Left: Logo + system label */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-primary/50 bg-primary/10 flex items-center justify-center">
            <span className="font-display font-black text-primary text-sm">K</span>
          </div>
          <div>
            <div className="font-display font-black text-primary text-sm tracking-[0.3em]">KUEPA</div>
            <div className="text-text-muted text-[10px] tracking-[0.2em] uppercase font-mono">Sistema Educativo</div>
          </div>
        </div>
        <div className="h-6 w-px bg-primary/20 mx-2" />
        <div className="text-text-muted text-[10px] font-mono tracking-widest uppercase hidden md:block">
          SYS_TRASLADOS_V1.0
        </div>
      </div>

      {/* Center: Title */}
      <div className="flex-1 text-center hidden md:block">
        <div className="font-display font-bold text-text-primary text-xs tracking-[0.4em] uppercase">
          MÓDULO DE TRASLADOS
        </div>
      </div>

      {/* Right: Environment toggle + status */}
      <div className="flex items-center gap-4 flex-1 justify-end">
        <div className="flex items-center gap-1 text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-status-active animate-pulse inline-block" />
          <span className="text-status-active tracking-widest">ONLINE</span>
        </div>
        <div className="h-4 w-px bg-primary/20" />
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${!isBeta ? 'text-primary' : 'text-text-muted'}`}>
            PROD
          </span>
          <button
            onClick={() => setIsBeta(!isBeta)}
            className={`relative w-10 h-5 border transition-colors duration-300 focus:outline-none ${isBeta ? 'bg-secondary/20 border-secondary/50' : 'bg-primary/20 border-primary/50'}`}
            aria-label="Toggle environment"
          >
            <span className={`absolute top-0.5 w-3.5 h-3.5 transition-transform duration-300 ${isBeta ? 'bg-secondary translate-x-0.5' : 'bg-primary translate-x-5'}`} />
          </button>
          <span className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${isBeta ? 'text-secondary' : 'text-text-muted'}`}>
            BETA
          </span>
        </div>
      </div>
    </header>
  )
}
