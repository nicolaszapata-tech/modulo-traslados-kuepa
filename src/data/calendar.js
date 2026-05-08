/**
 * CALENDARIO DE PERÍODOS
 * Para agregar un nuevo año: copiar el bloque del último año,
 * cambiar el año y actualizar las fechas reales.
 */

export const BASE_PERIODS = [
  'ENE I', 'ENE II', 'FEB I', 'FEB II', 'MAR I', 'MAR II',
  'ABR I', 'ABR II', 'MAY I', 'MAY II', 'JUN I', 'JUN II',
  'JUL I', 'JUL II', 'AGO I', 'AGO II', 'SEP I', 'SEP II',
  'OCT I', 'OCT II', 'NOV I', 'NOV II', 'DIC I', 'DIC II'
]

export const CALENDAR = {
  // ── 2025 ──────────────────────────────────────────
  'ENE I':     { dates: '9/1/2025 - 14/1/2025',   year: 2025 },
  'ENE II':    { dates: '16/1/2025 - 29/1/2025',  year: 2025 },
  'FEB I':     { dates: '3/2/2025 - 14/2/2025',   year: 2025 },
  'FEB II':    { dates: '17/2/2025 - 28/2/2025',  year: 2025 },
  'MAR I':     { dates: '3/3/2025 - 14/3/2025',   year: 2025 },
  'MAR II':    { dates: '17/3/2025 - 31/3/2025',  year: 2025 },
  'ABR I':     { dates: '2/4/2025 - 15/4/2025',   year: 2025 },
  'ABR II':    { dates: '16/4/2025 - 2/5/2025',   year: 2025 },
  'MAY I':     { dates: '5/5/2025 - 16/5/2025',   year: 2025 },
  'MAY II':    { dates: '19/5/2025 - 30/5/2025',  year: 2025 },
  'JUN I':     { dates: '3/6/2025 - 16/6/2025',   year: 2025 },
  'JUN II':    { dates: '17/6/2025 - 2/7/2025',   year: 2025 },
  'JUL I':     { dates: '3/7/2025 - 16/7/2025',   year: 2025 },
  'JUL II':    { dates: '17/7/2025 - 30/7/2025',  year: 2025 },
  'AGO I':     { dates: '1/8/2025 - 15/8/2025',   year: 2025 },
  'AGO II':    { dates: '19/8/2025 - 1/9/2025',   year: 2025 },
  'SEP I':     { dates: '2/9/2025 - 15/9/2025',   year: 2025 },
  'SEP II':    { dates: '16/9/2025 - 29/9/2025',  year: 2025 },
  'OCT I':     { dates: '1/10/2025 - 15/10/2025', year: 2025 },
  'OCT II':    { dates: '16/10/2025 - 29/10/2025',year: 2025 },
  'NOV I':     { dates: '30/10/2025 - 13/11/2025',year: 2025 },
  'NOV II':    { dates: '14/11/2025 - 28/11/2025',year: 2025 },
  'DIC I':     { dates: '1/12/2025 - 15/12/2025', year: 2025 },
  'DIC II':    { dates: '16/12/2025 - 19/12/2025',year: 2025 },

  // ── 2026 ──────────────────────────────────────────
  'ENE I 2026':  { dates: '13/1/2026 - 17/1/2026',  year: 2026 },
  'ENE II 2026': { dates: '19/1/2026 - 30/1/2026',  year: 2026 },
  'FEB I 2026':  { dates: '2/2/2026 - 13/2/2026',   year: 2026 },
  'FEB II 2026': { dates: '16/2/2026 - 27/2/2026',  year: 2026 },
  'MAR I 2026':  { dates: '2/3/2026 - 13/3/2026',   year: 2026 },
  'MAR II 2026': { dates: '16/3/2026 - 30/3/2026',  year: 2026 },
  'ABR I 2026':  { dates: '31/3/2026 - 16/4/2026',  year: 2026 },
  'ABR II 2026': { dates: '17/4/2026 - 30/4/2026',  year: 2026 },
  'MAY I 2026':  { dates: '4/5/2026 - 15/5/2026',   year: 2026 },
  'MAY II 2026': { dates: '19/5/2026 - 29/5/2026',  year: 2026 },
  'JUN I 2026':  { dates: '2/6/2026 - 17/6/2026',   year: 2026 },
  'JUN II 2026': { dates: '18/6/2026 - 2/7/2026',   year: 2026 },
  'JUL I 2026':  { dates: '3/7/2026 - 16/7/2026',   year: 2026 },
  'JUL II 2026': { dates: '17/7/2026 - 31/7/2026',  year: 2026 },
  'AGO I 2026':  { dates: '3/8/2026 - 18/8/2026',   year: 2026 },
  'AGO II 2026': { dates: '19/8/2026 - 1/9/2026',   year: 2026 },
  'SEP I 2026':  { dates: '2/9/2026 - 15/9/2026',   year: 2026 },
  'SEP II 2026': { dates: '16/9/2026 - 29/9/2026',  year: 2026 },
  'OCT I 2026':  { dates: '1/10/2026 - 15/10/2026', year: 2026 },
  'OCT II 2026': { dates: '16/10/2026 - 29/10/2026',year: 2026 },
  'NOV I 2026':  { dates: '3/11/2026 - 17/11/2026', year: 2026 },
  'NOV II 2026': { dates: '18/11/2026 - 1/12/2026', year: 2026 },
  'DIC I 2026':  { dates: '2/12/2026 - 16/12/2026', year: 2026 },
  'DIC II 2026': { dates: '17/12/2026 - 23/12/2026',year: 2026 },

  // ── 2027 ──────────────────────────────────────────
  'ENE I 2027':  { dates: '12/1/2027 - 15/1/2027',  year: 2027 },
  'ENE II 2027': { dates: '18/1/2027 - 29/1/2027',  year: 2027 },
  'FEB I 2027':  { dates: '1/2/2027 - 12/2/2027',   year: 2027 },
  'FEB II 2027': { dates: '15/2/2027 - 26/2/2027',  year: 2027 },
  'MAR I 2027':  { dates: '1/3/2027 - 12/3/2027',   year: 2027 },
  'MAR II 2027': { dates: '15/3/2027 - 29/3/2027',  year: 2027 },
  'ABR I 2027':  { dates: '30/3/2027 - 15/4/2027',  year: 2027 },
  'ABR II 2027': { dates: '16/4/2027 - 29/4/2027',  year: 2027 },
}

