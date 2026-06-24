# Módulo de Traslados Kuepa — Registro de Proyecto

> Última actualización: 2026-06-23
> URL producción: https://modulo-traslados-kuepa.vercel.app
> Versión actual: v1.5.0

---

## 1. Contexto del Proyecto

Sistema web para gestionar traslados de estudiantes de programas **Técnicos Laborales EDTH** y **Bachillerato EDH** de Kuepa. Migración de un proceso que vivía en Google Sheets + App Script a un módulo digital propio.

**Stack:**
- Frontend: React + Vite + Tailwind CSS v3
- Deploy: Vercel (plan gratuito)
- Backend: n8n (n8n.kuepa.com) vía webhooks — **YA CONECTADO**
- Base de datos: Supabase (tabla `seguimiento_etdh`) — **YA CONECTADA**
- Datos locales: localStorage (calendario, cohortes productiva) + archivos de configuración estáticos

---

## 2. Arquitectura

```
src/
├── data/
│   ├── calendar.js       → Períodos y fechas 2025-2027 + localStorage para años nuevos
│   ├── programs.js       → Config de programas técnicos (ancla, materias, color)
│   └── productiva.js     → 67 cohortes BASE + cálculo etapas + localStorage CRUD + Supabase sync
│
├── engine/
│   └── anchorEngine.js   → Motor de cálculo de mallas (traducción directa de la macro)
│
├── utils/
│   ├── dateUtils.js      → Parseo de fechas d/m/yyyy, detección de período activo hoy
│   └── validacionUtils.js → normalizarPrograma, sonProgramasCompatibles, validarFechaModulo, getPeriodoFromFecha
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx    → Logo + título + toggle Beta/Prod (visual)
│   │   ├── Footer.jsx    → Copyright + versión
│   │   └── Layout.jsx    → Wrapper flex col
│   │
│   ├── campaigns/
│   │   ├── CampaignCard.jsx     → Card horizontal con estado (active/locked/development)
│   │   └── CampaignSelector.jsx → Landing con grid de campañas
│   │
│   ├── tecnicos/
│   │   └── TecnicosMenu.jsx  → Submenú TÉCNICOS EDTH con 7 herramientas (4 LECTIVA + 3 PRODUCTIVA)
│   │                            Incluye badge de último sync en tiempo real
│   │
│   ├── anclas/
│   │   ├── AnclaViewer.jsx   → Vista principal de malla curricular
│   │   ├── AnclaTable.jsx    → Tabla con búsqueda, filtro HOY, vista compacta/completa
│   │   └── AddYearModal.jsx  → Modal para agregar/editar fechas por año
│   │
│   ├── traslados/
│   │   ├── ValidacionView.jsx         → Validación completa de traslados (llama webhook + tabla 8 módulos)
│   │   │                                Incluye tab "REPORTE" integrado (por período + tipo)
│   │   ├── ReporteView.jsx            → Vista standalone de reporte (ruta propia, actualmente también
│   │   │                                existe como componente interno de ValidacionView)
│   │   ├── DisponibilidadView.jsx     → Disponibilidad de grupos por período (EN DESARROLLO)
│   │   └── ValidacionProductivaView.jsx → Validación de etapas productivas por estudiante
│   │
│   ├── productiva/
│   │   ├── MallaProductivaView.jsx    → Tabla de etapas (Adaptación/Desempeño/Proyección/Finalizado)
│   │   │                                Filtro por año, sync Supabase, gestión CRUD de cohortes
│   │   ├── AddCohortModal.jsx         → Modal para agregar/editar cohortes
│   │   └── WorldboxProductivaView.jsx → Visualización estilo "civilizaciones" de cohortes por etapa
│   │                                    Hover sobre zonas para ver cohortes activas hoy
│   │
│   └── common/
│       ├── Badge.jsx    → Badges de estado
│       └── Button.jsx   → Botón reutilizable
│
│
│   └── bachiller/
│       ├── BachillerMenu.jsx        → Submenú BACHILLER KUEPA con 4 herramientas
│       ├── ValidacionBachView.jsx   → Validación de asignaciones Bach (filtros multi-select,
│       │                              acordeón por grado, tooltips portal, estado de plataforma)
│       ├── MallaBachView.jsx        → Tabla de anclas Bach (motor calendarBach.js)
│       ├── GestionFechasBach.jsx    → CRUD de fechas de calendarios III/IV y V/VI en localStorage
│       └── ReporteBachView.jsx      → Reporte de materias erradas Bach:
│                                      - Selector de años con badges de error
│                                      - Calendario FASE 1 (ENE-MAY) + FASE 2 (JUL-NOV)
│                                      - Celdas: nombre completo de materia (sin abreviatura)
│                                      - Clic en celda → panel de fechas Cal III/IV + V/VI
│                                      - Tablas múltiples por año+mes+materia (solo al seleccionar)
│                                      - Export CSV + Export Google Sheets (hoja por año·fase·mes·materia)
│
├── data/
│   └── calendarBach.js  → FECHAS_III_IV, FECHAS_V_VI (2022-2027), MATERIAS_BASE,
│                          ANCLAS_REGULAR, ANCLAS_FLEX, COLOR_GRADO, getBachAvailableYears,
│                          getCalendario (base + localStorage)
│
├── engine/
│   └── anchorEngineBach.js → getAnchorRows, construirSecuencia, calcularEstado,
│                             getGradoActual — motor fiel al Apps Script original
│
└── App.jsx → Navegación por estado:
              'home' | 'tecnicos' | 'anclas' | 'validacion' | 'reporte' |
              'disponibilidad' | 'validacion-productiva' | 'malla-productiva' | 'worldbox-productiva' |
              'bachiller' | 'validacion-bach' | 'malla-bach' | 'fechas-bach' | 'reporte-bach'
```

