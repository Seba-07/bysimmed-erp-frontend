'use client'

import { useState, useEffect } from 'react'

interface Empresa {
  _id: string
  nombre: string
  rut?: string
  razonSocial?: string
  giro?: string
  direccion?: string
  ciudad?: string
  telefono?: string
  email?: string
  sitioWeb?: string
  activo: boolean
  notas?: string
}

interface Cliente {
  _id: string
  nombre: string
  empresa?: string | Empresa
  rut?: string
  email?: string
  telefono?: string
  direccion?: string
  codigoCliente: string
  activo: boolean
  notas?: string
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showEmpresaModal, setShowEmpresaModal] = useState(false)
  const [formData, setFormData] = useState<Partial<Cliente>>({
    activo: true
  })
  const [empresaFormData, setEmpresaFormData] = useState<Partial<Empresa>>({
    activo: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadClientes()
    loadEmpresas()
  }, [])

  const loadClientes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ventas/clientes`)
      if (res.ok) {
        const data = await res.json()
        setClientes(data)
      }
    } catch (error) {
      console.error('Error loading clientes:', error)
    }
  }

  const loadEmpresas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ventas/empresas`)
      if (res.ok) {
        const data = await res.json()
        setEmpresas(data)
      }
    } catch (error) {
      console.error('Error loading empresas:', error)
    }
  }

  const openModal = (cliente?: Cliente) => {
    if (cliente) {
      setFormData(cliente)
    } else {
      setFormData({ activo: true })
    }
    setShowModal(true)
    setError(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({ activo: true })
    setError(null)
  }

  const generarCodigo = async () => {
    if (!formData.nombre || formData.nombre.trim() === '') {
      setError('Ingresa el nombre del cliente primero')
      return
    }

    setError(null)
    console.log('API_URL:', API_URL)

    try {
      const res = await fetch(`${API_URL}/api/ventas/clientes/generar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: formData.nombre })
      })

      if (res.ok) {
        const data = await res.json()
        setFormData({ ...formData, codigoCliente: data.codigoCliente })
      } else {
        const errorData = await res.json()
        setError(errorData.message || 'Error al generar código')
      }
    } catch (error) {
      console.error('Error generating code:', error)
      setError('Error de conexión al generar código')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validar que el código no esté vacío
    if (!formData.codigoCliente || formData.codigoCliente.trim() === '') {
      setError('El código de cliente es requerido')
      setLoading(false)
      return
    }

    const url = formData._id
      ? `${API_URL}/api/ventas/clientes/${formData._id}`
      : `${API_URL}/api/ventas/clientes`

    const method = formData._id ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        await loadClientes()
        closeModal()
      } else {
        const data = await res.json()
        setError(data.message || 'Error al guardar cliente')
      }
    } catch (error: any) {
      console.error('Error saving cliente:', error)
      setError('Error de conexión: ' + (error.message || 'No se pudo conectar con el servidor'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return

    try {
      const res = await fetch(`${API_URL}/api/ventas/clientes/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) loadClientes()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  // Funciones para gestionar Empresas
  const openEmpresaModal = (empresa?: Empresa) => {
    if (empresa) {
      setEmpresaFormData(empresa)
    } else {
      setEmpresaFormData({ activo: true })
    }
    setShowEmpresaModal(true)
    setError(null)
  }

  const closeEmpresaModal = () => {
    setShowEmpresaModal(false)
    setEmpresaFormData({ activo: true })
    setError(null)
  }

  const handleEmpresaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const url = empresaFormData._id
      ? `${API_URL}/api/ventas/empresas/${empresaFormData._id}`
      : `${API_URL}/api/ventas/empresas`

    const method = empresaFormData._id ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresaFormData)
      })

      if (res.ok) {
        await loadEmpresas()
        closeEmpresaModal()
      } else {
        const data = await res.json()
        setError(data.message || 'Error al guardar empresa')
      }
    } catch (error: any) {
      console.error('Error saving empresa:', error)
      setError('Error de conexión: ' + (error.message || 'No se pudo conectar con el servidor'))
    } finally {
      setLoading(false)
    }
  }

  const handleEmpresaDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta empresa?')) return

    try {
      const res = await fetch(`${API_URL}/api/ventas/empresas/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) loadEmpresas()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header-minimal">
        <h1>Clientes</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-minimal btn-secondary-minimal"
            onClick={() => openEmpresaModal()}
          >
            🏢 Gestionar Empresas
          </button>
          <button
            className="btn-minimal btn-primary-minimal"
            onClick={() => openModal()}
          >
            + Nuevo Cliente
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
          <div className="stat-label">Activos</div>
          <div className="stat-value">{clientes.filter(c => c.activo).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Inactivos</div>
          <div className="stat-value">{clientes.filter(c => !c.activo).length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-minimal-container">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Empresa</th>
              <th>RUT</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state-minimal">
                    <p>No hay clientes registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente._id}>
                  <td className="cell-primary">{cliente.codigoCliente}</td>
                  <td className="cell-primary">{cliente.nombre}</td>
                  <td className="cell-secondary">
                    {typeof cliente.empresa === 'object' && cliente.empresa !== null
                      ? cliente.empresa.nombre
                      : '-'}
                  </td>
                  <td className="cell-secondary">{cliente.rut || '-'}</td>
                  <td className="cell-secondary">{cliente.email || '-'}</td>
                  <td className="cell-secondary">{cliente.telefono || '-'}</td>
                  <td>
                    <span className={`badge-minimal ${
                      cliente.activo ? 'badge-success' : 'badge-neutral'
                    }`}>
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-icon-minimal"
                        onClick={() => openModal(cliente)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon-minimal danger"
                        onClick={() => handleDelete(cliente._id)}
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
              <h2>{formData._id ? 'Editar' : 'Nuevo'} Cliente</h2>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  padding: '0 2rem',
                  color: 'var(--color-danger)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}>
                  {error}
                </div>
              )}

              <div className="form-group-minimal">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre || ''}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  onBlur={!formData.codigoCliente && !formData._id ? generarCodigo : undefined}
                  required
                />
              </div>

              <div className="form-group-minimal">
                <label>Empresa</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={typeof formData.empresa === 'object' ? formData.empresa?._id : formData.empresa || ''}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value || undefined })}
                    style={{ flex: 1 }}
                  >
                    <option value="">Sin empresa</option>
                    {empresas.filter(e => e.activo).map(empresa => (
                      <option key={empresa._id} value={empresa._id}>
                        {empresa.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-minimal btn-secondary-minimal"
                    onClick={() => {
                      setShowModal(false)
                      openEmpresaModal()
                    }}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    + Nueva
                  </button>
                </div>
              </div>

              <div className="form-group-minimal">
                <label>Código Cliente (máx 4 caracteres) *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={formData.codigoCliente || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      codigoCliente: e.target.value.toUpperCase().substring(0, 4)
                    })}
                    maxLength={4}
                    style={{ textTransform: 'uppercase', flex: 1 }}
                    required
                  />
                  {!formData._id && (
                    <button
                      type="button"
                      className="btn-minimal btn-secondary-minimal"
                      onClick={generarCodigo}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Auto-generar
                    </button>
                  )}
                </div>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Este código se usará para numerar las cotizaciones (ej: {formData.codigoCliente || 'XXXX'}-01)
                </small>
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
                  type="tel"
                  value={formData.telefono || ''}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div className="form-group-minimal">
                <label>Dirección</label>
                <textarea
                  value={formData.direccion || ''}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="form-group-minimal">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.activo !== false}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    style={{ width: 'auto' }}
                  />
                  Cliente Activo
                </label>
              </div>

              <div className="form-group-minimal">
                <label>Notas</label>
                <textarea
                  value={formData.notas || ''}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-minimal btn-secondary-minimal"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-minimal btn-primary-minimal"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : formData._id ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Empresas */}
      {showEmpresaModal && (
        <div className="modal-minimal" onClick={closeEmpresaModal}>
          <div className="modal-content-minimal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header-minimal">
              <h2>{empresaFormData._id ? 'Editar' : 'Nueva'} Empresa</h2>
              <button className="modal-close-btn" onClick={closeEmpresaModal}>×</button>
            </div>

            <form onSubmit={handleEmpresaSubmit}>
              {error && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--danger-light)',
                  color: 'var(--danger)',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  {error}
                </div>
              )}

              <div className="form-group-minimal">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={empresaFormData.nombre || ''}
                  onChange={(e) => setEmpresaFormData({ ...empresaFormData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group-minimal">
                <label>RUT</label>
                <input
                  type="text"
                  value={empresaFormData.rut || ''}
                  onChange={(e) => setEmpresaFormData({ ...empresaFormData, rut: e.target.value })}
                />
              </div>

              <div className="form-group-minimal">
                <label>Razón Social</label>
                <input
                  type="text"
                  value={empresaFormData.razonSocial || ''}
                  onChange={(e) => setEmpresaFormData({ ...empresaFormData, razonSocial: e.target.value })}
                />
              </div>

              <div className="form-group-minimal">
                <label>Giro</label>
                <input
                  type="text"
                  value={empresaFormData.giro || ''}
                  onChange={(e) => setEmpresaFormData({ ...empresaFormData, giro: e.target.value })}
                />
              </div>

              <div className="form-group-minimal">
                <label>Dirección</label>
                <input
                  type="text"
                  value={empresaFormData.direccion || ''}
                  onChange={(e) => setEmpresaFormData({ ...empresaFormData, direccion: e.target.value })}
                />
              </div>

              <div className="form-group-minimal">
                <label>Ciudad</label>
                <input
                  type="text"
                  value={empresaFormData.ciudad || ''}
                  onChange={(e) => setEmpresaFormData({ ...empresaFormData, ciudad: e.target.value })}
                />
              </div>

              <div className="form-group-minimal">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={empresaFormData.telefono || ''}
                  onChange={(e) => setEmpresaFormData({ ...empresaFormData, telefono: e.target.value })}
                />
              </div>

              <div className="form-group-minimal">
                <label>Email</label>
                <input
                  type="email"
                  value={empresaFormData.email || ''}
                  onChange={(e) => setEmpresaFormData({ ...empresaFormData, email: e.target.value })}
                />
              </div>

              <div className="form-group-minimal">
                <label>Sitio Web</label>
                <input
                  type="url"
                  value={empresaFormData.sitioWeb || ''}
                  onChange={(e) => setEmpresaFormData({ ...empresaFormData, sitioWeb: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group-minimal">
                <label>Notas</label>
                <textarea
                  value={empresaFormData.notas || ''}
                  onChange={(e) => setEmpresaFormData({ ...empresaFormData, notas: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group-minimal">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={empresaFormData.activo !== false}
                    onChange={(e) => setEmpresaFormData({ ...empresaFormData, activo: e.target.checked })}
                  />
                  Activo
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-minimal btn-secondary-minimal"
                  onClick={closeEmpresaModal}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-minimal btn-primary-minimal"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : empresaFormData._id ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>

            {empresas.length > 0 && (
              <>
                <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-secondary)' }} />
                <h3 style={{ marginBottom: '1rem' }}>Empresas Registradas</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {empresas.map(empresa => (
                    <div key={empresa._id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '4px',
                      marginBottom: '0.5rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{empresa.nombre}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {empresa.rut || 'Sin RUT'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-icon-minimal"
                          onClick={() => openEmpresaModal(empresa)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon-minimal danger"
                          onClick={() => handleEmpresaDelete(empresa._id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
