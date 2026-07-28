# Contrato de datos — Archivo de Seguimiento Técnicos

> **Para quien lea esto:** este archivo documenta exactamente qué columnas necesita el módulo de traslados del archivo de seguimiento (Google Sheets). Si vas a crear el seguimiento 2027 u otro año, **conserva los mismos nombres de columna** para que el sistema siga funcionando sin cambios en el código.

---

## Cómo fluye la información

```
Google Sheets (seguimiento)
        ↓
    Workflow n8n  ←→  BigQuery (SIS / VKU10_student_program_groups)
        ↓
  Webhook /asignacion-etdh
        ↓
  Frontend React (ValidacionView)
```

El punto crítico es el **workflow n8n**. Él lee el seguimiento por nombre de columna. Si el nombre de una columna cambia en el Sheets, n8n lee vacío o el valor incorrecto, y el módulo muestra datos incorrectos sin dar error visible.

---

## Columnas del seguimiento que usa n8n

Estas son las columnas que el workflow de n8n lee del Google Sheets de seguimiento para construir la fila de cada estudiante:

| Posición en fila | Nombre de campo interno | Columna del seguimiento | Descripción |
|---|---|---|---|
| 0 | `id_sis` | ID SIS / ID en plataforma | Identificador del estudiante en el SIS |
| 1 | `cedula` | Cédula / Documento | Número de cédula |
| 2 | `nombre` | Nombre / Nombre completo | Nombre del estudiante |
| 3 | `celular` | Celular / Teléfono | Número de contacto |
| 4 | `prog_seguimiento` | Programa (seguimiento) | Programa según el archivo de seguimiento |
| 5 | `prog_plataforma` | — | Viene de BigQuery, no del seguimiento |
| 6 | `confirmacion` | Confirmación / Estado confirmación | Si el traslado fue confirmado |
| 7 | `fecha_ingreso` | Fecha de ingreso | Fecha en que el estudiante ingresó |
| 8 | `periodo_deberia` | Período que debería | Período en el que debería estar según ancla |
| 9 | `estado_plataforma` | — | Viene de BigQuery |
| 11 | `periodo_ingreso` | — | Calculado por n8n |
| 12 | `programa` | — | Calculado por n8n |

> **Nota:** Las columnas marcadas con "—" vienen de BigQuery, no del Sheets. Solo las que tienen nombre de columna son las que lees del seguimiento.

---

## Para cada módulo (8 módulos por estudiante)

Estos datos vienen 100% de BigQuery, no del seguimiento:

| Campo | Descripción |
|---|---|
| `materia_plat` | Materia que tiene asignada en el SIS |
| `grupo_plat` | Nombre del grupo en el SIS |
| `id_grupo` | ID del grupo en el SIS |
| `fecha_inicio` | Fecha de inicio del grupo |
| `materia_ancla` | Materia que DEBERÍA tener según el calendario de anclas |
| `fechas_ancla` | Rango de fechas de la ancla correcta |
| `periodo_ancla` | Período al que pertenece la ancla |
| `estado` | CORRECTO / INCORRECTO - FECHA / SIN ASIGNAR |

---

## Recomendación para el seguimiento 2027

1. **No cambies los nombres de las columnas** que usa n8n (ver tabla de arriba).
2. Si necesitas agregar columnas nuevas, agrégalas al final del Sheets — no insertes columnas en el medio.
3. Si debes renombrar una columna (ej: "Cédula" → "Documento"), actualiza **solo el workflow n8n** (`asignacion-etdh`) sin tocar el frontend.
4. Avisa al equipo técnico antes de hacer cualquier cambio estructural al Sheets.

---

## Si las columnas cambian y el sistema se rompe

**Síntoma:** la vista de Validación muestra datos en blanco, todos los estudiantes aparecen sin nombre o con datos incorrectos.

**Solución (sin tocar el frontend React):**
1. Ir a n8n → workflow `asignacion-etdh`
2. Buscar el nodo que lee el Google Sheets (nodo tipo "Google Sheets")
3. Actualizar los nombres de columna al nuevo nombre
4. Guardar y activar el workflow
5. Probar en la aplicación

El frontend no necesita ningún cambio — toda la adaptación se hace en n8n.

---

## Referencia técnica

- **Webhook n8n:** `https://n8n.kuepa.com/webhook/asignacion-etdh` (POST)
- **Workflow n8n:** buscar por nombre "Validación ETDH" o "asignacion-etdh" en n8n.kuepa.com
- **Frontend:** `src/components/traslados/ValidacionView.jsx` → función `parseRow(row)` línea ~67
- **Estructura del response:** `{ rows: [[...], [...]], meta: { total, sin_errores, con_errores } }`
- **Formato de fila:** array plano de 78 valores (14 base + 8 módulos × 8 campos)
