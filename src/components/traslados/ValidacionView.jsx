import { useState, useMemo, useEffect, useRef } from 'react'

const N8N_WEBHOOK_URL = 'https://n8n.kuepa.com/webhook/asignacion-etdh'

const N8N_NODES = [
  { id: 'webhook',    name: 'Webhook Trigger',         type: 'TRIGGER',  icon: '⚡' },
  { id: 'sheets',     name: 'SEGUIMIENTO ETDH',        type: 'SHEETS',   icon: '📊' },
  { id: 'filter',     name: 'Filtrar Lectiva',          type: 'CODE',     icon: '⚙' },
  { id: 'bq_prog',    name: 'BigQuery — Programas',     type: 'BIGQUERY', icon: '🗄' },
  { id: 'cross_prog', name: 'Cruzar Programas',         type: 'CODE',     icon: '⚙' },
  { id: 'bq_mod',     name: 'BigQuery — Módulos',       type: 'BIGQUERY', icon: '🗄' },
  { id: 'proceso',    name: 'Proceso Completo',         type: 'CODE',     icon: '⚙' },
  { id: 'respond',    name: 'Respond to Webhook',       type: 'RESPOND',  icon: '↩' },
]

function initNodeStatuses() {
  return N8N_NODES.map(n => ({ ...n, status: 'idle', ms: null }))
}

const TYPE_BADGE = {
  TRIGGER:  'bg-violet-900/60 text-violet-300',
  SHEETS:   'bg-emerald-900/60 text-emerald-300',
  CODE:     'bg-sky-900/60 text-sky-300',
  BIGQUERY: 'bg-orange-900/60 text-orange-300',
  RESPOND:  'bg-zinc-700/60 text-zinc-300',
}

// ── Estado plataforma ────────────────────────────────────────────────────
const ESTADOS_ACTIVOS_SET = new Set([
  'regular en verificación',
  'regular',
  'trasladado',
  'aplazado',
  'en riesgo de abandono',
  'nuevo',
])

function estadoPlataformaInfo(estado) {
  if (!estado) return { cls: 'text-white/25', bg: '' }
  const lower = estado.toLowerCase().trim()
  if (ESTADOS_ACTIVOS_SET.has(lower))
    return { cls: 'text-emerald-300 font-semibold', bg: 'bg-emerald-950/50' }
  return { cls: 'text-red-300 font-semibold', bg: 'bg-red-950/50' }
}

// ── Ordenar períodos ─────────────────────────────────────────────────────
const MESES_ORD = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
function sortPeriodo(a, b) {
  function parse(p) {
    const parts = (p || '').trim().split(/\s+/)
    return { yr: parts[2] ? parseInt(parts[2]) : 2025, mo: MESES_ORD.indexOf(parts[0]), q: parts[1] === 'I' ? 0 : 1 }
  }
  const pa = parse(a), pb = parse(b)
  if (pa.yr !== pb.yr) return pa.yr - pb.yr
  if (pa.mo !== pb.mo) return pa.mo - pb.mo
  return pa.q - pb.q
}
function sortPeriodosArray(arr) { return [...arr].sort(sortPeriodo) }

