'use client'

import { useState, useEffect } from 'react'

interface Cotizacion {
  _id: string
  numero: string
  numeroRecotizacion?: number
  cliente: string
  fechaSolicitud: string
  fechaEnvio?: string
  fechaAceptacion?: string
  estado: 'solicitada' | 'enviada' | 'aceptada' | 'rechazada'
  monto?: number
  notas?: string
}

interface OrdenCompra {
  _id: string
  numeroCotizacion: string
  numeroOC: string
  fechaEmision: string
  fechaPago?: string
  monto: number
  estado: 'pendiente' | 'pagada'
}

export default function ControlVentas() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'cotizacion' | 'orden'>('cotizacion')
  const [formData, setFormData] = useState<any>({})

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [cotRes, ocRes] = await Promise.all([
        fetch(`${API_URL}/api/ventas/cotizaciones`),
        fetch(`${API_URL}/api/ventas/ordenes-compra`)
      ])

      if (cotRes.ok) {
        const data = await cotRes.json()
        setCotizaciones(data)
      }

      if (ocRes.ok) {
        const data = await ocRes.json()
        setOrdenesCompra(data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const openModal = (type: 'cotizacion' | 'orden', data?: any) => {
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

    const url = modalType === 'cotizacion'
      ? `${API_URL}/api/ventas/cotizaciones`
      : `${API_URL}/api/ventas/ordenes-compra`

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

  const handleDelete = async (type: 'cotizacion' | 'orden', id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return

    const url = type === 'cotizacion'
      ? `${API_URL}/api/ventas/cotizaciones/${id}`
      : `${API_URL}/api/ventas/ordenes-compra/${id}`

    try {
      const res = await fetch(url, { method: 'DELETE' })
      if (res.ok) loadData()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const crearRecotizacion = (cotizacion: Cotizacion) => {
    const numeroRecotizacion = (cotizacion.numeroRecotizacion || 0) + 1
    openModal('cotizacion', {
      numero: cotizacion.numero,
      numeroRecotizacion,
      cliente: cotizacion.cliente,
      estado: 'solicitada'
    })
  }

  const calcularDiasCiclo = (cot: Cotizacion, oc?: OrdenCompra) => {
    if (!cot.fechaSolicitud) return null
    const inicio = new Date(cot.fechaSolicitud)
    const fin = oc?.fechaPago ? new Date(oc.fechaPago) : new Date()
    const diff = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="page-container">
      <div className="page-header-minimal">
        <h1>Control de Ventas</h1>
        <div className="header-actions-minimal">
          <button
            className="btn-minimal btn-primary-minimal"
            onClick={() => openModal('cotizacion')}
          >
            + Nueva Cotización
          </button>
          <button
            className="btn-minimal btn-secondary-minimal"
            onClick={() => openModal('orden')}
          >
            + Nueva OC
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Cotizaciones Activas</div>
          <div className="stat-value">{cotizaciones.filter(c => c.estado !== 'rechazada').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Aceptadas</div>
          <div className="stat-value">{cotizaciones.filter(c => c.estado === 'aceptada').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">OC Pendientes</div>
          <div className="stat-value">{ordenesCompra.filter(o => o.estado === 'pendiente').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Facturado</div>
          <div className="stat-value">
            ${ordenesCompra.filter(o => o.estado === 'pagada').reduce((sum, o) => sum + o.monto, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Cotizaciones Table */}
      <h2 style={{ color: '#60a5fa', marginBottom: '1rem', fontSize: '1.25rem' }}>📋 Cotizaciones</h2>
      <div className="table-minimal-container">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>N° Cotización</th>
              <th>Cliente</th>
              <th>Fecha Solicitud</th>
              <th>Fecha Envío</th>
              <th>Fecha Aceptación</th>
              <th>Estado</th>
              <th>Monto</th>
              <th>Ciclo (días)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state-minimal">
                    <p>No hay cotizaciones registradas</p>
                  </div>
                </td>
              </tr>
            ) : (
              cotizaciones.map((cot) => {
                const oc = ordenesCompra.find(o => o.numeroCotizacion === cot.numero)
                const diasCiclo = calcularDiasCiclo(cot, oc)

                return (
                  <tr key={cot._id}>
                    <td className="cell-primary">
                      {cot.numero}{cot.numeroRecotizacion ? `.${cot.numeroRecotizacion}` : ''}
                    </td>
                    <td>{cot.cliente}</td>
                    <td className="cell-date">{cot.fechaSolicitud ? new Date(cot.fechaSolicitud).toLocaleDateString() : '-'}</td>
                    <td className="cell-date">{cot.fechaEnvio ? new Date(cot.fechaEnvio).toLocaleDateString() : '-'}</td>
                    <td className="cell-date">{cot.fechaAceptacion ? new Date(cot.fechaAceptacion).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge-minimal ${
                        cot.estado === 'aceptada' ? 'badge-success' :
                        cot.estado === 'enviada' ? 'badge-info' :
                        cot.estado === 'rechazada' ? 'badge-danger' :
                        'badge-neutral'
                      }`}>
                        {cot.estado}
                      </span>
                    </td>
                    <td className="cell-number">{cot.monto ? `$${cot.monto.toLocaleString()}` : '-'}</td>
                    <td className="cell-number">{diasCiclo !== null ? `${diasCiclo} días` : '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon-minimal"
                          onClick={() => openModal('cotizacion', cot)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon-minimal"
                          onClick={() => crearRecotizacion(cot)}
                          title="Re-cotizar"
                        >
                          🔄
                        </button>
                        <button
                          className="btn-icon-minimal danger"
                          onClick={() => handleDelete('cotizacion', cot._id)}
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

      {/* Órdenes de Compra Table */}
      <h2 style={{ color: '#60a5fa', marginBottom: '1rem', fontSize: '1.25rem', marginTop: '2rem' }}>🛒 Órdenes de Compra</h2>
      <div className="table-minimal-container">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>N° OC</th>
              <th>N° Cotización</th>
              <th>Fecha Emisión</th>
              <th>Fecha Pago</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenesCompra.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state-minimal">
                    <p>No hay órdenes de compra registradas</p>
                  </div>
                </td>
              </tr>
            ) : (
              ordenesCompra.map((oc) => (
                <tr key={oc._id}>
                  <td className="cell-primary">{oc.numeroOC}</td>
                  <td className="cell-secondary">{oc.numeroCotizacion}</td>
                  <td className="cell-date">{new Date(oc.fechaEmision).toLocaleDateString()}</td>
                  <td className="cell-date">{oc.fechaPago ? new Date(oc.fechaPago).toLocaleDateString() : '-'}</td>
                  <td className="cell-number">${oc.monto.toLocaleString()}</td>
                  <td>
                    <span className={`badge-minimal ${
                      oc.estado === 'pagada' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {oc.estado}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-icon-minimal"
                        onClick={() => openModal('orden', oc)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon-minimal danger"
                        onClick={() => handleDelete('orden', oc._id)}
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
              <h2>{formData._id ? 'Editar' : 'Nueva'} {modalType === 'cotizacion' ? 'Cotización' : 'Orden de Compra'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {modalType === 'cotizacion' ? (
                <>
                  <div className="form-group-minimal">
                    <label>N° Cotización *</label>
                    <input
                      type="text"
                      value={formData.numero || ''}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>Cliente *</label>
                    <input
                      type="text"
                      value={formData.cliente || ''}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      required
                    />
                  </div>
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
                    <label>Fecha Envío</label>
                    <input
                      type="date"
                      value={formData.fechaEnvio || ''}
                      onChange={(e) => setFormData({ ...formData, fechaEnvio: e.target.value })}
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>Fecha Aceptación</label>
                    <input
                      type="date"
                      value={formData.fechaAceptacion || ''}
                      onChange={(e) => setFormData({ ...formData, fechaAceptacion: e.target.value })}
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>Estado *</label>
                    <select
                      value={formData.estado || 'solicitada'}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      required
                    >
                      <option value="solicitada">Solicitada</option>
                      <option value="enviada">Enviada</option>
                      <option value="aceptada">Aceptada</option>
                      <option value="rechazada">Rechazada</option>
                    </select>
                  </div>
                  <div className="form-group-minimal">
                    <label>Monto</label>
                    <input
                      type="number"
                      value={formData.monto || ''}
                      onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) })}
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
              ) : (
                <>
                  <div className="form-group-minimal">
                    <label>N° Orden de Compra *</label>
                    <input
                      type="text"
                      value={formData.numeroOC || ''}
                      onChange={(e) => setFormData({ ...formData, numeroOC: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>N° Cotización *</label>
                    <input
                      type="text"
                      value={formData.numeroCotizacion || ''}
                      onChange={(e) => setFormData({ ...formData, numeroCotizacion: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>Fecha Emisión *</label>
                    <input
                      type="date"
                      value={formData.fechaEmision || ''}
                      onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>Fecha Pago</label>
                    <input
                      type="date"
                      value={formData.fechaPago || ''}
                      onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })}
                    />
                  </div>
                  <div className="form-group-minimal">
                    <label>Monto *</label>
                    <input
                      type="number"
                      value={formData.monto || ''}
                      onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) })}
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
                      <option value="pagada">Pagada</option>
                    </select>
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
