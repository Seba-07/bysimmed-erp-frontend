'use client'

import { useState, useEffect } from 'react'

interface Material {
  _id: string
  nombre: string
  unidadBase: {
    nombre: string
    abreviatura: string
  }
  presentaciones: Array<{
    nombre: string
    factorConversion: number
    precioCompra?: number
  }>
}

interface RestockRequest {
  _id: string
  materialId: Material
  presentacion: string
  cantidad: number
  solicitante: string
  prioridad: 'baja' | 'media' | 'urgente'
  estado: 'pendiente' | 'en_revision' | 'en_gestion' | 'en_transito' | 'entregado' | 'cancelada'
  fechaSolicitud: string
  fechaRevision?: string
  fechaGestion?: string
  fechaTransito?: string
  fechaEntrega?: string
  fechaCancelacion?: string
  notas?: string
  notasInternas?: string
}

export default function RestockManagement() {
  const [requests, setRequests] = useState<RestockRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'todas' | 'activas' | 'historial'>('activas')
  const [selectedRequest, setSelectedRequest] = useState<RestockRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [notasInternas, setNotasInternas] = useState('')

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadRequests()
  }, [filter])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/inventory/restock-requests`)
      const data = await res.json()

      if (data.success) {
        let filtered = data.data
        if (filter === 'activas') {
          filtered = data.data.filter((r: RestockRequest) =>
            !['entregado', 'cancelada'].includes(r.estado)
          )
        } else if (filter === 'historial') {
          filtered = data.data.filter((r: RestockRequest) =>
            ['entregado', 'cancelada'].includes(r.estado)
          )
        }
        setRequests(filtered)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando solicitudes')
    } finally {
      setLoading(false)
    }
  }

  const handleStateChange = async (requestId: string, newState: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/inventory/restock-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: newState,
          notasInternas: notasInternas || undefined
        })
      })

      const data = await res.json()

      if (data.success) {
        alert(`✅ Estado actualizado a: ${getEstadoLabel(newState)}`)
        setShowDetailModal(false)
        setSelectedRequest(null)
        setNotasInternas('')
        await loadRequests()
      } else {
        setError(data.message || 'Error actualizando estado')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando estado')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      en_revision: 'En Revisión',
      en_gestion: 'En Gestión',
      en_transito: 'En Tránsito',
      entregado: 'Entregado',
      cancelada: 'Cancelada'
    }
    return labels[estado] || estado
  }

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      pendiente: '#94a3b8',
      en_revision: '#3b82f6',
      en_gestion: '#f59e0b',
      en_transito: '#8b5cf6',
      entregado: '#10b981',
      cancelada: '#ef4444'
    }
    return colors[estado] || '#64748b'
  }

  const getNextStates = (currentState: string): string[] => {
    const flow: Record<string, string[]> = {
      pendiente: ['en_revision', 'cancelada'],
      en_revision: ['en_gestion', 'cancelada'],
      en_gestion: ['en_transito', 'cancelada'],
      en_transito: ['entregado', 'cancelada'],
      entregado: [],
      cancelada: []
    }
    return flow[currentState] || []
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="section">
      <div className="inventory-header">
        <h2>📦 Gestión de Reposiciones</h2>
      </div>

      {error && (
        <div className="response error">
          <pre>Error: {error}</pre>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Filtros */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'activas' ? 'active' : ''}`}
          onClick={() => setFilter('activas')}
        >
          🔄 Activas
        </button>
        <button
          className={`filter-tab ${filter === 'todas' ? 'active' : ''}`}
          onClick={() => setFilter('todas')}
        >
          📋 Todas
        </button>
        <button
          className={`filter-tab ${filter === 'historial' ? 'active' : ''}`}
          onClick={() => setFilter('historial')}
        >
          📚 Historial
        </button>
      </div>

      {loading ? (
        <p className="loading-message">Cargando solicitudes...</p>
      ) : requests.length === 0 ? (
        <p className="empty-message">
          {filter === 'activas' ? 'No hay solicitudes activas' :
           filter === 'historial' ? 'No hay historial de solicitudes' :
           'No hay solicitudes registradas'}
        </p>
      ) : (
        <div className="restock-requests-list">
          {requests.map((request) => (
            <div
              key={request._id}
              className="restock-request-card"
              onClick={() => {
                setSelectedRequest(request)
                setNotasInternas(request.notasInternas || '')
                setShowDetailModal(true)
              }}
            >
              <div className="request-header">
                <h4>{request.materialId.nombre}</h4>
                <span
                  className="estado-badge"
                  style={{ backgroundColor: getEstadoColor(request.estado) }}
                >
                  {getEstadoLabel(request.estado)}
                </span>
              </div>

              <div className="request-details">
                <p><strong>Solicitante:</strong> {request.solicitante}</p>
                <p><strong>Prioridad:</strong> <span className={`prioridad-${request.prioridad}`}>{request.prioridad.charAt(0).toUpperCase() + request.prioridad.slice(1)}</span></p>
                <p><strong>Presentación:</strong> {request.presentacion}</p>
                <p><strong>Cantidad:</strong> {request.cantidad} unidades</p>
                <p><strong>Solicitado:</strong> {formatDate(request.fechaSolicitud)}</p>
                {request.notas && <p className="request-notes"><em>{request.notas}</em></p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {showDetailModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📦 Detalle de Solicitud</h3>

            <div className="request-detail-section">
              <h4>Material</h4>
              <p><strong>{selectedRequest.materialId.nombre}</strong></p>
              <p>Presentación: {selectedRequest.presentacion}</p>
              <p>Cantidad: {selectedRequest.cantidad} unidades</p>
            </div>

            <div className="request-detail-section">
              <h4>Información de Solicitud</h4>
              <p><strong>Solicitante:</strong> {selectedRequest.solicitante}</p>
              <p><strong>Prioridad:</strong> <span className={`prioridad-${selectedRequest.prioridad}`}>{selectedRequest.prioridad.charAt(0).toUpperCase() + selectedRequest.prioridad.slice(1)}</span></p>
            </div>

            <div className="request-detail-section">
              <h4>Estado Actual</h4>
              <span
                className="estado-badge-large"
                style={{ backgroundColor: getEstadoColor(selectedRequest.estado) }}
              >
                {getEstadoLabel(selectedRequest.estado)}
              </span>
            </div>

            <div className="request-detail-section">
              <h4>Historial de Fechas</h4>
              <div className="timeline">
                <div className="timeline-item">
                  <span className="timeline-dot active"></span>
                  <span>Solicitado: {formatDate(selectedRequest.fechaSolicitud)}</span>
                </div>
                {selectedRequest.fechaRevision && (
                  <div className="timeline-item">
                    <span className="timeline-dot active"></span>
                    <span>En Revisión: {formatDate(selectedRequest.fechaRevision)}</span>
                  </div>
                )}
                {selectedRequest.fechaGestion && (
                  <div className="timeline-item">
                    <span className="timeline-dot active"></span>
                    <span>En Gestión: {formatDate(selectedRequest.fechaGestion)}</span>
                  </div>
                )}
                {selectedRequest.fechaTransito && (
                  <div className="timeline-item">
                    <span className="timeline-dot active"></span>
                    <span>En Tránsito: {formatDate(selectedRequest.fechaTransito)}</span>
                  </div>
                )}
                {selectedRequest.fechaEntrega && (
                  <div className="timeline-item">
                    <span className="timeline-dot active"></span>
                    <span>Entregado: {formatDate(selectedRequest.fechaEntrega)}</span>
                  </div>
                )}
                {selectedRequest.fechaCancelacion && (
                  <div className="timeline-item">
                    <span className="timeline-dot cancelled"></span>
                    <span>Cancelado: {formatDate(selectedRequest.fechaCancelacion)}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedRequest.notas && (
              <div className="request-detail-section">
                <h4>Notas del Solicitante</h4>
                <p>{selectedRequest.notas}</p>
              </div>
            )}

            <div className="request-detail-section">
              <h4>Notas Internas</h4>
              <textarea
                value={notasInternas}
                onChange={(e) => setNotasInternas(e.target.value)}
                rows={3}
                placeholder="Agrega notas internas para seguimiento..."
              />
            </div>

            {getNextStates(selectedRequest.estado).length > 0 && (
              <div className="request-detail-section">
                <h4>Cambiar Estado</h4>
                <div className="state-buttons">
                  {getNextStates(selectedRequest.estado).map((nextState) => (
                    <button
                      key={nextState}
                      onClick={() => {
                        if (nextState === 'entregado') {
                          if (confirm('¿Confirmar entrega? Esto marcará la solicitud como completada.')) {
                            handleStateChange(selectedRequest._id, nextState)
                          }
                        } else if (nextState === 'cancelada') {
                          if (confirm('¿Cancelar esta solicitud?')) {
                            handleStateChange(selectedRequest._id, nextState)
                          }
                        } else {
                          handleStateChange(selectedRequest._id, nextState)
                        }
                      }}
                      className={`button ${nextState === 'cancelada' ? 'danger' : ''}`}
                      disabled={loading}
                    >
                      {nextState === 'cancelada' ? '❌ Cancelar' : `➡️ ${getEstadoLabel(nextState)}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowDetailModal(false)} className="button secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