// ── Sample data ───────────────────────────────────────────────────────────
const SAMPLE_RAW = [
  ["27178","1005713909","TATIANA MARCELA GUTIERREZ MATOMA","3229182361","TLAA","TLAA","✓","16/09/2025","SEP II","Retiro académico","27178","SEP II","TLAA","3","Módulo 0 - Alfa","M0-TLAA OCT I","6842fabe28e0c007e0f8fc43","01/10/2025","MODULO ALPHA","16/9/2025 - 29/9/2025","SEP II","INCORRECTO - FECHA FUERA DE RANGO","Gestión documental","TLAA - Grupo G ENE I 2026 - MAR II 2026","68437cc39b89c2275b0f75c6","13/01/2026","Gestión Documental","1/10/2025 - 15/10/2025","OCT I","INCORRECTO - FECHA FUERA DE RANGO","Talento humano","TLAA - Grupo A sep 2025 - nov 2025","67c45cae94d7ff12760ed5e2","16/10/2025","Talento Humano","16/10/2025 - 29/10/2025","OCT II","CORRECTO","Mercado y servicio al cliente","TLAA - Grupo E sep 2025 - nov 2025","67cdf0eb9fdb0e1063b66631","30/10/2025","Mercado y Servicio al cliente","30/10/2025 - 13/11/2025","NOV I","CORRECTO","Contabilidad y finanzas","TLAA - Grupo B nov 2025 - dic 2025","68470b70223cbf063673ee7d","14/11/2025","Contabilidad y Finanzas","14/11/2025 - 28/11/2025","NOV II","CORRECTO","Matemáticas y estadística","TLAA - Grupo I oct 2025 - dic 2025","67ce194fcbba8d0fb4ab920e","01/12/2025","Matemáticas y Estadística","1/12/2025 - 15/12/2025","DIC I","CORRECTO","Nuevas tendencias de la administración","TLAA - Grupo A dic 2025 - dic 2025","68434eda25bfe90cb07944ea","16/12/2025","Nuevas tendencias de la administración","16/12/2025 - 19/12/2025","DIC II","CORRECTO","Excel business","Excel business - Grupo A ENE II","68cdc1165001570fd9345b1a","19/01/2026","MODULO OMEGA","13/1/2026 - 17/1/2026","ENE I 2026","INCORRECTO - FECHA FUERA DE RANGO"],
  ["27341","1010033073","Angie Julieth Torres Mosquera","3046056274","TLAA","TLAA","✓","16/10/2025","OCT II","Regular en verificación","27341","OCT II","TLAA","0","Módulo 0 - Alfa","M0-TLAA OCT II","684307da3eadcc0fda15663d","16/10/2025","MODULO ALPHA","16/10/2025 - 29/10/2025","OCT II","CORRECTO","Mercado y servicio al cliente","TLAA - Grupo E sep 2025 - nov 2025","67cdf0eb9fdb0e1063b66631","30/10/2025","Mercado y Servicio al cliente","30/10/2025 - 13/11/2025","NOV I","CORRECTO","Contabilidad y finanzas","TLAA - Grupo A sep 2025 - nov 2025","67c45ca194d7ff12760ed16d","14/11/2025","Contabilidad y Finanzas","14/11/2025 - 28/11/2025","NOV II","CORRECTO","Matemáticas y estadística","TLAA - Grupo F dic 2025 - dic 2025","68437906f796950affb90156","01/12/2025","Matemáticas y Estadística","1/12/2025 - 15/12/2025","DIC I","CORRECTO","Nuevas tendencias de la administración","TLAA - Grupo I dic 2025 - dic 2025","68475af09b022a0fdb669df8","16/12/2025","Nuevas tendencias de la administración","16/12/2025 - 19/12/2025","DIC II","CORRECTO","Gestión documental","TLAA - Grupo B ene 2026 - mar 2026","68470dfc1f1e6905c0b501de","13/01/2026","Gestión Documental","13/1/2026 - 17/1/2026","ENE I 2026","CORRECTO","Talento humano","TLAA - Grupo B ene 2026 - mar 2026","68470dd81f1e6905c0b4f7e8","19/01/2026","Talento Humano","19/1/2026 - 30/1/2026","ENE II 2026","CORRECTO","Excel business","Excel business - Grupo A FEB I","691743bb33991b36ccc75088","02/02/2026","MODULO OMEGA","2/2/2026 - 13/2/2026","FEB I 2026","CORRECTO"],
  ["27676","1019086615","Paola Osorio","3204696510","TLMV","TLMV","✓","30/10/2025","NOV I","Retiro académico","27676","NOV I","TLMV","0","Módulo Alpha TLMV","M0-TLMV NOV I","6849e74e0f8a260213c3cdc6","30/10/2025","MODULO ALPHA","30/10/2025 - 13/11/2025","NOV I","CORRECTO","Prospección y servicio a clientes","TLMV - Grupo C nov 2025 - dic 2025","68484736d52a5b056fb6bc7b","14/11/2025","Prospección y servicio a clientes","14/11/2025 - 28/11/2025","NOV II","CORRECTO","Negociación de productos, precios y servicios","TLMV - Grupo A nov 2025 - dic 2025","684839ab28ba421047b5fb08","01/12/2025","Negociación de productos, precios y servicios","1/12/2025 - 15/12/2025","DIC I","CORRECTO","Experiencia de usuario","TLMV - Grupo B nov 2025 - dic 2025","684842c9b3807e12ddf43232","16/12/2025","Experiencia de usuario","16/12/2025 - 19/12/2025","DIC II","CORRECTO","Análisis de datos para mercadeo y ventas","TLMV - Grupo B ene 2026","684843d9c806d304c1252de8","13/01/2026","Análisis de Datos para Mercadeo y Ventas","13/1/2026 - 17/1/2026","ENE I 2026","CORRECTO","Marketing Relacional y Fidelización","TLMV - Grupo C ene 2026","68484769d52a5b056fb6ca5d","19/01/2026","Marketing Relacional y Fidelización","19/1/2026 - 30/1/2026","ENE II 2026","CORRECTO","Fundamentos de mercadeo y ventas","TLMV - Grupo C FEB I 2026","684847fb08bfc6065cc641b9","02/02/2026","Fundamentos de Mercadeo y Ventas","2/2/2026 - 13/2/2026","FEB I 2026","CORRECTO","Excel Business TLMV","Excel business - Grupo A FEB II","695ebdc4eb74652beca5ff4c","16/02/2026","MODULO OMEGA","16/2/2026 - 27/2/2026","FEB II 2026","CORRECTO"],
]

