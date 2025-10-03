'use client'

import Link from 'next/link'
import RestockManagement from '../components/RestockManagement'

export default function ReposicionesPage() {
  return (
    <main className="container">
      <div className="page-header">
        <Link href="/" className="back-button">
          ← Volver al Menú
        </Link>
        <h1 className="page-title">📦 Reposiciones</h1>
      </div>

      <RestockManagement />
    </main>
  )
}
