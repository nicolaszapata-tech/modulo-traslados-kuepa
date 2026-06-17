import { useState, useMemo } from 'react'
import { getAllCohorts, calcEtapas, getEtapaHoy, deleteCohort, BASE_COHORTS } from '../../data/productiva'
import AddCohortModal from './AddCohortModal'

const ETAPA_COLS = [
  { label: 'ADAPTACIÓN', headerCls: 'bg-amber-900/80 text-amber-200', rowCls: 'bg-amber-950/25', accentCls: 'text-amber-300' },
  { label: 'DESEMPEÑO',  headerCls: 'bg-sky-900/80 text-sky-200',     rowCls: 'bg-sky-950/25',   accentCls: 'text-sky-300'   },
  { label: 'PROYECCIÓN', headerCls: 'bg-violet-900/80 text-violet-200',rowCls: 'bg-violet-950/25',accentCls: 'text-violet-300'},
]

const ETAPA_HOY_CLS = {
  'adaptación': 'text-amber-300 bg-amber-950/60 border-amber-700/40',
  'desempeño':  'text-sky-300 bg-sky-950/60 border-sky-700/40',
  'proyección': 'text-violet-300 bg-violet-950/60 border-violet-700/40',
  'finalizado': 'text-zinc-400 bg-zinc-800/40 border-zinc-700/30',
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
  const [showModal, setShowModal] = useState(false)
  const [cohorts,   setCohorts]   = useState(() => getAllCohorts())
  const [search,    setSearch]    = useState('')
  const [onlyHoy,   setOnlyHoy]   = useState(false)
  const [compact,   setCompact]   = useState(false)

  const reload = () => setCohorts(getAllCohorts())

  const rows = useMemo(() => cohorts.map(c => {
    const etapas   = calcEtapas(c.ingreso, c.fin)
    const etapaHoy = getEtapaHoy(c.ingreso, c.fin)
    const isBase   = BASE_COHORTS.some(b => b.id === c.id)
    return { ...c, etapas, etapaHoy, isBase }
  }), [cohorts])

  const filtered = useMemo(() => {
    let result = rows
    if (onlyHoy) result = result.filter(r => !['no iniciado', 'finalizado'].includes(r.etapaHoy.toLowerCase()))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(r =>
        r.ingreso.includes(q) || r.fin.includes(q) || r.etapaHoy.toLowerCase().includes(q)
      )
    }
    return result
  }, [rows, onlyHoy, search])

  const activoHoy = useMemo(() =>
    rows.filter(r => !['no iniciado', 'finalizado', 'sin datos'].includes(r.etapaHoy.toLowerCase())).length,
  [rows])

  const handleDelete = (id) => {
    deleteCohort(id)
    reload()
  }

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
          + Agregar Cohorte
        </button>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl text-text-primary uppercase tracking-wider mb-1">
          Malla <span className="text-amber-400">Productiva</span>
        </h1>
        <p className="text-text-muted text-xs font-mono">
          Distribución de etapas por fecha de ingreso a productiva — Adaptación · Desempeño · Proyección
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-56">
          <span className="text-text-muted text-[10px] font-mono tracking-widest uppercase shrink-0">Buscar</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="fecha ingreso, etapa..."
            className="flex-1 bg-background border border-amber-500/20 text-text-primary text-xs font-mono px-3 py-2 outline-none focus:border-amber-500/50 placeholder:text-text-muted"
          />
          {search && <button onClick={() => setSearch('')} className="text-text-muted hover:text-amber-400 font-mono text-sm px-1">✕</button>}
        </div>
        <button
          onClick={() => setOnlyHoy(!onlyHoy)}
          className={`flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
            onlyHoy ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-primary/20 text-text-muted hover:border-amber-500/40 hover:text-text-secondary'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${onlyHoy ? 'bg-amber-400 animate-pulse' : 'bg-text-muted'}`} />
          ACTIVOS HOY {onlyHoy && `(${activoHoy})`}
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
          {filtered.length} / {rows.length} cohortes
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="border border-amber-500/10 px-6 py-8 text-center text-text-muted font-mono text-sm">
          {onlyHoy ? 'No hay cohortes activas hoy.' : 'Sin resultados.'}
        </div>
      ) : (
        <div className="overflow-auto border border-amber-500/15" style={{ maxHeight: '65vh' }}>
          <table className="text-xs font-mono border-collapse" style={{ minWidth: compact ? '700px' : '1100px' }}>
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 bg-background-elevated border border-amber-500/15 px-3 py-2.5 text-left text-amber-400/80 uppercase tracking-widest whitespace-nowrap" style={{ minWidth: '140px' }}>
                  F. Ingreso Prod.
                </th>
                {!compact && (
                  <th className="bg-background-elevated border border-amber-500/15 px-3 py-2.5 text-left text-amber-400/80 uppercase tracking-widest whitespace-nowrap" style={{ minWidth: '130px' }}>
                    F. Fin Prod.
                  </th>
                )}
                {ETAPA_COLS.map((col, i) => (
                  compact ? (
                    <th key={i} className={`border border-amber-500/10 px-3 py-2.5 text-center uppercase tracking-widest whitespace-nowrap ${col.headerCls}`} style={{ minWidth: '180px' }}>
                      {col.label}
                    </th>
                  ) : (
                    <th key={i} colSpan={2} className={`border border-amber-500/10 px-3 py-2.5 text-center uppercase tracking-widest whitespace-nowrap font-bold ${col.headerCls}`} style={{ minWidth: '360px' }}>
                      {col.label}
                    </th>
                  )
                ))}
                <th className="bg-background-elevated border border-amber-500/15 px-3 py-2.5 text-left text-amber-400/80 uppercase tracking-widest whitespace-nowrap" style={{ minWidth: '120px' }}>
                  Etapa Hoy
                </th>
                <th className="bg-background-elevated border border-amber-500/15 px-3 py-2.5 whitespace-nowrap" style={{ minWidth: '40px' }} />
              </tr>
              {!compact && (
                <tr>
                  {/* spacer for sticky col + fin col */}
                  <th className="bg-background-elevated border border-amber-500/10 px-3 py-1.5 sticky left-0 z-30" />
                  <th className="bg-background-elevated border border-amber-500/10 px-3 py-1.5" />
                  {ETAPA_COLS.map((col, i) => (
                    <>
                      <th key={`${i}-mat`} className={`border border-amber-500/10 px-3 py-1.5 text-left font-semibold tracking-widest ${col.headerCls}`} style={{ minWidth: '200px' }}>Materia</th>
                      <th key={`${i}-f`}   className={`border border-amber-500/10 px-3 py-1.5 text-left font-semibold tracking-widest ${col.headerCls}`} style={{ minWidth: '160px' }}>Fechas</th>
                    </>
                  ))}
                  <th className="bg-background-elevated border border-amber-500/10 px-3 py-1.5" />
                  <th className="bg-background-elevated border border-amber-500/10 px-3 py-1.5" />
                </tr>
              )}
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const etapaLow   = (row.etapaHoy || '').toLowerCase()
                const isActivo   = !['no iniciado', 'finalizado', 'sin datos'].includes(etapaLow)
                const rowStripe  = idx % 2 === 0 ? 'bg-background-card/60' : 'bg-background/60'

                return (
                  <tr key={row.id} className={`transition-colors hover:brightness-125 ${rowStripe}`}>
                    {/* F. Ingreso */}
                    <td className={`sticky left-0 z-10 border border-amber-500/10 px-3 py-2 font-bold whitespace-nowrap ${
                      isActivo ? 'bg-amber-950/50 text-amber-300' : 'bg-background-card text-amber-500/60'
                    }`}>
                      {row.ingreso}
                      {isActivo && <span className="ml-2 text-[9px] opacity-60">●</span>}
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
                        <td key={e.key} className={`border border-amber-500/10 px-3 py-2 text-center ${col.rowCls} ${isCurrentEtapa ? 'ring-2 ring-inset ring-amber-400/50' : ''}`}>
                          <span className={`${isCurrentEtapa ? col.accentCls + ' font-bold' : 'text-text-muted'}`}>
                            {e.fechasStr}
                          </span>
                          {isCurrentEtapa && <div className="text-[9px] text-amber-400 opacity-70 mt-0.5">ACTIVO HOY</div>}
                        </td>
                      ) : (
                        <>
                          <td key={`${e.key}-mat`} className={`border border-amber-500/10 px-3 py-2 ${col.rowCls} ${isCurrentEtapa ? 'ring-2 ring-inset ring-amber-400/40' : ''}`}>
                            <span className={isCurrentEtapa ? col.accentCls + ' font-semibold' : 'text-text-secondary'}>
                              {e.materia}
                            </span>
                            {isCurrentEtapa && <div className="text-[9px] text-amber-400 opacity-60 mt-0.5">ACTIVO HOY</div>}
                          </td>
                          <td key={`${e.key}-f`} className={`border border-amber-500/10 px-3 py-2 whitespace-nowrap ${col.rowCls} ${isCurrentEtapa ? col.accentCls + ' font-semibold' : 'text-text-muted'}`}>
                            {e.fechasStr}
                          </td>
                        </>
                      )
                    }) : (
                      <td colSpan={compact ? 3 : 6} className="border border-amber-500/10 px-3 py-2 text-text-muted text-center">
                        sin datos de fecha
                      </td>
                    )}

                    {/* Etapa hoy */}
                    <td className="border border-amber-500/10 px-3 py-2 whitespace-nowrap">
                      <EtapaBadge etapa={row.etapaHoy} />
                    </td>

                    {/* Delete (solo cohorts extras) */}
                    <td className="border border-amber-500/10 px-2 py-2 text-center">
                      {!row.isBase && (
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="text-text-muted hover:text-red-400 font-mono text-[11px] transition-colors"
                          title="Eliminar cohorte"
                        >
                          ✕
                        </button>
                      )}
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
