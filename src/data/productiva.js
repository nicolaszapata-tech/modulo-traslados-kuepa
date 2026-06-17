const LS_KEY = 'kuepa_productiva_cohorts_v2'

export const BASE_COHORTS = [
  { id: 'b01', ingreso: '16/11/2023', fin: '16/10/2024' },
  { id: 'b02', ingreso: '30/11/2023', fin: '15/02/2026' },
  { id: 'b03', ingreso: '16/01/2024', fin: '15/12/2024' },
  { id: 'b04', ingreso: '30/01/2024', fin: '30/12/2024' },
  { id: 'b05', ingreso: '4/06/2024',  fin: '26/04/2025' },
  { id: 'b06', ingreso: '29/06/2024', fin: '26/04/2025' },
  { id: 'b07', ingreso: '3/07/2024',  fin: '25/05/2025' },
  { id: 'b08', ingreso: '17/07/2024', fin: '8/06/2025'  },
  { id: 'b09', ingreso: '17/08/2024', fin: '11/07/2025' },
  { id: 'b10', ingreso: '31/08/2024', fin: '27/06/2025' },
  { id: 'b11', ingreso: '3/09/2024',  fin: '26/07/2025' },
  { id: 'b12', ingreso: '17/09/2024', fin: '10/08/2025' },
  { id: 'b13', ingreso: '16/10/2024', fin: '11/09/2025' },
  { id: 'b14', ingreso: '30/10/2024', fin: '26/09/2025' },
  { id: 'b15', ingreso: '3/12/2024',  fin: '25/10/2025' },
  { id: 'b16', ingreso: '17/12/2024', fin: '9/11/2025'  },
  { id: 'b17', ingreso: '21/12/2024', fin: '26/11/2025' },
  { id: 'b18', ingreso: '15/01/2025', fin: '10/12/2025' },
  { id: 'b19', ingreso: '1/02/2025',  fin: '25/12/2025' },
  { id: 'b20', ingreso: '15/02/2025', fin: '9/01/2026'  },
  { id: 'b21', ingreso: '1/03/2025',  fin: '25/01/2026' },
  { id: 'b22', ingreso: '1/03/2025',  fin: '10/05/2026' },
  { id: 'b23', ingreso: '1/03/2025',  fin: '25/07/2026' },
  { id: 'b24', ingreso: '15/03/2025', fin: '12/02/2026' },
  { id: 'b25', ingreso: '2/04/2025',  fin: '26/02/2026' },
  { id: 'b26', ingreso: '16/04/2025', fin: '12/03/2026' },
  { id: 'b27', ingreso: '3/05/2025',  fin: '4/04/2026'  },
  { id: 'b28', ingreso: '17/05/2025', fin: '11/04/2026' },
  { id: 'b29', ingreso: '31/05/2025', fin: '29/04/2026' },
  { id: 'b30', ingreso: '31/05/2025', fin: '28/05/2026' },
  { id: 'b31', ingreso: '31/05/2025', fin: '5/05/2026'  },
  { id: 'b32', ingreso: '31/05/2025', fin: '22/06/2026' },
  { id: 'b33', ingreso: '31/05/2025', fin: '2/09/2026'  },
  { id: 'b34', ingreso: '31/05/2025', fin: '16/06/2026' },
  { id: 'b35', ingreso: '31/05/2025', fin: '7/09/2026'  },
  { id: 'b36', ingreso: '17/06/2025', fin: '13/05/2026' },
  { id: 'b37', ingreso: '3/07/2025',  fin: '27/05/2026' },
  { id: 'b38', ingreso: '3/07/2025',  fin: '17/01/2027' },
  { id: 'b39', ingreso: '17/07/2025', fin: '10/06/2026' },
  { id: 'b40', ingreso: '31/07/2025', fin: '26/06/2026' },
  { id: 'b41', ingreso: '16/08/2025', fin: '10/07/2026' },
  { id: 'b42', ingreso: '16/08/2025', fin: '8/08/2026'  },
  { id: 'b43', ingreso: '2/09/2025',  fin: '29/07/2026' },
  { id: 'b44', ingreso: '16/09/2025', fin: '12/08/2026' },
  { id: 'b45', ingreso: '16/09/2025', fin: '15/01/2027' },
  { id: 'b46', ingreso: '30/09/2025', fin: '27/08/2026' },
  { id: 'b47', ingreso: '30/09/2025', fin: '25/02/2027' },
  { id: 'b48', ingreso: '16/10/2025', fin: '10/09/2026' },
  { id: 'b49', ingreso: '16/10/2025', fin: '11/09/2026' },
  { id: 'b50', ingreso: '30/10/2025', fin: '26/09/2026' },
  { id: 'b51', ingreso: '19/11/2025', fin: '10/10/2026' },
  { id: 'b52', ingreso: '3/12/2025',  fin: '25/10/2026' },
  { id: 'b53', ingreso: '3/12/2025',  fin: '28/12/2026' },
  { id: 'b54', ingreso: '16/12/2025', fin: '12/11/2026' },
  { id: 'b55', ingreso: '18/12/2025', fin: '12/11/2026' },
  { id: 'b56', ingreso: '20/12/2025', fin: '26/11/2026' },
  { id: 'b57', ingreso: '20/12/2025', fin: '1/12/2026'  },
  { id: 'b58', ingreso: '21/12/2025', fin: '27/11/2026' },
  { id: 'b59', ingreso: '17/01/2026', fin: '10/12/2026' },
  { id: 'b60', ingreso: '31/01/2026', fin: '25/12/2026' },
  { id: 'b61', ingreso: '14/02/2026', fin: '9/01/2027'  },
  { id: 'b62', ingreso: '28/02/2026', fin: '23/01/2027' },
  { id: 'b63', ingreso: '14/03/2026', fin: '7/02/2027'  },
  { id: 'b64', ingreso: '31/03/2026', fin: '24/02/2027' },
  { id: 'b65', ingreso: '17/04/2026', fin: '11/03/2027' },
  { id: 'b66', ingreso: '16/05/2026', fin: '14/04/2027' },
  { id: 'b67', ingreso: '2/06/2026',  fin: '28/04/2027' },
]

