import { useState, useEffect } from 'react'
import {
  getAllCohorts, saveCohorts, addCohort, resetToDefaults,
  syncFromSupabase, calcEtapas, parseDateDMY
} from '../../data/productiva'

function isValid(str) {
  return !!str && !!parseDateDMY(str)
}

function EditRow({ cohort, onChange, onDelete }) {
  const [ingreso, setIngreso] = useState(cohort.ingreso)
  const [fin,     setFin]     = useState(cohort.fin)
  const [dirty,   setDirty]   = useState(false)

  const iniOk = isValid(ingreso)
  const finOk = isValid(fin)

  const handleBlur = () => {
    if (dirty && iniOk && finOk) {
      onChange(cohort.id, ingreso, fin)
      setDirty(false)
    }
  }

  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-x-2 items-center mb-1.5">
      <input
        value={ingreso}
        onChange={e => { setIngreso(e.target.value); setDirty(true) }}
        onBlur={handleBlur}
        placeholder="dd/mm/aaaa"
        className={`border font-mono text-xs px-2 py-1.5 outline-none bg-background transition-colors ${
          ingreso && !iniOk ? 'border-red-500/50 text-red-400'
            : iniOk ? 'border-amber-500/30 text-text-primary focus:border-amber-500/60'
            : 'border-primary/15 text-text-primary focus:border-primary/40'
        }`}
      />
      <input
        value={fin}
        onChange={e => { setFin(e.target.value); setDirty(true) }}
        onBlur={handleBlur}
        placeholder="dd/mm/aaaa"
        className={`border font-mono text-xs px-2 py-1.5 outline-none bg-background transition-colors ${
          fin && !finOk ? 'border-red-500/50 text-red-400'
            : finOk ? 'border-amber-500/30 text-text-primary focus:border-amber-500/60'
            : 'border-primary/15 text-text-primary focus:border-primary/40'
        }`}
      />
      <button
        onClick={() => onDelete(cohort.id)}
        className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors font-mono text-xs"
        title="Eliminar"
      >
        ✕
      </button>
    </div>
  )
}

