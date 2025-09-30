'use client'

import { useState, useEffect } from 'react'

interface ProductionOrder {
  _id: string
  itemId: string
  itemType: 'Component' | 'Model'
  itemName: string
  cantidad: number
  fechaLimite: string
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado'
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  notas?: string
  fechaCreacion: string
  fechaActualizacion: string
  fechaCompletado?: string
}

interface OrderResponse {
  success: boolean
  count?: number
  data?: ProductionOrder[]
  message?: string
}

export default function Planning() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterEstado, setFilterEstado] = useState<string>('')
  const [filterPrioridad, setFilterPrioridad] = useState<string>('')

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadOrders()
  }, [filterEstado, filterPrioridad])

  const loadOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filterEstado) params.append('estado', filterEstado)
      if (filterPrioridad) params.append('prioridad', filterPrioridad)

      const res = await fetch(`${API_URL}/api/production/orders?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: OrderResponse = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando órdenes')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newEstado: ProductionOrder['estado']) => {
    try {
      const res = await fetch(`${API_URL}/api/production/orders/${orderId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando estado')
    }
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta orden?')) return

    try {
      const res = await fetch(`${API_URL}/api/production/orders/${orderId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando orden')
    }
  }

  const getEstadoBadge = (estado: ProductionOrder['estado']) => {
    const badges = {
      pendiente: { emoji: '⏳', class: 'badge-pending' },
      en_proceso: { emoji: '⚙️', class: 'badge-in-progress' },
      completado: { emoji: '✅', class: 'badge-completed' },
      cancelado: { emoji: '❌', class: 'badge-cancelled' }
    }
    return badges[estado]
  }

  const getPrioridadBadge = (prioridad: ProductionOrder['prioridad']) => {
    const badges = {
      baja: { emoji: '🟢', class: 'priority-low' },
      media: { emoji: '🟡', class: 'priority-medium' },
      alta: { emoji: '🟠', class: 'priority-high' },
      urgente: { emoji: '🔴', class: 'priority-urgent' }
    }
    return badges[prioridad]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (fechaLimite: string, estado: ProductionOrder['estado']) => {
    if (estado === 'completado' || estado === 'cancelado') return false
    return new Date(fechaLimite) < new Date()
  }

  return (
    <div className="section">
      <div className="planning-header">
        <h2>📋 Planificación de Producción</h2>
        <div className="filters">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">⏳ Pendiente</option>
            <option value="en_proceso">⚙️ En Proceso</option>
            <option value="completado">✅ Completado</option>
            <option value="cancelado">❌ Cancelado</option>
          </select>

          <select
            value={filterPrioridad}
            onChange={(e) => setFilterPrioridad(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las prioridades</option>
            <option value="baja">🟢 Baja</option>
            <option value="media">🟡 Media</option>
            <option value="alta">🟠 Alta</option>
            <option value="urgente">🔴 Urgente</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="response error">
          <pre>Error: {error}</pre>
        </div>
      )}

      {loading ? (
        <p>Cargando órdenes...</p>
      ) : orders.length > 0 ? (
        <div className="orders-list">
          {orders.map((order) => {
            const estadoBadge = getEstadoBadge(order.estado)
            const prioridadBadge = getPrioridadBadge(order.prioridad)
            const overdue = isOverdue(order.fechaLimite, order.estado)

            return (
              <div key={order._id} className={`order-card ${overdue ? 'overdue' : ''}`}>
                <div className="order-header">
                  <div className="order-title">
                    <h3>{order.itemName}</h3>
                    <span className="order-type-badge">
                      {order.itemType === 'Component' ? '🔧 Componente' : '🏭 Modelo'}
                    </span>
                  </div>
                  <div className="order-actions">
                    <button
                      onClick={() => deleteOrder(order._id)}
                      className="delete-btn"
                      title="Eliminar orden"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="order-details">
                  <div className="detail-row">
                    <span className="detail-label">Cantidad:</span>
                    <span className="detail-value">{order.cantidad} unidades</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Fecha límite:</span>
                    <span className={`detail-value ${overdue ? 'overdue-text' : ''}`}>
                      {formatDate(order.fechaLimite)}
                      {overdue && ' ⚠️ Vencida'}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Estado:</span>
                    <select
                      value={order.estado}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value as ProductionOrder['estado'])}
                      className={`status-select ${estadoBadge.class}`}
                    >
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="en_proceso">⚙️ En Proceso</option>
                      <option value="completado">✅ Completado</option>
                      <option value="cancelado">❌ Cancelado</option>
                    </select>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Prioridad:</span>
                    <span className={`priority-badge ${prioridadBadge.class}`}>
                      {prioridadBadge.emoji} {order.prioridad.charAt(0).toUpperCase() + order.prioridad.slice(1)}
                    </span>
                  </div>

                  {order.notas && (
                    <div className="detail-row notes">
                      <span className="detail-label">Notas:</span>
                      <span className="detail-value">{order.notas}</span>
                    </div>
                  )}

                  <div className="detail-row date-info">
                    <span className="detail-label">Creada:</span>
                    <span className="detail-value">{formatDate(order.fechaCreacion)}</span>
                  </div>

                  {order.fechaCompletado && (
                    <div className="detail-row date-info">
                      <span className="detail-label">Completada:</span>
                      <span className="detail-value">{formatDate(order.fechaCompletado)}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>No hay órdenes de fabricación</p>
          <p className="hint">Las órdenes se crean desde el inventario</p>
        </div>
      )}
    </div>
  )
}