import { useState, useEffect } from 'react'
import { Users, Plus, RefreshCw } from 'lucide-react'
import { driversApi } from '../api/driversApi.js'
import useAuthStore from '../store/authStore.js'
import StatusBadge from '../components/StatusBadge.jsx'

const STATUS_OPTIONS = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY']
const STATUS_LABELS  = { AVAILABLE: 'Свободен', ON_TRIP: 'На рейсе', OFF_DUTY: 'Не в смене' }

const emptyForm = { userId: '', licenseNo: '' }

export default function DriversPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'

  const [drivers, setDrivers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [formErr, setFormErr]     = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    driversApi.getAll()
      .then(({ data }) => setDrivers(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(() => setError('Не удалось загрузить список водителей'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (id, status) => {
    try {
      const { data } = await driversApi.updateStatus(id, status)
      setDrivers(prev => prev.map(d => d.id === id ? data : d))
    } catch {
      setError('Ошибка обновления статуса')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormErr('')
    setSaving(true)
    try {
      const { data } = await driversApi.create({
        userId: parseInt(form.userId),
        licenseNo: form.licenseNo,
      })
      setDrivers(prev => [...prev, data])
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Ошибка создания профиля водителя')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Водители</h1>
          <p className="mt-0.5 text-sm text-gray-400">{drivers.length} записей</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 shadow-sm transition-all hover:border-gray-300 hover:text-gray-600"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
          </button>
          {isAdmin && (
            <button
              onClick={() => { setShowForm(s => !s); setFormErr('') }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-500 active:scale-95"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Добавить водителя
            </button>
          )}
        </div>
      </div>

      {/* Create driver form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="mb-1 text-sm font-semibold text-gray-800">Создать профиль водителя</h3>
          <p className="mb-5 text-xs text-gray-400">
            Привязывает аккаунт пользователя (с ролью DRIVER) к профилю водителя в системе
          </p>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">ID пользователя</label>
              <input
                value={form.userId}
                onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                required type="number" min="1" placeholder="Например: 3"
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-300 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-[11px] text-gray-400">ID из раздела «Пользователи»</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Номер водительского удостоверения</label>
              <input
                value={form.licenseNo}
                onChange={e => setForm(f => ({ ...f, licenseNo: e.target.value }))}
                required placeholder="77 АА 123456"
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-300 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {formErr && (
              <p className="text-xs text-red-500 sm:col-span-2">{formErr}</p>
            )}
            <div className="flex justify-end sm:col-span-2">
              <button
                type="submit" disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-500 disabled:opacity-60"
              >
                {saving ? 'Сохранение…' : 'Создать профиль'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : drivers.length === 0 && !error ? (
        <EmptyState isAdmin={isAdmin} onAdd={() => setShowForm(true)} />
      ) : drivers.length > 0 ? (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className={thCls}>Водитель</th>
                  <th className={thCls}>Лицензия</th>
                  <th className={thCls}>Транспорт</th>
                  <th className={thCls}>Статус</th>
                  {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && <th className={thCls}>Изменить статус</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {drivers.map(driver => (
                  <tr key={driver.id} className="transition-colors hover:bg-gray-50/60">
                    <td className={tdCls}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                          {String(driver.userId || driver.id).slice(-2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Водитель #{driver.id}</p>
                          <p className="text-xs text-gray-400">User ID: {driver.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tdCls}>
                      <code className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600">
                        {driver.licenseNo}
                      </code>
                    </td>
                    <td className={tdCls}>
                      {driver.vehicleId
                        ? <span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">ТС #{driver.vehicleId}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={tdCls}><StatusBadge status={driver.status} /></td>
                    {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                      <td className={tdCls}>
                        <select
                          value={driver.status}
                          onChange={e => handleStatusChange(driver.id, e.target.value)}
                          className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none transition-all focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="flex flex-col gap-3 sm:hidden">
            {drivers.map(driver => (
              <div key={driver.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                      {String(driver.userId || driver.id).slice(-2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Водитель #{driver.id}</p>
                      <p className="text-xs text-gray-400">User ID: {driver.userId}</p>
                    </div>
                  </div>
                  <StatusBadge status={driver.status} />
                </div>
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1">
                    <span className="font-medium">ВУ:</span> {driver.licenseNo}
                  </span>
                  {driver.vehicleId && (
                    <span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-blue-700">
                      ТС #{driver.vehicleId}
                    </span>
                  )}
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                  <select
                    value={driver.status}
                    onChange={e => handleStatusChange(driver.id, e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

function EmptyState({ isAdmin, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
        <Users className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-gray-500">Профили водителей не созданы</p>
      <p className="text-xs text-gray-400">Создайте аккаунт с ролью DRIVER, затем привяжите его здесь</p>
      {isAdmin && (
        <button
          onClick={onAdd}
          className="mt-2 flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Создать профиль водителя
        </button>
      )}
    </div>
  )
}

const thCls = 'px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-400'
const tdCls = 'px-5 py-4 text-sm'
