import { useState, useMemo } from 'react'
import { getAllCohorts, calcEtapas, getEtapaHoy, getYear, fmtDate, parseDateDMY } from '../../data/productiva'
import AddCohortModal from './AddCohortModal'

const ETAPA_COLS = [
  { label: 'ADAPTACIÓN', headerCls: 'bg-amber-900/80 text-amber-200',  rowCls: 'bg-amber-950/20',  accentCls: 'text-amber-300'  },
  { label: 'DESEMPEÑO',  headerCls: 'bg-sky-900/80 text-sky-200',      rowCls: 'bg-sky-950/20',    accentCls: 'text-sky-300'    },
  { label: 'PROYECCIÓN', headerCls: 'bg-violet-900/80 text-violet-200',rowCls: 'bg-violet-950/20', accentCls: 'text-violet-300' },
]

const ETAPA_HOY_CLS = {
  'adaptación': 'text-amber-300 bg-amber-950/60 border-amber-700/40',
  'desempeño':  'text-sky-300 bg-sky-950/60 border-sky-700/40',
  'proyección': 'text-violet-300 bg-violet-950/60 border-violet-700/40',
  'finalizado': 'text-emerald-400 bg-emerald-950/60 border-emerald-700/40',
  'no iniciado':'text-zinc-600 bg-zinc-900/30 border-zinc-800/20',
}

