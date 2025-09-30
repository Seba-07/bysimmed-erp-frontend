'use client'

import { useState } from 'react'
import Materials from './components/Materials'
import Components from './components/Components'
import Models from './components/Models'

type Tab = 'materials' | 'components' | 'models'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('materials')

  return (
    <main className="container">
      <h1 className="logo">bySIMMED — ERP</h1>
      <p className="subtitle">Sistema de Gestión de Inventario</p>
      <p className="dev-badge">🚧 Entorno de Desarrollo</p>

      {/* Navegación por tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          📦 Materiales
        </button>
        <button
          className={`tab-button ${activeTab === 'components' ? 'active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          🔧 Componentes
        </button>
        <button
          className={`tab-button ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          🏭 Modelos
        </button>
      </div>

      {/* Contenido según tab activo */}
      <div className="tab-content">
        {activeTab === 'materials' && <Materials />}
        {activeTab === 'components' && <Components />}
        {activeTab === 'models' && <Models />}
      </div>
    </main>
  )
}