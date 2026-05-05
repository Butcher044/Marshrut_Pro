import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Package, Clock, CheckCircle2, LocateFixed,
  Truck, Navigation, AlertTriangle, User, Ruler, Banknote, Phone,
} from 'lucide-react'
import { ordersApi } from '../api/ordersApi.js'
import { routesApi } from '../api/routesApi.js'
import { driversApi } from '../api/driversApi.js'
import { usersApi } from '../api/usersApi.js'
import StatusBadge from '../components/StatusBadge.jsx'
import RouteMap from '../components/RouteMap.jsx'
import useAuthStore from '../store/authStore.js'

const DRIVER_ACTIONS = {
  ASSIGNED:    { label: 'Груз принял — выезжаю', next: 'IN_PROGRESS', color: '#3B82F6', icon: Truck        },
  IN_PROGRESS: { label: 'Груз доставлен',         next: 'DELIVERED',   color: '#10B981', icon: CheckCircle2 },
}

const PROBLEM_OPTIONS = [
  'Авария / поломка ТС',
  'Адрес не найден',
  'Клиент недоступен',
  'Невозможно разгрузить',
  'Другое',
]

function calcCost(km, weightKg) {
  const k = km || 0
  const w = parseFloat(weightKg) || 0
  return Math.round(1500 + w * 2 + k * 12)
}