const LS_KEY = 'kuepa_extra_periods'

/**
 * Retorna los períodos guardados en localStorage (años nuevos agregados por el usuario)
 */
export function getStoredPeriods() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}')
  } catch {
    return {}
  }
}

/**
 * Guarda nuevos períodos en localStorage
 */
export function saveExtraPeriods(newPeriods) {
  const existing = getStoredPeriods()
  localStorage.setItem(LS_KEY, JSON.stringify({ ...existing, ...newPeriods }))
}

/**
 * Retorna el calendario completo: estático + lo guardado en localStorage
 */
export function getExtendedCalendar() {
  return { ...CALENDAR, ...getStoredPeriods() }
}

/**
 * Retorna todos los períodos del calendario extendido
 */
export function getAllPeriods(calendar = null) {
  return Object.keys(calendar ?? getExtendedCalendar())
}

/**
 * Dado un período clave, retorna sus fechas o 'Fechas no definidas'
 */
export function getDates(periodKey, calendar = null) {
  const cal = calendar ?? getExtendedCalendar()
  return cal[periodKey]?.dates ?? 'Fechas no definidas'
}

/**
 * Dado un período base (ej: 'FEB I') y un offset numérico,
 * retorna el período resultante con su año correcto.
 * Ejemplo: getOffsetPeriod('ENE I', 3, 2025) → 'ABR I'
 */
export function getOffsetPeriod(basePeriod, offset, startYear = 2025) {
  const cleanBase = basePeriod.replace(/\s*\d{4}/, '').trim()
  const startIndex = BASE_PERIODS.indexOf(cleanBase)
  if (startIndex === -1) return null

  const yearMatch = basePeriod.match(/\d{4}/)
  const year = yearMatch ? parseInt(yearMatch[0]) : startYear

  const absolutePosition = startIndex + offset
  const yearsElapsed = Math.floor(absolutePosition / 24)
  const periodIndex = ((absolutePosition % 24) + 24) % 24
  const finalYear = year + yearsElapsed
  const finalPeriodBase = BASE_PERIODS[periodIndex]
  const periodKey = finalYear === 2025 ? finalPeriodBase : `${finalPeriodBase} ${finalYear}`

  return { periodKey, dates: getDates(periodKey) }
}
