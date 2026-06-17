import { useState } from 'react'
import { saveExtraCohort, calcEtapas, parseDateDMY } from '../../data/productiva'

function isValidDMY(str) {
  if (!str) return false
  const d = parseDateDMY(str)
  return d instanceof Date && !isNaN(d)
}

export default function AddCohortModal({ onClose, onSaved }) {
  const [ingreso, setIngreso] = useState('')
  const [fin, setFin]         = useState('')
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  const iniValid = isValidDMY(ingreso)
  const finValid = isValidDMY(fin)
  const preview  = iniValid ? calcEtapas(ingreso, finValid ? fin : null) : null

  const handleSave = () => {
    if (!iniValid) { setError('Fecha de ingreso inválida. Usa dd/mm/aaaa'); return }
    if (!finValid) { setError('Fecha de fin inválida. Usa dd/mm/aaaa'); return }
    setError('')
    saveExtraCohort(ingreso, fin)
    setSaved(true)
    onSaved()
  }

  const ETAPA_CLS = [
    'border-amber-700/40 bg-amber-950/40 text-amber-300',
    'border-sky-700/40 bg-sky-950/40 text-sky-300',
    'border-violet-700/40 bg-violet-950/40 text-violet-300',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur">
      <div className="bg-background-card border border-amber-500/30 w-full max-w-lg mx-4 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20">
          <div>
            <h2 className="font-display font-bold text-amber-400 uppercase tracking-wider text-sm">
              Agregar Cohorte Productiva
            </h2>
            <p className="text-text-muted text-[10px] font-mono mt-0.5">
              Ingresa fecha de inicio y fin de productiva — las etapas se calculan automáticamente
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-amber-400 text-lg font-mono px-2">✕</button>
        </div>

        {/* Inputs */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Fecha Ingreso</label>
              <input
                type="text"
                value={ingreso}
                onChange={e => { setIngreso(e.target.value); setSaved(false); setError('') }}
                placeholder="dd/mm/aaaa"
                className={`border font-mono text-sm px-3 py-2 outline-none bg-background transition-colors ${
                  ingreso && !iniValid
                    ? 'border-red-500/50 text-red-400'
                    : iniValid
                    ? 'border-amber-500/50 text-text-primary'
                    : 'border-primary/20 text-text-primary placeholder:text-text-muted/50'
                }`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Fecha Fin Productiva</label>
              <input
                type="text"
                value={fin}
                onChange={e => { setFin(e.target.value); setSaved(false); setError('') }}
                placeholder="dd/mm/aaaa"
                className={`border font-mono text-sm px-3 py-2 outline-none bg-background transition-colors ${
                  fin && !finValid
                    ? 'border-red-500/50 text-red-400'
                    : finValid
                    ? 'border-amber-500/50 text-text-primary'
                    : 'border-primary/20 text-text-primary placeholder:text-text-muted/50'
                }`}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-[11px] font-mono">{error}</p>
          )}

          {/* Preview */}
          {preview && (
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Vista previa de etapas</span>
              {preview.map((e, i) => (
                <div key={e.key} className={`border rounded-sm px-4 py-2.5 ${ETAPA_CLS[i]}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest">{e.label}</span>
                    <span className="text-[11px] font-mono opacity-80">{e.fechasStr}</span>
                  </div>
                  <div className="text-[10px] opacity-60 mt-0.5 font-mono">{e.materia}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-500/20 flex items-center justify-between gap-4">
          <span className="text-[10px] font-mono text-text-muted">
            {saved
              ? <span className="text-amber-400">✓ Cohorte guardada correctamente</span>
              : 'Se guarda en este navegador'}
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
              disabled={!iniValid || !finValid}
              className="px-4 py-2 text-[11px] font-mono uppercase tracking-widest border border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-400 hover:text-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Guardar Cohorte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
