'use client'

import { useState, useEffect } from 'react'

interface Modelo {
  _id: string
  codigo: string
  nombre: string
  descripcion?: string
  imagen?: string
  stock: number
  stockMinimo: number
  precioVenta: number
  activo: boolean
}

interface Componente {
  _id: string
  codigo: string
  nombre: string
  descripcion?: string
  stock: number
  stockMinimo: number
  precioVenta: number
  activo: boolean
}

interface Material {
  _id: string
  codigo: string
  nombre: string
  descripcion?: string
  unidadMedida: string
  stock: number
  stockMinimo: number
  precioUnitario: number
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

  const openModal = (item?: any) => {
    setFormData(item || { activo: true })
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
              <th>Descripción</th>
              {tab === 'materiales' && <th>Unidad</th>}
              <th>Stock</th>
              <th>Stock Mín.</th>
              <th>{tab === 'materiales' ? 'Precio Unit.' : 'Precio Venta'}</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={tab === 'materiales' ? 9 : 8}>
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
                  <td className="cell-secondary">{item.descripcion || '-'}</td>
                  {tab === 'materiales' && <td>{item.unidadMedida}</td>}
                  <td className="cell-number" style={{ color: item.stock <= item.stockMinimo ? 'var(--danger)' : 'inherit' }}>
                    {item.stock}
                  </td>
                  <td className="cell-number">{item.stockMinimo}</td>
                  <td className="cell-number">${(tab === 'materiales' ? item.precioUnitario : item.precioVenta).toLocaleString()}</td>
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
          <div className="modal-content-minimal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-minimal">
              <h2>{formData._id ? 'Editar' : 'Nuevo'} {tab === 'modelos' ? 'Modelo' : tab === 'componentes' ? 'Componente' : 'Material'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group-minimal">
                <label>Código *</label>
                <input
                  type="text"
                  value={formData.codigo || ''}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  required
                  maxLength={10}
                />
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

              <div className="form-group-minimal">
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              {tab === 'materiales' && (
                <div className="form-group-minimal">
                  <label>Unidad de Medida *</label>
                  <select
                    value={formData.unidadMedida || ''}
                    onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                    required
                  >
                    <option value="">Selecciona</option>
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="g">Gramo (g)</option>
                    <option value="litro">Litro</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="metro">Metro (m)</option>
                    <option value="cm">Centímetro (cm)</option>
                    <option value="mm">Milímetro (mm)</option>
                  </select>
                </div>
              )}

              <div className="form-group-minimal">
                <label>Stock *</label>
                <input
                  type="number"
                  value={formData.stock || 0}
                  onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group-minimal">
                <label>Stock Mínimo</label>
                <input
                  type="number"
                  value={formData.stockMinimo || 0}
                  onChange={(e) => setFormData({ ...formData, stockMinimo: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group-minimal">
                <label>{tab === 'materiales' ? 'Precio Unitario *' : 'Precio de Venta *'}</label>
                <input
                  type="number"
                  value={tab === 'materiales' ? (formData.precioUnitario || 0) : (formData.precioVenta || 0)}
                  onChange={(e) => setFormData({
                    ...formData,
                    [tab === 'materiales' ? 'precioUnitario' : 'precioVenta']: parseFloat(e.target.value)
                  })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

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
