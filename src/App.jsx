import { useState } from 'react'
import Layout from './components/layout/Layout'
import CampaignSelector from './components/campaigns/CampaignSelector'
import TecnicosMenu from './components/tecnicos/TecnicosMenu'
import AnclaViewer from './components/anclas/AnclaViewer'
import ValidacionView from './components/traslados/ValidacionView'
import ReporteView from './components/traslados/ReporteView'
import DisponibilidadView from './components/traslados/DisponibilidadView'

export default function App() {
  const [view, setView] = useState('home') // 'home' | 'tecnicos' | 'anclas' | 'validacion' | 'reporte' | 'disponibilidad'

  return (
    <Layout>
      {view === 'home' && (
        <CampaignSelector onSelectCampaign={(id) => {
          if (id === 'tecnicos') setView('tecnicos')
        }} />
      )}
      {view === 'tecnicos' && (
        <TecnicosMenu
          onNavigate={setView}
          onBack={() => setView('home')}
        />
      )}
      {view === 'anclas' && (
        <AnclaViewer onBack={() => setView('tecnicos')} />
      )}
      {view === 'validacion' && (
        <ValidacionView onBack={() => setView('tecnicos')} />
      )}
      {view === 'reporte' && (
        <ReporteView onBack={() => setView('tecnicos')} />
      )}
      {view === 'disponibilidad' && (
        <DisponibilidadView onBack={() => setView('tecnicos')} />
      )}
    </Layout>
  )
}
