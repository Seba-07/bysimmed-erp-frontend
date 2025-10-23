'use client'

import { useState, useEffect } from 'react'

interface CuentaBancaria {
  _id: string
  nombre: string
  banco: string
  numeroCuenta: string
  tipoCuenta: string
  saldo: number
  moneda: string
  activa: boolean
}

interface CuentaPorCobrar {
  _id: string
  numeroFactura: string
  cliente: string
  monto: number
  montoPagado: number
  saldoPendiente: number
  fechaEmision: string
  fechaVencimiento: string
  estado: string
  diasVencido?: number
  metodoPago?: string
  notas?: string
}

export default function Cuentas() {
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([])
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState<CuentaPorCobrar[]>([])
  const [activeTab, setActiveTab] = useState<'bancarias' | 'cobrar'>('bancarias')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'bancaria' | 'cobrar'>('bancaria')
  const [formData, setFormData] = useState<any>({})
  const [filter, setFilter] = useState('all')

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [bancariaRes, cobrarRes] = await Promise.all([
        fetch(`${API_URL}/api/finanzas/cuentas-bancarias`),
        fetch(`${API_URL}/api/finanzas/cuentas-por-cobrar`)
      ])
      if (bancariaRes.ok) setCuentasBancarias(await bancariaRes.json())
      if (cobrarRes.ok) setCuentasPorCobrar(await cobrarRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const openModal = (type: 'bancaria' | 'cobrar', data?: any) => {
    setModalType(type)
    if (type === 'bancaria') {
      setFormData(data || { activa: true, tipoCuenta: 'corriente', moneda: 'CLP', saldo: 0 })
    } else {
      setFormData(data || { estado: 'pendiente', montoPagado: 0 })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const endpoint = modalType === 'bancaria' ? 'cuentas-bancarias' : 'cuentas-por-cobrar'
    const url = `${API_URL}/api/finanzas/${endpoint}`
    const method = formData._id ? 'PUT' : 'POST'
    const finalUrl = formData._id ? `${url}/${formData._id}` : url

    try {
      const res = await fetch(finalUrl, {
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

  const handleDelete = async (type: 'bancaria' | 'cobrar', id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return
    const endpoint = type === 'bancaria' ? 'cuentas-bancarias' : 'cuentas-por-cobrar'
    try {
      const res = await fetch(`${API_URL}/api/finanzas/${endpoint}/${id}`, { method: 'DELETE' })
      if (res.ok) loadData()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const filteredBancarias = cuentasBancarias.filter(c => {
    if (filter === 'all') return true
    if (filter === 'activas') return c.activa
    if (filter === 'inactivas') return !c.activa
    return c.tipoCuenta === filter
  })

  const filteredCobrar = cuentasPorCobrar.filter(c => {
    if (filter === 'all') return true
    return c.estado === filter
  })

  const totalSaldoBancario = cuentasBancarias.filter(c => c.activa).reduce((sum, c) => sum + c.saldo, 0)
  const totalPorCobrar = cuentasPorCobrar.reduce((sum, c) => sum + c.saldoPendiente, 0)
  const cobrarVencido = cuentasPorCobrar.filter(c => c.estado === 'vencido').reduce((sum, c) => sum + c.saldoPendiente, 0)
  const cobrarPendiente = cuentasPorCobrar.filter(c => c.estado === 'pendiente').reduce((sum, c) => sum + c.saldoPendiente, 0)

  return (
    <div className="page-container">
      <div className="page-header-minimal">
        <h1>Cuentas</h1>
        <div className="header-actions-minimal">
          <button
            className="btn-minimal btn-primary-minimal"
            onClick={() => openModal(activeTab === 'bancarias' ? 'bancaria' : 'cobrar')}
          >
            + Nueva {activeTab === 'bancarias' ? 'Cuenta Bancaria' : 'Cuenta por Cobrar'}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Saldo Total Bancos</div>
          <div className="stat-value">${totalSaldoBancario.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total por Cobrar</div>
          <div className="stat-value">${totalPorCobrar.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cobrar Pendiente</div>
          <div className="stat-value">${cobrarPendiente.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cobrar Vencido</div>
          <div className="stat-value text-danger">${cobrarVencido.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #334155' }}>
        <button
          onClick={() => setActiveTab('bancarias')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'bancarias' ? '#3b82f6' : 'transparent',
            color: activeTab === 'bancarias' ? 'white' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'bancarias' ? '2px solid #3b82f6' : 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}
        >
          Cuentas Bancarias
        </button>
        <button
          onClick={() => setActiveTab('cobrar')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'cobrar' ? '#3b82f6' : 'transparent',
            color: activeTab === 'cobrar' ? 'white' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'cobrar' ? '2px solid #3b82f6' : 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}
        >
          Cuentas por Cobrar
        </button>
      </div>

      <div className="filter-bar-minimal">
        <select className="select-minimal" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {activeTab === 'bancarias' ? (
            <>
              <option value="all">Todas</option>
              <option value="activas">Activas</option>
              <option value="inactivas">Inactivas</option>
              <option value="corriente">Corriente</option>
              <option value="ahorro">Ahorro</option>
              <option value="vista">Vista</option>
            </>
          ) : (
            <>
              <option value="all">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="parcial">Parciales</option>
              <option value="pagado">Pagadas</option>
              <option value="vencido">Vencidas</option>
            </>
          )}
        </select>
      </div>

      {activeTab === 'bancarias' ? (
        <div className="table-minimal-container">
          <table className="table-minimal">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Banco</th>
                <th>N° Cuenta</th>
                <th>Tipo</th>
                <th>Saldo</th>
                <th>Moneda</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBancarias.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state-minimal">
                      <p>No hay cuentas bancarias registradas</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBancarias.map((cuenta) => (
                  <tr key={cuenta._id}>
                    <td className="cell-primary">{cuenta.nombre}</td>
                    <td>{cuenta.banco}</td>
                    <td className="cell-secondary">{cuenta.numeroCuenta}</td>
                    <td><span className="badge-minimal badge-info">{cuenta.tipoCuenta}</span></td>
                    <td className="cell-number">${cuenta.saldo.toLocaleString()}</td>
                    <td>{cuenta.moneda}</td>
                    <td>
                      <span className={`badge-minimal ${cuenta.activa ? 'badge-success' : 'badge-neutral'}`}>
                        {cuenta.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon-minimal" onClick={() => openModal('bancaria', cuenta)} title="Editar">
                          ✏️
                        </button>
                        <button className="btn-icon-minimal danger" onClick={() => handleDelete('bancaria', cuenta._id)} title="Eliminar">
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
      ) : (
        <div className="table-minimal-container">
          <table className="table-minimal">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Cliente</th>
                <th>Monto Total</th>
                <th>Pagado</th>
                <th>Saldo Pendiente</th>
                <th>F. Emisión</th>
                <th>F. Vencimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCobrar.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state-minimal">
                      <p>No hay cuentas por cobrar registradas</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCobrar.map((cuenta) => (
                  <tr key={cuenta._id} style={{ background: cuenta.estado === 'vencido' ? '#4c1d1d' : 'transparent' }}>
                    <td className="cell-primary">{cuenta.numeroFactura}</td>
                    <td>{cuenta.cliente}</td>
                    <td className="cell-number">${cuenta.monto.toLocaleString()}</td>
                    <td className="cell-number">${cuenta.montoPagado.toLocaleString()}</td>
                    <td className="cell-number" style={{ fontWeight: 'bold', color: cuenta.saldoPendiente > 0 ? '#fbbf24' : '#10b981' }}>
                      ${cuenta.saldoPendiente.toLocaleString()}
                    </td>
                    <td className="cell-date">{new Date(cuenta.fechaEmision).toLocaleDateString()}</td>
                    <td className="cell-date">{new Date(cuenta.fechaVencimiento).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge-minimal ${
                        cuenta.estado === 'pagado' ? 'badge-success' :
                        cuenta.estado === 'parcial' ? 'badge-warning' :
                        cuenta.estado === 'vencido' ? 'badge-danger' :
                        'badge-neutral'
                      }`}>
                        {cuenta.estado}
                        {cuenta.estado === 'vencido' && cuenta.diasVencido ? ` (${cuenta.diasVencido}d)` : ''}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon-minimal" onClick={() => openModal('cobrar', cuenta)} title="Editar">
                          ✏️
                        </button>
                        <button className="btn-icon-minimal danger" onClick={() => handleDelete('cobrar', cuenta._id)} title="Eliminar">
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
      )}

      {showModal && (
        <div className="modal-minimal" onClick={closeModal}>
          <div className="modal-content-minimal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-minimal">
              <h2>{formData._id ? 'Editar' : 'Nueva'} {modalType === 'bancaria' ? 'Cuenta Bancaria' : 'Cuenta por Cobrar'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {modalType === 'bancaria' ? (
                <>
                  <div className="form-group-minimal">
                    <label>Nombre de la Cuenta *</label>
                    <input
                      type="text"
                      value={formData.nombre || ''}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group-minimal">
                      <label>Banco *</label>
                      <input
                        type="text"
                        value={formData.banco || ''}
                        onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group-minimal">
                      <label>N° Cuenta *</label>
                      <input
                        type="text"
                        value={formData.numeroCuenta || ''}
                        onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group-minimal">
                      <label>Tipo de Cuenta *</label>
                      <select
                        value={formData.tipoCuenta || 'corriente'}
                        onChange={(e) => setFormData({ ...formData, tipoCuenta: e.target.value })}
                        required
                      >
                        <option value="corriente">Corriente</option>
                        <option value="ahorro">Ahorro</option>
                        <option value="vista">Vista</option>
                      </select>
                    </div>
                    <div className="form-group-minimal">
                      <label>Saldo *</label>
                      <input
                        type="number"
                        value={formData.saldo || 0}
                        onChange={(e) => setFormData({ ...formData, saldo: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group-minimal">
                      <label>Moneda *</label>
                      <select
                        value={formData.moneda || 'CLP'}
                        onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                        required
                      >
                        <option value="CLP">CLP</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group-minimal">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.activa !== false}
                        onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Cuenta Activa
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group-minimal">
                      <label>N° Factura *</label>
                      <input
                        type="text"
                        value={formData.numeroFactura || ''}
                        onChange={(e) => setFormData({ ...formData, numeroFactura: e.target.value })}
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
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group-minimal">
                      <label>Monto Total *</label>
                      <input
                        type="number"
                        value={formData.monto || ''}
                        onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group-minimal">
                      <label>Monto Pagado *</label>
                      <input
                        type="number"
                        value={formData.montoPagado || 0}
                        onChange={(e) => setFormData({ ...formData, montoPagado: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                      <label>Fecha Vencimiento *</label>
                      <input
                        type="date"
                        value={formData.fechaVencimiento || ''}
                        onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group-minimal">
                      <label>Estado *</label>
                      <select
                        value={formData.estado || 'pendiente'}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        required
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="parcial">Parcial</option>
                        <option value="pagado">Pagado</option>
                        <option value="vencido">Vencido</option>
                      </select>
                    </div>
                    <div className="form-group-minimal">
                      <label>Método de Pago</label>
                      <select
                        value={formData.metodoPago || ''}
                        onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                      </select>
                    </div>
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
