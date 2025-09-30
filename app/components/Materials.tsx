'use client'

import { useState, useEffect } from 'react'

interface Material {
  _id: string
  nombre: string
  descripcion?: string
  imagen?: string
  unidad: string
  stock: number
  precioUnitario: number
  fechaCreacion: string
  fechaActualizacion: string
}

interface MaterialResponse {
  success: boolean
  count?: number
  data?: Material | Material[]
  message?: string
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    unidad: '',
    stock: 0,
    precioUnitario: 0
  })
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/inventory/materials`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: MaterialResponse = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setMaterials(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando materiales')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.unidad) {
      setError('Nombre y unidad son requeridos')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const url = editingId
        ? `${API_URL}/api/inventory/materials/${editingId}`
        : `${API_URL}/api/inventory/materials`

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: MaterialResponse = await res.json()
      if (data.success) {
        setForm({ nombre: '', descripcion: '', unidad: '', stock: 0, precioUnitario: 0 })
        setEditingId(null)
        loadMaterials()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando material')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (material: Material) => {
    setForm({
      nombre: material.nombre,
      descripcion: material.descripcion || '',
      unidad: material.unidad,
      stock: material.stock,
      precioUnitario: material.precioUnitario
    })
    setEditingId(material._id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este material?')) return

    try {
      const res = await fetch(`${API_URL}/api/inventory/materials/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      loadMaterials()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando material')
    }
  }

  const cancelEdit = () => {
    setForm({ nombre: '', descripcion: '', unidad: '', stock: 0, precioUnitario: 0 })
    setEditingId(null)
  }

  return (
    <div className="section">
      <h2>📦 Gestión de Materiales</h2>

      <form onSubmit={handleSubmit} className="inventory-form">
        <input
          type="text"
          placeholder="Nombre del material *"
          value={form.nombre}
          onChange={(e) => setForm({...form, nombre: e.target.value})}
          disabled={submitting}
          required
        />
        <input
          type="text"
          placeholder="Descripción (opcional)"
          value={form.descripcion}
          onChange={(e) => setForm({...form, descripcion: e.target.value})}
          disabled={submitting}
        />
        <input
          type="text"
          placeholder="Unidad (ej: kg, litros, unidades) *"
          value={form.unidad}
          onChange={(e) => setForm({...form, unidad: e.target.value})}
          disabled={submitting}
          required
        />
        <input
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({...form, stock: Number(e.target.value)})}
          disabled={submitting}
          min="0"
        />
        <input
          type="number"
          placeholder="Precio unitario"
          value={form.precioUnitario}
          onChange={(e) => setForm({...form, precioUnitario: Number(e.target.value)})}
          disabled={submitting}
          min="0"
          step="0.01"
        />
        <div className="form-actions">
          <button type="submit" disabled={submitting} className="button">
            {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar Material'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="button secondary">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="response error">
          <pre>Error: {error}</pre>
        </div>
      )}

      {loading ? (
        <p>Cargando materiales...</p>
      ) : materials.length > 0 ? (
        <div className="inventory-list">
          <h3>📋 Materiales registrados ({materials.length})</h3>
          {materials.map((material) => (
            <div key={material._id} className="inventory-card">
              <div className="card-header">
                <h4>{material.nombre}</h4>
                <div className="card-actions">
                  <button onClick={() => handleEdit(material)} className="edit-btn">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(material._id)} className="delete-btn">
                    🗑️
                  </button>
                </div>
              </div>
              {material.descripcion && <p className="description">{material.descripcion}</p>}
              <div className="card-details">
                <p><strong>Unidad:</strong> {material.unidad}</p>
                <p><strong>Stock:</strong> {material.stock}</p>
                <p><strong>Precio:</strong> ${material.precioUnitario.toFixed(2)}</p>
                <p className="date">📅 {new Date(material.fechaCreacion).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No hay materiales registrados</p>
      )}
    </div>
  )
}