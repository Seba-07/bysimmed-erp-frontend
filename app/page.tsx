'use client'

import { useState, useEffect } from 'react'
import Inventory from './components/Inventory'
import Materials from './components/Materials'
import Components from './components/Components'
import Models from './components/Models'
import Production from './components/Production'
import ProductionPanel from './components/ProductionPanel'
import ServiceWorkerUpdater from './components/ServiceWorkerUpdater'

type Tab = 'inventory' | 'production' | 'production-panel' | 'materials' | 'components' | 'models'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('inventory')

  useEffect(() => {
    // Detectar hash en la URL y cambiar de tab
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Tab
      if (['inventory', 'production', 'production-panel', 'materials', 'components', 'models'].includes(hash)) {
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
      <ServiceWorkerUpdater />
      <h1 className="logo">bySIMMED — ERP</h1>
      <p className="subtitle">Sistema de Gestión de Inventario y Producción</p>

      {/* Navegación por tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📊 Inventario
        </button>
        <button
          className={`tab-button ${activeTab === 'production' ? 'active' : ''}`}
          onClick={() => setActiveTab('production')}
        >
          🏭 Órdenes de Fabricación
        </button>
        <button
          className={`tab-button ${activeTab === 'production-panel' ? 'active' : ''}`}
          onClick={() => setActiveTab('production-panel')}
        >
          📋 Panel de Producción
        </button>
      </div>

      {/* Contenido según tab activo */}
      <div className="tab-content">
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'production' && <Production />}
        {activeTab === 'production-panel' && <ProductionPanel />}
        {activeTab === 'materials' && <Materials />}
        {activeTab === 'components' && <Components />}
        {activeTab === 'models' && <Models />}
      </div>
    </main>
  )
}