'use client'

import { useState, useEffect } from 'react'

interface Unit {
  _id: string
  nombre: string
  abreviatura: string
  tipo?: string
}

interface Material {
  _id: string
  nombre: string
  descripcion?: string
  imagen?: string
  unidad: string | Unit
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

interface UnitResponse {
  success: boolean
  data?: Unit[]
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [units, setUnits] = useState<Unit[]>([])
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
  const [showCustomUnit, setShowCustomUnit] = useState(false)
  const [customUnit, setCustomUnit] = useState({ nombre: '', abreviatura: '', tipo: '' })

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadMaterials()
    loadUnits()
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

  const loadUnits = async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventory/units`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: UnitResponse = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setUnits(data.data)
      }
    } catch (err) {
      console.error('Error cargando unidades:', err)
    }
  }

  const handleAddCustomUnit = async () => {
    if (!customUnit.nombre || !customUnit.abreviatura) {
      alert('Nombre y abreviatura son requeridos')
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/inventory/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customUnit)
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.success && data.data) {
        await loadUnits()
        setForm({ ...form, unidad: data.data._id })
        setCustomUnit({ nombre: '', abreviatura: '', tipo: '' })
        setShowCustomUnit(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando unidad personalizada')
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
      unidad: typeof material.unidad === 'string' ? material.unidad : material.unidad._id,
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

  const getUnitDisplay = (unit: string | Unit) => {
    if (typeof unit === 'object') {
      return `${unit.nombre} (${unit.abreviatura})`
    }
    const foundUnit = units.find(u => u._id === unit)
    return foundUnit ? `${foundUnit.nombre} (${foundUnit.abreviatura})` : 'Unidad desconocida'
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

        <div className="unit-selector">
          <select
            value={form.unidad}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setShowCustomUnit(true)
              } else {
                setForm({...form, unidad: e.target.value})
              }
            }}
            disabled={submitting}
            required
          >
            <option value="">Seleccionar unidad *</option>
            {units.map(unit => (
              <option key={unit._id} value={unit._id}>
                {unit.nombre} ({unit.abreviatura})
              </option>
            ))}
            <option value="custom">➕ Agregar unidad personalizada</option>
          </select>

          {showCustomUnit && (
            <div className="custom-unit-form">
              <input
                type="text"
                placeholder="Nombre de la unidad"
                value={customUnit.nombre}
                onChange={(e) => setCustomUnit({...customUnit, nombre: e.target.value})}
              />
              <input
                type="text"
                placeholder="Abreviatura (ej: kg, L, m)"
                value={customUnit.abreviatura}
                onChange={(e) => setCustomUnit({...customUnit, abreviatura: e.target.value})}
              />
              <input
                type="text"
                placeholder="Tipo (opcional: peso, volumen, etc.)"
                value={customUnit.tipo}
                onChange={(e) => setCustomUnit({...customUnit, tipo: e.target.value})}
              />
              <div className="form-actions">
                <button type="button" onClick={handleAddCustomUnit} className="button small">
                  Guardar Unidad
                </button>
                <button type="button" onClick={() => setShowCustomUnit(false)} className="button secondary small">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <input
          type="number"
          placeholder="Stock / Cantidad disponible"
          value={form.stock}
          onChange={(e) => setForm({...form, stock: Number(e.target.value)})}
          disabled={submitting}
          min="0"
          step="0.01"
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
                <p><strong>Unidad:</strong> {getUnitDisplay(material.unidad)}</p>
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