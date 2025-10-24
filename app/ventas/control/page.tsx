'use client'

import { useState, useEffect } from 'react'

interface Cliente {
  _id: string
  nombre: string
  codigoCliente: string
  activo: boolean
}

interface Modelo {
  _id: string
  codigo: string
  nombre: string
  descripcion?: string
  precioVenta: number
  stock: number
  activo: boolean
}

interface Componente {
  _id: string
  codigo: string
  nombre: string
  descripcion?: string
  precioVenta: number
  stock: number
  activo: boolean
}

interface ProductoCotizacion {
  tipo: 'modelo' | 'componente'
  itemId: string
  codigo: string
  nombre: string
  descripcion?: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface Cotizacion {
  _id: string
  numero: string
  numeroSecuencial: number
  numeroRecotizacion?: number
  cliente: Cliente | string
  clienteNombre: string
  fechaSolicitud: string
  fechaEnvio?: string
  fechaAceptacion?: string
  estado: 'solicitada' | 'enviada' | 'aceptada' | 'rechazada'
  productos?: ProductoCotizacion[]
  moneda?: 'CLP' | 'USD'
  monto?: number
  notas?: string
  condicionesComerciales?: string
  pdfPath?: string
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
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [componentes, setComponentes] = useState<Componente[]>([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'cotizacion' | 'orden'>('cotizacion')
  const [formData, setFormData] = useState<any>({})
  const [numeroGenerado, setNumeroGenerado] = useState<string>('')
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoCotizacion[]>([])
  const [tasaCambio, setTasaCambio] = useState<number>(900)
  const [tipoProductoFiltro, setTipoProductoFiltro] = useState<'modelo' | 'componente'>('modelo')

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [cotRes, ocRes, clientesRes, modelosRes, componentesRes, currencyRes] = await Promise.all([
        fetch(`${API_URL}/api/ventas/cotizaciones`),
        fetch(`${API_URL}/api/ventas/ordenes-compra`),
        fetch(`${API_URL}/api/ventas/clientes`),
        fetch(`${API_URL}/api/inventario/modelos`),
        fetch(`${API_URL}/api/inventario/componentes`),
        fetch(`${API_URL}/api/currency/usd-clp`)
      ])

      if (cotRes.ok) {
        const data = await cotRes.json()
        setCotizaciones(data)
      }

      if (ocRes.ok) {
        const data = await ocRes.json()
        setOrdenesCompra(data)
      }

      if (clientesRes.ok) {
        const data = await clientesRes.json()
        setClientes(data.filter((c: Cliente) => c.activo))
      }

      if (modelosRes.ok) {
        const data = await modelosRes.json()
        setModelos(data.filter((m: Modelo) => m.activo))
      }

      if (componentesRes.ok) {
        const data = await componentesRes.json()
        setComponentes(data.filter((c: Componente) => c.activo))
      }

      if (currencyRes.ok) {
        const data = await currencyRes.json()
        setTasaCambio(data.rate)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadNumeroForCliente = async (clienteId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/ventas/cotizaciones/next-numero/${clienteId}`)
      if (res.ok) {
        const data = await res.json()
        setNumeroGenerado(data.numero)
        setFormData({
          ...formData,
          numero: data.numero,
          numeroSecuencial: data.numeroSecuencial,
          cliente: clienteId
        })
      }
    } catch (error) {
      console.error('Error loading numero:', error)
    }
  }

  const openModal = (type: 'cotizacion' | 'orden', data?: any) => {
    setModalType(type)

    // Si es una nueva cotización, auto-llenar la fecha de solicitud con la fecha actual
    if (type === 'cotizacion' && !data) {
      const today = new Date().toISOString().split('T')[0]
      setFormData({ fechaSolicitud: today, moneda: 'CLP' })
    } else {
      // Convertir fechas ISO a formato YYYY-MM-DD para inputs de tipo date
      const formattedData = { ...data }
      if (formattedData.fechaSolicitud) {
        formattedData.fechaSolicitud = new Date(formattedData.fechaSolicitud).toISOString().split('T')[0]
      }
      if (formattedData.fechaEnvio) {
        formattedData.fechaEnvio = new Date(formattedData.fechaEnvio).toISOString().split('T')[0]
      }
      if (formattedData.fechaAceptacion) {
        formattedData.fechaAceptacion = new Date(formattedData.fechaAceptacion).toISOString().split('T')[0]
      }
      setFormData(formattedData || {})
    }

    setNumeroGenerado('')
    setProductosSeleccionados(data?.productos || [])
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({})
    setNumeroGenerado('')
    setProductosSeleccionados([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar productos para cotizaciones nuevas
    if (modalType === 'cotizacion' && !formData._id && productosSeleccionados.length === 0) {
      alert('Debes agregar al menos un producto a la cotización')
      return
    }

    const url = modalType === 'cotizacion'
      ? `${API_URL}/api/ventas/cotizaciones`
      : `${API_URL}/api/ventas/ordenes-compra`

    const method = formData._id ? 'PUT' : 'POST'
    const endpoint = formData._id ? `${url}/${formData._id}` : url

    // Calcular subtotal de los productos
    const subtotal = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0)

    // Calcular IVA solo si es CLP
    const moneda = formData.moneda || 'CLP'
    const iva = moneda === 'CLP' ? subtotal * 0.19 : 0
    const montoTotal = subtotal + iva

    const dataToSend = modalType === 'cotizacion'
      ? {
          ...formData,
          productos: productosSeleccionados,
          tasaCambio: moneda === 'USD' ? tasaCambio : undefined,
          subtotal,
          iva,
          monto: montoTotal,
          // Si es re-cotización (estado enviada al abrir modal), volver a solicitada
          estado: formData._id && formData.estado === 'enviada' ? 'solicitada' : (formData._id ? formData.estado : 'solicitada'),
          moneda,
          // Limpiar fechas de envío y aceptación si es re-cotización
          fechaEnvio: formData.estado === 'enviada' ? null : formData.fechaEnvio,
          fechaAceptacion: formData.estado === 'enviada' ? null : formData.fechaAceptacion
        }
      : formData

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
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

  const enviarCotizacion = async (cotizacionId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/ventas/cotizaciones/${cotizacionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'enviada' })
      })

      if (res.ok) {
        loadData()
        alert('Cotización enviada exitosamente')
      } else {
        const error = await res.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error enviando cotización:', error)
      alert('Error al enviar cotización')
    }
  }

  const generarPDF = async (cotizacionId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/ventas/cotizaciones/${cotizacionId}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        loadData()
        alert('PDF generado exitosamente')
      } else {
        const error = await res.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar PDF')
    }
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
              <th>Fecha</th>
              <th>Estado</th>
              <th>Monto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state-minimal">
                    <p>No hay cotizaciones registradas</p>
                  </div>
                </td>
              </tr>
            ) : (
              cotizaciones.map((cot) => {
                return (
                  <tr key={cot._id}>
                    <td className="cell-primary">
                      {cot.numero}
                    </td>
                    <td>{cot.clienteNombre || (typeof cot.cliente === 'object' ? cot.cliente.nombre : cot.cliente)}</td>
                    <td className="cell-date">{cot.fechaSolicitud ? new Date(cot.fechaSolicitud).toLocaleDateString('es-CL') : '-'}</td>
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
                    <td className="cell-number">
                      {cot.monto ? `${cot.moneda === 'USD' ? 'USD' : '$'} ${cot.monto.toLocaleString('es-CL')}` : '-'}
                    </td>
                    <td>
                      <div className="table-actions" style={{ gap: '0.75rem' }}>
                        {/* Mostrar botón Editar solo si NO está enviada */}
                        {cot.estado === 'solicitada' && (
                          <button
                            className="btn-icon-minimal"
                            onClick={() => openModal('cotizacion', cot)}
                            title="Editar"
                            style={{ fontSize: '1.5rem' }}
                          >
                            ✏️
                          </button>
                        )}

                        {/* Mostrar botón Enviar solo si está en estado solicitada */}
                        {cot.estado === 'solicitada' && (
                          <button
                            className="btn-icon-minimal"
                            onClick={() => enviarCotizacion(cot._id)}
                            title="Enviar Cotización"
                            style={{ fontSize: '1.5rem' }}
                          >
                            📧
                          </button>
                        )}

                        {/* Mostrar botón Re-cotizar solo si ya está enviada */}
                        {cot.estado === 'enviada' && (
                          <button
                            className="btn-icon-minimal"
                            onClick={() => openModal('cotizacion', cot)}
                            title="Re-cotizar"
                            style={{ fontSize: '1.5rem' }}
                          >
                            🔄
                          </button>
                        )}

                        {cot.pdfPath ? (
                          <a
                            href={`${API_URL}/api/ventas/cotizaciones/${cot._id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon-minimal"
                            title="Ver PDF"
                            style={{ fontSize: '1.5rem' }}
                          >
                            📄
                          </a>
                        ) : (
                          <button
                            className="btn-icon-minimal"
                            onClick={() => generarPDF(cot._id)}
                            title="Generar PDF"
                            style={{ fontSize: '1.5rem' }}
                          >
                            📝
                          </button>
                        )}
                        <button
                          className="btn-icon-minimal danger"
                          onClick={() => handleDelete('cotizacion', cot._id)}
                          title="Eliminar"
                          style={{ fontSize: '1.5rem' }}
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
                    <label>Cliente *</label>
                    <select
                      value={typeof formData.cliente === 'object' ? formData.cliente._id : formData.cliente || ''}
                      onChange={(e) => {
                        const clienteId = e.target.value
                        if (clienteId && !formData._id) {
                          loadNumeroForCliente(clienteId)
                        } else if (clienteId && formData.estado === 'enviada') {
                          // Si es re-cotización, permite cambiar cliente y regenerar número
                          loadNumeroForCliente(clienteId)
                        } else {
                          setFormData({ ...formData, cliente: clienteId })
                        }
                      }}
                      required
                      disabled={formData._id && formData.estado !== 'enviada'}
                    >
                      <option value="">Selecciona un cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente._id} value={cliente._id}>
                          {cliente.nombre} ({cliente.codigoCliente})
                        </option>
                      ))}
                    </select>
                    {formData._id && formData.estado === 'solicitada' && (
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        El cliente no se puede cambiar al editar
                      </small>
                    )}
                    {formData._id && formData.estado === 'enviada' && (
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        Puedes cambiar el cliente en una re-cotización
                      </small>
                    )}
                  </div>
                  <div className="form-group-minimal">
                    <label>N° Cotización</label>
                    <input
                      type="text"
                      value={formData.numero || numeroGenerado || ''}
                      readOnly
                      style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                      placeholder="Selecciona un cliente primero"
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      El número se genera automáticamente según el cliente
                    </small>
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

