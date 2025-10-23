'use client'

export default function RegistroVentas() {
  return (
    <div className="page-container">
      <div className="page-header-minimal">
        <h1>Registro de Ventas</h1>
        <div className="header-actions-minimal">
          <button className="btn-minimal btn-primary-minimal">
            + Nueva Venta
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Ventas del Mes</div>
          <div className="stat-value">$0</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ventas del Año</div>
          <div className="stat-value">$0</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ticket Promedio</div>
          <div className="stat-value">$0</div>
        </div>
      </div>

      <div className="empty-state-minimal">
        <div className="icon">📝</div>
        <p>Módulo de Registro de Ventas en desarrollo</p>
        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Historial y análisis de ventas</p>
      </div>
    </div>
  )
}
