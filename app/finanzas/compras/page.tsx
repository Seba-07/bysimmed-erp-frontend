'use client'

import { useState, useEffect } from 'react'

interface ItemCompra {
  producto: string
  cantidad: number
  unidad: string
  precioUnitario: number
}

interface SolicitudCompra {
  _id: string
  numeroSolicitud: string
  proveedor: string
  fechaSolicitud: string
  fechaEntregaEstimada?: string
  items: ItemCompra[]
  montoTotal: number
  estado: string
  solicitadoPor: string
  aprobadoPor?: string
  fechaAprobacion?: string
  notas?: string
}

export default function Compras() {
  const [compras, setCompras] = useState<SolicitudCompra[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<any>({ items: [{ producto: '', cantidad: 1, unidad: '', precioUnitario: 0 }] })
  const [filter, setFilter] = useState('all')

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [comprasRes, provRes] = await Promise.all([
        fetch(`${API_URL}/api/finanzas/compras`),
        fetch(`${API_URL}/api/finanzas/proveedores`)
      ])
      if (comprasRes.ok) setCompras(await comprasRes.json())
      if (provRes.ok) setProveedores(await provRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const openModal = (data?: any) => {
    setFormData(data || {
      estado: 'pendiente',
      solicitadoPor: 'Usuario',
      items: [{ producto: '', cantidad: 1, unidad: 'unidad', precioUnitario: 0 }]
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({ items: [] })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = `${API_URL}/api/finanzas/compras`
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
    if (!confirm('¿Estás seguro de eliminar esta solicitud?')) return
    try {
      const res = await fetch(`${API_URL}/api/finanzas/compras/${id}`, { method: 'DELETE' })
      if (res.ok) loadData()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { producto: '', cantidad: 1, unidad: 'unidad', precioUnitario: 0 }]
    })
  }

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const calcularTotal = () => {
    return formData.items.reduce((sum: number, item: ItemCompra) =>
      sum + (item.cantidad * item.precioUnitario), 0
    )
  }

  const filteredCompras = compras.filter(c => {
    if (filter === 'all') return true
    return c.estado === filter
  })

  return (
    <div className="page-container">
      <div className="page-header-minimal">
        <h1>Compras</h1>
        <div className="header-actions-minimal">
          <button className="btn-minimal btn-primary-minimal" onClick={() => openModal()}>
            + Nueva Solicitud
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Solicitudes</div>
          <div className="stat-value">{compras.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value">{compras.filter(c => c.estado === 'pendiente').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Aprobadas</div>
          <div className="stat-value">{compras.filter(c => c.estado === 'aprobada').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monto Total</div>
          <div className="stat-value">
            ${compras.reduce((sum, c) => sum + c.montoTotal, 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="filter-bar-minimal">
        <select className="select-minimal" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todas</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobada">Aprobadas</option>
          <option value="rechazada">Rechazadas</option>
          <option value="recibida">Recibidas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>

      <div className="table-minimal-container">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>N° Solicitud</th>
              <th>Proveedor</th>
              <th>Fecha Solicitud</th>
              <th>Entrega Estimada</th>
              <th>Items</th>
              <th>Monto Total</th>
              <th>Estado</th>
              <th>Solicitado Por</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompras.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state-minimal">
                    <p>No hay solicitudes de compra</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCompras.map((compra) => (
                <tr key={compra._id}>
                  <td className="cell-primary">{compra.numeroSolicitud}</td>
                  <td>{compra.proveedor}</td>
                  <td className="cell-date">{new Date(compra.fechaSolicitud).toLocaleDateString()}</td>
                  <td className="cell-date">
                    {compra.fechaEntregaEstimada ? new Date(compra.fechaEntregaEstimada).toLocaleDateString() : '-'}
                  </td>
                  <td className="cell-number">{compra.items.length} items</td>
                  <td className="cell-number">${compra.montoTotal.toLocaleString()}</td>
                  <td>
                    <span className={`badge-minimal ${
                      compra.estado === 'aprobada' ? 'badge-success' :
                      compra.estado === 'pendiente' ? 'badge-warning' :
                      compra.estado === 'recibida' ? 'badge-info' :
                      compra.estado === 'rechazada' || compra.estado === 'cancelada' ? 'badge-danger' :
                      'badge-neutral'
                    }`}>
                      {compra.estado}
                    </span>
                  </td>
                  <td className="cell-secondary">{compra.solicitadoPor}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon-minimal" onClick={() => openModal(compra)} title="Editar">
                        ✏️
                      </button>
                      <button className="btn-icon-minimal danger" onClick={() => handleDelete(compra._id)} title="Eliminar">
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
          <div className="modal-content-minimal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header-minimal">
              <h2>{formData._id ? 'Editar' : 'Nueva'} Solicitud de Compra</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group-minimal">
                  <label>N° Solicitud *</label>
                  <input
                    type="text"
                    value={formData.numeroSolicitud || ''}
                    onChange={(e) => setFormData({ ...formData, numeroSolicitud: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-minimal">
                  <label>Proveedor *</label>
                  <select
                    value={formData.proveedor || ''}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {proveedores.filter(p => p.activo).map(p => (
                      <option key={p._id} value={p.nombre}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group-minimal">
                  <label>Fecha Solicitud *</label>
                  <input
                    type="date"
                    value={formData.fechaSolicitud || ''}
                    onChange={(e) => setFormData({ ...formData, fechaSolicitud: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-minimal">
                  <label>Fecha Entrega Estimada</label>
                  <input
                    type="date"
                    value={formData.fechaEntregaEstimada || ''}
                    onChange={(e) => setFormData({ ...formData, fechaEntregaEstimada: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group-minimal">
                  <label>Solicitado Por *</label>
                  <input
                    type="text"
                    value={formData.solicitadoPor || ''}
                    onChange={(e) => setFormData({ ...formData, solicitadoPor: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-minimal">
                  <label>Estado *</label>
                  <select
                    value={formData.estado || 'pendiente'}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    required
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="rechazada">Rechazada</option>
                    <option value="recibida">Recibida</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="form-group-minimal">
                <label>Items *</label>
                <div style={{ border: '1px solid #334155', borderRadius: '8px', padding: '1rem', background: '#0f172a' }}>
                  {formData.items?.map((item: ItemCompra, index: number) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        placeholder="Producto"
                        value={item.producto}
                        onChange={(e) => updateItem(index, 'producto', e.target.value)}
                        required
                        style={{ padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f1f5f9' }}
                      />
                      <input
                        type="number"
                        placeholder="Cantidad"
                        value={item.cantidad}
                        onChange={(e) => updateItem(index, 'cantidad', parseFloat(e.target.value))}
                        required
                        style={{ padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f1f5f9' }}
                      />
                      <input
                        type="text"
                        placeholder="Unidad"
                        value={item.unidad}
                        onChange={(e) => updateItem(index, 'unidad', e.target.value)}
                        required
                        style={{ padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f1f5f9' }}
                      />
                      <input
                        type="number"
                        placeholder="Precio"
                        value={item.precioUnitario}
                        onChange={(e) => updateItem(index, 'precioUnitario', parseFloat(e.target.value))}
                        required
                        style={{ padding: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f1f5f9' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        style={{ padding: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn-minimal btn-secondary-minimal"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    + Agregar Item
                  </button>
                  <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                    Total: ${calcularTotal().toLocaleString()}
                  </div>
                </div>
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
