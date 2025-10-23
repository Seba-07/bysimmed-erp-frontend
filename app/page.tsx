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
      <div className="page-header">
        <h1 className="page-title">
          bySIMMED ERP
        </h1>
        <p className="page-subtitle">
          Sistema de Gestión Empresarial Integral
        </p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-label">Cotizaciones Activas</div>
          <div className="stat-value">{stats.cotizaciones}</div>
          <Link href="/ventas/control" className="stat-link">
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Equipos en Post-Venta</div>
          <div className="stat-value">{stats.equiposPostVenta}</div>
          <Link href="/ventas/post-venta" className="stat-link">
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Órdenes en Producción</div>
          <div className="stat-value">{stats.ordenesProduccion}</div>
          <Link href="/produccion" className="stat-link">
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Stock Total Items</div>
          <div className="stat-value">{stats.stockTotal}</div>
          <Link href="/inventario" className="stat-link">
            Ver Detalle →
          </Link>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '3rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-label">Compras Pendientes</div>
          <div className="stat-value">{stats.solicitudesCompra}</div>
          <Link href="/finanzas/compras" className="stat-link">
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Por Cobrar</div>
          <div className="stat-value">${stats.cuentasPorCobrar.toLocaleString()}</div>
          <Link href="/finanzas/cuentas" className="stat-link">
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gastos Pendientes</div>
          <div className="stat-value">${stats.gastosPendientes.toLocaleString()}</div>
          <Link href="/finanzas/gastos" className="stat-link">
            Ver Detalle →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Saldo Bancos</div>
          <div className="stat-value">${stats.saldoBancos.toLocaleString()}</div>
          <Link href="/finanzas/cuentas" className="stat-link">
            Ver Detalle →
          </Link>
        </div>
      </div>

      <h2 className="section-title">Acceso Rápido</h2>

      <div className="quick-access-grid">
        <Link href="/ventas/control" className="quick-link">
          <div className="quick-access-card">
            <div className="quick-icon">📊</div>
            <h3 className="quick-title">Control de Ventas</h3>
            <p className="quick-description">Cotizaciones, OC, facturas y ciclo de venta</p>
          </div>
        </Link>

        <Link href="/ventas/post-venta" className="quick-link">
          <div className="quick-access-card">
            <div className="quick-icon">🔧</div>
            <h3 className="quick-title">Post-Venta</h3>
            <p className="quick-description">Clientes, equipos y mantenciones</p>
          </div>
        </Link>

        <Link href="/finanzas/compras" className="quick-link">
          <div className="quick-access-card">
            <div className="quick-icon">💰</div>
            <h3 className="quick-title">Finanzas</h3>
            <p className="quick-description">Compras, gastos, proveedores y cuentas</p>
          </div>
        </Link>

        <Link href="/produccion" className="quick-link">
          <div className="quick-access-card">
            <div className="quick-icon">🏭</div>
            <h3 className="quick-title">Producción</h3>
            <p className="quick-description">Órdenes, monitoreo y control</p>
          </div>
        </Link>

        <Link href="/inventario" className="quick-link">
          <div className="quick-access-card">
            <div className="quick-icon">📦</div>
            <h3 className="quick-title">Inventario</h3>
            <p className="quick-description">Materiales, componentes y modelos</p>
          </div>
        </Link>

        <Link href="/reposiciones" className="quick-link">
          <div className="quick-access-card">
            <div className="quick-icon">🔄</div>
            <h3 className="quick-title">Reposiciones</h3>
            <p className="quick-description">Solicitudes de reabastecimiento</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
