import { useState } from 'react'
import { PROGRAMS } from '../../data/programs'
import { getExtendedCalendar } from '../../data/calendar'
import AnclaTable from './AnclaTable'
import AddYearModal from './AddYearModal'

const PROGRAM_TAB_ACTIVE = {
  cyan:   'border-b-2 border-primary text-primary',
  orange: 'border-b-2 border-secondary text-secondary',
  green:  'border-b-2 border-status-active text-status-active',
  purple: 'border-b-2 border-purple-400 text-purple-400',
}

export default function AnclaViewer({ onBack }) {
  const [activeProgram, setActiveProgram] = useState(PROGRAMS[0])
  const [showModal, setShowModal]         = useState(false)
  const [calendar, setCalendar]           = useState(() => getExtendedCalendar())

  const handleYearSaved = () => {
    // Recarga el calendario desde localStorage al guardar un año nuevo
    setCalendar(getExtendedCalendar())
  }

  return (
    <div className="max-w-full mx-auto px-6 py-8">

      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-primary transition-colors"
          >
            ‹ VOLVER
          </button>
          <span className="text-primary/20 font-mono">|</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted hover:text-primary cursor-pointer transition-colors" onClick={onBack}>TÉCNICOS EDTH</span>
          <span className="text-primary/20 font-mono">›</span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-primary">MALLA CURRICULAR</span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-primary/30 text-primary/70 hover:border-primary hover:text-primary transition-colors"
        >
          + Agregar Fechas de Año
        </button>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl text-text-primary uppercase tracking-wider mb-1">
          Malla <span className="text-primary">Curricular</span>
        </h1>
        <p className="text-text-muted text-xs font-mono">
          Distribución de materias por período de ingreso — Programas Técnicos Laborales
        </p>
      </div>

      {/* Program tabs */}
      <div className="flex border-b border-primary/10 mb-6 gap-0 overflow-x-auto">
        {PROGRAMS.map((prog) => (
          <button
            key={prog.id}
            onClick={() => setActiveProgram(prog)}
            className={`px-5 py-3 text-[11px] font-mono tracking-widest uppercase transition-all whitespace-nowrap
              ${activeProgram.id === prog.id
                ? PROGRAM_TAB_ACTIVE[prog.color]
                : 'text-text-muted hover:text-text-secondary border-b-2 border-transparent'
              }`}
          >
            {prog.id} — {prog.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <AnclaTable key={activeProgram.id} program={activeProgram} calendar={calendar} />

      {/* Modal */}
      {showModal && (
        <AddYearModal
          onClose={() => setShowModal(false)}
          onSaved={handleYearSaved}
        />
      )}
    </div>
  )
}
