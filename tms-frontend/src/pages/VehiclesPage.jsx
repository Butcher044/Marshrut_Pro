import { useState, useEffect } from 'react'
import { Truck, Plus, X, Trash2 } from 'lucide-react'
import { vehiclesApi } from '../api/vehiclesApi.js'
import StatusBadge from '../components/StatusBadge.jsx'
import useAuthStore from '../store/authStore.js'

const emptyForm = { plateNumber: '', model: '', cargoType: '', maxWeight: '', maxVolume: '' }

export default function VehiclesPage() {
  const { user } = useAuthStore()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(emptyForm)
  const [error, setError]       = useState('')

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    vehiclesApi.getAll()
      .then(({ data }) => setVehicles(data))
      .catch(() => setError('Не удалось загрузить транспорт'))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        maxWeight: form.maxWeight ? parseFloat(form.maxWeight) : null,
        maxVolume: form.maxVolume ? parseFloat(form.maxVolume) : null,
      }
      const { data } = await vehiclesApi.create(payload)
      setVehicles(prev => [...prev, data])
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка создания')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить транспортное средство?')) return
    try {
      await vehiclesApi.delete(id)
      setVehicles(prev => prev.filter(v => v.id !== id))
    } catch {
      setError('Ошибка удаления')
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Транспорт</h1>
          <p className="mt-0.5 text-sm text-gray-400">{vehicles.length} единиц в парке</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 active:scale-95"
          >
            {showForm ? <><X className="h-4 w-4" /> Отмена</> : <><Plus className="h-4 w-4" /> Добавить</>}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="mb-5 text-base font-semibold text-gray-900">Новое транспортное средство</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Гос. номер" required>
              <input value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })}
                className={inp} placeholder="А001АА77" required />
            </Field>
            <Field label="Модель" required>
              <input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}
                className={inp} placeholder="MAN TGX" required />
            </Field>
            <Field label="Тип груза">
              <input value={form.cargoType} onChange={e => setForm({ ...form, cargoType: e.target.value })}
                className={inp} placeholder="Генеральный" />
            </Field>
            <Field label="Макс. вес (кг)">
              <input type="number" value={form.maxWeight} onChange={e => setForm({ ...form, maxWeight: e.target.value })}
                className={inp} placeholder="10000" />
            </Field>
            <Field label="Макс. объём (м³)">
              <input type="number" value={form.maxVolume} onChange={e => setForm({ ...form, maxVolume: e.target.value })}
                className={inp} placeholder="45" />
            </Field>
            <div className="flex items-end">
              <button type="submit"
                className="w-full rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-500 active:scale-95">
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicle list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:block">
            <div className="grid items-center gap-4 border-b border-gray-50 px-5 py-3"
                 style={{ gridTemplateColumns: '3rem 1fr 1fr 1fr 1fr 1fr auto' }}>
              {['', 'Транспортное средство', 'Тип груза', 'Макс. вес', 'Макс. объём', 'Статус', ''].map((h, i) => (
                <span key={i} className="text-xs font-medium uppercase tracking-wide text-gray-400">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-gray-50">
              {vehicles.map((v, idx) => (
                <VehicleRow key={v.id} v={v} idx={idx} isAdmin={isAdmin} onDelete={handleDelete} />
              ))}
            </div>
          </div>

          {/* ── Mobile cards ── */}
          <div className="flex flex-col gap-3 sm:hidden">
            {vehicles.map((v, idx) => (
              <div key={v.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
                      <MiniTruck />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{v.model}</p>
                      <p className="text-xs text-gray-400">{v.plateNumber}</p>
                      <p className="text-[10px] text-gray-300">TR-{String(idx + 1).padStart(3, '0')}</p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <StatusBadge status={v.status} />
                    {isAdmin && (
                      <button onClick={() => handleDelete(v.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {v.cargoType && (
                    <span className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1">
                      <span className="font-medium">Груз:</span> {v.cargoType}
                    </span>
                  )}
                  {v.maxWeight && (
                    <span className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1">
                      <span className="font-medium">Вес:</span> {Number(v.maxWeight).toLocaleString('ru')} кг
                    </span>
                  )}
                  {v.maxVolume && (
                    <span className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1">
                      <span className="font-medium">Объём:</span> {v.maxVolume} м³
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function VehicleRow({ v, idx, isAdmin, onDelete }) {
  return (
    <div
      className="grid items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/60"
      style={{ gridTemplateColumns: '3rem 1fr 1fr 1fr 1fr 1fr auto' }}
    >
      {/* Sequence label */}
      <span className="text-xs font-medium text-gray-300">
        TR-{String(idx + 1).padStart(3, '0')}
      </span>

      {/* Model + plate */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">
          <MiniTruck />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{v.model}</p>
          <p className="text-xs text-gray-400">{v.plateNumber}</p>
        </div>
      </div>

      {/* Cargo type */}
      <span className="text-sm text-gray-600">{v.cargoType || <span className="text-gray-300">—</span>}</span>

      {/* Max weight */}
      <span className="text-sm font-medium text-gray-800">
        {v.maxWeight ? `${Number(v.maxWeight).toLocaleString('ru')} кг` : <span className="text-gray-300">—</span>}
      </span>

      {/* Max volume */}
      <span className="text-sm font-medium text-gray-800">
        {v.maxVolume ? `${v.maxVolume} м³` : <span className="text-gray-300">—</span>}
      </span>

      {/* Status */}
      <StatusBadge status={v.status} />

      {/* Delete */}
      {isAdmin ? (
        <button
          onClick={() => onDelete(v.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ) : <span />}
    </div>
  )
}

function MiniTruck() {
  return (
    <svg viewBox="0 0 56 28" className="h-5 w-10" fill="none">
      <rect x="1" y="6" width="34" height="14" rx="2" fill="#E5E7EB" />
      <path d="M35 14 L35 9 C35 9 39 9 43 13 L46 16 L46 20 L35 20 Z" fill="#D1D5DB" />
      <rect x="37" y="10" width="5" height="4" rx="1" fill="#93C5FD" />
      <circle cx="8"  cy="21" r="3.5" fill="#374151" />
      <circle cx="8"  cy="21" r="1.5" fill="#9CA3AF" />
      <circle cx="27" cy="21" r="3.5" fill="#374151" />
      <circle cx="27" cy="21" r="1.5" fill="#9CA3AF" />
      <circle cx="43" cy="21" r="3.5" fill="#374151" />
      <circle cx="43" cy="21" r="1.5" fill="#9CA3AF" />
    </svg>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
        <Truck className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
      </div>
      <p className="text-sm text-gray-400">Транспортных средств пока нет</p>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}{required && ' *'}</label>
      {children}
    </div>
  )
}

const inp = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-300 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100'