---

## 3. Programas Técnicos (EDTH)

| ID | Nombre Completo | Materia Ancla | Período Ancla |
|----|----------------|---------------|---------------|
| TLAA | Técnico Laboral Auxiliar Administrativo | Gestión Documental | ABR I |
| TLMV | Técnico Laboral Mercadeo y Ventas | Fundamentos de Mercadeo y Ventas | MAY I |
| TLCF | Técnico Laboral Contabilidad y Finanzas | Contabilidad de costos | MAR II |
| TLPDD | Técnico Laboral Auxiliar en Procesamiento y Digitación de Datos | Auditoria de Sistemas | ENE II |

**Estructura de malla:** 8 módulos por estudiante
- Módulo 1: siempre MÓDULO ALPHA (bienvenida)
- Módulos 2-7: 6 materias en rotación según período de ingreso y ancla
- Módulo 8: siempre MÓDULO OMEGA (cierre)

**Períodos:** 24 por año (ENE I, ENE II, FEB I... DIC II), bimestrales.

---

## 4. Sistema de Anclas — Cómo funciona

La "materia ancla" es un punto fijo en el calendario: siempre cae en el mismo período del año. A partir de la distancia entre el período de ingreso del estudiante y el período ancla, se calcula el orden de rotación de las 6 materias.

```js
distanciaDesdeAncla = (ingresoIndex - anchorIndex + 24) % 24
posicionInicial     = (distanciaDesdeAncla + 1) % 6
posicionEnBaraja    = (posicionInicial + (moduleNumber - 2)) % 6
subject             = subjects[posicionEnBaraja]
```

---

## 5. Sistema Productiva — Cómo funciona

Los estudiantes en etapa Productiva tienen 3 sub-etapas calculadas a partir de la fecha de ingreso a productiva:

| Etapa | Duración | Materia en plataforma |
|-------|----------|-----------------------|
| Adaptación | Ingreso → ingreso+3 meses | `Etapa 1_ Adaptación` |
| Desempeño | Ingreso+3m → ingreso+7m | `Etapa 2_Desempeño` |
| Proyección | Ingreso+7m → fecha fin | `Etapa3_Proyección` |

