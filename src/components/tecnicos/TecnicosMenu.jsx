import { useState, useEffect } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

function formatSyncTime(isoStr) {
  if (!isoStr) return null
  const date = new Date(isoStr)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMin / 60)

  const hhmm = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  const ddmm = date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (diffMin < 2)  return { label: `hace menos de 2 min — ${hhmm}`, color: 'emerald' }
  if (diffMin < 60) return { label: `hace ${diffMin} min — ${hhmm}`, color: 'emerald' }
  if (diffHrs < 2)  return { label: `hace ${diffHrs}h ${diffMin % 60}min — ${hhmm}`, color: 'amber' }
  if (diffHrs < 6)  return { label: `hace ${diffHrs} horas — ${hhmm}`, color: 'amber' }
  return { label: `${ddmm} ${hhmm}`, color: 'red' }
}

export default function TecnicosMenu({ onNavigate, onBack }) {
  const [syncInfo, setSyncInfo] = useState(null)

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/seguimiento_etdh?select=sincronizado_en&order=sincronizado_en.desc&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    })
      .then(r => r.json())
      .then(data => { if (data?.[0]?.sincronizado_en) setSyncInfo(formatSyncTime(data[0].sincronizado_en)) })
      .catch(() => {})
  }, [])

  return (
    <div className="scanline min-h-full">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-primary transition-colors">
            ‹ INICIO
          </button>
          <span className="text-primary/20 font-mono">|</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-primary">TÉCNICOS EDTH</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-px bg-primary/50" />
            <span className="text-primary/60 text-[10px] font-mono tracking-[0.4em] uppercase">
              MÓDULO ACTIVO — SELECCIONAR HERRAMIENTA
            </span>
          </div>
          {syncInfo && (
            <div className={`inline-flex items-center gap-2 mb-4 px-3 py-1.5 border rounded-sm ${
              syncInfo.color === 'emerald' ? 'border-emerald-500/30 bg-emerald-950/30' :
              syncInfo.color === 'amber'   ? 'border-amber-500/30 bg-amber-950/30' :
                                             'border-red-500/30 bg-red-950/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                syncInfo.color === 'emerald' ? 'bg-emerald-400 animate-pulse' :
                syncInfo.color === 'amber'   ? 'bg-amber-400' : 'bg-red-400'
              }`}/>
              <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">SEGUIMIENTO sync</span>
              <span className={`text-[10px] font-mono font-semibold ${
                syncInfo.color === 'emerald' ? 'text-emerald-400' :
                syncInfo.color === 'amber'   ? 'text-amber-400' : 'text-red-400'
              }`}>{syncInfo.label}</span>
            </div>
          )}
          <h1 className="font-display font-black text-4xl md:text-5xl text-text-primary uppercase tracking-wider leading-none mb-3">
            TÉCNICOS<br />
            <span className="text-primary">EDTH</span>
          </h1>
          <p className="text-text-secondary text-sm font-mono tracking-wide max-w-xl">
            Herramientas para gestión y validación de traslados en programas técnicos laborales.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-primary/20" />
          <span className="text-primary/30 text-[10px] font-mono tracking-widest">3 HERRAMIENTAS DISPONIBLES</span>
          <div className="flex-1 h-px bg-primary/20" />
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3">

          {/* Card 1: Malla Curricular */}
          <div
            className="bg-background-card border border-primary/30 corner-box hover:border-primary/70 hover:bg-background-elevated hover:shadow-glow-cyan transition-all duration-300 flex items-stretch relative cursor-pointer"
            onClick={() => onNavigate('anclas')}
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
                Malla Curricular
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Visualiza la distribución de materias por período de ingreso para todos los programas técnicos.
                Filtros por fecha, búsqueda y vista de módulo activo hoy.
              </p>
            </div>
            <div className="w-48 flex-shrink-0 flex items-center justify-center border-l border-primary/30 p-4">
              <button className="w-full py-2.5 px-4 text-[11px] font-mono uppercase tracking-[0.2em] border border-primary/50 bg-primary/10 text-primary hover:bg-primary hover:text-background transition-all duration-200 text-center active:scale-95">
                ABRIR <span className="opacity-60">›</span>
              </button>
            </div>
          </div>

          {/* Card 2: Validación de Traslado */}
          <div
            className="bg-background-card border border-secondary/30 corner-box hover:border-secondary/70 hover:bg-background-elevated transition-all duration-300 flex items-stretch relative cursor-pointer"
            onClick={() => onNavigate('validacion')}
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
                Validación de Traslado
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Compara lo que tiene el estudiante asignado en plataforma contra lo que debería tener según las anclas.
                Detecta módulos CORRECTO / INCORRECTO - FECHA FUERA DE RANGO.
              </p>
            </div>
            <div className="w-48 flex-shrink-0 flex items-center justify-center border-l border-secondary/30 p-4">
              <button className="w-full py-2.5 px-4 text-[11px] font-mono uppercase tracking-[0.2em] border border-secondary/50 bg-secondary/10 text-secondary hover:bg-secondary hover:text-background transition-all duration-200 text-center active:scale-95">
                ABRIR <span className="opacity-60">›</span>
              </button>
            </div>
          </div>

          {/* Card 3: Reporte de Materias Erradas */}
          <div
            className="bg-background-card border border-amber-500/30 corner-box hover:border-amber-500/70 hover:bg-background-elevated transition-all duration-300 flex items-stretch relative cursor-pointer"
            onClick={() => onNavigate('reporte')}
          >
            <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center border-r border-amber-500/30 p-4 gap-3">
              <span className="font-mono text-xs text-amber-500 opacity-40">03</span>
              <span className="text-4xl">📋</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            <div className="flex-1 px-6 py-5 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[9px] font-mono tracking-[0.3em] uppercase border px-2 py-0.5 text-amber-400 border-amber-500/30 bg-amber-500/10">
                  ACTIVO
                </span>
              </div>
              <h3 className="font-display font-black text-lg uppercase tracking-wider text-amber-400 mb-1">
                Reporte de Materias Erradas
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Selecciona un período y tipo de estudiantes (activos o todos) para ver quiénes tienen módulos incorrectos o faltantes en ese período.
              </p>
            </div>
            <div className="w-48 flex-shrink-0 flex items-center justify-center border-l border-amber-500/30 p-4">
              <button className="w-full py-2.5 px-4 text-[11px] font-mono uppercase tracking-[0.2em] border border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-400 hover:text-background transition-all duration-200 text-center active:scale-95">
                ABRIR <span className="opacity-60">›</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-8 flex items-center justify-between text-[10px] font-mono text-text-muted tracking-widest">
          <span>KUEPA EDUCATION SYSTEMS</span>
          <span>TÉCNICOS EDTH — v1.2.0</span>
        </div>
      </div>
    </div>
  )
}
