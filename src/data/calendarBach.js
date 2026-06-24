// Traducción directa de FECHAS_CALENDARIO_III_IV y FECHAS_CALENDARIO_V_VI
// de calcularGradoActual.gs v6.8

export const FECHAS_III_IV = [
  // 2022
  "24/01/2022-18/02/2022","21/02/2022-18/03/2022","22/03/2022-23/04/2022",
  "25/04/2022-21/05/2022","23/05/2022-18/06/2022","11/07/2022-05/08/2022",
  "08/08/2022-02/09/2022","05/09/2022-30/09/2022","03/10/2022-04/11/2022",
  "08/11/2022-02/12/2022",
  // 2023
  "23/01/2023-17/02/2023","20/02/2023-17/03/2023","21/03/2023-21/04/2023",
  "24/04/2023-19/05/2023","23/05/2023-16/06/2023","10/07/2023-04/08/2023",
  "08/08/2023-01/09/2023","04/09/2023-29/09/2023","02/10/2023-03/11/2023",
  "07/11/2023-01/12/2023",
  // 2024
  "22/01/2024-16/02/2024","19/02/2024-15/03/2024","18/03/2024-19/04/2024",
  "22/04/2024-17/05/2024","20/05/2024-14/06/2024","08/07/2024-02/08/2024",
  "05/08/2024-30/08/2024","02/09/2024-27/09/2024","01/10/2024-01/11/2024",
  "05/11/2024-29/11/2024",
  // 2025
  "27/01/2025-21/02/2025","24/02/2025-21/03/2025","25/03/2025-25/04/2025",
  "28/04/2025-23/05/2025","26/05/2025-20/06/2025","07/07/2025-01/08/2025",
  "04/08/2025-29/08/2025","01/09/2025-26/09/2025","29/09/2025-31/10/2025",
  "04/11/2025-28/11/2025",
  // 2026
  "19/01/2026-13/02/2026","16/02/2026-13/03/2026","16/03/2026-17/04/2026",
  "20/04/2026-15/05/2026","19/05/2026-12/06/2026","06/07/2026-31/07/2026",
  "03/08/2026-28/08/2026","31/08/2026-25/09/2026","28/09/2026-30/10/2026",
  "03/11/2026-27/11/2026",
  // 2027
  "01/02/2027-26/02/2027","01/03/2027-02/04/2027","05/04/2027-30/04/2027",
  "03/05/2027-28/05/2027","01/06/2027-25/06/2027","12/07/2027-06/08/2027",
  "09/08/2027-03/09/2027","06/09/2027-01/10/2027","04/10/2027-05/11/2027",
  "08/11/2027-03/12/2027",
]

export const FECHAS_V_VI = [
  // 2022
  "25/01/2022-18/02/2022","22/02/2022-18/03/2022","22/03/2022-23/04/2022",
  "26/04/2022-21/05/2022","24/05/2022-18/06/2022","12/07/2022-05/08/2022",
  "09/08/2022-02/09/2022","06/09/2022-30/09/2022","04/10/2022-04/11/2022",
  "08/11/2022-02/12/2022",
  // 2023
  "24/01/2023-17/02/2023","21/02/2023-17/03/2023","21/03/2023-21/04/2023",
  "25/04/2023-19/05/2023","23/05/2023-16/06/2023","11/07/2023-04/08/2023",
  "08/08/2023-01/09/2023","05/09/2023-29/09/2023","03/10/2023-03/11/2023",
  "07/11/2023-01/12/2023",
  // 2024
  "23/01/2024-16/02/2024","20/02/2024-15/03/2024","19/03/2024-19/04/2024",
  "23/04/2024-17/05/2024","21/05/2024-14/06/2024","09/07/2024-02/08/2024",
  "06/08/2024-30/08/2024","03/09/2024-27/09/2024","01/10/2024-01/11/2024",
  "05/11/2024-29/11/2024",
  // 2025
  "28/01/2025-21/02/2025","25/02/2025-21/03/2025","25/03/2025-25/04/2025",
  "29/04/2025-23/05/2025","27/05/2025-20/06/2025","08/07/2025-01/08/2025",
  "05/08/2025-29/08/2025","02/09/2025-26/09/2025","30/09/2025-31/10/2025",
  "04/11/2025-28/11/2025",
  // 2026
  "20/01/2026-13/02/2026","17/02/2026-13/03/2026","17/03/2026-17/04/2026",
  "21/04/2026-15/05/2026","19/05/2026-12/06/2026","07/07/2026-31/07/2026",
  "04/08/2026-28/08/2026","01/09/2026-25/09/2026","29/09/2026-30/10/2026",
  "03/11/2026-27/11/2026",
  // 2027
  "02/02/2027-26/02/2027","02/03/2027-02/04/2027","06/04/2027-30/04/2027",
  "04/05/2027-28/05/2027","01/06/2027-25/06/2027","13/07/2027-06/08/2027",
  "10/08/2027-03/09/2027","07/09/2027-01/10/2027","05/10/2027-05/11/2027",
  "09/11/2027-03/12/2027",
]

