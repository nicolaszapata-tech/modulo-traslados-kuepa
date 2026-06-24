import { useState, useEffect } from 'react'
import { getStoredBachPeriods, saveExtraBachPeriods, getBachAvailableYears, FECHAS_III_IV, FECHAS_V_VI } from '../../data/calendarBach'

const BASE_YEARS = [2022, 2023, 2024, 2025, 2026, 2027]
const BASE_YEAR_START = 2022
const PERIODS_PER_YEAR = 10

const SLOT_LABELS = [
  'Ciclo 1', 'Ciclo 2', 'Ciclo 3', 'Ciclo 4', 'Ciclo 5',
  'Ciclo 6', 'Ciclo 7', 'Ciclo 8', 'Ciclo 9', 'Ciclo 10',
]

function getBaseEntries(cal, year) {
  const arr = cal === 'V_VI' ? FECHAS_V_VI : FECHAS_III_IV
  const start = (year - BASE_YEAR_START) * PERIODS_PER_YEAR
  return start >= 0 && start < arr.length ? arr.slice(start, start + PERIODS_PER_YEAR) : []
}

function parseEntry(entry) {
  if (!entry) return { start: '', end: '' }
  const dash = entry.indexOf('-', entry.indexOf('/') + 1)
  return { start: entry.slice(0, dash), end: entry.slice(dash + 1) }
}

function getSlots(cal, year) {
  const stored = getStoredBachPeriods(cal)
  const storedEntries = stored[year]

  // Usa localStorage si ya hay datos guardados, si no cae al array base
  const entries = (storedEntries && storedEntries.some(e => e))
    ? storedEntries
    : getBaseEntries(cal, year)

  return SLOT_LABELS.map((label, i) => ({
    label,
    ...parseEntry(entries[i] || ''),
  }))
}

function buildEntries(slots) {
  return slots.map(s => (s.start && s.end) ? `${s.start}-${s.end}` : '')
}

