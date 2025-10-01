'use client'

import { useState, useEffect } from 'react'

interface Unit {
  _id: string
  nombre: string
  abreviatura: string
  tipo?: string
}

interface Presentacion {
  nombre: string
  factorConversion: number
  precioCompra?: number
}

interface Material {
  _id: string
  nombre: string
  descripcion?: string
  imagen?: string
  categoria: 'Accesorios' | 'Aditivos' | 'Filamentos' | 'Limpieza' | 'Pegamentos' | 'Resina' | 'Silicona'
  unidadBase: string | Unit
  stock: number
  precioUnitario: number
  presentaciones: Presentacion[]
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
    unidadBase: '',
    stock: 0,
    presentaciones: [] as Presentacion[]
  })
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCustomUnit, setShowCustomUnit] = useState(false)
  const [customUnit, setCustomUnit] = useState({ nombre: '', abreviatura: '', tipo: '' })
  const [newPresentacion, setNewPresentacion] = useState({ nombre: '', factorConversion: 0, precioCompra: 0 })

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
        setForm({ ...form, unidadBase: data.data._id })
        setCustomUnit({ nombre: '', abreviatura: '', tipo: '' })
        setShowCustomUnit(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando unidad personalizada')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.unidadBase) {
      setError('Nombre y unidad base son requeridos')
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
        setForm({ nombre: '', descripcion: '', categoria: 'Silicona', unidadBase: '', stock: 0, presentaciones: [] })
        setEditingId(null)
        alert(editingId ? '✅ Material actualizado exitosamente' : '✅ Material creado exitosamente')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando material')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta unidad? No podrás eliminarla si está siendo usada por algún material.')) return

    try {
      const res = await fetch(`${API_URL}/api/inventory/units/${unitId}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.success) {
        alert('✅ Unidad eliminada exitosamente')
        loadUnits()
      } else {
        alert(`❌ ${data.message}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando unidad')
    }
  }

  const handleAddPresentacion = () => {
    if (!newPresentacion.nombre || newPresentacion.factorConversion <= 0) {
      alert('Debes ingresar un nombre y un factor de conversión válido')
      return
    }

    setForm({
      ...form,
      presentaciones: [...form.presentaciones, { ...newPresentacion }]
    })
    setNewPresentacion({ nombre: '', factorConversion: 0, precioCompra: 0 })
  }

  const handleRemovePresentacion = (index: number) => {
    setForm({
      ...form,
      presentaciones: form.presentaciones.filter((_, i) => i !== index)
    })
  }

  const cancelEdit = () => {
    setForm({ nombre: '', descripcion: '', categoria: 'Silicona', unidadBase: '', stock: 0, presentaciones: [] })
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
          <label>Unidad Base de Fabricación *</label>
          <div className="unit-selector-with-delete">
            <select
              value={form.unidadBase}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowCustomUnit(true)
                } else {
                  setForm({...form, unidadBase: e.target.value})
                }
              }}
              disabled={submitting}
              required
            >
              <option value="">Seleccionar unidad base *</option>
              {units.map(unit => (
                <option key={unit._id} value={unit._id}>
                  {unit.nombre} ({unit.abreviatura})
                </option>
              ))}
              <option value="custom">➕ Agregar unidad personalizada</option>
            </select>
            {form.unidadBase && form.unidadBase !== 'custom' && (
              <button
                type="button"
                onClick={() => handleDeleteUnit(form.unidadBase)}
                className="button small secondary"
                title="Eliminar unidad"
              >
                🗑️
              </button>
            )}
          </div>

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

        {/* Presentaciones de Compra */}
        <div className="presentaciones-section">
          <h3>Presentaciones de Compra</h3>
          <p className="help-text">Agrega las presentaciones en las que compras este material (ej: Frasco 2 libras = 900 gramos)</p>

          {form.presentaciones.length > 0 && (
            <div className="presentaciones-list">
              {form.presentaciones.map((pres, index) => (
                <div key={index} className="presentacion-item">
                  <div className="presentacion-info">
                    <strong>{pres.nombre}</strong>
                    <span>1 unidad = {pres.factorConversion} {units.find(u => u._id === form.unidadBase)?.abreviatura || 'unidades base'}</span>
                    {pres.precioCompra ? <span>Precio: ${pres.precioCompra}</span> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePresentacion(index)}
                    className="button small secondary"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="add-presentacion-form">
            <input
              type="text"
              placeholder="Nombre (ej: Frasco 2 libras)"
              value={newPresentacion.nombre}
              onChange={(e) => setNewPresentacion({...newPresentacion, nombre: e.target.value})}
              disabled={submitting}
            />
            <input
              type="number"
              placeholder="Factor de conversión (ej: 900)"
              value={newPresentacion.factorConversion || ''}
              onChange={(e) => setNewPresentacion({...newPresentacion, factorConversion: Number(e.target.value)})}
              disabled={submitting}
              min="0"
              step="0.01"
            />
            <input
              type="number"
              placeholder="Precio de compra (opcional)"
              value={newPresentacion.precioCompra || ''}
              onChange={(e) => setNewPresentacion({...newPresentacion, precioCompra: Number(e.target.value)})}
              disabled={submitting}
              min="0"
              step="0.01"
            />
            <button
              type="button"
              onClick={handleAddPresentacion}
              className="button small"
              disabled={submitting}
            >
              ➕ Agregar Presentación
            </button>
          </div>
        </div>

        <div className="form-field">
          <label>Stock Inicial (en unidad base)</label>
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