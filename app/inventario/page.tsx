'use client'

import { useState, useEffect } from 'react'

interface Material {
  _id: string
  codigo: string
  nombre: string
  unidadCompra: string
  unidadFabricacion: string
  factorConversion: number
  stock: number
  stockMinimo: number
  precioCompra: number
  activo: boolean
}

interface Componente {
  _id: string
  codigo: string
  nombre: string
  materiales: { materialId: string; cantidad: number }[]
  stock: number
  precioVenta: number
  activo: boolean
}

interface Modelo {
  _id: string
  codigo: string
  nombre: string
  componentes: { componenteId: string; cantidad: number }[]
  imagen?: string
  stock: number
  precioVenta: number
  activo: boolean
}

export default function Inventario() {
  const [tab, setTab] = useState<'modelos' | 'componentes' | 'materiales'>('modelos')
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [componentes, setComponentes] = useState<Componente[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<any>({})

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  // Helper function to format price display
  const formatPrice = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return ''
    return num.toLocaleString('es-CL')
  }

  // Helper function to parse formatted price back to number
  const parseFormattedPrice = (value: string): number => {
    const cleaned = value.replace(/\./g, '').replace(/,/g, '.')
    return parseFloat(cleaned) || 0
  }

  useEffect(() => {
    loadData()
  }, [tab])

  const loadData = async () => {
    try {
      const endpoint = tab === 'modelos' ? '/api/inventario/modelos'
        : tab === 'componentes' ? '/api/inventario/componentes'
        : '/api/inventario/materiales'

      const res = await fetch(`${API_URL}${endpoint}`)
      if (res.ok) {
        const data = await res.json()
        if (tab === 'modelos') setModelos(data)
        else if (tab === 'componentes') setComponentes(data)
        else setMateriales(data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadAllData = async () => {
    try {
      const [modelosRes, componentesRes, materialesRes] = await Promise.all([
        fetch(`${API_URL}/api/inventario/modelos`),
        fetch(`${API_URL}/api/inventario/componentes`),
        fetch(`${API_URL}/api/inventario/materiales`)
      ])

      if (modelosRes.ok) setModelos(await modelosRes.json())
      if (componentesRes.ok) setComponentes(await componentesRes.json())
      if (materialesRes.ok) setMateriales(await materialesRes.json())
    } catch (error) {
      console.error('Error loading all data:', error)
    }
  }

  const openModal = async (item?: any) => {
    await loadAllData() // Load all data for selectors

    if (item) {
      setFormData({
        ...item,
        materiales: item.materiales || [],
        componentes: item.componentes || []
      })
    } else {
      // Get next codigo
      const endpoint = tab === 'modelos' ? '/api/inventario/modelos/next-codigo'
        : tab === 'componentes' ? '/api/inventario/componentes/next-codigo'
        : '/api/inventario/materiales/next-codigo'

      try {
        const res = await fetch(`${API_URL}${endpoint}`)
        if (res.ok) {
          const data = await res.json()
          const baseData = { activo: true, codigo: data.codigo }
          if (tab === 'componentes') {
            setFormData({ ...baseData, materiales: [] })
          } else if (tab === 'modelos') {
            setFormData({ ...baseData, componentes: [] })
          } else {
            setFormData(baseData)
          }
        }
      } catch (error) {
        const baseData = { activo: true }
        if (tab === 'componentes') {
          setFormData({ ...baseData, materiales: [] })
        } else if (tab === 'modelos') {
          setFormData({ ...baseData, componentes: [] })
        } else {
          setFormData(baseData)
        }
      }
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const endpoint = tab === 'modelos' ? '/api/inventario/modelos'
      : tab === 'componentes' ? '/api/inventario/componentes'
      : '/api/inventario/materiales'

    const method = formData._id ? 'PUT' : 'POST'
    const url = formData._id ? `${API_URL}${endpoint}/${formData._id}` : `${API_URL}${endpoint}`

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        loadData()
        closeModal()
      } else {
        const error = await res.json()
        alert(error.message || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Error de conexión')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return

    const endpoint = tab === 'modelos' ? '/api/inventario/modelos'
      : tab === 'componentes' ? '/api/inventario/componentes'
      : '/api/inventario/materiales'

    try {
      const res = await fetch(`${API_URL}${endpoint}/${id}`, { method: 'DELETE' })
      if (res.ok) loadData()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const currentData = tab === 'modelos' ? modelos : tab === 'componentes' ? componentes : materiales

  return (
    <div className="page-container">
      <div className="page-header-minimal">
        <h1>Inventario</h1>
        <button className="btn-minimal btn-primary-minimal" onClick={() => openModal()}>
          + Nuevo {tab === 'modelos' ? 'Modelo' : tab === 'componentes' ? 'Componente' : 'Material'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-secondary)' }}>
        <button
          onClick={() => setTab('modelos')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'modelos' ? '2px solid var(--primary)' : '2px solid transparent',
            color: tab === 'modelos' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: tab === 'modelos' ? 600 : 400,
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          📦 Modelos
        </button>
        <button
          onClick={() => setTab('componentes')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'componentes' ? '2px solid var(--primary)' : '2px solid transparent',
            color: tab === 'componentes' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: tab === 'componentes' ? 600 : 400,
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          🔧 Componentes
        </button>
        <button
          onClick={() => setTab('materiales')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'materiales' ? '2px solid var(--primary)' : '2px solid transparent',
            color: tab === 'materiales' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: tab === 'materiales' ? 600 : 400,
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          🧱 Materiales
        </button>
      </div>

      {/* Table */}
      <div className="table-minimal-container">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              {tab === 'modelos' && <th>Componentes</th>}
              {tab === 'componentes' && <th>Materiales</th>}
              {tab === 'materiales' && <th>Unidad Compra</th>}
              {tab === 'materiales' && <th>Unidad Fabr.</th>}
              {tab === 'materiales' && <th>Conversión</th>}
              <th>Stock</th>
              {tab === 'materiales' && <th>Stock Mín.</th>}
              <th>{tab === 'materiales' ? 'Precio Compra' : 'Precio Venta'}</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={tab === 'materiales' ? 11 : 7}>
                  <div className="empty-state-minimal">
                    <p>No hay {tab} registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((item: any) => (
                <tr key={item._id}>
                  <td className="cell-primary">{item.codigo}</td>
                  <td className="cell-secondary">{item.nombre}</td>
                  {tab === 'modelos' && <td className="cell-number">{item.componentes?.length || 0}</td>}
                  {tab === 'componentes' && <td className="cell-number">{item.materiales?.length || 0}</td>}
                  {tab === 'materiales' && <td>{item.unidadCompra}</td>}
                  {tab === 'materiales' && <td>{item.unidadFabricacion}</td>}
                  {tab === 'materiales' && <td className="cell-number">{item.factorConversion}</td>}
                  <td className="cell-number" style={{ color: tab === 'materiales' && item.stock <= item.stockMinimo ? 'var(--danger)' : 'inherit' }}>
                    {item.stock}
                  </td>
                  {tab === 'materiales' && <td className="cell-number">{item.stockMinimo}</td>}
                  <td className="cell-number">${(tab === 'materiales' ? item.precioCompra : item.precioVenta).toLocaleString()}</td>
                  <td>
                    <span className={`badge-minimal ${item.activo ? 'badge-success' : 'badge-secondary'}`}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon-minimal" onClick={() => openModal(item)} title="Editar">✏️</button>
                      <button className="btn-icon-minimal danger" onClick={() => handleDelete(item._id)} title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-minimal" onClick={closeModal}>
          <div className="modal-content-minimal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header-minimal">
              <h2>{formData._id ? 'Editar' : 'Nuevo'} {tab === 'modelos' ? 'Modelo' : tab === 'componentes' ? 'Componente' : 'Material'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group-minimal">
                <label>Código</label>
                <input
                  type="text"
                  value={formData.codigo || ''}
                  readOnly
                  style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  Generado automáticamente
                </small>
              </div>

              <div className="form-group-minimal">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre || ''}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              {tab === 'materiales' && (
                <>
                  <div className="form-group-minimal">
                    <label>Unidad de Compra *</label>
                    <input
                      type="text"
                      value={formData.unidadCompra || ''}
                      onChange={(e) => setFormData({ ...formData, unidadCompra: e.target.value })}
                      required
                      placeholder="Ej: Frasco 3kg, Caja 10 unidades, etc"
                    />
                  </div>

                  <div className="form-group-minimal">
                    <label>Unidad de Fabricación *</label>
                    <select
                      value={formData.unidadFabricacion || ''}
                      onChange={(e) => setFormData({ ...formData, unidadFabricacion: e.target.value })}
                      required
                    >
                      <option value="">Selecciona</option>
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="g">Gramo (g)</option>
                      <option value="litro">Litro</option>
                      <option value="ml">Mililitro (ml)</option>
                      <option value="metro">Metro (m)</option>
                      <option value="cm">Centímetro (cm)</option>
                      <option value="mm">Milímetro (mm)</option>
                      <option value="unidad">Unidad</option>
                    </select>
                  </div>

                  <div className="form-group-minimal">
                    <label>Factor de Conversión *</label>
                    <input
                      type="number"
                      value={formData.factorConversion ?? ''}
                      onChange={(e) => setFormData({ ...formData, factorConversion: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      required
                      min="0"
                      step="0.01"
                      placeholder="1"
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      Ejemplo: Si compras un frasco de 3kg, el factor es 3000 (para gramos)
                    </small>
                  </div>

                  <div className="form-group-minimal">
                    <label>Stock Actual *</label>
                    <input
                      type="number"
                      value={formData.stock ?? ''}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group-minimal">
                    <label>Stock Mínimo *</label>
                    <input
                      type="number"
                      value={formData.stockMinimo ?? ''}
                      onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group-minimal">
                    <label>Precio de Compra (CLP) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)',
                        pointerEvents: 'none'
                      }}>$</span>
                      <input
                        type="text"
                        value={formData.precioCompra ? formatPrice(formData.precioCompra) : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          setFormData({ ...formData, precioCompra: value === '' ? '' : parseFloat(value) })
                        }}
                        required
                        placeholder="0"
                        style={{ paddingLeft: '28px' }}
                      />
                    </div>
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      Precio por unidad de compra
                    </small>
                  </div>
                </>
              )}

              {tab === 'componentes' && (
                <>
                  <div className="form-group-minimal">
                    <label>Stock Actual *</label>
                    <input
                      type="number"
                      value={formData.stock ?? ''}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      required
                      min="0"
                      step="1"
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group-minimal">
                    <label>Precio de Venta (CLP) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)',
                        pointerEvents: 'none'
                      }}>$</span>
                      <input
                        type="text"
                        value={formData.precioVenta ? formatPrice(formData.precioVenta) : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          setFormData({ ...formData, precioVenta: value === '' ? '' : parseFloat(value) })
                        }}
                        required
                        placeholder="0"
                        style={{ paddingLeft: '28px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group-minimal">
                    <label>Materiales que componen este componente</label>
                    {formData.materiales && formData.materiales.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        {formData.materiales.map((mat: any, idx: number) => {
                          const material = materiales.find(m => m._id === mat.materialId)
                          return (
                            <div key={idx} style={{
                              display: 'flex',
                              gap: '0.5rem',
                              alignItems: 'center',
                              padding: '0.5rem',
                              backgroundColor: 'var(--bg-secondary)',
                              borderRadius: '4px',
                              marginBottom: '0.5rem'
                            }}>
                              <span style={{ flex: 1 }}>{material?.nombre || 'Material desconocido'}</span>
                              <span style={{ color: 'var(--text-secondary)' }}>{mat.cantidad} {material?.unidadFabricacion}</span>
                              <button
                                type="button"
                                className="btn-icon-minimal danger"
                                onClick={() => {
                                  const newMateriales = formData.materiales.filter((_: any, i: number) => i !== idx)
                                  setFormData({ ...formData, materiales: newMateriales })
                                }}
                              >×</button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        id="materialSelect"
                        style={{ flex: 1 }}
                      >
                        <option value="">Seleccionar material</option>
                        {materiales.filter(m => m.activo).map(material => (
                          <option key={material._id} value={material._id}>
                            {material.nombre} ({material.unidadFabricacion})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        id="materialCantidad"
                        placeholder="Cantidad"
                        min="0"
                        step="0.01"
                        style={{ width: '120px' }}
                      />
                      <button
                        type="button"
                        className="btn-minimal btn-secondary-minimal"
                        onClick={() => {
                          const select = document.getElementById('materialSelect') as HTMLSelectElement
                          const input = document.getElementById('materialCantidad') as HTMLInputElement
                          if (select.value && input.value) {
                            const newMaterial = {
                              materialId: select.value,
                              cantidad: parseFloat(input.value)
                            }
                            setFormData({
                              ...formData,
                              materiales: [...(formData.materiales || []), newMaterial]
                            })
                            select.value = ''
                            input.value = ''
                          }
                        }}
                      >+ Agregar</button>
                    </div>
                  </div>
                </>
              )}

              {tab === 'modelos' && (
                <>
                  <div className="form-group-minimal">
                    <label>Stock Actual *</label>
                    <input
                      type="number"
                      value={formData.stock ?? ''}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      required
                      min="0"
                      step="1"
                      placeholder="0"
                    />
                  </div>

                  <div className="form-group-minimal">
                    <label>Precio de Venta (CLP) *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)',
                        pointerEvents: 'none'
                      }}>$</span>
                      <input
                        type="text"
                        value={formData.precioVenta ? formatPrice(formData.precioVenta) : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          setFormData({ ...formData, precioVenta: value === '' ? '' : parseFloat(value) })
                        }}
                        required
                        placeholder="0"
                        style={{ paddingLeft: '28px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group-minimal">
                    <label>Componentes que forman este modelo</label>
                    {formData.componentes && formData.componentes.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        {formData.componentes.map((comp: any, idx: number) => {
                          const componente = componentes.find(c => c._id === comp.componenteId)
                          return (
                            <div key={idx} style={{
                              display: 'flex',
                              gap: '0.5rem',
                              alignItems: 'center',
                              padding: '0.5rem',
                              backgroundColor: 'var(--bg-secondary)',
                              borderRadius: '4px',
                              marginBottom: '0.5rem'
                            }}>
                              <span style={{ flex: 1 }}>{componente?.nombre || 'Componente desconocido'}</span>
                              <span style={{ color: 'var(--text-secondary)' }}>{comp.cantidad} unidad(es)</span>
                              <button
                                type="button"
                                className="btn-icon-minimal danger"
                                onClick={() => {
                                  const newComponentes = formData.componentes.filter((_: any, i: number) => i !== idx)
                                  setFormData({ ...formData, componentes: newComponentes })
                                }}
                              >×</button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        id="componenteSelect"
                        style={{ flex: 1 }}
                      >
                        <option value="">Seleccionar componente</option>
                        {componentes.filter(c => c.activo).map(componente => (
                          <option key={componente._id} value={componente._id}>
                            {componente.nombre}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        id="componenteCantidad"
                        placeholder="Cantidad"
                        min="1"
                        step="1"
                        style={{ width: '120px' }}
                      />
                      <button
                        type="button"
                        className="btn-minimal btn-secondary-minimal"
                        onClick={() => {
                          const select = document.getElementById('componenteSelect') as HTMLSelectElement
                          const input = document.getElementById('componenteCantidad') as HTMLInputElement
                          if (select.value && input.value) {
                            const newComponente = {
                              componenteId: select.value,
                              cantidad: parseInt(input.value)
                            }
                            setFormData({
                              ...formData,
                              componentes: [...(formData.componentes || []), newComponente]
                            })
                            select.value = ''
                            input.value = ''
                          }
                        }}
                      >+ Agregar</button>
                    </div>
                  </div>
                </>
              )}

              <div className="form-group-minimal">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.activo !== false}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                  Activo
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-minimal btn-secondary-minimal" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-minimal btn-primary-minimal">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