export default function AddCohortModal({ onClose, onSaved }) {
  const [cohorts, setCohorts]     = useState(() => getAllCohorts())
  const [newIng,  setNewIng]      = useState('')
  const [newFin,  setNewFin]      = useState('')
  const [syncing, setSyncing]     = useState(false)
  const [syncMsg, setSyncMsg]     = useState(null)
  const [preview, setPreview]     = useState(null)
  const [saved,   setSaved]       = useState(false)

  const reload = () => setCohorts(getAllCohorts())

  const handleChange = (id, ingreso, fin) => {
    const updated = cohorts.map(c => c.id === id ? { ...c, ingreso, fin } : c)
    setCohorts(updated)
    saveCohorts(updated)
    setSaved(true)
    onSaved()
  }

  const handleDelete = (id) => {
    const updated = cohorts.filter(c => c.id !== id)
    setCohorts(updated)
    saveCohorts(updated)
    setSaved(true)
    onSaved()
  }

  const handleAdd = () => {
    if (!isValid(newIng) || !isValid(newFin)) return
    addCohort(newIng, newFin)
    setNewIng('')
    setNewFin('')
    setPreview(null)
    reload()
    setSaved(true)
    onSaved()
  }

  const handleReset = () => {
    if (!confirm('¿Restaurar las cohortes base y perder cambios personalizados?')) return
    resetToDefaults()
    reload()
    setSaved(true)
    onSaved()
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const { total, added } = await syncFromSupabase()
      reload()
      setSyncMsg({ ok: true, text: `Sincronizado — ${added} cohorte${added !== 1 ? 's' : ''} nueva${added !== 1 ? 's' : ''} agregada${added !== 1 ? 's' : ''} (total: ${total})` })
      onSaved()
    } catch (e) {
      setSyncMsg({ ok: false, text: `Error al sincronizar: ${e.message}` })
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (isValid(newIng)) {
      setPreview(calcEtapas(newIng, isValid(newFin) ? newFin : null))
    } else {
      setPreview(null)
    }
  }, [newIng, newFin])

  const ETAPA_CLS = [
    'border-amber-700/40 bg-amber-950/40 text-amber-300',
    'border-sky-700/40 bg-sky-950/40 text-sky-300',
    'border-violet-700/40 bg-violet-950/40 text-violet-300',
  ]

  // Group by year of ingreso
  const byYear = cohorts.reduce((acc, c) => {
    const y = (parseDateDMY(c.ingreso) || new Date()).getFullYear()
    if (!acc[y]) acc[y] = []
    acc[y].push(c)
    return acc
  }, {})
  const years = Object.keys(byYear).sort((a, b) => Number(a) - Number(b))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur">
      <div className="bg-background-card border border-amber-500/30 w-full max-w-xl mx-4 flex flex-col" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20">
          <div>
            <h2 className="font-display font-bold text-amber-400 uppercase tracking-wider text-sm">
              Gestión de Cohortes Productivas
            </h2>
            <p className="text-text-muted text-[10px] font-mono mt-0.5">
              Edita, agrega o elimina cohortes · Los cambios se guardan en este navegador
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-amber-400 text-lg font-mono px-2">✕</button>
        </div>

        {/* Sync button */}
        <div className="px-6 py-3 border-b border-amber-500/10 flex items-center gap-3 flex-wrap bg-amber-950/10">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={syncing ? 'animate-spin' : ''}>⟳</span>
            {syncing ? 'Sincronizando...' : 'Sincronizar desde Supabase'}
          </button>
          {syncMsg && (
            <span className={`text-[10px] font-mono ${syncMsg.ok ? 'text-amber-400' : 'text-red-400'}`}>
              {syncMsg.ok ? '✓' : '✗'} {syncMsg.text}
            </span>
          )}
          <button
            onClick={handleReset}
            className="ml-auto text-[9px] font-mono uppercase tracking-widest text-text-muted hover:text-red-400 transition-colors"
            title="Restaurar cohortes base"
          >
            Restaurar base
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-x-2 px-6 py-2 border-b border-amber-500/10 bg-background-elevated">
          <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted">F. Ingreso</span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted">F. Fin Productiva</span>
          <span className="w-7" />
        </div>

        {/* List (grouped by year) */}
        <div className="overflow-y-auto flex-1 px-6 py-3">
          {years.map(y => (
            <div key={y} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-3 bg-amber-500/50 rounded-sm flex-shrink-0" />
                <span className="text-[10px] font-mono font-bold text-amber-400/70 uppercase tracking-widest">{y}</span>
                <div className="flex-1 h-px bg-amber-500/10" />
                <span className="text-[9px] font-mono text-text-muted">{byYear[y].length}</span>
              </div>
              {byYear[y].map(c => (
                <EditRow
                  key={c.id}
                  cohort={c}
                  onChange={handleChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Add new cohort */}
        <div className="px-6 py-4 border-t border-amber-500/15 bg-background-elevated/40">
          <div className="text-[9px] font-mono uppercase tracking-widest text-amber-400/60 mb-2">Agregar nueva cohorte</div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-x-2 items-start">
            <div className="flex flex-col gap-1">
              <input
                value={newIng}
                onChange={e => setNewIng(e.target.value)}
                placeholder="Ingreso dd/mm/aaaa"
                className={`border font-mono text-xs px-2 py-1.5 outline-none bg-background transition-colors ${
                  newIng && !isValid(newIng) ? 'border-red-500/50 text-red-400'
                    : isValid(newIng) ? 'border-amber-500/50 text-text-primary'
                    : 'border-primary/20 text-text-primary placeholder:text-text-muted/50'
                }`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <input
                value={newFin}
                onChange={e => setNewFin(e.target.value)}
                placeholder="Fin dd/mm/aaaa"
                className={`border font-mono text-xs px-2 py-1.5 outline-none bg-background transition-colors ${
                  newFin && !isValid(newFin) ? 'border-red-500/50 text-red-400'
                    : isValid(newFin) ? 'border-amber-500/50 text-text-primary'
                    : 'border-primary/20 text-text-primary placeholder:text-text-muted/50'
                }`}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!isValid(newIng) || !isValid(newFin)}
              className="h-[30px] px-3 text-[10px] font-mono uppercase tracking-widest border border-amber-500/50 text-amber-400 hover:bg-amber-400 hover:text-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              + Agregar
            </button>
          </div>
          {/* Preview */}
          {preview && (
            <div className="mt-3 flex flex-col gap-1.5">
              {preview.map((e, i) => (
                <div key={e.key} className={`border rounded-sm px-3 py-1.5 flex items-center justify-between ${ETAPA_CLS[i]}`}>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{e.label}</span>
                  <span className="text-[10px] font-mono opacity-80">{e.fechasStr}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-amber-500/20 flex items-center justify-between">
          <span className="text-[10px] font-mono text-text-muted">
            {saved ? <span className="text-amber-400">✓ Cambios guardados</span> : `${cohorts.length} cohortes`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest border border-amber-500/30 text-amber-400 hover:bg-amber-400 hover:text-background transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
