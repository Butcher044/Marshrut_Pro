import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import {
  Package, Truck, Users, Map, ArrowRight, TrendingUp, Clock,
  CheckCircle, XCircle, Activity, Navigation, ChevronRight,
  Plus, BarChart2, Power, AlertCircle,
} from 'lucide-react'
import useAuthStore from '../store/authStore.js'
import { statsApi } from '../api/statsApi.js'
import { ordersApi } from '../api/ordersApi.js'
import { driversApi } from '../api/driversApi.js'
import StatusBadge from '../components/StatusBadge.jsx'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const isAdmin   = user?.role === 'ADMIN'
  const isDriver  = user?.role === 'DRIVER'
  const isClient  = user?.role === 'CLIENT'

  const [stats, setStats]           = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [clientOrders, setClientOrders] = useState([])
  const [driverOrders, setDriverOrders] = useState([])
  const [driverProfile, setDriverProfile] = useState(null)

  useEffect(() => {
    if (isManager) {
      setStatsLoading(true)
      statsApi.summary()
        .then(({ data }) => setStats(data))
        .catch(() => {})
        .finally(() => setStatsLoading(false))
    }
  }, [isManager])

  useEffect(() => {
    if (isClient) {
      ordersApi.getMy({ size: 20 })
        .then(({ data }) => setClientOrders(Array.isArray(data) ? data : (data.content ?? [])))
        .catch(() => {})
    }
  }, [isClient])

  useEffect(() => {
    if (isDriver) {
      ordersApi.getMyTrips({ size: 20 })
        .then(({ data }) => setDriverOrders(Array.isArray(data) ? data : (data.content ?? [])))
        .catch(() => {})
      driversApi.getMe()
        .then(({ data }) => setDriverProfile(data))
        .catch(() => {})
    }
  }, [isDriver])

  const handleShiftToggle = async () => {
    if (!driverProfile) return
    const next = driverProfile.status === 'OFF_DUTY' ? 'AVAILABLE' : 'OFF_DUTY'
    try {
      await driversApi.updateStatus(driverProfile.id, next)
      setDriverProfile(p => ({ ...p, status: next }))
    } catch (_) {}
  }

  const dateStr = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm capitalize text-gray-400">{dateStr}</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            Добро пожаловать, {user?.firstName} 👋
          </h1>
        </div>
        {isManager && stats && (
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:flex sm:items-center sm:gap-6 sm:px-6">
            <Pill label="Активные"    value={stats.ordersInProgress} color="#6366F1" />
            <div className="hidden h-8 w-px bg-gray-100 sm:block" />
            <Pill label="Доставлено"  value={stats.ordersDelivered}  color="#10B981" />
            <div className="hidden h-8 w-px bg-gray-100 sm:block" />
            <Pill label="В рейсе"     value={stats.driversOnTrip}    color="#F59E0B" />
          </div>
        )}
      </div>

      {/* ── CLIENT VIEW ─────────────────────────────────────── */}
      {isClient && <ClientDashboard orders={clientOrders} />}

      {/* ── DRIVER VIEW ─────────────────────────────────────── */}
      {isDriver && (
        <DriverDashboard
          orders={driverOrders}
          profile={driverProfile}
          onShiftToggle={handleShiftToggle}
        />
      )}

      {/* ── MANAGER / ADMIN VIEW ─────────────────────────────── */}
      {isManager && (
        <>
          {/* Quick nav */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <QuickCard to="/orders"          icon={Package}   label="Заказы"        desc="Управление заявками" color="blue"    />
            <QuickCard to="/drivers"         icon={Users}     label="Водители"      desc="Контроль статусов"   color="emerald" />
            <QuickCard to="/vehicles"        icon={Truck}     label="Транспорт"     desc="Автопарк"            color="amber"   />
            <QuickCard to="/map"             icon={Map}       label="Карта"         desc="Все маршруты"        color="rose"    />
            {isAdmin && <QuickCard to="/admin/users" icon={Users} label="Сотрудники" desc="Управление"         color="violet"  />}
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />)}
            </div>
          ) : stats ? (
            <>
              <OrderPipeline stats={stats} />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <MetricCard label="Новые"      value={stats.ordersPending}    icon={Clock}       hex="#F59E0B" />
                <MetricCard label="Назначены"  value={stats.ordersAssigned}   icon={TrendingUp}  hex="#3B82F6" />
                <MetricCard label="В пути"     value={stats.ordersInProgress} icon={Truck}       hex="#6366F1" />
                <MetricCard label="Доставлены" value={stats.ordersDelivered}  icon={CheckCircle} hex="#10B981" />
                <MetricCard label="Отменены"   value={stats.ordersCancelled}  icon={XCircle}     hex="#EF4444" />
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DonutCard title="Водители"
                  total={(stats.driversAvailable ?? 0) + (stats.driversOnTrip ?? 0) + (stats.driversOffDuty ?? 0)}
                  data={[
                    { name: 'Свободны',   value: stats.driversAvailable ?? 0, color: '#10B981' },
                    { name: 'На рейсе',   value: stats.driversOnTrip    ?? 0, color: '#F59E0B' },
                    { name: 'Не в смене', value: stats.driversOffDuty   ?? 0, color: '#D1D5DB' },
                  ]}
                />
                <DonutCard title="Транспорт"
                  total={(stats.vehiclesAvailable ?? 0) + (stats.vehiclesInUse ?? 0) + (stats.vehiclesMaintenance ?? 0)}
                  data={[
                    { name: 'Свободен',   value: stats.vehiclesAvailable   ?? 0, color: '#10B981' },
                    { name: 'На рейсе',   value: stats.vehiclesInUse       ?? 0, color: '#F59E0B' },
                    { name: 'На ремонте', value: stats.vehiclesMaintenance ?? 0, color: '#EF4444' },
                  ]}
                />
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}

