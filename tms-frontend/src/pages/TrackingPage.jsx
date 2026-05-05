import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, MapPin, Clock, Package, Truck, CheckCircle } from 'lucide-react'
import { ordersApi } from '../api/ordersApi.js'
import { routesApi } from '../api/routesApi.js'
import StatusBadge from '../components/StatusBadge.jsx'

const STATUS_STEPS = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'DELIVERED']
const STATUS_LABELS = {
  PENDING:     'Ожидает назначения',
  ASSIGNED:    'Водитель назначен',
  IN_PROGRESS: 'В пути',
  DELIVERED:   'Доставлено',
  CANCELLED:   'Отменён',
}

export default function TrackingPage() {
  const { id } = useParams()
  const [order, setOrder]     = useState(null)
  const [route, setRoute]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const mapRef      = useRef(null)
  const containerRef = useRef(null)
  const timerRef    = useRef(null)

  const load = useCallback(async () => {
    try {
      const { data: o } = await ordersApi.getById(id)
      setOrder(o)
      setLastUpdate(new Date())
      try {
        const { data: r } = await routesApi.getByOrderId(id)
        setRoute(r)
      } catch (_) {}
    } catch (_) {}
    finally { setLoading(false) }
  }, [id])

  useEffect(() => {
    load()
    timerRef.current = setInterval(load, 15000)
    return () => clearInterval(timerRef.current)
  }, [load])

  // Init map
  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false
    function initMap() {
      if (typeof window.ymaps === 'undefined') return
      window.ymaps.ready(() => {
        if (cancelled || !containerRef.current) return
        try {
          mapRef.current = new window.ymaps.Map(containerRef.current, {
            center: [55.7558, 37.6173], zoom: 10, controls: ['zoomControl'],
          })
        } catch (_) {}
      })
    }
    initMap()
    return () => {
      cancelled = true
      if (mapRef.current) { try { mapRef.current.destroy() } catch (_) {} mapRef.current = null }
    }
  }, [])

  // Draw route on map
  useEffect(() => {
    if (!mapRef.current || !route?.routePoints?.length) return
    const map = mapRef.current
    map.geoObjects.removeAll()
    const pts = [...route.routePoints].sort((a, b) => a.seqNumber - b.seqNumber)
    const coords = pts.map(p => [p.lat, p.lon])

    if (coords.length > 1) {
      map.geoObjects.add(new window.ymaps.Polyline(coords, {}, {
        strokeColor: '#2563EB', strokeWidth: 5, strokeOpacity: 0.85,
      }))
    }

    pts.forEach(p => {
      if (p.pointType !== 'ORIGIN' && p.pointType !== 'DESTINATION') return
      map.geoObjects.add(new window.ymaps.Placemark(
        [p.lat, p.lon],
        { balloonContent: p.pointType === 'ORIGIN' ? order?.originAddress : order?.destAddress },
        { preset: p.pointType === 'ORIGIN' ? 'islands#greenDotIcon' : 'islands#redDotIcon' },
      ))
    })

    const lats = pts.map(p => p.lat), lons = pts.map(p => p.lon)
    map.setBounds([
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ], { checkZoomRange: true, zoomMargin: 60 })
  }, [route, order])

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100" />)}
    </div>
  )

  if (!order) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-sm text-gray-400">Заказ не найден</p>
      <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-500">← Вернуться к заказам</Link>
    </div>
  )

  const stepIndex = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'CANCELLED'
  const isDelivered = order.status === 'DELIVERED'

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/orders"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm transition-colors hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">Отслеживание заказа #{order.id}</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Обновлено: {lastUpdate ? lastUpdate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <button onClick={load}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 shadow-sm transition-all hover:text-gray-600">
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Progress tracker */}
      {!isCancelled && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h3 className="mb-5 text-sm font-semibold text-gray-800">Статус доставки</h3>
          <div className="flex items-start">
            {STATUS_STEPS.map((s, i) => {
              const done   = stepIndex > i
              const active = stepIndex === i
              return (
                <div key={s} className="flex flex-1 items-start last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                      done   ? 'bg-emerald-500 text-white' :
                      active ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.15)]' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {done ? <CheckCircle className="h-4 w-4" strokeWidth={2} /> :
                        <span className="text-xs font-bold">{i + 1}</span>}
                    </div>
                    <span className={`whitespace-nowrap text-center text-[11px] font-medium ${
                      active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-gray-400'
                    }`}>{STATUS_LABELS[s]}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`mx-2 mt-4 h-0.5 flex-1 rounded transition-all ${done || (active && i < stepIndex) ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Map — takes 2/3 */}
        <div className="lg:col-span-2">
          {route?.routePoints?.length ? (
            <div ref={containerRef} className="h-80 w-full overflow-hidden rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] lg:h-[420px]" />
          ) : (
            <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white lg:h-[420px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
                <MapPin className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Карта маршрута недоступна</p>
                <p className="text-xs text-gray-400">Маршрут будет построен после назначения водителя</p>
              </div>
            </div>
          )}
        </div>

        {/* Info panel — takes 1/3 */}
        <div className="flex flex-col gap-4">

          {/* Route card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Маршрут</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-[10px] text-gray-400">Откуда</p>
                  <p className="text-sm font-medium text-gray-800">{order.originAddress}</p>
                </div>
              </div>
              <div className="ml-1 h-4 w-px bg-gray-200" />
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" />
                <div>
                  <p className="text-[10px] text-gray-400">Куда</p>
                  <p className="text-sm font-medium text-gray-800">{order.destAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Route stats */}
          {route && (
            <div className="grid grid-cols-2 gap-3">
              <StatPill icon={MapPin} label="Расстояние" value={`${route.totalKm} км`} color="#3B82F6" />
              <StatPill icon={Clock}  label="Время"      value={`${route.durationMin} мин`} color="#8B5CF6" />
            </div>
          )}

          {/* Cargo */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Груз</h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Вес</span>
                <span className="text-sm font-medium text-gray-800">{order.cargoWeight ? `${order.cargoWeight} кг` : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Объём</span>
                <span className="text-sm font-medium text-gray-800">{order.cargoVolume ? `${order.cargoVolume} м³` : '—'}</span>
              </div>
            </div>
          </div>

          {isDelivered && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <CheckCircle className="h-5 w-5 text-emerald-600" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Груз доставлен!</p>
                  <p className="text-xs text-emerald-600">Спасибо, что выбрали Маршруты Про</p>
                </div>
              </div>
            </div>
          )}

          {order.status === 'IN_PROGRESS' && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <p className="text-xs font-medium text-blue-700">Водитель в пути — обновляется каждые 15 сек</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: color + '18' }}>
        <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-base font-bold" style={{ color }}>{value}</p>
      </div>
    </div>
  )
}