                  {/* Solo mostrar fechas en modo edición */}
                  {formData._id && formData.fechaEnvio && (
                    <div className="form-group-minimal">
                      <label>Fecha Envío</label>
                      <input
                        type="date"
                        value={formData.fechaEnvio || ''}
                        readOnly
                        style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                      />
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        Fecha automática al marcar como enviada
                      </small>
                    </div>
                  )}

                  {formData._id && formData.fechaAceptacion && (
                    <div className="form-group-minimal">
                      <label>Fecha Aceptación</label>
                      <input
                        type="date"
                        value={formData.fechaAceptacion || ''}
                        readOnly
                        style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                      />
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        Fecha automática al marcar como aceptada
                      </small>
                    </div>
                  )}

                  {/* Solo mostrar estado en modo edición */}
                  {formData._id && (
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
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        Las fechas se actualizan automáticamente al cambiar el estado
                      </small>
                    </div>
                  )}

                  {/* Moneda y Monto */}
                  <div className="form-group-minimal">
                    <label>Moneda *</label>
                    <select
                      value={formData.moneda || 'CLP'}
                      onChange={(e) => {
                        const nuevaMoneda = e.target.value
                        const monedaAnterior = formData.moneda || 'CLP'

                        // Convertir precios de productos ya agregados
                        if (productosSeleccionados.length > 0 && nuevaMoneda !== monedaAnterior) {
                          const productosConvertidos = productosSeleccionados.map(prod => {
                            let nuevoPrecio = prod.precioUnitario

                            // De CLP a USD
                            if (monedaAnterior === 'CLP' && nuevaMoneda === 'USD') {
                              nuevoPrecio = prod.precioUnitario / tasaCambio
                            }
                            // De USD a CLP
                            else if (monedaAnterior === 'USD' && nuevaMoneda === 'CLP') {
                              nuevoPrecio = prod.precioUnitario * tasaCambio
                            }

                            return {
                              ...prod,
                              precioUnitario: nuevoPrecio,
                              subtotal: nuevoPrecio * prod.cantidad
                            }
                          })

                          setProductosSeleccionados(productosConvertidos)
                        }

                        setFormData({ ...formData, moneda: nuevaMoneda })
                      }}
                      required
                    >
                      <option value="CLP">Pesos Chilenos ($)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                    {formData.moneda === 'USD' && (
                      <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        Tasa de cambio: ${tasaCambio.toLocaleString()} CLP/USD
                      </small>
                    )}
                  </div>
                  {/* Selector de Productos del Inventario */}
                  <div className="form-group-minimal">
                    <label>Productos a Cotizar *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 2fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
                      <select
                        id="producto-tipo"
                        value={tipoProductoFiltro}
                        onChange={(e) => setTipoProductoFiltro(e.target.value as 'modelo' | 'componente')}
                      >
                        <option value="modelo">Modelo</option>
                        <option value="componente">Componente</option>
                      </select>
                      <select id="producto-selector">
                        <option value="">Selecciona un producto</option>
                        {tipoProductoFiltro === 'modelo' ? (
                          modelos.map(m => (
                            <option key={`modelo-${m._id}`} value={`modelo-${m._id}`}>
                              {m.codigo} - {m.nombre} (${m.precioVenta.toLocaleString()})
                            </option>
                          ))
                        ) : (
                          componentes.map(c => (
                            <option key={`componente-${c._id}`} value={`componente-${c._id}`}>
                              {c.codigo} - {c.nombre} (${c.precioVenta.toLocaleString()})
                            </option>
                          ))
                        )}
                      </select>
                      <input
                        type="number"
                        id="producto-cantidad"
                        placeholder="Cantidad"
                        min="1"
                        defaultValue="1"
                      />
                      <button
                        type="button"
                        className="btn-minimal btn-primary-minimal"
                        onClick={() => {
                          const selectorEl = document.getElementById('producto-selector') as HTMLSelectElement
                          const cantidadEl = document.getElementById('producto-cantidad') as HTMLInputElement
                          const selectedValue = selectorEl.value
                          const cantidad = parseInt(cantidadEl.value)

                          if (!selectedValue || !cantidad || cantidad < 1) {
                            alert('Selecciona un producto y cantidad válida')
                            return
                          }

                          const [tipo, id] = selectedValue.split('-')
                          const item = tipo === 'modelo'
                            ? modelos.find(m => m._id === id)
                            : componentes.find(c => c._id === id)

                          if (!item) return

                          // Convertir precio si la moneda es USD
                          const precioEnMoneda = formData.moneda === 'USD'
                            ? item.precioVenta / tasaCambio
                            : item.precioVenta

                          const nuevoProducto: ProductoCotizacion = {
                            tipo: tipo as 'modelo' | 'componente',
                            itemId: id,
                            codigo: item.codigo,
                            nombre: item.nombre,
                            descripcion: item.descripcion,
                            cantidad,
                            precioUnitario: precioEnMoneda,
                            subtotal: precioEnMoneda * cantidad
                          }

                          setProductosSeleccionados([...productosSeleccionados, nuevoProducto])
                          selectorEl.value = ''
                          cantidadEl.value = '1'
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Lista de productos seleccionados */}
                    {productosSeleccionados.length > 0 && (
                      <div style={{ marginTop: '1rem', border: '1px solid var(--border-secondary)', borderRadius: '8px', padding: '1rem' }}>
                        <table style={{ width: '100%', fontSize: '0.875rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Producto</th>
                              <th style={{ textAlign: 'center', padding: '0.5rem' }}>Cant.</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem' }}>Precio Unit.</th>
                              <th style={{ textAlign: 'right', padding: '0.5rem' }}>Subtotal</th>
                              <th style={{ padding: '0.5rem' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {productosSeleccionados.map((prod, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border-tertiary)' }}>
                                <td style={{ padding: '0.5rem' }}>
                                  <div>{prod.nombre}</div>
                                  {prod.descripcion && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                      {prod.descripcion}
                                    </div>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                  <input
                                    type="number"
                                    value={prod.cantidad}
                                    onChange={(e) => {
                                      const newCantidad = parseInt(e.target.value) || 1
                                      const updated = [...productosSeleccionados]
                                      updated[idx] = {
                                        ...prod,
                                        cantidad: newCantidad,
                                        subtotal: prod.precioUnitario * newCantidad
                                      }
                                      setProductosSeleccionados(updated)
                                    }}
                                    min="1"
                                    style={{ width: '60px', textAlign: 'center', padding: '0.25rem' }}
                                  />
                                </td>
                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                    <span>{formData.moneda === 'USD' ? 'USD' : '$'}</span>
                                    <input
                                      type="number"
                                      value={prod.precioUnitario}
                                      onChange={(e) => {
                                        const newPrecio = parseFloat(e.target.value) || 0
                                        const updated = [...productosSeleccionados]
                                        updated[idx] = {
                                          ...prod,
                                          precioUnitario: newPrecio,
                                          subtotal: newPrecio * prod.cantidad
                                        }
                                        setProductosSeleccionados(updated)
                                      }}
                                      min="0"
                                      step="0.01"
                                      style={{ width: '100px', textAlign: 'right', padding: '0.25rem' }}
                                    />
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                  {formData.moneda === 'USD' ? 'USD' : '$'}{prod.subtotal.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProductosSeleccionados(productosSeleccionados.filter((_, i) => i !== idx))
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                  >
                                    🗑️
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={3} style={{ textAlign: 'right', padding: '0.5rem' }}>Subtotal:</td>
                              <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                {formData.moneda === 'USD' ? 'USD' : '$'}
                                {productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0).toLocaleString()}
                              </td>
                              <td></td>
                            </tr>
                            {formData.moneda === 'CLP' && (
                              <tr>
                                <td colSpan={3} style={{ textAlign: 'right', padding: '0.5rem' }}>IVA (19%):</td>
                                <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                  ${(productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0) * 0.19).toLocaleString()}
                                </td>
                                <td></td>
                              </tr>
                            )}
                            <tr style={{ fontWeight: 'bold', fontSize: '1rem', borderTop: '2px solid var(--border-secondary)' }}>
                              <td colSpan={3} style={{ textAlign: 'right', padding: '0.5rem' }}>Total:</td>
                              <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                                {formData.moneda === 'USD' ? 'USD' : '$'}
                                {(() => {
                                  const subtotal = productosSeleccionados.reduce((sum, p) => sum + p.subtotal, 0)
                                  const iva = formData.moneda === 'CLP' ? subtotal * 0.19 : 0
                                  return (subtotal + iva).toLocaleString()
                                })()}
                              </td>
                              <td></td>
                            </tr>
                            {formData.moneda === 'USD' && (
                              <tr style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <td colSpan={5} style={{ textAlign: 'right', padding: '0.5rem' }}>
                                  Tasa de cambio: ${tasaCambio.toLocaleString()} CLP/USD
                                </td>
                              </tr>
                            )}
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="form-group-minimal">
                    <label>Notas</label>
                    <textarea
                      value={formData.notas || ''}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="form-group-minimal">
                    <label>Condiciones Comerciales</label>
                    <textarea
                      value={formData.condicionesComerciales || ''}
                      onChange={(e) => setFormData({ ...formData, condicionesComerciales: e.target.value })}
                      rows={4}
                      placeholder="Ej: Pago 50% anticipo, 50% contra entrega. Plazo de entrega: 30 días..."
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
