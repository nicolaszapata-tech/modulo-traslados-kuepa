import { useState, useMemo, useRef } from 'react'

const N8N_WEBHOOK_URL = 'https://n8n.kuepa.com/webhook/validacion-productiva'

const N8N_NODES = [
  { id: 'webhook',    name: 'Webhook Trigger',       type: 'TRIGGER',  icon: '⚡' },
  { id: 'supabase',   name: 'HTTP Supabase',         type: 'HTTP',     icon: '🗄' },
  { id: 'leer',       name: 'Leer SEGUIMIENTO',      type: 'CODE',     icon: '⚙' },
  { id: 'bq_prog',    name: 'BigQuery — Programas',  type: 'BIGQUERY', icon: '🗄' },
  { id: 'agg_prog',   name: 'Agregar Programas',     type: 'CODE',     icon: '⚙' },
  { id: 'bq_mod',     name: 'BigQuery — Módulos',    type: 'BIGQUERY', icon: '🗄' },
  { id: 'proceso',    name: 'Proceso Productiva',    type: 'CODE',     icon: '⚙' },
  { id: 'respond',    name: 'Respond to Webhook',    type: 'RESPOND',  icon: '↩' },
]

function initNodeStatuses() {
  return N8N_NODES.map(n => ({ ...n, status: 'idle', ms: null }))
}

const TYPE_BADGE = {
  TRIGGER:  'bg-violet-900/60 text-violet-300',
  HTTP:     'bg-cyan-900/60 text-cyan-300',
  CODE:     'bg-sky-900/60 text-sky-300',
  BIGQUERY: 'bg-orange-900/60 text-orange-300',
  RESPOND:  'bg-zinc-700/60 text-zinc-300',
}

const ESTADOS_ACTIVOS_SET = new Set([
  'regular en verificación', 'regular', 'trasladado',
  'aplazado', 'en riesgo de abandono', 'nuevo',
])

function estadoPlataformaInfo(estado) {
  if (!estado) return { cls: 'text-white/25', bg: '' }
  const lower = estado.toLowerCase().trim()
  if (ESTADOS_ACTIVOS_SET.has(lower))
    return { cls: 'text-emerald-300 font-semibold', bg: 'bg-emerald-950/50' }
  return { cls: 'text-red-300 font-semibold', bg: 'bg-red-950/50' }
}

function etapaActualInfo(etapa) {
  switch ((etapa || '').toLowerCase()) {
    case 'adaptación':  return { cls: 'text-amber-300 font-semibold',  bg: 'bg-amber-950/50' }
    case 'desempeño':   return { cls: 'text-sky-300 font-semibold',    bg: 'bg-sky-950/50' }
    case 'proyección':  return { cls: 'text-violet-300 font-semibold', bg: 'bg-violet-950/50' }
    case 'finalizado':  return { cls: 'text-zinc-400',                 bg: 'bg-zinc-800/30' }
    case 'no iniciado': return { cls: 'text-zinc-500',                 bg: '' }
    default:            return { cls: 'text-white/20',                 bg: '' }
  }
}

// 3 módulos fijos: Adaptación, Desempeño, Proyección
const MOD_COLORS = [
  { header: 'bg-amber-800/90 text-amber-100',   stripe: 'bg-amber-900/60',   accent: 'text-amber-100',   label: 'ADAPTACIÓN'  },
  { header: 'bg-sky-800/90 text-sky-100',       stripe: 'bg-sky-900/60',     accent: 'text-sky-100',     label: 'DESEMPEÑO'   },
  { header: 'bg-violet-800/90 text-violet-100', stripe: 'bg-violet-900/60',  accent: 'text-violet-100',  label: 'PROYECCIÓN'  },
]

