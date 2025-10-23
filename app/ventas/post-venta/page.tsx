'use client'

import { useState, useEffect } from 'react'

interface Cliente {
  _id: string
  nombre: string
  contacto?: string
  email?: string
  telefono?: string
}

interface Equipo {
  _id: string
  cliente: string
  modelo: string
  numeroSerie: string
  fechaEntrega: string
  proximaMantencion?: string
  piezasReportadas?: string
  notas?: string
}

export default function PostVenta() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'cliente' | 'equipo'>('cliente')
  const [formData, setFormData] = useState<any>({})

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [clientesRes, equiposRes] = await Promise.all([
        fetch(`${API_URL}/api/post-venta/clientes`),
        fetch(`${API_URL}/api/post-venta/equipos`)
      ])

      if (clientesRes.ok) setClientes(await clientesRes.json())
      if (equiposRes.ok) setEquipos(await equiposRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const openModal = (type: 'cliente' | 'equipo', data?: any) => {
    setModalType(type)
    setFormData(data || {})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const url = modalType === 'cliente'
      ? `${API_URL}/api/post-venta/clientes`
      : `${API_URL}/api/post-venta/equipos`

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

  const handleDelete = async (type: 'cliente' | 'equipo', id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return

    const url = type === 'cliente'
      ? `${API_URL}/api/post-venta/clientes/${id}`
      : `${API_URL}/api/post-venta/equipos/${id}`

    try {
      const res = await fetch(url, { method: 'DELETE' })
      if (res.ok) loadData()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const calcularProximaMantencion = (fechaEntrega: string) => {
    const fecha = new Date(fechaEntrega)
    fecha.setMonth(fecha.getMonth() + 6) // 6 meses después
    return fecha.toISOString().split('T')[0]
  }

  const esMantencionProxima = (fecha?: string) => {
    if (!fecha) return false
    const hoy = new Date()
    const mantencion = new Date(fecha)
    const diff = Math.floor((mantencion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return diff <= 30 && diff >= 0
  }

  return (
    <div className="page-container">
      <div className="page-header-minimal">
        <h1>Post-Venta</h1>
        <div className="header-actions-minimal">
          <button
            className="btn-minimal btn-primary-minimal"
            onClick={() => openModal('cliente')}
          >
            + Nuevo Cliente
          </button>
          <button
            className="btn-minimal btn-secondary-minimal"
            onClick={() => openModal('equipo')}
          >
            + Nuevo Equipo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Clientes</div>
          <div className="stat-value">{clientes.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Equipos Registrados</div>
          <div className="stat-value">{equipos.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Mantenciones Próximas</div>
          <div className="stat-value">
            {equipos.filter(e => esMantencionProxima(e.proximaMantencion)).length}
          </div>
        </div>
      </div>

      {/* Clientes Table */}
      <h2 style={{ color: '#60a5fa', marginBottom: '1rem', fontSize: '1.25rem' }}>👥 Clientes</h2>
      <div className="table-minimal-container">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Equipos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state-minimal">
                    <p>No hay clientes registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => {
                const equiposCliente = equipos.filter(e => e.cliente === cliente.nombre)
                return (
                  <tr key={cliente._id}>
                    <td className="cell-primary">{cliente.nombre}</td>
                    <td>{cliente.contacto || '-'}</td>
                    <td className="cell-secondary">{cliente.email || '-'}</td>
                    <td>{cliente.telefono || '-'}</td>
                    <td className="cell-number">{equiposCliente.length}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon-minimal"
                          onClick={() => openModal('cliente', cliente)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon-minimal danger"
                          onClick={() => handleDelete('cliente', cliente._id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Equipos Table */}
      <h2 style={{ color: '#60a5fa', marginBottom: '1rem', fontSize: '1.25rem', marginTop: '2rem' }}>🔧 Equipos</h2>
      <div className="table-minimal-container">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Modelo</th>
              <th>N° Serie</th>
              <th>Fecha Entrega</th>
              <th>Próxima Mantención</th>
              <th>Piezas Reportadas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {equipos.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state-minimal">
                    <p>No hay equipos registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              equipos.map((equipo) => (
                <tr key={equipo._id}>
                  <td className="cell-primary">{equipo.cliente}</td>
                  <td>{equipo.modelo}</td>
                  <td className="cell-number">{equipo.numeroSerie}</td>
                  <td className="cell-date">{new Date(equipo.fechaEntrega).toLocaleDateString()}</td>
                  <td className="cell-date">
                    {equipo.proximaMantencion ? (
                      <span className={esMantencionProxima(equipo.proximaMantencion) ? 'badge-minimal badge-warning' : ''}>
                        {new Date(equipo.proximaMantencion).toLocaleDateString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="cell-secondary">{equipo.piezasReportadas || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-icon-minimal"
                        onClick={() => openModal('equipo', equipo)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon-minimal danger"
                        onClick={() => handleDelete('equipo', equipo._id)}
                        title="Eliminar"
                      >
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

      {/* Modal */}
      {showModal && (
        <div className="modal-minimal" onClick={closeModal}>
          <div className="modal-content-minimal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-minimal">
              <h2>{formData._id ? 'Editar' : 'Nuevo'} {modalType === 'cliente' ? 'Cliente' : 'Equipo'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {modalType === 'cliente' ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="form-group-minimal">
                    <label>Cliente *</label>
                    <select
                      value={formData.cliente || ''}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      required
                    >
                      <option value="">Seleccionar cliente...</option>
                      {clientes.map(c => (
                        <option key={c._id} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group-minimal">
                    <label>Modelo *</label>
                    <input
                      type="text"
                      value={formData.modelo || ''}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>N° Serie *</label>
                    <input
                      type="text"
                      value={formData.numeroSerie || ''}
                      onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>Fecha Entrega *</label>
                    <input
                      type="date"
                      value={formData.fechaEntrega || ''}
                      onChange={(e) => {
                        const fecha = e.target.value
                        setFormData({
                          ...formData,
                          fechaEntrega: fecha,
                          proximaMantencion: calcularProximaMantencion(fecha)
                        })
                      }}
                      required
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>Próxima Mantención</label>
                    <input
                      type="date"
                      value={formData.proximaMantencion || ''}
                      onChange={(e) => setFormData({ ...formData, proximaMantencion: e.target.value })}
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>Piezas Reportadas</label>
                    <textarea
                      value={formData.piezasReportadas || ''}
                      onChange={(e) => setFormData({ ...formData, piezasReportadas: e.target.value })}
                      placeholder="Ej: Bomba #123, Sensor #456..."
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>Notas</label>
                    <textarea
                      value={formData.notas || ''}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    />
                  </div>
                </>
              )}

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