function parseRow(row) {
  const modulos = []
  for (let m = 0; m < 8; m++) {
    const b = 14 + m * 8
    modulos.push({
      materia_plat:  row[b]   ?? '',
      grupo_plat:    row[b+1] ?? '',
      id_grupo:      row[b+2] ?? '',
      fecha_inicio:  row[b+3] ?? '',
      materia_ancla: row[b+4] ?? '',
      fechas_ancla:  row[b+5] ?? '',
      periodo_ancla: row[b+6] ?? '',
      estado:        row[b+7] ?? '',
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
    fecha_ingreso:     row[7]  ?? '',
    periodo_deberia:   row[8]  ?? '',
    estado_plataforma: row[9]  ?? '',
    periodo_ingreso:   row[11] ?? '',
    programa:          row[12] ?? '',
    total_incorrectos: parseInt(row[13]) || 0,
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

const MOD_COLORS = [
  { header: 'bg-cyan-800/90   text-cyan-100',    stripe: 'bg-cyan-900/70',    accent: 'text-cyan-100'    },
  { header: 'bg-orange-800/90 text-orange-100',  stripe: 'bg-orange-900/70',  accent: 'text-orange-100'  },
  { header: 'bg-violet-800/90 text-violet-100',  stripe: 'bg-violet-900/70',  accent: 'text-violet-100'  },
  { header: 'bg-emerald-800/90 text-emerald-100',stripe: 'bg-emerald-900/70', accent: 'text-emerald-100' },
  { header: 'bg-yellow-800/90 text-yellow-100',  stripe: 'bg-yellow-900/70',  accent: 'text-yellow-100'  },
  { header: 'bg-pink-800/90   text-pink-100',    stripe: 'bg-pink-900/70',    accent: 'text-pink-100'    },
  { header: 'bg-sky-800/90    text-sky-100',     stripe: 'bg-sky-900/70',     accent: 'text-sky-100'     },
  { header: 'bg-rose-800/90   text-rose-100',    stripe: 'bg-rose-900/70',    accent: 'text-rose-100'    },
]

function isFormulaError(val) {
  const s = String(val ?? '').trim()
  return s.startsWith('#') || s.includes('Did not find') || s.includes('XLOOKUP') || s.includes('Error')
}

function ProfileCell({ value, emptyLabel = '—', className = '' }) {
  if (!value) return <span className="text-white/20">{emptyLabel}</span>
  if (isFormulaError(value)) return <span className="text-red-400/70 text-[9px] font-mono">#ERR</span>
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
  const statusColor = fase === 'loading' ? 'text-secondary' : fase === 'done' ? 'text-emerald-400' : fase === 'error' ? 'text-red-400' : 'text-text-muted/50'
  const dotColor = fase === 'loading' ? 'bg-secondary animate-pulse' : fase === 'done' ? 'bg-emerald-400' : fase === 'error' ? 'bg-red-400' : 'bg-zinc-600'

  return (
    <div className="border border-primary/15 bg-zinc-950 mb-5">
      <div className="flex items-center justify-between px-4 py-2 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
            n8n · <span className="text-primary/70">asignacion-etdh</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {lastRun && <span className="text-[9px] font-mono text-text-muted/50">Última: {lastRun}</span>}
          {fase === 'done' && meta && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-text-muted"><span className="text-secondary font-bold">{meta.total ?? '—'}</span> est.</span>
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
          const iconColor = isRunning ? 'text-secondary animate-pulse' : isDone ? 'text-emerald-400' : isError ? 'text-red-400' : 'text-white/15'
          const rowBg = isRunning ? 'bg-secondary/5 border-secondary/20' : isDone ? 'bg-emerald-950/30 border-emerald-800/20' : isError ? 'bg-red-950/30 border-red-800/20' : 'bg-transparent border-white/5'
          const nameColor = isRunning ? 'text-secondary' : isDone ? 'text-white/85' : isError ? 'text-red-300' : 'text-white/25'
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
                  {isRunning && <span className="text-[8px] font-mono text-secondary/70 animate-pulse">running…</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {fase === 'done' && totalDoneMs > 0 && (
        <div className="px-4 py-1.5 border-t border-primary/10 flex items-center justify-end">
          <span className="text-[9px] font-mono text-white/25">Tiempo total: {(totalDoneMs / 1000).toFixed(2)}s</span>
        </div>
      )}
    </div>
  )
}

// ── Filter Bar ─────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 500]

function FilterBar({ estudiantes, filtroTexto, setFiltroTexto, filtroProg, setFiltroProg, filtroError, setFiltroError, filtroPeriodo, setFiltroPeriodo }) {
  const programas = useMemo(() => [...new Set(estudiantes.map(e => e.programa).filter(Boolean))].sort(), [estudiantes])
  const periodos  = useMemo(() => sortPeriodosArray([...new Set(estudiantes.map(e => e.periodo_deberia).filter(Boolean))]), [estudiantes])

  return (
    <div className="flex flex-col gap-2 mb-3">
      {/* Row 1: texto + prog + error */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <input type="text" value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)}
            placeholder="Buscar nombre, cédula, ID..."
            className="bg-background border border-primary/20 text-text-primary text-[11px] font-mono px-2.5 py-1.5 outline-none focus:border-secondary/50 placeholder:text-text-muted/40 w-52" />
          {filtroTexto && <button onClick={() => setFiltroTexto('')} className="text-text-muted hover:text-primary font-mono text-xs px-1">✕</button>}
        </div>
        <span className="text-primary/15 font-mono">|</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50">Prog:</span>
          <button onClick={() => setFiltroProg('')} className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${filtroProg === '' ? 'border-secondary/60 bg-secondary/15 text-secondary' : 'border-primary/15 text-text-muted/60 hover:text-primary hover:border-primary/30'}`}>TODOS</button>
          {programas.map(p => (
            <button key={p} onClick={() => setFiltroProg(filtroProg === p ? '' : p)}
              className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${filtroProg === p ? 'border-secondary/60 bg-secondary/15 text-secondary' : 'border-primary/15 text-text-muted/60 hover:text-primary hover:border-primary/30'}`}>{p}</button>
          ))}
        </div>
        <span className="text-primary/15 font-mono">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50">Estado:</span>
          {[['', 'TODOS'], ['ok', 'SIN ERROR'], ['err', 'CON ERROR']].map(([val, label]) => (
            <button key={val} onClick={() => setFiltroError(val)}
              className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${
                filtroError === val
                  ? val === 'ok'  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                  : val === 'err' ? 'border-red-500/60 bg-red-500/15 text-red-400'
                  :                 'border-secondary/60 bg-secondary/15 text-secondary'
                  : 'border-primary/15 text-text-muted/60 hover:text-primary hover:border-primary/30'
              }`}>{label}</button>
          ))}
        </div>
      </div>
      {/* Row 2: filtro por período */}
      {periodos.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50">Período Deb.:</span>
          <button onClick={() => setFiltroPeriodo('')} className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${filtroPeriodo === '' ? 'border-secondary/60 bg-secondary/15 text-secondary' : 'border-primary/15 text-text-muted/60 hover:text-primary hover:border-primary/30'}`}>TODOS</button>
          {periodos.map(p => (
            <button key={p} onClick={() => setFiltroPeriodo(filtroPeriodo === p ? '' : p)}
              className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${filtroPeriodo === p ? 'border-secondary/60 bg-secondary/15 text-secondary' : 'border-primary/15 text-text-muted/60 hover:text-primary hover:border-primary/30'}`}>{p}</button>
          ))}
        </div>
      )}
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
            className={`px-1.5 py-0.5 border transition-colors ${pageSize === s ? 'border-secondary/60 bg-secondary/15 text-secondary' : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/25'}`}>{s}</button>
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
                    className={`min-w-[24px] px-1.5 py-0.5 border transition-colors ${item === page ? 'border-secondary/60 bg-secondary/15 text-secondary' : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/25'}`}>{item + 1}</button>
            )
          }
          <button onClick={onNext} disabled={page >= totalPages - 1} className="px-2 py-0.5 border border-white/10 hover:border-white/30 disabled:opacity-20 transition-colors">›</button>
          <div className="flex items-center gap-1 ml-1">
            <span className="text-white/30 text-[9px]">Ir a:</span>
            <input type="number" min="1" max={totalPages} placeholder={String(page + 1)} onKeyDown={handlePageInput}
              className="w-12 bg-transparent border border-white/15 text-white/60 text-[10px] font-mono px-1.5 py-0.5 outline-none focus:border-secondary/50 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
        </>
      )}
    </div>
  )
}

// ── Reporte View ───────────────────────────────────────────────────────────
function ReporteView({ estudiantes }) {
  const [tipo,           setTipo]           = useState('ACTIVOS')
  const [periodoRevision, setPeriodoRevision] = useState('')

  // Todos los períodos ancla disponibles en los módulos
  const periodos = useMemo(() => {
    const set = new Set()
    for (const est of estudiantes)
      for (const mod of est.modulos)
        if (mod.periodo_ancla) set.add(mod.periodo_ancla)
    return sortPeriodosArray([...set])
  }, [estudiantes])

  // Materias esperadas por programa para el período de revisión
  const materiasRevision = useMemo(() => {
    if (!periodoRevision) return null
    const r = { ALPHA: '', TLAA: '', TLMV: '', TLCF: '', TLPDD: '', OMEGA: '' }
    for (const est of estudiantes) {
      for (const mod of est.modulos) {
        if (mod.periodo_ancla !== periodoRevision || !mod.materia_ancla) continue
        const up = mod.materia_ancla.toUpperCase()
        if (up.includes('ALPHA') || up.includes('ALFA') || up.includes('MODULO 0') || up.includes('M0')) {
          if (!r.ALPHA) r.ALPHA = mod.materia_ancla
        } else if (up.includes('OMEGA') || up.includes('EXCEL')) {
          if (!r.OMEGA) r.OMEGA = mod.materia_ancla
        } else {
          const prog = est.prog_plataforma
          if (prog && r[prog] === '') r[prog] = mod.materia_ancla
        }
      }
    }
    return r
  }, [estudiantes, periodoRevision])

  // Filas del reporte: estudiantes con error en el período de revisión
  const reportRows = useMemo(() => {
    if (!periodoRevision) return []
    const rows = []
    for (const est of estudiantes) {
      if (tipo === 'ACTIVOS') {
        const lower = (est.estado_plataforma || '').toLowerCase().trim()
        if (!ESTADOS_ACTIVOS_SET.has(lower)) continue
      }
      const mod = est.modulos.find(m => m.periodo_ancla === periodoRevision)
      if (!mod) continue
      if (!mod.estado || (!mod.estado.includes('INCORRECTO') && !mod.estado.includes('FALTA'))) continue
      rows.push({ est, mod })
    }
    return rows
  }, [estudiantes, tipo, periodoRevision])

  if (estudiantes.length === 0) {
    return (
      <div className="border border-primary/10 px-6 py-12 text-center">
        <div className="text-secondary/15 text-4xl font-mono mb-3">◈</div>
        <div className="text-text-muted/50 text-xs font-mono tracking-widest uppercase">
          Ejecuta el Proceso Completo en la pestaña Validación para habilitar el Reporte
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Controles */}
      <div className="flex items-start gap-8 mb-5 flex-wrap">
        {/* Tipo */}
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50 mb-2">Tipo de estudiantes</div>
          <div className="flex gap-2">
            {[['ACTIVOS', '✅ Solo Activos'], ['TODOS', '📋 Todos']].map(([val, label]) => (
              <button key={val} onClick={() => setTipo(val)}
                className={`px-3 py-2 text-[10px] font-mono border transition-colors ${
                  tipo === val
                    ? val === 'ACTIVOS' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                    : 'border-secondary/60 bg-secondary/15 text-secondary'
                    : 'border-primary/15 text-text-muted/60 hover:text-primary hover:border-primary/30'
                }`}>{label}</button>
            ))}
          </div>
          <div className={`mt-2 text-[9px] font-mono ${tipo === 'ACTIVOS' ? 'text-emerald-400/60' : 'text-text-muted/40'}`}>
            {tipo === 'ACTIVOS'
              ? 'Regular en Verificación · Regular · Trasladado · Aplazado · En Riesgo · Nuevo'
              : 'Sin filtro de estado — incluye retiros, abandonos, etc.'}
          </div>
        </div>

        {/* Período de revisión */}
        <div className="flex-1">
          <div className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50 mb-2">Período de revisión</div>
          <div className="flex gap-1.5 flex-wrap">
            {periodos.map(p => (
              <button key={p} onClick={() => setPeriodoRevision(periodoRevision === p ? '' : p)}
                className={`px-2.5 py-1 text-[10px] font-mono border transition-colors ${
                  periodoRevision === p
                    ? 'border-secondary/60 bg-secondary/15 text-secondary'
                    : 'border-primary/15 text-text-muted/60 hover:text-primary hover:border-primary/30'
                }`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Info box: materias esperadas */}
      {periodoRevision && materiasRevision && (
        <div className="border border-primary/10 bg-zinc-950/60 px-4 py-3 mb-4">
          <div className="text-[9px] font-mono uppercase tracking-widest text-text-muted/40 mb-2">
            Materias esperadas en <span className="text-secondary">{periodoRevision}</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {[['ALPHA', materiasRevision.ALPHA], ['TLAA', materiasRevision.TLAA], ['TLMV', materiasRevision.TLMV], ['TLCF', materiasRevision.TLCF], ['TLPDD', materiasRevision.TLPDD], ['OMEGA', materiasRevision.OMEGA]]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-primary/50 uppercase w-12">{k}:</span>
                  <span className="text-[10px] font-mono text-white/80">{v}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Resumen */}
      {periodoRevision && (
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="text-[10px] font-mono text-text-muted">
            Período: <span className="text-secondary font-bold">{periodoRevision}</span>
          </span>
          <span className="text-primary/20">|</span>
          <span className="text-[10px] font-mono text-red-400 font-bold">{reportRows.length} estudiantes con errores</span>
          <span className="text-primary/20">|</span>
          <span className="text-[10px] font-mono text-text-muted/50">Tipo: {tipo}</span>
        </div>
      )}

      {/* Contenido */}
      {!periodoRevision ? (
        <div className="border border-primary/10 px-6 py-10 text-center">
          <div className="text-text-muted/30 text-xs font-mono">Selecciona un período de revisión</div>
        </div>
      ) : reportRows.length === 0 ? (
        <div className="border border-emerald-500/20 px-6 py-8 text-center bg-emerald-950/20">
          <div className="text-emerald-400 text-xs font-mono">✓ No hay errores en el período {periodoRevision} para estudiantes {tipo}</div>
        </div>
      ) : (
        <div className="overflow-auto border border-primary/10" style={{ maxHeight: '70vh' }}>
          <table className="font-mono border-collapse text-[10px]" style={{ minWidth: '1600px' }}>
            <thead className="sticky top-0 z-10">
              <tr>
                <Th className="bg-zinc-900 text-primary/80" style={{ minWidth: '58px' }}>ID SIS</Th>
                <Th className="bg-zinc-900 text-primary/70" style={{ minWidth: '100px' }}>Cédula</Th>
                <Th className="bg-zinc-900 text-primary/70" style={{ minWidth: '170px' }}>Nombre</Th>
                <Th className="bg-zinc-900 text-primary/50" style={{ minWidth: '60px' }}>Prog.</Th>
                <Th className="bg-zinc-900 text-primary/50" style={{ minWidth: '150px' }}>Estado Plataforma</Th>
                <Th className="bg-zinc-900 text-primary/50" style={{ minWidth: '80px' }}>F. Ingreso</Th>
                <Th className="bg-zinc-900 text-primary/50" style={{ minWidth: '80px' }}>Período Ing.</Th>
                <Th className="bg-red-950 text-red-200" style={{ minWidth: '160px' }}>Materia Actual</Th>
                <Th className="bg-red-950 text-red-200" style={{ minWidth: '180px' }}>Grupo Actual</Th>
                <Th className="bg-red-950 text-red-200" style={{ minWidth: '180px' }}>ID Grupo</Th>
                <Th className="bg-red-950 text-red-200" style={{ minWidth: '80px' }}>F. Inicio Actual</Th>
                <Th className="bg-emerald-950 text-emerald-200" style={{ minWidth: '160px' }}>Materia Correcta</Th>
                <Th className="bg-emerald-950 text-emerald-200" style={{ minWidth: '140px' }}>Fechas Correctas</Th>
                <Th className="bg-amber-900/60 text-amber-200" style={{ minWidth: '170px' }}>Tipo de Error</Th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map(({ est, mod }, ri) => {
                const ep = estadoPlataformaInfo(est.estado_plataforma)
                const rowBg = ri % 2 === 0 ? 'bg-zinc-900/60' : 'bg-zinc-800/40'
                return (
                  <tr key={`rep${ri}`} className={`${rowBg} hover:brightness-110 transition-all`}>
                    <td className="border border-white/6 px-2 py-1.5 text-primary font-bold whitespace-nowrap">{est.id_sis}</td>
                    <td className="border border-white/6 px-2 py-1.5 text-white/80 whitespace-nowrap">{est.cedula || '—'}</td>
                    <td className="border border-white/6 px-2 py-1.5 text-white/90 whitespace-nowrap">{est.nombre || '—'}</td>
                    <td className="border border-white/6 px-2 py-1.5 text-center text-secondary font-bold">{est.prog_plataforma || est.prog_seguimiento}</td>
                    <td className={`border border-white/6 px-2 py-1.5 ${ep.bg}`}><span className={ep.cls}>{est.estado_plataforma || '—'}</span></td>
                    <td className="border border-white/6 px-2 py-1.5 text-white/50 whitespace-nowrap text-center">{est.fecha_ingreso || '—'}</td>
                    <td className="border border-white/6 px-2 py-1.5 text-secondary whitespace-nowrap text-center font-bold">{est.periodo_ingreso || '—'}</td>
                    <td className="border border-white/6 px-2 py-1.5 bg-red-950/30">
                      {mod.materia_plat
                        ? <span className="text-red-200">{mod.materia_plat}</span>
                        : <span className="text-white/25 italic">sin asignar</span>}
                    </td>
                    <td className="border border-white/6 px-2 py-1.5 bg-red-950/30 text-white/70 text-[10px]">{mod.grupo_plat || '—'}</td>
                    <td className="border border-white/6 px-2 py-1.5 bg-red-950/30">
                      <span className="text-white/60 text-[9px] font-mono break-all">{mod.id_grupo || '—'}</span>
                    </td>
                    <td className="border border-white/6 px-2 py-1.5 bg-red-950/30 text-center text-white/70 whitespace-nowrap">{mod.fecha_inicio || '—'}</td>
                    <td className="border border-white/6 px-2 py-1.5 bg-emerald-950/30"><span className="text-emerald-200 font-medium">{mod.materia_ancla || '—'}</span></td>
                    <td className="border border-white/6 px-2 py-1.5 bg-emerald-950/30 text-center"><span className="text-emerald-300/80 whitespace-nowrap text-[10px]">{mod.fechas_ancla || '—'}</span></td>
                    <td className="border border-white/6 px-2 py-1.5">
                      <span className={`text-[10px] font-bold ${mod.estado.includes('FALTA') ? 'text-amber-300' : 'text-red-300'}`}>
                        {mod.estado.replace('INCORRECTO - ', '')}
                      </span>
                    </td>
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

// ─────────────────────────────────────────────────────────────────────────
export default function ValidacionView({ onBack }) {
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
  const [filtroPeriodo, setFiltroPeriodo] = useState('')
  const [nodeStatuses,  setNodeStatuses]  = useState(initNodeStatuses)
  const [vistaActiva,   setVistaActiva]   = useState('validacion')

  const NODE_DELAYS = [300, 800, 400, 1800, 350, 1800, 600, 200]
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
      let data
      if (N8N_WEBHOOK_URL) {
        const resp = await fetch(N8N_WEBHOOK_URL, { method: 'POST' })
        if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`)
        data = await resp.json()
      } else {
        await new Promise(r => setTimeout(r, 5500))
        data = { rows: SAMPLE_RAW, meta: { total: 3, sin_errores: 1, con_errores: 2 } }
      }
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
    setFiltroTexto(''); setFiltroProg(''); setFiltroError(''); setFiltroPeriodo('')
    setPage(0); setNodeStatuses(initNodeStatuses()); setVistaActiva('validacion')
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
    if (filtroProg)    list = list.filter(e => e.programa === filtroProg)
    if (filtroError === 'ok')  list = list.filter(e => e.total_incorrectos === 0)
    if (filtroError === 'err') list = list.filter(e => e.total_incorrectos > 0)
    if (filtroPeriodo) list = list.filter(e => e.periodo_deberia === filtroPeriodo)
    return list
  }, [estudiantes, filtroTexto, filtroProg, filtroError, filtroPeriodo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageData   = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const cp   = compactMode ? 'px-1.5 py-0.5' : 'px-2 py-1.5'
  const textSz = compactMode ? 'text-[10px]' : 'text-[11px]'

  return (
    <div className="max-w-full mx-auto px-6 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-primary transition-colors">‹ VOLVER</button>
        <span className="text-primary/20 font-mono">|</span>
        <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-primary cursor-pointer transition-colors" onClick={onBack}>TÉCNICOS ETDH</span>
        <span className="text-primary/20 font-mono">›</span>
        <span className="text-[10px] font-mono tracking-widest uppercase text-primary">VALIDACIÓN DE TRASLADOS</span>
      </div>

      {/* Título + botones */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="font-display font-black text-2xl text-text-primary uppercase tracking-wider mb-1">
            Validación de <span className="text-secondary">Traslados</span>
          </h1>
          <p className="text-text-muted text-xs font-mono">Replica la cadena de macros: SEGUIMIENTO → BigQuery → Períodos → Anclas.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {fase === 'done' && (
            <>
              <button onClick={() => setCompactMode(v => !v)}
                className={`px-3 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors ${compactMode ? 'border-secondary/40 text-secondary bg-secondary/10' : 'border-primary/20 text-text-muted hover:text-primary'}`}>
                {compactMode ? '⊟ Compacto' : '⊞ Compacto'}
              </button>
              <button onClick={handleReset} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-primary/20 text-text-muted hover:text-primary transition-colors">
                Nueva Ejecución
              </button>
            </>
          )}
          <button onClick={fase === 'idle' || fase === 'error' ? handleEjecutar : undefined} disabled={fase === 'loading'}
            className={`px-5 py-2 text-[11px] font-mono uppercase tracking-widest border transition-all duration-200 active:scale-95 ${
              fase === 'loading'  ? 'border-secondary/20 text-text-muted cursor-not-allowed' :
              fase === 'done'     ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 cursor-default' :
              'border-secondary bg-secondary/10 text-secondary hover:bg-secondary hover:text-background cursor-pointer'
            }`}>
            {fase === 'loading'
              ? <span className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse" />EJECUTANDO...</span>
              : fase === 'done' ? `✓ COMPLETADO — ${stats.total} EST.`
              : '▶ EJECUTAR PROCESO COMPLETO'}
          </button>
        </div>
      </div>

      {/* Panel n8n */}
      <N8nFlowPanel nodeStatuses={nodeStatuses} fase={fase} lastRun={lastRun} meta={meta} />

      {/* ── IDLE ── */}
      {fase === 'idle' && (
        <div className="border border-primary/10 px-6 py-10 text-center flex flex-col items-center gap-3">
          <div className="text-secondary/15 text-4xl font-mono">◈</div>
          <div className="text-text-muted/50 text-xs font-mono tracking-widest uppercase">Presiona "▶ EJECUTAR PROCESO COMPLETO" para iniciar</div>
        </div>
      )}

      {/* ── ERROR ── */}
      {fase === 'error' && (
        <div className="border border-red-500/30 px-6 py-8 text-center">
          <div className="text-red-400 font-mono text-sm mb-2">✗ Error en la ejecución</div>
          <div className="text-text-muted text-xs font-mono">{errorMsg}</div>
          <button onClick={handleReset} className="mt-4 text-[10px] font-mono uppercase tracking-widest border border-primary/20 text-text-muted hover:text-primary px-4 py-2 transition-colors">Reintentar</button>
        </div>
      )}

      {/* ── DONE ── */}
      {fase === 'done' && (
        <>
          {/* Resumen */}
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Resumen:</span>
            <span className="text-xs font-mono font-bold text-secondary">{stats.total} estudiantes</span>
            <span className="text-primary/20">|</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{stats.sinError} correctos</span>
            <span className="text-primary/20">|</span>
            <span className="text-xs font-mono font-bold text-red-400">{stats.conError} con errores</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-4 border-b border-primary/10 pb-0">
            {[['validacion', 'VALIDACIÓN'], ['reporte', 'REPORTE']].map(([val, label]) => (
              <button key={val} onClick={() => setVistaActiva(val)}
                className={`px-5 py-2 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-colors -mb-px ${
                  vistaActiva === val
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-muted/60 hover:text-primary'
                }`}>{label}</button>
            ))}
          </div>

          {/* ── TAB: VALIDACIÓN ── */}
          {vistaActiva === 'validacion' && (
            <>
              <FilterBar
                estudiantes={estudiantes}
                filtroTexto={filtroTexto}   setFiltroTexto={t => { setFiltroTexto(t); setPage(0) }}
                filtroProg={filtroProg}     setFiltroProg={p => { setFiltroProg(p); setPage(0) }}
                filtroError={filtroError}   setFiltroError={e => { setFiltroError(e); setPage(0) }}
                filtroPeriodo={filtroPeriodo} setFiltroPeriodo={p => { setFiltroPeriodo(p); setPage(0) }}
              />

              <div className="overflow-auto border border-primary/10" style={{ maxHeight: '72vh' }}>
                <table className={`font-mono border-collapse ${textSz}`} style={{ minWidth: '8800px' }}>
                  <thead className="sticky top-0 z-20">
                    <tr>
                      <Th rowSpan={2} className="sticky left-0 z-30 bg-zinc-900 text-primary/80" style={{ minWidth: '58px', left: 0 }}>ID SIS</Th>
                      <Th rowSpan={2} className="sticky z-30 bg-zinc-900 text-primary/70" style={{ minWidth: '104px', left: '58px' }}>Cédula</Th>
                      <Th rowSpan={2} className="sticky z-30 bg-zinc-900 text-primary/70" style={{ minWidth: '170px', left: '162px' }}>Nombre</Th>
                      <Th rowSpan={2} className="bg-zinc-900 text-primary/50">Celular</Th>
                      <Th rowSpan={2} className="bg-zinc-900 text-primary/50" style={{ minWidth: '70px' }}>Prog. Seg.</Th>
                      <Th rowSpan={2} className="bg-zinc-900 text-primary/50" style={{ minWidth: '70px' }}>Prog. Plat.</Th>
                      <Th rowSpan={2} className="bg-zinc-900 text-primary/50" style={{ minWidth: '50px' }}>Compat.</Th>
                      <Th rowSpan={2} className="bg-zinc-900 text-primary/50" style={{ minWidth: '88px' }}>F. Ingreso</Th>
                      <Th rowSpan={2} className="bg-zinc-900 text-primary/50" style={{ minWidth: '78px' }}>Período Deb.</Th>
                      <Th rowSpan={2} className="bg-zinc-900 text-primary/50" style={{ minWidth: '130px' }}>Estado Plataforma</Th>
                      <Th rowSpan={2} className="bg-zinc-900 text-secondary/70" style={{ minWidth: '78px' }}>Período Ing.</Th>
                      <Th rowSpan={2} className="bg-zinc-900 text-secondary/70" style={{ minWidth: '58px' }}>Programa</Th>
                      <Th rowSpan={2} className="bg-zinc-900 text-secondary/70" style={{ minWidth: '44px' }}>Total ✗</Th>
                      {Array.from({ length: 8 }, (_, i) => (
                        <Th key={i} colSpan={8} className={`text-center font-bold ${MOD_COLORS[i].header}`} style={{ minWidth: '900px' }}>
                          MÓDULO {i + 1}
                        </Th>
                      ))}
                    </tr>
                    <tr>
                      {Array.from({ length: 8 }, (_, i) => (
                        <>
                          <Th key={`m${i}-mat`}    className={`${MOD_COLORS[i].header} opacity-85`} style={{ minWidth: '140px' }}>Materia Plat.</Th>
                          <Th key={`m${i}-grp`}    className={`${MOD_COLORS[i].header} opacity-85`} style={{ minWidth: '160px' }}>Nombre Grupo</Th>
                          <Th key={`m${i}-id`}     className={`${MOD_COLORS[i].header} opacity-85`} style={{ minWidth: '180px' }}>ID Grupo</Th>
                          <Th key={`m${i}-fecha`}  className={`${MOD_COLORS[i].header} opacity-85`} style={{ minWidth: '78px'  }}>F. Inicio</Th>
                          <Th key={`m${i}-ancla`}  className={`${MOD_COLORS[i].header} opacity-85`} style={{ minWidth: '140px' }}>Materia Ancla</Th>
                          <Th key={`m${i}-fancla`} className={`${MOD_COLORS[i].header} opacity-85`} style={{ minWidth: '120px' }}>Fechas Ancla</Th>
                          <Th key={`m${i}-per`}    className={`${MOD_COLORS[i].header} opacity-85`} style={{ minWidth: '78px'  }}>Período Ancla</Th>
                          <Th key={`m${i}-est`}    className={`${MOD_COLORS[i].header} opacity-85`} style={{ minWidth: '110px' }}>Estado</Th>
                        </>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((est, ri) => {
                      const hasError  = est.total_incorrectos > 0
                      const baseRow   = ri % 2 === 0 ? 'bg-zinc-900/60' : 'bg-zinc-800/40'
                      const stickyBg  = hasError ? 'bg-red-950/80' : (ri % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/80')
                      const idColor   = hasError ? 'text-red-300 font-bold' : 'text-primary font-bold'
                      const nameColor = hasError ? 'text-red-200 font-medium' : 'text-white/90 font-medium'
                      const ep        = estadoPlataformaInfo(est.estado_plataforma)
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
                            <span className="text-primary font-bold">{est.prog_seguimiento}</span>
                          </td>
                          <td className={`border border-white/6 ${cp} text-center`}>
                            <span className="text-secondary font-bold">{est.prog_plataforma}</span>
                          </td>
                          <td className={`border border-white/6 ${cp} text-center`}>
                            <span className={`font-bold ${est.confirmacion === '✓' ? 'text-emerald-400' : 'text-red-400'}`}>{est.confirmacion}</span>
                          </td>
                          <td className={`border border-white/6 ${cp} text-white/50 whitespace-nowrap text-center`}>{est.fecha_ingreso || '—'}</td>
                          <td className={`border border-white/6 ${cp} text-white/70 whitespace-nowrap text-center`}>{est.periodo_deberia || '—'}</td>
                          <td className={`border border-white/6 ${cp} ${ep.bg}`}>
                            <span className={`text-[10px] ${ep.cls}`}>{est.estado_plataforma || '—'}</span>
                          </td>
                          <td className={`border border-white/6 ${cp} text-secondary whitespace-nowrap text-center font-bold`}>{est.periodo_ingreso}</td>
                          <td className={`border border-white/6 ${cp} text-center text-secondary`}>{est.programa}</td>
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
                                <td key={`r${ri}m${mi}-pa`} className={`border border-white/8 ${cp} ${stripe} text-center`}>
                                  <span className="text-white/90 whitespace-nowrap text-[10px] font-bold">{mod.periodo_ancla || '—'}</span>
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

          {/* ── TAB: REPORTE ── */}
          {vistaActiva === 'reporte' && <ReporteView estudiantes={estudiantes} />}
        </>
      )}
    </div>
  )
}
