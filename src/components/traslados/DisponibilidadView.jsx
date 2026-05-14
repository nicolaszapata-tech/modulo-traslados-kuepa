import { useState, useMemo, useEffect } from 'react'
import { PROGRAMS } from '../../data/programs'

const WEBHOOK_URL = 'https://n8n.kuepa.com/webhook/disponibilidad-grupos-etdh'

// ── Color map por programa ─────────────────────────────────────────────────────
const PROGRAM_COLORS = {
  TLAA:  { text: 'text-cyan-400',   tabActive: 'text-cyan-400 border-cyan-400',     pillOff: 'border-cyan-500/30 text-cyan-400/50 hover:border-cyan-500/60 hover:text-cyan-400',   pillOn: 'border-cyan-400 bg-cyan-400/10 text-cyan-300',   dot: 'bg-cyan-400' },
  TLMV:  { text: 'text-orange-400', tabActive: 'text-orange-400 border-orange-400', pillOff: 'border-orange-500/30 text-orange-400/50 hover:border-orange-500/60 hover:text-orange-400', pillOn: 'border-orange-400 bg-orange-400/10 text-orange-300', dot: 'bg-orange-400' },
  TLCF:  { text: 'text-green-400',  tabActive: 'text-green-400 border-green-400',   pillOff: 'border-green-500/30 text-green-400/50 hover:border-green-500/60 hover:text-green-400',   pillOn: 'border-green-400 bg-green-400/10 text-green-300',   dot: 'bg-green-400' },
  TLPDD: { text: 'text-purple-400', tabActive: 'text-purple-400 border-purple-400', pillOff: 'border-purple-500/30 text-purple-400/50 hover:border-purple-500/60 hover:text-purple-400', pillOn: 'border-purple-400 bg-purple-400/10 text-purple-300', dot: 'bg-purple-400' },
}

