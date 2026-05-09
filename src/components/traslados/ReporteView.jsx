import { useState, useMemo } from 'react'

const N8N_WEBHOOK_URL = 'https://n8n.kuepa.com/webhook/asignacion-etdh'
const N8N_EXPORT_URL  = 'https://n8n.kuepa.com/webhook/reporte-export-etdh'
const N8N_SLACK_URL   = 'https://n8n.kuepa.com/webhook/reporte-slack-etdh'

// ── Calendar ──────────────────────────────────────────────────────────────────
const PERIODOS_LISTA_RAW = [
  {n:'ENE I',    i:'2025-01-09',f:'2025-01-14'},{n:'ENE II',   i:'2025-01-16',f:'2025-01-29'},
  {n:'FEB I',    i:'2025-02-03',f:'2025-02-14'},{n:'FEB II',   i:'2025-02-17',f:'2025-02-28'},
  {n:'MAR I',    i:'2025-03-03',f:'2025-03-14'},{n:'MAR II',   i:'2025-03-17',f:'2025-03-31'},
  {n:'ABR I',    i:'2025-04-02',f:'2025-04-15'},{n:'ABR II',   i:'2025-04-16',f:'2025-05-02'},
  {n:'MAY I',    i:'2025-05-05',f:'2025-05-16'},{n:'MAY II',   i:'2025-05-19',f:'2025-05-30'},
  {n:'JUN I',    i:'2025-06-03',f:'2025-06-16'},{n:'JUN II',   i:'2025-06-17',f:'2025-07-02'},
  {n:'JUL I',    i:'2025-07-03',f:'2025-07-16'},{n:'JUL II',   i:'2025-07-17',f:'2025-07-30'},
  {n:'AGO I',    i:'2025-08-01',f:'2025-08-15'},{n:'AGO II',   i:'2025-08-19',f:'2025-09-01'},
  {n:'SEP I',    i:'2025-09-02',f:'2025-09-15'},{n:'SEP II',   i:'2025-09-16',f:'2025-09-29'},
  {n:'OCT I',    i:'2025-10-01',f:'2025-10-15'},{n:'OCT II',   i:'2025-10-16',f:'2025-10-29'},
  {n:'NOV I',    i:'2025-10-30',f:'2025-11-13'},{n:'NOV II',   i:'2025-11-14',f:'2025-11-28'},
  {n:'DIC I',    i:'2025-12-01',f:'2025-12-15'},{n:'DIC II',   i:'2025-12-16',f:'2025-12-19'},
  {n:'ENE I 2026', i:'2026-01-13',f:'2026-01-17'},{n:'ENE II 2026',i:'2026-01-19',f:'2026-01-30'},
  {n:'FEB I 2026', i:'2026-02-02',f:'2026-02-13'},{n:'FEB II 2026',i:'2026-02-16',f:'2026-02-27'},
  {n:'MAR I 2026', i:'2026-03-02',f:'2026-03-13'},{n:'MAR II 2026',i:'2026-03-16',f:'2026-03-30'},
  {n:'ABR I 2026', i:'2026-03-31',f:'2026-04-16'},{n:'ABR II 2026',i:'2026-04-17',f:'2026-04-30'},
  {n:'MAY I 2026', i:'2026-05-04',f:'2026-05-15'},{n:'MAY II 2026',i:'2026-05-19',f:'2026-05-29'},
  {n:'JUN I 2026', i:'2026-06-02',f:'2026-06-17'},{n:'JUN II 2026',i:'2026-06-18',f:'2026-07-02'},
  {n:'JUL I 2026', i:'2026-07-03',f:'2026-07-16'},{n:'JUL II 2026',i:'2026-07-17',f:'2026-07-31'},
  {n:'AGO I 2026', i:'2026-08-03',f:'2026-08-18'},{n:'AGO II 2026',i:'2026-08-19',f:'2026-09-01'},
  {n:'SEP I 2026', i:'2026-09-02',f:'2026-09-15'},{n:'SEP II 2026',i:'2026-09-16',f:'2026-09-29'},
  {n:'OCT I 2026', i:'2026-10-01',f:'2026-10-15'},{n:'OCT II 2026',i:'2026-10-16',f:'2026-10-29'},
  {n:'NOV I 2026', i:'2026-11-03',f:'2026-11-17'},{n:'NOV II 2026',i:'2026-11-18',f:'2026-12-01'},
  {n:'DIC I 2026', i:'2026-12-02',f:'2026-12-16'},{n:'DIC II 2026',i:'2026-12-17',f:'2026-12-23'},
]

// ── All period names in order ─────────────────────────────────────────────────
const PERIOD_NAMES = PERIODOS_LISTA_RAW.map(p => p.n)
function computeModulesFor(cohortPeriod) {
  const idx = PERIOD_NAMES.indexOf(cohortPeriod)
  if (idx === -1) return []
  return PERIOD_NAMES.slice(idx, Math.min(idx + 8, PERIOD_NAMES.length))
}

// ── Sorting ───────────────────────────────────────────────────────────────────
const MESES_ORD = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
function parsePeriodo(p) {
  if (!p) return { yr: 0, mo: -1, q: 0 }
  const pts = p.trim().split(/\s+/)
  return { yr: pts[2] ? parseInt(pts[2]) : 2025, mo: MESES_ORD.indexOf(pts[0]), q: pts[1]==='I'?0:1 }
}
function sortPeriodo(a, b) {
  const pa = parsePeriodo(a), pb = parsePeriodo(b)
  if (pa.yr !== pb.yr) return pa.yr - pb.yr
  if (pa.mo !== pb.mo) return pa.mo - pb.mo
  return pa.q - pb.q
}
function sortArr(arr) { return [...arr].sort(sortPeriodo) }

