'use client'

import { useState } from 'react'
import Link from 'next/link'
import Inventory from '../components/Inventory'
import Materials from '../components/Materials'
import Components from '../components/Components'
import Models from '../components/Models'

type SubTab = 'inventory' | 'materials' | 'components' | 'models'

export default function InventarioPage() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('inventory')

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
      {activeSubTab === 'materials' && <Materials onCreated={() => setActiveSubTab('inventory')} />}
      {activeSubTab === 'components' && <Components onCreated={() => setActiveSubTab('inventory')} />}
      {activeSubTab === 'models' && <Models onCreated={() => setActiveSubTab('inventory')} />}
    </main>
  )
}
