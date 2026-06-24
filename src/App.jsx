import { useState } from 'react'
import Layout from './components/layout/Layout'
import CampaignSelector from './components/campaigns/CampaignSelector'
import TecnicosMenu from './components/tecnicos/TecnicosMenu'
import AnclaViewer from './components/anclas/AnclaViewer'
import ValidacionView from './components/traslados/ValidacionView'
import ReporteView from './components/traslados/ReporteView'
import DisponibilidadView from './components/traslados/DisponibilidadView'
import ValidacionProductivaView from './components/traslados/ValidacionProductivaView'
import MallaProductivaView from './components/productiva/MallaProductivaView'
import WorldboxProductivaView from './components/productiva/WorldboxProductivaView'
import BachillerMenu from './components/bachiller/BachillerMenu'
import MallaBachView from './components/bachiller/MallaBachView'
import ValidacionBachView from './components/bachiller/ValidacionBachView'
import ReporteBachView from './components/bachiller/ReporteBachView'

export default function App() {
  const [view, setView] = useState('home') // 'home' | 'tecnicos' | ... | 'bachiller' | 'malla-bach' | 'validacion-bach'

  return (
    <Layout>
      {view === 'home' && (
        <CampaignSelector onSelectCampaign={(id) => {
          if (id === 'tecnicos')  setView('tecnicos')
          if (id === 'bachiller') setView('bachiller')
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
      {view === 'validacion-productiva' && (
        <ValidacionProductivaView onBack={() => setView('tecnicos')} />
      )}
      {view === 'malla-productiva' && (
        <MallaProductivaView onBack={() => setView('tecnicos')} />
      )}
      {view === 'worldbox-productiva' && (
        <WorldboxProductivaView onBack={() => setView('tecnicos')} />
      )}
      {view === 'bachiller' && (
        <BachillerMenu
          onNavigate={setView}
          onBack={() => setView('home')}
        />
      )}
      {view === 'malla-bach' && (
        <MallaBachView onBack={() => setView('bachiller')} />
      )}
      {view === 'validacion-bach' && (
        <ValidacionBachView onBack={() => setView('bachiller')} />
      )}
      {view === 'reporte-bach' && (
        <ReporteBachView onBack={() => setView('bachiller')} />
      )}
    </Layout>
  )
}
