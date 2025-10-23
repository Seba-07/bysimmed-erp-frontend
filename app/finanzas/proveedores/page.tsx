'use client'

import { useState, useEffect } from 'react'

interface Proveedor {
  _id: string
  nombre: string
  rut?: string
  contacto?: string
  email?: string
  telefono?: string
  direccion?: string
  categoria: string
  activo: boolean
  notas?: string
}

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [filter, setFilter] = useState('all')

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/finanzas/proveedores`)
      if (res.ok) setProveedores(await res.json())
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const openModal = (data?: any) => {
    setFormData(data || { activo: true, categoria: 'materiales' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = `${API_URL}/api/finanzas/proveedores`
    const method = formData._id ? 'PUT' : 'POST'
    const endpoint = formData._id ? `${url}/${formData._id}` : url

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        loadData()
        closeModal()
      }
    } catch (error) {
      console.error('Error saving:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return
    try {
      const res = await fetch(`${API_URL}/api/finanzas/proveedores/${id}`, { method: 'DELETE' })
      if (res.ok) loadData()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const filteredProveedores = proveedores.filter(p => {
    if (filter === 'all') return true
    if (filter === 'activos') return p.activo
    if (filter === 'inactivos') return !p.activo
    return p.categoria === filter
  })

  return (
    <div className="page-container">
      <div className="page-header-minimal">
        <h1>Proveedores</h1>
        <div className="header-actions-minimal">
          <button className="btn-minimal btn-primary-minimal" onClick={() => openModal()}>
            + Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Proveedores</div>
          <div className="stat-value">{proveedores.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Activos</div>
          <div className="stat-value">{proveedores.filter(p => p.activo).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Materiales</div>
          <div className="stat-value">{proveedores.filter(p => p.categoria === 'materiales').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Componentes</div>
          <div className="stat-value">{proveedores.filter(p => p.categoria === 'componentes').length}</div>
        </div>
      </div>

      <div className="filter-bar-minimal">
        <select className="select-minimal" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
          <option value="materiales">Materiales</option>
          <option value="componentes">Componentes</option>
          <option value="servicios">Servicios</option>
          <option value="otros">Otros</option>
        </select>
      </div>

      <div className="table-minimal-container">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProveedores.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state-minimal">
                    <p>No hay proveedores registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProveedores.map((prov) => (
                <tr key={prov._id}>
                  <td className="cell-primary">{prov.nombre}</td>
                  <td className="cell-secondary">{prov.rut || '-'}</td>
                  <td>{prov.contacto || '-'}</td>
                  <td className="cell-secondary">{prov.email || '-'}</td>
                  <td>{prov.telefono || '-'}</td>
                  <td>
                    <span className="badge-minimal badge-info">{prov.categoria}</span>
                  </td>
                  <td>
                    <span className={`badge-minimal ${prov.activo ? 'badge-success' : 'badge-neutral'}`}>
                      {prov.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon-minimal" onClick={() => openModal(prov)} title="Editar">
                        ✏️
                      </button>
                      <button className="btn-icon-minimal danger" onClick={() => handleDelete(prov._id)} title="Eliminar">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-minimal" onClick={closeModal}>
          <div className="modal-content-minimal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-minimal">
              <h2>{formData._id ? 'Editar' : 'Nuevo'} Proveedor</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
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
                <label>RUT</label>
                <input
                  type="text"
                  value={formData.rut || ''}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                />
              </div>
              <div className="form-group-minimal">
                <label>Contacto</label>
                <input
                  type="text"
                  value={formData.contacto || ''}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                />
              </div>
              <div className="form-group-minimal">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group-minimal">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono || ''}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div className="form-group-minimal">
                <label>Dirección</label>
                <input
                  type="text"
                  value={formData.direccion || ''}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>
              <div className="form-group-minimal">
                <label>Categoría *</label>
                <select
                  value={formData.categoria || 'materiales'}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  required
                >
                  <option value="materiales">Materiales</option>
                  <option value="componentes">Componentes</option>
                  <option value="servicios">Servicios</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div className="form-group-minimal">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.activo !== false}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Activo
                </label>
              </div>
              <div className="form-group-minimal">
                <label>Notas</label>
                <textarea
                  value={formData.notas || ''}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-minimal btn-secondary-minimal" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-minimal btn-primary-minimal">
                  {formData._id ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
