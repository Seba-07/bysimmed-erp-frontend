'use client'

import { useState } from 'react'

interface ApiResponse {
  message: string
  timestamp: string
  env?: string
}

interface Patient {
  _id: string
  nombre: string
  email: string
  telefono: string
  fechaCreacion: string
}

interface PatientResponse {
  success: boolean
  count?: number
  data?: Patient[]
  message?: string
}

export default function Home() {
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para pacientes
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [patientForm, setPatientForm] = useState({
    nombre: '',
    email: '',
    telefono: ''
  })
  const [submittingPatient, setSubmittingPatient] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/hello`)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data: ApiResponse = await res.json()
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Funciones para pacientes
  const loadPatients = async () => {
    setLoadingPatients(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/patients`)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data: PatientResponse = await res.json()
      if (data.success && data.data) {
        setPatients(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando pacientes')
    } finally {
      setLoadingPatients(false)
    }
  }

  const addPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientForm.nombre || !patientForm.email || !patientForm.telefono) {
      setError('Todos los campos son requeridos')
      return
    }

    setSubmittingPatient(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientForm)
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data: PatientResponse = await res.json()
      if (data.success) {
        setPatientForm({ nombre: '', email: '', telefono: '' })
        loadPatients() // Recargar lista
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error agregando paciente')
    } finally {
      setSubmittingPatient(false)
    }
  }

  return (
    <main className="container">
      <h1 className="logo">bySIMMED — ERP</h1>
      <p className="subtitle">Sistema de Gestión Empresarial PWA</p>

      <div className="section">
        <button
          className="button"
          onClick={testAPI}
          disabled={loading}
        >
          {loading ? 'Probando API...' : 'Probar API'}
        </button>

        {response && (
          <div className="response">
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* SECCIÓN DE PACIENTES */}
      <div className="section">
        <h2>👥 Gestión de Pacientes</h2>

        <form onSubmit={addPatient} className="patient-form">
          <input
            type="text"
            placeholder="Nombre completo"
            value={patientForm.nombre}
            onChange={(e) => setPatientForm({...patientForm, nombre: e.target.value})}
            disabled={submittingPatient}
          />
          <input
            type="email"
            placeholder="Email"
            value={patientForm.email}
            onChange={(e) => setPatientForm({...patientForm, email: e.target.value})}
            disabled={submittingPatient}
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={patientForm.telefono}
            onChange={(e) => setPatientForm({...patientForm, telefono: e.target.value})}
            disabled={submittingPatient}
          />
          <button type="submit" disabled={submittingPatient} className="button">
            {submittingPatient ? 'Agregando...' : 'Agregar Paciente'}
          </button>
        </form>

        <div className="patient-actions">
          <button
            onClick={loadPatients}
            disabled={loadingPatients}
            className="button secondary"
          >
            {loadingPatients ? 'Cargando...' : 'Cargar Pacientes'}
          </button>
        </div>

        {patients.length > 0 && (
          <div className="patients-list">
            <h3>📋 Lista de Pacientes ({patients.length})</h3>
            {patients.map((patient) => (
              <div key={patient._id} className="patient-card">
                <h4>{patient.nombre}</h4>
                <p>📧 {patient.email}</p>
                <p>📞 {patient.telefono}</p>
                <p>📅 {new Date(patient.fechaCreacion).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="response error">
          <pre>Error: {error}</pre>
        </div>
      )}

      <div className="instructions">
        <h3>🍎 Instalación en iPad/iPhone</h3>
        <p>
          Abre Safari → Pulsa el icono "Compartir" →
          Selecciona "Añadir a pantalla de inicio"
        </p>
      </div>

      <div className="instructions">
        <h3>🤖 Instalación en Android</h3>
        <p>
          Abre Chrome → Menú (⋮) →
          Selecciona "Añadir a pantalla de inicio"
        </p>
      </div>

      <div className="instructions">
        <h3>💻 Instalación en PC</h3>
        <p>
          Abre Chrome/Edge → Busca el icono "Instalar" en la barra de direcciones
        </p>
      </div>
    </main>
  )
}