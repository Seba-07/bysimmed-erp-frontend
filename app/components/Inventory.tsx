'use client'

import { useState, useEffect } from 'react'

interface Unit {
  _id: string
  nombre: string
  abreviatura: string
}

interface Material {
  _id: string
  nombre: string
  descripcion?: string
  unidad: string | Unit
  stock: number
  precioUnitario: number
  tipo: 'material'
}

interface Component {
  _id: string
  nombre: string
  descripcion?: string
  stock: number
  precioUnitario: number
  tipo: 'component'
}

interface Model {
  _id: string
  nombre: string
  descripcion?: string
  stock: number
  precioUnitario: number
  tipo: 'model'
}

type InventoryItem = Material | Component | Model

export default function Inventory() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNewItemModal, setShowNewItemModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderForm, setOrderForm] = useState<{
    itemId: string
    itemType: 'Component' | 'Model'
    itemName: string
    cantidad: number
    fechaLimite: string
    prioridad: 'baja' | 'media' | 'alta' | 'urgente'
    notas: string
  }>({
    itemId: '',
    itemType: 'Component',
    itemName: '',
    cantidad: 1,
    fechaLimite: '',
    prioridad: 'media',
    notas: ''
  })

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadAllInventory()
  }, [])

  const loadAllInventory = async () => {
    setLoading(true)
    setError(null)

    try {
      const [materialsRes, componentsRes, modelsRes] = await Promise.all([
        fetch(`${API_URL}/api/inventory/materials`),
        fetch(`${API_URL}/api/inventory/components`),
        fetch(`${API_URL}/api/inventory/models`)
      ])

      const materialsData = await materialsRes.json()
      const componentsData = await componentsRes.json()
      const modelsData = await modelsRes.json()

      if (materialsData.success) {
        setMaterials(materialsData.data.map((m: any) => ({ ...m, tipo: 'material' })))
      }
      if (componentsData.success) {
        setComponents(componentsData.data.map((c: any) => ({ ...c, tipo: 'component' })))
      }
      if (modelsData.success) {
        setModels(modelsData.data.map((m: any) => ({ ...m, tipo: 'model' })))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando inventario')
    } finally {
      setLoading(false)
    }
  }

  const getUnitDisplay = (unit: string | Unit) => {
    if (typeof unit === 'object') {
      return `${unit.abreviatura}`
    }
    return ''
  }

  const openOrderModal = (item: Component | Model, type: 'Component' | 'Model') => {
    // Set default fechaLimite to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const fechaLimiteStr = tomorrow.toISOString().split('T')[0]

    setOrderForm({
      itemId: item._id,
      itemType: type,
      itemName: item.nombre,
      cantidad: 1,
      fechaLimite: fechaLimiteStr,
      prioridad: 'media',
      notas: ''
    })
    setShowOrderModal(true)
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch(`${API_URL}/api/production/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm)
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.success) {
        setShowOrderModal(false)
        alert('Orden de fabricación creada exitosamente')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando orden')
    }
  }


  return (
    <div className="section">
      <div className="inventory-header">
        <h2>📊 Inventario General</h2>
        <button
          className="button"
          onClick={() => setShowNewItemModal(true)}
        >
          ➕ Nuevo Producto
        </button>
      </div>

      {error && (
        <div className="response error">
          <pre>Error: {error}</pre>
        </div>
      )}

      {loading ? (
        <p>Cargando inventario...</p>
      ) : (
        <div className="inventory-sections">
          {/* MATERIALES */}
          <div className="inventory-category">
            <div className="category-header">
              <h3>📦 Materiales ({materials.length})</h3>
            </div>
            {materials.length > 0 ? (
              <div className="inventory-grid">
                {materials.map((material) => (
                  <div key={material._id} className="inventory-item">
                    <h4>{material.nombre}</h4>
                    {material.descripcion && <p className="description">{material.descripcion}</p>}
                    <div className="item-details">
                      <span className="detail-badge">Stock: {material.stock} {getUnitDisplay(material.unidad)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No hay materiales registrados</p>
            )}
          </div>

          {/* COMPONENTES */}
          <div className="inventory-category">
            <div className="category-header">
              <h3>🔧 Componentes ({components.length})</h3>
            </div>
            {components.length > 0 ? (
              <div className="inventory-grid">
                {components.map((component) => (
                  <div key={component._id} className="inventory-item">
                    <h4>{component.nombre}</h4>
                    {component.descripcion && <p className="description">{component.descripcion}</p>}
                    <div className="item-details">
                      <span className="detail-badge">Stock: {component.stock}</span>
                      <button
                        className="order-btn"
                        onClick={() => openOrderModal(component, 'Component')}
                        title="Crear orden de fabricación"
                      >
                        📋 Orden
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No hay componentes registrados</p>
            )}
          </div>

          {/* MODELOS */}
          <div className="inventory-category">
            <div className="category-header">
              <h3>🏭 Modelos ({models.length})</h3>
            </div>
            {models.length > 0 ? (
              <div className="inventory-grid">
                {models.map((model) => (
                  <div key={model._id} className="inventory-item">
                    <h4>{model.nombre}</h4>
                    {model.descripcion && <p className="description">{model.descripcion}</p>}
                    <div className="item-details">
                      <span className="detail-badge">Stock: {model.stock}</span>
                      <button
                        className="order-btn"
                        onClick={() => openOrderModal(model, 'Model')}
                        title="Crear orden de fabricación"
                      >
                        📋 Orden
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No hay modelos registrados</p>
            )}
          </div>
        </div>
      )}

      {/* Modal para nuevo producto */}
      {showNewItemModal && (
        <div className="modal-overlay" onClick={() => setShowNewItemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Selecciona el tipo de producto</h3>
            <div className="modal-options">
              <button
                className="modal-option"
                onClick={() => {
                  setShowNewItemModal(false)
                  window.location.hash = 'materials'
                }}
              >
                <span className="option-icon">📦</span>
                <span className="option-title">Material</span>
                <span className="option-desc">Materia prima básica</span>
              </button>
              <button
                className="modal-option"
                onClick={() => {
                  setShowNewItemModal(false)
                  window.location.hash = 'components'
                }}
              >
                <span className="option-icon">🔧</span>
                <span className="option-title">Componente</span>
                <span className="option-desc">Hecho con materiales</span>
              </button>
              <button
                className="modal-option"
                onClick={() => {
                  setShowNewItemModal(false)
                  window.location.hash = 'models'
                }}
              >
                <span className="option-icon">🏭</span>
                <span className="option-title">Modelo</span>
                <span className="option-desc">Hecho con componentes</span>
              </button>
            </div>
            <button onClick={() => setShowNewItemModal(false)} className="button secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal para crear orden de fabricación */}
      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal-content order-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Crear Orden de Fabricación</h3>
            <form onSubmit={handleCreateOrder} className="order-form">
              <div className="form-field">
                <label>Producto</label>
                <input
                  type="text"
                  value={`${orderForm.itemName} (${orderForm.itemType === 'Component' ? 'Componente' : 'Modelo'})`}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-field">
                <label>Cantidad *</label>
                <input
                  type="number"
                  value={orderForm.cantidad}
                  onChange={(e) => setOrderForm({...orderForm, cantidad: Number(e.target.value)})}
                  min="1"
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
                <label>Prioridad *</label>
                <select
                  value={orderForm.prioridad}
                  onChange={(e) => setOrderForm({...orderForm, prioridad: e.target.value as any})}
                  required
                >
                  <option value="baja">🟢 Baja</option>
                  <option value="media">🟡 Media</option>
                  <option value="alta">🟠 Alta</option>
                  <option value="urgente">🔴 Urgente</option>
                </select>
              </div>

              <div className="form-field">
                <label>Notas (opcional)</label>
                <textarea
                  value={orderForm.notas}
                  onChange={(e) => setOrderForm({...orderForm, notas: e.target.value})}
                  placeholder="Instrucciones especiales o comentarios..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="button">
                  Crear Orden
                </button>
                <button type="button" onClick={() => setShowOrderModal(false)} className="button secondary">
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