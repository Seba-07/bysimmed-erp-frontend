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
  uniqueId: string // Para diferenciar múltiples instancias del mismo componente
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
    loadTimersFromStorage()
  }, [])

  // Update timers every second and save to storage
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
        // Save to localStorage
        saveTimersToStorage(updated)
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

  const saveTimersToStorage = (timersData: Record<string, ModelTimer>) => {
    try {
      localStorage.setItem('production_timers', JSON.stringify(timersData))
    } catch (err) {
      console.error('Error guardando timers:', err)
    }
  }

  const loadTimersFromStorage = () => {
    try {
      const saved = localStorage.getItem('production_timers')
      if (saved) {
        const parsed: Record<string, ModelTimer> = JSON.parse(saved)
        // Recalculate elapsed time for in_progress timers
        Object.keys(parsed).forEach(key => {
          const timer = parsed[key]
          if (timer.status === 'in_progress' && timer.startTime) {
            timer.elapsedTime = Math.floor((Date.now() - timer.startTime) / 1000)
          }
          // Update component timers
          timer.components.forEach((comp: ComponentTimer) => {
            if (comp.status === 'in_progress' && comp.startTime) {
              comp.elapsedTime = Math.floor((Date.now() - comp.startTime) / 1000)
            }
          })
        })
        setTimers(parsed)
      }
    } catch (err) {
      console.error('Error cargando timers:', err)
    }
  }

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
      let componentTimers: ComponentTimer[] = []

      // If it's a Model, fetch the model to get component quantities
      if (product.itemType === 'Model') {
        try {
          const res = await fetch(`${API_URL}/api/inventory/models/${product.itemId}`)
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.data?.componentes) {
              // Create multiple timers based on quantity
              componentTimers = data.data.componentes.flatMap((comp: any, index: number) => {
                const compId = comp.componentId?._id || comp.componentId || comp.componenteId?._id || comp.componenteId
                const compName = comp.componentId?.nombre || comp.componenteId?.nombre || 'Desconocido'
                const cantidad = comp.cantidad || 1

                // Create one timer for each quantity
                return Array.from({ length: cantidad }, (_, i) => ({
                  componentId: compId,
                  componentName: compName,
                  status: 'pending' as const,
                  elapsedTime: 0,
                  startTime: null,
                  uniqueId: `${compId}-${index}-${i}` // Unique ID for each instance
                }))
              })
            }
          }
        } catch (err) {
          console.error('Error cargando componentes del modelo:', err)
        }
      }

      // Fallback: if no components loaded or it's a Component type
      if (componentTimers.length === 0) {
        componentTimers = (product.componentesSeleccionados || []).map((compId, index) => {
          const comp = getComponentDetails(compId)
          return {
            componentId: compId,
            componentName: comp?.nombre || 'Desconocido',
            status: 'pending' as const,
            elapsedTime: 0,
            startTime: null,
            uniqueId: `${compId}-${index}`
          }
        })
      }

      setTimers(prev => {
        const updated = {
          ...prev,
          [timerKey]: {
            orderId: order._id,
            productId: product.itemId,
            status: 'in_progress' as const,
            elapsedTime: 0,
            startTime: Date.now(),
            components: componentTimers
          }
        }
        saveTimersToStorage(updated)
        return updated
      })

      // Update order status to 'en_proceso' if it's still 'activa'
      if (order.estado === 'activa') {
        await updateOrderStatus(order._id, 'en_proceso')
      }

      // Show components modal
      setShowComponentsModal(timerKey)
    } else {
      // Resume timer
      setTimers(prev => {
        const updated = {
          ...prev,
          [timerKey]: {
            ...prev[timerKey],
            status: 'in_progress' as const,
            startTime: Date.now() - (prev[timerKey].elapsedTime * 1000)
          }
        }
        saveTimersToStorage(updated)
        return updated
      })
      setShowComponentsModal(timerKey)
    }
  }

  const pauseModel = (orderId: string, productId: string) => {
    const timerKey = getTimerKey(orderId, productId)
    setTimers(prev => {
      const updated = {
        ...prev,
        [timerKey]: {
          ...prev[timerKey],
          status: 'paused' as const,
          startTime: null
        }
      }
      saveTimersToStorage(updated)
      return updated
    })
  }

  const closeComponentsModal = () => {
    // Pause the model and all in-progress components before closing
    if (showComponentsModal) {
      const [orderId, productId] = showComponentsModal.split('-')
      const timerKey = getTimerKey(orderId, productId)
      const timer = timers[timerKey]

      if (timer) {
        // Pause any in-progress components
        setTimers(prev => {
          const updated = {
            ...prev,
            [timerKey]: {
              ...prev[timerKey],
              status: 'paused' as const,
              startTime: null,
              components: prev[timerKey].components.map(comp =>
                comp.status === 'in_progress'
                  ? { ...comp, status: 'paused' as const, startTime: null }
                  : comp
              )
            }
          }
          saveTimersToStorage(updated)
          return updated
        })
      }
    }
    setShowComponentsModal(null)
  }

  const resetModel = (orderId: string, productId: string) => {
    if (!confirm('¿Seguro que quieres reiniciar el cronómetro? Se perderá todo el progreso.')) return

    const timerKey = getTimerKey(orderId, productId)
    const timer = timers[timerKey]

    setTimers(prev => {
      const updated = {
        ...prev,
        [timerKey]: {
          ...timer,
          status: 'pending' as const,
          elapsedTime: 0,
          startTime: null,
          components: timer.components.map(c => ({
            ...c,
            status: 'pending' as const,
            elapsedTime: 0,
            startTime: null
          }))
        }
      }
      saveTimersToStorage(updated)
      return updated
    })
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

    // Update timer to completed
    let updatedTimers: Record<string, ModelTimer> = {}
    setTimers(prev => {
      const updated = {
        ...prev,
        [timerKey]: {
          ...prev[timerKey],
          status: 'completed' as const,
          startTime: null
        }
      }
      saveTimersToStorage(updated)
      updatedTimers = updated
      return updated
    })
    setShowComponentsModal(null)

    // Check if all products in the order are completed
    const order = orders.find(o => o._id === orderId)
    if (order) {
      // Wait a bit for state to update, then check with updated timers
      setTimeout(() => {
        // Check using the updated timers
        const allCompleted = order.productos.every(prod => {
          const key = getTimerKey(orderId, prod.itemId)
          const timer = updatedTimers[key]
          return timer && timer.status === 'completed'
        })

        if (allCompleted) {
          if (confirm(`✅ Todos los productos de la orden ${order.numeroOrden} han sido fabricados.\n\n¿Confirmar que la orden está completada?`)) {
            updateOrderStatus(orderId, 'completada')
            // Remove order from view and clean up timers
            setOrders(prev => prev.filter(o => o._id !== orderId))
            // Remove timers for this order from storage
            setTimers(prev => {
              const updated = { ...prev }
              order.productos.forEach(prod => {
                const key = getTimerKey(orderId, prod.itemId)
                delete updated[key]
              })
              saveTimersToStorage(updated)
              return updated
            })
          }
        }
      }, 100)
    }
  }

  const startComponent = (orderId: string, productId: string, uniqueId: string) => {
    const timerKey = getTimerKey(orderId, productId)
    setTimers(prev => {
      const timer = prev[timerKey]
      const updated = {
        ...prev,
        [timerKey]: {
          ...timer,
          components: timer.components.map(c =>
            c.uniqueId === uniqueId
              ? { ...c, status: 'in_progress' as const, startTime: Date.now() - (c.elapsedTime * 1000) }
              : c
          )
        }
      }
      saveTimersToStorage(updated)
      return updated
    })
  }

  const pauseComponent = (orderId: string, productId: string, uniqueId: string) => {
    const timerKey = getTimerKey(orderId, productId)
    setTimers(prev => {
      const timer = prev[timerKey]
      const updated = {
        ...prev,
        [timerKey]: {
          ...timer,
          components: timer.components.map(c =>
            c.uniqueId === uniqueId
              ? { ...c, status: 'paused' as const, startTime: null }
              : c
          )
        }
      }
      saveTimersToStorage(updated)
      return updated
    })
  }

  const resetComponent = (orderId: string, productId: string, uniqueId: string) => {
    if (!confirm('¿Reiniciar este componente?')) return

    const timerKey = getTimerKey(orderId, productId)
    setTimers(prev => {
      const timer = prev[timerKey]
      const updated = {
        ...prev,
        [timerKey]: {
          ...timer,
          components: timer.components.map(c =>
            c.uniqueId === uniqueId
              ? { ...c, status: 'pending' as const, elapsedTime: 0, startTime: null }
              : c
          )
        }
      }
      saveTimersToStorage(updated)
      return updated
    })
  }

  const completeComponent = (orderId: string, productId: string, uniqueId: string) => {
    const timerKey = getTimerKey(orderId, productId)
    setTimers(prev => {
      const timer = prev[timerKey]
      const updated = {
        ...prev,
        [timerKey]: {
          ...timer,
          components: timer.components.map(c =>
            c.uniqueId === uniqueId
              ? { ...c, status: 'completed' as const, startTime: null }
              : c
          )
        }
      }
      saveTimersToStorage(updated)
      return updated
    })
  }

  const allComponentsCompleted = (orderId: string, productId: string) => {
    const timerKey = getTimerKey(orderId, productId)
    const timer = timers[timerKey]
    if (!timer) return false
    return timer.components.every(c => c.status === 'completed')
  }

  // Calendar rendering
  const renderCalendar = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const currentDay = today.getDate()

    // Get first day of month and total days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    // Get orders deadlines for this month
    const deadlines = orders.reduce((acc, order) => {
      const deadline = new Date(order.fechaLimite)
      if (deadline.getMonth() === currentMonth && deadline.getFullYear() === currentYear) {
        const day = deadline.getDate()
        if (!acc[day]) acc[day] = []
        acc[day].push(order)
      }
      return acc
    }, {} as Record<number, ProductionOrder[]>)

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === currentDay
      const hasDeadline = deadlines[day]
      const isPast = new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

      let className = 'calendar-day'
      if (isToday) className += ' today'
      if (isPast) className += ' past'
      if (hasDeadline) className += ' has-deadline'

      days.push(
        <div key={day} className={className} title={hasDeadline ? `${hasDeadline.length} orden(es)` : ''}>
          <span className="day-number">{day}</span>
          {hasDeadline && <span className="deadline-indicator">{hasDeadline.length}</span>}
        </div>
      )
    }

    return (
      <div className="calendar-widget">
        <h3 className="calendar-header">{monthNames[currentMonth]} {currentYear}</h3>
        <div className="calendar-weekdays">
          {dayNames.map(name => <div key={name} className="weekday">{name}</div>)}
        </div>
        <div className="calendar-grid">
          {days}
        </div>
      </div>
    )
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
        <>
          {/* Calendario */}
          {renderCalendar()}

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
        </>
      ) : (
        <div className="empty-state">
          <p>✅ No hay órdenes pendientes</p>
          <p className="hint">Todas las órdenes están completadas o canceladas</p>
        </div>
      )}

      {/* Modal de componentes */}
      {showComponentsModal && timers[showComponentsModal] && (
        <div className="modal-overlay" onClick={closeComponentsModal}>
          <div className="modal-content components-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🔧 Componentes en Fabricación</h3>

            <div className="components-list-modal">
              {timers[showComponentsModal].components.map((comp, idx) => {
                const componentDetails = getComponentDetails(comp.componentId)
                const [orderId, productId] = showComponentsModal.split('-')

                return (
                  <div key={comp.uniqueId} className="component-card-modal">
                    <div className="component-header-modal">
                      <h4>{comp.componentName} #{idx + 1}</h4>
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
                          onClick={() => startComponent(orderId, productId, comp.uniqueId)}
                        >
                          ▶️ {comp.status === 'paused' ? 'Reanudar' : 'Iniciar'}
                        </button>
                      ) : comp.status === 'in_progress' ? (
                        <button
                          className="control-btn pause-btn"
                          onClick={() => pauseComponent(orderId, productId, comp.uniqueId)}
                        >
                          ⏸️ Pausar
                        </button>
                      ) : null}

                      {comp.status !== 'completed' && (
                        <>
                          <button
                            className="control-btn reset-btn"
                            onClick={() => resetComponent(orderId, productId, comp.uniqueId)}
                          >
                            🔄 Reiniciar
                          </button>
                          <button
                            className="control-btn finish-btn"
                            onClick={() => completeComponent(orderId, productId, comp.uniqueId)}
                            disabled={comp.status === 'pending'}
                            title={comp.status === 'pending' ? 'Debes iniciar el componente primero' : 'Finalizar componente'}
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

            <button className="button" onClick={closeComponentsModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
