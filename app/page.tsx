'use client'

import { useState, useEffect } from 'react'
import Inventory from './components/Inventory'
import Materials from './components/Materials'
import Components from './components/Components'
import Models from './components/Models'

type Tab = 'inventory' | 'materials' | 'components' | 'models'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('inventory')

  useEffect(() => {
    // Detectar hash en la URL y cambiar de tab
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Tab
      if (['inventory', 'materials', 'components', 'models'].includes(hash)) {
        setActiveTab(hash)
      }
    }

    // Ejecutar al cargar
    handleHashChange()

    // Escuchar cambios en el hash
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  return (
    <main className="container">
      <h1 className="logo">bySIMMED — ERP</h1>
      <p className="subtitle">Sistema de Gestión de Inventario</p>
      <p className="dev-badge">🚧 Entorno de Desarrollo</p>

      {/* Navegación por tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📊 Inventario
        </button>
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
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'materials' && <Materials />}
        {activeTab === 'components' && <Components />}
        {activeTab === 'models' && <Models />}
      </div>
    </main>
  )
}