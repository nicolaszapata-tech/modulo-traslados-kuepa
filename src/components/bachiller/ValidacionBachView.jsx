import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { COLOR_GRADO } from '../../data/calendarBach'

const WEBHOOK_URL = 'https://n8n.kuepa.com/webhook/asignacion-bach'

const N8N_NODES = [
  { id: 1, label: 'Webhook Trigger',        icon: '⚡', detail: 'POST /asignacion-bach',                  color: 'emerald', threshold: 0     },
  { id: 2, label: 'BigQuery Programas Bach', icon: '🔵', detail: 'Query VKU10_student_program_groups',     color: 'blue',    threshold: 800   },
  { id: 3, label: 'Agregar Programas',       icon: '🔧', detail: 'Unificar outputs → array plano',         color: 'violet',  threshold: 7000  },
  { id: 4, label: 'Proceso Completo Bach',   icon: '📐', detail: 'Anclas + cruce + validación por grado',  color: 'amber',   threshold: 9500  },
  { id: 5, label: 'Responder',               icon: '✅', detail: 'JSON { rows[], meta } → frontend',       color: 'cyan',    threshold: 14000 },
]

const NODE_BASE = {
  emerald: 'border-emerald-500/60 text-emerald-400 bg-emerald-950/60',
  blue:    'border-blue-500/60    text-blue-400    bg-blue-950/60',
  violet:  'border-violet-500/60  text-violet-400  bg-violet-950/60',
  amber:   'border-amber-500/60   text-amber-400   bg-amber-950/60',
  cyan:    'border-cyan-500/60    text-cyan-400    bg-cyan-950/60',
}

// ── Tooltip con portal (evita clipping por overflow) ──────────────
function Tooltip({ children, tip }) {
  const [pos, setPos] = useState(null)
  const ref = useRef(null)

  function show() {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({ x: r.left + r.width / 2, y: r.top })
  }

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        className="cursor-help inline-flex flex-col items-center gap-0.5"
      >
        {children}
      </span>
      {pos && createPortal(
        <div
          style={{
            position: 'fixed',
            top: pos.y - 10,
            left: pos.x,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
          }}
          className="w-72 bg-zinc-900 border border-zinc-500/60 text-[11px] font-mono text-zinc-200 px-4 py-3 shadow-2xl leading-relaxed pointer-events-none"
        >
          {tip}
          <div
            style={{
              position: 'absolute',
              bottom: -5,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 8,
              height: 8,
              background: '#18181b',
              border: '1px solid rgba(113,113,122,0.6)',
              borderTop: 'none',
              borderLeft: 'none',
              rotate: '45deg',
            }}
          />
        </div>,
        document.body
      )}
    </>
  )
}

// ── Filtro multi-selección con checkboxes ─────────────────────────
function MultiSelectFilter({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function toggle(v) {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }

  function toggleAll() {
    onChange([])
  }

  const isAll   = value.length === 0
  const selCount = value.length

  const displayLabel = isAll
    ? `${label}: todos`
    : `${label}: ${selCount} sel.`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`bg-background-card border text-[12px] font-mono px-3 py-2 focus:outline-none flex items-center gap-2 min-w-[170px] transition-colors ${
          !isAll
            ? 'border-primary/60 text-primary'
            : 'border-zinc-700/50 text-text-secondary hover:border-zinc-600'
        }`}
      >
        <span className="flex-1 text-left truncate">{displayLabel}</span>
        <span className="text-zinc-500 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-zinc-900 border border-zinc-700/60 min-w-[200px] shadow-2xl">
          {/* Todos */}
          <div
            onClick={toggleAll}
            className={`px-3 py-2 text-[11px] font-mono cursor-pointer hover:bg-zinc-800 flex items-center gap-2 border-b border-zinc-800 ${
              isAll ? 'text-primary' : 'text-text-muted'
            }`}
          >
            <span className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center ${
              isAll ? 'border-primary bg-primary/20' : 'border-zinc-600'
            }`}>
              {isAll && <span className="text-[9px] text-primary leading-none">✓</span>}
            </span>
            Todos
          </div>
          {options.map(opt => {
            const sel = value.includes(opt.value)
            return (
              <div
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="px-3 py-2 text-[11px] font-mono cursor-pointer hover:bg-zinc-800 flex items-center gap-2 text-text-secondary"
              >
                <span className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center ${
                  sel ? 'border-primary bg-primary/20' : 'border-zinc-600'
                }`}>
                  {sel && <span className="text-[9px] text-primary leading-none">✓</span>}
                </span>
                <span className="truncate">{opt.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Estado badges ─────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  if (!estado) return null
  const lower = estado.toLowerCase()
  if (lower === 'correcto')
    return <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 bg-emerald-950/70 border border-emerald-700/50 text-emerald-400">CORRECTO</span>
  if (lower.startsWith('incorrecto'))
    return <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 bg-red-950/70 border border-red-700/50 text-red-400">INCORRECTO</span>
  if (lower === 'no asignado')
    return <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 bg-amber-950/70 border border-amber-700/50 text-amber-400">NO ASIGNADO</span>
  if (lower === 'pendiente')
    return <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800/70 border border-zinc-600/50 text-zinc-400">PENDIENTE</span>
  return <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800/70 border border-zinc-700/50 text-zinc-500">{estado}</span>
}

