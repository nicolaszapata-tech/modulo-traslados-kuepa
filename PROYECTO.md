# Módulo de Traslados Kuepa — Registro de Proyecto

> Última actualización: 2026-04-13
> URL producción: https://modulo-traslados-kuepa.vercel.app

---

## 1. Contexto del Proyecto

Sistema web para gestionar traslados de estudiantes de programas **Técnicos Laborales EDTH** y **Bachillerato EDH** de Kuepa. Migración de un proceso que vivía en Google Sheets + App Script a un módulo digital propio.

**Stack:**
- Frontend: React + Vite + Tailwind CSS v3
- Deploy: Vercel (plan gratuito)
- Backend futuro: n8n (n8n.kuepa.com) vía webhooks
- Datos: localStorage (calendario) + archivos de configuración estáticos

---

## 2. Arquitectura

```
src/
├── data/
│   ├── calendar.js       → Períodos y fechas 2025-2027 + localStorage para años nuevos
│   └── programs.js       → Config de programas técnicos (ancla, materias, color)
│
├── engine/
│   └── anchorEngine.js   → Motor de cálculo de mallas (traducción directa de la macro)
│
├── utils/
│   └── dateUtils.js      → Parseo de fechas d/m/yyyy, detección de período activo hoy
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
│   ├── anclas/
│   │   ├── AnclaViewer.jsx  → Vista principal de malla curricular
│   │   ├── AnclaTable.jsx   → Tabla con búsqueda, filtro HOY, vista compacta/completa
│   │   └── AddYearModal.jsx → Modal para agregar/editar fechas por año
│   │
│   └── common/
│       ├── Badge.jsx    → Badges de estado
│       └── Button.jsx   → Botón reutilizable (no usado actualmente en anclas)
│
└── App.jsx → Navegación por estado: 'home' | 'anclas'
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

## 5. Hoja ASIGNACION — Qué contiene

La hoja de Google Sheets tiene dos bloques por estudiante:

**Bloque A — Perfil:**
- ID, Cédula, Nombre, Celular
- Programa en seguimiento vs programa en plataforma
- Confirmación de compatibilidad (✓)
- Fecha de ingreso real y período calculado
- Estado en plataforma (ej: "Retiro académico")

**Bloque B — Validación módulo a módulo (M1 a M7+):**
- FILE 2: lo que tiene asignado en la plataforma (materia, grupo, ID grupo MongoDB, fecha inicio)
- ANCLA: lo que debería tener según el motor de anclas (materia, fechas, período)
- ESTADO: `CORRECTO` o `INCORRECTO - FECHA FUERA DE RANGO`
- TOTAL INCORRECTOS: resumen de cuántos módulos están mal

**Propósito:** auditar si los grupos asignados en plataforma corresponden a las fechas y materias correctas según anclas.

---

## 6. Funcionalidades Implementadas

### 6.1 Landing Page
- [x] Cards de campañas con estados (activo, bloqueado)
- [x] Diseño sci-fi organizacional (dark, HUD, esquinas tácticas)
- [x] Responsive (mobile/tablet/desktop)
- [x] Navegación por estado React (sin React Router aún)
- [x] Toggle Beta/Prod (visual)

### 6.2 Malla Curricular (Anclas)
- [x] Motor de cálculo fiel a la macro original
- [x] Tabla con todos los períodos de ingreso
- [x] Columnas: Período Ingreso | Fecha Ingreso | Módulo 1-8 (Materia + Período + Fechas)
- [x] Vista compacta (solo materias) y completa (con fechas)
- [x] Búsqueda por período, fecha, materia
- [x] Filtro HOY — detecta qué módulo está activo hoy, resalta en verde
- [x] Modal para agregar/editar fechas por año (persiste en localStorage)
- [x] Tabs por programa (TLAA, TLMV, TLCF, TLPDD)
- [x] Agregar nuevo programa: solo editar `src/data/programs.js`
- [x] Agregar nuevo año: botón en UI o editar `src/data/calendar.js`

---

## 7. Bugs Encontrados y Corregidos

### BUG-001 — `pointer-events: none` en `.scanline` bloqueaba todos los clics
- **Síntoma:** Botones no respondían al click. El cursor no cambiaba a manita.
- **Causa:** La clase `.scanline` tenía `pointer-events: none` directamente en el div contenedor, no en un pseudo-elemento.
- **Solución:** Mover el efecto visual a `::before` con `position: fixed` y `pointer-events: none`. El div contenedor queda interactivo.
- **Archivo:** `src/index.css`

### BUG-002 — Columna sticky "Período de Ingreso" traslúcida al activar filtro HOY
- **Síntoma:** Al activar el filtro HOY la columna fija mostraba el contenido de detrás al hacer scroll horizontal.
- **Causa:** El estado activo usaba `bg-status-active/10` (color con 10% opacidad) en lugar de un color sólido.
- **Solución:** Reemplazar con color hexadecimal sólido `bg-[#0d2b1a]`.
- **Archivo:** `src/components/anclas/AnclaTable.jsx`

### BUG-003 — Verde de módulo activo persistía al desactivar filtro HOY
- **Síntoma:** Al desactivar el botón HOY, las celdas seguían resaltadas en verde.
- **Causa:** La condición `isActive` no incluía el estado de `todayFilter`.
- **Solución:** Cambiar `const isActive = modIdx === row.activeModuleIdx` por `const isActive = todayFilter && modIdx === row.activeModuleIdx`.
- **Archivo:** `src/components/anclas/AnclaTable.jsx`

### BUG-004 — Nombres de programas incorrectos
- **Síntoma:** TLAA aparecía como "Administración y Auditoría", TLPDD como "Programación y Desarrollo Digital".
- **Causa:** Nombres inventados al crear la configuración inicial.
- **Solución:** Corregir con nombres oficiales en `src/data/programs.js`.

---

## 7b. Las 3 Macros de Google Sheets — Análisis Técnico Completo

### Cadena de ejecución
```
Macro 1 → Macro 2 → Macro 3
(BigQuery)  (Validación)  (Reporte)
```
Macro 1 debe correr antes que Macro 2. Macro 2 antes que Macro 3.

---

### Macro 1 — Asignación de Programa en Plataforma
**Fuente:** BigQuery (`potent-poetry-284019.DVKU_SIS.VKU10_student_program_groups`, ~50k registros)

**Lo que hace:**
1. Lee cédulas de col A en hoja ASIGNACION
2. Por cada cédula, consulta BigQuery para obtener el programa asignado en plataforma
3. Escribe en col F: código del programa (`TLMV`, `TLAA`, `TLCF`, `TLPDD`, etc.)
4. Escribe en col J: estado en plataforma (ej: `"Retiro académico"`, `"Activo"`)

**Mapeo de nombres (CASE WHEN en BigQuery):**
| Nombre largo en plataforma | Código corto |
|---------------------------|--------------|
| Técnico Laboral en Mercadeo y Ventas | TLMV |
| Técnico Laboral Auxiliar Administrativo | TLAA |
| Técnico Laboral en Contabilidad y Finanzas | TLCF |
| Técnico Laboral en Procesamiento y Digitación de Datos | TLPDD |

**Lógica multi-programa:** Si un estudiante tiene más de un programa, se usa prioridad (el más reciente o el activo).

---

### Macro 2 — Validación Módulo a Módulo
**Fuente:** Col F (resultado Macro 1) + hoja ANCLAS

**Lo que hace por cada estudiante:**
1. Lee programa (col F) y fecha de ingreso real
2. Consulta hoja ANCLAS para obtener la malla correcta según anclas
3. Compara módulo por módulo (M1 a M7+) lo que tiene en plataforma vs lo correcto
4. Escribe en col N: `TOTAL INCORRECTOS` (número entero)
5. Escribe en cols K-ZZ: 8 grupos de columnas, uno por módulo

**Estructura de cada grupo de módulo (8 columnas por módulo):**
```
[Materia FILE2] [Grupo FILE2] [ID Grupo MongoDB FILE2] [Fecha Inicio FILE2]
[Materia ANCLA] [Fechas ANCLA] [Período ANCLA] [ESTADO]
```

**ESTADO posibles valores:**
- `CORRECTO` — la materia y fechas coinciden
- `INCORRECTO - FECHA FUERA DE RANGO` — la materia puede coincidir pero las fechas no

**Función normalizadora:** Maneja diferencias de acentos entre BigQuery y la hoja ANCLAS (ej: `"Auditoria"` vs `"Auditoría"`). Aplica `.normalize('NFD')` y remoción de diacríticos antes de comparar.

---

### Macro 3 — Reporte de Distribución por Período
**Input del usuario:** Período específico (ej: `"ABR I 2025"`)

**Lo que hace:**
1. Consulta BigQuery filtrando estudiantes del período indicado
2. Lee col N (TOTAL INCORRECTOS) por cada estudiante del período
3. Agrupa estudiantes por cantidad de módulos incorrectos (0, 1, 2, 3... módulos mal)
4. Genera reporte de distribución en una hoja nueva
5. Crea gráfico de barras con la distribución

**Propósito:** Ver de un vistazo cuántos estudiantes de un período tienen errores y cuántos módulos incorrectos tienen.

---

### Implicaciones para Parte 2 (Módulo Web)
- El módulo web replicará la lógica de Macro 2 (validación módulo a módulo)
- Input: estudiante ingresa sus datos + lo que tiene asignado en plataforma por módulo
- Output: comparación ANCLA vs FILE2, tabla de CORRECTO/INCORRECTO
- El normalizador de acentos también debe implementarse en JavaScript
- La conexión a BigQuery se hará vía n8n (backend), no directo desde el frontend

---

## 8. Siguientes Pasos

### Parte 2 — Módulo de Validación de Traslados (TÉCNICOS EDTH)
Replicar la lógica de la hoja ASIGNACION:
- [ ] Formulario de ingreso de estudiante (cédula, nombre, celular, programa, fecha ingreso)
- [ ] Cálculo automático de malla con motor de anclas
- [ ] Comparador: lo asignado en plataforma vs lo correcto según anclas
- [ ] Reporte por módulo: CORRECTO / INCORRECTO con detalle
- [ ] Integración con n8n para procesar y guardar datos

### Parte 3 — Integración n8n
- [ ] Webhook para recibir formulario de traslado
- [ ] Nodo de consulta a hoja ASIGNACION vía Google Sheets
- [ ] Lógica de validación en n8n
- [ ] Notificaciones de resultado

### Parte 4 — Bachillerato EDH
- [ ] Estructura diferente a técnicos (pendiente análisis)
- [ ] Campaña BACHILLER EDH activada en landing

---

## 9. Decisiones Técnicas

| Decisión | Razón |
|----------|-------|
| Tailwind CSS v3 (no v4) | La config del proyecto usa formato v3 (`tailwind.config.js`). v4 tiene API completamente diferente. |
| Sin React Router (aún) | Navegación simple por estado suficiente para fase 1. Se agregará cuando haya más de 2 vistas. |
| localStorage para calendario | Sin backend aún. Permite agregar años nuevos sin tocar código. Se migrará a DB cuando haya backend. |
| Motor calculado (no tabla guardada) | Más eficiente y siempre correcto. Agregar programa = 5 líneas de config. |
| Vercel plan gratuito | Sin inversión inicial. Suficiente para uso interno de Kuepa. |
