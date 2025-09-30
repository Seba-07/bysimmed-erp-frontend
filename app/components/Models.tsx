'use client'

import { useState, useEffect } from 'react'

interface Component {
  _id: string
  nombre: string
  precioUnitario: number
}

interface ComponentItem {
  componentId: string | Component
  cantidad: number
}

interface Model {
  _id: string
  nombre: string
  descripcion?: string
  imagen?: string
  componentes: ComponentItem[]
  stock: number
  precioUnitario: number
  fechaCreacion: string
}

interface ModelResponse {
  success: boolean
  count?: number
  data?: Model | Model[]
  message?: string
}

interface ComponentResponse {
  success: boolean
  data?: Component[]
}

export default function Models() {
  const [models, setModels] = useState<Model[]>([])
  const [availableComponents, setAvailableComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    stock: 0,
    precioUnitario: 0
  })
  const [componentsList, setComponentsList] = useState<ComponentItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadModels()
    loadComponents()
  }, [])

  const loadModels = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/inventory/models`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: ModelResponse = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setModels(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando modelos')
    } finally {
      setLoading(false)
    }
  }

  const loadComponents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/inventory/components`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: ComponentResponse = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setAvailableComponents(data.data)
      }
    } catch (err) {
      console.error('Error cargando componentes:', err)
    }
  }

  const addComponent = () => {
    if (!availableComponents || availableComponents.length === 0) {
      alert('No hay componentes disponibles. Crea componentes primero.')
      return
    }
    const firstComponent = availableComponents[0]
    if (!firstComponent || !firstComponent._id) {
      alert('Error: Componente inválido')
      return
    }
    setComponentsList([...componentsList, { componentId: firstComponent._id, cantidad: 1 }])
  }

  const removeComponent = (index: number) => {
    setComponentsList(componentsList.filter((_, i) => i !== index))
  }

  const updateComponent = (index: number, field: 'componentId' | 'cantidad', value: string | number) => {
    const updated = [...componentsList]
    updated[index] = { ...updated[index], [field]: value }
    setComponentsList(updated)
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
        ? `${API_URL}/api/inventory/models/${editingId}`
        : `${API_URL}/api/inventory/models`

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          componentes: componentsList
        })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: ModelResponse = await res.json()
      if (data.success) {
        setForm({ nombre: '', descripcion: '', stock: 0, precioUnitario: 0 })
        setComponentsList([])
        setEditingId(null)
        loadModels()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando modelo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (model: Model) => {
    setForm({
      nombre: model.nombre,
      descripcion: model.descripcion || '',
      stock: model.stock,
      precioUnitario: model.precioUnitario
    })
    setComponentsList(model.componentes.map(c => ({
      componentId: typeof c.componentId === 'string' ? c.componentId : c.componentId._id,
      cantidad: c.cantidad
    })))
    setEditingId(model._id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este modelo?')) return

    try {
      const res = await fetch(`${API_URL}/api/inventory/models/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      loadModels()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando modelo')
    }
  }

  const cancelEdit = () => {
    setForm({ nombre: '', descripcion: '', stock: 0, precioUnitario: 0 })
    setComponentsList([])
    setEditingId(null)
  }

  const getComponentName = (componentId: string | Component) => {
    if (typeof componentId === 'object') return componentId.nombre
    const component = availableComponents.find(c => c._id === componentId)
    return component?.nombre || 'Componente desconocido'
  }

  return (
    <div className="section">
      <h2>🏭 Gestión de Modelos</h2>

      <form onSubmit={handleSubmit} className="inventory-form">
        <input
          type="text"
          placeholder="Nombre del modelo *"
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
            <h4>🔧 Componentes del modelo</h4>
            <button type="button" onClick={addComponent} className="button secondary small">
              + Agregar Componente
            </button>
          </div>

          {componentsList.map((item, index) => (
            <div key={index} className="material-item">
              <select
                value={typeof item.componentId === 'string' ? item.componentId : item.componentId._id}
                onChange={(e) => updateComponent(index, 'componentId', e.target.value)}
                disabled={submitting}
              >
                {availableComponents.map(comp => (
                  <option key={comp._id} value={comp._id}>
                    {comp.nombre}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Cantidad"
                value={item.cantidad}
                onChange={(e) => updateComponent(index, 'cantidad', parseInt(e.target.value) || 0)}
                disabled={submitting}
                min="1"
                step="1"
              />
              <button
                type="button"
                onClick={() => removeComponent(index)}
                className="button danger small"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={submitting} className="button">
            {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar Modelo'}
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
        <p>Cargando modelos...</p>
      ) : models.length > 0 ? (
        <div className="inventory-list">
          <h3>📋 Modelos registrados ({models.length})</h3>
          {models.map((model) => (
            <div key={model._id} className="inventory-card">
              <div className="card-header">
                <h4>{model.nombre}</h4>
                <div className="card-actions">
                  <button onClick={() => handleEdit(model)} className="edit-btn">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(model._id)} className="delete-btn">
                    🗑️
                  </button>
                </div>
              </div>
              {model.descripcion && <p className="description">{model.descripcion}</p>}
              <div className="card-details">
                <p><strong>Stock:</strong> {model.stock}</p>
                <p><strong>Precio:</strong> ${model.precioUnitario.toFixed(2)}</p>

                {model.componentes.length > 0 && (
                  <div className="nested-list">
                    <p><strong>Componentes:</strong></p>
                    <ul>
                      {model.componentes.map((comp, idx) => (
                        <li key={idx}>
                          {getComponentName(comp.componentId)} - {comp.cantidad} unidades
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="date">📅 {new Date(model.fechaCreacion).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No hay modelos registrados</p>
      )}
    </div>
  )
}