**Datos:** 67 cohortes BASE en `productiva.js` + localStorage (`kuepa_productiva_cohorts_v2`) + sync desde Supabase.

**Supabase:** tabla `seguimiento_etdh` con columnas `fecha_ingreso_productiva`, `fecha_fin_productiva`, `etapa`.

---

## 6. Hoja ASIGNACION — Qué contiene

La hoja de Google Sheets tiene dos bloques por estudiante:

**Bloque A — Perfil (cols A-N):**
- ID SIS, Cédula, Nombre, Celular
- Programa en seguimiento vs programa en plataforma
- Confirmación de compatibilidad (✓)
- Fecha de ingreso real y período calculado
- Estado en plataforma (ej: "Retiro académico")
- Total incorrectos (col N)

**Bloque B — Validación módulo a módulo (M1 a M8, 8 columnas x módulo):**
```
[Materia Plat] [Grupo Plat] [ID Grupo MongoDB] [Fecha Inicio]
[Materia Ancla] [Fechas Ancla] [Período Ancla] [ESTADO]
```

**ESTADO posibles valores:**
- `CORRECTO` — materia y fechas coinciden
- `INCORRECTO - FECHA FUERA DE RANGO` — la materia puede coincidir pero las fechas no
- `FALTA MATERIA` — el módulo no está asignado en plataforma

**Propósito:** auditar si los grupos asignados en plataforma corresponden a las fechas y materias correctas según anclas.

---

## 7. Webhooks n8n — Endpoints activos

### Técnicos EDTH

| Webhook | Método | Descripción |
|---------|--------|-------------|
| `https://n8n.kuepa.com/webhook/ultimo-sync-etdh` | GET | Devuelve `{lastSync: ISO}` con la hora del último sync de SEGUIMIENTO |
| `https://n8n.kuepa.com/webhook/asignacion-etdh` | POST | Proceso completo: SEGUIMIENTO → BigQuery Programas → Períodos → BigQuery Módulos → Proceso → Response. Devuelve `{rows: [...], meta: {total, sin_errores, con_errores}}` |
| `https://n8n.kuepa.com/webhook/disponibilidad-grupos-etdh` | GET/POST | Disponibilidad de grupos por período (en desarrollo) |
| `https://n8n.kuepa.com/webhook/reporte-export-etdh` | POST | Genera Google Sheets del reporte de erradas ETDH. Retorna `{url}` |
| `https://n8n.kuepa.com/webhook/reporte-slack-etdh` | POST | Notifica resultado a Slack |

**Flujo `asignacion-etdh` (8 nodos):**
1. Webhook Trigger
2. HTTP Supabase (lee SEGUIMIENTO)
3. Leer SEGUIMIENTO (Code node)
4. BigQuery — Programas
5. Cruzar Programas (Code node)
6. BigQuery — Módulos
7. Proceso Completo (Code node — lógica central)
8. Respond to Webhook

### Bachillerato EDH

| Webhook | Método | Descripción |
|---------|--------|-------------|
| `https://n8n.kuepa.com/webhook/asignacion-bach` | POST | Proceso completo Bach: BigQuery VKU10_student_program_groups → motor de anclas → cruce → validación. Devuelve `{rows: [...]}` con array plano (6 cols base + 80×8 módulos) |
| `https://n8n.kuepa.com/webhook/reporte-export-bach` | POST | Genera Google Sheets del reporte de erradas Bach, una hoja por `año · FASE · mes · materia`. Retorna `{url}` |

**Flujo `asignacion-bach` (6 nodos, ID: `h0SxkzCzoCDXMMXZ`):**
1. Webhook Trigger
2. BigQuery (query VKU10_student_program_groups)
3. Agregar (unifica outputs → array plano)
4. Proceso Bach (Code node — motor anclas + cruce + calcularEstado)
5. Responder