export default function OrderDetailPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuthStore()
  const [order, setOrder]         = useState(null)
  const [route, setRoute]         = useState(null)
  const [clientUser, setClientUser] = useState(null)
  const [driverUser, setDriverUser] = useState(null)
  const [driverProfile, setDriverProfile] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [updating, setUpdating]   = useState(false)
  const [showProblem, setShowProblem] = useState(false)
  const [actionErr, setActionErr] = useState('')

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const isDriver         = user?.role === 'DRIVER'
  const isClient         = user?.role === 'CLIENT'

  useEffect(() => {
    const load = async () => {
      try {
        const { data: o } = await ordersApi.getById(id)
        setOrder(o)

        // Load route
        try {
          const { data: r } = await routesApi.getByOrderId(id)
          setRoute(r)
        } catch (_) {}

        // Load client info
        if (o.clientId) {
          usersApi.getById(o.clientId).then(({ data }) => setClientUser(data)).catch(() => {})
        }

        // Load driver info
        if (o.driverId) {
          driversApi.getById(o.driverId)
            .then(({ data: drv }) => {
              setDriverProfile(drv)
              if (drv.userId) {
                usersApi.getById(drv.userId).then(({ data }) => setDriverUser(data)).catch(() => {})
              }
            })
            .catch(() => {})
        }
      } finally { setLoading(false) }
    }
    load()
  }, [id])

  const handleAssign = async () => {
    setUpdating(true); setActionErr('')
    try {
      const { data } = await ordersApi.assignDriver(id)
      setOrder(data)
      // reload driver info after assignment
      if (data.driverId) {
        driversApi.getById(data.driverId)
          .then(({ data: drv }) => {
            setDriverProfile(drv)
            if (drv.userId) usersApi.getById(drv.userId).then(({ data: u }) => setDriverUser(u)).catch(() => {})
          })
          .catch(() => {})
        routesApi.getByOrderId(id).then(({ data: r }) => setRoute(r)).catch(() => {})
      }
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.toLowerCase().includes('no available') || msg.toLowerCase().includes('driver')) {
        setActionErr('Все водители сейчас заняты — попробуйте позже')
      } else {
        setActionErr(msg || 'Ошибка назначения водителя')
      }
    } finally { setUpdating(false) }
  }

  const handleDriverAction = async (nextStatus) => {
    setUpdating(true); setActionErr('')
    try {
      const { data } = await ordersApi.updateStatus(id, nextStatus)
      setOrder(data)
      if (nextStatus === 'DELIVERED') navigate('/orders')
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Ошибка обновления статуса')
    } finally { setUpdating(false) }
  }

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />
      ))}
    </div>
  )

  if (!order) return (
    <div className="flex flex-col items-center gap-3 py-20">
      <p className="text-sm text-gray-400">Заказ не найден</p>
      <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-500">← Вернуться к заказам</Link>
    </div>
  )

  const driverAction = DRIVER_ACTIONS[order.status]
  const km    = route?.totalKm ? parseFloat(route.totalKm) : null
  const cost  = km ? calcCost(km, order.cargoWeight) : null

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/orders"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm transition-colors hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">Заказ #{order.id}</h1>
          <p className="mt-0.5 text-sm text-gray-400">{order.createdAt?.replace('T', ' ').slice(0, 16)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* DRIVER: action panel */}
      {isDriver && driverAction && (
        <div className="rounded-2xl border-2 p-5" style={{ borderColor: driverAction.color + '40', background: driverAction.color + '08' }}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide" style={{ color: driverAction.color }}>
            Действие по рейсу
          </p>
          {actionErr && (
            <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{actionErr}</div>
          )}
          <button
            onClick={() => handleDriverAction(driverAction.next)}
            disabled={updating}
            className="flex w-full items-center justify-center gap-3 rounded-xl py-4 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: driverAction.color, boxShadow: `0 4px 16px ${driverAction.color}40` }}
          >
            <driverAction.icon className="h-5 w-5" strokeWidth={2} />
            {updating ? 'Обновляем…' : driverAction.label}
          </button>
          <button
            onClick={() => setShowProblem(!showProblem)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-sm font-medium text-amber-700 transition-all hover:bg-amber-100"
          >
            <AlertTriangle className="h-4 w-4" strokeWidth={2} />
            Сообщить о проблеме
          </button>
          {showProblem && (
            <div className="mt-3 flex flex-col gap-1.5">
              {PROBLEM_OPTIONS.map(opt => (
                <button key={opt}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left text-sm text-gray-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700">
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLIENT: track button */}
      {isClient && (order.status === 'IN_PROGRESS' || order.status === 'ASSIGNED') && (
        <Link to={`/track/${order.id}`}
          className="flex items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-base font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.3)] transition-all hover:from-blue-500 hover:to-indigo-500">
          <Navigation className="h-5 w-5" strokeWidth={2} />
          Отследить мой груз на карте
        </Link>
      )}

      {/* Main info grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Route details */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">Маршрут</h3>
          <div className="flex flex-col gap-3.5">
            <Row icon={MapPin}      label="Откуда" value={order.originAddress} />
            <Row icon={LocateFixed} label="Куда"   value={order.destAddress}   accent />
            {km && (
              <>
                <div className="h-px bg-gray-50" />
                <Row icon={Ruler} label="Расстояние"   value={`~${km.toFixed(0)} км`} />
                <Row icon={Clock} label="Время в пути" value={route?.durationMin ? fmtDuration(route.durationMin) : '—'} />
              </>
            )}
          </div>
        </div>

        {/* Cargo + participants */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">Детали</h3>
          <div className="flex flex-col gap-3.5">
            <Row icon={Package} label="Вес груза" value={order.cargoWeight ? `${order.cargoWeight} кг` : '—'} />
            <Row icon={Package} label="Объём"     value={order.cargoVolume ? `${order.cargoVolume} м³` : '—'} />
            <div className="h-px bg-gray-50" />
            <Row icon={User}
              label="Клиент"
              value={clientUser ? `${clientUser.firstName} ${clientUser.lastName}` : `#${order.clientId}`}
            />
            <Row icon={Truck}
              label="Водитель"
              value={
                driverUser
                  ? `${driverUser.firstName} ${driverUser.lastName}`
                  : driverProfile
                  ? `ВУ ${driverProfile.licenseNo || '#' + order.driverId}`
                  : order.driverId ? `Водитель #${order.driverId}` : 'Не назначен'
              }
            />
            {driverProfile && (
              <Row icon={Phone} label="Статус водителя"
                value={
                  { AVAILABLE: 'Доступен', ON_TRIP: 'В рейсе', OFF_DUTY: 'Не в смене' }[driverProfile.status] || driverProfile.status
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Cost card — show when route is built */}
      {cost && (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-500">
                Предварительная стоимость
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-700">
                  {cost.toLocaleString('ru-RU')} ₽
                </span>
                <span className="text-xs text-blue-400">ориентировочно</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs text-blue-600">
              <span>Базовая ставка: 1 500 ₽</span>
              {order.cargoWeight && <span>За вес ({order.cargoWeight} кг): {Math.round(parseFloat(order.cargoWeight) * 2).toLocaleString()} ₽</span>}
              <span>За расстояние ({km?.toFixed(0)} км): {Math.round(km * 12).toLocaleString()} ₽</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-blue-400">
            * Итоговая стоимость согласовывается с менеджером.
          </p>
        </div>
      )}

      {/* Map — show when route exists OR order has coords */}
      {(route || (order.originLat && order.destLat)) && (
        <div className="overflow-hidden rounded-2xl">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-800">Маршрут на карте</h3>
            {route && (
              <StatusBadge status={route.status} />
            )}
          </div>
          <RouteMap route={route} order={order} height={400} />
        </div>
      )}

      {/* Error */}
      {actionErr && !isDriver && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{actionErr}</div>
      )}

      {/* Manager: assign button (PENDING) */}
      {isAdminOrManager && order.status === 'PENDING' && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAssign}
            disabled={updating}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500 disabled:opacity-60 active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            {updating ? 'Назначаем…' : 'Назначить водителя'}
          </button>
          <p className="text-xs text-gray-400">Система выберет ближайшего свободного водителя</p>
        </div>
      )}

      {/* Manager: status controls (non-pending, non-terminal) */}
      {isAdminOrManager && order.status !== 'PENDING' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <span className="text-sm text-gray-500">Изменить статус:</span>
          {order.status === 'ASSIGNED' && (
            <ActionBtn label="В пути" onClick={() => handleDriverAction('IN_PROGRESS')} color="#8B5CF6" />
          )}
          {order.status === 'IN_PROGRESS' && (
            <ActionBtn label="Доставлен" onClick={() => handleDriverAction('DELIVERED')} color="#10B981" />
          )}
          <ActionBtn label="Отменить" onClick={() => handleDriverAction('CANCELLED')} color="#EF4444" />
        </div>
      )}
    </div>
  )
}

function fmtDuration(min) {
  if (min < 60) return `${min} мин`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`
}

function Row({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${accent ? 'text-blue-400' : 'text-gray-300'}`} strokeWidth={2} />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <span className="max-w-[60%] text-right text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}

function ActionBtn({ label, onClick, color }) {
  return (
    <button onClick={onClick}
      className="rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-80 active:scale-95"
      style={{ background: color }}>
      {label}
    </button>
  )
}
