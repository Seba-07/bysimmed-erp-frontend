'use client'

import { useState } from 'react'

interface ApiResponse {
  message: string
  timestamp: string
  env?: string
}

export default function Home() {
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <main className="container">
      <h1 className="logo">bySIMMED — Hello PWA</h1>
      <p className="subtitle">Validación de despliegue PWA + Backend</p>

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