**Workflow Export Bach (9 nodos, ID: `a4gVJHVvcGUTq5GC`):**
`Webhook → Build Payload → Crear Hoja (API Sheets) → Escribir Datos (batchUpdate) → Preparar Formato → Aplicar Formato → Mover a Carpeta → Publicar → Responder`

**Credencial Google Sheets:** `bbUDq8xPmSSp1VQ7` (NICOLAS SHEETS)
**Carpeta Drive destino:** `1hmY38PDIcPPJEKRe2pUO8hAxr0-8iyDM`

---

## 8. Funcionalidades Implementadas

### 8.1 Landing Page
- [x] Cards de campañas con estados (activo, bloqueado)
- [x] Diseño sci-fi organizacional (dark, HUD, esquinas tácticas)
- [x] Responsive (mobile/tablet/desktop)
- [x] Navegación por estado React (sin React Router aún)
- [x] Toggle Beta/Prod (visual)

### 8.2 TecnicosMenu — Submenú principal EDTH
- [x] Badge de último sync en tiempo real (semáforo verde/amarillo/rojo)
- [x] Sección LECTIVA (4 herramientas)
- [x] Sección PRODUCTIVA (3 herramientas)
- [x] v1.4.0

### 8.3 Malla Curricular (Anclas) — LECTIVA 01
- [x] Motor de cálculo fiel a la macro original
- [x] Tabla con todos los períodos de ingreso
- [x] Columnas: Período Ingreso | Fecha Ingreso | Módulo 1-8 (Materia + Período + Fechas)
- [x] Vista compacta (solo materias) y completa (con fechas)
- [x] Búsqueda por período, fecha, materia
- [x] Filtro HOY — detecta qué módulo está activo hoy, resalta en verde
- [x] Modal para agregar/editar fechas por año (persiste en localStorage)
- [x] Tabs por programa (TLAA, TLMV, TLCF, TLPDD)

### 8.4 Validación de Traslados — LECTIVA 02
- [x] Panel n8n con visualización nodo a nodo del flujo en tiempo real
- [x] Llama webhook `asignacion-etdh` (POST) y parsea respuesta
- [x] Tabla con sticky columns (ID SIS, Cédula, Nombre)
- [x] 8 módulos por estudiante con colores por módulo
- [x] Columnas: Materia Plat + Grupo + ID MongoDB + Fecha Inicio + Materia Ancla + Fechas Ancla + Período Ancla + Estado
- [x] Estado: CORRECTO (verde) / FECHA FUERA DE RANGO (rojo) / FALTA MATERIA (amber)
- [x] Filtros: texto libre, programa, estado (OK/ERROR), período de ingreso debería
- [x] Paginación completa (10/25/50/100/500 filas, ir a página)
- [x] Modo compacto / normal
- [x] Tab interna "REPORTE" — por período ancla, tipo activos/todos
- [x] Reporte muestra: materias esperadas por programa en el período + estudiantes con errores
- [x] Reset y nueva ejecución

### 8.5 Reporte de Materias Erradas — LECTIVA 03
- [x] Vista propia (ruta `reporte`)
- [x] Selección de período de revisión
- [x] Tipo: Solo Activos / Todos
- [x] Tabla: ID SIS, cédula, nombre, programa, estado plataforma, f.ingreso, período ing., materia actual, grupo actual, ID grupo, F.inicio actual, materia correcta, fechas correctas, tipo error

### 8.6 Disponibilidad de Grupos — LECTIVA 04 (EN DESARROLLO)
- [ ] Consulta webhook `disponibilidad-grupos-etdh`
- [ ] Vista de grupos activos por período para cada técnico
- [ ] Inscripciones brutas, activos, fechas de grupo en tiempo real

### 8.7 WorldBox Productiva — PRODUCTIVA 05
- [x] Visualización de cohortes por etapa (Adaptación/Desempeño/Proyección/Finalizado)
- [x] Hover sobre zonas para ver cohortes activas hoy

