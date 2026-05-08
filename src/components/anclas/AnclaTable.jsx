import { useMemo, useState } from 'react'
import { generateFullTable } from '../../engine/anchorEngine'
import { isActiveToday } from '../../utils/dateUtils'

const MODULE_SOLID_COLORS = [
  'bg-cyan-950 text-cyan-400',
  'bg-orange-950 text-orange-400',
  'bg-purple-950 text-purple-400',
  'bg-green-950 text-green-400',
  'bg-yellow-950 text-yellow-400',
  'bg-pink-950 text-pink-400',
  'bg-blue-950 text-blue-400',
  'bg-red-950 text-red-400',
]

const MODULE_ROW_COLORS = [
  'bg-cyan-950/40',
  'bg-orange-950/40',
  'bg-purple-950/40',
  'bg-green-950/40',
  'bg-yellow-950/40',
  'bg-pink-950/40',
  'bg-blue-950/40',
  'bg-red-950/40',
]

const ACTIVE_TODAY_RING = 'outline outline-2 outline-status-active'

export default function AnclaTable({ program, calendar }) {
  const [search, setSearch]           = useState('')
  const [compactMode, setCompactMode] = useState(false)
  const [todayFilter, setTodayFilter] = useState(false)

  const rows = useMemo(() => generateFullTable(program, calendar), [program, calendar])

  // Marca qué módulo está activo hoy en cada fila
  const rowsWithActive = useMemo(() =>
    rows.map((row) => {
      const activeModuleIdx = row.modules.findIndex((m) => isActiveToday(m.dates))
      return { ...row, activeModuleIdx }
    }),
  [rows])

  const filtered = useMemo(() => {
    let result = rowsWithActive

    // Filtro "hoy"
    if (todayFilter) {
      result = result.filter((r) => r.activeModuleIdx !== -1)
    }

    // Búsqueda por período, fecha de ingreso o materia
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (r) =>
          r.ingressPeriod.toLowerCase().includes(q) ||
          r.ingressDates.toLowerCase().includes(q) ||
          r.modules.some((m) => m.subject.toLowerCase().includes(q) || m.period.toLowerCase().includes(q))
      )
    }

    return result
  }, [rowsWithActive, search, todayFilter])

  const todayActiveCount = useMemo(
    () => rowsWithActive.filter((r) => r.activeModuleIdx !== -1).length,
    [rowsWithActive]
  )

  return (
    <div className="flex flex-col gap-4">

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-56">
          <span className="text-text-muted text-[10px] font-mono tracking-widest uppercase shrink-0">Buscar</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="período, fecha, materia..."
            className="flex-1 bg-background border border-primary/20 text-text-primary text-xs font-mono px-3 py-2 outline-none focus:border-primary/50 placeholder:text-text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-text-muted hover:text-primary font-mono text-sm px-1">✕</button>
          )}
        </div>

        {/* Hoy filter */}
        <button
          onClick={() => setTodayFilter(!todayFilter)}
          className={`flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
            todayFilter
              ? 'border-status-active bg-status-active/10 text-status-active'
              : 'border-primary/20 text-text-muted hover:border-primary/40 hover:text-text-secondary'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${todayFilter ? 'bg-status-active animate-pulse' : 'bg-text-muted'}`} />
          HOY {todayFilter && `(${todayActiveCount})`}
        </button>

        {/* Compact toggle */}
        <button
          onClick={() => setCompactMode(!compactMode)}
          className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
            compactMode
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-primary/20 text-text-muted hover:border-primary/40'
          }`}
        >
          {compactMode ? 'COMPACTA ✓' : 'COMPLETA'}
        </button>

        <span className="text-text-muted text-[10px] font-mono shrink-0">
          {filtered.length} / {rows.length} períodos
        </span>
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="border border-primary/10 px-6 py-8 text-center text-text-muted font-mono text-sm">
          {todayFilter
            ? 'No hay módulos activos hoy para este programa.'
            : 'Sin resultados para la búsqueda.'}
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="overflow-auto border border-primary/10" style={{ maxHeight: '65vh' }}>
          <table className="text-xs font-mono border-collapse" style={{ minWidth: compactMode ? '900px' : '1800px' }}>
            <thead className="sticky top-0 z-20">

              {/* Row 1: group headers */}
              <tr>
                <th
                  className="sticky left-0 z-30 bg-background-elevated border border-primary/20 px-3 py-2 text-left text-primary/80 uppercase tracking-widest whitespace-nowrap"
                  style={{ minWidth: '130px' }}
                  rowSpan={compactMode ? 1 : 2}
                >
                  Período de Ingreso
                </th>
                {!compactMode && (
                  <th
                    className="bg-background-elevated border border-primary/20 px-3 py-2 text-left text-primary/80 uppercase tracking-widest whitespace-nowrap"
                    style={{ minWidth: '180px' }}
                    rowSpan={2}
                  >
                    Fecha de Ingreso
                  </th>
                )}
                {Array.from({ length: 8 }, (_, i) => i + 1).map((mod) =>
                  compactMode ? (
                    <th
                      key={mod}
                      className={`border border-primary/10 px-3 py-2 text-center uppercase tracking-widest whitespace-nowrap ${MODULE_SOLID_COLORS[mod - 1]}`}
                      style={{ minWidth: '160px' }}
                    >
                      Módulo {mod}
                    </th>
                  ) : (
                    <th
                      key={mod}
                      colSpan={3}
                      className={`border border-primary/10 px-3 py-2 text-center uppercase tracking-widest whitespace-nowrap font-bold ${MODULE_SOLID_COLORS[mod - 1]}`}
                      style={{ minWidth: '480px' }}
                    >
                      Módulo {mod}
                    </th>
                  )
                )}
              </tr>

              {/* Row 2: sub-headers */}
              {!compactMode && (
                <tr>
                  {Array.from({ length: 8 }, (_, i) => (
                    <>
                      <th key={`m${i}-s`} className={`border border-primary/10 px-3 py-2 text-left font-semibold tracking-widest ${MODULE_SOLID_COLORS[i]}`} style={{ minWidth: '220px' }}>Materia</th>
                      <th key={`m${i}-p`} className={`border border-primary/10 px-3 py-2 text-left font-semibold tracking-widest ${MODULE_SOLID_COLORS[i]}`} style={{ minWidth: '100px' }}>Período</th>
                      <th key={`m${i}-f`} className={`border border-primary/10 px-3 py-2 text-left font-semibold tracking-widest ${MODULE_SOLID_COLORS[i]}`} style={{ minWidth: '160px' }}>Fechas</th>
                    </>
                  ))}
                </tr>
              )}
            </thead>

            <tbody>
              {filtered.map((row, rowIdx) => {
                const isActiveRow = row.activeModuleIdx !== -1
                return (
                  <tr
                    key={row.ingressPeriod}
                    className={`transition-colors hover:brightness-125 ${
                      isActiveRow && todayFilter ? 'ring-1 ring-status-active/30' : ''
                    } ${rowIdx % 2 === 0 ? 'bg-background-card/60' : 'bg-background/60'}`}
                  >
                    {/* Período ingreso */}
                    <td className={`sticky left-0 z-10 border border-primary/10 px-3 py-2 font-bold whitespace-nowrap ${
                      isActiveRow && todayFilter ? 'bg-[#0d2b1a] text-status-active' : 'bg-background-card text-primary'
                    }`}>
                      {row.ingressPeriod}
                      {isActiveRow && todayFilter && <span className="ml-2 text-[9px] font-mono opacity-70">● HOY</span>}
                    </td>

                    {/* Fecha ingreso */}
                    {!compactMode && (
                      <td className="bg-background-elevated border border-primary/10 px-3 py-2 text-text-secondary whitespace-nowrap font-medium">
                        {row.ingressDates}
                      </td>
                    )}

                    {/* Módulos */}
                    {row.modules.map((mod, modIdx) => {
                      const isActive = todayFilter && modIdx === row.activeModuleIdx
                      const isSpecial = mod.subject === 'MÓDULO ALPHA' || mod.subject === 'MÓDULO OMEGA'
                      const rowBg = MODULE_ROW_COLORS[mod.moduleNumber - 1]
                      const activeHighlight = isActive ? 'ring-2 ring-inset ring-status-active' : ''

                      return compactMode ? (
                        <td
                          key={mod.moduleNumber}
                          className={`border border-primary/10 px-3 py-2 text-center ${rowBg} ${activeHighlight} ${
                            isSpecial ? 'text-primary font-bold tracking-wider' : 'text-text-secondary'
                          } ${isActive ? 'text-status-active font-bold' : ''}`}
                        >
                          {mod.subject}
                          {isActive && <div className="text-[9px] text-status-active opacity-70 mt-0.5">ACTIVO HOY</div>}
                        </td>
                      ) : (
                        <>
                          <td key={`${mod.moduleNumber}-s`} className={`border border-primary/10 px-3 py-2 ${rowBg} ${activeHighlight} ${
                            isActive ? 'text-status-active font-bold' : isSpecial ? 'text-primary font-bold tracking-wider' : 'text-text-secondary'
                          }`}>
                            {mod.subject}
                            {isActive && <div className="text-[9px] text-status-active opacity-70 mt-0.5">ACTIVO HOY</div>}
                          </td>
                          <td key={`${mod.moduleNumber}-p`} className={`border border-primary/10 px-3 py-2 whitespace-nowrap ${rowBg} ${isActive ? 'text-status-active font-bold' : 'text-text-muted'}`}>
                            {mod.period}
                          </td>
                          <td key={`${mod.moduleNumber}-f`} className={`border border-primary/10 px-3 py-2 whitespace-nowrap ${rowBg} ${isActive ? 'text-status-active font-bold' : 'text-text-muted'}`}>
                            {mod.dates}
                          </td>
                        </>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
