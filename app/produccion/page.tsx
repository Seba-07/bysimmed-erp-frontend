'use client'

import Link from 'next/link'
import ProductionPanel from '../components/ProductionPanel'

export default function ProduccionPage() {
  return (
    <main className="container">
      <div className="page-header">
        <Link href="/" className="back-button">
          ← Volver al Menú
        </Link>
        <h1 className="page-title">📋 Panel de Producción</h1>
      </div>

      <ProductionPanel />
    </main>
  )
}