### 8.8 Malla Productiva — PRODUCTIVA 06
- [x] Tabla de etapas calculadas por fecha de ingreso
- [x] Filtro por año
- [x] Sync desde Supabase (`seguimiento_etdh`)
- [x] CRUD de cohortes (agregar/editar/eliminar/reset)
- [x] Modal AddCohortModal

### 8.9 Validación Productiva — PRODUCTIVA 07
- [x] Verifica que estudiantes productivos tengan etapas correctamente asignadas
- [x] Compara Adaptación/Desempeño/Proyección según fecha de ingreso a productiva

### 8.10 Módulo Bachillerato EDH (v1.5.0)

**BachillerMenu**
- [x] Submenú con 4 cards: Malla Curricular, Validación, Gestión Fechas, Reporte Erradas
- [x] Mismo esquema visual que TecnicosMenu

**MallaBachView — BACH 01**
- [x] Motor `anchorEngineBach.js` — traducción fiel del Apps Script `calcularGradoActual.gs`
- [x] Tabla de anclas por grado (6-11) y calendarios III/IV y V/VI
- [x] Selector de grado y calendario

**ValidacionBachView — BACH 02**
- [x] Carga datos desde webhook `asignacion-bach`
- [x] Filtros multi-select: programa, grado, tipo de error
- [x] Acordeón por grado con contadores por tipo de error
- [x] Tooltips portal con info completa del módulo
- [x] Badges de estado con color por tipo de error

**GestionFechasBach — BACH 03**
- [x] CRUD de fechas para calendarios III/IV y V/VI en localStorage
- [x] Soporte para años extra más allá de 2027

**ReporteBachView — BACH 04**
- [x] Selector de años con badge de conteo de errores por año (pill)
- [x] Calendario rejilla: FASE 1 (ENE→MAY) + FASE 2 (JUL→NOV) por año seleccionado
- [x] Celdas muestran nombre completo de materia (sin abreviatura, sin contadores)
- [x] Al seleccionar celda → panel de fechas exactas Cal. III/IV + Cal. V/VI
- [x] Tablas de resultados agrupadas por año + mes + materia (visibles solo al seleccionar celdas)
  - Encabezado: materia · mes badge · año · grados · contadores INC/N-A/PEND
- [x] Export CSV (client-side, incluye INCORRECTO + NO ASIGNADO + PENDIENTE)
- [x] Export Google Sheets: una hoja por `año · FASE 1/2 · mes · materia` (ej: `2026 · FASE 1 · MAY · Matemáticas`)
  - Hoja con fila de resumen (stats) + encabezado coloreado + datos de estudiantes
  - Retorna URL del Sheets creado, link directo "Abrir en Sheets →"
- [x] Tipos de error: INCORRECTO (rojo) · NO ASIGNADO (ámbar) · PENDIENTE (amarillo)
- [x] Filtros: programa, tipo error, búsqueda libre

**Motor Bach (`anchorEngineBach.js` + `calendarBach.js`)**
- [x] `MATERIAS_BASE`: 5 materias por grado, rotación carrusel
- [x] `FECHAS_III_IV` + `FECHAS_V_VI`: 60 períodos base (2022-2027)
- [x] `getCalendario(cal)`: base + overrides localStorage + años extra
- [x] `getBachAvailableYears()`: base + localStorage + 2 años futuros
- [x] `construirSecuencia(gradoIngreso, fechaIngreso, anclas)`: secuencia completa de 80 módulos
- [x] `calcularEstado(tieneBQ, fechaBQ, itemAncla)`: CORRECTO / INCORRECTO - FECHA / PENDIENTE / NO ASIGNADO
- [x] `COLOR_GRADO`: colores Tailwind por grado (6=azul, 7=púrpura, 8=verde, 9=naranja, 10=rojo, 11=fucsia)

---

## 9. Bugs Encontrados y Corregidos

### BUG-001 — `pointer-events: none` en `.scanline` bloqueaba todos los clics
- **Síntoma:** Botones no respondían al click.
- **Causa:** La clase `.scanline` tenía `pointer-events: none` en el div contenedor.
- **Solución:** Mover el efecto visual a `::before` con `position: fixed`. El div queda interactivo.
- **Archivo:** `src/index.css`

