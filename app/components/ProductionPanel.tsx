'use client'

import { useState, useEffect, useRef } from 'react'

interface Material {
  materialId: {
    _id: string
    nombre: string
    unidad: string
  }
  cantidad: number
}

interface Component {
  _id: string
  nombre: string
  materiales?: Material[]
}

interface ComponentTimer {
  componentId: string
  componentName: string
  status: 'pending' | 'in_progress' | 'paused' | 'completed'
  elapsedTime: number
  startTime: number | null
}

interface ModelTimer {
  orderId: string
  productId: string
  status: 'pending' | 'in_progress' | 'paused' | 'completed'
  elapsedTime: number
  startTime: number | null
  components: ComponentTimer[]
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
  const [timers, setTimers] = useState<Record<string, ModelTimer>>({})
  const [showComponentsModal, setShowComponentsModal] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadActiveOrders()
    loadComponents()
  }, [])

  // Update timers every second
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(key => {
          const timer = updated[key]

          // Update model timer
          if (timer.status === 'in_progress' && timer.startTime) {
            timer.elapsedTime = Math.floor((Date.now() - timer.startTime) / 1000)
          }

          // Update component timers
          timer.components.forEach(comp => {
            if (comp.status === 'in_progress' && comp.startTime) {
              comp.elapsedTime = Math.floor((Date.now() - comp.startTime) / 1000)
            }
          })
        })
        return updated
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const loadActiveOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/production/orders`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
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

    if (daysUntil < 0) return { label: 'URGENTE', class: 'priority-critical', emoji: '🔴' }
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const getComponentDetails = (componentId: string) => {
    return components.find(c => c._id === componentId)
  }

  const getTimerKey = (orderId: string, productId: string) => `${orderId}-${productId}`

  const updateOrderStatus = async (orderId: string, estado: 'en_proceso' | 'completada') => {
    try {
      const res = await fetch(`${API_URL}/api/production/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.success) {
        // Update local state
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, estado } : o))
      }
    } catch (err) {
      console.error('Error actualizando estado de orden:', err)
      alert(`Error al actualizar estado: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    }
  }

  const startModel = async (order: ProductionOrder, product: OrderProduct) => {
    const timerKey = getTimerKey(order._id, product.itemId)

    // Initialize timer if doesn't exist
    if (!timers[timerKey]) {
      const componentTimers: ComponentTimer[] = (product.componentesSeleccionados || []).map(compId => {
        const comp = getComponentDetails(compId)
        return {
          componentId: compId,
          componentName: comp?.nombre || 'Desconocido',
          status: 'pending',
          elapsedTime: 0,
          startTime: null
        }
      })

      setTimers(prev => ({
        ...prev,
        [timerKey]: {
          orderId: order._id,
          productId: product.itemId,
          status: 'in_progress',
          elapsedTime: 0,
          startTime: Date.now(),
          components: componentTimers
        }
      }))

      // Update order status to 'en_proceso' if it's still 'activa'
      if (order.estado === 'activa') {
        await updateOrderStatus(order._id, 'en_proceso')
      }

      // Show components modal
      setShowComponentsModal(timerKey)
    } else {
      // Resume timer
      setTimers(prev => ({
        ...prev,
        [timerKey]: {
          ...prev[timerKey],
          status: 'in_progress',
          startTime: Date.now() - (prev[timerKey].elapsedTime * 1000)
        }
      }))
      setShowComponentsModal(timerKey)
    }
  }

  const pauseModel = (orderId: string, productId: string) => {
    const timerKey = getTimerKey(orderId, productId)
    setTimers(prev => ({
      ...prev,
      [timerKey]: {
        ...prev[timerKey],
        status: 'paused',
        startTime: null
      }
    }))
  }

  const resetModel = (orderId: string, productId: string) => {
    if (!confirm('¿Seguro que quieres reiniciar el cronómetro? Se perderá todo el progreso.')) return

    const timerKey = getTimerKey(orderId, productId)
    const timer = timers[timerKey]

    setTimers(prev => ({
      ...prev,
      [timerKey]: {
        ...timer,
        status: 'pending',
        elapsedTime: 0,
        startTime: null,
        components: timer.components.map(c => ({
          ...c,
          status: 'pending',
          elapsedTime: 0,
          startTime: null
        }))
      }
    }))
  }

  const allProductsCompletedInOrder = (orderId: string, orderProducts: OrderProduct[]) => {
    return orderProducts.every(prod => {
      const timerKey = getTimerKey(orderId, prod.itemId)
      const timer = timers[timerKey]
      return timer && timer.status === 'completed'
    })
  }

  const completeModel = async (orderId: string, productId: string) => {
    const timerKey = getTimerKey(orderId, productId)
    setTimers(prev => ({
      ...prev,
      [timerKey]: {
        ...prev[timerKey],
        status: 'completed',
        startTime: null
      }
    }))
    setShowComponentsModal(null)

    // Check if all products in the order are completed
    const order = orders.find(o => o._id === orderId)
    if (order) {
      // Need to check with updated timers state
      setTimeout(() => {
        const allCompleted = allProductsCompletedInOrder(orderId, order.productos)
        if (allCompleted) {
          if (confirm(`✅ Todos los productos de la orden ${order.numeroOrden} han sido fabricados.\n\n¿Confirmar que la orden está completada?`)) {
            updateOrderStatus(orderId, 'completada')
            // Remove order from view
            setOrders(prev => prev.filter(o => o._id !== orderId))
          }
        }
      }, 100)
    }
  }

  const startComponent = (orderId: string, productId: string, componentId: string) => {
    const timerKey = getTimerKey(orderId, productId)
    setTimers(prev => {
      const timer = prev[timerKey]
      return {
        ...prev,
        [timerKey]: {
          ...timer,
          components: timer.components.map(c =>
            c.componentId === componentId
              ? { ...c, status: 'in_progress', startTime: Date.now() - (c.elapsedTime * 1000) }
              : c
          )
        }
      }
    })
  }

  const pauseComponent = (orderId: string, productId: string, componentId: string) => {
    const timerKey = getTimerKey(orderId, productId)
    setTimers(prev => {
      const timer = prev[timerKey]
      return {
        ...prev,
        [timerKey]: {
          ...timer,
          components: timer.components.map(c =>
            c.componentId === componentId
              ? { ...c, status: 'paused', startTime: null }
              : c
          )
        }
      }
    })
  }

  const resetComponent = (orderId: string, productId: string, componentId: string) => {
    if (!confirm('¿Reiniciar este componente?')) return

    const timerKey = getTimerKey(orderId, productId)
    setTimers(prev => {
      const timer = prev[timerKey]
      return {
        ...prev,
        [timerKey]: {
          ...timer,
          components: timer.components.map(c =>
            c.componentId === componentId
              ? { ...c, status: 'pending', elapsedTime: 0, startTime: null }
              : c
          )
        }
      }
    })
  }

  const completeComponent = (orderId: string, productId: string, componentId: string) => {
    const timerKey = getTimerKey(orderId, productId)
    setTimers(prev => {
      const timer = prev[timerKey]
      return {
        ...prev,
        [timerKey]: {
          ...timer,
          components: timer.components.map(c =>
            c.componentId === componentId
              ? { ...c, status: 'completed', startTime: null }
              : c
          )
        }
      }
    })
  }

  const allComponentsCompleted = (orderId: string, productId: string) => {
    const timerKey = getTimerKey(orderId, productId)
    const timer = timers[timerKey]
    if (!timer) return false
    return timer.components.every(c => c.status === 'completed')
  }

  return (
    <div className="section">
      <div className="production-panel-header">
        <h2>📋 Panel de Producción</h2>
        <p className="subtitle">Órdenes priorizadas por fecha de entrega</p>
      </div>

      {error && (
        <div className="response error">
          <pre>Error: {error}</pre>
        </div>
      )}

      {loading ? (
        <p>Cargando órdenes...</p>
      ) : orders.length > 0 ? (
        <div className="production-cards-grid-compact">
          {orders.map((order) => {
            const priority = getPriority(order.fechaLimite)
            const timeRemaining = getRemainingTime(order.fechaLimite)

            return (
              <div key={order._id} className={`production-card-compact ${priority.class}`}>
                {/* Header compacto */}
                <div className="compact-header">
                  <div className="order-info-compact">
                    <h4>{order.numeroOrden}</h4>
                    <span className="cliente-compact">👤 {order.cliente}</span>
                  </div>
                  <div className="priority-badge-compact">
                    {priority.emoji} {priority.label}
                  </div>
                </div>

                {/* Info de tiempo */}
                <div className="time-info-compact">
                  <span className="time-remaining">⏰ {timeRemaining}</span>
                  <span className="deadline">📅 {new Date(order.fechaLimite).toLocaleDateString('es-CL')}</span>
                </div>

                {/* Productos */}
                <div className="products-compact">
                  {order.productos.map((prod, idx) => {
                    const timerKey = getTimerKey(order._id, prod.itemId)
                    const timer = timers[timerKey]

                    return (
                      <div key={idx} className="product-item-compact">
                        <div className="product-info-line">
                          <span className="product-name-compact">
                            {prod.itemType === 'Component' ? '🔧' : '🏭'} {prod.itemName} x{prod.cantidad}
                          </span>
                          {timer && (
                            <span className="timer-display">{formatTime(timer.elapsedTime)}</span>
                          )}
                        </div>

                        {/* Production controls */}
                        <div className="production-controls">
                          {!timer || timer.status === 'pending' ? (
                            <button
                              className="control-btn start-btn"
                              onClick={() => startModel(order, prod)}
                              title="Iniciar producción"
                            >
                              ▶️ Iniciar
                            </button>
                          ) : timer.status === 'in_progress' ? (
                            <button
                              className="control-btn pause-btn"
                              onClick={() => pauseModel(order._id, prod.itemId)}
                              title="Pausar"
                            >
                              ⏸️ Pausar
                            </button>
                          ) : timer.status === 'paused' ? (
                            <button
                              className="control-btn resume-btn"
                              onClick={() => startModel(order, prod)}
                              title="Reanudar"
                            >
                              ▶️ Reanudar
                            </button>
                          ) : null}

                          {timer && timer.status !== 'completed' && (
                            <>
                              <button
                                className="control-btn reset-btn"
                                onClick={() => resetModel(order._id, prod.itemId)}
                                title="Reiniciar"
                              >
                                🔄
                              </button>
                              <button
                                className="control-btn finish-btn"
                                onClick={() => completeModel(order._id, prod.itemId)}
                                disabled={!allComponentsCompleted(order._id, prod.itemId)}
                                title={allComponentsCompleted(order._id, prod.itemId) ? "Finalizar" : "Complete todos los componentes primero"}
                              >
                                ✅ Finalizar
                              </button>
                            </>
                          )}

                          {timer && timer.status === 'completed' && (
                            <span className="completed-badge">✅ Completado</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
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

      {/* Modal de componentes */}
      {showComponentsModal && timers[showComponentsModal] && (
        <div className="modal-overlay" onClick={() => setShowComponentsModal(null)}>
          <div className="modal-content components-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🔧 Componentes en Fabricación</h3>

            <div className="components-list-modal">
              {timers[showComponentsModal].components.map((comp) => {
                const componentDetails = getComponentDetails(comp.componentId)
                const [orderId, productId] = showComponentsModal.split('-')

                return (
                  <div key={comp.componentId} className="component-card-modal">
                    <div className="component-header-modal">
                      <h4>{comp.componentName}</h4>
                      <span className="component-timer">{formatTime(comp.elapsedTime)}</span>
                    </div>

                    {/* Materials */}
                    {componentDetails?.materiales && componentDetails.materiales.length > 0 && (
                      <div className="materials-compact">
                        <p className="materials-title">Materiales:</p>
                        {componentDetails.materiales.map((mat, idx) => (
                          <div key={idx} className="material-line">
                            • {mat.materialId.nombre}: {mat.cantidad} {mat.materialId.unidad}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Component controls */}
                    <div className="component-controls-modal">
                      {comp.status === 'pending' || comp.status === 'paused' ? (
                        <button
                          className="control-btn start-btn"
                          onClick={() => startComponent(orderId, productId, comp.componentId)}
                        >
                          ▶️ {comp.status === 'paused' ? 'Reanudar' : 'Iniciar'}
                        </button>
                      ) : comp.status === 'in_progress' ? (
                        <button
                          className="control-btn pause-btn"
                          onClick={() => pauseComponent(orderId, productId, comp.componentId)}
                        >
                          ⏸️ Pausar
                        </button>
                      ) : null}

                      {comp.status !== 'completed' && (
                        <>
                          <button
                            className="control-btn reset-btn"
                            onClick={() => resetComponent(orderId, productId, comp.componentId)}
                          >
                            🔄 Reiniciar
                          </button>
                          <button
                            className="control-btn finish-btn"
                            onClick={() => completeComponent(orderId, productId, comp.componentId)}
                          >
                            ✅ Finalizar
                          </button>
                        </>
                      )}

                      {comp.status === 'completed' && (
                        <span className="completed-badge">✅ Completado</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <button className="button" onClick={() => setShowComponentsModal(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