// ── Today detection ───────────────────────────────────────────────────────────
function parseLocalDate(str) {
  const [yyyy, mm, dd] = str.split('-').map(Number)
  return new Date(yyyy, mm - 1, dd)
}

function getTodayInfo() {
  const today = new Date()
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let currentPeriod = null, currentIdx = -1
  for (let i = 0; i < PERIODOS_LISTA_RAW.length; i++) {
    const p = PERIODOS_LISTA_RAW[i]
    if (t >= parseLocalDate(p.i) && t <= parseLocalDate(p.f)) { currentPeriod = p.n; currentIdx = i; break }
  }
  if (!currentPeriod) return { currentPeriod: null, activeCohortFrom: null, activeCohortTo: null }
  const fromIdx = Math.max(0, currentIdx - 7)
  return { currentPeriod, activeCohortFrom: PERIODOS_LISTA_RAW[fromIdx].n, activeCohortTo: currentPeriod }
}

// ── Estado helpers ────────────────────────────────────────────────────────────
const ESTADOS_ACTIVOS_SET = new Set([
  'regular en verificación','regular','trasladado','aplazado','en riesgo de abandono','nuevo',
])
function estadoInfo(estado) {
  if (!estado) return { cls: 'text-zinc-400', bg: '' }
  if (ESTADOS_ACTIVOS_SET.has(estado.toLowerCase().trim()))
    return { cls: 'text-emerald-300 font-semibold', bg: 'bg-emerald-950/50' }
  return { cls: 'text-red-300 font-semibold', bg: 'bg-red-950/50' }
}

// ── n8n mini panel ────────────────────────────────────────────────────────────
const N8N_NODES = [
  {id:'webhook',name:'Webhook'},{id:'supabase',name:'HTTP Supabase'},
  {id:'leer',name:'Leer SEGUIMIENTO'},{id:'bq_prog',name:'BigQuery Progs'},
  {id:'agg_prog',name:'Agregar progs'},{id:'bq_mod',name:'BigQuery Mods'},
  {id:'proceso',name:'Proceso'},{id:'respond',name:'Responder'},
]
const NODE_DELAYS = [300,800,350,1800,350,1800,600,200]
function initNodes() { return N8N_NODES.map(n => ({ ...n, status: 'idle' })) }

