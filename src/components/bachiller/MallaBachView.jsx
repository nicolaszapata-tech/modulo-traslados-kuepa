import { useState, useMemo, useRef, useEffect } from 'react'
import { PROGRAMAS_BACH, COLOR_GRADO, MATERIAS_BASE } from '../../data/calendarBach'
import { getAnchorRows, parseFecha, parseRango, fmtFecha, construirSecuencia, getGradoActual } from '../../engine/anchorEngineBach'
import GestionFechasBach from './GestionFechasBach'

const GRADOS = [6, 7, 8, 9, 10, 11]

function gradoToAnclas(programa) {
  return programa.tipo === 'flex'
    ? GRADOS.map(g => ({ grado: g, cal: 'V_VI' }))
    : [
        { grado: 6,  cal: 'III_IV' },
        { grado: 7,  cal: 'III_IV' },
        { grado: 8,  cal: 'III_IV' },
        { grado: 9,  cal: 'III_IV' },
        { grado: 10, cal: 'V_VI'   },
        { grado: 11, cal: 'V_VI'   },
      ]
}

function CalTag({ cal }) {
  return (
    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
      cal === 'V_VI'
        ? 'bg-amber-900/60 text-amber-400 border border-amber-700/40'
        : 'bg-cyan-900/60 text-cyan-400 border border-cyan-700/40'
    }`}>
      {cal}
    </span>
  )
}

function calcEstadoSim(rango, hoy) {
  if (!rango) return 'PENDIENTE'
  if (rango.fin < hoy) return 'COMPLETADO'
  if (rango.inicio <= hoy && hoy <= rango.fin) return 'EN CURSO'
  return 'PENDIENTE'
}

export default function MallaBachView({ onBack }) {
  // ── Malla tab ──
  const [progIdx, setProgIdx]   = useState(0)
  const [grado, setGrado]       = useState(6)
  const [busqueda, setBusqueda] = useState('')
  const [soloHoy, setSoloHoy]   = useState(false)

  // ── Tab activo ──
  const [activeTab, setActiveTab] = useState('malla')

  // ── Modal gestión de fechas ──
  const [showGestion, setShowGestion] = useState(false)

  // ── Refresh key: fuerza re-cómputo cuando se guardan nuevas fechas ──
  const [refreshKey, setRefreshKey] = useState(0)

  // ── Simulador tab ──
  const [simProgIdx, setSimProgIdx]     = useState(0)
  const [simGrado, setSimGrado]         = useState(6)
  const [simFecha, setSimFecha]         = useState('')
  const [simResult, setSimResult]       = useState(null)
  const [simError, setSimError]         = useState('')
  const [showDateList, setShowDateList] = useState(false)
  const dateListRef                     = useRef(null)

  // Cierra datepicker al clicar fuera
  useEffect(() => {
    function onDown(e) {
      if (dateListRef.current && !dateListRef.current.contains(e.target)) {
        setShowDateList(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // ── Malla derivados ──
  const programa   = PROGRAMAS_BACH[progIdx]
  const anclasList = gradoToAnclas(programa)
  const ancla      = anclasList.find(a => a.grado === grado)
  const col        = COLOR_GRADO[grado]

  const hoy = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  const rows = useMemo(() => {
    if (!ancla) return []
    return getAnchorRows(grado, ancla.cal)
  }, [grado, ancla, refreshKey])

  // Más recientes primero, manteniendo número de ciclo original
  const rowsOrdenadas = useMemo(() =>
    [...rows].map((r, i) => ({ ...r, cicloNum: i + 1 })).reverse(),
    [rows]
  )

  function esHoy(row) {
    if (!row.materias[0]?.rango) return false
    const inicio = row.materias[0].rango.inicio
    const findFin = () => {
      for (let i = row.materias.length - 1; i >= 0; i--) {
        if (row.materias[i].rango) return row.materias[i].rango.fin
      }
      return null
    }
    const fin = findFin()
    return fin && hoy >= inicio && hoy <= fin
  }

  const cicloActualNum = useMemo(() => {
    const idx = rows.findIndex(r => esHoy(r))
    return idx >= 0 ? idx + 1 : -1
  }, [rows, hoy])

  const filtradas = useMemo(() => {
    let result = rowsOrdenadas
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      result = result.filter(r =>
        r.rangoStr.toLowerCase().includes(q) ||
        r.materias.some(m => m.materia.toLowerCase().includes(q))
      )
    }
    if (soloHoy) {
      result = result.filter(r => esHoy(r))
    }
    return result
  }, [rowsOrdenadas, busqueda, soloHoy])

  // ── Simulador: fechas disponibles ──
  const simAnclaForGrado = useMemo(() => {
    const anclas = gradoToAnclas(PROGRAMAS_BACH[simProgIdx])
    return anclas.find(a => a.grado === simGrado)
  }, [simProgIdx, simGrado])

  const simFechasDisponibles = useMemo(() => {
    if (!simAnclaForGrado) return []
    return getAnchorRows(simGrado, simAnclaForGrado.cal)
      .map(r => {
        const rango = parseRango(r.rangoStr)
        return rango ? fmtFecha(rango.inicio) : null
      })
      .filter(Boolean)
  }, [simGrado, simAnclaForGrado, refreshKey])

  const simFechasFiltradas = useMemo(() => {
    if (!simFecha.trim()) return simFechasDisponibles
    return simFechasDisponibles.filter(f => f.includes(simFecha.trim()))
  }, [simFechasDisponibles, simFecha])

  // ── Simulador logic ──
  function handleSimular() {
    setSimError('')
    setSimResult(null)
    const fecha = parseFecha(simFecha)
    if (!fecha) { setSimError('Fecha inválida. Usa formato dd/mm/yyyy'); return }
    const prog   = PROGRAMAS_BACH[simProgIdx]
    const anclas = gradoToAnclas(prog)
    const seq    = construirSecuencia(simGrado, fecha, anclas)
    if (seq.length === 0) { setSimError('No se encontró secuencia para esa fecha de ingreso'); return }
    const hoyD       = new Date(); hoyD.setHours(0,0,0,0)
    const gradoActual = getGradoActual(simGrado, fecha, anclas)
    const items       = seq.map(item => ({ ...item, estado: calcEstadoSim(item.rango, hoyD) }))
    setSimResult({ items, gradoActual })
  }

  const simCounts = useMemo(() => {
    if (!simResult) return null
    return {
      ok:   simResult.items.filter(i => i.estado === 'COMPLETADO').length,
      enc:  simResult.items.filter(i => i.estado === 'EN CURSO').length,
      pend: simResult.items.filter(i => i.estado === 'PENDIENTE').length,
    }
  }, [simResult])

  return (
    <>
    <div className="scanline min-h-full">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-primary transition-colors">
            ‹ BACHILLER KUEPA
          </button>
          <span className="text-primary/20 font-mono">|</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-primary">MALLA CURRICULAR BACH</span>
        </div>

        <div className="mb-6">
          <h1 className="font-display font-black text-3xl uppercase tracking-wider text-text-primary mb-1">
            Malla Curricular <span className="text-primary">Bachillerato</span>
          </h1>
          <p className="text-text-secondary text-sm font-mono">
            Rotación de materias por grado y programa · 60 ciclos 2022-2027 · Tolerancia ±1 día
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-0 mb-8 border-b border-zinc-700/50">
          <button
            onClick={() => setActiveTab('malla')}
            className={`px-5 py-2.5 text-[11px] font-mono tracking-widest uppercase border-b-2 transition-all duration-200 ${
              activeTab === 'malla'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            TABLA ANCLA
          </button>
          <button
            onClick={() => setActiveTab('simulador')}
            className={`px-5 py-2.5 text-[11px] font-mono tracking-widest uppercase border-b-2 transition-all duration-200 ${
              activeTab === 'simulador'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            SIMULADOR
          </button>
        </div>

        {/* ═══════════ MALLA TAB ═══════════ */}
        {activeTab === 'malla' && (
          <>
            <div className="flex flex-col gap-4 mb-6">

              {/* Programa */}
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted mb-2 block">PROGRAMA</span>
                <div className="flex flex-wrap gap-2">
                  {PROGRAMAS_BACH.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setProgIdx(i)}
                      className={`px-4 py-2 text-[11px] font-mono tracking-wider uppercase border transition-all duration-200 ${
                        progIdx === i
                          ? 'border-primary/70 bg-primary/15 text-primary'
                          : 'border-zinc-700/50 text-text-muted hover:border-primary/40 hover:text-text-secondary'
                      }`}
                    >
                      {p.nombre.replace('Bachillerato ', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grado */}
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted mb-2 block">GRADO</span>
                <div className="flex flex-wrap gap-2">
                  {GRADOS.map(g => (
                    <button
                      key={g}
                      onClick={() => setGrado(g)}
                      className={`px-4 py-2 text-[11px] font-mono tracking-wider uppercase border transition-all duration-200 ${
                        grado === g
                          ? `${COLOR_GRADO[g].header} border-transparent`
                          : 'border-zinc-700/50 text-text-muted hover:border-zinc-500/50 hover:text-text-secondary'
                      }`}
                    >
                      Grado {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Búsqueda + HOY + Gestión Fechas + info */}
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar fecha, materia..."
                  className="bg-background-card border border-zinc-700/50 text-text-primary text-sm font-mono px-3 py-2 placeholder-text-muted focus:border-primary/60 focus:outline-none w-64"
                />
                {/* Botón HOY */}
                <button
                  onClick={() => setSoloHoy(h => !h)}
                  className={`px-4 py-2 text-[11px] font-mono tracking-wider uppercase border transition-all duration-200 ${
                    soloHoy
                      ? 'border-emerald-500/70 bg-emerald-900/40 text-emerald-400'
                      : 'border-zinc-600/50 text-text-muted hover:border-emerald-600/50 hover:text-emerald-400'
                  }`}
                >
                  {soloHoy ? '✓ HOY (activo)' : 'HOY'}
                </button>
                {/* Botón Gestión de Fechas */}
                <button
                  onClick={() => setShowGestion(true)}
                  className="px-4 py-2 text-[11px] font-mono tracking-wider uppercase border border-primary/30 text-primary/70 hover:border-primary hover:text-primary transition-all duration-200"
                >
                  + Gestión de Fechas
                </button>
                {soloHoy && (
                  <span className="text-[10px] font-mono text-emerald-400/70">
                    Mostrando solo el ciclo activo hoy — clic en HOY para quitar el filtro
                  </span>
                )}
                {!soloHoy && (
                  <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
                    <span>CALENDARIO</span>
                    {ancla && <CalTag cal={ancla.cal} />}
                    <span className="ml-1">{filtradas.length} filas · más recientes primero</span>
                    {cicloActualNum >= 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-emerald-900/50 border border-emerald-700/40 text-emerald-400">
                        CICLO ACTUAL: #{cicloActualNum}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm font-mono">
                <thead>
                  <tr className={col.header}>
                    <th className="px-3 py-3 text-left text-[10px] tracking-widest font-semibold uppercase border-b border-white/10 w-16">CICLO</th>
                    <th className="px-3 py-3 text-left text-[10px] tracking-widest font-semibold uppercase border-b border-white/10 min-w-[170px]">FECHA INGRESO</th>
                    {MATERIAS_BASE[grado]?.map((_, j) => (
                      <th key={j} className="px-3 py-3 text-left text-[10px] tracking-widest font-semibold uppercase border-b border-white/10">
                        MATERIA {j + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((row, i) => {
                    const actual = esHoy(row)
                    return (
                      <tr
                        key={row.cicloNum}
                        className={`border-b transition-colors ${
                          actual
                            ? 'border-emerald-700/50 bg-emerald-950/70'
                            : i % 2 === 0
                              ? `${col.stripe} border-zinc-800/40`
                              : 'border-zinc-800/40'
                        } hover:bg-zinc-700/20`}
                      >
                        <td className="px-3 py-2.5 text-text-muted text-[11px]">#{row.cicloNum}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={actual ? 'text-emerald-300 font-semibold' : 'text-text-secondary'}>
                              {row.rangoStr}
                            </span>
                            {actual && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-900/70 border border-emerald-600/50 text-emerald-400">HOY</span>
                            )}
                          </div>
                        </td>
                        {row.materias.map((mat, j) => (
                          <td key={j} className="px-3 py-2.5">
                            <div className={`text-[12px] ${actual ? 'text-emerald-200' : 'text-text-primary'}`}>{mat.materia}</div>
                            <div className="text-[10px] text-text-muted">{mat.fechaStr}</div>
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                  {filtradas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-text-muted text-sm font-mono">
                        {soloHoy
                          ? 'No hay ciclo activo hoy para este grado y programa.'
                          : `Sin resultados para "${busqueda}"`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-mono text-text-muted">
              <span>· Rotación circular: (ciclo + posición) % 5</span>
              <span>· Cada fila = un ciclo de ingreso · Más recientes primero</span>
              <span>· Materias se desplazan una posición cada ciclo</span>
            </div>
          </>
        )}

        {/* ═══════════ SIMULADOR TAB ═══════════ */}
        {activeTab === 'simulador' && (
          <div>
            <div className="bg-background-card border border-zinc-700/40 p-6 mb-6">
              <h2 className="text-[11px] font-mono tracking-[0.4em] uppercase text-secondary mb-5">
                DATOS DEL ESTUDIANTE
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">

                {/* Grado */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-text-muted mb-2 block">
                    GRADO DE INGRESO
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {GRADOS.map(g => (
                      <button
                        key={g}
                        onClick={() => { setSimGrado(g); setSimFecha(''); setShowDateList(false) }}
                        className={`px-3 py-1.5 text-[11px] font-mono border transition-all duration-200 ${
                          simGrado === g
                            ? `${COLOR_GRADO[g].header} border-transparent`
                            : 'border-zinc-700/50 text-text-muted hover:border-zinc-500/50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fecha con selector de fechas disponibles */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-text-muted mb-2 block">
                    FECHA DE INGRESO
                    <span className="ml-2 text-zinc-600 normal-case tracking-normal">
                      {simFechasDisponibles.length} fechas disponibles
                    </span>
                  </label>
                  <div className="relative" ref={dateListRef}>
                    <div className="flex">
                      <input
                        type="text"
                        value={simFecha}
                        onChange={e => { setSimFecha(e.target.value); setShowDateList(true) }}
                        onFocus={() => setShowDateList(true)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { setShowDateList(false); handleSimular() }
                          if (e.key === 'Escape') setShowDateList(false)
                        }}
                        placeholder="dd/mm/yyyy"
                        className="flex-1 bg-background border border-zinc-700/50 text-text-primary text-sm font-mono px-3 py-2 placeholder-text-muted focus:border-secondary/60 focus:outline-none min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDateList(d => !d)}
                        title="Ver fechas disponibles"
                        className={`flex-shrink-0 border border-l-0 px-3 py-2 text-sm font-mono transition-colors ${
                          showDateList
                            ? 'border-secondary/60 text-secondary bg-secondary/10'
                            : 'border-zinc-700/50 text-text-muted hover:text-secondary hover:border-secondary/40'
                        }`}
                      >
                        ▾
                      </button>
                    </div>

                    {showDateList && (
                      <div className="absolute top-full mt-0.5 left-0 right-0 z-50 bg-zinc-900 border border-zinc-700/60 max-h-56 overflow-y-auto shadow-2xl">
                        {simFechasFiltradas.length > 0 ? (
                          simFechasFiltradas.map(f => (
                            <div
                              key={f}
                              onClick={() => { setSimFecha(f); setShowDateList(false) }}
                              className={`px-3 py-1.5 text-[11px] font-mono cursor-pointer hover:bg-zinc-800 flex items-center justify-between ${
                                f === simFecha ? 'text-secondary bg-secondary/10' : 'text-text-secondary'
                              }`}
                            >
                              <span>{f}</span>
                              {f === simFecha && <span className="text-[9px] text-secondary">✓</span>}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-3 text-[11px] font-mono text-text-muted text-center">
                            Sin coincidencias para "{simFecha}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Programa */}
                <div>
                  <label className="text-[10px] font-mono tracking-widest uppercase text-text-muted mb-2 block">
                    PROGRAMA
                  </label>
                  <div className="flex flex-col gap-1">
                    {PROGRAMAS_BACH.map((p, i) => (
                      <button
                        key={p.id}
                        onClick={() => { setSimProgIdx(i); setSimFecha(''); setShowDateList(false) }}
                        className={`px-3 py-1.5 text-left text-[11px] font-mono border transition-all duration-200 ${
                          simProgIdx === i
                            ? 'border-secondary/70 bg-secondary/10 text-secondary'
                            : 'border-zinc-700/50 text-text-muted hover:border-secondary/30 hover:text-text-secondary'
                        }`}
                      >
                        {p.nombre.replace('Bachillerato ', '')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSimular}
                className="px-8 py-2.5 text-[11px] font-mono uppercase tracking-[0.3em] border border-secondary bg-secondary/10 text-secondary hover:bg-secondary hover:text-background transition-all duration-200 active:scale-95"
              >
                SIMULAR
              </button>
              {simError && (
                <p className="mt-3 text-[11px] font-mono text-red-400">{simError}</p>
              )}
            </div>

            {/* Resultados */}
            {simResult && (
              <>
                <div className="bg-secondary/10 border border-secondary/40 px-5 py-4 mb-5 flex flex-wrap items-center gap-6">
                  <div>
                    <span className="text-[9px] font-mono tracking-widest uppercase text-secondary/60 block mb-0.5">GRADO ACTUAL HOY</span>
                    <span className="text-xl font-display font-black text-secondary uppercase">{simResult.gradoActual}</span>
                  </div>
                  <div className="h-8 w-px bg-secondary/20" />
                  <div className="flex gap-5 text-[11px] font-mono">
                    <span className="text-emerald-400">✓ {simCounts.ok} completadas</span>
                    <span className="text-amber-400">▶ {simCounts.enc} en curso</span>
                    <span className="text-zinc-500">⌛ {simCounts.pend} pendientes</span>
                  </div>
                  <div className="ml-auto text-[9px] font-mono text-text-muted uppercase tracking-widest">
                    {simResult.items.length} materias · {PROGRAMAS_BACH[simProgIdx].nombre.replace('Bachillerato ', '')}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm font-mono">
                    <thead>
                      <tr className="bg-zinc-800/60">
                        <th className="px-3 py-3 text-left text-[10px] tracking-widest font-semibold uppercase border-b border-white/10 w-10">#</th>
                        <th className="px-3 py-3 text-left text-[10px] tracking-widest font-semibold uppercase border-b border-white/10 w-24">GRADO</th>
                        <th className="px-3 py-3 text-left text-[10px] tracking-widest font-semibold uppercase border-b border-white/10">MATERIA</th>
                        <th className="px-3 py-3 text-left text-[10px] tracking-widest font-semibold uppercase border-b border-white/10">F. INICIO</th>
                        <th className="px-3 py-3 text-left text-[10px] tracking-widest font-semibold uppercase border-b border-white/10">F. FIN</th>
                        <th className="px-3 py-3 text-left text-[10px] tracking-widest font-semibold uppercase border-b border-white/10">ESTADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simResult.items.map((item, i) => {
                        const enCurso    = item.estado === 'EN CURSO'
                        const completado = item.estado === 'COMPLETADO'
                        const cg         = COLOR_GRADO[item.grado]
                        return (
                          <tr
                            key={i}
                            className={`border-b transition-colors ${
                              enCurso
                                ? 'border-amber-700/50 bg-amber-950/60'
                                : i % 2 === 0
                                  ? `${cg?.stripe || ''} border-zinc-800/40`
                                  : 'border-zinc-800/40'
                            } hover:bg-zinc-700/20`}
                          >
                            <td className="px-3 py-2 text-text-muted text-[11px]">{i + 1}</td>
                            <td className="px-3 py-2">
                              <span className={`text-[10px] px-1.5 py-0.5 font-semibold ${cg?.header || 'text-text-muted'}`}>
                                {item.grado}°
                              </span>
                            </td>
                            <td className={`px-3 py-2 text-[12px] ${
                              enCurso    ? 'text-amber-200 font-semibold' :
                              completado ? 'text-text-muted'              : 'text-text-primary'
                            }`}>
                              {item.materia}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-text-secondary">
                              {item.rango ? fmtFecha(item.rango.inicio) : '—'}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-text-secondary">
                              {item.rango ? fmtFecha(item.rango.fin) : '—'}
                            </td>
                            <td className="px-3 py-2">
                              {completado && <span className="text-[10px] font-mono text-emerald-500">✓ COMPLETADO</span>}
                              {enCurso    && <span className="text-[10px] font-mono text-amber-400 font-semibold">▶ EN CURSO</span>}
                              {item.estado === 'PENDIENTE' && <span className="text-[10px] font-mono text-zinc-500">⌛ PENDIENTE</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>

    {/* Modal gestión de fechas Bach */}
    {showGestion && (
      <GestionFechasBach
        onClose={() => setShowGestion(false)}
        onSaved={() => setRefreshKey(k => k + 1)}
      />
    )}
    </>
  )
}
