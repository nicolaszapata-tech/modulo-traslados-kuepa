/**
 * UTILIDADES DE VALIDACIÓN DE TRASLADOS
 * Lógica basada en las macros de Google Sheets (CONCORDANCIA.gs y BLOQUES UNIFICADOS.gs)
 */

import { parseDMY } from './dateUtils'
import { getExtendedCalendar } from '../data/calendar'

/**
 * Normaliza un código de programa al código base.
 * Maneja variantes como TLAA-EFE, TLMV-OXXO, tlaa, etc.
 * Traducción directa de normalizarPrograma() de CONCORDANCIA.gs
 */
export function normalizarPrograma(str) {
  if (!str) return ''
  const clean = String(str).trim().toUpperCase().replace(/\s+/g, ' ').replace(/[-_]/g, '-')
  if (clean.startsWith('TLAA'))  return 'TLAA'
  if (clean.startsWith('TLMV'))  return 'TLMV'
  if (clean.startsWith('TLCF'))  return 'TLCF'
  if (clean.startsWith('TLPDD')) return 'TLPDD'
  if (clean.includes('TLAA'))    return 'TLAA'
  if (clean.includes('TLMV'))    return 'TLMV'
  if (clean.includes('TLCF'))    return 'TLCF'
  if (clean.includes('TLPDD'))   return 'TLPDD'
  if (clean.includes('AUXILIAR ADMINISTRATIVO'))        return 'TLAA'
  if (clean.includes('MERCADEO') || clean.includes('VENTAS')) return 'TLMV'
  if (clean.includes('CONTABILIDAD') || clean.includes('FINANZAS')) return 'TLCF'
  if (clean.includes('PROCESAMIENTO') || clean.includes('DIGITACION')) return 'TLPDD'
  return clean
}

/**
 * Verifica si dos programas son compatibles (ignora variantes -EFE, -OXXO, etc.)
 */
export function sonProgramasCompatibles(prog1, prog2) {
  const a = normalizarPrograma(prog1)
  const b = normalizarPrograma(prog2)
  return a && b && a === b
}

/**
 * Valida si la fecha de inicio de un módulo en plataforma cae dentro
 * del rango de fechas del ancla correspondiente.
 *
 * @param {string} fechaInicio - "yyyy-mm-dd" (input HTML) o "d/m/yyyy"
 * @param {string} fechasAncla - "d/m/yyyy - d/m/yyyy"
 * @returns {'CORRECTO' | 'INCORRECTO - FECHA FUERA DE RANGO' | null}
 */
export function validarFechaModulo(fechaInicio, fechasAncla) {
  if (!fechaInicio || !fechasAncla || fechasAncla === 'Fechas no definidas') return null
  try {
    let platDate
    if (fechaInicio.includes('-')) {
      const [yyyy, mm, dd] = fechaInicio.split('-').map(Number)
      platDate = new Date(yyyy, mm - 1, dd)
    } else {
      platDate = parseDMY(fechaInicio)
    }
    if (isNaN(platDate.getTime())) return null

    const [startStr, endStr] = fechasAncla.split(' - ')
    const startDate = parseDMY(startStr.trim())
    const endDate   = parseDMY(endStr.trim())
    endDate.setHours(23, 59, 59)

    return platDate >= startDate && platDate <= endDate
      ? 'CORRECTO'
      : 'INCORRECTO - FECHA FUERA DE RANGO'
  } catch {
    return null
  }
}

/**
 * Dado un string "yyyy-mm-dd" (input HTML), retorna la clave del período
 * en el calendario (ej: "SEP II", "ABR I 2026").
 * Traducción directa de asignarPeriodos() de PERIODO DE INGRESO.gs
 *
 * @param {string} fechaStr - "yyyy-mm-dd"
 * @param {object} [calendar] - opcional, usa getExtendedCalendar() por defecto
 * @returns {string|null}
 */
export function getPeriodoFromFecha(fechaStr, calendar) {
  if (!fechaStr) return null
  const [yyyy, mm, dd] = fechaStr.split('-').map(Number)
  const date = new Date(yyyy, mm - 1, dd)
  const cal  = calendar ?? getExtendedCalendar()

  for (const [key, val] of Object.entries(cal)) {
    if (!val?.dates) continue
    const parts = val.dates.split(' - ')
    if (parts.length < 2) continue
    try {
      const start = parseDMY(parts[0].trim())
      const end   = parseDMY(parts[1].trim())
      end.setHours(23, 59, 59)
      if (date >= start && date <= end) return key
    } catch {
      continue
    }
  }
  return null
}
