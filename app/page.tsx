'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const [stats, setStats] = useState({
    cotizaciones: 0,
    equiposPostVenta: 0,
    ordenesProduccion: 0,
    stockTotal: 0,
    solicitudesCompra: 0,
    cuentasPorCobrar: 0,
    gastosPendientes: 0,
    saldoBancos: 0
  })

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [
        cotizacionesRes,
        equiposRes,
        produccionRes,
        materialsRes,
        componentsRes,
        modelsRes,
        comprasRes,
        cuentasCobrarRes,
        gastosRes,
        bancariaRes
      ] = await Promise.all([
        fetch(`${API_URL}/api/ventas/cotizaciones`),
        fetch(`${API_URL}/api/post-venta/equipos`),
        fetch(`${API_URL}/api/production/orders`),
        fetch(`${API_URL}/api/inventory/materials`),
        fetch(`${API_URL}/api/inventory/components`),
        fetch(`${API_URL}/api/inventory/models`),
        fetch(`${API_URL}/api/finanzas/compras`),
        fetch(`${API_URL}/api/finanzas/cuentas-por-cobrar`),
        fetch(`${API_URL}/api/finanzas/gastos`),
        fetch(`${API_URL}/api/finanzas/cuentas-bancarias`)
      ])

      const cotizaciones = cotizacionesRes.ok ? await cotizacionesRes.json() : []
      const equipos = equiposRes.ok ? await equiposRes.json() : []
      const ordenes = produccionRes.ok ? await produccionRes.json() : []
      const materials = materialsRes.ok ? await materialsRes.json() : []
      const components = componentsRes.ok ? await componentsRes.json() : []
      const models = modelsRes.ok ? await modelsRes.json() : []
      const compras = comprasRes.ok ? await comprasRes.json() : []
      const cuentasCobrar = cuentasCobrarRes.ok ? await cuentasCobrarRes.json() : []
      const gastos = gastosRes.ok ? await gastosRes.json() : []
      const bancaria = bancariaRes.ok ? await bancariaRes.json() : []

      const stockTotal = materials.reduce((sum: number, m: any) => sum + (m.quantity || 0), 0) +
                        components.reduce((sum: number, c: any) => sum + (c.quantity || 0), 0) +
                        models.reduce((sum: number, m: any) => sum + (m.stock || 0), 0)

      const totalCuentasCobrar = cuentasCobrar.reduce((sum: number, c: any) => sum + (c.saldoPendiente || 0), 0)
      const totalGastosPendientes = gastos.filter((g: any) => g.estado === 'pendiente').reduce((sum: number, g: any) => sum + g.monto, 0)
      const totalSaldoBancos = bancaria.filter((b: any) => b.activa).reduce((sum: number, b: any) => sum + b.saldo, 0)

      setStats({
        cotizaciones: cotizaciones.filter((c: any) => c.estado === 'enviada' || c.estado === 'solicitada').length,
        equiposPostVenta: equipos.length,
        ordenesProduccion: ordenes.filter((o: any) => o.status === 'in_progress' || o.status === 'pending').length,
        stockTotal,
        solicitudesCompra: compras.filter((c: any) => c.estado === 'pendiente').length,
        cuentasPorCobrar: totalCuentasCobrar,
        gastosPendientes: totalGastosPendientes,
        saldoBancos: totalSaldoBancos
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#3b82f6', marginBottom: '0.5rem', fontWeight: 800 }}>
          bySIMMED ERP
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>
          Sistema de Gestión Empresarial Integral
        </p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-label">Cotizaciones Activas</div>
          <div className="stat-value">{stats.cotizaciones}</div>
          <Link href="/ventas/control" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Equipos en Post-Venta</div>
          <div className="stat-value">{stats.equiposPostVenta}</div>
          <Link href="/ventas/post-venta" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Órdenes en Producción</div>
          <div className="stat-value">{stats.ordenesProduccion}</div>
          <Link href="/produccion" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Stock Total Items</div>
          <div className="stat-value">{stats.stockTotal}</div>
          <Link href="/inventario" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>
            Ver Detalle →
          </Link>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '3rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-label">Compras Pendientes</div>
          <div className="stat-value">{stats.solicitudesCompra}</div>
          <Link href="/finanzas/compras" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Por Cobrar</div>
          <div className="stat-value">${stats.cuentasPorCobrar.toLocaleString()}</div>
          <Link href="/finanzas/cuentas" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gastos Pendientes</div>
          <div className="stat-value">${stats.gastosPendientes.toLocaleString()}</div>
          <Link href="/finanzas/gastos" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Saldo Bancos</div>
          <div className="stat-value">${stats.saldoBancos.toLocaleString()}</div>
          <Link href="/finanzas/cuentas" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>
            Ver Detalle →
          </Link>
        </div>
      </div>

      <h2 style={{ color: '#60a5fa', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Acceso Rápido</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <Link href="/ventas/control" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer', height: '100%' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
            <h3 style={{ color: '#3b82f6', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Control de Ventas</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Cotizaciones, OC, facturas y ciclo de venta</p>
          </div>
        </Link>

        <Link href="/ventas/post-venta" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer', height: '100%' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔧</div>
            <h3 style={{ color: '#3b82f6', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Post-Venta</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Clientes, equipos y mantenciones</p>
          </div>
        </Link>

        <Link href="/finanzas/compras" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer', height: '100%' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💰</div>
            <h3 style={{ color: '#3b82f6', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Finanzas</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Compras, gastos, proveedores y cuentas</p>
          </div>
        </Link>

        <Link href="/produccion" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer', height: '100%' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏭</div>
            <h3 style={{ color: '#3b82f6', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Producción</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Órdenes, monitoreo y control</p>
          </div>
        </Link>

        <Link href="/inventario" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer', height: '100%' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
            <h3 style={{ color: '#3b82f6', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Inventario</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Materiales, componentes y modelos</p>
          </div>
        </Link>

        <Link href="/reposiciones" style={{ textDecoration: 'none' }}>
          <div className="stat-card" style={{ cursor: 'pointer', height: '100%' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔄</div>
            <h3 style={{ color: '#3b82f6', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Reposiciones</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Solicitudes de reabastecimiento</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
