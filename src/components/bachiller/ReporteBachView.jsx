import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  MATERIAS_BASE, COLOR_GRADO, getBachAvailableYears, getCalendario
} from '../../data/calendarBach'

const WEBHOOK_URL      = 'https://n8n.kuepa.com/webhook/asignacion-bach'
const SHEETS_EXPORT_URL = 'https://n8n.kuepa.com/webhook/reporte-export-bach'

// ── N8N nodes ──────────────────────────────────────────────────────────
const N8N_NODES = [
  { label: 'Webhook',       detail: 'POST /asignacion-bach'              },
  { label: 'BigQuery',      detail: 'Query VKU10_student_program_groups' },
  { label: 'Agregar',       detail: 'Unificar outputs → array plano'     },
  { label: 'Proceso Bach',  detail: 'Anclas + cruce + validación'        },
  { label: 'Responder',     detail: 'JSON { rows[], meta } → frontend'   },
]
const NODE_THRESHOLDS = [0, 800, 7000, 9500, 14000]

// ── Data parsing ──────────────────────────────────────────────────────
const BASE = 6, COLS_POR_MAT = 8

function parseRow(arr) {
  const s = {
    programa:     String(arr[0] || ''),
    id:           String(arr[1] || ''),
    fechaIngreso: String(arr[2] || ''),
    gradoIngreso: String(arr[3] || ''),
    gradoActual:  String(arr[4] || ''),
    estadoPlat:   String(arr[5] || ''),
    materias:     [],
  }
  let i = BASE
  while (i + COLS_POR_MAT <= arr.length) {
    const grado        = String(arr[i]     || '')
    const materiaBQ    = String(arr[i + 1] || '')
    const grupoBQ      = String(arr[i + 2] || '')
    const idGrupoBQ    = String(arr[i + 3] || '')
    const fechaBQ      = String(arr[i + 4] || '')
    const materiaAncla = String(arr[i + 5] || '')
    const fechasAncla  = String(arr[i + 6] || '')
    const estado       = String(arr[i + 7] || '')
    if (!grado && !materiaBQ && !materiaAncla) break
    s.materias.push({ grado, materiaBQ, grupoBQ, idGrupoBQ, fechaBQ, materiaAncla, fechasAncla, estado })
    i += COLS_POR_MAT
  }
  return s
}

// ── Grid constants ─────────────────────────────────────────────────────
const GRADES      = [6, 7, 8, 9, 10, 11]
const FASE1_SLOTS = [0, 1, 2, 3, 4]         // ENE FEB MAR ABR MAY
const FASE2_SLOTS = [5, 6, 7, 8, 9]         // JUL AGO SEP OCT NOV
const SLOT_LABELS = ['ENE','FEB','MAR','ABR','MAY','JUL','AGO','SEP','OCT','NOV']
const SLOT_TO_MONTH = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11]
const MONTH_TO_SLOT = { 1:0, 2:1, 3:2, 4:3, 5:4, 7:5, 8:6, 9:7, 10:8, 11:9 }

function getMaterial(grade, slot) {
  return MATERIAS_BASE[grade]?.[slot % 5] ?? '—'
}

// Devuelve el rango de fechas para (cal, año, slot) buscando por mes/año en el calendario
function getDateForSlot(cal, year, slot) {
  const fechas = getCalendario(cal)
  const targetMonth = SLOT_TO_MONTH[slot]
  if (!targetMonth) return null
  return fechas.find(f => {
    const dash  = f.indexOf('-', 6)
    const start = dash > 0 ? f.slice(0, dash) : f
    const p     = start.split('/')
    return p.length === 3 && parseInt(p[1]) === targetMonth && parseInt(p[2]) === year
  }) ?? null
}

// ── Date helpers ──────────────────────────────────────────────────────
// fechasAncla format: "DD/MM/YYYY-DD/MM/YYYY"
function getYearSlot(fechasAncla) {
  if (!fechasAncla) return { year: null, slot: null }
  const dash  = fechasAncla.indexOf('-', 6)
  const start = dash > 0 ? fechasAncla.slice(0, dash) : fechasAncla.split('-')[0]
  const p     = start.split('/')
  if (p.length !== 3) return { year: null, slot: null }
  const year  = parseInt(p[2])
  const month = parseInt(p[1])
  return { year: isNaN(year) ? null : year, slot: MONTH_TO_SLOT[month] ?? null }
}

// ── Error helpers ─────────────────────────────────────────────────────
function getGradoNum(g) {
  const m = String(g).match(/\d+/)
  return m ? parseInt(m[0]) : 0
}

function tipoError(estado) {
  const e = (estado || '').toLowerCase()
  if (e.startsWith('incorrecto')) return 'INCORRECTO'
  if (e === 'no asignado')        return 'NO ASIGNADO'
  if (e === 'pendiente')          return 'PENDIENTE'
  return null
}

function buildErrorRows(estudiantes) {
  const rows = []
  for (const s of estudiantes) {
    for (const m of s.materias) {
      const tipo = tipoError(m.estado)
      if (tipo) rows.push({ s, m, tipo })
    }
  }
  return rows
}

// ── CSV export ────────────────────────────────────────────────────────
function exportCSV(rows) {
  const headers = [
    'ID Estudiante','Programa','Grado Ingreso','F. Ingreso','Estado Plataforma',
    'Grado Módulo','Materia en SIS','Grupo BQ','ID Grupo BQ','Fecha Inicio BQ',
    'Materia Ancla (correcta)','Fechas Ancla','Tipo de Error',
  ]
  const esc = v => `"${String(v || '').replace(/"/g, '""')}"`
  const lines = [
    headers.join(','),
    ...rows.map(({ s, m, tipo }) => [
      s.id, s.programa, s.gradoIngreso, s.fechaIngreso, s.estadoPlat,
      m.grado, m.materiaBQ || 'Sin asignar', m.grupoBQ, m.idGrupoBQ,
      m.fechaBQ, m.materiaAncla, m.fechasAncla, tipo,
    ].map(esc).join(',')),
  ]
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  const now  = new Date()
  const dd   = String(now.getDate()).padStart(2, '0')
  const mm   = String(now.getMonth() + 1).padStart(2, '0')
  a.download = `reporte-erradas-bach-${now.getFullYear()}${mm}${dd}.csv`
  a.href = url; a.click()
  URL.revokeObjectURL(url)
}

