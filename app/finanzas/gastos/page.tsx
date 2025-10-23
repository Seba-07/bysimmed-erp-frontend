'use client'

import { useState, useEffect } from 'react'

interface Gasto {
  _id: string
  numeroGasto: string
  tipo: string
  concepto: string
  monto: number
  fecha: string
  metodoPago: string
  proveedor?: string
  categoria?: string
  estado: string
  fechaPago?: string
  cuentaBancaria?: string
  notas?: string
}

export default function Gastos() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [filter, setFilter] = useState('all')

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/finanzas/gastos`)
      if (res.ok) setGastos(await res.json())
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const openModal = (data?: any) => {
    setFormData(data || { tipo: 'operacional', estado: 'pendiente', metodoPago: 'transferencia' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = `${API_URL}/api/finanzas/gastos`
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
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return
    try {
      const res = await fetch(`${API_URL}/api/finanzas/gastos/${id}`, { method: 'DELETE' })
      if (res.ok) loadData()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const filteredGastos = gastos.filter(g => {
    if (filter === 'all') return true
    if (filter === 'pendiente' || filter === 'pagado' || filter === 'vencido') return g.estado === filter
    return g.tipo === filter
  })

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0)
  const gastosPendientes = gastos.filter(g => g.estado === 'pendiente').reduce((sum, g) => sum + g.monto, 0)
  const gastosPagados = gastos.filter(g => g.estado === 'pagado').reduce((sum, g) => sum + g.monto, 0)

  return (
    <div className="page-container">
      <div className="page-header-minimal">
        <h1>Gastos</h1>
        <div className="header-actions-minimal">
          <button className="btn-minimal btn-primary-minimal" onClick={() => openModal()}>
            + Nuevo Gasto
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Gastos</div>
          <div className="stat-value">${totalGastos.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value">${gastosPendientes.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pagados</div>
          <div className="stat-value">${gastosPagados.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cantidad</div>
          <div className="stat-value">{gastos.length}</div>
        </div>
      </div>

      <div className="filter-bar-minimal">
        <select className="select-minimal" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="pagado">Pagados</option>
          <option value="vencido">Vencidos</option>
          <option value="operacional">Operacionales</option>
          <option value="sueldo">Sueldos</option>
          <option value="servicios">Servicios</option>
          <option value="impuestos">Impuestos</option>
        </select>
      </div>

      <div className="table-minimal-container">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>N° Gasto</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Método Pago</th>
              <th>Estado</th>
              <th>Fecha Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredGastos.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state-minimal">
                    <p>No hay gastos registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredGastos.map((gasto) => (
                <tr key={gasto._id}>
                  <td className="cell-primary">{gasto.numeroGasto}</td>
                  <td><span className="badge-minimal badge-info">{gasto.tipo}</span></td>
                  <td>{gasto.concepto}</td>
                  <td className="cell-number">${gasto.monto.toLocaleString()}</td>
                  <td className="cell-date">{new Date(gasto.fecha).toLocaleDateString()}</td>
                  <td className="cell-secondary">{gasto.metodoPago}</td>
                  <td>
                    <span className={`badge-minimal ${
                      gasto.estado === 'pagado' ? 'badge-success' :
                      gasto.estado === 'vencido' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {gasto.estado}
                    </span>
                  </td>
                  <td className="cell-date">
                    {gasto.fechaPago ? new Date(gasto.fechaPago).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon-minimal" onClick={() => openModal(gasto)} title="Editar">
                        ✏️
                      </button>
                      <button className="btn-icon-minimal danger" onClick={() => handleDelete(gasto._id)} title="Eliminar">
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
              <h2>{formData._id ? 'Editar' : 'Nuevo'} Gasto</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group-minimal">
                  <label>N° Gasto *</label>
                  <input
                    type="text"
                    value={formData.numeroGasto || ''}
                    onChange={(e) => setFormData({ ...formData, numeroGasto: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-minimal">
                  <label>Tipo *</label>
                  <select
                    value={formData.tipo || 'operacional'}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    required
                  >
                    <option value="operacional">Operacional</option>
                    <option value="sueldo">Sueldo</option>
                    <option value="servicios">Servicios</option>
                    <option value="impuestos">Impuestos</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
              </div>

              <div className="form-group-minimal">
                <label>Concepto *</label>
                <input
                  type="text"
                  value={formData.concepto || ''}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                  <label>Fecha *</label>
                  <input
                    type="date"
                    value={formData.fecha || ''}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group-minimal">
                  <label>Método de Pago *</label>
                  <select
                    value={formData.metodoPago || 'transferencia'}
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                    required
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div className="form-group-minimal">
                  <label>Estado *</label>
                  <select
                    value={formData.estado || 'pendiente'}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    required
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group-minimal">
                  <label>Proveedor</label>
                  <input
                    type="text"
                    value={formData.proveedor || ''}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  />
                </div>
                <div className="form-group-minimal">
                  <label>Categoría</label>
                  <input
                    type="text"
                    value={formData.categoria || ''}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group-minimal">
                  <label>Fecha Pago</label>
                  <input
                    type="date"
                    value={formData.fechaPago || ''}
                    onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })}
                  />
                </div>
                <div className="form-group-minimal">
                  <label>Cuenta Bancaria</label>
                  <input
                    type="text"
                    value={formData.cuentaBancaria || ''}
                    onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value })}
                  />
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