// ── Date utilities ────────────────────────────────────────────────

function addMonthsClamp(date, n) {
  const ty = date.getFullYear() + Math.floor((date.getMonth() + n) / 12)
  const tm = ((date.getMonth() + n) % 12 + 12) % 12
  const ld = new Date(ty, tm + 1, 0).getDate()
  return new Date(ty, tm, Math.min(date.getDate(), ld))
}

export function parseDateDMY(str) {
  if (!str) return null
  const parts = str.trim().split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y || y < 2000) return null
  return new Date(y, m - 1, d)
}

export function fmtDate(d) {
  if (!d) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export function getYear(ingresoStr) {
  const d = parseDateDMY(ingresoStr)
  return d ? d.getFullYear() : null
}

// ── Stage calculation ─────────────────────────────────────────────

export function calcEtapas(ingresoStr, finStr) {
  const ini = parseDateDMY(ingresoStr)
  const fin = parseDateDMY(finStr)
  if (!ini) return null

  const desIni  = addMonthsClamp(ini, 3)
  const proIni  = addMonthsClamp(ini, 7)
  const adapFin = new Date(desIni.getTime() - 86400000)
  const desFin  = new Date(proIni.getTime() - 86400000)
  const proFin  = fin || addMonthsClamp(ini, 11)

  return [
    { key: 'adaptacion', label: 'Adaptación', materia: 'Etapa 1_ Adaptación', inicio: ini,    fin: adapFin },
    { key: 'desempeno',  label: 'Desempeño',  materia: 'Etapa 2_Desempeño',   inicio: desIni, fin: desFin  },
    { key: 'proyeccion', label: 'Proyección', materia: 'Etapa3_Proyección',    inicio: proIni, fin: proFin  },
  ].map(e => ({
    ...e,
    inicioStr: fmtDate(e.inicio),
    finStr:    fmtDate(e.fin),
    fechasStr: `${fmtDate(e.inicio)} — ${fmtDate(e.fin)}`,
  }))
}

export function getEtapaHoy(ingresoStr, finStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const ini   = parseDateDMY(ingresoStr)
  const fin   = parseDateDMY(finStr)
  if (!ini) return 'sin datos'
  if (today < ini) return 'No iniciado'
  if (fin && today > fin) return 'Finalizado'
  const etapas = calcEtapas(ingresoStr, finStr)
  if (!etapas) return 'sin datos'
  for (const e of etapas) {
    if (today >= e.inicio && today <= e.fin) return e.label
  }
  return 'Proyección'
}

// ── LocalStorage CRUD ─────────────────────────────────────────────

function sortByIngreso(arr) {
  return [...arr].sort((a, b) => {
    const da = parseDateDMY(a.ingreso)
    const db = parseDateDMY(b.ingreso)
    if (!da || !db) return 0
    return da - db
  })
}

function ensureInit() {
  if (!localStorage.getItem(LS_KEY)) {
    localStorage.setItem(LS_KEY, JSON.stringify(BASE_COHORTS))
  }
}

export function getAllCohorts() {
  ensureInit()
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return [...BASE_COHORTS]
  }
}

export function saveCohorts(cohorts) {
  localStorage.setItem(LS_KEY, JSON.stringify(sortByIngreso(cohorts)))
}

export function addCohort(ingreso, fin) {
  const current = getAllCohorts()
  current.push({ id: `c${Date.now()}`, ingreso, fin })
  saveCohorts(current)
}

export function updateCohort(id, ingreso, fin) {
  const current = getAllCohorts()
  const idx = current.findIndex(c => c.id === id)
  if (idx >= 0) { current[idx] = { ...current[idx], ingreso, fin } }
  saveCohorts(current)
}

export function deleteCohort(id) {
  saveCohorts(getAllCohorts().filter(c => c.id !== id))
}

export function resetToDefaults() {
  localStorage.setItem(LS_KEY, JSON.stringify(BASE_COHORTS))
}

// ── Supabase sync ─────────────────────────────────────────────────

export async function syncFromSupabase() {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/seguimiento_etdh?select=fecha_ingreso_productiva,fecha_fin_productiva&etapa=eq.Productiva&limit=2000`
  const res = await fetch(url, {
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()

  // Extract unique valid pairs
  const pairs = new Map()
  data.forEach(r => {
    const i = (r.fecha_ingreso_productiva || '').trim()
    const f = (r.fecha_fin_productiva || '').trim()
    if (i && f && !i.includes('#') && !f.includes('#') && parseDateDMY(i) && parseDateDMY(f)) {
      pairs.set(`${i}|${f}`, { ingreso: i, fin: f })
    }
  })

  const current = getAllCohorts()
  const existingKeys = new Set(current.map(c => `${c.ingreso}|${c.fin}`))
  const newOnes = [...pairs.values()]
    .filter(p => !existingKeys.has(`${p.ingreso}|${p.fin}`))
    .map((p, i) => ({ id: `sync_${Date.now()}_${i}`, ...p }))

  saveCohorts([...current, ...newOnes])
  return { total: current.length + newOnes.length, added: newOnes.length }
}