function MiniPanel({ nodes, fase }) {
  const isLoading = fase === 'loading'
  const isDone    = fase === 'done'
  const isError   = fase === 'error'
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 mb-5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-700 bg-zinc-950">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isLoading ? 'bg-amber-400 animate-pulse' :
            isDone    ? 'bg-emerald-400' :
            isError   ? 'bg-red-400' : 'bg-zinc-600'
          }`}/>
          <span className="text-xs font-mono text-zinc-400">
            n8n · <span className="text-primary">asignacion-etdh</span>
          </span>
        </div>
        <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${
          isLoading ? 'text-amber-400' : isDone ? 'text-emerald-400' :
          isError   ? 'text-red-400'  : 'text-zinc-600'
        }`}>{isLoading ? 'EJECUTANDO' : isDone ? 'COMPLETADO' : isError ? 'ERROR' : 'EN ESPERA'}</span>
      </div>
      <div className="px-3 py-2.5 grid grid-cols-4 gap-1.5">
        {nodes.map(node => {
          const run = node.status === 'running'
          const ok  = node.status === 'ok'
          const err = node.status === 'error'
          return (
            <div key={node.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded border transition-all duration-300 ${
              run ? 'bg-amber-500/10 border-amber-500/40' :
              ok  ? 'bg-emerald-950/40 border-emerald-700/40' :
              err ? 'bg-red-950/40 border-red-700/40' :
              'border-zinc-700/50'
            }`}>
              <span className={`text-[11px] w-4 text-center flex-shrink-0 ${
                run ? 'text-amber-400 animate-pulse' :
                ok  ? 'text-emerald-400' : err ? 'text-red-400' : 'text-zinc-600'
              }`}>{run ? '⟳' : ok ? '✓' : err ? '✗' : '○'}</span>
              <span className={`text-[9px] font-mono truncate ${
                run ? 'text-amber-200' : ok ? 'text-zinc-300' : err ? 'text-red-300' : 'text-zinc-600'
              }`}>{node.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Row parser ────────────────────────────────────────────────────────────────
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
    compat:            row[6]  ?? '',   // ✓ / ✗
    fecha_ingreso:     row[7]  ?? '',
    periodo_ingreso:   row[8]  ?? '',
    estado_plataforma: row[9]  ?? '',
    total_incorrectos: parseInt(row[13]) || 0,
    modulos,
  }
}

// ── InfoTable ─────────────────────────────────────────────────────────────────
function InfoTable({ periodoRevision, tipo, cohorteFrom, cohorteTo, materiasRevision }) {
  const tipoLabel = tipo === 'ACTIVOS' ? 'Solo activos' : 'Todos (sin filtro de estado)'
  const rows = [
    ['Tipo de estudiantes',        tipoLabel],
    ['Rango de cohortes',          `${cohorteFrom} — ${cohorteTo}`],
    ['Período ancla auditado',     periodoRevision],
    [`OMEGA · ${periodoRevision}`, materiasRevision.OMEGA || 'Módulo Omega'],
    [`TLMV · ${periodoRevision}`,  materiasRevision.TLMV  || '—'],
    [`TLAA · ${periodoRevision}`,  materiasRevision.TLAA  || '—'],
    [`TLCF · ${periodoRevision}`,  materiasRevision.TLCF  || '—'],
    [`TLPDD · ${periodoRevision}`, materiasRevision.TLPDD || '—'],
    [`ALPHA · ${periodoRevision}`, materiasRevision.ALPHA || 'Módulo Alpha'],
  ]
  return (
    <div className="rounded-lg border border-amber-500/30 overflow-hidden mb-4">
      {rows.map(([label, value], i) => (
        <div key={i} className={`flex border-b border-amber-500/15 last:border-b-0 ${
          i === 0 ? 'bg-amber-900/30' : i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/60'
        }`}>
          <div className="w-60 flex-shrink-0 px-4 py-2.5 text-amber-400 font-semibold border-r border-amber-500/15 uppercase tracking-wide text-[10px]">
            {label}
          </div>
          <div className={`flex-1 px-4 py-2.5 text-sm ${
            i === 0 ? 'font-bold text-amber-200' :
            i < 3   ? 'text-white font-medium' :
            'text-zinc-200'
          }`}>{value}</div>
        </div>
      ))}
    </div>
  )
}

// ── ErrorTable ────────────────────────────────────────────────────────────────
// 16 columnas según spec del usuario
const TABLE_COLS = [
  { label: 'ID SIS',                              w: '80px',  section: 'base' },
  { label: 'Cédula',                              w: '110px', section: 'base' },
  { label: 'Nombre',                              w: '170px', section: 'base' },
  { label: 'Celular',                             w: '105px', section: 'base' },
  { label: 'Prog. Seguimiento',                   w: '115px', section: 'base' },
  { label: 'Prog. Plataforma',                    w: '105px', section: 'base' },
  { label: 'Compatibilidad',                      w: '95px',  section: 'base' },
  { label: 'Estado (Plataforma)',                 w: '155px', section: 'base' },
  { label: 'Fecha Ingreso',                       w: '95px',  section: 'base' },
  { label: 'Período Ancla',                       w: '95px',  section: 'base' },
  { label: 'Materia en Plataforma',               w: '160px', section: 'red'  },
  { label: 'Nombre del Grupo',                    w: '185px', section: 'red'  },
  { label: 'Estructura de la Materia',            w: '110px', section: 'red'  },
  { label: 'Fecha Inicio SIS',                    w: '90px',  section: 'red'  },
  { label: 'Materia Correcta (Ancla)',            w: '160px', section: 'green'},
  { label: 'Fechas Correctas (Ancla)',            w: '150px', section: 'green'},
  { label: 'Tipo de Error',                       w: '170px', section: 'amber'},
]

function ErrorTable({ rows }) {
  if (rows.length === 0) return (
    <div className="rounded-lg border border-emerald-500/30 px-6 py-8 text-center bg-emerald-950/20">
      <div className="text-emerald-400 text-3xl mb-2">✓</div>
      <div className="text-emerald-300 text-base font-medium">Sin errores para este período</div>
    </div>
  )

  const thBase  = 'bg-zinc-800 text-zinc-100'
  const thRed   = 'bg-red-900/70 text-red-100'
  const thGreen = 'bg-emerald-900/70 text-emerald-100'
  const thAmber = 'bg-amber-900/60 text-amber-100'

  return (
    <div className="rounded-lg border border-zinc-600 overflow-auto" style={{ maxHeight: '65vh' }}>
      <table className="font-mono border-collapse text-xs" style={{ minWidth: '1700px' }}>
        <thead className="sticky top-0 z-10">
          <tr>
            {TABLE_COLS.map((c, i) => (
              <th key={i} style={{ minWidth: c.w }}
                className={`border-b-2 border-r border-zinc-600 px-3 py-3 text-[10px] font-bold tracking-wide uppercase whitespace-nowrap text-left ${
                  c.section === 'red'   ? thRed   :
                  c.section === 'green' ? thGreen :
                  c.section === 'amber' ? thAmber : thBase
                }`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ est, mod }, ri) => {
            const ep = estadoInfo(est.estado_plataforma)
            const isFalta = mod.estado.includes('FALTA')
            const isOk = est.compat === '✓'
            return (
              <tr key={ri} className={`border-b border-zinc-700 hover:brightness-110 transition-all ${
                ri % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'
              }`}>
                {/* base columns */}
                <td className="border-r border-zinc-700 px-3 py-2 text-zinc-400 font-mono whitespace-nowrap">{est.id_sis || '—'}</td>
                <td className="border-r border-zinc-700 px-3 py-2 text-white font-medium whitespace-nowrap">{est.cedula || '—'}</td>
                <td className="border-r border-zinc-700 px-3 py-2 text-white whitespace-nowrap">{est.nombre || '—'}</td>
                <td className="border-r border-zinc-700 px-3 py-2 text-zinc-300 whitespace-nowrap">{est.celular || '—'}</td>
                <td className="border-r border-zinc-700 px-3 py-2 text-zinc-300 text-center">{est.prog_seguimiento || '—'}</td>
                <td className="border-r border-zinc-700 px-3 py-2 text-secondary font-bold text-center">{est.prog_plataforma || '—'}</td>
                <td className="border-r border-zinc-700 px-3 py-2 text-center">
                  <span className={`font-bold text-sm ${isOk ? 'text-emerald-400' : 'text-red-400'}`}>{est.compat || '—'}</span>
                </td>
                <td className={`border-r border-zinc-700 px-3 py-2 ${ep.bg}`}>
                  <span className={ep.cls}>{est.estado_plataforma || '—'}</span>
                </td>
                <td className="border-r border-zinc-700 px-3 py-2 text-zinc-300 whitespace-nowrap text-center">{est.fecha_ingreso || '—'}</td>
                <td className="border-r border-zinc-700 px-3 py-2 text-amber-300 font-bold whitespace-nowrap text-center">{est.periodo_ingreso || '—'}</td>
                {/* red columns */}
                <td className="border-r border-zinc-700 px-3 py-2 bg-red-950/20">
                  {mod.materia_plat
                    ? <span className="text-red-200 font-medium">{mod.materia_plat}</span>
                    : <span className="text-zinc-500 italic">sin asignar</span>}
                </td>
                <td className="border-r border-zinc-700 px-3 py-2 bg-red-950/20 text-zinc-200">{mod.grupo_plat || '—'}</td>
                <td className="border-r border-zinc-700 px-3 py-2 bg-red-950/20 text-zinc-300 text-center whitespace-nowrap">{mod.id_grupo || '—'}</td>
                <td className="border-r border-zinc-700 px-3 py-2 bg-red-950/20 text-zinc-200 text-center whitespace-nowrap">{mod.fecha_inicio || '—'}</td>
                {/* green columns */}
                <td className="border-r border-zinc-700 px-3 py-2 bg-emerald-950/20">
                  <span className="text-emerald-300 font-medium">{mod.materia_ancla || '—'}</span>
                </td>
                <td className="border-r border-zinc-700 px-3 py-2 bg-emerald-950/20 text-center">
                  <span className="text-emerald-300 whitespace-nowrap">{mod.fechas_ancla || '—'}</span>
                </td>
                {/* amber column */}
                <td className="px-3 py-2 bg-amber-950/15">
                  <span className={`font-bold ${isFalta ? 'text-amber-300' : 'text-red-300'}`}>
                    {mod.estado.replace('INCORRECTO - ', '')}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Stat badge ────────────────────────────────────────────────────────────────
function StatBadge({ label, value, color = 'zinc' }) {
  const colors = {
    zinc:    'bg-zinc-800 border-zinc-600 text-zinc-100',
    emerald: 'bg-emerald-950/50 border-emerald-600/50 text-emerald-300',
    red:     'bg-red-950/50    border-red-600/50    text-red-300',
    amber:   'bg-amber-900/40  border-amber-600/40  text-amber-300',
  }
  return (
    <div className={`flex flex-col items-center px-4 py-2 rounded-lg border ${colors[color]}`}>
      <span className="text-[9px] font-mono uppercase tracking-widest opacity-70 mb-0.5">{label}</span>
      <span className="text-xl font-bold font-mono">{value}</span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReporteView({ onBack }) {
  const [fase,        setFase]        = useState('idle')
  const [estudiantes, setEstudiantes] = useState([])
  const [errorMsg,    setErrorMsg]    = useState('')
  const [nodes,       setNodes]       = useState(initNodes)
  const [tipo,        setTipo]        = useState('ACTIVOS')
  const [cohortFrom,  setCohortFrom]  = useState('')
  const [cohortTo,    setCohortTo]    = useState('')
  const [selections,  setSelections]  = useState({})
  const [exportFase,  setExportFase]  = useState('idle')
  const [exportUrl,   setExportUrl]   = useState('')
  const [slackFase,   setSlackFase]   = useState('idle')

  const todayInfo = useMemo(() => getTodayInfo(), [])

  const cohortModules = useMemo(() => {
    const map = {}
    for (const est of estudiantes) {
      const c = est.periodo_ingreso
      if (!c || map[c]) continue
      map[c] = est.modulos.map(m => m.periodo_ancla || '')
    }
    return map
  }, [estudiantes])

  const allCohorts  = useMemo(() => {
    const loaded = sortArr(Object.keys(cohortModules))
    const lastLoaded = loaded[loaded.length - 1]
    const future = lastLoaded
      ? PERIOD_NAMES.filter(p => sortPeriodo(p, lastLoaded) > 0)
      : []
    return [...loaded, ...future]
  }, [cohortModules])

  const cohortRange = useMemo(() => {
    return allCohorts.filter(c => {
      if (cohortFrom && sortPeriodo(c, cohortFrom) < 0) return false
      if (cohortTo   && sortPeriodo(c, cohortTo)   > 0) return false
      return true
    })
  }, [allCohorts, cohortFrom, cohortTo])

  const totalSelected = useMemo(() => {
    let n = 0
    for (const s of Object.values(selections)) n += s.size
    return n
  }, [selections])

  const reportSections = useMemo(() => {
    if (totalSelected === 0) return []
    const periodToCohorts = new Map()
    for (const cohort of cohortRange) {
      const modules = cohortModules[cohort] || []
      const sel = selections[cohort] || new Set()
      sel.forEach(idx => {
        const period = modules[idx]
        if (!period) return
        if (!periodToCohorts.has(period)) periodToCohorts.set(period, new Set())
        periodToCohorts.get(period).add(cohort)
      })
    }
    const sections = []
    for (const [periodoRevision, cohortsSet] of periodToCohorts) {
      const rows = []
      let totalEnPeriodo = 0, totalCorrectos = 0
      for (const est of estudiantes) {
        if (!cohortsSet.has(est.periodo_ingreso)) continue
        if (tipo === 'ACTIVOS' && !ESTADOS_ACTIVOS_SET.has((est.estado_plataforma||'').toLowerCase().trim())) continue
        const mod = est.modulos.find(m => m.periodo_ancla === periodoRevision)
        if (!mod) continue
        totalEnPeriodo++
        if (!mod.estado || (!mod.estado.includes('INCORRECTO') && !mod.estado.includes('FALTA'))) { totalCorrectos++; continue }
        rows.push({ est, mod })
      }
      const mat = { ALPHA: 'Módulo Alpha', OMEGA: '', TLAA: '', TLMV: '', TLCF: '', TLPDD: '' }
      for (const est of estudiantes) {
        for (const m of est.modulos) {
          if (m.periodo_ancla !== periodoRevision || !m.materia_ancla) continue
          const up = m.materia_ancla.toUpperCase()
          if (up.includes('OMEGA') || up.includes('EXCEL')) { if (!mat.OMEGA) mat.OMEGA = m.materia_ancla }
          else if (!up.includes('ALPHA') && !up.includes('MODULO 0') && !up.includes('M0')) {
            const p = est.prog_plataforma; if (p && !mat[p]) mat[p] = m.materia_ancla
          }
        }
      }
      if (!mat.OMEGA) mat.OMEGA = 'Módulo Omega'
      sections.push({ periodoRevision, cohorts: [...cohortsSet].sort(sortPeriodo), rows, materiasRevision: mat, totalEnPeriodo, totalCorrectos })
    }
    return sections.sort((a, b) => sortPeriodo(a.periodoRevision, b.periodoRevision))
  }, [estudiantes, cohortRange, cohortModules, selections, tipo, totalSelected])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function setNodeStatus(idx, status) {
    setNodes(prev => prev.map((n, i) => i === idx ? { ...n, status } : n))
  }

  async function handleCargar() {
    setFase('loading'); setNodes(initNodes()); setSelections({})
    const animPromise = (async () => {
      for (let i = 0; i < N8N_NODES.length; i++) {
        setNodeStatus(i, 'running')
        await new Promise(r => setTimeout(r, NODE_DELAYS[i]))
        setNodeStatus(i, 'ok')
      }
    })()
    try {
      const resp = await fetch(N8N_WEBHOOK_URL, { method: 'POST' })
      if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`)
      const data = await resp.json()
      await animPromise
      setEstudiantes((data.rows ?? data.estudiantes ?? []).map(parseRow))
      setFase('done')
      if (todayInfo.activeCohortFrom) setCohortFrom(todayInfo.activeCohortFrom)
      if (todayInfo.activeCohortTo)   setCohortTo(todayInfo.activeCohortTo)
    } catch (err) {
      setNodes(prev => {
        const idx = prev.findIndex(n => n.status === 'running')
        return prev.map((n, i) => i === idx ? { ...n, status: 'error' } : n)
      })
      setErrorMsg(err.message); setFase('error')
    }
  }

  function handleReset() {
    setFase('idle'); setEstudiantes([]); setErrorMsg(''); setNodes(initNodes())
    setSelections({}); setCohortFrom(''); setCohortTo(''); setExportFase('idle'); setExportUrl(''); setSlackFase('idle')
  }

  async function handleSlack() {
    if (!exportUrl) return
    setSlackFase('loading')
    const from = cohortFrom || allCohorts[0] || ''
    const to   = cohortTo   || allCohorts[allCohorts.length - 1] || ''
    const totalConErrores  = reportSections.reduce((a, s) => a + s.rows.length, 0)
    const totalEnPeriodo   = reportSections.reduce((a, s) => a + s.totalEnPeriodo, 0)
    const totalCorrectos   = reportSections.reduce((a, s) => a + s.totalCorrectos, 0)
    try {
      const resp = await fetch(N8N_SLACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: exportUrl, tipo, cohorteFrom: from, cohorteTo: to, totalConErrores, totalEnPeriodo, totalCorrectos }),
      })
      if (!resp.ok) throw new Error(`Error ${resp.status}`)
      setSlackFase('done')
    } catch {
      setSlackFase('error')
    }
  }

  function toggleModule(cohort, idx) {
    setSelections(prev => {
      const cur = new Set(prev[cohort] || [])
      cur.has(idx) ? cur.delete(idx) : cur.add(idx)
      return { ...prev, [cohort]: new Set(cur) }
    })
  }

  function toggleAllForCohort(cohort) {
    const modules = cohortModules[cohort] || []
    const cur = selections[cohort] || new Set()
    const allOn = modules.length > 0 && modules.every((_, i) => cur.has(i))
    setSelections(prev => ({ ...prev, [cohort]: allOn ? new Set() : new Set(modules.map((_, i) => i)) }))
  }

  async function handleExport() {
    if (reportSections.length === 0) return
    setExportFase('loading'); setExportUrl('')
    const now  = new Date()
    const dd   = now.getDate().toString().padStart(2,'0')
    const mm   = (now.getMonth()+1).toString().padStart(2,'0')
    const hh   = now.getHours().toString().padStart(2,'0')
    const min  = now.getMinutes().toString().padStart(2,'0')
    const from = cohortFrom || allCohorts[0] || ''
    const to   = cohortTo   || allCohorts[allCohorts.length-1] || ''
    const rangeLabel = `${from} - ${to}`
    const title = `REPORTE ${dd}/${mm}/${now.getFullYear()} ${hh}:${min} ${rangeLabel}`

    const payload = {
      title, tipo, cohorteFrom: from, cohorteTo: to,
      folderId: '1hmY38PDIcPPJEKRe2pUO8hAxr0-8iyDM',
      sections: reportSections.map(s => ({
        periodoRevision: s.periodoRevision,
        cohorts:         s.cohorts,
        materiasRevision: s.materiasRevision,
        tipo, cohorteRange: rangeLabel,
        stats: { totalEnPeriodo: s.totalEnPeriodo, totalCorrectos: s.totalCorrectos, conErrores: s.rows.length },
        rows: s.rows.map(({ est, mod }) => ({
          id_sis:            est.id_sis,
          cedula:            est.cedula,
          nombre:            est.nombre,
          celular:           est.celular,
          prog_seguimiento:  est.prog_seguimiento,
          prog_plataforma:   est.prog_plataforma,
          compat:            est.compat,
          estado_plataforma: est.estado_plataforma,
          fecha_ingreso:     est.fecha_ingreso,
          periodo_ingreso:   est.periodo_ingreso,
          materia_plat:      mod.materia_plat || 'NO ASIGNADA',
          grupo_plat:        mod.grupo_plat,
          id_grupo:          mod.id_grupo,
          fecha_inicio:      mod.fecha_inicio,
          materia_ancla:     mod.materia_ancla,
          fechas_ancla:      mod.fechas_ancla,
          tipoError:         mod.estado,
        }))
      }))
    }
    try {
      const resp = await fetch(N8N_EXPORT_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })
      if (!resp.ok) throw new Error(`Error ${resp.status}`)
      const data = await resp.json()
      setExportUrl(data.url || data.spreadsheetUrl || '')
      setExportFase('done')
    } catch {
      setExportFase('error')
    }
  }

  const cohortFromLabel = cohortFrom || allCohorts[0] || ''
  const cohortToLabel   = cohortTo   || allCohorts[allCohorts.length-1] || ''

  return (
    <div className="max-w-full mx-auto px-6 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-xs font-mono">
        <button onClick={onBack} className="text-zinc-400 hover:text-primary transition-colors">‹ VOLVER</button>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-400 hover:text-primary cursor-pointer transition-colors" onClick={onBack}>TÉCNICOS ETDH</span>
        <span className="text-zinc-700">›</span>
        <span className="text-amber-400 font-semibold">REPORTE DE MATERIAS ERRADAS</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="font-display font-black text-3xl text-white uppercase tracking-wider mb-1.5">
            Reporte de <span className="text-amber-400">Materias Erradas</span>
          </h1>
          <p className="text-zinc-400 text-sm">Audita errores por cohorte y período · Exporta a Google Sheets</p>
        </div>
        <div className="flex items-center gap-2.5">
          {fase === 'done' && (
            <button onClick={handleReset}
              className="px-4 py-2 text-xs font-mono uppercase tracking-widest rounded-lg border border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-400 transition-colors">
              Nueva Ejecución
            </button>
          )}
          <button
            onClick={fase === 'idle' || fase === 'error' ? handleCargar : undefined}
            disabled={fase === 'loading'}
            className={`px-5 py-2.5 text-sm font-mono font-semibold uppercase tracking-wider rounded-lg border transition-all duration-200 active:scale-95 ${
              fase === 'loading' ? 'border-amber-500/30 text-zinc-500 cursor-not-allowed bg-transparent' :
              fase === 'done'    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 cursor-default' :
              'border-amber-500 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-zinc-900 cursor-pointer'
            }`}>
            {fase === 'loading'
              ? <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block"/>Cargando...</span>
              : fase === 'done' ? `✓ ${estudiantes.length} estudiantes cargados`
              : '▶ Cargar Datos'}
          </button>
        </div>
      </div>

      <MiniPanel nodes={nodes} fase={fase}/>

      {/* Banner HOY */}
      {todayInfo.currentPeriod && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-950/25 px-5 py-3.5 mb-5 flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0"/>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">Período activo hoy</span>
          </div>
          <span className="text-base font-mono text-amber-200 font-bold">{todayInfo.currentPeriod}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-xs text-zinc-400">Cohortes activos:</span>
          <span className="text-sm font-mono text-amber-300 font-semibold">
            {todayInfo.activeCohortFrom} → {todayInfo.activeCohortTo}
          </span>
          {fase === 'done' && (
            <button
              onClick={() => { setCohortFrom(todayInfo.activeCohortFrom); setCohortTo(todayInfo.activeCohortTo) }}
              className="ml-auto px-3 py-1.5 text-xs font-mono rounded-lg border border-amber-500/50 text-amber-300 hover:bg-amber-500/15 hover:border-amber-400 transition-all">
              Usar este rango →
            </button>
          )}
        </div>
      )}

      {/* IDLE */}
      {fase === 'idle' && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 px-6 py-20 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <span className="text-amber-400/60 text-3xl">◈</span>
          </div>
          <p className="text-zinc-400 text-sm">Carga los datos para comenzar la auditoría</p>
        </div>
      )}

      {/* ERROR */}
      {fase === 'error' && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/20 px-6 py-10 text-center">
          <div className="text-red-400 text-lg font-mono mb-2">✗ Error al cargar datos</div>
          <div className="text-zinc-300 text-sm mb-4">{errorMsg}</div>
          <button onClick={handleReset} className="px-4 py-2 text-xs font-mono uppercase border border-zinc-600 text-zinc-300 hover:text-white rounded-lg transition-colors">
            Reintentar
          </button>
        </div>
      )}

      {/* DONE */}
      {fase === 'done' && (
        <>
          {/* Tipo */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-widest">Tipo:</span>
            {[['ACTIVOS','✅ Solo Activos'],['TODOS','📋 Todos los estudiantes']].map(([val, label]) => (
              <button key={val} onClick={() => setTipo(val)}
                className={`px-4 py-2 text-sm font-mono rounded-lg border transition-all ${
                  tipo === val
                    ? val === 'ACTIVOS'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'border-secondary bg-secondary/20 text-secondary font-semibold'
                    : 'border-zinc-600 text-zinc-400 hover:text-zinc-200 hover:border-zinc-400'
                }`}>{label}</button>
            ))}
          </div>

          {/* Cohort range */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                Rango de cohortes a auditar
              </h3>
              {(cohortFrom || cohortTo) && (
                <button onClick={() => { setCohortFrom(''); setCohortTo('') }}
                  className="text-xs font-mono text-zinc-500 hover:text-red-300 transition-colors">
                  ✕ limpiar
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[['Desde', cohortFrom, setCohortFrom], ['Hasta', cohortTo, setCohortTo]].map(([lbl, val, setVal]) => (
                <div key={lbl}>
                  <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-2 font-semibold">{lbl}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {allCohorts.map(c => {
                      const isFuture = !cohortModules[c]
                      return (
                        <button key={c} onClick={() => setVal(val === c ? '' : c)}
                          className={`px-3 py-1.5 text-xs font-mono rounded border transition-all ${
                            val === c
                              ? 'border-primary bg-primary/15 text-primary font-bold shadow-[0_0_8px_rgba(0,255,209,0.3)]'
                              : c === todayInfo.currentPeriod
                              ? 'border-amber-500/40 bg-amber-950/25 text-amber-400 hover:border-amber-400 hover:text-amber-300'
                              : isFuture
                              ? 'border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 italic'
                              : 'border-zinc-600 text-zinc-400 hover:text-zinc-200 hover:border-zinc-400'
                          }`}>{c}</button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            {cohortRange.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-700 flex items-center gap-2 text-xs">
                <span className="text-zinc-400">Cohortes en rango:</span>
                <span className="text-white font-mono font-semibold">{cohortRange.length}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300 font-mono">{cohortRange.join(' · ')}</span>
              </div>
            )}
          </div>

          {/* Module grid */}
          {cohortRange.length > 0 && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 mb-5 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-700 bg-zinc-950">
                <div>
                  <h3 className="text-sm font-bold text-white">Selección de módulos por cohorte</h3>
                  {totalSelected > 0 && (
                    <p className="text-xs text-amber-400 mt-0.5 font-medium">
                      {totalSelected} módulo{totalSelected !== 1 ? 's' : ''} seleccionado{totalSelected !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button onClick={() => {
                    const s = {}
                    for (const c of cohortRange) s[c] = new Set((cohortModules[c]||[]).map((_,i) => i))
                    setSelections(s)
                  }} className="text-xs font-mono text-primary border border-primary/40 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all">
                    Seleccionar todo
                  </button>
                  <button onClick={() => setSelections({})}
                    className="text-xs font-mono text-zinc-400 border border-zinc-600 hover:text-red-300 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-all">
                    Limpiar
                  </button>
                </div>
              </div>
              <div className="overflow-auto">
                <table className="text-xs font-mono border-collapse w-full" style={{ minWidth: '740px' }}>
                  <thead>
                    <tr className="bg-zinc-950 border-b border-zinc-700">
                      <th className="px-4 py-3 text-left text-zinc-400 font-semibold uppercase tracking-wider text-[10px]" style={{minWidth:'100px'}}>Cohorte</th>
                      {[1,2,3,4,5,6,7,8].map(m => (
                        <th key={m} className="px-2 py-3 text-center text-zinc-500 font-semibold text-[10px] uppercase" style={{minWidth:'82px'}}>Módulo {m}</th>
                      ))}
                      <th className="px-3 py-3 text-center text-zinc-500 font-semibold text-[10px]" style={{minWidth:'52px'}}>Todo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortRange.map((cohort, rowIdx) => {
                      const hasDatos = !!cohortModules[cohort]
                      const modules = cohortModules[cohort] || computeModulesFor(cohort)
                      const sel = selections[cohort] || new Set()
                      const allOn = modules.length > 0 && modules.every((_, i) => sel.has(i))
                      return (
                        <tr key={cohort} className={`border-b border-zinc-700 hover:bg-zinc-800/40 transition-colors ${rowIdx % 2 === 0 ? '' : 'bg-zinc-800/20'}`}>
                          <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                            <span className={`font-bold ${hasDatos ? 'text-amber-300' : 'text-zinc-500'}`}>{cohort}</span>
                            {!hasDatos && <span className="ml-1.5 text-[9px] font-mono text-zinc-600 border border-zinc-700 px-1 py-0.5 rounded uppercase tracking-wide">futuro</span>}
                          </td>
                          {modules.map((period, idx) => {
                            const isSel   = sel.has(idx)
                            const isToday = period === todayInfo.currentPeriod
                            return (
                              <td key={idx} className="p-1">
                                <button
                                  onClick={() => toggleModule(cohort, idx)}
                                  title={period}
                                  className={`w-full px-1.5 py-2 text-[10px] font-mono rounded border transition-all whitespace-nowrap ${
                                    isSel
                                      ? 'border-primary bg-primary/15 text-primary font-bold shadow-[0_0_6px_rgba(0,255,209,0.25)]'
                                      : isToday
                                      ? 'border-amber-500/50 bg-amber-950/30 text-amber-400 hover:border-amber-400 hover:bg-amber-950/50'
                                      : 'border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                  }`}>
                                  {period || '—'}
                                </button>
                              </td>
                            )
                          })}
                          <td className="p-1 text-center">
                            <button onClick={() => toggleAllForCohort(cohort)}
                              className={`w-10 h-9 rounded border text-sm transition-all font-bold ${
                                allOn ? 'border-primary bg-primary/15 text-primary' :
                                'border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200'
                              }`}>{allOn ? '✓' : '□'}</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {cohortRange.length > 0 && totalSelected === 0 && (
            <div className="rounded-xl border border-zinc-700 px-6 py-10 text-center mb-5">
              <p className="text-zinc-400 text-sm">Selecciona módulos en la grilla para generar el reporte</p>
            </div>
          )}

          {/* Export bar */}
          {reportSections.length > 0 && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-4 mb-6 flex items-center gap-4 flex-wrap">
              <div className="flex gap-3">
                <StatBadge label="Secciones"   value={reportSections.length} color="zinc"/>
                <StatBadge label="Con errores"  value={reportSections.reduce((a,s) => a+s.rows.length, 0)} color="red"/>
                <StatBadge label="En período"   value={reportSections.reduce((a,s) => a+s.totalEnPeriodo, 0)} color="amber"/>
              </div>
              <div className="flex-1"/>
              {exportFase === 'done' && exportUrl && (
                <a href={exportUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-mono text-primary font-semibold underline hover:text-primary/80 transition-colors whitespace-nowrap">
                  Abrir en Sheets →
                </a>
              )}
              <button
                onClick={exportFase === 'idle' || exportFase === 'error' ? handleExport : undefined}
                disabled={exportFase === 'loading'}
                className={`px-5 py-2.5 text-sm font-mono font-semibold rounded-lg border transition-all active:scale-95 ${
                  exportFase === 'loading' ? 'border-zinc-600 text-zinc-500 cursor-not-allowed' :
                  exportFase === 'done'    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' :
                  exportFase === 'error'   ? 'border-red-500 text-red-300 hover:bg-red-500/10 cursor-pointer' :
                  'border-primary bg-primary/15 text-primary hover:bg-primary hover:text-zinc-900 cursor-pointer'
                }`}>
                {exportFase === 'loading' ? '⟳ Exportando...'       :
                 exportFase === 'done'    ? '✓ Exportado a Sheets'  :
                 exportFase === 'error'   ? '✗ Error — reintentar'  :
                 '↗ Exportar a Google Sheets'}
              </button>
              {exportFase === 'done' && exportUrl && (
                <button
                  onClick={slackFase === 'idle' || slackFase === 'error' ? handleSlack : undefined}
                  disabled={slackFase === 'loading'}
                  className={`px-5 py-2.5 text-sm font-mono font-semibold rounded-lg border transition-all active:scale-95 ${
                    slackFase === 'loading' ? 'border-zinc-600 text-zinc-500 cursor-not-allowed' :
                    slackFase === 'done'    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' :
                    slackFase === 'error'   ? 'border-red-500 text-red-300 hover:bg-red-500/10 cursor-pointer' :
                    'border-purple-500 bg-purple-500/15 text-purple-300 hover:bg-purple-500 hover:text-white cursor-pointer'
                  }`}>
                  {slackFase === 'loading' ? '⟳ Enviando...'         :
                   slackFase === 'done'    ? '✓ Enviado a Slack'     :
                   slackFase === 'error'   ? '✗ Error — reintentar'  :
                   '💬 Enviar a Slack'}
                </button>
              )}
            </div>
          )}

          {/* Report sections */}
          {reportSections.map(section => {
            const pct = section.totalEnPeriodo > 0
              ? Math.round(section.rows.length / section.totalEnPeriodo * 100) : 0
            return (
              <div key={section.periodoRevision} className="mb-8 rounded-xl border border-amber-500/30 overflow-hidden">
                <div className="px-5 py-4 bg-amber-950/25 border-b border-amber-500/25">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">Período auditado</span>
                        {section.cohorts.map(c => (
                          <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 text-amber-300 bg-amber-950/40">{c}</span>
                        ))}
                      </div>
                      <h2 className="text-2xl font-display font-bold text-amber-300 uppercase tracking-wider">
                        {section.periodoRevision}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatBadge label="Total"      value={section.totalEnPeriodo} color="zinc"/>
                      <StatBadge label="Correctos"  value={section.totalCorrectos} color="emerald"/>
                      <StatBadge label="Con errores" value={section.rows.length}   color="red"/>
                      {section.totalEnPeriodo > 0 && (
                        <StatBadge label="% Error"  value={`${pct}%`}             color="amber"/>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <InfoTable
                    periodoRevision={section.periodoRevision}
                    tipo={tipo}
                    cohorteFrom={cohortFromLabel}
                    cohorteTo={cohortToLabel}
                    materiasRevision={section.materiasRevision}
                  />
                  <ErrorTable rows={section.rows}/>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
