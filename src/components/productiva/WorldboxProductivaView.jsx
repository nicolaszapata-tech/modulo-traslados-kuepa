import { useState, useMemo } from 'react'
import { getAllCohorts, getEtapaHoy, calcEtapas } from '../../data/productiva'
import AddCohortModal from './AddCohortModal'

// Seeded pseudo-random for deterministic dot positions
function seededRand(seed) {
  let s = seed >>> 0
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0
    return s / 0xffffffff
  }
}

function generateDots(count, cols, rows, seed) {
  const rand = seededRand(seed)
  const total = cols * rows
  const cells = new Set()
  let attempts = 0
  while (cells.size < Math.min(count, total) && attempts < total * 4) {
    cells.add(Math.floor(rand() * total))
    attempts++
  }
  return cells
}

const ZONES = [
  {
    key: 'adaptacion',
    label: 'ADAPTACIÓN',
    emoji: '🌱',
    subtitle: 'Meses 1–3',
    dotOn:  'bg-amber-400',
    dotOff: 'bg-amber-950/40',
    headerBg: 'bg-amber-900/60 border-amber-700/40',
    bodyBg:   'bg-amber-950/20 border-amber-700/20',
    countCls: 'text-amber-300',
    tooltipBg:'bg-amber-950 border-amber-700/50',
    tooltipTxt:'text-amber-200',
  },
  {
    key: 'desempeno',
    label: 'DESEMPEÑO',
    emoji: '⚙️',
    subtitle: 'Meses 4–7',
    dotOn:  'bg-sky-400',
    dotOff: 'bg-sky-950/40',
    headerBg: 'bg-sky-900/60 border-sky-700/40',
    bodyBg:   'bg-sky-950/20 border-sky-700/20',
    countCls: 'text-sky-300',
    tooltipBg:'bg-sky-950 border-sky-700/50',
    tooltipTxt:'text-sky-200',
  },
  {
    key: 'proyeccion',
    label: 'PROYECCIÓN',
    emoji: '🚀',
    subtitle: 'Meses 8–11',
    dotOn:  'bg-violet-400',
    dotOff: 'bg-violet-950/40',
    headerBg: 'bg-violet-900/60 border-violet-700/40',
    bodyBg:   'bg-violet-950/20 border-violet-700/20',
    countCls: 'text-violet-300',
    tooltipBg:'bg-violet-950 border-violet-700/50',
    tooltipTxt:'text-violet-200',
  },
  {
    key: 'finalizado',
    label: 'FINALIZADO',
    emoji: '🏁',
    subtitle: 'Completado',
    dotOn:  'bg-zinc-400',
    dotOff: 'bg-zinc-800/40',
    headerBg: 'bg-zinc-800/60 border-zinc-600/40',
    bodyBg:   'bg-zinc-900/20 border-zinc-700/20',
    countCls: 'text-zinc-400',
    tooltipBg:'bg-zinc-900 border-zinc-600/50',
    tooltipTxt:'text-zinc-300',
  },
]

const GRID_COLS = 7
const GRID_ROWS = 6
const MAX_DOTS  = GRID_COLS * GRID_ROWS // 42