function EtapaBadge({ etapa }) {
  const cls = ETAPA_HOY_CLS[(etapa || '').toLowerCase()] || 'text-zinc-500 border-zinc-800/20'
  return (
    <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border rounded-sm whitespace-nowrap ${cls}`}>
      {etapa}
    </span>
  )
}

export default function MallaProductivaView({ onBack }) {
  const [showModal,     setShowModal]     = useState(false)
  const [cohorts,       setCohorts]       = useState(() => getAllCohorts())
  const [search,        setSearch]        = useState('')
  const [onlyActivos,   setOnlyActivos]   = useState(false)
  const [compact,       setCompact]       = useState(false)
  const [selectedYears, setSelectedYears] = useState([])

  const reload = () => setCohorts(getAllCohorts())

  // All rows with computed fields
  const rows = useMemo(() => cohorts.map(c => {
    const etapas   = calcEtapas(c.ingreso, c.fin)
    const etapaHoy = getEtapaHoy(c.ingreso, c.fin)
    const year     = getYear(c.ingreso)
    const finDate  = parseDateDMY(c.fin)
    return { ...c, etapas, etapaHoy, year, finDate }
  }), [cohorts])

  // Available years for filter
  const availableYears = useMemo(
    () => [...new Set(rows.map(r => r.year).filter(Boolean))].sort(),
    [rows]
  )

  // Stats by etapa
  const stats = useMemo(() => {
    const counts = { adaptacion: 0, desempeno: 0, proyeccion: 0, finalizado: 0, noIniciado: 0 }
    rows.forEach(r => {
      const e = (r.etapaHoy || '').toLowerCase()
      if (e === 'adaptación') counts.adaptacion++
      else if (e === 'desempeño') counts.desempeno++
      else if (e === 'proyección') counts.proyeccion++
      else if (e === 'finalizado') counts.finalizado++
      else if (e === 'no iniciado') counts.noIniciado++
    })
    return counts
  }, [rows])

  // Filtered rows
  const filtered = useMemo(() => {
    let result = rows
    if (selectedYears.length > 0) {
      result = result.filter(r => r.year && selectedYears.includes(r.year))
    }
    if (onlyActivos) {
      result = result.filter(r => !['no iniciado', 'finalizado', 'sin datos'].includes((r.etapaHoy || '').toLowerCase()))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(r =>
        r.ingreso.includes(q) || r.fin.includes(q) || (r.etapaHoy || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [rows, selectedYears, onlyActivos, search])

  const toggleYear = (y) =>
    setSelectedYears(prev =>
      prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y]
    )

  const today = new Date(); today.setHours(0, 0, 0, 0)

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
          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400">MALLA PRODUCTIVA</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-amber-500/30 text-amber-400/70 hover:border-amber-500 hover:text-amber-400 transition-colors"
        >
          + Gestionar Cohortes
        </button>
      </div>

      {/* Title */}
      <div className="mb-5">
        <h1 className="font-display font-black text-2xl text-text-primary uppercase tracking-wider mb-1">
          Malla <span className="text-amber-400">Productiva</span>
        </h1>
        <p className="text-text-muted text-xs font-mono">
          Distribución de etapas por fecha de ingreso · Adaptación · Desempeño · Proyección · Finalizado
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-1 flex-wrap mb-4 border border-amber-500/10 bg-background-card/40 px-4 py-2.5">
        <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted mr-2">Hoy</span>
        {[
          { label: 'Adaptación', count: stats.adaptacion, cls: 'text-amber-300 border-amber-700/30' },
          { label: 'Desempeño',  count: stats.desempeno,  cls: 'text-sky-300 border-sky-700/30'   },
          { label: 'Proyección', count: stats.proyeccion, cls: 'text-violet-300 border-violet-700/30' },
          { label: 'Finalizado', count: stats.finalizado, cls: 'text-emerald-400 border-emerald-700/30' },
          { label: 'Sin iniciar',count: stats.noIniciado, cls: 'text-zinc-500 border-zinc-700/20'  },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-sm ${s.cls}`}>
            <span className="text-[10px] font-mono">{s.label}</span>
            <span className="text-sm font-bold font-mono">{s.count}</span>
          </div>
        ))}
        <span className="ml-auto text-[10px] font-mono text-text-muted">{rows.length} cohortes totales</span>
      </div>

      {/* Year filter */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted shrink-0">Año</span>
        <button
          onClick={() => setSelectedYears([])}
          className={`px-3 py-1 text-[10px] font-mono border transition-colors ${
            selectedYears.length === 0
              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
              : 'border-primary/20 text-text-muted hover:border-amber-500/40 hover:text-amber-400/70'
          }`}
        >
          Todos
        </button>
        {availableYears.map(y => (
          <button
            key={y}
            onClick={() => toggleYear(y)}
            className={`px-3 py-1 text-[10px] font-mono border transition-colors ${
              selectedYears.includes(y)
                ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                : 'border-primary/20 text-text-muted hover:border-amber-500/40 hover:text-amber-400/70'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Search + toggles */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-56">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por fecha o etapa..."
            className="flex-1 bg-background border border-amber-500/20 text-text-primary text-xs font-mono px-3 py-2 outline-none focus:border-amber-500/50 placeholder:text-text-muted"
          />
          {search && <button onClick={() => setSearch('')} className="text-text-muted hover:text-amber-400 font-mono text-sm px-1">✕</button>}
        </div>
        <button
          onClick={() => setOnlyActivos(!onlyActivos)}
          className={`flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
            onlyActivos ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-primary/20 text-text-muted hover:border-amber-500/40'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${onlyActivos ? 'bg-amber-400 animate-pulse' : 'bg-text-muted'}`} />
          Solo activos
        </button>
        <button
          onClick={() => setCompact(!compact)}
          className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
            compact ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-primary/20 text-text-muted hover:border-amber-500/40'
          }`}
        >
          {compact ? 'COMPACTA ✓' : 'COMPLETA'}
        </button>
        <span className="text-text-muted text-[10px] font-mono shrink-0">
          {filtered.length} / {rows.length}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="border border-amber-500/10 px-6 py-8 text-center text-text-muted font-mono text-sm">
          Sin resultados para los filtros aplicados.
        </div>
      ) : (
        <div className="overflow-auto border border-amber-500/15" style={{ maxHeight: '60vh' }}>
          <table className="text-xs font-mono border-collapse" style={{ minWidth: compact ? '800px' : '1260px' }}>
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 bg-background-elevated border border-amber-500/15 px-3 py-2.5 text-left text-amber-400/80 uppercase tracking-widest whitespace-nowrap" style={{ minWidth: '130px' }}>
                  F. Ingreso
                </th>
                {!compact && (
                  <th className="bg-background-elevated border border-amber-500/15 px-3 py-2.5 text-left text-amber-400/80 uppercase tracking-widest whitespace-nowrap" style={{ minWidth: '120px' }}>
                    F. Fin
                  </th>
                )}
                {ETAPA_COLS.map((col, i) => (
                  compact ? (
                    <th key={i} className={`border border-amber-500/10 px-3 py-2.5 text-center uppercase tracking-widest whitespace-nowrap ${col.headerCls}`} style={{ minWidth: '170px' }}>
                      {col.label}
                    </th>
                  ) : (
                    <th key={i} colSpan={2} className={`border border-amber-500/10 px-3 py-2.5 text-center uppercase tracking-widest whitespace-nowrap font-bold ${col.headerCls}`} style={{ minWidth: '340px' }}>
                      {col.label}
                    </th>
                  )
                ))}
                {/* FINALIZADO */}
                <th className={`border border-amber-500/10 px-3 py-2.5 text-center uppercase tracking-widest whitespace-nowrap font-bold bg-emerald-900/60 text-emerald-200`} style={{ minWidth: compact ? '120px' : '130px' }}>
                  FINALIZADO
                </th>
                <th className="bg-background-elevated border border-amber-500/15 px-3 py-2.5 text-left text-amber-400/80 uppercase tracking-widest whitespace-nowrap" style={{ minWidth: '110px' }}>
                  Etapa Hoy
                </th>
              </tr>
              {!compact && (
                <tr>
                  <th className="sticky left-0 z-30 bg-background-elevated border border-amber-500/10 px-3 py-1.5" />
                  <th className="bg-background-elevated border border-amber-500/10 px-3 py-1.5" />
                  {ETAPA_COLS.map((col, i) => (
                    <>
                      <th key={`${i}-mat`} className={`border border-amber-500/10 px-3 py-1.5 text-left font-semibold tracking-widest ${col.headerCls}`} style={{ minWidth: '200px' }}>Materia</th>
                      <th key={`${i}-f`}   className={`border border-amber-500/10 px-3 py-1.5 text-left font-semibold tracking-widest ${col.headerCls}`} style={{ minWidth: '140px' }}>Fechas</th>
                    </>
                  ))}
                  <th className="bg-emerald-900/40 border border-amber-500/10 px-3 py-1.5 text-emerald-300/70 text-left font-semibold tracking-widest" style={{ minWidth: '130px' }}>Fecha fin</th>
                  <th className="bg-background-elevated border border-amber-500/10 px-3 py-1.5" />
                </tr>
              )}
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const etapaLow  = (row.etapaHoy || '').toLowerCase()
                const isActivo  = !['no iniciado', 'finalizado', 'sin datos'].includes(etapaLow)
                const isFin     = etapaLow === 'finalizado'
                const rowStripe = idx % 2 === 0 ? 'bg-background-card/60' : 'bg-background/60'

                return (
                  <tr key={row.id} className={`transition-colors hover:brightness-125 ${rowStripe}`}>
                    {/* F. Ingreso */}
                    <td className={`sticky left-0 z-10 border border-amber-500/10 px-3 py-2 font-bold whitespace-nowrap ${
                      isFin ? 'bg-emerald-950/40 text-emerald-400/70'
                        : isActivo ? 'bg-amber-950/50 text-amber-300'
                        : 'bg-background-card text-amber-500/50'
                    }`}>
                      {row.ingreso}
                      {isActivo && <span className="ml-2 text-[9px] opacity-50">●</span>}
                    </td>

                    {/* F. Fin */}
                    {!compact && (
                      <td className="border border-amber-500/10 px-3 py-2 text-text-muted whitespace-nowrap">
                        {row.fin}
                      </td>
                    )}

                    {/* Etapas */}
                    {row.etapas ? row.etapas.map((e, i) => {
                      const col = ETAPA_COLS[i]
                      const isCurrentEtapa = isActivo && etapaLow === e.label.toLowerCase()
                      return compact ? (
                        <td key={e.key} className={`border border-amber-500/10 px-3 py-2 ${col.rowCls} ${isCurrentEtapa ? 'ring-2 ring-inset ring-amber-400/40' : ''}`}>
                          <span className={isCurrentEtapa ? col.accentCls + ' font-bold' : 'text-text-muted'}>
                            {e.fechasStr}
                          </span>
                          {isCurrentEtapa && <div className="text-[9px] text-amber-400/60 mt-0.5">● HOY</div>}
                        </td>
                      ) : (
                        <>
                          <td key={`${e.key}-mat`} className={`border border-amber-500/10 px-3 py-2 ${col.rowCls} ${isCurrentEtapa ? 'ring-2 ring-inset ring-amber-400/30' : ''}`}>
                            <span className={isCurrentEtapa ? col.accentCls + ' font-semibold' : 'text-text-secondary'}>
                              {e.materia}
                            </span>
                            {isCurrentEtapa && <div className="text-[9px] text-amber-400/60 mt-0.5">● ACTIVO HOY</div>}
                          </td>
                          <td key={`${e.key}-f`} className={`border border-amber-500/10 px-3 py-2 whitespace-nowrap ${col.rowCls} ${isCurrentEtapa ? col.accentCls + ' font-semibold' : 'text-text-muted'}`}>
                            {e.fechasStr}
                          </td>
                        </>
                      )
                    }) : (
                      <td colSpan={compact ? 3 : 6} className="border border-amber-500/10 px-3 py-2 text-text-muted text-center">
                        sin datos
                      </td>
                    )}

                    {/* FINALIZADO */}
                    <td className={`border border-amber-500/10 px-3 py-2 text-center whitespace-nowrap ${
                      isFin ? 'bg-emerald-950/40' : 'bg-emerald-950/10'
                    }`}>
                      {isFin ? (
                        <span className="text-emerald-400 font-bold text-[10px]">✓ {row.fin}</span>
                      ) : (
                        <span className="text-emerald-800/60 text-[10px]">{row.fin}</span>
                      )}
                    </td>

                    {/* Etapa hoy */}
                    <td className="border border-amber-500/10 px-3 py-2 whitespace-nowrap">
                      <EtapaBadge etapa={row.etapaHoy} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddCohortModal
          onClose={() => setShowModal(false)}
          onSaved={() => { reload(); setShowModal(false) }}
        />
      )}
    </div>
  )
}
