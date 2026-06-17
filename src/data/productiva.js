const LS_KEY = 'kuepa_productiva_cohorts'

export const BASE_COHORTS = [
  { id: 'b01', ingreso: '16/05/2026', fin: '14/04/2027' },
  { id: 'b02', ingreso: '02/06/2026', fin: '28/04/2027' },
  { id: 'b03', ingreso: '18/06/2026', fin: '12/05/2027' },
  { id: 'b04', ingreso: '03/07/2026', fin: '26/05/2027' },
  { id: 'b05', ingreso: '17/07/2026', fin: '09/06/2027' },
  { id: 'b06', ingreso: '01/08/2026', fin: '24/06/2027' },
  { id: 'b07', ingreso: '19/08/2026', fin: '11/07/2027' },
  { id: 'b08', ingreso: '02/09/2026', fin: '28/07/2027' },
  { id: 'b09', ingreso: '16/09/2026', fin: '12/08/2027' },
  { id: 'b10', ingreso: '30/09/2026', fin: '26/08/2027' },
  { id: 'b11', ingreso: '17/10/2026', fin: '11/09/2027' },
  { id: 'b12', ingreso: '30/10/2026', fin: '26/09/2027' },
  { id: 'b13', ingreso: '18/11/2026', fin: '10/10/2027' },
  { id: 'b14', ingreso: '02/12/2026', fin: '27/10/2027' },
  { id: 'b15', ingreso: '17/12/2026', fin: '12/11/2027' },
  { id: 'b16', ingreso: '24/12/2026', fin: '26/11/2027' },
]

function addMonthsClamp(date, n) {
  const ty = date.getFullYear() + Math.floor((date.getMonth() + n) / 12)
  const tm = ((date.getMonth() + n) % 12 + 12) % 12
  const ld = new Date(ty, tm + 1, 0).getDate()
  return new Date(ty, tm, Math.min(date.getDate(), ld))
}

export function parseDateDMY(str) {
  if (!str) return null
  const parts = str.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y) return null
  return new Date(y, m - 1, d)
}

export function fmtDate(d) {
  if (!d) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

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

export function getStoredCohorts() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}

export function saveExtraCohort(ingreso, fin) {
  const existing = getStoredCohorts()
  existing.push({ id: `c${Date.now()}`, ingreso, fin })
  localStorage.setItem(LS_KEY, JSON.stringify(existing))
}

export function deleteCohort(id) {
  const existing = getStoredCohorts()
  localStorage.setItem(LS_KEY, JSON.stringify(existing.filter(c => c.id !== id)))
}

export function getAllCohorts() {
  return [...BASE_COHORTS, ...getStoredCohorts()].sort((a, b) => {
    const da = parseDateDMY(a.ingreso)
    const db = parseDateDMY(b.ingreso)
    if (!da || !db) return 0
    return da - db
  })
}