function parseRow(row) {
  const modulos = []
  for (let m = 0; m < 3; m++) {
    const b = 13 + m * 7
    modulos.push({
      materia_plat:  row[b]   ?? '',
      grupo_plat:    row[b+1] ?? '',
      id_grupo:      row[b+2] ?? '',
      fecha_inicio:  row[b+3] ?? '',
      materia_ancla: row[b+4] ?? '',
      fechas_ancla:  row[b+5] ?? '',
      estado:        row[b+6] ?? '',
    })
  }
  return {
    id_sis:            row[0]  ?? '',
    cedula:            row[1]  ?? '',
    nombre:            row[2]  ?? '',
    celular:           row[3]  ?? '',
    prog_seguimiento:  row[4]  ?? '',
    prog_plataforma:   row[5]  ?? '',
    confirmacion:      row[6]  ?? '',
    fecha_ini_prod:    row[7]  ?? '',
    fecha_fin_prod:    row[8]  ?? '',
    estado_plataforma: row[9]  ?? '',
    estado_academico:  row[10] ?? '',
    etapa_actual:      row[11] ?? '',
    total_incorrectos: parseInt(row[12]) || 0,
    modulos,
  }
}

function estadoInfo(estado) {
  if (!estado) return { bg: '', border: '', label: '—', color: 'text-white/20' }
  if (estado === 'CORRECTO')
    return { bg: 'bg-emerald-900/60', border: 'border-emerald-600/40', label: 'CORRECTO', color: 'text-emerald-300 font-semibold' }
  if (estado.includes('FALTA'))
    return { bg: 'bg-amber-900/60', border: 'border-amber-500/40', label: 'FALTA MATERIA', color: 'text-amber-300 font-semibold' }
  return { bg: 'bg-red-900/60', border: 'border-red-500/40', label: estado.replace('INCORRECTO - ', ''), color: 'text-red-300 font-semibold' }
}

function ProfileCell({ value, emptyLabel = '—', className = '' }) {
  if (!value) return <span className="text-white/20">{emptyLabel}</span>
  return <span className={className}>{value}</span>
}

function Th({ children, className = '', style = {}, rowSpan, colSpan }) {
  return (
    <th rowSpan={rowSpan} colSpan={colSpan} style={style}
      className={`border border-white/8 px-1.5 py-1 text-[9px] font-mono tracking-wider uppercase whitespace-nowrap ${className}`}>
      {children}
    </th>
  )
}

