/**
 * MOTOR DE ANCLAS
 * Traducción directa del algoritmo de la macro de App Script.
 */

import { BASE_PERIODS, getAllPeriods, getDates, getOffsetPeriod, getExtendedCalendar } from '../data/calendar'

/**
 * Dado un programa y un período de ingreso, calcula la malla completa
 * de 8 módulos con materia, período y fechas.
 */
export function getMalla(program, ingressPeriod, calendar = null) {
  const cal = calendar ?? getExtendedCalendar()
  const anchorIndex = BASE_PERIODS.indexOf(program.anchorPeriod)
  const cleanIngress = ingressPeriod.replace(/\s*\d{4}/, '').trim()
  const ingresoIndex = BASE_PERIODS.indexOf(cleanIngress)

  const modules = []
  for (let moduleIndex = 0; moduleIndex < 8; moduleIndex++) {
    const moduleNumber = moduleIndex + 1
    const periodInfo = getOffsetPeriod(ingressPeriod, moduleIndex)
    const subject = getSubjectForModule(ingresoIndex, anchorIndex, moduleNumber, program.subjects)

    modules.push({
      moduleNumber,
      subject,
      period: periodInfo?.periodKey ?? '—',
      dates: periodInfo ? (getDates(periodInfo.periodKey, cal)) : 'Fechas no definidas',
    })
  }
  return modules
}

/**
 * Calcula qué materia corresponde a un módulo.
 * Módulo 1 → ALPHA, Módulo 8 → OMEGA, Módulos 2-7 → rotación.
 */
function getSubjectForModule(ingresoIndex, anchorIndex, moduleNumber, subjects) {
  if (moduleNumber === 1) return 'MÓDULO ALPHA'
  if (moduleNumber === 8) return 'MÓDULO OMEGA'
  const distanciaDesdeAncla = ((ingresoIndex - anchorIndex) % 24 + 24) % 24
  const posicionInicial = (distanciaDesdeAncla + 1) % 6
  const posicionEnBaraja = (posicionInicial + (moduleNumber - 2)) % 6
  return subjects[posicionEnBaraja]
}

/**
 * Genera la tabla completa para un programa usando el calendario dado.
 */
export function generateFullTable(program, calendar = null) {
  const cal = calendar ?? getExtendedCalendar()
  return getAllPeriods(cal).map((period) => ({
    ingressPeriod: period,
    ingressDates: getDates(period, cal),
    modules: getMalla(program, period, cal),
  }))
}
