'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Inventory from '../components/Inventory'
import Materials from '../components/Materials'
import Components from '../components/Components'
import Models from '../components/Models'

type SubTab = 'inventory' | 'materials' | 'components' | 'models'

export default function InventarioPage() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('inventory')

  useEffect(() => {
    // Detectar hash en la URL y cambiar de sub-tab
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as SubTab
      if (['inventory', 'materials', 'components', 'models'].includes(hash)) {
        setActiveSubTab(hash)
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
      <div className="page-header">
        <Link href="/" className="back-button">
          ← Volver al Menú
        </Link>
        <h1 className="page-title">📊 Inventario</h1>
      </div>

      {activeSubTab === 'inventory' && (
        <Inventory onNavigateToRestock={() => window.location.href = '/reposiciones'} />
      )}
      {activeSubTab === 'materials' && <Materials onCreated={() => { setActiveSubTab('inventory'); window.location.hash = '' }} />}
      {activeSubTab === 'components' && <Components onCreated={() => { setActiveSubTab('inventory'); window.location.hash = '' }} />}
      {activeSubTab === 'models' && <Models onCreated={() => { setActiveSubTab('inventory'); window.location.hash = '' }} />}
    </main>
  )
}