export default function GestionFechasBach({ onClose, onSaved }) {
  const availableYears = getBachAvailableYears()
  const defaultYear = availableYears.find(y => !BASE_YEARS.includes(y)) ?? availableYears[availableYears.length - 1]

  const [year,      setYear]      = useState(defaultYear)
  const [activeCal, setActiveCal] = useState('III_IV')
  const [slots34,   setSlots34]   = useState(() => getSlots('III_IV', defaultYear))
  const [slots56,   setSlots56]   = useState(() => getSlots('V_VI',   defaultYear))
  const [saved,     setSaved]     = useState(false)

  useEffect(() => {
    setSlots34(getSlots('III_IV', year))
    setSlots56(getSlots('V_VI',   year))
    setSaved(false)
  }, [year])

  function handleChange(cal, idx, field, val) {
    const setter = cal === 'III_IV' ? setSlots34 : setSlots56
    setter(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s))
    setSaved(false)
  }

  function handleSave() {
    saveExtraBachPeriods('III_IV', { [year]: buildEntries(slots34) })
    saveExtraBachPeriods('V_VI',   { [year]: buildEntries(slots56) })
    setSaved(true)
    onSaved?.()
  }

  const isBaseYear   = BASE_YEARS.includes(year)
  const count34      = slots34.filter(s => s.start && s.end).length
  const count56      = slots56.filter(s => s.start && s.end).length
  const currentSlots = activeCal === 'III_IV' ? slots34 : slots56

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur">
      <div
        className="bg-background-card border border-primary/30 w-full max-w-2xl mx-4 flex flex-col"
        style={{ maxHeight: '90vh' }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20">
          <div>
            <h2 className="font-display font-bold text-primary uppercase tracking-wider text-sm">
              Gestión de Fechas por Año — Bach
            </h2>
            <p className="text-text-muted text-[10px] font-mono mt-0.5">
              Edita los 10 ciclos anuales de cada calendario · guardado en este navegador
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-primary text-lg font-mono px-2">✕</button>
        </div>

        {/* Year selector */}
        <div className="px-6 py-3 border-b border-primary/10 flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Año</span>
          <div className="flex gap-2 flex-wrap">
            {availableYears.map(y => (
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
                {!BASE_YEARS.includes(y) && <span className="text-[8px] ml-1 text-primary/60">+</span>}
              </button>
            ))}
          </div>
          <span className={`ml-auto text-[9px] font-mono uppercase tracking-widest px-2 py-1 border ${
            isBaseYear
              ? 'border-amber-700/40 text-amber-400 bg-amber-900/20'
              : 'border-emerald-700/40 text-emerald-400 bg-emerald-900/20'
          }`}>
            {isBaseYear ? 'Año base (editable)' : 'Año nuevo'}
          </span>
        </div>

        {/* Warning base year */}
        {isBaseYear && (
          <div className="px-6 py-2 bg-amber-900/10 border-b border-amber-800/20 text-[10px] font-mono text-amber-400/80">
            ⚠ Este año tiene fechas predefinidas. Los cambios que guardes aquí las sobreescriben en tu navegador.
          </div>
        )}

        {/* Calendar tabs */}
        <div className="flex border-b border-primary/10">
          {[
            { cal: 'III_IV', label: 'Cal. III/IV · Grados 6-9',         count: count34, color: 'cyan'  },
            { cal: 'V_VI',   label: 'Cal. V/VI · Grados 10-11 + Flex',  count: count56, color: 'amber' },
          ].map(({ cal, label, count, color }) => (
            <button
              key={cal}
              onClick={() => setActiveCal(cal)}
              className={`flex-1 px-5 py-2.5 text-left border-b-2 transition-colors ${
                activeCal === cal
                  ? color === 'cyan'
                    ? 'border-cyan-500 text-cyan-300'
                    : 'border-amber-500 text-amber-300'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <span className="text-[10px] font-mono tracking-widest uppercase block">{label}</span>
              <span className={`text-[9px] font-mono mt-0.5 block ${
                count === 10 ? 'text-emerald-400' : count > 0 ? 'text-text-muted' : 'text-text-muted/40'
              }`}>
                {count > 0 ? `${count}/10 ciclos` : 'Sin datos'}
              </span>
            </button>
          ))}
        </div>

        {/* Slots */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="grid grid-cols-[100px_1fr_1fr] gap-x-3 text-[9px] font-mono text-text-muted uppercase tracking-widest mb-3 pb-2 border-b border-primary/10">
            <span>Ciclo</span>
            <span>Fecha inicio (dd/mm/aaaa)</span>
            <span>Fecha fin (dd/mm/aaaa)</span>
          </div>

          {currentSlots.map((s, i) => (
            <div
              key={i}
              className={`grid grid-cols-[100px_1fr_1fr] gap-x-3 mb-2 items-center ${
                i === 4 ? 'mb-5 pb-4 border-b border-primary/10' : ''
              }`}
            >
              <span className={`font-mono text-[11px] font-semibold ${
                s.start && s.end ? 'text-primary' : 'text-text-muted'
              }`}>
                {s.label}
                <span className="text-[8px] ml-1 text-text-muted/40">{i < 5 ? 'S1' : 'S2'}</span>
              </span>
              <input
                value={s.start}
                onChange={e => handleChange(activeCal, i, 'start', e.target.value)}
                placeholder={`01/01/${year}`}
                className={`border font-mono text-xs px-2 py-1.5 outline-none transition-colors ${
                  s.start
                    ? 'bg-background border-primary/30 text-text-primary focus:border-primary'
                    : 'bg-background/50 border-primary/10 text-text-muted focus:border-primary/40 placeholder:text-text-muted/40'
                }`}
              />
              <input
                value={s.end}
                onChange={e => handleChange(activeCal, i, 'end', e.target.value)}
                placeholder={`28/01/${year}`}
                className={`border font-mono text-xs px-2 py-1.5 outline-none transition-colors ${
                  s.end
                    ? 'bg-background border-primary/30 text-text-primary focus:border-primary'
                    : 'bg-background/50 border-primary/10 text-text-muted focus:border-primary/40 placeholder:text-text-muted/40'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-primary/20 flex items-center justify-between gap-4 flex-wrap">
          <span className="text-text-muted text-[10px] font-mono">
            {saved
              ? <span className="text-emerald-400">✓ Guardado — III/IV y V/VI para {year}</span>
              : <span>III/IV: {count34}/10 · V/VI: {count56}/10 · Guardar escribe ambos calendarios</span>
            }
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
