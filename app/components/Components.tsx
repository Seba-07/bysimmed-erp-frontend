'use client'

import { useState, useEffect } from 'react'
import CloudinaryUpload from './CloudinaryUpload'

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

interface ComponentsProps {
  onCreated?: () => void
}

export default function Components({ onCreated }: ComponentsProps) {
  const [components, setComponents] = useState<Component[]>([])
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    imagen: '',
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
    if (!availableMaterials || availableMaterials.length === 0) {
      alert('No hay materiales disponibles. Crea materiales primero.')
      return
    }
    const firstMaterial = availableMaterials[0]
    if (!firstMaterial || !firstMaterial._id) {
      alert('Error: Material inválido')
      return
    }
    setMaterialsList([...materialsList, { materialId: firstMaterial._id, cantidad: 1 }])
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
        setForm({ nombre: '', descripcion: '', imagen: '', stock: 0, precioUnitario: 0 })
        setMaterialsList([])
        const isCreating = !editingId
        setEditingId(null)
        loadComponents()
        alert(editingId ? '✅ Componente actualizado exitosamente' : '✅ Componente creado exitosamente')
        if (isCreating && onCreated) {
          onCreated()
        }
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
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Imagen (opcional)</label>
          <CloudinaryUpload
            currentImage={form.imagen}
            onUploadSuccess={(url) => setForm({...form, imagen: url})}
          />
        </div>
        <div className="form-field">
          <label>Stock / Cantidad disponible</label>
          <input
            type="number"
            placeholder="0"
            value={form.stock}
            onChange={(e) => setForm({...form, stock: Number(e.target.value)})}
            disabled={submitting}
            min="0"
            step="0.01"
          />
        </div>
        <div className="form-field">
          <label>Precio unitario</label>
          <input
            type="number"
            placeholder="0.00"
            value={form.precioUnitario}
            onChange={(e) => setForm({...form, precioUnitario: Number(e.target.value)})}
            disabled={submitting}
            min="0"
            step="0.01"
          />
        </div>

        <div className="materials-section">
          <div className="section-header">
            <h4>📦 Materiales del componente</h4>
            <button type="button" onClick={addMaterial} className="button secondary small">
              + Agregar Material
            </button>
          </div>

          {materialsList.map((item, index) => {
            const materialId = typeof item.materialId === 'string'
              ? item.materialId
              : (item.materialId && typeof item.materialId === 'object' && '_id' in item.materialId)
                ? item.materialId._id
                : ''

            return (
              <div key={index} className="material-item">
                <select
                  value={materialId}
                  onChange={(e) => updateMaterial(index, 'materialId', e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="">Seleccionar material...</option>
                  {availableMaterials.map(mat => {
                    let unidad = ''
                    if (typeof mat.unidad === 'string') {
                      unidad = mat.unidad
                    } else if (mat.unidad && typeof mat.unidad === 'object') {
                      const unidadObj = mat.unidad as any
                      unidad = unidadObj.abreviatura || unidadObj.nombre || ''
                    }
                    return (
                      <option key={mat._id} value={mat._id}>
                        {mat.nombre} {unidad ? `(${unidad})` : ''}
                      </option>
                    )
                  })}
                </select>
              <input
                type="number"
                placeholder="Cantidad"
                value={item.cantidad}
                onChange={(e) => updateMaterial(index, 'cantidad', Number(e.target.value))}
                disabled={submitting}
                min="0"
                step="1"
              />
              <button
                type="button"
                onClick={() => removeMaterial(index)}
                className="button danger small"
              >
                ✕
              </button>
            </div>
            )
          })}
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

    </div>
  )
}