import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Trash2, ChevronLeft, ChevronRight, RefreshCw, Pencil, X } from 'lucide-react'
import { usersApi } from '../api/usersApi.js'
import { driversApi } from '../api/driversApi.js'

const ROLES = ['ADMIN', 'MANAGER', 'DRIVER', 'CLIENT']

const ROLE_META = {
  ADMIN:   { label: 'Администратор', color: '#8B5CF6', bg: '#F5F3FF' },
  MANAGER: { label: 'Менеджер',      color: '#3B82F6', bg: '#EFF6FF' },
  DRIVER:  { label: 'Водитель',      color: '#10B981', bg: '#ECFDF5' },
  CLIENT:  { label: 'Клиент',        color: '#F59E0B', bg: '#FFFBEB' },
}

const DRIVER_STATUS_META = {
  AVAILABLE: { label: 'Доступен',   color: '#10B981', bg: '#ECFDF5' },
  ON_TRIP:   { label: 'В рейсе',    color: '#3B82F6', bg: '#EFF6FF' },
  OFF_DUTY:  { label: 'Не в смене', color: '#6B7280', bg: '#F3F4F6' },
}

const FILTER_TABS = [
  { label: 'Все',            value: null      },
  { label: 'Администраторы', value: 'ADMIN'   },
  { label: 'Менеджеры',      value: 'MANAGER' },
  { label: 'Водители',       value: 'DRIVER'  },
  { label: 'Клиенты',        value: 'CLIENT'  },
]

const emptyForm = { firstName: '', lastName: '', email: '', password: '', role: 'CLIENT', licenseNo: '' }
const PAGE_SIZE = 20

