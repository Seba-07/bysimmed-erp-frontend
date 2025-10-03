'use client'

import Link from 'next/link'
import Production from '../components/Production'

export default function OrdenesPage() {
  return (
    <main className="container">
      <div className="page-header">
        <Link href="/" className="back-button">
          ← Volver al Menú
        </Link>
        <h1 className="page-title">🏭 Órdenes de Fabricación</h1>
      </div>

      <Production />
    </main>
  )
}
