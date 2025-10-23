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
  componentesSeleccionados?: Array<{
    componenteId: string
    componentName: string
    cantidad: number
  }>
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

  const [nextOrderNumber, setNextOrderNumber] = useState<string>('')

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

  const [modelComponentsList, setModelComponentsList] = useState<Array<{
    componenteId: string
    componentName: string
    cantidad: number
  }>>([])
  const [availableComponentsForModel, setAvailableComponentsForModel] = useState<Component[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadOrders()
    loadInventory()
  }, [filterEstado])

  const generateNextOrderNumber = (totalOrders: number) => {
    const year = new Date().getFullYear()
    const orderCount = totalOrders + 1
    return `OF-${year}-${String(orderCount).padStart(4, '0')}`
  }

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
        // Generar el siguiente número de orden basado en el total
        const nextNum = generateNextOrderNumber(data.data.length)
        setNextOrderNumber(nextNum)
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
    setModelComponentsList([])
    setAvailableComponentsForModel([])
  }

  const handleProductSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
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

        // Cargar componentes del modelo automáticamente
        try {
          const res = await fetch(`${API_URL}/api/inventory/models/${model._id}`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)

          const data = await res.json()
          console.log('🔍 Respuesta completa del backend:', JSON.stringify(data, null, 2))

          if (data.success) {
            setSelectedModelComponents(data.data)

            // Verificar si hay componentes
            const componentesArray = data.data?.componentes || []
            console.log('📦 Array de componentes:', componentesArray)
            console.log('📏 Longitud:', componentesArray.length)

            if (componentesArray.length === 0) {
              alert('El modelo no tiene componentes asociados')
              setModelComponentsList([])
              return
            }

            // Auto-llenar la lista de componentes
            const autoComponents = componentesArray.map((comp: any, index: number) => {
              console.log(`🔧 Procesando componente ${index}:`, JSON.stringify(comp, null, 2))

              // Usar notación de corchetes para evitar problemas de serialización
              const compId = comp['componentId'] || comp['componenteId']
              console.log(`   - compId:`, compId)
              console.log(`   - typeof compId:`, typeof compId)

              let componentName = 'Desconocido'
              let componentIdValue = null

              if (compId && typeof compId === 'object' && compId._id && compId.nombre) {
                // Es un objeto con datos
                componentIdValue = compId._id
                componentName = compId.nombre
                console.log(`   - Caso 1: Objeto poblado - ID: ${componentIdValue}, Nombre: ${componentName}`)
              } else if (compId && typeof compId === 'string') {
                // Es un string ID, buscar en components
                componentIdValue = compId
                const foundComp = components.find(c => c._id === compId)
                if (foundComp) {
                  componentName = foundComp.nombre
                  console.log(`   - Caso 2: String ID encontrado - Nombre: ${componentName}`)
                } else {
                  console.log(`   - Caso 2: String ID NO encontrado en lista de componentes`)
                }
              } else {
                console.log(`   - Caso 3: No se pudo procesar el componentId`)
              }

              return {
                componenteId: componentIdValue || compId,
                componentName: componentName,
                cantidad: comp.cantidad
              }
            })

            console.log('✅ Componentes procesados:', autoComponents)
            setModelComponentsList(autoComponents)
            setAvailableComponentsForModel(components.filter(c =>
              !autoComponents.some((ac: any) => ac.componenteId === c._id)
            ))
          }
        } catch (err) {
          console.error('❌ Error cargando componentes:', err)
          alert(`Error al cargar componentes: ${err}`)
        }
      }
    }
  }

  const removeComponentFromModel = (componentId: string) => {
    const removed = modelComponentsList.find(c => c.componenteId === componentId)
    setModelComponentsList(modelComponentsList.filter(c => c.componenteId !== componentId))

    // Agregar a disponibles si existe
    if (removed) {
      const comp = components.find(c => c._id === componentId)
      if (comp && !availableComponentsForModel.find(c => c._id === componentId)) {
        setAvailableComponentsForModel([...availableComponentsForModel, comp])
      }
    }
  }

  const addComponentToModel = (componentId: string) => {
    const comp = components.find(c => c._id === componentId)
    if (!comp) return

    setModelComponentsList([
      ...modelComponentsList,
      { componenteId: comp._id, componentName: comp.nombre, cantidad: 1 }
    ])

    setAvailableComponentsForModel(availableComponentsForModel.filter(c => c._id !== componentId))
  }

  const updateComponentQuantity = (componentId: string, newQuantity: number) => {
    setModelComponentsList(modelComponentsList.map(c =>
      c.componenteId === componentId ? { ...c, cantidad: newQuantity } : c
    ))
  }

  const addProductToOrder = () => {
    if (!currentProduct.itemId || !currentProduct.itemName || currentProduct.cantidad < 1) {
      alert('Por favor completa todos los campos del producto')
      return
    }

    if (currentProduct.itemType === 'Model' && modelComponentsList.length === 0) {
      alert('Debes tener al menos un componente para este modelo')
      return
    }

    const productToAdd: OrderProduct = {
      ...currentProduct,
      componentesSeleccionados: currentProduct.itemType === 'Model' ? modelComponentsList : undefined
    }

    setOrderForm({
      ...orderForm,
      productos: [...orderForm.productos, productToAdd]
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
    setModelComponentsList([])
    setAvailableComponentsForModel([])
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

    // Asegurar que haya un número de orden
    let numeroOrden = nextOrderNumber
    if (!numeroOrden || numeroOrden === '') {
      // Generar uno si no existe (fallback)
      numeroOrden = generateNextOrderNumber(orders.length)
      console.warn('⚠️ numeroOrden estaba vacío, generando fallback:', numeroOrden)
    }

    try {
      // Limpiar los productos antes de enviar (remover componentName si existe)
      const cleanedProducts = orderForm.productos.map(prod => {
        const productData: any = {
          itemId: prod.itemId,
          itemType: prod.itemType,
          itemName: prod.itemName,
          cantidad: prod.cantidad
        }

        // Solo agregar componentesSeleccionados si existen y no está vacío
        // IMPORTANTE: Backend espera array de ObjectIds, NO objetos con {componentId, cantidad}
        if (prod.componentesSeleccionados && prod.componentesSeleccionados.length > 0) {
          productData.componentesSeleccionados = prod.componentesSeleccionados.map(comp => comp.componenteId)
        }

        return productData
      })

      // Usar el número de orden generado automáticamente
      const payload = {
        numeroOrden: numeroOrden,
        cliente: orderForm.cliente,
        fechaLimite: orderForm.fechaLimite,
        notas: orderForm.notas,
        productos: cleanedProducts
      }

      console.log('📤 Creando orden:', payload)
      console.log('📋 numeroOrden:', numeroOrden)

      const res = await fetch(`${API_URL}/api/production/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('❌ Error del backend completo:', JSON.stringify(errorData, null, 2))
        alert(`Error del servidor:\n${JSON.stringify(errorData, null, 2)}`)
        throw new Error(`HTTP ${res.status}: ${errorData.message || 'Error desconocido'}`)
      }

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
    <div className="page-container">
      <div className="page-header-minimal">
        <h1>Órdenes de Fabricación</h1>
        <div className="header-actions-minimal">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="filter-select"
            style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '0.375rem', backgroundColor: '#fff' }}
          >
            <option value="">Todos los estados</option>
            <option value="activa">Activas</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completada">Completadas</option>
            <option value="cancelada">Canceladas</option>
          </select>
          <button
            className="btn-minimal btn-primary-minimal"
            onClick={() => {
              // Asegurar que el número de orden esté generado antes de abrir modal
              if (!nextOrderNumber || nextOrderNumber === '') {
                const newOrderNum = generateNextOrderNumber(orders.length)
                setNextOrderNumber(newOrderNum)
              }
              setShowNewOrderModal(true)
            }}
          >
            + Nueva Orden
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
        <div className="table-minimal-container">
          <table className="table-minimal">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Fecha Límite</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const estadoBadge = getEstadoBadge(order.estado)

                return (
                  <tr key={order._id} className="order-row">
                    <td className="order-number">{order.numeroOrden}</td>
                    <td className="order-cliente">👤 {order.cliente}</td>
                    <td className="order-productos">
                      {order.productos.map((prod, idx) => (
                        <div key={idx} className="producto-inline">
                          {prod.itemType === 'Component' ? '🔧' : '🏭'} {prod.itemName} x{prod.cantidad}
                        </div>
                      ))}
                    </td>
                    <td className="order-fecha">{formatDate(order.fechaLimite)}</td>
                    <td className="order-estado">
                      <select
                        value={order.estado}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value as ProductionOrder['estado'])}
                        className={`status-select-compact ${estadoBadge.class}`}
                      >
                        <option value="activa">🟢 Activa</option>
                        <option value="en_proceso">⚙️ En Proceso</option>
                        <option value="completada">✅ Completada</option>
                        <option value="cancelada">❌ Cancelada</option>
                      </select>
                    </td>
                    <td className="order-actions">
                      <button
                        onClick={() => deleteOrder(order._id)}
                        className="delete-btn-small"
                        title="Eliminar orden"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state-minimal">
          <p>No hay órdenes de fabricación</p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>Crea una nueva orden para comenzar</p>
        </div>
      )}

      {/* Modal para nueva orden */}
      {showNewOrderModal && (
        <div className="modal-minimal" onClick={() => setShowNewOrderModal(false)}>
          <div className="modal-content-minimal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-minimal">
              <h2>Nueva Orden de Fabricación</h2>
              <button className="modal-close-btn" onClick={() => setShowNewOrderModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateOrder} className="production-form">
              <div className="form-group-minimal">
                <label>Número de Orden</label>
                <input
                  type="text"
                  value={nextOrderNumber}
                  disabled
                  style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
                  title="Generado automáticamente"
                />
              </div>

              <div className="form-group-minimal">
                <label>Cliente *</label>
                <input
                  type="text"
                  value={orderForm.cliente}
                  onChange={(e) => setOrderForm({...orderForm, cliente: e.target.value})}
                  placeholder="Nombre del cliente"
                  required
                />
              </div>

              <div className="form-group-minimal">
                <label>Fecha límite *</label>
                <input
                  type="date"
                  className="date-input"
                  value={orderForm.fechaLimite}
                  onChange={(e) => setOrderForm({...orderForm, fechaLimite: e.target.value})}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group-minimal">
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
                    <div className="form-group-minimal">
                      <label>Tipo</label>
                      <select
                        value={currentProduct.itemType}
                        onChange={(e) => handleProductTypeChange(e.target.value as 'Component' | 'Model')}
                      >
                        <option value="Component">Componente</option>
                        <option value="Model">Modelo</option>
                      </select>
                    </div>

                    <div className="form-group-minimal">
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

                    <div className="form-group-minimal">
                      <label>Cantidad</label>
                      <input
                        type="number"
                        value={currentProduct.cantidad}
                        onChange={(e) => setCurrentProduct({...currentProduct, cantidad: Number(e.target.value)})}
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Lista de componentes editables para modelos */}
                  {currentProduct.itemType === 'Model' && currentProduct.itemId && (
                    <div className="model-components-section">
                      <label>Componentes del modelo:</label>

                      {modelComponentsList.length > 0 ? (
                        <div className="model-components-list">
                          {modelComponentsList.map((comp) => (
                            <div key={comp.componenteId} className="model-component-item">
                              <span className="component-name">{comp.componentName}</span>
                              <div className="component-controls">
                                <input
                                  type="number"
                                  className="component-quantity-input"
                                  value={comp.cantidad}
                                  onChange={(e) => updateComponentQuantity(comp.componenteId, Number(e.target.value))}
                                  min="1"
                                />
                                <button
                                  type="button"
                                  className="component-remove-btn"
                                  onClick={() => removeComponentFromModel(comp.componenteId)}
                                  title="Eliminar componente"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-components-msg">No hay componentes en este modelo</p>
                      )}

                      {/* Agregar nuevo componente */}
                      {availableComponentsForModel.length > 0 && (
                        <div className="add-component-section">
                          <select
                            className="add-component-select"
                            onChange={(e) => {
                              if (e.target.value) {
                                addComponentToModel(e.target.value)
                                e.target.value = ''
                              }
                            }}
                          >
                            <option value="">+ Agregar componente...</option>
                            {availableComponentsForModel.map(c => (
                              <option key={c._id} value={c._id}>{c.nombre}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addProductToOrder}
                    className="btn-minimal btn-secondary-minimal"
                    disabled={!currentProduct.itemId}
                  >
                    + Agregar Producto
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-minimal btn-primary-minimal" disabled={orderForm.productos.length === 0}>
                  Crear Orden
                </button>
                <button type="button" onClick={() => setShowNewOrderModal(false)} className="btn-minimal btn-secondary-minimal">
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