export default function UsersPage() {
  const [users, setUsers]           = useState([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(0)
  const [loading, setLoading]       = useState(false)
  const [roleFilter, setRoleFilter] = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(emptyForm)
  const [formErr, setFormErr]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(null)
  const [editUser, setEditUser]     = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [editSaving, setEditSaving] = useState(false)
  const [editErr, setEditErr]       = useState('')
  const [driverMap, setDriverMap]   = useState({})

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, size: PAGE_SIZE, sort: 'id,asc', ...(roleFilter ? { role: roleFilter } : {}) }
    Promise.all([
      usersApi.list(params),
      driversApi.getAll().catch(() => ({ data: [] })),
    ])
      .then(([{ data: ud }, { data: dd }]) => {
        const all = ud.content ?? ud
        setUsers(all)
        setTotal(ud.totalElements ?? all.length)
        const drivers = Array.isArray(dd) ? dd : (dd.content ?? [])
        const map = {}
        drivers.forEach(d => { map[d.userId] = d })
        setDriverMap(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, roleFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [roleFilter])

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormErr('')
    setSaving(true)
    try {
      const { data: created } = await usersApi.create({
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
        role:      form.role,
      })
      if (form.role === 'DRIVER' && form.licenseNo.trim()) {
        try {
          await driversApi.create({ userId: created.id, licenseNo: form.licenseNo.trim() })
        } catch (_) {}
      }
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Ошибка создания пользователя')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return
    setDeleting(id)
    try {
      await usersApi.remove(id)
      setUsers(u => u.filter(x => x.id !== id))
      setTotal(t => t - 1)
    } catch {
    } finally { setDeleting(null) }
  }

  const openEdit = (u) => {
    setEditUser(u)
    setEditForm({ firstName: u.firstName, lastName: u.lastName, role: u.role })
    setEditErr('')
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setEditSaving(true); setEditErr('')
    try {
      await usersApi.update(editUser.id, editForm)
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...editForm } : u))
      setEditUser(null)
    } catch (err) {
      setEditErr(err.response?.data?.message || 'Ошибка сохранения')
    } finally { setEditSaving(false) }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
    setForm(f => ({ ...f, password: Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') }))
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Пользователи</h1>
          <p className="mt-0.5 text-sm text-gray-400">{total} аккаунтов в системе</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 shadow-sm transition-all hover:border-gray-300 hover:text-gray-600">
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => { setShowForm(s => !s); setFormErr(''); setForm(emptyForm) }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-500 active:scale-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            Новый пользователь
          </button>
        </div>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-1">
        {FILTER_TABS.map(t => (
          <button key={String(t.value)} onClick={() => setRoleFilter(t.value)}
            className={`flex flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              roleFilter === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="mb-5 text-sm font-semibold text-gray-800">Новый пользователь</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Имя">
              <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                required placeholder="Иван" className={INP} />
            </Field>
            <Field label="Фамилия">
              <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                required placeholder="Иванов" className={INP} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required placeholder="ivan@example.com" className={INP} />
            </Field>
            <Field label="Роль">
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value, licenseNo: '' }))}
                className={INP}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>)}
              </select>
            </Field>

            {form.role === 'DRIVER' && (
              <Field label="Номер водительского удостоверения" className="sm:col-span-2">
                <input value={form.licenseNo} onChange={e => setForm(f => ({ ...f, licenseNo: e.target.value }))}
                  required placeholder="1234 567890" className={INP} />
              </Field>
            )}

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-gray-500">Пароль</label>
              <div className="flex gap-2">
                <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required minLength={6} placeholder="Минимум 6 символов" className={INP + ' flex-1'} />
                <button type="button" onClick={generatePassword}
                  className="flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-100">
                  Сгенерировать
                </button>
              </div>
            </div>

            {formErr && <p className="text-xs text-red-500 sm:col-span-2">{formErr}</p>}

            <div className="flex justify-end sm:col-span-2">
              <button type="submit" disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-500 disabled:opacity-60">
                {saving ? 'Сохранение…' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setEditUser(null) }}>
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                Редактировать: {editUser.firstName} {editUser.lastName}
              </h3>
              <button onClick={() => setEditUser(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Имя">
                  <input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                    required className={INP} />
                </Field>
                <Field label="Фамилия">
                  <input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                    required className={INP} />
                </Field>
              </div>
              <Field label="Роль">
                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  className={INP}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>)}
                </select>
              </Field>
              {editErr && <p className="text-xs text-red-500">{editErr}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditUser(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-all hover:bg-gray-50">
                  Отмена
                </button>
                <button type="submit" disabled={editSaving}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-blue-500 disabled:opacity-60">
                  {editSaving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />)}
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <table className="hidden w-full sm:table">
              <thead>
                <tr className="border-b border-gray-50">
                  {['ID', 'Пользователь', 'Email', 'Роль', 'Статус / ВУ', 'Создан', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => {
                  const meta    = ROLE_META[u.role] ?? { label: u.role, color: '#6B7280', bg: '#F9FAFB' }
                  const driver  = driverMap[u.id]
                  const dsMeta  = driver ? (DRIVER_STATUS_META[driver.status] ?? DRIVER_STATUS_META['OFF_DUTY']) : null
                  const initials = `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase()
                  return (
                    <tr key={u.id} className="transition-colors hover:bg-gray-50/70">
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-400">#{u.id}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                            {initials || <Users className="h-3.5 w-3.5" />}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ color: meta.color, background: meta.bg }}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.role === 'DRIVER' && (
                          <div className="flex flex-col gap-0.5">
                            {dsMeta ? (
                              <span className="w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{ color: dsMeta.color, background: dsMeta.bg }}>
                                {dsMeta.label}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400">Профиль не создан</span>
                            )}
                            {driver?.licenseNo && (
                              <span className="text-[10px] text-gray-400">ВУ: {driver.licenseNo}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ru-RU') : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(u)}
                            className="flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-all hover:bg-gray-100">
                            <Pencil className="h-3 w-3" strokeWidth={2} /> Изменить
                          </button>
                          <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id}
                            className="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-100 disabled:opacity-50">
                            <Trash2 className="h-3 w-3" strokeWidth={2} />
                            {deleting === u.id ? '…' : 'Удалить'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-gray-400">Нет пользователей</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ── Mobile cards ── */}
            <div className="divide-y divide-gray-50 sm:hidden">
              {users.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">Нет пользователей</p>
              ) : users.map(u => {
                const meta    = ROLE_META[u.role] ?? { label: u.role, color: '#6B7280', bg: '#F9FAFB' }
                const driver  = driverMap[u.id]
                const dsMeta  = driver ? (DRIVER_STATUS_META[driver.status] ?? DRIVER_STATUS_META['OFF_DUTY']) : null
                const initials = `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase()
                return (
                  <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {initials || <Users className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                        <p className="truncate text-xs text-gray-400">{u.email}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ color: meta.color, background: meta.bg }}>
                            {meta.label}
                          </span>
                          {u.role === 'DRIVER' && dsMeta && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ color: dsMeta.color, background: dsMeta.bg }}>
                              {dsMeta.label}
                            </span>
                          )}
                          {driver?.licenseNo && (
                            <span className="text-[10px] text-gray-400">ВУ: {driver.licenseNo}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <button onClick={() => openEdit(u)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700">
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} disabled={deleting === u.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-400 transition-all hover:bg-red-100 disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-gray-50 px-5 py-3">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-gray-300 hover:text-gray-600 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="text-xs text-gray-500">Стр. {page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-gray-300 hover:text-gray-600 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children, className }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  )
}

const INP = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-300 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100'