function ZonePanel({ zone, cohorts, dotCount, maxDotCount, hovered, onHover }) {
  const dots = useMemo(
    () => generateDots(dotCount, GRID_COLS, GRID_ROWS, zone.key.charCodeAt(0) * 31 + dotCount),
    [zone.key, dotCount]
  )

  const isHovered = hovered === zone.key
  const noInitiados = cohorts.filter(c => getEtapaHoy(c.ingreso, c.fin).toLowerCase() === 'no iniciado')

  return (
    <div
      className="flex-1 flex flex-col cursor-default select-none relative"
      onMouseEnter={() => onHover(zone.key)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Header */}
      <div className={`border-b px-3 py-2.5 flex items-center justify-between transition-all ${zone.headerBg} ${isHovered ? 'brightness-125' : ''}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{zone.emoji}</span>
          <div>
            <div className="font-mono font-bold text-[10px] uppercase tracking-widest text-white/90">{zone.label}</div>
            <div className="font-mono text-[9px] text-white/50">{zone.subtitle}</div>
          </div>
        </div>
        <div className={`font-display font-black text-2xl ${zone.countCls}`}>
          {cohorts.length}
        </div>
      </div>

      {/* Grid of dots */}
      <div className={`border flex-1 flex flex-col justify-end p-3 transition-all ${zone.bodyBg} ${isHovered ? 'brightness-125' : ''}`} style={{ minHeight: '160px' }}>
        {cohorts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">Sin cohortes</span>
          </div>
        ) : (
          <div
            className="grid gap-1 mt-auto"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
          >
            {Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => (
              <div
                key={i}
                className={`rounded-sm transition-all duration-300 ${
                  dots.has(i)
                    ? `${zone.dotOn} ${isHovered ? 'scale-110' : ''}`
                    : zone.dotOff
                }`}
                style={{ width: '100%', aspectRatio: '1' }}
              />
            ))}
          </div>
        )}

        {/* Count label */}
        <div className={`mt-2 text-center font-mono text-[10px] uppercase tracking-widest ${zone.countCls} opacity-60`}>
          {cohorts.length} cohorte{cohorts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tooltip on hover */}
      {isHovered && cohorts.length > 0 && (
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 border rounded-sm px-3 py-2.5 min-w-44 shadow-xl ${zone.tooltipBg}`}>
          <div className={`text-[9px] font-mono uppercase tracking-widest mb-2 opacity-70 ${zone.tooltipTxt}`}>
            Ingresos en {zone.label}
          </div>
          <div className="flex flex-col gap-1">
            {cohorts.map(c => {
              const etapas = calcEtapas(c.ingreso, c.fin)
              const etapaIdx = zone.key === 'finalizado' ? -1
                : ['adaptacion','desempeno','proyeccion'].indexOf(zone.key)
              const fechas = etapas && etapaIdx >= 0 ? etapas[etapaIdx]?.fechasStr : c.fin
              return (
                <div key={c.id} className="flex flex-col">
                  <span className={`text-[10px] font-mono font-bold ${zone.tooltipTxt}`}>{c.ingreso}</span>
                  {fechas && <span className={`text-[9px] font-mono opacity-60 ${zone.tooltipTxt}`}>{fechas}</span>}
                </div>
              )
            })}
          </div>
          {/* Arrow */}
          <div className={`absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-r border-b ${zone.tooltipBg} border-opacity-50`} style={{ marginTop: '-4px' }} />
        </div>
      )}
    </div>
  )
}