// ── MiniPanel ─────────────────────────────────────────────────────────
function MiniPanel({ nodeStates, fase }) {
  return (
    <div className="border border-zinc-700/40 bg-zinc-900/40 mb-6">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-700/30">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            fase === 'loading' ? 'bg-amber-400 animate-pulse' :
            fase === 'done'    ? 'bg-emerald-400' :
            fase === 'error'   ? 'bg-red-400' : 'bg-zinc-600'
          }`} />
          <span className="text-[10px] font-mono text-zinc-400">
            n8n · <span className="text-primary">asignacion-bach</span>
          </span>
        </div>
        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${
          fase === 'loading' ? 'text-amber-400' : fase === 'done' ? 'text-emerald-400' :
          fase === 'error'   ? 'text-red-400'   : 'text-zinc-600'
        }`}>
          {fase === 'loading' ? 'EJECUTANDO' : fase === 'done' ? 'COMPLETADO' :
           fase === 'error'   ? 'ERROR'       : 'EN ESPERA'}
        </span>
      </div>
      <div className="flex overflow-x-auto">
        {N8N_NODES.map((node, i) => {
          const ns = nodeStates[i]
          const isActive = ns === 'active', isDone = ns === 'done', isError = ns === 'error'
          return (
            <div key={i} className={`flex-1 min-w-[120px] flex items-center gap-2 px-3 py-2.5 border-r border-zinc-700/20 last:border-r-0 transition-all ${
              isActive ? 'bg-amber-950/30' : isDone ? 'bg-emerald-950/15' : isError ? 'bg-red-950/20' : ''
            }`}>
              <span className={`text-[13px] flex-shrink-0 ${
                isActive ? 'text-amber-400 animate-spin' : isDone ? 'text-emerald-400' :
                isError  ? 'text-red-400' : 'text-zinc-600'
              }`}>{isActive ? '⟳' : isDone ? '✓' : isError ? '✗' : '○'}</span>
              <div className="min-w-0">
                <div className={`text-[10px] font-mono font-semibold truncate leading-tight ${
                  isActive ? 'text-amber-300' : isDone ? 'text-zinc-200' :
                  isError  ? 'text-red-300'   : 'text-zinc-600'
                }`}>{node.label}</div>
                <div className="text-[8px] font-mono text-zinc-600 truncate leading-tight">{node.detail}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MultiSelect filter ────────────────────────────────────────────────
function MultiSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function toggle(v) {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }

  const isAll = value.length === 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`border text-[11px] font-mono px-3 py-1.5 flex items-center gap-2 min-w-[160px] transition-colors ${
          !isAll ? 'border-primary/60 text-primary bg-primary/5'
                 : 'border-zinc-700/50 text-text-secondary hover:border-zinc-600 bg-background-card'
        }`}
      >
        <span className="flex-1 text-left truncate">
          {isAll ? `${label}: todos` : `${label}: ${value.length} sel.`}
        </span>
        <span className="text-zinc-500 text-[9px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-zinc-900 border border-zinc-700/60 min-w-[200px] shadow-2xl">
          <div
            onClick={() => onChange([])}
            className={`px-3 py-2 text-[11px] font-mono cursor-pointer hover:bg-zinc-800 flex items-center gap-2 border-b border-zinc-800 ${isAll ? 'text-primary' : 'text-text-muted'}`}
          >
            <span className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center ${isAll ? 'border-primary bg-primary/20' : 'border-zinc-600'}`}>
              {isAll && <span className="text-[9px] text-primary leading-none">✓</span>}
            </span>
            Todos
          </div>
          {options.map(opt => {
            const sel = value.includes(opt)
            return (
              <div key={opt} onClick={() => toggle(opt)} className="px-3 py-2 text-[11px] font-mono cursor-pointer hover:bg-zinc-800 flex items-center gap-2 text-text-secondary">
                <span className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center ${sel ? 'border-primary bg-primary/20' : 'border-zinc-600'}`}>
                  {sel && <span className="text-[9px] text-primary leading-none">✓</span>}
                </span>
                <span className="truncate">{opt}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Panel de fechas por slot seleccionado ─────────────────────────────
function DateInfoPanel({ year, selectedCells }) {
  const slots = useMemo(() => {
    const s = new Set()
    for (const key of selectedCells) {
      const parts = key.split('_')   // "year_grade_slot"
      if (parseInt(parts[0]) === year) s.add(parseInt(parts[2]))
    }
    return [...s].sort((a, b) => a - b)
  }, [year, selectedCells])

  if (slots.length === 0) return null

  return (
    <div className="border-t border-zinc-700/30 bg-zinc-900/60 px-4 py-3">
      <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.3em] mb-3">
        Fechas del período · {year}
      </div>
      <div className="flex flex-wrap gap-3">
        {slots.map(slot => {
          const d34 = getDateForSlot('III_IV', year, slot)
          const dVV = getDateForSlot('V_VI',   year, slot)
          return (
            <div key={slot} className="border border-primary/25 bg-primary/5 px-3 py-2.5 min-w-[260px]">
              <div className="text-[11px] font-bold text-primary mb-2 tracking-wider">
                {SLOT_LABELS[slot]} {year}
              </div>
              {d34 ? (
                <div className="flex items-baseline gap-2 text-[9px] font-mono mb-1">
                  <span className="text-blue-400 w-24 flex-shrink-0">Cal. III/IV</span>
                  <span className="text-zinc-200 tracking-wide">{d34}</span>
                </div>
              ) : (
                <div className="text-[9px] font-mono text-zinc-600 mb-1">Cal. III/IV — sin fecha</div>
              )}
              {dVV ? (
                <div className="flex items-baseline gap-2 text-[9px] font-mono">
                  <span className="text-violet-400 w-24 flex-shrink-0">Cal. V/VI</span>
                  <span className="text-zinc-200 tracking-wide">{dVV}</span>
                </div>
              ) : (
                <div className="text-[9px] font-mono text-zinc-600">Cal. V/VI — sin fecha</div>
              )}
              <div className="mt-1.5 pt-1.5 border-t border-zinc-700/30 text-[8px] font-mono text-zinc-600">
                III/IV: Regular G6-9 · V/VI: Regular G10-11 + Flex
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Calendar Grid (one per year) ──────────────────────────────────────
function CalendarGrid({ year, selectedCells, onToggle, getCellCount }) {

  function Cell({ grade, slot }) {
    const key   = `${year}_${grade}_${slot}`
    const isSel = selectedCells.has(key)
    const mat   = getMaterial(grade, slot)

    return (
      <td
        onClick={() => onToggle(key)}
        className={`px-0.5 py-0.5 border-r border-zinc-700/20 cursor-pointer transition-all select-none ${
          isSel ? 'bg-primary/10' : 'hover:bg-zinc-800/40'
        }`}
        style={{ minWidth: '110px' }}
      >
        <div className={`flex items-center justify-center mx-0.5 px-2 py-2 rounded-sm border transition-all min-h-[40px] ${
          isSel
            ? 'border-primary/70 bg-primary/8'
            : 'border-transparent hover:border-zinc-600/30'
        }`}>
          <span className={`text-[9px] font-semibold leading-tight text-center ${
            isSel ? 'text-primary' : 'text-zinc-400'
          }`}>
            {mat}
          </span>
        </div>
      </td>
    )
  }

  const totalErrors = useMemo(() =>
    GRADES.reduce((sum, g) =>
      sum + [...FASE1_SLOTS, ...FASE2_SLOTS].reduce((s2, sl) => s2 + getCellCount(year, g, sl), 0), 0),
  [year, getCellCount])

  return (
    <div className="border border-zinc-700/30 mb-4">
      {/* Year header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-800/50 border-b border-zinc-700/30">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-display font-black text-primary tracking-widest">{year}</span>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">CALENDARIO BACH</span>
        </div>
        {totalErrors > 0 ? (
          <span className="text-[10px] font-mono text-red-400 bg-red-900/20 border border-red-700/30 px-2 py-0.5">
            {totalErrors} módulos con error
          </span>
        ) : (
          <span className="text-[10px] font-mono text-emerald-500/70">sin errores en datos cargados</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse font-mono" style={{ minWidth: '860px' }}>
          <thead>
            {/* Phase headers */}
            <tr>
              <th className="bg-zinc-900 border-r border-b border-zinc-700/40" style={{ minWidth:'90px' }} />
              <th
                colSpan={5}
                className="text-center px-3 py-2 bg-blue-950/30 border-r-2 border-b border-blue-700/40 text-[10px] font-bold tracking-[0.3em] text-blue-400 uppercase"
              >
                FASE 1 — ENE · MAY
              </th>
              <th
                colSpan={5}
                className="text-center px-3 py-2 bg-violet-950/30 border-r border-b border-violet-700/40 text-[10px] font-bold tracking-[0.3em] text-violet-400 uppercase"
              >
                FASE 2 — JUL · NOV
              </th>
            </tr>
            {/* Month headers */}
            <tr>
              <th className="px-3 py-2 bg-zinc-900 border-r border-b border-zinc-700/40 text-[9px] text-zinc-600 uppercase tracking-wider text-left">
                GRADO
              </th>
              {FASE1_SLOTS.map(slot => (
                <th key={slot} style={{ minWidth:'110px' }}
                  className="px-1 py-2 bg-blue-950/15 border-r border-b border-zinc-700/30 text-center text-[10px] text-blue-300/80 font-semibold tracking-wider">
                  {SLOT_LABELS[slot]}
                </th>
              ))}
              {FASE2_SLOTS.map(slot => (
                <th key={slot} style={{ minWidth:'110px' }}
                  className="px-1 py-2 bg-violet-950/15 border-r border-b border-zinc-700/30 text-center text-[10px] text-violet-300/80 font-semibold tracking-wider">
                  {SLOT_LABELS[slot]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRADES.map(grade => {
              const colorCfg = COLOR_GRADO[grade] || {}
              return (
                <tr key={grade} className="border-b border-zinc-800/60">
                  <td className="px-3 py-1 border-r border-zinc-700/30 whitespace-nowrap bg-zinc-900/50" style={{ minWidth:'90px' }}>
                    <span className={`text-[9px] font-bold ${colorCfg.badge || 'text-zinc-400'}`}>
                      Grado {grade}
                    </span>
                  </td>
                  {FASE1_SLOTS.map(slot => <Cell key={slot} grade={grade} slot={slot} />)}
                  {FASE2_SLOTS.map(slot => <Cell key={slot} grade={grade} slot={slot} />)}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Panel de fechas — aparece solo cuando hay celdas seleccionadas de este año */}
      <DateInfoPanel year={year} selectedCells={selectedCells} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────
export default function ReporteBachView({ onBack }) {
  const [fase,        setFase]        = useState('idle')
  const [estudiantes, setEstudiantes] = useState([])
  const [errorMsg,    setErrorMsg]    = useState('')
  const [nodeStates,  setNodeStates]  = useState(Array(5).fill('idle'))
  const [csvDone,          setCsvDone]          = useState(false)
  const [exportSheetsFase, setExportSheetsFase] = useState('idle')  // idle|loading|done|error
  const [exportSheetsUrl,  setExportSheetsUrl]  = useState('')

  const [selectedYears, setSelectedYears] = useState(new Set())
  const [selectedCells, setSelectedCells] = useState(new Set())  // "year_grade_slot"

  const [filtroProg, setFiltroProg] = useState([])
  const [filtroTipo, setFiltroTipo] = useState([])
  const [busqueda,   setBusqueda]   = useState('')

  const timerRef         = useRef(null)
  const startRef         = useRef(null)
  const lastActiveIdxRef = useRef(-1)

  const availableYears = useMemo(() => {
    try { return getBachAvailableYears() }
    catch { return [2022,2023,2024,2025,2026,2027] }
  }, [])

  // ── Node animation ──────────────────────────────────────────────────
  function startAnim() {
    startRef.current = Date.now()
    lastActiveIdxRef.current = 0
    setNodeStates(Array(5).fill('idle').map((_, i) => i === 0 ? 'active' : 'idle'))
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      let newIdx = 0
      for (let i = NODE_THRESHOLDS.length - 1; i >= 0; i--) {
        if (elapsed >= NODE_THRESHOLDS[i]) { newIdx = i; break }
      }
      if (newIdx !== lastActiveIdxRef.current) {
        lastActiveIdxRef.current = newIdx
        setNodeStates(Array(5).fill('idle').map((_, i) =>
          i < newIdx ? 'done' : i === newIdx ? 'active' : 'idle'
        ))
      }
    }, 250)
  }

  function stopAnim(ok) {
    clearInterval(timerRef.current)
    if (ok) {
      setNodeStates(Array(5).fill('done'))
    } else {
      const errIdx = lastActiveIdxRef.current
      setNodeStates(Array(5).fill('idle').map((_, i) =>
        i < errIdx ? 'done' : i === errIdx ? 'error' : 'idle'
      ))
    }
  }

  // ── Fetch ───────────────────────────────────────────────────────────
  async function handleCargar() {
    setFase('loading'); setEstudiantes([]); setErrorMsg(''); setCsvDone(false)
    setFiltroProg([]); setFiltroTipo([])
    setBusqueda(''); setSelectedYears(new Set()); setSelectedCells(new Set())
    startAnim()
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'reporte-bach-ui' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} — n8n respondió con error`)
      const data = await res.json()
      const rows = (data.rows || data[0]?.rows || []).map(parseRow)
      stopAnim(true)
      setEstudiantes(rows)
      setFase('done')
    } catch (e) {
      stopAnim(false)
      setErrorMsg(e.message === 'Failed to fetch'
        ? 'Error de conexión con n8n — verifica que el webhook esté activo.'
        : e.message)
      setFase('error')
    }
  }

  function handleReset() {
    setFase('idle'); setEstudiantes([]); setErrorMsg('')
    setNodeStates(Array(5).fill('idle'))
    setFiltroProg([]); setFiltroTipo([])
    setBusqueda(''); setCsvDone(false)
    setExportSheetsFase('idle'); setExportSheetsUrl('')
    setSelectedYears(new Set()); setSelectedCells(new Set())
  }

  // ── Year toggle ─────────────────────────────────────────────────────
  function toggleYear(yr) {
    setSelectedYears(prev => {
      const next = new Set(prev)
      if (next.has(yr)) {
        next.delete(yr)
        setSelectedCells(cells => {
          const nc = new Set(cells)
          for (const key of nc) { if (key.startsWith(`${yr}_`)) nc.delete(key) }
          return nc
        })
      } else {
        next.add(yr)
      }
      return next
    })
  }

  // ── Cell toggle ─────────────────────────────────────────────────────
  const toggleCell = useCallback((key) => {
    setSelectedCells(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // ── Derived data ────────────────────────────────────────────────────
  const allErrorRows = useMemo(() => buildErrorRows(estudiantes), [estudiantes])

  const gridCounts = useMemo(() => {
    const counts = {}
    for (const r of allErrorRows) {
      const grade = getGradoNum(r.m.grado)
      const { year, slot } = getYearSlot(r.m.fechasAncla)
      if (!grade || slot === null || !year) continue
      const key = `${grade}_${slot}_${year}`
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [allErrorRows])

  const getCellCount = useCallback((year, grade, slot) => {
    return gridCounts[`${grade}_${slot}_${year}`] || 0
  }, [gridCounts])

  const optsProg = useMemo(() =>
    [...new Set(allErrorRows.map(r => r.s.programa).filter(Boolean))].sort(),
  [allErrorRows])

  const filtradas = useMemo(() => {
    let rows = allErrorRows

    if (selectedYears.size > 0) {
      rows = rows.filter(r => {
        const { year } = getYearSlot(r.m.fechasAncla)
        return year !== null && selectedYears.has(year)
      })
    }

    if (selectedCells.size > 0) {
      rows = rows.filter(r => {
        const grade = getGradoNum(r.m.grado)
        const { year, slot } = getYearSlot(r.m.fechasAncla)
        return year !== null && slot !== null && selectedCells.has(`${year}_${grade}_${slot}`)
      })
    }

    if (filtroProg.length) rows = rows.filter(r => filtroProg.includes(r.s.programa))
    if (filtroTipo.length) rows = rows.filter(r => filtroTipo.includes(r.tipo))
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      rows = rows.filter(r =>
        r.s.id.toLowerCase().includes(q) ||
        r.s.programa.toLowerCase().includes(q) ||
        r.m.materiaAncla.toLowerCase().includes(q) ||
        r.m.materiaBQ.toLowerCase().includes(q)
      )
    }
    return rows
  }, [allErrorRows, selectedYears, selectedCells, filtroProg, filtroTipo, busqueda])

  const hayFiltros = selectedYears.size > 0 || selectedCells.size > 0 ||
    filtroProg.length || filtroTipo.length || busqueda.trim()

  const stats = useMemo(() => ({
    total:        allErrorRows.length,
    incorrectos:  allErrorRows.filter(r => r.tipo === 'INCORRECTO').length,
    noAsig:       allErrorRows.filter(r => r.tipo === 'NO ASIGNADO').length,
    pendientes:   allErrorRows.filter(r => r.tipo === 'PENDIENTE').length,
    estudiantes:  new Set(allErrorRows.map(r => r.s.id)).size,
  }), [allErrorRows])

  const yearsToShow = useMemo(() =>
    [...selectedYears].sort((a, b) => a - b),
  [selectedYears])

  function handleExportCSV() {
    exportCSV(filtradas)
    setCsvDone(true)
    setTimeout(() => setCsvDone(false), 3000)
  }

  // ── Agrupa por nombre de materia para el export Sheets ──────────────
  const sheetsGroups = useMemo(() => {
    const groups = new Map()
    for (const row of filtradas) {
      const grade   = getGradoNum(row.m.grado)
      const { slot } = getYearSlot(row.m.fechasAncla)
      const matName = slot !== null ? getMaterial(grade, slot) : (row.m.materiaAncla?.split(' ')[0] || 'Sin clasificar')
      if (!groups.has(matName)) groups.set(matName, [])
      groups.get(matName).push(row)
    }
    return groups
  }, [filtradas])

  // ── Agrupa por año + slot + materia para la vista en pantalla ────────
  const tableGroups = useMemo(() => {
    const groups = new Map()
    for (const row of filtradas) {
      const grade          = getGradoNum(row.m.grado)
      const { year, slot } = getYearSlot(row.m.fechasAncla)
      const matName        = slot !== null ? getMaterial(grade, slot) : (row.m.materiaAncla?.split(' ')[0] || 'Sin clasificar')
      const key            = `${year ?? '_'}_${slot ?? '_'}_${matName}`
      if (!groups.has(key)) groups.set(key, { year, slot, matName, rows: [] })
      groups.get(key).rows.push(row)
    }
    return [...groups.values()].sort((a, b) => {
      if ((a.year ?? 0) !== (b.year ?? 0)) return (a.year ?? 0) - (b.year ?? 0)
      if ((a.slot ?? 99) !== (b.slot ?? 99)) return (a.slot ?? 99) - (b.slot ?? 99)
      return (a.matName || '').localeCompare(b.matName || '')
    })
  }, [filtradas])

  async function handleExportSheets() {
    if (filtradas.length === 0) return
    setExportSheetsFase('loading'); setExportSheetsUrl('')

    const now  = new Date()
    const dd   = String(now.getDate()).padStart(2, '0')
    const mm   = String(now.getMonth() + 1).padStart(2, '0')
    const hh   = String(now.getHours()).padStart(2, '0')
    const min  = String(now.getMinutes()).padStart(2, '0')
    const yrs  = [...selectedYears].sort().join(', ') || 'todos'

    // Group tableGroups by year+slot → one sheet per año-mes
    const sheetsByMonth = new Map()
    for (const group of tableGroups) {
      const key = `${group.year ?? '_'}_${group.slot ?? '_'}`
      if (!sheetsByMonth.has(key)) {
        const mes = group.slot !== null ? SLOT_LABELS[group.slot] : ''
        sheetsByMonth.set(key, {
          sheetName: [group.year, mes].filter(Boolean).join('-'),
          year: group.year,
          slot: group.slot,
          materias: [],
        })
      }
      sheetsByMonth.get(key).materias.push({
        materia: group.matName,
        stats: {
          total:      group.rows.length,
          incorrecto:  group.rows.filter(r => r.tipo === 'INCORRECTO').length,
          noAsignado:  group.rows.filter(r => r.tipo === 'NO ASIGNADO').length,
          pendiente:   group.rows.filter(r => r.tipo === 'PENDIENTE').length,
        },
        rows: group.rows.map(({ s, m, tipo }) => ({
          id:           s.id,
          programa:     s.programa,
          gradoIngreso: s.gradoIngreso,
          fechaIngreso: s.fechaIngreso,
          estadoPlat:   s.estadoPlat,
          gradoModulo:  m.grado,
          materiaBQ:    m.materiaBQ || 'Sin asignar',
          grupoBQ:      m.grupoBQ,
          idGrupoBQ:    m.idGrupoBQ,
          fechaBQ:      m.fechaBQ,
          materiaAncla: m.materiaAncla,
          fechasAncla:  m.fechasAncla,
          tipoError:    tipo,
        })),
      })
    }

    const payload = {
      title:    `REPORTE BACH ${dd}/${mm}/${now.getFullYear()} ${hh}:${min} — ${yrs}`,
      folderId: '1hmY38PDIcPPJEKRe2pUO8hAxr0-8iyDM',
      sections: [...sheetsByMonth.values()],
    }

    try {
      const resp = await fetch(SHEETS_EXPORT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      setExportSheetsUrl(data.url || data.spreadsheetUrl || '')
      setExportSheetsFase('done')
    } catch {
      setExportSheetsFase('error')
    }
  }

  return (
    <div className="scanline min-h-full">
      <div className="max-w-full mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-primary transition-colors">
            ‹ BACHILLER KUEPA
          </button>
          <span className="text-primary/20 font-mono">|</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400">REPORTE ERRADAS BACH</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="font-display font-black text-3xl uppercase tracking-wider text-text-primary mb-1">
              Reporte de <span className="text-amber-400">Materias Erradas</span> <span className="text-primary">Bach</span>
            </h1>
            <p className="text-text-secondary text-sm font-mono">
              Selecciona año(s) → calendario Fase 1 / Fase 2 · Filtra por materia y grado · Exporta CSV
            </p>
          </div>
          <div className="flex items-center gap-2">
            {fase === 'done' && (
              <button onClick={handleReset}
                className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest border border-zinc-600 text-text-muted hover:text-text-primary hover:border-zinc-500 transition-colors">
                Nueva ejecución
              </button>
            )}
            <button
              onClick={fase === 'loading' ? undefined : handleCargar}
              disabled={fase === 'loading'}
              className={`px-6 py-2.5 text-[11px] font-mono uppercase tracking-widest border transition-all active:scale-95 ${
                fase === 'loading'
                  ? 'border-amber-500/30 text-zinc-500 cursor-not-allowed'
                  : fase === 'done'
                  ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50 cursor-pointer'
                  : 'border-amber-500/60 bg-amber-950/30 text-amber-400 hover:bg-amber-500 hover:text-background cursor-pointer'
              }`}
            >
              {fase === 'loading'
                ? <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />Cargando...</span>
                : fase === 'done' ? `✓ ${estudiantes.length} estudiantes` : '▶ Cargar Datos'}
            </button>
          </div>
        </div>

        <MiniPanel nodeStates={nodeStates} fase={fase} />

        {fase === 'idle' && (
          <div className="border border-zinc-700/30 px-6 py-20 text-center flex flex-col items-center gap-3">
            <span className="text-amber-400/30 text-5xl">◈</span>
            <p className="text-text-muted text-sm font-mono">Carga los datos para configurar el filtro de auditoría</p>
          </div>
        )}

        {fase === 'error' && (
          <div className="border border-red-500/30 bg-red-950/15 px-6 py-10 text-center">
            <div className="text-red-400 font-mono text-sm mb-2">✗ Error al cargar datos</div>
            <div className="text-zinc-300 text-sm mb-4 font-mono">{errorMsg}</div>
            <button onClick={handleReset} className="px-4 py-2 text-[11px] font-mono uppercase border border-zinc-600 text-text-muted hover:text-text-primary transition-colors">
              Reintentar
            </button>
          </div>
        )}

        {fase === 'done' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {[
                { label: 'Total errores',        value: stats.total,       color: 'amber'   },
                { label: 'INCORRECTOS',           value: stats.incorrectos, color: 'red'     },
                { label: 'NO ASIGNADOS',          value: stats.noAsig,      color: 'orange'  },
                { label: 'PENDIENTES',            value: stats.pendientes,  color: 'yellow'  },
                { label: 'Estudiantes afectados', value: stats.estudiantes, color: 'zinc'    },
              ].map(({ label, value, color }) => (
                <div key={label} className={`border px-4 py-3 text-center ${
                  color === 'amber'  ? 'border-amber-500/30 bg-amber-950/20'   :
                  color === 'red'    ? 'border-red-500/30 bg-red-950/20'       :
                  color === 'orange' ? 'border-orange-500/30 bg-orange-950/20' :
                  color === 'yellow' ? 'border-yellow-500/30 bg-yellow-950/20' :
                  'border-zinc-600/30 bg-zinc-900/30'
                }`}>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-text-muted mb-1">{label}</div>
                  <div className={`text-2xl font-display font-black ${
                    color === 'amber'  ? 'text-amber-400'  :
                    color === 'red'    ? 'text-red-400'    :
                    color === 'orange' ? 'text-orange-400' :
                    color === 'yellow' ? 'text-yellow-400' :
                    'text-text-primary'
                  }`}>{value}</div>
                </div>
              ))}
            </div>

            {/* ── Selector de Años ──────────────────────────────────── */}
            <div className="border border-zinc-700/30 bg-zinc-900/20 px-4 py-4 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[9px] font-mono font-bold tracking-[0.4em] text-zinc-500 uppercase">SELECCIONAR AÑO</span>
                <div className="flex-1 h-px bg-zinc-700/40" />
                <span className="text-[10px] font-mono text-zinc-600 italic">
                  Clic en un año para ver su calendario
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {availableYears.map(yr => {
                  const isSel  = selectedYears.has(yr)
                  const errCt  = [...FASE1_SLOTS, ...FASE2_SLOTS].reduce((s, sl) =>
                    s + GRADES.reduce((s2, g) => s2 + getCellCount(yr, g, sl), 0), 0)
                  return (
                    <button
                      key={yr}
                      onClick={() => toggleYear(yr)}
                      className={`relative px-4 py-2 text-[12px] font-mono font-bold border transition-all ${
                        isSel
                          ? 'border-primary bg-primary/15 text-primary shadow-glow-cyan'
                          : errCt > 0
                          ? 'border-red-700/50 text-zinc-400 hover:border-red-500/60 hover:text-zinc-200'
                          : 'border-zinc-700/50 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {yr}
                      {errCt > 0 && (
                        <span className={`absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1 py-px rounded-sm ${
                          isSel ? 'bg-primary text-background' : 'bg-red-900/80 text-red-400 border border-red-700/40'
                        }`}>{errCt}</span>
                      )}
                    </button>
                  )
                })}
                {selectedYears.size > 0 && (
                  <button
                    onClick={() => { setSelectedYears(new Set()); setSelectedCells(new Set()) }}
                    className="ml-2 text-[10px] font-mono text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    × limpiar
                  </button>
                )}
              </div>
            </div>

            {/* ── Calendarios por año ───────────────────────────────── */}
            {yearsToShow.length === 0 ? (
              <div className="border border-zinc-700/20 border-dashed px-6 py-10 text-center mb-6">
                <p className="text-zinc-600 text-sm font-mono">
                  ↑ Selecciona uno o varios años para ver el calendario de períodos
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] font-mono font-bold tracking-[0.4em] text-zinc-500 uppercase">CALENDARIO DE PERÍODOS</span>
                  <div className="flex-1 h-px bg-zinc-700/30" />
                  <span className="text-[10px] font-mono text-zinc-600 italic">
                    Clic en una celda para filtrar la tabla y ver las fechas exactas
                  </span>
                  {selectedCells.size > 0 && (
                    <button
                      onClick={() => setSelectedCells(new Set())}
                      className="text-[10px] font-mono text-zinc-500 hover:text-red-400 transition-colors ml-2"
                    >
                      × limpiar selección ({selectedCells.size})
                    </button>
                  )}
                </div>
                {yearsToShow.map(yr => (
                  <CalendarGrid
                    key={yr}
                    year={yr}
                    selectedCells={selectedCells}
                    onToggle={toggleCell}
                    getCellCount={getCellCount}
                  />
                ))}
                <div className="flex items-center gap-6 text-[10px] font-mono text-zinc-600 mt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-6 h-3.5 bg-primary/10 border border-primary/70 inline-block rounded-sm" />
                    celda cyan = seleccionada · ver fechas en el panel de abajo
                  </span>
                  <span className="text-zinc-700">FASE 1 = Ene–May · FASE 2 = Jul–Nov</span>
                </div>
              </div>
            )}

            {/* ── Resultados — solo cuando hay celdas seleccionadas ─── */}
            {selectedCells.size === 0 && (
              <div className="border border-dashed border-zinc-700/30 px-6 py-8 text-center text-zinc-600 font-mono text-sm">
                ↑ Selecciona una o varias celdas en el calendario para ver los resultados
              </div>
            )}

            {selectedCells.size > 0 && (<>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-amber-500/60 flex-shrink-0" />
              <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-amber-400/80">RESULTADOS</span>
              <div className="flex-1 h-px bg-zinc-700/30" />
            </div>

            {/* Filters + export */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <MultiSelect label="Programa"   options={optsProg}                                    value={filtroProg} onChange={setFiltroProg} />
              <MultiSelect label="Tipo error" options={['INCORRECTO','NO ASIGNADO','PENDIENTE']}   value={filtroTipo} onChange={setFiltroTipo} />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar ID, materia..."
                className="bg-background-card border border-zinc-700/50 text-text-primary text-[11px] font-mono px-3 py-1.5 placeholder-text-muted focus:border-primary/60 focus:outline-none w-44"
              />
              {hayFiltros && (
                <button
                  onClick={() => {
                    setSelectedYears(new Set()); setSelectedCells(new Set())
                    setFiltroProg([]); setFiltroTipo([]); setBusqueda('')
                  }}
                  className="px-3 py-1.5 text-[10px] font-mono uppercase border border-red-500/30 text-red-400 hover:bg-red-950/20 transition-colors"
                >
                  × Limpiar todo
                </button>
              )}
              <div className="flex-1" />
              {exportSheetsFase === 'done' && exportSheetsUrl && (
                <a href={exportSheetsUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] font-mono text-primary font-semibold underline hover:text-primary/80 transition-colors whitespace-nowrap">
                  Abrir en Sheets →
                </a>
              )}
              <button
                onClick={exportSheetsFase === 'loading' ? undefined : handleExportSheets}
                disabled={exportSheetsFase === 'loading' || filtradas.length === 0}
                className={`px-4 py-1.5 text-[11px] font-mono uppercase tracking-widest border transition-all active:scale-95 ${
                  exportSheetsFase === 'loading'
                    ? 'border-zinc-600 text-zinc-500 cursor-not-allowed'
                    : exportSheetsFase === 'done'
                    ? 'border-emerald-500/60 text-emerald-400 bg-emerald-950/20 cursor-pointer'
                    : exportSheetsFase === 'error'
                    ? 'border-red-500/40 text-red-400 hover:bg-red-950/20 cursor-pointer'
                    : filtradas.length === 0
                    ? 'border-zinc-700/30 text-zinc-600 cursor-not-allowed'
                    : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/20 cursor-pointer'
                }`}
              >
                {exportSheetsFase === 'loading' ? '⟳ Exportando...' :
                 exportSheetsFase === 'done'    ? '✓ Exportado a Sheets' :
                 exportSheetsFase === 'error'   ? '✗ Error — reintentar' :
                 `↑ Google Sheets (${new Set(tableGroups.map(g => `${g.year}_${g.slot}`)).size} ${new Set(tableGroups.map(g => `${g.year}_${g.slot}`)).size === 1 ? 'hoja' : 'hojas'})`}
              </button>
              <button
                onClick={handleExportCSV}
                disabled={filtradas.length === 0}
                className={`px-5 py-1.5 text-[11px] font-mono uppercase tracking-widest border transition-all active:scale-95 ${
                  csvDone
                    ? 'border-emerald-500/60 text-emerald-400 bg-emerald-950/20'
                    : filtradas.length === 0
                    ? 'border-zinc-700/30 text-zinc-600 cursor-not-allowed'
                    : 'border-primary/40 text-primary hover:bg-primary hover:text-background cursor-pointer'
                }`}
              >
                {csvDone ? '✓ CSV descargado' : `↓ Exportar CSV (${filtradas.length})`}
              </button>
            </div>

            {/* Count */}
            <div className="text-[10px] font-mono text-text-muted mb-3">
              Mostrando <span className="text-text-primary font-semibold">{filtradas.length}</span> de {allErrorRows.length} módulos con error
              {tableGroups.length > 1 && <span className="text-zinc-400 ml-1">· en {tableGroups.length} tablas</span>}
              {hayFiltros && <span className="text-primary ml-2">· con filtros activos</span>}
            </div>

            {/* Tablas agrupadas por año + mes + materia */}
            {filtradas.length === 0 ? (
              <div className="border border-zinc-700/30 px-6 py-12 text-center text-text-muted font-mono text-sm">
                {allErrorRows.length === 0
                  ? '✓ Sin errores encontrados en los datos cargados'
                  : 'Sin resultados para los filtros / selección aplicados'}
              </div>
            ) : tableGroups.map((group, gi) => {
              const gradeSet = [...new Set(group.rows.map(r => getGradoNum(r.m.grado)))].sort((a, b) => a - b)
              const cntInc   = group.rows.filter(r => r.tipo === 'INCORRECTO').length
              const cntNa    = group.rows.filter(r => r.tipo === 'NO ASIGNADO').length
              const cntPend  = group.rows.filter(r => r.tipo === 'PENDIENTE').length
              return (
                <div key={gi} className="mb-6">
                  {/* Encabezado del grupo */}
                  <div className="flex items-center flex-wrap gap-2 px-4 py-2.5 bg-zinc-800/70 border border-zinc-700/40 border-b-0">
                    <div className="w-1 h-4 bg-amber-500/70 flex-shrink-0" />
                    <span className="text-sm font-display font-bold text-text-primary tracking-wide">{group.matName}</span>
                    {group.slot !== null && (
                      <span className="text-[11px] font-mono text-primary font-semibold border border-primary/30 px-2 py-0.5 bg-primary/5">
                        {SLOT_LABELS[group.slot]}
                      </span>
                    )}
                    {group.year && (
                      <span className="text-[12px] font-mono font-bold text-zinc-300">{group.year}</span>
                    )}
                    <span className="text-[10px] font-mono text-zinc-500">
                      {gradeSet.map(g => `Grado ${g}`).join(' · ')}
                    </span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1.5">
                      {cntInc  > 0 && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 border border-red-500/40 text-red-400 bg-red-950/20">{cntInc} INC</span>}
                      {cntNa   > 0 && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 border border-amber-500/40 text-amber-400 bg-amber-950/20">{cntNa} N/A</span>}
                      {cntPend > 0 && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 border border-yellow-500/40 text-yellow-400 bg-yellow-950/20">{cntPend} PEND</span>}
                      <span className="text-[10px] font-mono text-zinc-500 ml-1 pl-2 border-l border-zinc-700/40">{group.rows.length} módulos</span>
                    </div>
                  </div>

                  {/* Tabla */}
                  <div className="overflow-x-auto border border-zinc-700/40" style={{ maxHeight: '45vh' }}>
                    <table className="border-collapse text-xs font-mono" style={{ minWidth: '1700px' }}>
                      <thead className="sticky top-0 z-10">
                        <tr>
                          {[
                            { label: '#',                w: '44px',  cls: 'bg-zinc-800 text-zinc-300'           },
                            { label: 'ID Estudiante',    w: '110px', cls: 'bg-zinc-800 text-zinc-300'           },
                            { label: 'Programa',         w: '140px', cls: 'bg-zinc-800 text-zinc-300'           },
                            { label: 'Grado Ing.',       w: '88px',  cls: 'bg-zinc-800 text-zinc-300'           },
                            { label: 'F. Ingreso',       w: '100px', cls: 'bg-zinc-800 text-zinc-300'           },
                            { label: 'Estado Plat.',     w: '120px', cls: 'bg-zinc-800 text-zinc-300'           },
                            { label: 'Grado Mód.',       w: '85px',  cls: 'bg-zinc-800 text-zinc-300'           },
                            { label: 'Materia en SIS ✗', w: '190px', cls: 'bg-red-900/80 text-red-100'          },
                            { label: 'Grupo BQ',         w: '120px', cls: 'bg-red-900/80 text-red-100'          },
                            { label: 'ID Grupo BQ',      w: '110px', cls: 'bg-red-900/80 text-red-100'          },
                            { label: 'Fecha BQ',         w: '100px', cls: 'bg-red-900/80 text-red-100'          },
                            { label: 'Materia Ancla ✓',  w: '190px', cls: 'bg-emerald-900/80 text-emerald-100' },
                            { label: 'Fechas Ancla ✓',   w: '175px', cls: 'bg-emerald-900/80 text-emerald-100' },
                            { label: 'Tipo Error',       w: '130px', cls: 'bg-amber-900/70 text-amber-100'      },
                          ].map((col, ci) => (
                            <th key={ci} style={{ minWidth: col.w }}
                              className={`px-3 py-2.5 text-left text-[10px] font-bold tracking-wide uppercase whitespace-nowrap border-b-2 border-r border-zinc-600/40 ${col.cls}`}>
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map(({ s, m, tipo }, ri) => {
                          const isInc  = tipo === 'INCORRECTO'
                          const isPend = tipo === 'PENDIENTE'
                          const rowBg  = ri % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'
                          return (
                            <tr key={ri} className={`border-b border-zinc-700/30 hover:brightness-110 transition-colors ${rowBg}`}>
                              <td className="px-3 py-2 text-zinc-500 border-r border-zinc-700/20">{ri + 1}</td>
                              <td className="px-3 py-2 text-zinc-300 font-semibold border-r border-zinc-700/20 whitespace-nowrap">{s.id || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-700/20">
                                <span className="text-primary text-[10px] font-semibold">{s.programa || '—'}</span>
                              </td>
                              <td className="px-3 py-2 text-zinc-300 text-center border-r border-zinc-700/20">{s.gradoIngreso || '—'}</td>
                              <td className="px-3 py-2 text-zinc-300 text-center border-r border-zinc-700/20 whitespace-nowrap">{s.fechaIngreso || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-700/20">
                                <span className={`text-[10px] ${
                                  ['regular','activo','nuevo'].some(k => (s.estadoPlat || '').toLowerCase().includes(k))
                                    ? 'text-emerald-400' : 'text-zinc-400'
                                }`}>{s.estadoPlat || '—'}</span>
                              </td>
                              <td className="px-3 py-2 text-zinc-200 text-center border-r border-zinc-700/20 whitespace-nowrap">{m.grado || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-700/20 bg-red-950/15">
                                {m.materiaBQ
                                  ? <span className="text-red-300 font-medium">{m.materiaBQ}</span>
                                  : <span className="text-zinc-500 italic">Sin asignar</span>}
                              </td>
                              <td className="px-3 py-2 border-r border-zinc-700/20 bg-red-950/15 text-zinc-300 whitespace-nowrap">{m.grupoBQ || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-700/20 bg-red-950/15 text-zinc-400 whitespace-nowrap text-[10px]">{m.idGrupoBQ || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-700/20 bg-red-950/15 text-zinc-300 whitespace-nowrap">{m.fechaBQ || '—'}</td>
                              <td className="px-3 py-2 border-r border-zinc-700/20 bg-emerald-950/15">
                                <span className="text-emerald-300 font-semibold">{m.materiaAncla || '—'}</span>
                              </td>
                              <td className="px-3 py-2 border-r border-zinc-700/20 bg-emerald-950/15 whitespace-nowrap">
                                <span className="text-emerald-300/80 text-[10px]">{m.fechasAncla || '—'}</span>
                              </td>
                              <td className="px-3 py-2 bg-amber-950/10">
                                <span className={`text-[10px] font-bold px-2 py-0.5 border ${
                                  isInc
                                    ? 'border-red-500/40 text-red-300 bg-red-950/30'
                                    : isPend
                                    ? 'border-yellow-500/40 text-yellow-300 bg-yellow-950/30'
                                    : 'border-amber-500/40 text-amber-300 bg-amber-950/30'
                                }`}>{tipo}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}

            </>)}

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-6 text-[10px] font-mono text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-red-500/40 bg-red-950/30 inline-block" />
                INCORRECTO — fecha en BQ no corresponde al ancla (±1 día)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-amber-500/40 bg-amber-950/30 inline-block" />
                NO ASIGNADO — ancla pasada, SIS no registra asignación
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-yellow-500/40 bg-yellow-950/30 inline-block" />
                PENDIENTE — ancla futura, módulo aún no iniciado
              </span>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
