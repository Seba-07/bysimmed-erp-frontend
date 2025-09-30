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
  materiales?: any[]
}

interface Component {
  _id: string
  nombre: string
  descripcion?: string
  stock: number
  precioUnitario: number
  tipo: 'component'
  materiales?: any[]
}

interface Model {
  _id: string
  nombre: string
  descripcion?: string
  stock: number
  precioUnitario: number
  tipo: 'model'
  componentes?: any[]
}

type InventoryItem = Material | Component | Model

export default function Inventory() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNewItemModal, setShowNewItemModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'materials' | 'components' | 'models'>('materials')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [allMaterials, setAllMaterials] = useState<Material[]>([])
  const [allComponents, setAllComponents] = useState<Component[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadAllInventory()
    loadUnits()
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
        const materialsWithType = materialsData.data.map((m: any) => ({ ...m, tipo: 'material' }))
        setMaterials(materialsWithType)
        setAllMaterials(materialsWithType)
      }
      if (componentsData.success) {
        const componentsWithType = componentsData.data.map((c: any) => ({ ...c, tipo: 'component' }))
        setComponents(componentsWithType)
        setAllComponents(componentsWithType)
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

  const loadUnits = async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventory/units`)
      const data = await res.json()
      if (data.success) {
        setUnits(data.data)
      }
    } catch (err) {
      console.error('Error cargando unidades:', err)
    }
  }

  const getUnitDisplay = (unit: string | Unit) => {
    if (typeof unit === 'object') {
      return `${unit.abreviatura}`
    }
    return ''
  }

  const handleItemClick = async (item: InventoryItem) => {
    setLoading(true)
    try {
      let endpoint = ''
      if (item.tipo === 'material') {
        endpoint = `/api/inventory/materials/${item._id}`
      } else if (item.tipo === 'component') {
        endpoint = `/api/inventory/components/${item._id}`
      } else if (item.tipo === 'model') {
        endpoint = `/api/inventory/models/${item._id}`
      }

      const res = await fetch(`${API_URL}${endpoint}`)
      const data = await res.json()

      if (data.success) {
        const fullItem = { ...data.data, tipo: item.tipo }
        setSelectedItem(fullItem)
        setEditData(fullItem)
        setShowDetailModal(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando detalle')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateItem = async () => {
    if (!selectedItem || !editData) return

    setLoading(true)
    try {
      let endpoint = ''
      if (selectedItem.tipo === 'material') {
        endpoint = `/api/inventory/materials/${selectedItem._id}`
      } else if (selectedItem.tipo === 'component') {
        endpoint = `/api/inventory/components/${selectedItem._id}`
      } else if (selectedItem.tipo === 'model') {
        endpoint = `/api/inventory/models/${selectedItem._id}`
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      const data = await res.json()

      if (data.success) {
        setShowDetailModal(false)
        setSelectedItem(null)
        setEditData(null)
        await loadAllInventory()
      } else {
        setError(data.message || 'Error actualizando')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!selectedItem || !confirm('¿Estás seguro de eliminar este producto?')) return

    setLoading(true)
    try {
      let endpoint = ''
      if (selectedItem.tipo === 'material') {
        endpoint = `/api/inventory/materials/${selectedItem._id}`
      } else if (selectedItem.tipo === 'component') {
        endpoint = `/api/inventory/components/${selectedItem._id}`
      } else if (selectedItem.tipo === 'model') {
        endpoint = `/api/inventory/models/${selectedItem._id}`
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        setShowDetailModal(false)
        setSelectedItem(null)
        setEditData(null)
        await loadAllInventory()
      } else {
        setError(data.message || 'Error eliminando')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando')
    } finally {
      setLoading(false)
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

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          📦 Materiales ({materials.length})
        </button>
        <button
          className={`tab ${activeTab === 'components' ? 'active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          🔧 Componentes ({components.length})
        </button>
        <button
          className={`tab ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          🏭 Modelos ({models.length})
        </button>
      </div>

      {loading ? (
        <p>Cargando inventario...</p>
      ) : (
        <div className="tab-content">
          {/* MATERIALES */}
          {activeTab === 'materials' && (
            <div>
              {materials.length > 0 ? (
                <div className="inventory-grid">
                  {materials.map((material) => (
                    <div
                      key={material._id}
                      className="inventory-item clickable"
                      onClick={() => handleItemClick(material)}
                    >
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
          )}

          {/* COMPONENTES */}
          {activeTab === 'components' && (
            <div>
              {components.length > 0 ? (
                <div className="inventory-grid">
                  {components.map((component) => (
                    <div
                      key={component._id}
                      className="inventory-item clickable"
                      onClick={() => handleItemClick(component)}
                    >
                      <h4>{component.nombre}</h4>
                      {component.descripcion && <p className="description">{component.descripcion}</p>}
                      <div className="item-details">
                        <span className="detail-badge">Stock: {component.stock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">No hay componentes registrados</p>
              )}
            </div>
          )}

          {/* MODELOS */}
          {activeTab === 'models' && (
            <div>
              {models.length > 0 ? (
                <div className="inventory-grid">
                  {models.map((model) => (
                    <div
                      key={model._id}
                      className="inventory-item clickable"
                      onClick={() => handleItemClick(model)}
                    >
                      <h4>{model.nombre}</h4>
                      {model.descripcion && <p className="description">{model.descripcion}</p>}
                      <div className="item-details">
                        <span className="detail-badge">Stock: {model.stock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">No hay modelos registrados</p>
              )}
            </div>
          )}
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

      {/* Modal de detalle y edición */}
      {showDetailModal && selectedItem && editData && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {selectedItem.tipo === 'material' && '📦 Detalle del Material'}
              {selectedItem.tipo === 'component' && '🔧 Detalle del Componente'}
              {selectedItem.tipo === 'model' && '🏭 Detalle del Modelo'}
            </h3>

            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={editData.nombre || ''}
                onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={editData.descripcion || ''}
                onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                value={editData.stock || 0}
                onChange={(e) => setEditData({ ...editData, stock: parseFloat(e.target.value) })}
              />
            </div>

            {selectedItem.tipo === 'material' && (
              <div className="form-group">
                <label>Unidad</label>
                <select
                  value={typeof editData.unidad === 'object' ? editData.unidad._id : editData.unidad}
                  onChange={(e) => setEditData({ ...editData, unidad: e.target.value })}
                >
                  {units.map((unit) => (
                    <option key={unit._id} value={unit._id}>
                      {unit.nombre} ({unit.abreviatura})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedItem.tipo === 'component' && editData.materiales && editData.materiales.length > 0 && (
              <div className="form-group">
                <label>Materiales utilizados</label>
                <div className="materials-list">
                  {editData.materiales.map((mat: any, idx: number) => (
                    <div key={idx} className="material-item">
                      <span>{mat.material?.nombre || 'Material'}</span>
                      <span className="cantidad-badge">
                        {mat.cantidad} {mat.material?.unidad?.abreviatura || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.tipo === 'model' && (
              <div className="form-group">
                <label>Componentes del modelo</label>
                {editData.componentes && editData.componentes.length > 0 ? (
                  <div className="editable-components-list">
                    {editData.componentes.map((comp: any, idx: number) => {
                      // Extraer el ID y nombre del componente
                      let componentId: string | null = null
                      let componentName = 'Componente desconocido'

                      // Debug con alert ya que console.log no aparece
                      if (idx === 0) {
                        const debugInfo = `
COMPONENTE DEBUG:
==================
comp._id: ${comp._id}
comp.cantidad: ${comp.cantidad}

componenteId type: ${typeof comp.componenteId}
componenteId._id: ${comp.componenteId?._id || 'N/A'}
componenteId.nombre: ${comp.componenteId?.nombre || 'N/A'}

allComponents.length: ${allComponents.length}

ESTRUCTURA COMPLETA:
${JSON.stringify(comp, null, 2)}
`
                        alert(debugInfo)
                      }

                      // El backend devuelve comp.componenteId como objeto poblado con _id y nombre
                      if (comp.componenteId) {
                        if (typeof comp.componenteId === 'object' && comp.componenteId._id) {
                          componentId = comp.componenteId._id
                          componentName = comp.componenteId.nombre || 'Componente sin nombre'
                          console.log('✓ Extraído de objeto - ID:', componentId, 'Nombre:', componentName)
                        } else if (typeof comp.componenteId === 'string') {
                          componentId = comp.componenteId
                          console.log('Buscando string ID:', componentId, 'en', allComponents.length, 'componentes')
                          // Si es string, buscar en allComponents
                          const foundComp = allComponents.find((c: any) => c._id === componentId)
                          if (foundComp) {
                            componentName = foundComp.nombre
                            console.log('✓ Encontrado en allComponents:', componentName)
                          } else {
                            console.log('✗ NO encontrado en allComponents')
                          }
                        }
                      }

                      console.log('componentName FINAL:', componentName)
                      console.log('=======================\n')

                      return (
                        <div key={idx} className="editable-component-item">
                          <div className="component-info">
                            <span className="component-name-label">🔧 {componentName}</span>
                            <div className="component-quantity-control">
                              <label>Cantidad:</label>
                              <input
                                type="number"
                                className="inline-quantity-input"
                                value={comp.cantidad}
                                onChange={(e) => {
                                  const newComponents = [...editData.componentes]
                                  newComponents[idx] = { ...newComponents[idx], cantidad: parseInt(e.target.value) || 1 }
                                  setEditData({ ...editData, componentes: newComponents })
                                }}
                                min="1"
                                step="1"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="remove-component-inline-btn"
                            onClick={() => {
                              const newComponents = editData.componentes.filter((_: any, i: number) => i !== idx)
                              setEditData({ ...editData, componentes: newComponents })
                            }}
                            title="Eliminar componente"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="empty-components-msg">Este modelo no tiene componentes</p>
                )}

                {/* Agregar nuevo componente al modelo */}
                {allComponents.length > 0 && (
                  <div className="add-component-to-model">
                    <select
                      className="add-component-select"
                      onChange={(e) => {
                        if (e.target.value) {
                          const selectedComp = allComponents.find((c: any) => c._id === e.target.value)
                          if (selectedComp) {
                            const newComponents = editData.componentes || []
                            // Evitar duplicados
                            const exists = newComponents.some((c: any) => {
                              const existingId =
                                (typeof c.componenteId === 'string' ? c.componenteId : c.componenteId?._id) ||
                                (typeof c.componente === 'string' ? c.componente : c.componente?._id)
                              return existingId === selectedComp._id
                            })

                            if (!exists) {
                              setEditData({
                                ...editData,
                                componentes: [
                                  ...newComponents,
                                  { componenteId: selectedComp._id, componente: selectedComp, cantidad: 1 }
                                ]
                              })
                            } else {
                              alert('Este componente ya está en el modelo')
                            }
                          }
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">+ Agregar componente...</option>
                      {allComponents.map((c: any) => (
                        <option key={c._id} value={c._id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button onClick={handleUpdateItem} className="button" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button onClick={handleDeleteItem} className="button danger" disabled={loading}>
                Eliminar
              </button>
              <button onClick={() => setShowDetailModal(false)} className="button secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}