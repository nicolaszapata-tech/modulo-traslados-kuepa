import { useState, useEffect } from 'react'
import { BASE_PERIODS, CALENDAR, getStoredPeriods, saveExtraPeriods } from '../../data/calendar'

function getPeriodKey(basePeriod, year) {
  return year === 2025 ? basePeriod : `${basePeriod} ${year}`
}

function getExistingDatesForYear(year) {
  const all = { ...CALENDAR, ...getStoredPeriods() }
  return BASE_PERIODS.map((p) => {
    const key = getPeriodKey(p, year)
    const entry = all[key]
    if (entry) {
      const [start, end] = entry.dates.split(' - ')
      return { key, label: p, start, end }
    }
    return { key, label: p, start: '', end: '' }
  })
}

function getAvailableYears() {
  const all = { ...CALENDAR, ...getStoredPeriods() }
  const years = new Set()
  Object.values(all).forEach((v) => { if (v?.year) years.add(v.year) })
  // Agregar el año siguiente al último disponible
  const max = Math.max(...years)
  years.add(max + 1)
  years.add(max + 2)
  return Array.from(years).sort((a, b) => a - b)
}

export default function AddYearModal({ onClose, onSaved }) {
  const availableYears = getAvailableYears()
  const [year, setYear] = useState(availableYears[availableYears.length - 1])
  const [periods, setPeriods] = useState(() => getExistingDatesForYear(year))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setPeriods(getExistingDatesForYear(year))
    setSaved(false)
  }, [year])

  const hasExistingData = periods.some((p) => p.start !== '')
  const isStaticYear = year <= 2027 // años con datos en el código base

  const handleChange = (idx, field, val) => {
    setPeriods((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p)))
  }

  const handleSave = () => {
    const newEntries = {}
    periods.forEach((p) => {
      if (p.start && p.end) {
        newEntries[p.key] = { dates: `${p.start} - ${p.end}`, year }
      }
    })
    saveExtraPeriods(newEntries)
    setSaved(true)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur">
      <div className="bg-background-card border border-primary/30 w-full max-w-2xl mx-4 flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20">
          <div>
            <h2 className="font-display font-bold text-primary uppercase tracking-wider text-sm">
              Gestión de Fechas por Año
            </h2>
            <p className="text-text-muted text-[10px] font-mono mt-0.5">
              Agrega o edita las fechas de los 24 períodos de cualquier año
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-primary text-lg font-mono px-2">✕</button>
        </div>

        {/* Year selector */}
        <div className="px-6 py-3 border-b border-primary/10 flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Año</span>
          <div className="flex gap-2 flex-wrap">
            {availableYears.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1 text-[11px] font-mono border transition-colors ${
                  year === y
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-primary/20 text-text-muted hover:border-primary/40 hover:text-text-secondary'
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          {/* Status badge */}
          <span className={`ml-auto text-[9px] font-mono uppercase tracking-widest px-2 py-1 border ${
            hasExistingData
              ? isStaticYear
                ? 'border-secondary/40 text-secondary bg-secondary/10'
                : 'border-status-active/40 text-status-active bg-status-active/10'
              : 'border-text-muted/20 text-text-muted'
          }`}>
            {hasExistingData
              ? isStaticYear ? 'Datos base (editables)' : 'Guardado localmente'
              : 'Sin datos — nuevo año'}
          </span>
        </div>

        {/* Warning for static years */}
        {hasExistingData && isStaticYear && (
          <div className="px-6 py-2 bg-secondary/5 border-b border-secondary/20 text-[10px] font-mono text-secondary/80">
            ⚠ Este año tiene fechas en la configuración base. Los cambios que guardes aquí las sobreescriben en tu navegador.
          </div>
        )}

        {/* Periods list */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="grid grid-cols-[90px_1fr_1fr] gap-x-3 text-[10px] font-mono text-text-muted uppercase tracking-widest mb-3 pb-2 border-b border-primary/10">
            <span>Período</span>
            <span>Fecha inicio (d/m/año)</span>
            <span>Fecha fin (d/m/año)</span>
          </div>
          {periods.map((p, i) => (
            <div key={p.key} className="grid grid-cols-[90px_1fr_1fr] gap-x-3 mb-2 items-center">
              <span className={`font-mono text-xs font-bold ${p.start ? 'text-primary' : 'text-text-muted'}`}>
                {p.label}
              </span>
              <input
                value={p.start}
                onChange={(e) => handleChange(i, 'start', e.target.value)}
                placeholder={`1/1/${year}`}
                className={`border font-mono text-xs px-2 py-1.5 outline-none transition-colors ${
                  p.start
                    ? 'bg-background border-primary/30 text-text-primary focus:border-primary'
                    : 'bg-background/50 border-primary/10 text-text-muted focus:border-primary/40 placeholder:text-text-muted/50'
                }`}
              />
              <input
                value={p.end}
                onChange={(e) => handleChange(i, 'end', e.target.value)}
                placeholder={`15/1/${year}`}
                className={`border font-mono text-xs px-2 py-1.5 outline-none transition-colors ${
                  p.end
                    ? 'bg-background border-primary/30 text-text-primary focus:border-primary'
                    : 'bg-background/50 border-primary/10 text-text-muted focus:border-primary/40 placeholder:text-text-muted/50'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-primary/20 flex items-center justify-between gap-4 flex-wrap">
          <span className="text-text-muted text-[10px] font-mono">
            {saved
              ? <span className="text-status-active">✓ Guardado correctamente</span>
              : 'Los cambios se guardan en este navegador'}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest border border-primary/20 text-text-muted hover:text-text-primary transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-background transition-colors"
            >
              Guardar {year}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