// Materias base por grado (sin número — se agrega al construir)
export const MATERIAS_BASE = {
  6:  ["Matemáticas", "Lenguaje", "Ciencias Sociales", "Ciencias Naturales", "Inglés"],
  7:  ["Matemáticas", "Lenguaje", "Ciencias Sociales", "Ciencias Naturales", "Inglés"],
  8:  ["Lenguaje", "Ciencias Sociales", "Ciencias Naturales", "Inglés", "Matemáticas"],
  9:  ["Lenguaje", "Ciencias Sociales", "Ciencias Naturales", "Inglés", "Matemáticas"],
  10: ["Ciencias Sociales", "Ciencias Naturales", "Inglés", "Matemáticas", "Lenguaje"],
  11: ["Ciencias Naturales", "Inglés", "Matemáticas", "Lenguaje", "Ciencias Sociales"],
}

// Slots que ocupa cada grado en el output de 80 materias
export const MATERIAS_POR_GRADO = { 6: 5, 7: 5, 8: 5, 9: 5, 10: 30, 11: 30 }

export const ANCLAS_REGULAR = [
  { grado: 6,  cal: 'III_IV' },
  { grado: 7,  cal: 'III_IV' },
  { grado: 8,  cal: 'III_IV' },
  { grado: 9,  cal: 'III_IV' },
  { grado: 10, cal: 'V_VI'   },
  { grado: 11, cal: 'V_VI'   },
]

export const ANCLAS_FLEX = [
  { grado: 6,  cal: 'V_VI' },
  { grado: 7,  cal: 'V_VI' },
  { grado: 8,  cal: 'V_VI' },
  { grado: 9,  cal: 'V_VI' },
  { grado: 10, cal: 'V_VI' },
  { grado: 11, cal: 'V_VI' },
]

export const PROGRAMAS_BACH = [
  { id: 'plus-online', nombre: 'Bachillerato Plus Online', tipo: 'regular' },
  { id: 'plus-onsite', nombre: 'Bachillerato Plus Onsite', tipo: 'regular' },
  { id: 'flex',        nombre: 'Bachillerato Flex',        tipo: 'flex'    },
  { id: 'crepes',      nombre: 'Bachillerato Crepes',      tipo: 'flex'    },
]

export const COLOR_GRADO = {
  6:  { header: 'bg-blue-800/90 text-blue-100',    stripe: 'bg-blue-900/50',    badge: 'border-blue-500/40 text-blue-300'    },
  7:  { header: 'bg-purple-800/90 text-purple-100',stripe: 'bg-purple-900/50',  badge: 'border-purple-500/40 text-purple-300'},
  8:  { header: 'bg-green-800/90 text-green-100',  stripe: 'bg-green-900/50',   badge: 'border-green-500/40 text-green-300'  },
  9:  { header: 'bg-orange-800/90 text-orange-100',stripe: 'bg-orange-900/50',  badge: 'border-orange-500/40 text-orange-300'},
  10: { header: 'bg-red-800/90 text-red-100',      stripe: 'bg-red-900/50',     badge: 'border-red-500/40 text-red-300'      },
  11: { header: 'bg-fuchsia-800/90 text-fuchsia-100',stripe:'bg-fuchsia-900/50',badge: 'border-fuchsia-500/40 text-fuchsia-300'},
}

export function anclasPorPrograma(programa) {
  return (programa === 'Bachillerato Flex' || programa === 'Bachillerato Crepes')
    ? ANCLAS_FLEX
    : ANCLAS_REGULAR
}

// ── Años base hardcodeados en el código ───────────────────────────
const BACH_BASE_YEARS = [2022, 2023, 2024, 2025, 2026, 2027]
const BACH_PERIODS_PER_YEAR = 10
const BACH_STORAGE_KEY = (cal) => `kuepa_bach_extra_${cal}`

// ── localStorage helpers ──────────────────────────────────────────
export function getStoredBachPeriods(cal) {
  try {
    return JSON.parse(localStorage.getItem(BACH_STORAGE_KEY(cal)) || '{}')
  } catch {
    return {}
  }
}

export function saveExtraBachPeriods(cal, yearMap) {
  const existing = getStoredBachPeriods(cal)
  localStorage.setItem(BACH_STORAGE_KEY(cal), JSON.stringify({ ...existing, ...yearMap }))
}

export function getBachAvailableYears() {
  const stored34 = getStoredBachPeriods('III_IV')
  const years = new Set(BACH_BASE_YEARS)
  Object.keys(stored34).forEach(yr => years.add(Number(yr)))
  const max = Math.max(...years)
  years.add(max + 1)
  years.add(max + 2)
  return Array.from(years).sort((a, b) => a - b)
}

// ── getCalendario: base + fechas almacenadas en localStorage ──────
export function getCalendario(cal) {
  const base = cal === 'V_VI' ? [...FECHAS_V_VI] : [...FECHAS_III_IV]

  let stored = {}
  try {
    stored = JSON.parse(localStorage.getItem(BACH_STORAGE_KEY(cal)) || '{}')
  } catch {
    return base
  }

  // Sobreescribir entradas de años base si el usuario las editó
  BACH_BASE_YEARS.forEach((yr, i) => {
    const entries = stored[yr]
    if (Array.isArray(entries)) {
      entries.forEach((entry, j) => {
        if (entry && j < BACH_PERIODS_PER_YEAR) base[i * BACH_PERIODS_PER_YEAR + j] = entry
      })
    }
  })

  // Agregar años futuros en orden
  Object.keys(stored)
    .map(Number)
    .filter(yr => yr > 2027)
    .sort((a, b) => a - b)
    .forEach(yr => {
      const entries = stored[yr]
      if (Array.isArray(entries)) {
        entries.forEach(entry => { if (entry) base.push(entry) })
      }
    })

  return base
}
