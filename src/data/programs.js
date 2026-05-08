/**
 * CONFIGURACIÓN DE PROGRAMAS TÉCNICOS
 *
 * Para agregar un nuevo programa, copia un bloque existente y completa:
 *  - id: código único del programa
 *  - label: nombre completo
 *  - anchorSubject: materia que sirve de ancla (punto fijo en el calendario)
 *  - anchorPeriod: período base donde siempre cae la materia ancla (sin año)
 *  - subjects: las 6 materias rotativas (en el orden definido por la macro)
 */

export const PROGRAMS = [
  {
    id: 'TLAA',
    label: 'Auxiliar Administrativo',
    color: 'cyan',
    anchorSubject: 'Gestión Documental',
    anchorPeriod: 'ABR I',
    subjects: [
      'Gestión Documental',
      'Talento Humano',
      'Mercado y Servicio al cliente',
      'Contabilidad y Finanzas',
      'Matemáticas y Estadística',
      'Nuevas tendencias de la administración',
    ],
  },
  {
    id: 'TLMV',
    label: 'Mercadeo y Ventas',
    color: 'orange',
    anchorSubject: 'Fundamentos de Mercadeo y Ventas',
    anchorPeriod: 'MAY I',
    subjects: [
      'Fundamentos de Mercadeo y Ventas',
      'Prospección y servicio a clientes',
      'Negociación de productos, precios y servicios',
      'Experiencia de usuario',
      'Análisis de Datos para Mercadeo y Ventas',
      'Marketing Relacional y Fidelización',
    ],
  },
  {
    id: 'TLCF',
    label: 'Contabilidad y Finanzas',
    color: 'green',
    anchorSubject: 'Contabilidad de costos',
    anchorPeriod: 'MAR II',
    subjects: [
      'Contabilidad de costos',
      'Procesos contables',
      'Contabilidad de Pasivos y Patrimonio',
      'TICs Software Contable',
      'Contabilidad y finanzas',
      'Matemáticas y estadística',
    ],
  },
  {
    id: 'TLPDD',
    label: 'Auxiliar en Procesamiento y Digitación de Datos',
    color: 'purple',
    anchorSubject: 'Auditoria de Sistemas',
    anchorPeriod: 'ENE II',
    subjects: [
      'Auditoria de Sistemas',
      'Matemáticas y estadística',
      'Gestión documental',
      'Inteligencia Artificial',
      'Administración y Gestión de Bases de datos',
      'Fundamento de bases de datos',
    ],
  },

  // ── AGREGA NUEVOS PROGRAMAS AQUÍ ─────────────────
  // {
  //   id: 'TLXX',
  //   label: 'Nombre del Programa',
  //   color: 'blue',
  //   anchorSubject: 'Materia Ancla',
  //   anchorPeriod: 'MES I o II',
  //   subjects: [
  //     'Materia 1', 'Materia 2', 'Materia 3',
  //     'Materia 4', 'Materia 5', 'Materia 6',
  //   ],
  // },
]

export function getProgramById(id) {
  return PROGRAMS.find((p) => p.id === id) ?? null
}