export default function WorldboxProductivaView({ onBack }) {
  const [showModal, setShowModal] = useState(false)
  const [cohorts,   setCohorts]   = useState(() => getAllCohorts())
  const [hovered,   setHovered]   = useState(null)

  const reload = () => setCohorts(getAllCohorts())

  // Classify each cohort into a zone
  const classified = useMemo(() => {
    const byZone = { adaptacion: [], desempeno: [], proyeccion: [], finalizado: [], no_iniciado: [] }
    cohorts.forEach(c => {
      const etapa = getEtapaHoy(c.ingreso, c.fin).toLowerCase()
      if (etapa === 'adaptación')  byZone.adaptacion.push(c)
      else if (etapa === 'desempeño')  byZone.desempeno.push(c)
      else if (etapa === 'proyección') byZone.proyeccion.push(c)
      else if (etapa === 'finalizado') byZone.finalizado.push(c)
      else byZone.no_iniciado.push(c)
    })
    return byZone
  }, [cohorts])

  // Scale dots proportionally
  const maxCount = useMemo(
    () => Math.max(1, ...ZONES.map(z => classified[z.key]?.length || 0)),
    [classified]
  )

  const getDotCount = (count) =>
    count === 0 ? 0 : Math.max(4, Math.round((count / maxCount) * MAX_DOTS))

  return (
    <div className="max-w-full mx-auto px-6 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-amber-400 transition-colors">
            ‹ VOLVER
          </button>
          <span className="text-amber-500/20 font-mono">|</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted cursor-pointer hover:text-amber-400 transition-colors" onClick={onBack}>TÉCNICOS EDTH</span>
          <span className="text-amber-500/20 font-mono">›</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400">WORLDBOX PRODUCTIVA</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-amber-500/30 text-amber-400/70 hover:border-amber-500 hover:text-amber-400 transition-colors"
        >
          + Agregar Cohorte
        </button>
      </div>

      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-px bg-amber-500/50" />
          <span className="text-amber-500/60 text-[10px] font-mono tracking-[0.4em] uppercase">
            SIMULACIÓN DE POBLACIÓN POR ETAPA
          </span>
        </div>
        <h1 className="font-display font-black text-4xl text-text-primary uppercase tracking-wider mb-2">
          WORLD<span className="text-amber-400">BOX</span>
          <span className="text-text-muted text-2xl ml-3">PRODUCTIVA</span>
        </h1>
        <p className="text-text-secondary text-sm font-mono">
          Cada celda representa una fracción de la población en productiva. Pasa el mouse sobre cada civilización para ver sus cohortes.
        </p>
      </div>

      {/* Main WorldBox panel */}
      <div className="border border-amber-500/20 bg-zinc-950/60 mb-6 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-500/15 bg-black/40">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/70">WorldBox Productiva — En vivo</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-text-muted">
            <span>Total cohortes: <span className="text-amber-400 font-bold">{cohorts.length}</span></span>
            <span>Sin iniciar: <span className="text-zinc-500 font-bold">{classified.no_iniciado.length}</span></span>
          </div>
        </div>

        {/* Zones */}
        <div className="flex divide-x divide-amber-500/10" style={{ minHeight: '280px' }}>
          {ZONES.map(zone => (
            <ZonePanel
              key={zone.key}
              zone={zone}
              cohorts={classified[zone.key] || []}
              dotCount={getDotCount((classified[zone.key] || []).length)}
              maxDotCount={MAX_DOTS}
              hovered={hovered}
              onHover={setHovered}
            />
          ))}
        </div>

        {/* Ground bar */}
        <div className="h-1.5 bg-gradient-to-r from-amber-900/60 via-sky-900/60 via-violet-900/60 to-zinc-800/60" />
      </div>

      {/* Legend + No iniciado */}
      <div className="grid grid-cols-2 gap-4">
        {/* Legend */}
        <div className="border border-primary/10 bg-background-card/40 px-4 py-3">
          <div className="text-[9px] font-mono uppercase tracking-widest text-text-muted mb-3">Leyenda</div>
          <div className="flex flex-col gap-2">
            {ZONES.map(z => (
              <div key={z.key} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${z.dotOn}`} />
                <span className="text-[11px] font-mono text-text-secondary">{z.label} — {z.subtitle}</span>
                <span className={`ml-auto text-[11px] font-mono font-bold ${z.countCls}`}>
                  {(classified[z.key] || []).length}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sin iniciar */}
        <div className="border border-zinc-700/30 bg-background-card/40 px-4 py-3">
          <div className="text-[9px] font-mono uppercase tracking-widest text-text-muted mb-3">
            Próximas cohortes — Sin iniciar ({classified.no_iniciado.length})
          </div>
          {classified.no_iniciado.length === 0 ? (
            <div className="text-[11px] font-mono text-zinc-600">Sin cohortes pendientes</div>
          ) : (
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
              {classified.no_iniciado.map(c => (
                <div key={c.id} className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-zinc-500">⬡</span>
                  <span className="text-zinc-400">Ingreso {c.ingreso}</span>
                  <span className="text-zinc-600 ml-auto">→ {c.fin}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AddCohortModal
          onClose={() => setShowModal(false)}
          onSaved={() => { reload(); setShowModal(false) }}
        />
      )}
    </div>
  )
}