// ── Calendario completo de períodos ───────────────────────────────────────────
const PERIODOS_CAL = [
  // 2025
  {n:'ENE I',    i:'2025-01-09',f:'2025-01-14',y:2025},{n:'ENE II',   i:'2025-01-16',f:'2025-01-29',y:2025},
  {n:'FEB I',    i:'2025-02-03',f:'2025-02-14',y:2025},{n:'FEB II',   i:'2025-02-17',f:'2025-02-28',y:2025},
  {n:'MAR I',    i:'2025-03-03',f:'2025-03-14',y:2025},{n:'MAR II',   i:'2025-03-17',f:'2025-03-31',y:2025},
  {n:'ABR I',    i:'2025-04-02',f:'2025-04-15',y:2025},{n:'ABR II',   i:'2025-04-16',f:'2025-05-02',y:2025},
  {n:'MAY I',    i:'2025-05-05',f:'2025-05-16',y:2025},{n:'MAY II',   i:'2025-05-19',f:'2025-05-30',y:2025},
  {n:'JUN I',    i:'2025-06-03',f:'2025-06-16',y:2025},{n:'JUN II',   i:'2025-06-17',f:'2025-07-02',y:2025},
  {n:'JUL I',    i:'2025-07-03',f:'2025-07-16',y:2025},{n:'JUL II',   i:'2025-07-17',f:'2025-07-30',y:2025},
  {n:'AGO I',    i:'2025-08-01',f:'2025-08-15',y:2025},{n:'AGO II',   i:'2025-08-19',f:'2025-09-01',y:2025},
  {n:'SEP I',    i:'2025-09-02',f:'2025-09-15',y:2025},{n:'SEP II',   i:'2025-09-16',f:'2025-09-29',y:2025},
  {n:'OCT I',    i:'2025-10-01',f:'2025-10-15',y:2025},{n:'OCT II',   i:'2025-10-16',f:'2025-10-29',y:2025},
  {n:'NOV I',    i:'2025-10-30',f:'2025-11-13',y:2025},{n:'NOV II',   i:'2025-11-14',f:'2025-11-28',y:2025},
  {n:'DIC I',    i:'2025-12-01',f:'2025-12-15',y:2025},{n:'DIC II',   i:'2025-12-16',f:'2025-12-19',y:2025},
  // 2026
  {n:'ENE I 2026', i:'2026-01-13',f:'2026-01-17',y:2026},{n:'ENE II 2026',i:'2026-01-19',f:'2026-01-30',y:2026},
  {n:'FEB I 2026', i:'2026-02-02',f:'2026-02-13',y:2026},{n:'FEB II 2026',i:'2026-02-16',f:'2026-02-27',y:2026},
  {n:'MAR I 2026', i:'2026-03-02',f:'2026-03-13',y:2026},{n:'MAR II 2026',i:'2026-03-16',f:'2026-03-30',y:2026},
  {n:'ABR I 2026', i:'2026-03-31',f:'2026-04-16',y:2026},{n:'ABR II 2026',i:'2026-04-17',f:'2026-04-30',y:2026},
  {n:'MAY I 2026', i:'2026-05-04',f:'2026-05-15',y:2026},{n:'MAY II 2026',i:'2026-05-19',f:'2026-05-29',y:2026},
  {n:'JUN I 2026', i:'2026-06-02',f:'2026-06-17',y:2026},{n:'JUN II 2026',i:'2026-06-18',f:'2026-07-02',y:2026},
  {n:'JUL I 2026', i:'2026-07-03',f:'2026-07-16',y:2026},{n:'JUL II 2026',i:'2026-07-17',f:'2026-07-31',y:2026},
  {n:'AGO I 2026', i:'2026-08-03',f:'2026-08-18',y:2026},{n:'AGO II 2026',i:'2026-08-19',f:'2026-09-01',y:2026},
  {n:'SEP I 2026', i:'2026-09-02',f:'2026-09-15',y:2026},{n:'SEP II 2026',i:'2026-09-16',f:'2026-09-29',y:2026},
  {n:'OCT I 2026', i:'2026-10-01',f:'2026-10-15',y:2026},{n:'OCT II 2026',i:'2026-10-16',f:'2026-10-29',y:2026},
  {n:'NOV I 2026', i:'2026-11-03',f:'2026-11-17',y:2026},{n:'NOV II 2026',i:'2026-11-18',f:'2026-12-01',y:2026},
  {n:'DIC I 2026', i:'2026-12-02',f:'2026-12-16',y:2026},{n:'DIC II 2026',i:'2026-12-17',f:'2026-12-23',y:2026},
  // 2027
  {n:'ENE I 2027', i:'2027-01-12',f:'2027-01-15',y:2027},{n:'ENE II 2027',i:'2027-01-18',f:'2027-01-29',y:2027},
  {n:'FEB I 2027', i:'2027-02-01',f:'2027-02-12',y:2027},{n:'FEB II 2027',i:'2027-02-15',f:'2027-02-26',y:2027},
  {n:'MAR I 2027', i:'2027-03-01',f:'2027-03-12',y:2027},{n:'MAR II 2027',i:'2027-03-15',f:'2027-03-29',y:2027},
  {n:'ABR I 2027', i:'2027-03-30',f:'2027-04-15',y:2027},{n:'ABR II 2027',i:'2027-04-16',f:'2027-04-29',y:2027},
]

const AVAILABLE_YEARS = [2025, 2026, 2027]

// ── Helpers ────────────────────────────────────────────────────────────────────
function findPeriodForDate(startDateStr) {
  if (!startDateStr) return null
  const parts = startDateStr.split('/')
  if (parts.length !== 3) return null
  const d = parseInt(parts[0]), m = parseInt(parts[1]), y = parseInt(parts[2])
  const target = new Date(y, m - 1, d)
  for (const p of PERIODOS_CAL) {
    const [iy, im, id] = p.i.split('-').map(Number)
    const [fy, fm, fd] = p.f.split('-').map(Number)
    if (target >= new Date(iy, im - 1, id) && target <= new Date(fy, fm - 1, fd)) return p.n
  }
  return null
}

function getProgramId(programName) {
  if (!programName) return null
  if (/Auxiliar Administrativo/i.test(programName)) return 'TLAA'
  if (/Mercadeo|Ventas|Venta/i.test(programName))   return 'TLMV'
  if (/Contabilidad/i.test(programName))             return 'TLCF'
  if (/Digitaci|Procesamiento/i.test(programName))   return 'TLPDD'
  return null
}

