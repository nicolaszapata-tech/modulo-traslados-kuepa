export default function BachillerMenu({ onNavigate, onBack }) {
  return (
    <div className="scanline min-h-full">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-primary transition-colors">
            ‹ INICIO
          </button>
          <span className="text-primary/20 font-mono">|</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-primary">BACHILLER KUEPA</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-px bg-primary/50" />
            <span className="text-primary/60 text-[10px] font-mono tracking-[0.4em] uppercase">
              MÓDULO ACTIVO — SELECCIONAR HERRAMIENTA
            </span>
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl text-text-primary uppercase tracking-wider leading-none mb-3">
            BACHILLER<br />
            <span className="text-primary">KUEPA</span>
          </h1>
          <p className="text-text-secondary text-sm font-mono tracking-wide max-w-xl">
            Herramientas para gestión y validación de traslados en programas de bachillerato académico.
            Grados 6-11 · 4 programas · Calendarios III/IV y V/VI.
          </p>
        </div>

        {/* ── Sección LECTIVA ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-5 bg-primary/70 rounded-sm flex-shrink-0" />
          <span className="text-[11px] font-mono tracking-[0.5em] uppercase text-primary/70 font-semibold">LECTIVA</span>
          <div className="flex-1 h-px bg-primary/15" />
        </div>

        <div className="flex flex-col gap-3 mb-10">

          {/* Card 01: Malla Curricular Bach */}
          <div
            className="bg-background-card border border-primary/30 corner-box hover:border-primary/70 hover:bg-background-elevated hover:shadow-glow-cyan transition-all duration-300 flex items-stretch relative cursor-pointer"
            onClick={() => onNavigate('malla-bach')}
          >
            <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center border-r border-primary/30 p-4 gap-3">
              <span className="font-mono text-xs text-primary opacity-40">01</span>
              <span className="text-4xl">📐</span>
              <span className="w-1.5 h-1.5 rounded-full bg-status-active" />
            </div>
            <div className="flex-1 px-6 py-5 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[9px] font-mono tracking-[0.3em] uppercase border px-2 py-0.5 text-status-active border-status-active/30 bg-status-active/10">
                  ACTIVO
                </span>
              </div>
              <h3 className="font-display font-black text-lg uppercase tracking-wider text-primary mb-1">
                Calendario Académico Bachillerato
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Visualiza el calendario de materias por grado y programa. Rotación circular de 5 materias sobre
                60 ciclos (2022-2027). Programas Plus Online, Plus Onsite, Flex y Crepes.
              </p>
            </div>
            <div className="w-48 flex-shrink-0 flex items-center justify-center border-l border-primary/30 p-4">
              <button className="w-full py-2.5 px-4 text-[11px] font-mono uppercase tracking-[0.2em] border border-primary/50 bg-primary/10 text-primary hover:bg-primary hover:text-background transition-all duration-200 text-center active:scale-95">
                ABRIR <span className="opacity-60">›</span>
              </button>
            </div>
          </div>

          {/* Card 02: Validación Bach */}
          <div
            className="bg-background-card border border-secondary/30 corner-box hover:border-secondary/70 hover:bg-background-elevated transition-all duration-300 flex items-stretch relative cursor-pointer"
            onClick={() => onNavigate('validacion-bach')}
          >
            <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center border-r border-secondary/30 p-4 gap-3">
              <span className="font-mono text-xs text-secondary opacity-40">02</span>
              <span className="text-4xl">🔍</span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            </div>
            <div className="flex-1 px-6 py-5 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[9px] font-mono tracking-[0.3em] uppercase border px-2 py-0.5 text-secondary border-secondary/30 bg-secondary/10">
                  ACTIVO
                </span>
              </div>
              <h3 className="font-display font-black text-lg uppercase tracking-wider text-secondary mb-1">
                Validación Bach
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Compara las materias asignadas en BigQuery contra las anclas curriculares por grado de ingreso.
                Hasta 80 materias por estudiante · Tolerancia ±1 día · Detección CORRECTO / INCORRECTO-FECHA / NO ASIGNADO.
              </p>
            </div>
            <div className="w-48 flex-shrink-0 flex items-center justify-center border-l border-secondary/30 p-4">
              <button className="w-full py-2.5 px-4 text-[11px] font-mono uppercase tracking-[0.2em] border border-secondary/50 bg-secondary/10 text-secondary hover:bg-secondary hover:text-background transition-all duration-200 text-center active:scale-95">
                ABRIR <span className="opacity-60">›</span>
              </button>
            </div>
          </div>

        </div>

        {/* ── Sección REPORTES ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-5 bg-amber-500/70 rounded-sm flex-shrink-0" />
          <span className="text-[11px] font-mono tracking-[0.5em] uppercase text-amber-500/70 font-semibold">REPORTES</span>
          <div className="flex-1 h-px bg-amber-500/15" />
        </div>

        <div className="flex flex-col gap-3 mb-10">

          {/* Card 03: Reporte Erradas Bach */}
          <div
            className="bg-background-card border border-amber-500/30 corner-box hover:border-amber-500/70 hover:bg-background-elevated transition-all duration-300 flex items-stretch relative cursor-pointer"
            onClick={() => onNavigate('reporte-bach')}
          >
            <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center border-r border-amber-500/30 p-4 gap-3">
              <span className="font-mono text-xs text-amber-500 opacity-40">03</span>
              <span className="text-4xl">⚠</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            <div className="flex-1 px-6 py-5 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[9px] font-mono tracking-[0.3em] uppercase border px-2 py-0.5 text-amber-400 border-amber-500/30 bg-amber-500/10">
                  ACTIVO
                </span>
              </div>
              <h3 className="font-display font-black text-lg uppercase tracking-wider text-amber-400 mb-1">
                Reporte Erradas Bach
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Vista plana de todos los módulos INCORRECTOS y NO ASIGNADOS. Filtra por programa, grado, año
                y tipo de error. Exporta a CSV con un clic.
              </p>
            </div>
            <div className="w-48 flex-shrink-0 flex items-center justify-center border-l border-amber-500/30 p-4">
              <button className="w-full py-2.5 px-4 text-[11px] font-mono uppercase tracking-[0.2em] border border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-background transition-all duration-200 text-center active:scale-95">
                ABRIR <span className="opacity-60">›</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-[10px] font-mono text-text-muted tracking-widest">
          <span>KUEPA EDUCATION SYSTEMS</span>
          <span>BACHILLER KUEPA — v1.0.0</span>
        </div>
      </div>
    </div>
  )
}
