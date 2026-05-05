import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Package, Plus, RefreshCw, LayoutGrid, List, ChevronRight, Truck, Clock, CheckCircle, XCircle, Eye, Navigation, Trash2 } from 'lucide-react'
import { ordersApi } from '../api/ordersApi.js'
import useAuthStore from '../store/authStore.js'
import StatusBadge from '../components/StatusBadge.jsx'

const KANBAN_COLS = [
  { status: 'PENDING',     label: 'Ожидание',   color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: Clock       },
  { status: 'ASSIGNED',    label: 'Назначены',  color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', icon: Truck       },
  { status: 'IN_PROGRESS', label: 'В пути',     color: '#8B5CF6', bg: '#EEF2FF', border: '#C7D2FE', icon: Navigation  },
  { status: 'DELIVERED',   label: 'Доставлено', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', icon: CheckCircle },
]

const CLIENT_TABS = [
  { label: 'Все',         value: null           },
  { label: 'В ожидании', value: 'PENDING'       },
  { label: 'В пути',     value: 'IN_PROGRESS'   },
  { label: 'Доставлено', value: 'DELIVERED'     },
  { label: 'Отменены',   value: 'CANCELLED'     },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 60000
  if (diff < 1)   return 'только что'
  if (diff < 60)  return `${Math.round(diff)} мин назад`
  if (diff < 1440) return `${Math.round(diff / 60)} ч назад`
  return `${Math.round(diff / 1440)} дн назад`
}

export default function OrdersPage() {
  const { user }   = useAuthStore()
  const navigate   = useNavigate()
  const location   = useLocation()
  const isAdmin    = user?.role === 'ADMIN'
  const isManager  = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const isClient   = user?.role === 'CLIENT'
  const isDriver   = user?.role === 'DRIVER'

  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [view, setView]           = useState('kanban')
  const [clientTab, setClientTab] = useState(null)
  const [assigning, setAssigning]           = useState(null)
  const [deleting, setDeleting]             = useState(null)
  const [dragId, setDragId]                 = useState(null)
  const [dragOver, setDragOver]             = useState(null)
  const [mobileKanbanTab, setMobileKanbanTab] = useState('PENDING')

  // Success toast from wizard
  const createdId = location.state?.created

  const load = async () => {
    setLoading(true); setError('')
    try {
      let data
      if (isClient)  ({ data } = await ordersApi.getMy({ size: 100 }))
      else if (isDriver) ({ data } = await ordersApi.getMyTrips({ size: 100 }))
      else           ({ data } = await ordersApi.getAll({ size: 200 }))
      setOrders(Array.isArray(data) ? data : (data.content ?? []))
    } catch {
      setError('Не удалось загрузить заказы')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleAssign = async (id) => {
    setAssigning(id)
    try {
      const { data } = await ordersApi.assignDriver(id)
      setOrders(prev => prev.map(o => o.id === id ? data : o))
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка назначения водителя')
    } finally { setAssigning(null) }
  }

  const handleDrop = async (colStatus) => {
    if (!dragId || dragId.status === colStatus) { setDragId(null); setDragOver(null); return }
    const id = dragId.id
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: colStatus } : o))
    setDragId(null); setDragOver(null)
    try {
      await ordersApi.updateStatus(id, colStatus)
    } catch {
      load()
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(`Удалить заказ #${id}? Это действие нельзя отменить.`)) return
    setDeleting(id)
    try {
      await ordersApi.delete(id)
      setOrders(prev => prev.filter(o => o.id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка удаления заказа')
    } finally {
      setDeleting(null)
    }
  }

  // ── CLIENT view ──────────────────────────────────────────────
  if (isClient) {
    const filtered = clientTab ? orders.filter(o => o.status === clientTab) : orders
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Мои отправления</h1>
            <p className="mt-0.5 text-sm text-gray-400">{orders.length} заказов всего</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 shadow-sm transition-all hover:text-gray-600">
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button onClick={() => navigate('/create-order')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 active:scale-95">
              <Plus className="h-4 w-4" strokeWidth={2} /> Новый заказ
            </button>
          </div>
        </div>

        {createdId && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" strokeWidth={2} />
            <p className="text-sm text-emerald-700">Заказ <span className="font-semibold">#{createdId}</span> успешно создан. Менеджер назначит водителя в течение 15 минут.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
          {CLIENT_TABS.map(t => (
            <button key={String(t.value)} onClick={() => setClientTab(t.value)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                clientTab === t.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
              {t.value === null && <span className="ml-1.5 tabular-nums text-gray-400">({orders.length})</span>}
              {t.value && <span className="ml-1.5 tabular-nums text-gray-400">({orders.filter(o => o.status === t.value).length})</span>}
            </button>
          ))}
        </div>

        {error && <ErrBanner msg={error} />}

        {loading ? <Skeleton /> : filtered.length === 0 ? (
          <ClientEmpty onNew={() => navigate('/create-order')} />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(order => (
              <ClientOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── DRIVER view ───────────────────────────────────────────────
  if (isDriver) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Мои рейсы</h1>
            <p className="mt-0.5 text-sm text-gray-400">{orders.length} заказов</p>
          </div>
          <button onClick={load}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 shadow-sm transition-all hover:text-gray-600">
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        {error && <ErrBanner msg={error} />}
        {loading ? <Skeleton /> : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-16">
            <Truck className="h-8 w-8 text-gray-200" strokeWidth={1.5} />
            <p className="text-sm text-gray-400">Нет назначенных рейсов</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map(order => <DriverOrderCard key={order.id} order={order} />)}
          </div>
        )}
      </div>
    )
  }

  // ── MANAGER / ADMIN view ─────────────────────────────────────
  const grouped = KANBAN_COLS.reduce((acc, col) => {
    acc[col.status] = orders.filter(o => o.status === col.status)
    return acc
  }, {})
  const cancelled = orders.filter(o => o.status === 'CANCELLED')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Заказы</h1>
          <p className="mt-0.5 text-sm text-gray-400">{orders.length} записей</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 shadow-sm transition-all hover:text-gray-600">
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button onClick={() => setView('kanban')}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${view === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            <button onClick={() => setView('table')}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${view === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <List className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
          <button onClick={() => navigate('/create-order')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 active:scale-95">
            <Plus className="h-4 w-4" strokeWidth={2} /> Новый заказ
          </button>
        </div>
      </div>

      {error && <ErrBanner msg={error} />}

      {loading ? <Skeleton tall /> : view === 'kanban' ? (
        /* ── KANBAN ─────────────────────────────────────────── */
        <div>
          {/* ── MOBILE KANBAN: tab-based ───────────────────── */}
          <div className="lg:hidden">
            <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-1">
              {KANBAN_COLS.map(col => {
                const count = (grouped[col.status] || []).length
                const Icon = col.icon
                return (
                  <button key={col.status} onClick={() => setMobileKanbanTab(col.status)}
                    className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      mobileKanbanTab === col.status ? 'bg-white shadow-sm' : 'text-gray-500'
                    }`}
                    style={mobileKanbanTab === col.status ? { color: col.color } : {}}>
                    <Icon className="h-3 w-3" strokeWidth={2} />
                    <span>{col.label}</span>
                    <span className="ml-0.5 font-bold">{count}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col gap-2.5">
              {(grouped[mobileKanbanTab] || []).length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 py-12">
                  <p className="text-xs text-gray-300">Пусто</p>
                </div>
              ) : (grouped[mobileKanbanTab] || []).map(order => (
                <KanbanCard
                  key={order.id}
                  order={order}
                  colColor={KANBAN_COLS.find(c => c.status === mobileKanbanTab)?.color}
                  onAssign={handleAssign}
                  assigning={assigning === order.id}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  deleting={deleting === order.id}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                  onStatusChange={handleDrop}
                  isMobile
                />
              ))}
            </div>
          </div>

          {/* ── DESKTOP KANBAN: 4 columns + drag-drop ──────── */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-4 gap-4">
              {KANBAN_COLS.map(col => {
                const items    = grouped[col.status] || []
                const Icon     = col.icon
                const isOver   = dragOver === col.status
                return (
                  <div key={col.status} className="flex flex-col gap-3"
                    onDragOver={e => { e.preventDefault(); setDragOver(col.status) }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={() => handleDrop(col.status)}>
                    <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all"
                      style={{ background: isOver ? col.color + '18' : col.bg, borderColor: isOver ? col.color : col.border }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: col.color }} strokeWidth={2} />
                      <span className="text-xs font-semibold" style={{ color: col.color }}>{col.label}</span>
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: col.color }}>
                        {items.length}
                      </span>
                    </div>
                    <div className={`flex min-h-[80px] flex-col gap-2.5 overflow-y-auto rounded-xl transition-all ${isOver ? 'ring-2' : ''}`}
                      style={{ maxHeight: 'calc(100vh - 260px)', ...(isOver ? { ringColor: col.color } : {}) }}>
                      {items.length === 0 ? (
                        <div className={`flex items-center justify-center rounded-xl border border-dashed py-8 transition-all ${isOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                          <p className="text-xs text-gray-300">Пусто</p>
                        </div>
                      ) : items.map(order => (
                        <KanbanCard
                          key={order.id}
                          order={order}
                          colColor={col.color}
                          onAssign={handleAssign}
                          assigning={assigning === order.id}
                          isAdmin={isAdmin}
                          onDelete={handleDelete}
                          deleting={deleting === order.id}
                          onDragStart={() => setDragId({ id: order.id, status: order.status })}
                          onDragEnd={() => { setDragId(null); setDragOver(null) }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {cancelled.length > 0 && (
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-400">
                <XCircle className="mr-1.5 inline h-3.5 w-3.5 text-gray-300" strokeWidth={2} />
                Отменены: <span className="font-medium text-gray-600">{cancelled.length}</span> заказов
                <Link to="?status=CANCELLED" className="ml-3 text-blue-500 hover:underline">Показать</Link>
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ── TABLE ──────────────────────────────────────────── */
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Package className="h-8 w-8 text-gray-200" strokeWidth={1.5} />
              <p className="text-sm text-gray-400">Заказов пока нет</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {['№', 'Откуда', 'Куда', 'Груз', 'Статус', 'Создан', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <tr key={o.id} className="transition-colors hover:bg-gray-50/60">
                    <td className={TD}><span className="font-semibold text-gray-900">#{o.id}</span></td>
                    <td className={TD}><span className="block max-w-[180px] truncate text-gray-600">{o.originAddress}</span></td>
                    <td className={TD}><span className="block max-w-[180px] truncate text-gray-600">{o.destAddress}</span></td>
                    <td className={TD}><span className="text-gray-500">{o.cargoWeight ? `${o.cargoWeight} кг` : '—'}</span></td>
                    <td className={TD}><StatusBadge status={o.status} /></td>
                    <td className={TD}><span className="text-gray-400">{timeAgo(o.createdAt)}</span></td>
                    <td className={TD + ' text-right'}>
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/orders/${o.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500">
                          Детали <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(o.id)}
                            disabled={deleting === o.id}
                            className="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-100 disabled:opacity-50">
                            <Trash2 className="h-3 w-3" strokeWidth={2} />
                            {deleting === o.id ? '…' : 'Удалить'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ── Kanban card ───────────────────────────────────────────────
function KanbanCard({ order, colColor, onAssign, assigning, isAdmin, onDelete, deleting, onDragStart, onDragEnd, onStatusChange, isMobile }) {
  return (
    <div
      draggable={!isMobile}
      onDragStart={!isMobile ? (e => { e.dataTransfer.effectAllowed = 'move'; onDragStart() }) : undefined}
      onDragEnd={!isMobile ? onDragEnd : undefined}
      className={`group rounded-xl border border-gray-100 bg-white p-4 shadow-[0_1px_6px_rgba(0,0,0,0.04)] transition-all hover:border-gray-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] ${!isMobile ? 'cursor-grab active:cursor-grabbing active:opacity-60' : ''}`}>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-900">#{order.id}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">{timeAgo(order.createdAt)}</span>
          {isAdmin && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(order.id) }}
              disabled={deleting}
              className="flex h-5 w-5 items-center justify-center rounded-md text-gray-300 transition-all hover:bg-red-50 hover:text-red-400 disabled:opacity-40"
              title="Удалить заказ"
            >
              <Trash2 className="h-3 w-3" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="mb-3 flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
          <p className="line-clamp-1 text-xs text-gray-600">{order.originAddress}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
          <p className="line-clamp-1 text-xs text-gray-600">{order.destAddress}</p>
        </div>
      </div>

      {/* Meta */}
      {order.cargoWeight && (
        <div className="mb-3 flex items-center gap-1">
          <Package className="h-3 w-3 text-gray-300" strokeWidth={2} />
          <span className="text-[10px] text-gray-400">{order.cargoWeight} кг</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5">
        {order.status === 'PENDING' && (
          <button
            onClick={() => onAssign(order.id)}
            disabled={assigning}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: colColor }}
          >
            {assigning ? '…' : '⚡ Назначить'}
          </button>
        )}
        <Link to={`/orders/${order.id}`}
          className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50">
          <Eye className="h-3 w-3" strokeWidth={2} /> Детали
        </Link>
      </div>

      {/* Mobile: move to another column */}
      {isMobile && onStatusChange && (
        <select
          defaultValue=""
          onChange={e => { if (e.target.value) { onStatusChange(e.target.value); e.target.value = '' } }}
          className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 outline-none">
          <option value="" disabled>Переместить в колонку...</option>
          {KANBAN_COLS.filter(c => c.status !== order.status).map(c => (
            <option key={c.status} value={c.status}>{c.label}</option>
          ))}
        </select>
      )}
    </div>
  )
}

// ── Client order card ─────────────────────────────────────────
function ClientOrderCard({ order }) {
  const isActive = order.status === 'IN_PROGRESS' || order.status === 'ASSIGNED'
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm font-bold text-gray-900">Заказ #{order.id}</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
              <p className="text-sm text-gray-700">{order.originAddress}</p>
            </div>
            <div className="ml-1 h-3 w-px bg-gray-200" />
            <div className="flex items-start gap-2">
              <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
              <p className="text-sm text-gray-700">{order.destAddress}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
          {order.cargoWeight && (
            <span className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-xs text-gray-500">
              {order.cargoWeight} кг
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {isActive && (
          <Link to={`/track/${order.id}`}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-500">
            <Navigation className="h-3.5 w-3.5" strokeWidth={2} /> Отследить
          </Link>
        )}
        <Link to={`/orders/${order.id}`}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50">
          <Eye className="h-3.5 w-3.5" strokeWidth={2} /> Детали
        </Link>
      </div>
    </div>
  )
}

// ── Driver order card ─────────────────────────────────────────
function DriverOrderCard({ order }) {
  const isActive = order.status === 'IN_PROGRESS' || order.status === 'ASSIGNED'
  return (
    <div className={`rounded-2xl border p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all ${
      isActive ? 'border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50' : 'border-gray-100 bg-white'
    }`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">Заказ #{order.id}</span>
        <StatusBadge status={order.status} />
      </div>
      <div className="mb-4 flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
          <p className="text-sm text-gray-700">{order.originAddress}</p>
        </div>
        <div className="ml-1 h-3 w-px bg-gray-300" />
        <div className="flex items-start gap-2">
          <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
          <p className="text-sm text-gray-700">{order.destAddress}</p>
        </div>
      </div>
      <Link to={`/orders/${order.id}`}
        className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
          isActive
            ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)] hover:bg-blue-500'
            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}>
        {isActive ? 'Открыть рейс' : 'Детали'} <ChevronRight className="h-4 w-4" strokeWidth={2} />
      </Link>
    </div>
  )
}

// ── Client empty state ────────────────────────────────────────
function ClientEmpty({ onNew }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
        <Package className="h-7 w-7 text-blue-400" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">У вас пока нет заказов</p>
        <p className="mt-1 text-xs text-gray-400">Создайте первый заказ — это займёт меньше минуты</p>
      </div>
      <button onClick={onNew}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-500">
        <Plus className="h-4 w-4" strokeWidth={2} /> Создать заказ
      </button>
    </div>
  )
}

function ErrBanner({ msg }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{msg}</div>
  )
}

function Skeleton({ tall }) {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(tall ? 6 : 4)].map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
      ))}
    </div>
  )
}

const TD = 'px-5 py-4 text-sm'
