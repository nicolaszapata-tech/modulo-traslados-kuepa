/**
 * Parsea una fecha en formato d/m/yyyy a objeto Date
 */
export function parseDMY(str) {
  const parts = str.trim().split('/')
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
}

/**
 * Verifica si hoy cae dentro de un rango de fechas "d/m/yyyy - d/m/yyyy"
 */
export function isActiveToday(dateRangeStr) {
  if (!dateRangeStr || dateRangeStr === 'Fechas no definidas') return false
  try {
    const [startStr, endStr] = dateRangeStr.split(' - ')
    const start = parseDMY(startStr)
    const end = parseDMY(endStr)
    end.setHours(23, 59, 59)
    const today = new Date()
    return today >= start && today <= end
  } catch {
    return false
  }
}

/**
 * Formatea una fecha Date a d/m/yyyy
 */
export function formatDMY(date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}
