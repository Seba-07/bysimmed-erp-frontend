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
  categoria: 'Accesorios' | 'Aditivos' | 'Filamentos' | 'Limpieza' | 'Pegamentos' | 'Resina' | 'Silicona'
  unidadBase: string | Unit
  stock: number
  precioUnitario: number
  tipo: 'material'
  materiales?: any[]
  presentaciones?: Array<{ nombre: string, factorConversion: number, precioCompra?: number }>
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
  const [newPresentacion, setNewPresentacion] = useState({ nombre: '', factorConversion: 0, precioCompra: 0 })
  const [units, setUnits] = useState<Unit[]>([])
  const [allMaterials, setAllMaterials] = useState<Material[]>([])
  const [allComponents, setAllComponents] = useState<Component[]>([])
  const [categoriaFilter, setCategoriaFilter] = useState<string>('Todas')

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

  const getUnidadBase = (material: Material) => {
    if (typeof material.unidadBase === 'object') {
      return material.unidadBase.abreviatura
    }
    const foundUnit = units.find(u => u._id === material.unidadBase)
    return foundUnit ? foundUnit.abreviatura : ''
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
        // Asegurar que presentaciones esté inicializado para materiales
        if (item.tipo === 'material' && !fullItem.presentaciones) {
          fullItem.presentaciones = []
        }
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
        setNewPresentacion({ nombre: '', factorConversion: 0, precioCompra: 0 })
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
        setNewPresentacion({ nombre: '', factorConversion: 0, precioCompra: 0 })
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
          📦 Materiales ({materials.filter(m => categoriaFilter === 'Todas' || m.categoria === categoriaFilter).length})
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
              <div className="filter-section">
                <label>Filtrar por categoría:</label>
                <select
                  value={categoriaFilter}
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                  className="categoria-filter"
                >
                  <option value="Todas">Todas</option>
                  <option value="Silicona">Silicona</option>
                  <option value="Resina">Resina</option>
                  <option value="Filamentos">Filamentos</option>
                  <option value="Pegamentos">Pegamentos</option>
                  <option value="Aditivos">Aditivos</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Limpieza">Limpieza</option>
                </select>
              </div>
              {materials.filter(m => categoriaFilter === 'Todas' || m.categoria === categoriaFilter).length > 0 ? (
                <div className="inventory-grid">
                  {materials.filter(m => categoriaFilter === 'Todas' || m.categoria === categoriaFilter).map((material) => (
                    <div
                      key={material._id}
                      className="inventory-item clickable"
                      onClick={() => handleItemClick(material)}
                    >
                      <div className="material-header">
                        <h4>{material.nombre}</h4>
                        <span className="categoria-badge">{material.categoria}</span>
                      </div>
                      {material.descripcion && <p className="description">{material.descripcion}</p>}
                      <div className="item-details">
                        <span className="detail-badge">Cantidad: {material.stock} {getUnidadBase(material)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">No hay materiales{categoriaFilter !== 'Todas' ? ` en la categoría ${categoriaFilter}` : ' registrados'}</p>
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
                        <span className="detail-badge">Cantidad: {component.stock}</span>
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
                        <span className="detail-badge">Cantidad: {model.stock}</span>
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
                  // Force navigation even if already on the same hash
                  if (window.location.hash === '#materials') {
                    window.location.hash = ''
                    setTimeout(() => { window.location.hash = 'materials' }, 0)
                  } else {
                    window.location.hash = 'materials'
                  }
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
                  // Force navigation even if already on the same hash
                  if (window.location.hash === '#components') {
                    window.location.hash = ''
                    setTimeout(() => { window.location.hash = 'components' }, 0)
                  } else {
                    window.location.hash = 'components'
                  }
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
                  // Force navigation even if already on the same hash
                  if (window.location.hash === '#models') {
                    window.location.hash = ''
                    setTimeout(() => { window.location.hash = 'models' }, 0)
                  } else {
                    window.location.hash = 'models'
                  }
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
              <label>Cantidad disponible</label>
              <input
                type="number"
                value={editData.stock || 0}
                onChange={(e) => setEditData({ ...editData, stock: parseFloat(e.target.value) })}
              />
            </div>

            {selectedItem.tipo === 'material' && (
              <>
                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    value={editData.categoria || 'Silicona'}
                    onChange={(e) => setEditData({ ...editData, categoria: e.target.value })}
                  >
                    <option value="Silicona">Silicona</option>
                    <option value="Resina">Resina</option>
                    <option value="Filamentos">Filamentos</option>
                    <option value="Pegamentos">Pegamentos</option>
                    <option value="Aditivos">Aditivos</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Limpieza">Limpieza</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unidad Base de Fabricación</label>
                  <select
                    value={typeof editData.unidadBase === 'object' ? editData.unidadBase._id : editData.unidadBase}
                    onChange={(e) => setEditData({ ...editData, unidadBase: e.target.value })}
                  >
                    {units.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.nombre} ({unit.abreviatura})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Presentaciones de Compra</label>
                  <div className="presentaciones-editable">
                    {editData.presentaciones && editData.presentaciones.length > 0 ? (
                      editData.presentaciones.map((pres: any, idx: number) => (
                        <div key={idx} className="presentacion-item">
                          <div className="presentacion-info">
                            <strong>{pres.nombre}</strong>
                            <span>1 unidad = {pres.factorConversion} {getUnidadBase(selectedItem as Material)}</span>
                            {pres.precioCompra ? <span>Precio: ${pres.precioCompra}</span> : null}
                          </div>
                          <button
                            type="button"
                            className="remove-component-inline-btn"
                            onClick={() => {
                              const newPresentaciones = editData.presentaciones.filter((_: any, i: number) => i !== idx)
                              setEditData({ ...editData, presentaciones: newPresentaciones })
                            }}
                            title="Eliminar presentación"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="help-text">No hay presentaciones agregadas</p>
                    )}

                    {/* Formulario para agregar nueva presentación */}
                    <div className="add-presentacion-form">
                      <input
                        type="text"
                        placeholder="Nombre (ej: Frasco 2 libras)"
                        value={newPresentacion.nombre}
                        onChange={(e) => setNewPresentacion({ ...newPresentacion, nombre: e.target.value })}
                      />
                      <input
                        type="number"
                        placeholder="Factor de conversión"
                        value={newPresentacion.factorConversion || ''}
                        onChange={(e) => setNewPresentacion({ ...newPresentacion, factorConversion: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="number"
                        placeholder="Precio (opcional)"
                        value={newPresentacion.precioCompra || ''}
                        onChange={(e) => setNewPresentacion({ ...newPresentacion, precioCompra: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="1"
                      />
                      <button
                        type="button"
                        className="button-small"
                        onClick={() => {
                          if (!newPresentacion.nombre || newPresentacion.factorConversion <= 0) {
                            alert('Debes ingresar un nombre y un factor de conversión válido')
                            return
                          }
                          const currentPresentaciones = editData.presentaciones || []
                          setEditData({
                            ...editData,
                            presentaciones: [...currentPresentaciones, { ...newPresentacion }]
                          })
                          setNewPresentacion({ nombre: '', factorConversion: 0, precioCompra: 0 })
                        }}
                      >
                        ➕ Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedItem.tipo === 'component' && (
              <div className="form-group">
                <label>Materiales del componente</label>
                {editData.materiales && editData.materiales.length > 0 ? (
                  <div className="editable-components-list">
                    {editData.materiales.map((mat: any, idx: number) => {
                      // Extraer el ID y nombre del material
                      let materialId: string | null = null
                      let materialName = 'Material desconocido'
                      let materialUnit = ''

                      const matId = mat['materialId'] || mat['material']

                      if (matId && matId._id && matId.nombre) {
                        materialId = matId._id
                        materialName = matId.nombre
                        materialUnit = matId.unidadBase?.abreviatura || ''
                      } else if (matId && typeof matId === 'string') {
                        materialId = matId
                        const foundMat = allMaterials.find((m: any) => m._id === materialId)
                        if (foundMat) {
                          materialName = foundMat.nombre
                          const unit = foundMat.unidadBase
                          materialUnit = typeof unit === 'object' ? unit.abreviatura : ''
                        }
                      } else {
                        const matIdFromStruct = mat['materialId']?._id || mat['material']?._id
                        if (matIdFromStruct) {
                          const foundMat = allMaterials.find((m: any) => m._id === matIdFromStruct)
                          if (foundMat) {
                            materialName = foundMat.nombre
                            const unit = foundMat.unidadBase
                            materialUnit = typeof unit === 'object' ? unit.abreviatura : ''
                          }
                        }
                      }

                      return (
                        <div key={idx} className="editable-component-item">
                          <div className="component-info">
                            <span className="component-name-label">📦 {materialName} {materialUnit && `(${materialUnit})`}</span>
                            <div className="component-quantity-control">
                              <label>Cantidad:</label>
                              <input
                                type="number"
                                className="inline-quantity-input"
                                value={mat.cantidad}
                                onChange={(e) => {
                                  const newMaterials = [...editData.materiales]
                                  newMaterials[idx] = { ...newMaterials[idx], cantidad: parseInt(e.target.value) || 1 }
                                  setEditData({ ...editData, materiales: newMaterials })
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
                              const newMaterials = editData.materiales.filter((_: any, i: number) => i !== idx)
                              setEditData({ ...editData, materiales: newMaterials })
                            }}
                            title="Eliminar material"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="empty-components-msg">Este componente no tiene materiales</p>
                )}

                {/* Agregar nuevo material al componente */}
                {allMaterials.length > 0 && (
                  <div className="add-component-to-model">
                    <select
                      className="add-component-select"
                      onChange={(e) => {
                        if (e.target.value) {
                          const selectedMat = allMaterials.find((m: any) => m._id === e.target.value)
                          if (selectedMat) {
                            const newMaterials = editData.materiales || []
                            // Evitar duplicados
                            const exists = newMaterials.some((m: any) => {
                              const existingId =
                                (typeof m.materialId === 'string' ? m.materialId : m.materialId?._id) ||
                                (typeof m.material === 'string' ? m.material : m.material?._id)
                              return existingId === selectedMat._id
                            })

                            if (!exists) {
                              setEditData({
                                ...editData,
                                materiales: [
                                  ...newMaterials,
                                  { materialId: selectedMat._id, material: selectedMat, cantidad: 1 }
                                ]
                              })
                            } else {
                              alert('Este material ya está en el componente')
                            }
                          }
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">+ Agregar material...</option>
                      {allMaterials.map((m: any) => {
                        const unit = m.unidad
                        const unitText = typeof unit === 'object' && unit.abreviatura ? `(${unit.abreviatura})` : ''
                        return (
                          <option key={m._id} value={m._id}>
                            {m.nombre} {unitText}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}
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


                      // Acceso directo sin verificar typeof (problema de serialización)
                      // Usar notación de corchetes para evitar problemas con getters/setters
                      const compId = comp['componenteId']

                      if (compId && compId._id && compId.nombre) {
                        componentId = compId._id
                        componentName = compId.nombre
                      } else if (compId && typeof compId === 'string') {
                        // Si es string, buscar en allComponents
                        componentId = compId
                        const foundComp = allComponents.find((c: any) => c._id === componentId)
                        if (foundComp) {
                          componentName = foundComp.nombre
                        }
                      } else {
                        // Último intento: buscar por _id del componente
                        const compIdFromStruct = comp['componentId']?._id || comp['componenteId']
                        if (compIdFromStruct) {
                          const foundComp = allComponents.find((c: any) => c._id === compIdFromStruct)
                          if (foundComp) {
                            componentName = foundComp.nombre
                          }
                        }
                      }

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
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setNewPresentacion({ nombre: '', factorConversion: 0, precioCompra: 0 })
                }}
                className="button secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}