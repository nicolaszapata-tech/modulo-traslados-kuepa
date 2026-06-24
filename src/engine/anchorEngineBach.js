// Motor de malla Bach — v6.8
// Traducción fiel de calcularGradoActual.gs (Apps Script) a JS puro

import {
  MATERIAS_BASE, ANCLAS_REGULAR, ANCLAS_FLEX,
  anclasPorPrograma, getCalendario
} from '../data/calendarBach'

// ── Date utils ────────────────────────────────────────────────────────────────
export function parseFecha(str) {
  if (!str) return null
  if (str instanceof Date) return isNaN(str.getTime()) ? null : new Date(str.getFullYear(), str.getMonth(), str.getDate())
  const s = String(str).trim()
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m1) return new Date(+m1[3], +m1[2] - 1, +m1[1])
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3])
  return null
}

export function fmtFecha(d) {
  if (!d) return ''
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

export function parseRango(str) {
  if (!str) return null
  const m = String(str).match(/^(\d{1,2}\/\d{1,2}\/\d{4})-(\d{1,2}\/\d{1,2}\/\d{4})$/)
  if (!m) return null
  const inicio = parseFecha(m[1])
  const fin    = parseFecha(m[2])
  if (!inicio || !fin) return null
  return { inicio, fin }
}

// ── Anchor table — computed dynamically (no hardcoded sheets needed) ──────────
export function getAnchorRows(grado, cal) {
  const fechas = getCalendario(cal)
  const mats   = MATERIAS_BASE[grado]
  if (!mats) return []
  const n = mats.length // always 5
  return fechas.map((rangoStr, i) => {
    const materias = Array.from({ length: n }, (_, j) => {
      const idxM = (i + j) % n
      const idxF = i + j
      return {
        materia: `${mats[idxM]} ${grado}`,
        fechaStr: idxF < fechas.length ? fechas[idxF] : '',
        rango:    idxF < fechas.length ? parseRango(fechas[idxF]) : null,
      }
    })
    return { rangoStr, materias }
  })
}

// ── Find anchor row by ingress key (±1 day tolerance) ────────────────────────
function encontrarRowConTolerancia(rows, clave) {
  let row = rows.find(r => r.rangoStr.startsWith(clave))
  if (row) return row
  const f = parseFecha(clave)
  if (!f) return null
  for (const d of [-1, 1]) {
    const alt = new Date(f.getFullYear(), f.getMonth(), f.getDate() + d)
    row = rows.find(r => r.rangoStr.startsWith(fmtFecha(alt)))
    if (row) return row
  }
  return null
}

// ── Find index in calendar string array by date key (±1 day tolerance) ───────
function encontrarIdxEnCal(cal, clave) {
  const fechas = getCalendario(cal)
  let idx = fechas.findIndex(f => f.startsWith(clave))
  if (idx !== -1) return idx
  const f = parseFecha(clave)
  if (!f) return -1
  for (const d of [-1, 1]) {
    const alt = new Date(f.getFullYear(), f.getMonth(), f.getDate() + d)
    idx = fechas.findIndex(f2 => f2.startsWith(fmtFecha(alt)))
    if (idx !== -1) return idx
  }
  return -1
}

// ── Build full material sequence for a student ────────────────────────────────
export function construirSecuencia(gradoIngreso, fechaIngreso, anclas) {
  const secuencia = []
  const idxStart  = anclas.findIndex(a => a.grado === gradoIngreso)
  if (idxStart === -1 || !fechaIngreso) return secuencia

  let clave = fmtFecha(fechaIngreso)

  for (let i = idxStart; i < anclas.length; i++) {
    const { grado, cal } = anclas[i]
    const rows = getAnchorRows(grado, cal)
    const row  = encontrarRowConTolerancia(rows, clave)
    if (!row) break

    for (const mat of row.materias) {
      secuencia.push({ grado, ...mat })
    }

    if (i < anclas.length - 1) {
      const idxCal  = encontrarIdxEnCal(cal, clave)
      const idxSig  = idxCal + row.materias.length
      const calDest = anclas[i + 1].cal
      const fechasDest = getCalendario(calDest)
      if (idxCal === -1 || idxSig >= fechasDest.length) break
      const rSig = parseRango(fechasDest[idxSig])
      if (!rSig) break
      clave = fmtFecha(rSig.inicio)
    }
  }
  return secuencia
}

// ── Grado actual hoy ──────────────────────────────────────────────────────────
export function getGradoActual(gradoIngreso, fechaIngreso, anclas) {
  if (!gradoIngreso || !fechaIngreso) return 'Sin información'
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const idxStart = anclas.findIndex(a => a.grado === gradoIngreso)
  if (idxStart === -1) return `Grado ${gradoIngreso}`

  let clave = fmtFecha(fechaIngreso)

  for (let i = idxStart; i < anclas.length; i++) {
    const { grado, cal } = anclas[i]
    const rows = getAnchorRows(grado, cal)
    const row  = encontrarRowConTolerancia(rows, clave)
    if (!row) return 'FECHA NO ENCONTRADA'

    for (const mat of row.materias) {
      if (mat.rango && hoy <= mat.rango.fin) return `Grado ${grado}`
    }

    const idxCal  = encontrarIdxEnCal(cal, clave)
    const idxSig  = idxCal + row.materias.length
    const calDest = (i + 1 < anclas.length) ? anclas[i + 1].cal : cal
    const fechasDest = getCalendario(calDest)
    if (idxCal === -1 || idxSig >= fechasDest.length) break
    const rSig = parseRango(fechasDest[idxSig])
    if (!rSig) break
    clave = fmtFecha(rSig.inicio)
  }
  return `Grado ${anclas[anclas.length - 1].grado}`
}

// ── Normalizar texto para matching ───────────────────────────────────────────
export function normalizarMalla(texto) {
  if (!texto) return ''
  return String(texto)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Estado de una materia (±1 día de tolerancia) ──────────────────────────────
export function calcularEstado(tieneBQ, fechaBQStr, itemAncla) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  if (!tieneBQ) {
    if (!itemAncla.rango) return 'PENDIENTE'
    return itemAncla.rango.inicio > hoy ? 'PENDIENTE' : 'NO ASIGNADO'
  }
  if (!itemAncla.rango) return 'CORRECTO'
  const fechaBQ = parseFecha(fechaBQStr)
  if (!fechaBQ) return 'CORRECTO'

  const minDate = new Date(itemAncla.rango.inicio); minDate.setDate(minDate.getDate() - 1)
  const maxDate = new Date(itemAncla.rango.fin);    maxDate.setDate(maxDate.getDate() + 1)
  return (fechaBQ >= minDate && fechaBQ <= maxDate) ? 'CORRECTO' : 'INCORRECTO - FECHA'
}

// ── Helpers para calendarBach: tabla visible de anclas ───────────────────────
export function getTablaAncla(grado, cal) {
  return getAnchorRows(grado, cal)
}
