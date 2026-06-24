import CampaignCard from './CampaignCard'

const campaigns = [
  {
    id: 'tecnicos',
    title: 'TÉCNICOS EDTH',
    description: 'Gestión de traslados para programas técnicos laborales. Validación de requisitos y seguimiento de casos.',
    icon: '🎓',
    status: 'active'
  },
  {
    id: 'bachiller',
    title: 'BACHILLER KUEPA',
    description: 'Gestión de traslados para programas de bachillerato académico. Control de historial y documentación.',
    icon: '📚',
    status: 'active'
  },
  {
    id: 'future',
    title: 'PRÓXIMAMENTE',
    description: 'Nuevos módulos de gestión en proceso de desarrollo. Acceso restringido hasta su liberación oficial.',
    icon: '🔒',
    status: 'locked'
  }
]

export default function CampaignSelector({ onSelectCampaign }) {
  const handleCampaignClick = (id) => {
    if (onSelectCampaign) onSelectCampaign(id)
  }

  return (
    <div className="scanline min-h-full">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-px bg-primary/50" />
            <span className="text-primary/60 text-[10px] font-mono tracking-[0.4em] uppercase">
              SISTEMA ACTIVO — SELECCIONAR MÓDULO
            </span>
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl text-text-primary uppercase tracking-wider leading-none mb-3">
            MÓDULO DE<br />
            <span className="text-primary">TRASLADOS</span>
          </h1>
          <p className="text-text-secondary text-sm font-mono tracking-wide max-w-xl">
            Selecciona el programa educativo para gestionar los traslados de estudiantes.
            Cada módulo opera de forma independiente.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-primary/20" />
          <span className="text-primary/30 text-[10px] font-mono tracking-widest">
            {campaigns.filter(c => c.status === 'active').length} MÓDULOS DISPONIBLES
          </span>
          <div className="flex-1 h-px bg-primary/20" />
        </div>

        {/* Cards list */}
        <div className="flex flex-col gap-3">
          {campaigns.map((campaign, index) => (
            <CampaignCard
              key={campaign.id}
              index={index}
              title={campaign.title}
              description={campaign.description}
              icon={campaign.icon}
              status={campaign.status}
              onClick={() => handleCampaignClick(campaign.id)}
            />
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-8 flex items-center justify-between text-[10px] font-mono text-text-muted tracking-widest">
          <span>KUEPA EDUCATION SYSTEMS</span>
          <span>VERSIÓN 1.0.0 — BETA</span>
        </div>
      </div>
    </div>
  )
}
