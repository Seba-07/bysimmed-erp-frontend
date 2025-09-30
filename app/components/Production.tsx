'use client'

import { useState, useEffect } from 'react'

interface Component {
  _id: string
  nombre: string
}

interface Model {
  _id: string
  nombre: string
  componentes: Array<{
    componenteId: string | Component
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
  fechaActualizacion: string
  fechaCompletada?: string
}

export default function Production() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterEstado, setFilterEstado] = useState<string>('')
  const [showNewOrderModal, setShowNewOrderModal] = useState(false)
  const [selectedModelComponents, setSelectedModelComponents] = useState<any>(null)

  const [orderForm, setOrderForm] = useState({
    cliente: '',
    fechaLimite: '',
    notas: '',
    productos: [] as OrderProduct[]
  })

  const [currentProduct, setCurrentProduct] = useState<OrderProduct>({
    itemId: '',
    itemType: 'Component' as 'Component' | 'Model',
    itemName: '',
    cantidad: 1,
    componentesSeleccionados: []
  })

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadOrders()
    loadInventory()
  }, [filterEstado])

  const loadOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filterEstado) params.append('estado', filterEstado)

      const res = await fetch(`${API_URL}/api/production/orders?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando órdenes')
    } finally {
      setLoading(false)
    }
  }

  const loadInventory = async () => {
    try {
      const [componentsRes, modelsRes] = await Promise.all([
        fetch(`${API_URL}/api/inventory/components`),
        fetch(`${API_URL}/api/inventory/models`)
      ])

      const componentsData = await componentsRes.json()
      const modelsData = await modelsRes.json()

      if (componentsData.success) setComponents(componentsData.data)
      if (modelsData.success) setModels(modelsData.data)
    } catch (err) {
      console.error('Error cargando inventario:', err)
    }
  }

  const loadModelComponents = async (modelId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/production/orders/model/${modelId}/components`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.success) {
        setSelectedModelComponents(data.data)
      }
    } catch (err) {
      console.error('Error cargando componentes:', err)
    }
  }

  const handleProductTypeChange = (type: 'Component' | 'Model') => {
    setCurrentProduct({
      itemId: '',
      itemType: type,
      itemName: '',
      cantidad: 1,
      componentesSeleccionados: []
    })
    setSelectedModelComponents(null)
  }

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = e.target.value
    if (!itemId) return

    if (currentProduct.itemType === 'Component') {
      const comp = components.find(c => c._id === itemId)
      if (comp) {
        setCurrentProduct({
          ...currentProduct,
          itemId: comp._id,
          itemName: comp.nombre
        })
      }
    } else {
      const model = models.find(m => m._id === itemId)
      if (model) {
        setCurrentProduct({
          ...currentProduct,
          itemId: model._id,
          itemName: model.nombre,
          componentesSeleccionados: []
        })
        loadModelComponents(model._id)
      }
    }
  }

  const toggleComponent = (componentId: string) => {
    const current = currentProduct.componentesSeleccionados || []
    const newSelection = current.includes(componentId)
      ? current.filter(id => id !== componentId)
      : [...current, componentId]

    setCurrentProduct({
      ...currentProduct,
      componentesSeleccionados: newSelection
    })
  }

  const addProductToOrder = () => {
    if (!currentProduct.itemId || !currentProduct.itemName || currentProduct.cantidad < 1) {
      alert('Por favor completa todos los campos del producto')
      return
    }

    if (currentProduct.itemType === 'Model' && (!currentProduct.componentesSeleccionados || currentProduct.componentesSeleccionados.length === 0)) {
      alert('Debes seleccionar al menos un componente para este modelo')
      return
    }

    setOrderForm({
      ...orderForm,
      productos: [...orderForm.productos, { ...currentProduct }]
    })

    // Reset current product
    setCurrentProduct({
      itemId: '',
      itemType: 'Component',
      itemName: '',
      cantidad: 1,
      componentesSeleccionados: []
    })
    setSelectedModelComponents(null)
  }

  const removeProductFromOrder = (index: number) => {
    setOrderForm({
      ...orderForm,
      productos: orderForm.productos.filter((_, i) => i !== index)
    })
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!orderForm.cliente || !orderForm.fechaLimite || orderForm.productos.length === 0) {
      alert('Por favor completa todos los campos requeridos y agrega al menos un producto')
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/production/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm)
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.success) {
        setShowNewOrderModal(false)
        setOrderForm({
          cliente: '',
          fechaLimite: '',
          notas: '',
          productos: []
        })
        loadOrders()
        alert('Orden de fabricación creada exitosamente')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando orden')
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
      activa: { emoji: '🟢', class: 'badge-active', label: 'Activa' },
      en_proceso: { emoji: '⚙️', class: 'badge-in-progress', label: 'En Proceso' },
      completada: { emoji: '✅', class: 'badge-completed', label: 'Completada' },
      cancelada: { emoji: '❌', class: 'badge-cancelled', label: 'Cancelada' }
    }
    return badges[estado]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getComponentName = (componentId: string | Component): string => {
    if (typeof componentId === 'string') {
      const comp = components.find(c => c._id === componentId)
      return comp ? comp.nombre : 'Desconocido'
    }
    return componentId.nombre
  }

  return (
    <div className="section">
      <div className="production-header">
        <h2>🏭 Órdenes de Fabricación</h2>
        <div className="header-actions">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="activa">🟢 Activas</option>
            <option value="en_proceso">⚙️ En Proceso</option>
            <option value="completada">✅ Completadas</option>
            <option value="cancelada">❌ Canceladas</option>
          </select>
          <button
            className="button"
            onClick={() => setShowNewOrderModal(true)}
          >
            ➕ Nueva Orden
          </button>
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

            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-title">
                    <h3>{order.numeroOrden}</h3>
                    <span className="cliente-badge">👤 {order.cliente}</span>
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
                    <span className="detail-label">Productos:</span>
                    <div className="productos-list">
                      {order.productos.map((prod, idx) => (
                        <div key={idx} className="producto-item">
                          <span className="producto-name">
                            {prod.itemType === 'Component' ? '🔧' : '🏭'} {prod.itemName}
                          </span>
                          <span className="producto-cantidad">x{prod.cantidad}</span>
                          {prod.componentesSeleccionados && prod.componentesSeleccionados.length > 0 && (
                            <div className="componentes-seleccionados">
                              <small>Componentes: {prod.componentesSeleccionados.map(getComponentName).join(', ')}</small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Fecha límite:</span>
                    <span className="detail-value">{formatDate(order.fechaLimite)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Estado:</span>
                    <select
                      value={order.estado}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value as ProductionOrder['estado'])}
                      className={`status-select ${estadoBadge.class}`}
                    >
                      <option value="activa">🟢 Activa</option>
                      <option value="en_proceso">⚙️ En Proceso</option>
                      <option value="completada">✅ Completada</option>
                      <option value="cancelada">❌ Cancelada</option>
                    </select>
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

                  {order.fechaCompletada && (
                    <div className="detail-row date-info">
                      <span className="detail-label">Completada:</span>
                      <span className="detail-value">{formatDate(order.fechaCompletada)}</span>
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
          <p className="hint">Crea una nueva orden para comenzar</p>
        </div>
      )}

      {/* Modal para nueva orden */}
      {showNewOrderModal && (
        <div className="modal-overlay" onClick={() => setShowNewOrderModal(false)}>
          <div className="modal-content production-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nueva Orden de Fabricación</h3>
            <form onSubmit={handleCreateOrder} className="production-form">
              <div className="form-field">
                <label>Cliente *</label>
                <input
                  type="text"
                  value={orderForm.cliente}
                  onChange={(e) => setOrderForm({...orderForm, cliente: e.target.value})}
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div className="form-field">
                <label>Fecha límite *</label>
                <input
                  type="date"
                  value={orderForm.fechaLimite}
                  onChange={(e) => setOrderForm({...orderForm, fechaLimite: e.target.value})}
                  required
                />
              </div>

              <div className="form-field">
                <label>Notas (opcional)</label>
                <textarea
                  value={orderForm.notas}
                  onChange={(e) => setOrderForm({...orderForm, notas: e.target.value})}
                  placeholder="Instrucciones especiales..."
                  rows={2}
                />
              </div>

              <div className="products-section">
                <h4>Productos a Fabricar *</h4>

                {/* Productos ya agregados */}
                {orderForm.productos.length > 0 && (
                  <div className="added-products">
                    {orderForm.productos.map((prod, idx) => (
                      <div key={idx} className="added-product-item">
                        <span>
                          {prod.itemType === 'Component' ? '🔧' : '🏭'} {prod.itemName} x{prod.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProductFromOrder(idx)}
                          className="remove-product-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulario para agregar producto */}
                <div className="add-product-form">
                  <div className="form-row">
                    <div className="form-field">
                      <label>Tipo</label>
                      <select
                        value={currentProduct.itemType}
                        onChange={(e) => handleProductTypeChange(e.target.value as 'Component' | 'Model')}
                      >
                        <option value="Component">🔧 Componente</option>
                        <option value="Model">🏭 Modelo</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Producto</label>
                      <select
                        value={currentProduct.itemId}
                        onChange={handleProductSelect}
                      >
                        <option value="">Seleccionar...</option>
                        {currentProduct.itemType === 'Component'
                          ? components.map(c => (
                              <option key={c._id} value={c._id}>{c.nombre}</option>
                            ))
                          : models.map(m => (
                              <option key={m._id} value={m._id}>{m.nombre}</option>
                            ))
                        }
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Cantidad</label>
                      <input
                        type="number"
                        value={currentProduct.cantidad}
                        onChange={(e) => setCurrentProduct({...currentProduct, cantidad: Number(e.target.value)})}
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Selección de componentes para modelos */}
                  {currentProduct.itemType === 'Model' && selectedModelComponents && (
                    <div className="components-selection">
                      <label>Componentes del modelo (selecciona los que deseas fabricar):</label>
                      <div className="components-checkboxes">
                        {selectedModelComponents.componentes.map((comp: any) => {
                          const compData = typeof comp.componenteId === 'string'
                            ? components.find(c => c._id === comp.componenteId)
                            : comp.componenteId

                          if (!compData) return null

                          return (
                            <label key={compData._id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={currentProduct.componentesSeleccionados?.includes(compData._id) || false}
                                onChange={() => toggleComponent(compData._id)}
                              />
                              <span>{compData.nombre} (x{comp.cantidad})</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addProductToOrder}
                    className="button secondary"
                    disabled={!currentProduct.itemId}
                  >
                    ➕ Agregar Producto
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="button" disabled={orderForm.productos.length === 0}>
                  Crear Orden
                </button>
                <button type="button" onClick={() => setShowNewOrderModal(false)} className="button secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}