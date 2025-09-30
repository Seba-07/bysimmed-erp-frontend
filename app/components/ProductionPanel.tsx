'use client'

import { useState, useEffect } from 'react'

interface Component {
  _id: string
  nombre: string
  materiales?: Array<{
    materialId: {
      _id: string
      nombre: string
      unidad: string
    }
    cantidad: number
  }>
}

interface OrderProduct {
  itemId: string
  itemType: 'Component' | 'Model'
  itemName: string
  cantidad: number
  componentesSeleccionados?: string[]
}

interface ProductionOrder {
  _id: string
  numeroOrden: string
  cliente: string
  productos: OrderProduct[]
  fechaLimite: string
  estado: 'activa' | 'en_proceso' | 'completada' | 'cancelada'
  notas?: string
  fechaCreacion: string
}

export default function ProductionPanel() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadActiveOrders()
    loadComponents()
  }, [])

  const loadActiveOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      // Cargar solo órdenes activas y en proceso
      const res = await fetch(`${API_URL}/api/production/orders`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        // Filtrar y ordenar por fecha límite (más urgente primero)
        const activeOrders = data.data
          .filter((order: ProductionOrder) =>
            order.estado === 'activa' || order.estado === 'en_proceso'
          )
          .sort((a: ProductionOrder, b: ProductionOrder) =>
            new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime()
          )
        setOrders(activeOrders)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando órdenes')
    } finally {
      setLoading(false)
    }
  }

  const loadComponents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventory/components`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setComponents(data.data)
      }
    } catch (err) {
      console.error('Error cargando componentes:', err)
    }
  }

  const getPriority = (fechaLimite: string) => {
    const now = new Date()
    const deadline = new Date(fechaLimite)
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) return { label: 'URGENTE - VENCIDA', class: 'priority-critical', emoji: '🔴' }
    if (daysUntil <= 2) return { label: 'MUY URGENTE', class: 'priority-very-high', emoji: '🔴' }
    if (daysUntil <= 5) return { label: 'URGENTE', class: 'priority-high', emoji: '🟠' }
    if (daysUntil <= 10) return { label: 'MEDIA', class: 'priority-medium', emoji: '🟡' }
    return { label: 'BAJA', class: 'priority-low', emoji: '🟢' }
  }

  const getRemainingTime = (fechaLimite: string) => {
    const now = new Date()
    const deadline = new Date(fechaLimite)
    const diff = deadline.getTime() - now.getTime()

    if (diff < 0) return '¡VENCIDA!'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  const getComponentDetails = (componentId: string) => {
    return components.find(c => c._id === componentId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="section">
      <div className="production-panel-header">
        <h2>📋 Panel de Producción</h2>
        <p className="subtitle">Órdenes ordenadas por prioridad</p>
      </div>

      {error && (
        <div className="response error">
          <pre>Error: {error}</pre>
        </div>
      )}

      {loading ? (
        <p>Cargando órdenes...</p>
      ) : orders.length > 0 ? (
        <div className="production-cards-grid">
          {orders.map((order) => {
            const priority = getPriority(order.fechaLimite)
            const timeRemaining = getRemainingTime(order.fechaLimite)

            return (
              <div key={order._id} className={`production-card ${priority.class}`}>
                {/* Header de la tarjeta */}
                <div className="production-card-header">
                  <div className="order-info">
                    <h3>{order.numeroOrden}</h3>
                    <span className="cliente-name">👤 {order.cliente}</span>
                  </div>
                  <div className="priority-badge">
                    <span className="priority-emoji">{priority.emoji}</span>
                    <span className="priority-label">{priority.label}</span>
                  </div>
                </div>

                {/* Tiempo restante */}
                <div className="time-remaining-section">
                  <div className="time-box">
                    <span className="time-label">⏰ Tiempo restante:</span>
                    <span className="time-value">{timeRemaining}</span>
                  </div>
                  <div className="deadline-box">
                    <span className="deadline-label">📅 Entrega:</span>
                    <span className="deadline-value">{formatDate(order.fechaLimite)}</span>
                  </div>
                </div>

                {/* Productos a fabricar */}
                <div className="products-to-make">
                  <h4>🏭 A Fabricar:</h4>
                  {order.productos.map((prod, idx) => (
                    <div key={idx} className="product-card">
                      <div className="product-header">
                        <span className="product-name">
                          {prod.itemType === 'Component' ? '🔧' : '🏭'} {prod.itemName}
                        </span>
                        <span className="product-qty">x{prod.cantidad}</span>
                      </div>

                      {/* Componentes necesarios */}
                      {prod.componentesSeleccionados && prod.componentesSeleccionados.length > 0 && (
                        <div className="components-needed">
                          <p className="section-title">📦 Componentes:</p>
                          {prod.componentesSeleccionados.map((compId: string, compIdx: number) => {
                            const component = getComponentDetails(compId)
                            return (
                              <div key={compIdx} className="component-detail">
                                <span className="component-name">• {component?.nombre || 'Desconocido'}</span>

                                {/* Materiales del componente */}
                                {component?.materiales && component.materiales.length > 0 && (
                                  <div className="materials-list">
                                    <p className="materials-label">Materiales:</p>
                                    {component.materiales.map((mat, matIdx) => (
                                      <div key={matIdx} className="material-item">
                                        - {mat.materialId.nombre}: {mat.cantidad} {mat.materialId.unidad}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Si es componente directo, mostrar sus materiales */}
                      {prod.itemType === 'Component' && (
                        (() => {
                          const component = getComponentDetails(prod.itemId)
                          return component?.materiales && component.materiales.length > 0 ? (
                            <div className="materials-needed">
                              <p className="section-title">🧱 Materiales:</p>
                              {component.materiales.map((mat, matIdx) => (
                                <div key={matIdx} className="material-item">
                                  • {mat.materialId.nombre}: {mat.cantidad * prod.cantidad} {mat.materialId.unidad}
                                </div>
                              ))}
                            </div>
                          ) : null
                        })()
                      )}
                    </div>
                  ))}
                </div>

                {/* Notas */}
                {order.notas && (
                  <div className="order-notes">
                    <p><strong>📝 Notas:</strong> {order.notas}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>✅ No hay órdenes pendientes</p>
          <p className="hint">Todas las órdenes están completadas o canceladas</p>
        </div>
      )}
    </div>
  )
}
