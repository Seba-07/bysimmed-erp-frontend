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
  categoria: 'Accesorios' | 'Aditivos' | 'Filamentos' | 'Limpieza' | 'Pegamentos' | 'Resina' | 'Silicona'
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
  const [units, setUnits] = useState<Unit[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'Silicona' as 'Accesorios' | 'Aditivos' | 'Filamentos' | 'Limpieza' | 'Pegamentos' | 'Resina' | 'Silicona',
    unidad: '',
    stock: 0
  })
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCustomUnit, setShowCustomUnit] = useState(false)
  const [customUnit, setCustomUnit] = useState({ nombre: '', abreviatura: '', tipo: '' })

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

  useEffect(() => {
    loadUnits()
  }, [])

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
        setForm({ nombre: '', descripcion: '', categoria: 'Silicona', unidad: '', stock: 0 })
        setEditingId(null)
        alert(editingId ? '✅ Material actualizado exitosamente' : '✅ Material creado exitosamente')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando material')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelEdit = () => {
    setForm({ nombre: '', descripcion: '', categoria: 'Silicona', unidad: '', stock: 0 })
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

        <select
          value={form.categoria}
          onChange={(e) => setForm({...form, categoria: e.target.value as any})}
          disabled={submitting}
          required
        >
          <option value="Silicona">Silicona</option>
          <option value="Resina">Resina</option>
          <option value="Filamentos">Filamentos</option>
          <option value="Pegamentos">Pegamentos</option>
          <option value="Aditivos">Aditivos</option>
          <option value="Accesorios">Accesorios</option>
          <option value="Limpieza">Limpieza</option>
        </select>

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
    </div>
  )
}