// ── Componente ─────────────────────────────────────────────────────────────────
export default function DisponibilidadView({ onBack }) {
  const [rawData,         setRawData]         = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)
  const [selectedProgram, setSelectedProgram] = useState(PROGRAMS[0].id)
  const [selectedYear,    setSelectedYear]    = useState(2026)
  const [selectedPeriod,  setSelectedPeriod]  = useState(null)

  useEffect(() => {
    fetch(WEBHOOK_URL)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(data => {
        setRawData(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        setError(String(err))
        setLoading(false)
      })
  }, [])

  const enrichedData = useMemo(() =>
    rawData.map(row => ({
      ...row,
      programId: getProgramId(row.program_name),
      period:    findPeriodForDate(row.start_date),
    }))
  , [rawData])

  const programData = useMemo(() =>
    enrichedData.filter(r => r.programId === selectedProgram)
  , [enrichedData, selectedProgram])

  const yearPeriods = useMemo(() =>
    PERIODOS_CAL.filter(p => p.y === selectedYear)
  , [selectedYear])

  const periodsWithData = useMemo(() => {
    const set = new Set()
    programData.forEach(r => { if (r.period) set.add(r.period) })
    return set
  }, [programData])

  const effectivePeriod = useMemo(() => {
    if (selectedPeriod && yearPeriods.some(p => p.n === selectedPeriod)) return selectedPeriod
    const firstWithData = yearPeriods.find(p => periodsWithData.has(p.n))
    return firstWithData ? firstWithData.n : (yearPeriods[0]?.n ?? null)
  }, [selectedPeriod, yearPeriods, periodsWithData])

  const tableData = useMemo(() =>
    effectivePeriod ? programData.filter(r => r.period === effectivePeriod) : []
  , [programData, effectivePeriod])

  const colors = PROGRAM_COLORS[selectedProgram] ?? PROGRAM_COLORS.TLAA

  const handleProgramChange = (id) => {
    setSelectedProgram(id)
    setSelectedPeriod(null)
  }

  const handleYearChange = (year) => {
    setSelectedYear(year)
    setSelectedPeriod(null)
  }

  return (
    <div className="scanline min-h-full">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-primary transition-colors"
          >
            ‹ TÉCNICOS
          </button>
          <span className="text-primary/20 font-mono">|</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-violet-400">DISPONIBILIDAD DE GRUPOS</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-px bg-violet-400/50" />
            {loading && (
              <span className="text-violet-400/60 text-[10px] font-mono tracking-[0.4em] uppercase flex items-center gap-2">
                CARGANDO DATOS
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              </span>
            )}
            {!loading && error && (
              <span className="text-red-400/80 text-[10px] font-mono tracking-[0.4em] uppercase">
                ERROR AL CARGAR DATOS
              </span>
            )}
            {!loading && !error && (
              <span className="text-violet-400/60 text-[10px] font-mono tracking-[0.4em] uppercase flex items-center gap-2">
                {rawData.length} GRUPOS CARGADOS
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              </span>
            )}
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl text-text-primary uppercase tracking-wider leading-none mb-3">
            DISPONIBILIDAD<br />
            <span className="text-violet-400">DE GRUPOS</span>
          </h1>
          <p className="text-text-secondary text-sm font-mono tracking-wide max-w-xl">
            Grupos activos por período y técnico. Inscripciones brutas (universo total) y estudiantes reales activos.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
            No se pudo conectar con el webhook: {error}
          </div>
        )}

        {/* Tabs de programa */}
        <div className="flex gap-0 mb-6 border-b border-zinc-800">
          {PROGRAMS.map(prog => {
            const c = PROGRAM_COLORS[prog.id]
            const isActive = selectedProgram === prog.id
            return (
              <button
                key={prog.id}
                onClick={() => handleProgramChange(prog.id)}
                className={`px-5 py-2.5 text-[11px] font-mono uppercase tracking-[0.25em] border-b-2 transition-all duration-150 ${
                  isActive
                    ? `${c.tabActive} border-current bg-zinc-900/40`
                    : 'text-zinc-600 border-transparent hover:text-zinc-400'
                }`}
              >
                {prog.id}
              </button>
            )
          })}
        </div>

        {/* Selector de año + Pills de período */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted w-16">AÑO</span>
            <div className="flex gap-1">
              {AVAILABLE_YEARS.map(yr => (
                <button
                  key={yr}
                  onClick={() => handleYearChange(yr)}
                  className={`px-3 py-1 text-[10px] font-mono tracking-widest border transition-all duration-150 ${
                    selectedYear === yr
                      ? 'border-zinc-400 bg-zinc-800 text-zinc-100'
                      : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted w-16 pt-1.5">PERÍODO</span>
            <div className="flex flex-wrap gap-1.5">
              {yearPeriods.map(p => {
                const isActive = p.n === effectivePeriod
                const hasData  = periodsWithData.has(p.n)
                return (
                  <button
                    key={p.n}
                    onClick={() => setSelectedPeriod(p.n)}
                    className={`relative px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-all duration-150 ${
                      isActive ? colors.pillOn : colors.pillOff
                    }`}
                  >
                    {p.n.replace(/ \d{4}$/, '')}
                    {hasData && !isActive && (
                      <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 pl-[4.5rem] text-[9px] font-mono text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              con grupos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              sin grupos
            </span>
          </div>
        </div>

        {/* Tabla */}
        <div className="border border-zinc-800 overflow-x-auto">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="bg-zinc-900/60 border-b border-zinc-800">
                <th className="text-left   px-4 py-3 text-[10px] tracking-widest uppercase text-text-muted font-normal whitespace-nowrap">ID GRUPO</th>
                <th className="text-left   px-4 py-3 text-[10px] tracking-widest uppercase text-text-muted font-normal">NOMBRE DEL GRUPO</th>
                <th className="text-left   px-4 py-3 text-[10px] tracking-widest uppercase text-text-muted font-normal">SECCIÓN</th>
                <th className="text-right  px-4 py-3 text-[10px] tracking-widest uppercase text-text-muted font-normal w-24">BRUTAS</th>
                <th className="text-right  px-4 py-3 text-[10px] tracking-widest uppercase text-text-muted font-normal w-24">ACTIVOS</th>
                <th className="text-center px-4 py-3 text-[10px] tracking-widest uppercase text-text-muted font-normal w-32">INICIO</th>
                <th className="text-center px-4 py-3 text-[10px] tracking-widest uppercase text-text-muted font-normal w-32">FIN</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-text-muted text-xs">
                    <span className="animate-pulse">Consultando BigQuery...</span>
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-text-muted text-xs">
                    Sin grupos registrados para <span className="text-text-secondary">{effectivePeriod}</span>
                  </td>
                </tr>
              ) : (
                tableData.map((row, idx) => (
                  <tr
                    key={row.group_id}
                    className={`border-b border-zinc-800/40 transition-colors hover:bg-zinc-800/25 ${
                      idx % 2 !== 0 ? 'bg-zinc-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-zinc-300 text-xs font-mono whitespace-nowrap tracking-wide">{row.group_id}</td>
                    <td className="px-4 py-3 text-text-primary">{row.group_name}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{row.section_name}</td>
                    <td className="px-4 py-3 text-right text-zinc-500">{row.count_students}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${colors.text}`}>{row.active_students}</td>
                    <td className="px-4 py-3 text-center text-text-secondary">{row.start_date}</td>
                    <td className="px-4 py-3 text-center text-text-secondary">{row.end_date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de tabla */}
        <div className="mt-2 flex justify-between text-[10px] font-mono text-text-muted">
          <span>
            {loading ? 'cargando...' : `${tableData.length} grupo${tableData.length !== 1 ? 's' : ''} — ${effectivePeriod}`}
          </span>
          <span>BRUTAS = universo total · ACTIVOS = estudiantes reales en programa</span>
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center justify-between text-[10px] font-mono text-text-muted tracking-widest">
          <span>KUEPA EDUCATION SYSTEMS</span>
          <span className="text-violet-400/40">DISPONIBILIDAD DE GRUPOS — v1.0</span>
        </div>

      </div>
    </div>
  )
}