// ── Parse flat row ────────────────────────────────────────────────
const BASE = 6
const COLS_POR_MAT = 8

function parseRow(arr) {
  const student = {
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
    student.materias.push({ grado, materiaBQ, grupoBQ, idGrupoBQ, fechaBQ, materiaAncla, fechasAncla, estado })
    i += COLS_POR_MAT
  }
  return student
}

function contarEstados(materias) {
  return materias.reduce((acc, m) => {
    const e = (m.estado || '').toLowerCase()
    if (e === 'correcto')                acc.ok++
    else if (e.startsWith('incorrecto')) acc.err++
    else if (e === 'no asignado')        acc.noAsig++
    else if (e === 'pendiente')          acc.pend++
    return acc
  }, { ok: 0, err: 0, noAsig: 0, pend: 0 })
}

function getGradoNum(g) {
  const m = String(g).match(/\d+/)
  return m ? parseInt(m[0]) : 0
}

function parseFechaSort(str) {
  if (!str) return new Date(0)
  const p = str.split('/')
  if (p.length !== 3) return new Date(0)
  return new Date(+p[2], +p[1] - 1, +p[0])
}

// ── Accordion por estudiante ──────────────────────────────────────
function EstudianteDetalle({ student }) {
  const [gradoOpen, setGradoOpen] = useState({})

  const grupos = useMemo(() => {
    const map = new Map()
    student.materias.forEach(mat => {
      const g = mat.grado || 'Sin grado'
      if (!map.has(g)) map.set(g, [])
      map.get(g).push(mat)
    })
    return Array.from(map.entries()).sort((a, b) => getGradoNum(a[0]) - getGradoNum(b[0]))
  }, [student.materias])

  const toggleGrado = g => setGradoOpen(prev => ({ ...prev, [g]: !prev[g] }))

  return (
    <div className="border-t border-zinc-700/50 bg-zinc-950/80 px-4 py-4">
      <div className="flex items-center gap-4 mb-4 text-[11px] font-mono text-text-muted">
        <span>Programa: <span className="text-text-primary">{student.programa}</span></span>
        <span>F. Ingreso: <span className="text-text-primary">{student.fechaIngreso}</span></span>
        <span>Estado Plat.: <span className="text-text-primary">{student.estadoPlat}</span></span>
        <span>{student.materias.length} materias totales</span>
      </div>

      <div className="flex flex-col gap-1">
        {grupos.map(([gradoLabel, mats]) => {
          const gNum   = getGradoNum(gradoLabel)
          const col    = COLOR_GRADO[gNum] || { header: 'bg-zinc-800 text-zinc-200', stripe: 'bg-zinc-900/50' }
          const counts = contarEstados(mats)
          const isOpen = gradoOpen[gradoLabel] !== false

          return (
            <div key={gradoLabel} className="border border-zinc-700/40 overflow-hidden">
              <button
                onClick={() => toggleGrado(gradoLabel)}
                className={`w-full flex items-center justify-between px-4 py-2 ${col.header} hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display font-black text-sm uppercase tracking-wider">{gradoLabel}</span>
                  <span className="text-[10px] opacity-70">{mats.length} materias</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  {counts.ok     > 0 && <span className="text-emerald-400">✓ {counts.ok}</span>}
                  {counts.err    > 0 && <span className="text-red-400">✗ {counts.err}</span>}
                  {counts.noAsig > 0 && <span className="text-amber-400">⊘ {counts.noAsig}</span>}
                  {counts.pend   > 0 && <span className="text-zinc-400">⌛ {counts.pend}</span>}
                  <span className="ml-2 opacity-60">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <table className="w-full border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-zinc-700/40 bg-zinc-900/60">
                      <th className="px-3 py-1.5 text-left text-[9px] tracking-widest uppercase text-text-muted w-8">#</th>
                      <th className="px-3 py-1.5 text-left text-[9px] tracking-widest uppercase text-text-muted">MATERIA ANCLA</th>
                      <th className="px-3 py-1.5 text-left text-[9px] tracking-widest uppercase text-text-muted">MATERIA BQ</th>
                      <th className="px-3 py-1.5 text-left text-[9px] tracking-widest uppercase text-text-muted">GRUPO BQ</th>
                      <th className="px-3 py-1.5 text-left text-[9px] tracking-widest uppercase text-text-muted">ID GRUPO</th>
                      <th className="px-3 py-1.5 text-left text-[9px] tracking-widest uppercase text-text-muted">F. INICIO BQ</th>
                      <th className="px-3 py-1.5 text-left text-[9px] tracking-widest uppercase text-text-muted">FECHAS ANCLA</th>
                      <th className="px-3 py-1.5 text-left text-[9px] tracking-widest uppercase text-text-muted">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mats.map((mat, j) => (
                      <tr key={j} className={`border-b border-zinc-800/40 ${j % 2 === 0 ? col.stripe : ''} hover:bg-zinc-700/20`}>
                        <td className="px-3 py-2 text-text-muted">{j + 1}</td>
                        <td className="px-3 py-2 text-text-primary">{mat.materiaAncla || '—'}</td>
                        <td className="px-3 py-2 text-text-secondary">{mat.materiaBQ || '—'}</td>
                        <td className="px-3 py-2 text-text-muted max-w-[180px] truncate" title={mat.grupoBQ}>{mat.grupoBQ || '—'}</td>
                        <td className="px-3 py-2 text-blue-400/80 text-[10px]">{mat.idGrupoBQ || '—'}</td>
                        <td className="px-3 py-2 text-text-secondary">{mat.fechaBQ || '—'}</td>
                        <td className="px-3 py-2 text-text-muted">{mat.fechasAncla || '—'}</td>
                        <td className="px-3 py-2"><EstadoBadge estado={mat.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────
export default function ValidacionBachView({ onBack }) {
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [students, setStudents]     = useState([])
  const [meta, setMeta]             = useState(null)
  const [nodeStates, setNodeStates] = useState(N8N_NODES.map(() => 'idle'))
  const [expandedIds, setExpandedIds] = useState(new Set())

  // Filtros (arrays: vacío = todos)
  const [busqueda, setBusqueda]               = useState('')
  const [filtroPrograma, setFiltroPrograma]   = useState([])
  const [filtroAnio, setFiltroAnio]           = useState([])
  const [filtroEstadoPlat, setFiltroEstadoPlat] = useState([])
  const [filtroValidacion, setFiltroValidacion] = useState([])
  const [pagina, setPagina]                   = useState(1)
  const [porPag, setPorPag]                   = useState(20)

  const lastActiveIdxRef = useRef(0)

  async function fetchData() {
    setLoading(true)
    setError(null)
    setStudents([])
    setMeta(null)
    setExpandedIds(new Set())
    setPagina(1)
    lastActiveIdxRef.current = 0
    setNodeStates(N8N_NODES.map((_, i) => i === 0 ? 'active' : 'idle'))

    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      let activeIdx = 0
      for (let i = 0; i < N8N_NODES.length; i++) {
        if (elapsed >= N8N_NODES[i].threshold) activeIdx = i
      }
      lastActiveIdxRef.current = activeIdx
      setNodeStates(N8N_NODES.map((_, i) => {
        if (i < activeIdx)   return 'done'
        if (i === activeIdx) return 'active'
        return 'idle'
      }))
    }, 200)

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'modulo-bach-ui' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} — el servidor n8n respondió con error`)
      const data = await res.json()
      setStudents((data.rows || data[0]?.rows || []).map(parseRow))
      setMeta(data.meta || data[0]?.meta || null)
      setNodeStates(N8N_NODES.map(() => 'done'))
    } catch (e) {
      setError(e.message)
      const errIdx = lastActiveIdxRef.current
      setNodeStates(N8N_NODES.map((_, i) => {
        if (i < errIdx)   return 'done'
        if (i === errIdx) return 'error'
        return 'idle'
      }))
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  // ── Opciones para filtros ────────────────────────────────────
  const programasOpts = useMemo(() =>
    Array.from(new Set(students.map(s => s.programa).filter(Boolean))).sort()
      .map(p => ({ value: p, label: p })),
    [students])

  const aniosOpts = useMemo(() =>
    Array.from(new Set(students.map(s => s.fechaIngreso.split('/')[2]).filter(Boolean))).sort((a, b) => b - a)
      .map(a => ({ value: a, label: a })),
    [students])

  const estadosPlatOpts = useMemo(() =>
    Array.from(new Set(students.map(s => s.estadoPlat).filter(Boolean))).sort()
      .map(e => ({ value: e, label: e })),
    [students])

  const validacionOpts = [
    { value: 'ok',      label: 'Sin errores' },
    { value: 'errores', label: 'Con errores' },
  ]

  // ── Filtrado + orden desc por fecha de ingreso ───────────────
  const filtrados = useMemo(() => {
    const list = students.filter(s => {
      if (busqueda) {
        const q = busqueda.toLowerCase()
        if (!s.id.toLowerCase().includes(q) &&
            !s.programa.toLowerCase().includes(q) &&
            !s.gradoActual.toLowerCase().includes(q)) return false
      }
      if (filtroPrograma.length > 0 && !filtroPrograma.includes(s.programa)) return false
      if (filtroEstadoPlat.length > 0 && !filtroEstadoPlat.includes(s.estadoPlat)) return false
      if (filtroAnio.length > 0) {
        const yr = s.fechaIngreso.split('/')[2]
        if (!filtroAnio.includes(yr)) return false
      }
      if (filtroValidacion.length > 0) {
        const counts = contarEstados(s.materias)
        const hasErr = counts.err > 0 || counts.noAsig > 0
        const match = filtroValidacion.some(f =>
          f === 'ok' ? !hasErr : hasErr
        )
        if (!match) return false
      }
      return true
    })
    list.sort((a, b) => parseFechaSort(b.fechaIngreso) - parseFechaSort(a.fechaIngreso))
    return list
  }, [students, busqueda, filtroPrograma, filtroAnio, filtroEstadoPlat, filtroValidacion])

  const totalPag = Math.ceil(filtrados.length / porPag)
  const pagData  = filtrados.slice((pagina - 1) * porPag, pagina * porPag)

  function toggleExpand(id) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function nodeClass(node, state) {
    if (state === 'done')   return 'border-emerald-500/80 text-emerald-300 bg-emerald-950/50'
    if (state === 'error')  return 'border-red-500/80 text-red-300 bg-red-950/60'
    if (state === 'active') return NODE_BASE[node.color] + ' shadow-lg shadow-current/10'
    return NODE_BASE[node.color] + ' opacity-35'
  }

  const errorNodeIdx = nodeStates.findIndex(s => s === 'error')

  const hasActiveFilters = filtroPrograma.length > 0 || filtroAnio.length > 0 ||
    filtroEstadoPlat.length > 0 || filtroValidacion.length > 0 || busqueda

  function clearFilters() {
    setBusqueda(''); setFiltroPrograma([]); setFiltroAnio([])
    setFiltroEstadoPlat([]); setFiltroValidacion([]); setPagina(1)
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
          <span className="text-[10px] font-mono tracking-widest uppercase text-primary">VALIDACIÓN BACH</span>
        </div>

        <h1 className="font-display font-black text-3xl uppercase tracking-wider text-text-primary mb-1">
          Validación <span className="text-secondary">Bach</span>
        </h1>
        <p className="text-text-secondary text-sm font-mono mb-6">
          Compara asignación BigQuery vs anclas curriculares · Hasta 80 materias · Grados 6-11 · Tolerancia ±1 día
        </p>

        {/* ── Flujo N8N ───────────────────────────────────────── */}
        <div className="bg-background-card border border-zinc-800/60 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono tracking-widest uppercase text-text-muted">FLUJO N8N</span>
              {loading && <span className="text-[9px] font-mono text-amber-400 animate-pulse">● PROCESANDO…</span>}
              {!loading && students.length > 0 && <span className="text-[9px] font-mono text-emerald-400">✓ COMPLETADO — {students.length} estudiantes</span>}
              {!loading && error && <span className="text-[9px] font-mono text-red-400">✗ FALLO EN {N8N_NODES[errorNodeIdx]?.label ?? 'NODO DESCONOCIDO'}</span>}
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className={`px-5 py-2 text-[11px] font-mono uppercase tracking-[0.2em] border transition-all duration-200 ${
                loading
                  ? 'border-zinc-700/50 text-text-muted cursor-not-allowed'
                  : 'border-secondary/60 bg-secondary/10 text-secondary hover:bg-secondary hover:text-background active:scale-95'
              }`}
            >
              {loading ? 'PROCESANDO...' : 'EJECUTAR VALIDACIÓN'}
            </button>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {N8N_NODES.map((node, i) => {
              const state = nodeStates[i]
              return (
                <div key={node.id} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`border px-3 py-2 text-[10px] font-mono transition-all duration-300 min-w-[145px] ${nodeClass(node, state)} ${state === 'active' ? 'scale-105' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base leading-none">
                        {state === 'done' ? '✓' : state === 'error' ? '✗' : node.icon}
                      </span>
                      {state === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                      {state === 'done'  && <span className="text-[8px] text-emerald-400 font-semibold tracking-wider">LISTO</span>}
                      {state === 'error' && <span className="text-[8px] text-red-400 font-semibold tracking-wider">FALLÓ</span>}
                    </div>
                    <div className="font-semibold text-[11px] leading-tight">{node.label}</div>
                    <div className="text-[9px] opacity-55 mt-0.5 leading-tight">{node.detail}</div>
                  </div>
                  {i < N8N_NODES.length - 1 && (
                    <span className={`text-[12px] font-mono transition-colors ${
                      state === 'done' ? 'text-emerald-500' :
                      state === 'active' ? 'text-amber-400 animate-pulse' : 'text-zinc-700'
                    }`}>→</span>
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <div className="mt-3 px-3 py-2 border border-red-700/50 bg-red-950/40 text-red-400 text-[11px] font-mono flex items-start gap-2">
              <span className="text-red-500 mt-0.5">✗</span>
              <div>
                {errorNodeIdx !== -1 && <span className="font-semibold text-red-300">[{N8N_NODES[errorNodeIdx].label}] </span>}
                {error}
                <div className="text-zinc-500 text-[10px] mt-1">Los nodos anteriores completaron correctamente. Revisa este nodo en n8n para el log completo.</div>
              </div>
            </div>
          )}
        </div>

        {/* Meta */}
        {meta && (
          <div className="flex items-center gap-6 mb-4 px-4 py-2 border border-zinc-700/40 bg-zinc-900/60 text-[11px] font-mono">
            <span className="text-text-muted">TOTAL <span className="text-text-primary font-semibold">{meta.total ?? students.length}</span></span>
            {meta.sin_errores !== undefined && <span className="text-emerald-400">SIN ERRORES {meta.sin_errores}</span>}
            {meta.con_errores !== undefined && <span className="text-red-400">CON ERRORES {meta.con_errores}</span>}
          </div>
        )}

        {/* Filtros */}
        {students.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              type="text"
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
              placeholder="Buscar por ID, programa..."
              className="bg-background-card border border-zinc-700/50 text-text-primary text-sm font-mono px-3 py-2 placeholder-text-muted focus:border-primary/60 focus:outline-none w-52"
            />
            <MultiSelectFilter label="Programa"     options={programasOpts}   value={filtroPrograma}   onChange={v => { setFiltroPrograma(v);   setPagina(1) }} />
            <MultiSelectFilter label="Año ingreso"  options={aniosOpts}        value={filtroAnio}       onChange={v => { setFiltroAnio(v);       setPagina(1) }} />
            <MultiSelectFilter label="Estado plat." options={estadosPlatOpts}  value={filtroEstadoPlat} onChange={v => { setFiltroEstadoPlat(v); setPagina(1) }} />
            <MultiSelectFilter label="Validación"   options={validacionOpts}   value={filtroValidacion} onChange={v => { setFiltroValidacion(v); setPagina(1) }} />
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[11px] font-mono text-red-400/70 hover:text-red-400 border border-red-800/40 hover:border-red-700/60 px-3 py-2 transition-colors">
                × LIMPIAR
              </button>
            )}
            <span className="text-[10px] font-mono text-text-muted ml-1">
              {filtrados.length} / {students.length} estudiantes
            </span>
          </div>
        )}

        {/* ── Tabla principal ──────────────────────────────────── */}
        {students.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] font-mono">
                <thead>
                  <tr className="border-b border-zinc-700/50 bg-zinc-900/80">
                    <th className="px-3 py-3 w-28 text-left text-[9px] tracking-widest uppercase text-text-muted">ACCIÓN</th>
                    <th className="px-3 py-3 text-left text-[9px] tracking-widest uppercase text-text-muted">ID</th>
                    <th className="px-3 py-3 text-left text-[9px] tracking-widest uppercase text-text-muted">PROGRAMA</th>
                    <th className="px-3 py-3 text-left text-[9px] tracking-widest uppercase text-text-muted">
                      F. INGRESO <span className="text-primary/60">↓</span>
                    </th>
                    <th className="px-3 py-3 text-left text-[9px] tracking-widest uppercase text-text-muted">G. ING.</th>
                    <th className="px-3 py-3 text-left text-[9px] tracking-widest uppercase text-text-muted">G. ACTUAL</th>
                    <th className="px-3 py-3 text-left text-[9px] tracking-widest uppercase text-text-muted">ESTADO PLAT.</th>
                    <th className="px-3 py-3 text-center">
                      <Tooltip tip="CORRECTAS — Módulo encontrado en BQ y la fecha de inicio coincide con el ancla curricular (tolerancia ±1 día). No requiere acción.">
                        <span className="text-emerald-500 text-[13px]">✓</span>
                        <span className="text-[8px] text-emerald-600 font-mono tracking-wider">CORRECTAS</span>
                      </Tooltip>
                    </th>
                    <th className="px-3 py-3 text-center">
                      <Tooltip tip="INCORRECTAS — El módulo existe en BQ/SIS pero la fecha de inicio asignada no corresponde con la que debería tener según la ancla curricular. Requiere corrección de fecha.">
                        <span className="text-red-500 text-[13px]">✗</span>
                        <span className="text-[8px] text-red-600 font-mono tracking-wider">INCORRECTAS</span>
                      </Tooltip>
                    </th>
                    <th className="px-3 py-3 text-center">
                      <Tooltip tip="NO ASIGNADAS — El estudiante deberia tener este modulo activo o ya lo curso, pero en el SIS aparece como [Por asignar...] o no existe la asignacion pese a ser un modulo activo o ya cursado. Requiere accion inmediata.">
                        <span className="text-amber-500 text-[13px]">⊘</span>
                        <span className="text-[8px] text-amber-600 font-mono tracking-wider">NO ASIG.</span>
                      </Tooltip>
                    </th>
                    <th className="px-3 py-3 text-center">
                      <Tooltip tip="PENDIENTES — Módulos futuros que aún no han iniciado según el ancla curricular, o módulos cuya fecha ya pasó pero que tampoco se encontraron en BQ (se marcan pendiente por no tener registro). No requiere acción inmediata.">
                        <span className="text-zinc-400 text-[13px]">⌛</span>
                        <span className="text-[8px] text-zinc-500 font-mono tracking-wider">PENDIENTES</span>
                      </Tooltip>
                    </th>
                    <th className="px-3 py-3 text-center text-[9px] tracking-widest uppercase text-text-muted">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {pagData.map((s, i) => {
                    const key    = s.id || i
                    const isOpen = expandedIds.has(key)
                    const counts = contarEstados(s.materias)
                    const hasErr = counts.err > 0 || counts.noAsig > 0
                    return (
                      <>
                        <tr
                          key={key}
                          className={`border-b transition-colors ${
                            isOpen
                              ? 'border-secondary/40 bg-secondary/5'
                              : hasErr
                                ? 'border-zinc-800/40 hover:bg-red-950/10'
                                : 'border-zinc-800/40 hover:bg-zinc-800/20'
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => toggleExpand(key)}
                              className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1 border transition-all ${
                                isOpen
                                  ? 'border-secondary/60 text-secondary bg-secondary/10 hover:bg-secondary/20'
                                  : 'border-zinc-600/50 text-text-muted hover:border-primary/50 hover:text-primary'
                              }`}
                            >
                              {isOpen ? 'OCULTAR ▲' : 'DESPLEGAR ▼'}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-text-primary font-semibold">{s.id}</td>
                          <td className="px-3 py-2.5 text-text-secondary max-w-[200px] truncate" title={s.programa}>{s.programa}</td>
                          <td className="px-3 py-2.5 text-text-secondary">{s.fechaIngreso}</td>
                          <td className="px-3 py-2.5 text-text-muted">{s.gradoIngreso}</td>
                          <td className="px-3 py-2.5 text-text-secondary">{s.gradoActual}</td>
                          <td className="px-3 py-2.5 text-text-muted">{s.estadoPlat}</td>
                          <td className="px-3 py-2.5 text-center text-emerald-400 font-semibold">{counts.ok || '—'}</td>
                          <td className="px-3 py-2.5 text-center">
                            {counts.err > 0 ? <span className="text-red-400 font-semibold">{counts.err}</span> : <span className="text-text-muted">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {counts.noAsig > 0 ? <span className="text-amber-400 font-semibold">{counts.noAsig}</span> : <span className="text-text-muted">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center text-zinc-500">{counts.pend || '—'}</td>
                          <td className="px-3 py-2.5 text-center text-text-muted">{s.materias.length}</td>
                        </tr>
                        {isOpen && (
                          <tr key={`${key}-detail`}>
                            <td colSpan={12} className="p-0">
                              <EstudianteDetalle student={s} />
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación + registros por página */}
            <div className="flex items-center justify-between mt-5 flex-wrap gap-3">

              {/* Por página */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
                <span>VER</span>
                {[10, 20, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => { setPorPag(n); setPagina(1) }}
                    className={`px-2.5 py-1 border transition-colors ${
                      porPag === n
                        ? 'border-primary/60 text-primary bg-primary/10'
                        : 'border-zinc-700/50 text-text-muted hover:border-zinc-500 hover:text-text-secondary'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <span>por página</span>
                {filtrados.length > 0 && (
                  <span className="ml-2 text-zinc-600">
                    ({(pagina - 1) * porPag + 1}–{Math.min(pagina * porPag, filtrados.length)} de {filtrados.length})
                  </span>
                )}
              </div>

              {/* Navegación */}
              {totalPag > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagina(1)}
                    disabled={pagina === 1}
                    title="Primera página"
                    className="px-2.5 py-1 text-[10px] font-mono border border-zinc-700/50 text-text-muted hover:border-primary/50 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="px-3 py-1 text-[10px] font-mono uppercase border border-zinc-700/50 text-text-muted hover:border-primary/50 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ‹ ANT
                  </button>
                  <span className="px-3 py-1 text-[10px] font-mono text-text-muted border border-zinc-800/60 bg-zinc-900/60 min-w-[72px] text-center">
                    {pagina} / {totalPag}
                  </span>
                  <button
                    onClick={() => setPagina(p => Math.min(totalPag, p + 1))}
                    disabled={pagina === totalPag}
                    className="px-3 py-1 text-[10px] font-mono uppercase border border-zinc-700/50 text-text-muted hover:border-primary/50 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    SIG ›
                  </button>
                  <button
                    onClick={() => setPagina(totalPag)}
                    disabled={pagina === totalPag}
                    title="Última página"
                    className="px-2.5 py-1 text-[10px] font-mono border border-zinc-700/50 text-text-muted hover:border-primary/50 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Estado vacío */}
        {!loading && !error && students.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-text-muted">
            <span className="text-5xl mb-4 opacity-30">🔍</span>
            <p className="text-sm font-mono">Ejecuta la validación para ver los resultados</p>
            <p className="text-[11px] font-mono opacity-60 mt-1">Se consultarán todos los estudiantes bachiller activos</p>
          </div>
        )}

      </div>
    </div>
  )
}