### BUG-002 — Columna sticky "Período de Ingreso" traslúcida al activar filtro HOY
- **Causa:** `bg-status-active/10` (10% opacidad) en lugar de color sólido.
- **Solución:** Reemplazar con `bg-[#0d2b1a]`.
- **Archivo:** `src/components/anclas/AnclaTable.jsx`

### BUG-003 — Verde de módulo activo persistía al desactivar filtro HOY
- **Causa:** `isActive` no incluía el estado de `todayFilter`.
- **Solución:** `const isActive = todayFilter && modIdx === row.activeModuleIdx`.
- **Archivo:** `src/components/anclas/AnclaTable.jsx`

### BUG-004 — Nombres de programas incorrectos
- **Causa:** Nombres inventados al crear la configuración inicial.
- **Solución:** Corregir con nombres oficiales en `src/data/programs.js`.

---

## 10. Las 3 Macros de Google Sheets — Análisis Técnico Completo

### Cadena de ejecución
```
Macro 1 → Macro 2 → Macro 3
(BigQuery)  (Validación)  (Reporte)
```

### Macro 1 — Asignación de Programa en Plataforma
**Fuente:** BigQuery (`potent-poetry-284019.DVKU_SIS.VKU10_student_program_groups`, ~50k registros)
- Lee cédulas de col A en hoja ASIGNACION
- Por cada cédula, consulta BigQuery para obtener el programa asignado en plataforma
- Escribe en col F: código del programa (`TLMV`, `TLAA`, `TLCF`, `TLPDD`)
- Escribe en col J: estado en plataforma (ej: `"Retiro académico"`)

### Macro 2 — Validación Módulo a Módulo
- Lee programa (col F) + fecha de ingreso → consulta hoja ANCLAS
- Compara módulo por módulo (M1 a M8) plataforma vs correcto
- Escribe en col N: TOTAL INCORRECTOS
- Usa normalizador de acentos (`.normalize('NFD')`) para comparar materias
- **ESTADO posibles:** `CORRECTO` / `INCORRECTO - FECHA FUERA DE RANGO`

### Macro 3 — Reporte de Distribución por Período
- Input: período específico (ej: `"ABR I 2025"`)
- Lee col N (TOTAL INCORRECTOS) por estudiantes del período
- Genera gráfico de distribución

---

## 11. Siguientes Pasos

### Inmediatos
- [ ] Completar DisponibilidadView (LECTIVA 04) — conectar con webhook
- [ ] Bach: webhook Slack para notificar reporte exportado (igual que ETDH)
- [ ] Bach: filtro por programa en ValidacionBachView

### Backlog
- [ ] React Router cuando haya más de 2 rutas principales
- [ ] Migrar localStorage a Supabase cuando sea necesario
- [ ] Notificaciones de resultado de validación

---

## 12. Decisiones Técnicas

| Decisión | Razón |
|----------|-------|
| Tailwind CSS v3 (no v4) | La config usa formato v3 (`tailwind.config.js`). v4 tiene API completamente diferente. |
| Sin React Router (aún) | Navegación simple por estado suficiente. Se agregará cuando haya más vistas principales. |
| localStorage para calendario y cohortes productiva | Sin backend propio. Permite modificar sin tocar código. |
| Motor calculado (no tabla guardada) | Más eficiente y siempre correcto. Agregar programa = 5 líneas de config. |
| Vercel plan gratuito | Sin inversión inicial. Suficiente para uso interno de Kuepa. |
| n8n como backend | Integra fácilmente con BigQuery, Supabase y Google Sheets sin servidor propio. |
| Supabase para Productiva | Tabla `seguimiento_etdh` con datos de cohortes productivas. Sync desde app. |
| Datos de muestra en ValidacionView | SAMPLE_RAW permite probar la UI sin llamar al webhook en desarrollo. |
