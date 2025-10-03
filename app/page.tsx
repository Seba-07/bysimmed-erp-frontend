'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="container">
      <h1 className="logo">bySIMMED — ERP</h1>
      <p className="subtitle">Sistema de Gestión de Inventario y Producción</p>

      <div className="main-menu">
        <Link href="/inventario" className="menu-card">
          <span className="menu-icon">📊</span>
          <h2>Inventario</h2>
          <p>Gestión de materiales, componentes y modelos</p>
        </Link>

        <Link href="/reposiciones" className="menu-card">
          <span className="menu-icon">📦</span>
          <h2>Reposiciones</h2>
          <p>Solicitudes de reabastecimiento de inventario</p>
        </Link>

        <Link href="/ordenes" className="menu-card">
          <span className="menu-icon">🏭</span>
          <h2>Órdenes de Fabricación</h2>
          <p>Gestión de órdenes de producción</p>
        </Link>

        <Link href="/produccion" className="menu-card">
          <span className="menu-icon">📋</span>
          <h2>Panel de Producción</h2>
          <p>Monitoreo y control de producción</p>
        </Link>
      </div>
    </main>
  )
}