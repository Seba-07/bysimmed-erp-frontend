'use client'

import { useState, useEffect } from 'react'

interface Material {
  _id: string
  nombre: string
  unidad: string
  precioUnitario: number
}

interface MaterialItem {
  materialId: string | Material
  cantidad: number
}

interface Component {
  _id: string
  nombre: string
  descripcion?: string
  imagen?: string
  materiales: MaterialItem[]
  stock: number
  precioUnitario: number
  fechaCreacion: string
}

interface ComponentResponse {
  success: boolean
  count?: number
  data?: Component | Component[]
  message?: string
}

interface MaterialResponse {
  success: boolean
  data?: Material[]
}

export default function Components() {
  const [components, setComponents] = useState<Component[]>([])
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    stock: 0,
    precioUnitario: 0
  })
  const [materialsList, setMaterialsList] = useState<MaterialItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadComponents()
    loadMaterials()
  }, [])

  const loadComponents = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/inventory/components`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: ComponentResponse = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setComponents(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando componentes')
    } finally {
      setLoading(false)
    }
  }

  const loadMaterials = async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventory/materials`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: MaterialResponse = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setAvailableMaterials(data.data)
      }
    } catch (err) {
      console.error('Error cargando materiales:', err)
    }
  }

  const addMaterial = () => {
    if (availableMaterials.length === 0) {
      alert('No hay materiales disponibles. Crea materiales primero.')
      return
    }
    setMaterialsList([...materialsList, { materialId: availableMaterials[0]._id, cantidad: 1 }])
  }

  const removeMaterial = (index: number) => {
    setMaterialsList(materialsList.filter((_, i) => i !== index))
  }

  const updateMaterial = (index: number, field: 'materialId' | 'cantidad', value: string | number) => {
    const updated = [...materialsList]
    updated[index] = { ...updated[index], [field]: value }
    setMaterialsList(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre) {
      setError('El nombre es requerido')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const url = editingId
        ? `${API_URL}/api/inventory/components/${editingId}`
        : `${API_URL}/api/inventory/components`

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          materiales: materialsList
        })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: ComponentResponse = await res.json()
      if (data.success) {
        setForm({ nombre: '', descripcion: '', stock: 0, precioUnitario: 0 })
        setMaterialsList([])
        setEditingId(null)
        loadComponents()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando componente')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (component: Component) => {
    setForm({
      nombre: component.nombre,
      descripcion: component.descripcion || '',
      stock: component.stock,
      precioUnitario: component.precioUnitario
    })
    setMaterialsList(component.materiales.map(m => ({
      materialId: typeof m.materialId === 'string' ? m.materialId : m.materialId._id,
      cantidad: m.cantidad
    })))
    setEditingId(component._id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este componente?')) return

    try {
      const res = await fetch(`${API_URL}/api/inventory/components/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      loadComponents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando componente')
    }
  }

  const cancelEdit = () => {
    setForm({ nombre: '', descripcion: '', stock: 0, precioUnitario: 0 })
    setMaterialsList([])
    setEditingId(null)
  }

  const getMaterialName = (materialId: string | Material) => {
    if (typeof materialId === 'object') return materialId.nombre
    const material = availableMaterials.find(m => m._id === materialId)
    return material?.nombre || 'Material desconocido'
  }

  return (
    <div className="section">
      <h2>🔧 Gestión de Componentes</h2>

      <form onSubmit={handleSubmit} className="inventory-form">
        <input
          type="text"
          placeholder="Nombre del componente *"
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

        <div className="materials-section">
          <div className="section-header">
            <h4>📦 Materiales del componente</h4>
            <button type="button" onClick={addMaterial} className="button secondary small">
              + Agregar Material
            </button>
          </div>

          {materialsList.map((item, index) => (
            <div key={index} className="material-item">
              <select
                value={typeof item.materialId === 'string' ? item.materialId : item.materialId._id}
                onChange={(e) => updateMaterial(index, 'materialId', e.target.value)}
                disabled={submitting}
              >
                {availableMaterials.map(mat => (
                  <option key={mat._id} value={mat._id}>
                    {mat.nombre} ({mat.unidad})
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Cantidad"
                value={item.cantidad}
                onChange={(e) => updateMaterial(index, 'cantidad', Number(e.target.value))}
                disabled={submitting}
                min="0"
                step="0.01"
              />
              <button
                type="button"
                onClick={() => removeMaterial(index)}
                className="button danger small"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="button">
            {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar Componente'}
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
        <p>Cargando componentes...</p>
      ) : components.length > 0 ? (
        <div className="inventory-list">
          <h3>📋 Componentes registrados ({components.length})</h3>
          {components.map((component) => (
            <div key={component._id} className="inventory-card">
              <div className="card-header">
                <h4>{component.nombre}</h4>
                <div className="card-actions">
                  <button onClick={() => handleEdit(component)} className="edit-btn">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(component._id)} className="delete-btn">
                    🗑️
                  </button>
                </div>
              </div>
              {component.descripcion && <p className="description">{component.descripcion}</p>}
              <div className="card-details">
                <p><strong>Stock:</strong> {component.stock}</p>
                <p><strong>Precio:</strong> ${component.precioUnitario.toFixed(2)}</p>

                {component.materiales.length > 0 && (
                  <div className="nested-list">
                    <p><strong>Materiales:</strong></p>
                    <ul>
                      {component.materiales.map((mat, idx) => (
                        <li key={idx}>
                          {getMaterialName(mat.materialId)} - {mat.cantidad}{' '}
                          {typeof mat.materialId === 'object' ? mat.materialId.unidad : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="date">📅 {new Date(component.fechaCreacion).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No hay componentes registrados</p>
      )}
    </div>
  )
}