// ── CLIENT DASHBOARD ──────────────────────────────────────────
function ClientDashboard({ orders }) {
  const navigate = useNavigate()
  const delivered   = orders.filter(o => o.status === 'DELIVERED').length
  const inProgress  = orders.filter(o => ['IN_PROGRESS', 'ASSIGNED'].includes(o.status)).length
  const pending     = orders.filter(o => o.status === 'PENDING').length
  const totalWeight = orders.reduce((s, o) => s + (parseFloat(o.cargoWeight) || 0), 0)

  const activeOrders = orders.filter(o => ['IN_PROGRESS', 'ASSIGNED'].includes(o.status))

  return (
    <div className="flex flex-col gap-6">
      {/* CTA card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-[0_8px_32px_rgba(37,99,235,0.3)]">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 right-16 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-blue-100">Маршруты Про</p>
            <h2 className="text-xl font-bold">
              {inProgress > 0 ? `${inProgress} груз${inProgress === 1 ? '' : 'а'} сейчас в пути` : 'Готовы принять ваш груз'}
            </h2>
            <p className="mt-1 text-sm text-blue-200">
              {inProgress > 0 ? 'Отслеживайте доставку в реальном времени' : 'Оформите заказ за минуту'}
            </p>
          </div>
          <button onClick={() => navigate('/create-order')}
            className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/30">
            <Plus className="h-4 w-4" strokeWidth={2} /> Новый заказ
          </button>
        </div>
        {inProgress > 0 && (
          <Link to="/orders" className="relative mt-4 flex items-center gap-2 text-sm text-blue-200 hover:text-white">
            <Navigation className="h-3.5 w-3.5" strokeWidth={2} />
            Отследить мои отправления
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ClientStat label="Доставлено"   value={delivered}         icon={CheckCircle} hex="#10B981" />
        <ClientStat label="В пути"       value={inProgress}        icon={Navigation}  hex="#6366F1" />
        <ClientStat label="Ожидают"      value={pending}           icon={Clock}       hex="#F59E0B" />
        <ClientStat label="Общий вес"    value={`${Math.round(totalWeight)} кг`} icon={Package} hex="#3B82F6" text />
      </div>

      {/* Active deliveries */}
      {activeOrders.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              <p className="text-sm font-semibold text-gray-800">Активные доставки</p>
            </div>
            <Link to="/orders" className="text-xs text-blue-600 hover:text-blue-500">Все заказы →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {activeOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <span className="text-sm font-semibold text-gray-900">#{o.id}</span>
                  <p className="mt-0.5 max-w-[260px] truncate text-xs text-gray-400">{o.originAddress} → {o.destAddress}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={o.status} />
                  <Link to={`/track/${o.id}`}
                    className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition-all hover:bg-blue-100">
                    <Navigation className="h-3 w-3" strokeWidth={2} /> Трек
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3.5">
          <p className="text-sm font-semibold text-gray-800">История заказов</p>
          <Link to="/orders" className="text-xs text-blue-600 hover:text-blue-500">Смотреть все →</Link>
        </div>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Package className="h-8 w-8 text-gray-200" strokeWidth={1.5} />
            <p className="text-sm text-gray-400">Пока нет заказов</p>
            <button onClick={() => navigate('/create-order')}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-500">
              <Plus className="h-3.5 w-3.5" /> Создать первый заказ
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.slice(0, 5).map(order => (
              <Link key={order.id} to={`/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-gray-50">
                <div>
                  <span className="text-sm font-semibold text-gray-900">#{order.id}</span>
                  <p className="mt-0.5 max-w-[260px] truncate text-xs text-gray-400">{order.originAddress}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <ChevronRight className="h-4 w-4 text-gray-300" strokeWidth={2} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <QuickCard to="/create-order" icon={Plus}      label="Новый заказ"  desc="Оформить доставку"   color="blue"   />
        <QuickCard to="/orders"       icon={Package}   label="Мои заказы"   desc="История отправлений" color="violet" />
      </div>
    </div>
  )
}

function ClientStat({ label, value, icon: Icon, hex, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: hex + '18' }}>
        <Icon className="h-5 w-5" style={{ color: hex }} strokeWidth={1.75} />
      </div>
      <div>
        <p className={`${text ? 'text-lg' : 'text-2xl'} font-bold tabular-nums`} style={{ color: hex }}>{value ?? 0}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  )
}

// ── DRIVER DASHBOARD ──────────────────────────────────────────
function DriverDashboard({ orders, profile, onShiftToggle }) {
  const navigate      = useNavigate()
  const activeOrder   = orders.find(o => ['IN_PROGRESS', 'ASSIGNED'].includes(o.status))
  const delivered     = orders.filter(o => o.status === 'DELIVERED').length
  const onTrip        = orders.filter(o => ['IN_PROGRESS', 'ASSIGNED'].includes(o.status)).length
  const onDuty        = profile?.status !== 'OFF_DUTY'

  return (
    <div className="flex flex-col gap-4">

      {/* Shift toggle card */}
      {profile && (
        <div className={`rounded-2xl border-2 p-5 transition-all ${
          onDuty ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${onDuty ? 'text-emerald-600' : 'text-gray-400'}`}>
                {onDuty ? '● На смене' : '○ Не в смене'}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-700">
                {onDuty ? 'Вы принимаете заказы' : 'Вы не принимаете заказы'}
              </p>
              {profile.status === 'ON_TRIP' && (
                <p className="mt-0.5 text-xs text-amber-600">⚡ Активный рейс — смену нельзя завершить</p>
              )}
            </div>
            <button
              onClick={onShiftToggle}
              disabled={profile.status === 'ON_TRIP'}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all disabled:opacity-50 ${
                onDuty
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-emerald-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)] hover:bg-emerald-500'
              }`}>
              <Power className="h-4 w-4" strokeWidth={2} />
              {onDuty ? 'Закончить смену' : 'Начать смену'}
            </button>
          </div>
        </div>
      )}

      {/* Active trip */}
      {activeOrder ? (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-[0_2px_12px_rgba(37,99,235,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
                <Navigation className="h-4 w-4 text-blue-600" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Текущий рейс</p>
                <p className="text-sm font-bold text-blue-900">Заказ #{activeOrder.id}</p>
              </div>
            </div>
            <StatusBadge status={activeOrder.status} />
          </div>
          <div className="mb-4 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
              <p className="text-sm text-blue-800">{activeOrder.originAddress}</p>
            </div>
            <div className="ml-1 h-4 w-px bg-blue-200" />
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
              <p className="text-sm text-blue-800">{activeOrder.destAddress}</p>
            </div>
          </div>
          <Link to={`/orders/${activeOrder.id}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500">
            Открыть рейс и изменить статус
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
            <Truck className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-gray-500">Нет активных рейсов</p>
          <p className="text-xs text-gray-400">Менеджер назначит следующий маршрут</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle className="h-5 w-5 text-emerald-500" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-emerald-600">{delivered}</p>
              <p className="text-xs text-gray-400">Доставлено</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Activity className="h-5 w-5 text-blue-500" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-blue-600">{onTrip}</p>
              <p className="text-xs text-gray-400">В работе</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent trips */}
      {orders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Мои рейсы</p>
            <Link to="/orders" className="text-xs text-blue-600 hover:text-blue-500">Все →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {orders.slice(0, 5).map(order => (
              <Link key={order.id} to={`/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-gray-50">
                <div>
                  <span className="text-sm font-semibold text-gray-900">#{order.id}</span>
                  <p className="mt-0.5 max-w-[200px] truncate text-xs text-gray-400">{order.originAddress}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <ChevronRight className="h-4 w-4 text-gray-300" strokeWidth={2} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────
function Pill({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold tabular-nums sm:text-2xl" style={{ color }}>{value ?? '—'}</p>
      <p className="mt-0.5 text-[10px] font-medium text-gray-400 sm:text-[11px]">{label}</p>
    </div>
  )
}

function QuickCard({ to, icon: Icon, label, desc, color }) {
  const palette = {
    blue:   { wrap: 'bg-blue-50 border-blue-100',     icon: 'text-blue-600'   },
    emerald:{ wrap: 'bg-emerald-50 border-emerald-100',icon: 'text-emerald-600'},
    amber:  { wrap: 'bg-amber-50 border-amber-100',   icon: 'text-amber-500'  },
    violet: { wrap: 'bg-violet-50 border-violet-100', icon: 'text-violet-600' },
    rose:   { wrap: 'bg-rose-50 border-rose-100',     icon: 'text-rose-500'   },
  }
  const p = palette[color] ?? palette.blue
  return (
    <Link to={to}
      className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${p.wrap}`}>
        <Icon className={`h-5 w-5 ${p.icon}`} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" strokeWidth={2} />
    </Link>
  )
}

function MetricCard({ label, value, icon: Icon, hex }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: hex + '18' }}>
        <Icon className="h-5 w-5" style={{ color: hex }} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums" style={{ color: hex }}>{value ?? 0}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  )
}

function DonutCard({ title, total, data }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <span className="text-sm font-medium text-gray-400">{total} всего</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3} dataKey="value" stroke="none">
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(v) => [v, '']} contentStyle={{ borderRadius: 12, border: '1px solid #f3f4f6', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }} />
          <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: '#6b7280' }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function AnimatedNumber({ value = 0 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    let start = null
    const duration = 900
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(value * eased))
      if (p < 1) ref.current = requestAnimationFrame(step)
    }
    ref.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(ref.current)
  }, [value])
  return <>{display}</>
}

const PIPELINE = [
  { key: 'ordersPending',    label: 'Ожидание',  color: '#F59E0B' },
  { key: 'ordersAssigned',   label: 'Назначены', color: '#3B82F6' },
  { key: 'ordersInProgress', label: 'В пути',    color: '#6366F1' },
  { key: 'ordersDelivered',  label: 'Доставлены',color: '#10B981' },
]

function OrderPipeline({ stats }) {
  const total = PIPELINE.reduce((s, p) => s + (stats[p.key] ?? 0), 0)
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Воронка заказов</h3>
          <p className="text-xs text-gray-400">{total} заказов в работе</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5">
          <Activity className="h-3.5 w-3.5 text-blue-500" strokeWidth={2} />
          <span className="text-xs font-medium text-gray-600">Live</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {PIPELINE.map(({ key, label, color }, i) => {
          const val = stats[key] ?? 0
          const pct = total > 0 ? (val / total) * 100 : 0
          return (
            <motion.div key={key}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-center gap-4">
              <div className="w-24 flex-shrink-0">
                <p className="text-xs font-medium text-gray-600">{label}</p>
              </div>
              <div className="relative h-7 flex-1 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                <motion.div className="h-full rounded-lg"
                  style={{ background: color + '25', borderRight: `2px solid ${color}` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                  transition={{ duration: 0.7, delay: i * 0.08 + 0.2, ease: [0.32, 0.72, 0, 1] }} />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs font-medium" style={{ color }}>{pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="w-12 flex-shrink-0 text-right">
                <span className="text-sm font-bold tabular-nums" style={{ color }}>
                  <AnimatedNumber value={val} />
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