// ── N8n Flow Panel ────────────────────────────────────────────────────────
function N8nFlowPanel({ nodeStatuses, fase, lastRun, meta }) {
  const totalDoneMs = nodeStatuses.filter(n => n.ms !== null).reduce((acc, n) => acc + n.ms, 0)
  const overallStatus = fase === 'idle' ? 'EN ESPERA' : fase === 'loading' ? 'EJECUTANDO' : fase === 'error' ? 'ERROR' : 'COMPLETADO'
  const statusColor = fase === 'loading' ? 'text-amber-400' : fase === 'done' ? 'text-emerald-400' : fase === 'error' ? 'text-red-400' : 'text-text-muted/50'
  const dotColor = fase === 'loading' ? 'bg-amber-400 animate-pulse' : fase === 'done' ? 'bg-emerald-400' : fase === 'error' ? 'bg-red-400' : 'bg-zinc-600'

  return (
    <div className="border border-amber-500/15 bg-zinc-950 mb-5">
      <div className="flex items-center justify-between px-4 py-2 border-b border-amber-500/10">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
            n8n · <span className="text-amber-500/70">validacion-productiva</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {lastRun && <span className="text-[9px] font-mono text-text-muted/50">Última: {lastRun}</span>}
          {fase === 'done' && meta && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-text-muted"><span className="text-amber-400 font-bold">{meta.total ?? '—'}</span> est.</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">✓ {meta.sin_errores ?? '—'}</span>
              <span className="text-[10px] font-mono text-red-400 font-bold">✗ {meta.con_errores ?? '—'}</span>
            </div>
          )}
          <span className={`text-[9px] font-mono tracking-widest uppercase font-bold ${statusColor}`}>{overallStatus}</span>
        </div>
      </div>
      <div className="px-3 py-2 grid grid-cols-4 gap-x-2 gap-y-1">
        {nodeStatuses.map((node) => {
          const isRunning = node.status === 'running'
          const isDone    = node.status === 'ok'
          const isError   = node.status === 'error'
          const iconColor = isRunning ? 'text-amber-400 animate-pulse' : isDone ? 'text-emerald-400' : isError ? 'text-red-400' : 'text-white/15'
          const rowBg = isRunning ? 'bg-amber-500/5 border-amber-500/20' : isDone ? 'bg-emerald-950/30 border-emerald-800/20' : isError ? 'bg-red-950/30 border-red-800/20' : 'bg-transparent border-white/5'
          const nameColor = isRunning ? 'text-amber-400' : isDone ? 'text-white/85' : isError ? 'text-red-300' : 'text-white/25'
          return (
            <div key={node.id} className={`flex items-center gap-2 px-2 py-1 border rounded-sm transition-all duration-300 ${rowBg}`}>
              <span className={`text-[12px] w-4 flex-shrink-0 text-center ${iconColor}`}>
                {isRunning ? '⟳' : isDone ? '✓' : isError ? '✗' : '○'}
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-[10px] font-mono leading-tight truncate ${nameColor}`}>{node.name}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[8px] font-mono px-1 rounded-sm ${TYPE_BADGE[node.type]}`}>{node.type}</span>
                  {node.ms !== null && <span className="text-[8px] font-mono text-white/30">{node.ms < 1000 ? `${node.ms}ms` : `${(node.ms/1000).toFixed(1)}s`}</span>}
                  {isRunning && <span className="text-[8px] font-mono text-amber-400/70 animate-pulse">running…</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {fase === 'done' && totalDoneMs > 0 && (
        <div className="px-4 py-1.5 border-t border-amber-500/10 flex items-center justify-end">
          <span className="text-[9px] font-mono text-white/25">Tiempo total: {(totalDoneMs / 1000).toFixed(2)}s</span>
        </div>
      )}
    </div>
  )
}

// ── Filter Bar ─────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 500]
const ETAPAS_FILTRO = ['Adaptación', 'Desempeño', 'Proyección', 'Finalizado', 'No iniciado']

function FilterBar({ estudiantes, filtroTexto, setFiltroTexto, filtroProg, setFiltroProg, filtroError, setFiltroError, filtroEtapa, setFiltroEtapa }) {
  const programas = useMemo(() => [...new Set(estudiantes.map(e => e.prog_plataforma).filter(Boolean))].sort(), [estudiantes])

  return (
    <div className="flex flex-col gap-2 mb-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <input type="text" value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)}
            placeholder="Buscar nombre, cédula, ID..."
            className="bg-background border border-amber-500/20 text-text-primary text-[11px] font-mono px-2.5 py-1.5 outline-none focus:border-amber-500/50 placeholder:text-text-muted/40 w-52" />
          {filtroTexto && <button onClick={() => setFiltroTexto('')} className="text-text-muted hover:text-amber-400 font-mono text-xs px-1">✕</button>}
        </div>
        <span className="text-amber-500/15 font-mono">|</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50">Prog:</span>
          <button onClick={() => setFiltroProg('')} className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${filtroProg === '' ? 'border-amber-500/60 bg-amber-500/15 text-amber-400' : 'border-amber-500/15 text-text-muted/60 hover:text-amber-400 hover:border-amber-500/30'}`}>TODOS</button>
          {programas.map(p => (
            <button key={p} onClick={() => setFiltroProg(filtroProg === p ? '' : p)}
              className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${filtroProg === p ? 'border-amber-500/60 bg-amber-500/15 text-amber-400' : 'border-amber-500/15 text-text-muted/60 hover:text-amber-400 hover:border-amber-500/30'}`}>{p}</button>
          ))}
        </div>
        <span className="text-amber-500/15 font-mono">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50">Estado:</span>
          {[['', 'TODOS'], ['ok', 'SIN ERROR'], ['err', 'CON ERROR']].map(([val, label]) => (
            <button key={val} onClick={() => setFiltroError(val)}
              className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${
                filtroError === val
                  ? val === 'ok'  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                  : val === 'err' ? 'border-red-500/60 bg-red-500/15 text-red-400'
                  :                 'border-amber-500/60 bg-amber-500/15 text-amber-400'
                  : 'border-amber-500/15 text-text-muted/60 hover:text-amber-400 hover:border-amber-500/30'
              }`}>{label}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50">Etapa hoy:</span>
        <button onClick={() => setFiltroEtapa('')} className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${filtroEtapa === '' ? 'border-amber-500/60 bg-amber-500/15 text-amber-400' : 'border-amber-500/15 text-text-muted/60 hover:text-amber-400 hover:border-amber-500/30'}`}>TODAS</button>
        {ETAPAS_FILTRO.map(e => (
          <button key={e} onClick={() => setFiltroEtapa(filtroEtapa === e ? '' : e)}
            className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${filtroEtapa === e ? 'border-amber-500/60 bg-amber-500/15 text-amber-400' : 'border-amber-500/15 text-text-muted/60 hover:text-amber-400 hover:border-amber-500/30'}`}>{e}</button>
        ))}
      </div>
    </div>
  )
}

// ── Pagination ─────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, total, shown, pageSize, onPrev, onNext, onGoTo, onPageSize }) {
  function handlePageInput(e) {
    if (e.key !== 'Enter') return
    const v = parseInt(e.target.value)
    if (!isNaN(v) && v >= 1 && v <= totalPages) onGoTo(v - 1)
    e.target.value = ''
  }
  return (
    <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px] font-mono text-text-muted">
      <span className="text-white/40">{shown} / {total} estudiantes</span>
      <span className="text-white/10">|</span>
      <div className="flex items-center gap-1">
        <span className="text-white/30 uppercase tracking-widest text-[9px]">Mostrar:</span>
        {PAGE_SIZE_OPTIONS.map(s => (
          <button key={s} onClick={() => onPageSize(s)}
            className={`px-1.5 py-0.5 border transition-colors ${pageSize === s ? 'border-amber-500/60 bg-amber-500/15 text-amber-400' : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/25'}`}>{s}</button>
        ))}
      </div>
      {totalPages > 1 && (
        <>
          <span className="text-white/10">|</span>
          <button onClick={onPrev} disabled={page === 0} className="px-2 py-0.5 border border-white/10 hover:border-white/30 disabled:opacity-20 transition-colors">‹</button>
          {Array.from({ length: totalPages }, (_, i) => i)
            .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 2)
            .reduce((acc, i, idx, arr) => { if (idx > 0 && i - arr[idx-1] > 1) acc.push('…'); acc.push(i); return acc }, [])
            .map((item, idx) =>
              item === '…'
                ? <span key={`e${idx}`} className="text-white/20 px-1">…</span>
                : <button key={item} onClick={() => onGoTo(item)}
                    className={`min-w-[24px] px-1.5 py-0.5 border transition-colors ${item === page ? 'border-amber-500/60 bg-amber-500/15 text-amber-400' : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/25'}`}>{item + 1}</button>
            )
          }
          <button onClick={onNext} disabled={page >= totalPages - 1} className="px-2 py-0.5 border border-white/10 hover:border-white/30 disabled:opacity-20 transition-colors">›</button>
          <div className="flex items-center gap-1 ml-1">
            <span className="text-white/30 text-[9px]">Ir a:</span>
            <input type="number" min="1" max={totalPages} placeholder={String(page + 1)} onKeyDown={handlePageInput}
              className="w-12 bg-transparent border border-white/15 text-white/60 text-[10px] font-mono px-1.5 py-0.5 outline-none focus:border-amber-500/50 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
export default function ValidacionProductivaView({ onBack }) {
  const [fase,          setFase]          = useState('idle')
  const [estudiantes,   setEstudiantes]   = useState([])
  const [errorMsg,      setErrorMsg]      = useState('')
  const [meta,          setMeta]          = useState(null)
  const [lastRun,       setLastRun]       = useState(null)
  const [compactMode,   setCompactMode]   = useState(false)
  const [page,          setPage]          = useState(0)
  const [pageSize,      setPageSize]      = useState(50)
  const [filtroTexto,   setFiltroTexto]   = useState('')
  const [filtroProg,    setFiltroProg]    = useState('')
  const [filtroError,   setFiltroError]   = useState('')
  const [filtroEtapa,   setFiltroEtapa]   = useState('')
  const [nodeStatuses,  setNodeStatuses]  = useState(initNodeStatuses)

  const NODE_DELAYS = [300, 900, 400, 1800, 350, 1800, 700, 200]
  const advanceNodeRef = useRef(null)

  function setNodeStatus(idx, status, ms = null) {
    setNodeStatuses(prev => prev.map((n, i) => i === idx ? { ...n, status, ms } : n))
  }

  async function handleEjecutar() {
    setFase('loading')
    setNodeStatuses(initNodeStatuses())
    const nodeStartTimes = []

    const animPromise = (async () => {
      for (let i = 0; i < N8N_NODES.length; i++) {
        nodeStartTimes[i] = Date.now()
        setNodeStatus(i, 'running')
        await new Promise(r => { advanceNodeRef.current = r; setTimeout(r, NODE_DELAYS[i]) })
        setNodeStatus(i, 'ok', Date.now() - nodeStartTimes[i])
      }
    })()

    try {
      const resp = await fetch(N8N_WEBHOOK_URL, { method: 'POST' })
      if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`)
      const data = await resp.json()
      await animPromise
      const rows = data.rows ?? data.estudiantes ?? []
      const parsed = rows.map(parseRow)
      setEstudiantes(parsed)
      const sinErr = parsed.filter(e => e.total_incorrectos === 0).length
      setMeta(data.meta ?? { total: parsed.length, sin_errores: sinErr, con_errores: parsed.length - sinErr })
      setLastRun(new Date().toLocaleString('es-CO'))
      setPage(0)
      setFase('done')
    } catch (err) {
      setNodeStatuses(prev => {
        const runningIdx = prev.findIndex(n => n.status === 'running')
        return prev.map((n, i) => i === runningIdx ? { ...n, status: 'error', ms: null } : n)
      })
      setErrorMsg(err.message)
      setFase('error')
    }
  }

  function handleReset() {
    setFase('idle'); setEstudiantes([]); setErrorMsg('')
    setFiltroTexto(''); setFiltroProg(''); setFiltroError(''); setFiltroEtapa('')
    setPage(0); setNodeStatuses(initNodeStatuses())
  }

  const stats = useMemo(() => {
    const total = estudiantes.length
    const sinError = estudiantes.filter(e => e.total_incorrectos === 0).length
    return { total, sinError, conError: total - sinError }
  }, [estudiantes])

  const filtered = useMemo(() => {
    let list = estudiantes
    if (filtroTexto.trim()) {
      const q = filtroTexto.trim().toLowerCase()
      list = list.filter(e => e.nombre.toLowerCase().includes(q) || e.cedula.includes(q) || e.id_sis.includes(q))
    }
    if (filtroProg)  list = list.filter(e => e.prog_plataforma === filtroProg)
    if (filtroError === 'ok')  list = list.filter(e => e.total_incorrectos === 0)
    if (filtroError === 'err') list = list.filter(e => e.total_incorrectos > 0)
    if (filtroEtapa) list = list.filter(e => e.etapa_actual === filtroEtapa)
    return list
  }, [estudiantes, filtroTexto, filtroProg, filtroError, filtroEtapa])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageData   = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const cp   = compactMode ? 'px-1.5 py-0.5' : 'px-2 py-1.5'
  const textSz = compactMode ? 'text-[10px]' : 'text-[11px]'

  return (
    <div className="max-w-full mx-auto px-6 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-amber-400 transition-colors">‹ VOLVER</button>
        <span className="text-amber-500/20 font-mono">|</span>
        <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-amber-400 cursor-pointer transition-colors" onClick={onBack}>TÉCNICOS ETDH</span>
        <span className="text-amber-500/20 font-mono">›</span>
        <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500">VALIDACIÓN PRODUCTIVA</span>
      </div>

      {/* Título + botones */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 bg-amber-500/70 rounded-sm" />
            <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-amber-500/60">PRODUCTIVA</span>
          </div>
          <h1 className="font-display font-black text-2xl text-text-primary uppercase tracking-wider mb-1">
            Validación <span className="text-amber-400">Productiva</span>
          </h1>
          <p className="text-text-muted text-xs font-mono">
            Verifica etapas Adaptación · Desempeño · Proyección según fechas de ingreso a productiva.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {fase === 'done' && (
            <>
              <button onClick={() => setCompactMode(v => !v)}
                className={`px-3 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors ${compactMode ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' : 'border-amber-500/15 text-text-muted hover:text-amber-400'}`}>
                {compactMode ? '⊟ Compacto' : '⊞ Compacto'}
              </button>
              <button onClick={handleReset} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-amber-500/15 text-text-muted hover:text-amber-400 transition-colors">
                Nueva Ejecución
              </button>
            </>
          )}
          <button onClick={fase === 'idle' || fase === 'error' ? handleEjecutar : undefined} disabled={fase === 'loading'}
            className={`px-5 py-2 text-[11px] font-mono uppercase tracking-widest border transition-all duration-200 active:scale-95 ${
              fase === 'loading'  ? 'border-amber-500/20 text-text-muted cursor-not-allowed' :
              fase === 'done'     ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 cursor-default' :
              'border-amber-500 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-background cursor-pointer'
            }`}>
            {fase === 'loading'
              ? <span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />EJECUTANDO...</span>
              : fase === 'done' ? `✓ COMPLETADO — ${stats.total} EST.`
              : '▶ EJECUTAR PROCESO COMPLETO'}
          </button>
        </div>
      </div>

      {/* Panel n8n */}
      <N8nFlowPanel nodeStatuses={nodeStatuses} fase={fase} lastRun={lastRun} meta={meta} />

      {/* ── IDLE ── */}
      {fase === 'idle' && (
        <div className="border border-amber-500/10 px-6 py-10 text-center flex flex-col items-center gap-3">
          <div className="text-amber-500/15 text-4xl font-mono">◈</div>
          <div className="text-text-muted/50 text-xs font-mono tracking-widest uppercase">Presiona "▶ EJECUTAR PROCESO COMPLETO" para iniciar</div>
        </div>
      )}

      {/* ── ERROR ── */}
      {fase === 'error' && (
        <div className="border border-red-500/30 px-6 py-8 text-center">
          <div className="text-red-400 font-mono text-sm mb-2">✗ Error en la ejecución</div>
          <div className="text-text-muted text-xs font-mono">{errorMsg}</div>
          <button onClick={handleReset} className="mt-4 text-[10px] font-mono uppercase tracking-widest border border-amber-500/20 text-text-muted hover:text-amber-400 px-4 py-2 transition-colors">Reintentar</button>
        </div>
      )}

      {/* ── DONE ── */}
      {fase === 'done' && (
        <>
          {/* Resumen */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Resumen:</span>
            <span className="text-xs font-mono font-bold text-amber-400">{stats.total} en productiva</span>
            <span className="text-amber-500/20">|</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{stats.sinError} correctos</span>
            <span className="text-amber-500/20">|</span>
            <span className="text-xs font-mono font-bold text-red-400">{stats.conError} con errores</span>
          </div>

          <FilterBar
            estudiantes={estudiantes}
            filtroTexto={filtroTexto}   setFiltroTexto={t => { setFiltroTexto(t); setPage(0) }}
            filtroProg={filtroProg}     setFiltroProg={p => { setFiltroProg(p); setPage(0) }}
            filtroError={filtroError}   setFiltroError={e => { setFiltroError(e); setPage(0) }}
            filtroEtapa={filtroEtapa}   setFiltroEtapa={e => { setFiltroEtapa(e); setPage(0) }}
          />

          <div className="overflow-auto border border-amber-500/10" style={{ maxHeight: '72vh' }}>
            <table className={`font-mono border-collapse ${textSz}`} style={{ minWidth: '4400px' }}>
              <thead className="sticky top-0 z-20">
                <tr>
                  <Th rowSpan={2} className="sticky left-0 z-30 bg-zinc-900 text-amber-400/80" style={{ minWidth: '58px', left: 0 }}>ID SIS</Th>
                  <Th rowSpan={2} className="sticky z-30 bg-zinc-900 text-primary/70" style={{ minWidth: '104px', left: '58px' }}>Cédula</Th>
                  <Th rowSpan={2} className="sticky z-30 bg-zinc-900 text-primary/70" style={{ minWidth: '170px', left: '162px' }}>Nombre</Th>
                  <Th rowSpan={2} className="bg-zinc-900 text-primary/50">Celular</Th>
                  <Th rowSpan={2} className="bg-zinc-900 text-primary/50" style={{ minWidth: '70px' }}>Prog. Seg.</Th>
                  <Th rowSpan={2} className="bg-zinc-900 text-primary/50" style={{ minWidth: '70px' }}>Prog. Plat.</Th>
                  <Th rowSpan={2} className="bg-zinc-900 text-primary/50" style={{ minWidth: '50px' }}>Compat.</Th>
                  <Th rowSpan={2} className="bg-zinc-900 text-amber-400/60" style={{ minWidth: '90px' }}>F. Ini. Prod.</Th>
                  <Th rowSpan={2} className="bg-zinc-900 text-amber-400/60" style={{ minWidth: '90px' }}>F. Fin. Prod.</Th>
                  <Th rowSpan={2} className="bg-zinc-900 text-primary/50" style={{ minWidth: '130px' }}>Estado Plataforma</Th>
                  <Th rowSpan={2} className="bg-zinc-900 text-amber-400/60" style={{ minWidth: '120px' }}>Estado Seguimiento</Th>
                  <Th rowSpan={2} className="bg-zinc-900 text-amber-400/80" style={{ minWidth: '100px' }}>Etapa Hoy</Th>
                  <Th rowSpan={2} className="bg-zinc-900 text-primary/50" style={{ minWidth: '44px' }}>Total ✗</Th>
                  {MOD_COLORS.map((mc, i) => (
                    <Th key={i} colSpan={7} className={`text-center font-bold ${mc.header}`} style={{ minWidth: '770px' }}>
                      {mc.label}
                    </Th>
                  ))}
                </tr>
                <tr>
                  {MOD_COLORS.map((mc, i) => (
                    <>
                      <Th key={`m${i}-mat`}    className={`${mc.header} opacity-85`} style={{ minWidth: '150px' }}>Materia Plat.</Th>
                      <Th key={`m${i}-grp`}    className={`${mc.header} opacity-85`} style={{ minWidth: '170px' }}>Nombre Grupo</Th>
                      <Th key={`m${i}-id`}     className={`${mc.header} opacity-85`} style={{ minWidth: '170px' }}>ID Grupo</Th>
                      <Th key={`m${i}-fecha`}  className={`${mc.header} opacity-85`} style={{ minWidth: '80px'  }}>F. Inicio</Th>
                      <Th key={`m${i}-ancla`}  className={`${mc.header} opacity-85`} style={{ minWidth: '150px' }}>Materia Ancla</Th>
                      <Th key={`m${i}-fancla`} className={`${mc.header} opacity-85`} style={{ minWidth: '150px' }}>Fechas Ancla</Th>
                      <Th key={`m${i}-est`}    className={`${mc.header} opacity-85`} style={{ minWidth: '120px' }}>Estado</Th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((est, ri) => {
                  const hasError  = est.total_incorrectos > 0
                  const baseRow   = ri % 2 === 0 ? 'bg-zinc-900/60' : 'bg-zinc-800/40'
                  const stickyBg  = hasError ? 'bg-red-950/80' : (ri % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/80')
                  const idColor   = hasError ? 'text-red-300 font-bold' : 'text-amber-400 font-bold'
                  const nameColor = hasError ? 'text-red-200 font-medium' : 'text-white/90 font-medium'
                  const ep        = estadoPlataformaInfo(est.estado_plataforma)
                  const ea        = etapaActualInfo(est.etapa_actual)
                  return (
                    <tr key={est.id_sis + ri} className={`${baseRow} hover:brightness-110 transition-all`}>
                      <td className={`sticky z-10 border border-white/6 ${cp} whitespace-nowrap ${stickyBg} ${idColor}`} style={{ left: 0 }}>
                        <ProfileCell value={est.id_sis} className={idColor} />
                      </td>
                      <td className={`sticky z-10 border border-white/6 ${cp} whitespace-nowrap ${stickyBg} text-white/80`} style={{ left: '58px' }}>
                        <ProfileCell value={est.cedula} className="text-white/80" />
                      </td>
                      <td className={`sticky z-10 border border-white/6 ${cp} whitespace-nowrap ${stickyBg} ${nameColor}`} style={{ left: '162px' }}>
                        <ProfileCell value={est.nombre} className={nameColor} />
                      </td>
                      <td className={`border border-white/6 ${cp} text-white/60 whitespace-nowrap`}>
                        <ProfileCell value={est.celular} className="text-white/60" />
                      </td>
                      <td className={`border border-white/6 ${cp} text-center`}>
                        <span className="text-amber-400 font-bold">{est.prog_seguimiento}</span>
                      </td>
                      <td className={`border border-white/6 ${cp} text-center`}>
                        <span className="text-amber-300 font-bold">{est.prog_plataforma}</span>
                      </td>
                      <td className={`border border-white/6 ${cp} text-center`}>
                        <span className={`font-bold ${est.confirmacion === '✓' ? 'text-emerald-400' : 'text-red-400'}`}>{est.confirmacion}</span>
                      </td>
                      <td className={`border border-white/6 ${cp} text-amber-300/80 whitespace-nowrap text-center`}>{est.fecha_ini_prod || '—'}</td>
                      <td className={`border border-white/6 ${cp} text-amber-300/60 whitespace-nowrap text-center`}>{est.fecha_fin_prod || '—'}</td>
                      <td className={`border border-white/6 ${cp} ${ep.bg}`}>
                        <span className={`text-[10px] ${ep.cls}`}>{est.estado_plataforma || '—'}</span>
                      </td>
                      <td className={`border border-white/6 ${cp} text-amber-300/70 whitespace-nowrap`}>
                        {est.estado_academico || '—'}
                      </td>
                      <td className={`border border-white/6 ${cp} ${ea.bg} text-center whitespace-nowrap`}>
                        <span className={`text-[10px] ${ea.cls}`}>{est.etapa_actual || '—'}</span>
                      </td>
                      <td className={`border border-white/6 ${cp} text-center`}>
                        <span className={`font-bold ${est.total_incorrectos === 0 ? 'text-emerald-400' : 'text-white bg-red-600/80 px-1.5 py-0.5 rounded-sm'}`}>
                          {est.total_incorrectos}
                        </span>
                      </td>
                      {est.modulos.map((mod, mi) => {
                        const s      = estadoInfo(mod.estado)
                        const noAsig = mod.materia_plat === 'MATERIA NO ASIGNADA' || !mod.materia_plat
                        const stripe = MOD_COLORS[mi].stripe
                        const accent = MOD_COLORS[mi].accent
                        return (
                          <>
                            <td key={`r${ri}m${mi}-mat`} className={`border border-white/8 ${cp} ${stripe}`}>
                              {noAsig
                                ? <span className="text-white/30 italic text-[10px]">sin asignar</span>
                                : <span className={`${accent} font-semibold text-[11px] leading-snug block`}>{mod.materia_plat}</span>}
                            </td>
                            <td key={`r${ri}m${mi}-grp`} className={`border border-white/8 ${cp} ${stripe}`}>
                              <span className="text-white/85 leading-snug block text-[10px]">{mod.grupo_plat || <span className="text-white/25">—</span>}</span>
                            </td>
                            <td key={`r${ri}m${mi}-id`} className={`border border-white/8 ${cp} ${stripe}`}>
                              <span className="text-white/70 text-[9px] leading-tight block font-mono break-all">{mod.id_grupo || '—'}</span>
                            </td>
                            <td key={`r${ri}m${mi}-fi`} className={`border border-white/8 ${cp} ${stripe} text-center`}>
                              <span className="text-white/85 whitespace-nowrap text-[10px] font-medium">{mod.fecha_inicio || '—'}</span>
                            </td>
                            <td key={`r${ri}m${mi}-anc`} className={`border border-white/8 ${cp} ${stripe}`}>
                              <span className="text-white/90 leading-snug block text-[10px] font-medium">{mod.materia_ancla || '—'}</span>
                            </td>
                            <td key={`r${ri}m${mi}-fa`} className={`border border-white/8 ${cp} ${stripe} text-center`}>
                              <span className="text-white/80 whitespace-nowrap text-[10px]">{mod.fechas_ancla || '—'}</span>
                            </td>
                            <td key={`r${ri}m${mi}-est`} className={`border border-white/8 ${cp} ${s.bg} text-center`}>
                              <span className={`text-[10px] font-bold tracking-wide leading-tight block ${s.color}`}>{s.label}</span>
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

          <Pagination
            page={page} totalPages={totalPages} total={filtered.length} shown={pageData.length}
            pageSize={pageSize}
            onPrev={() => setPage(p => Math.max(0, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            onGoTo={setPage}
            onPageSize={s => { setPageSize(s); setPage(0) }}
          />
        </>
      )}
    </div>
  )
}
