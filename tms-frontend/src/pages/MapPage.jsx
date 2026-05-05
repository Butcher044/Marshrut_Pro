import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Navigation, Clock, Route, Package } from 'lucide-react'
import { routesApi } from '../api/routesApi.js'
import { ordersApi } from '../api/ordersApi.js'
import StatusBadge from '../components/StatusBadge.jsx'

const YMAPS_KEY = '5ca50ea8-7b78-4b11-9f1c-b08bb1a4feba'

export default function MapPage() {
  const containerRef   = useRef(null)
  const mapRef         = useRef(null)
  const mapReadyRef    = useRef(false)

  const [orders, setOrders]               = useState([])
  const [selected, setSelected]           = useState(null)
  const [route, setRoute]                 = useState(null)
  const [address, setAddress]             = useState('')
  const [geocodeResult, setGeocodeResult] = useState(null)
  const [geocodeLoading, setGeocodeLoading] = useState(false)
  const [geocodeError, setGeocodeError]   = useState('')

  // Load orders
  useEffect(() => {
    ordersApi.getAll({ size: 100 })
      .then(({ data }) => setOrders(data.content || data))
      .catch(() => {})
  }, [])

  // Init Yandex Map 2.1
  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    function init() {
      if (typeof window.ymaps === 'undefined') return

      window.ymaps.ready(() => {
        if (cancelled || !containerRef.current) return
        const map = new window.ymaps.Map(containerRef.current, {
          center: [55.7558, 37.6173],
          zoom: 11,
          controls: ['zoomControl', 'geolocationControl'],
        })
        mapRef.current = map
        mapReadyRef.current = true
      })
    }

    init()
    return () => {
      cancelled = true
      if (mapRef.current) {
        try { mapRef.current.destroy() } catch (_) {}
        mapRef.current = null
        mapReadyRef.current = false
      }
    }
  }, [])

  // Render route on map
  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return
    const map = mapRef.current
    map.geoObjects.removeAll()

    if (!route?.routePoints?.length) return

    const pts = [...route.routePoints].sort((a, b) => a.seqNumber - b.seqNumber)
    const coords = pts.map(p => [p.lat, p.lon])

    // Route polyline
    const polyline = new window.ymaps.Polyline(coords, {}, {
      strokeColor: '#2563EB',
      strokeWidth: 5,
      strokeOpacity: 0.9,
    })
    map.geoObjects.add(polyline)

    // Origin / Destination markers
    pts.forEach(p => {
      if (p.pointType !== 'ORIGIN' && p.pointType !== 'DESTINATION') return
      const isOrigin = p.pointType === 'ORIGIN'
      const mark = new window.ymaps.Placemark(
        [p.lat, p.lon],
        { hintContent: isOrigin ? 'Отправление' : 'Назначение' },
        { preset: isOrigin ? 'islands#greenDotIcon' : 'islands#redDotIcon' }
      )
      map.geoObjects.add(mark)
    })

    // Fit bounds
    const lats = pts.map(p => p.lat), lons = pts.map(p => p.lon)
    map.setBounds([
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ], { checkZoomRange: true, zoomMargin: 60, duration: 600 })
  }, [route])

  // Select order → load route
  const handleSelect = async (order) => {
    setSelected(order)
    setRoute(null)
    try {
      const { data } = await routesApi.getByOrderId(order.id)
      setRoute(data)
    } catch (_) {}
  }

  // Geocode via Yandex HTTP Geocoder
  const handleGeocode = async (e) => {
    e.preventDefault()
    setGeocodeError('')
    setGeocodeResult(null)
    setGeocodeLoading(true)
    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YMAPS_KEY}&geocode=${encodeURIComponent(address)}&format=json&lang=ru_RU&results=1`
      const res  = await fetch(url)
      const json = await res.json()
      const members = json?.response?.GeoObjectCollection?.featureMember
      if (!members?.length) { setGeocodeError('Адрес не найден'); return }

      const pos = members[0].GeoObject.Point.pos.split(' ')
      const lon = parseFloat(pos[0]), lat = parseFloat(pos[1])
      setGeocodeResult({ lat, lon, name: members[0].GeoObject.name })

      if (mapRef.current) {
        const mark = new window.ymaps.Placemark(
          [lat, lon],
          { hintContent: members[0].GeoObject.name },
          { preset: 'islands#violetDotIcon' }
        )
        mapRef.current.geoObjects.add(mark)
        mapRef.current.setCenter([lat, lon], 14, { duration: 500 })
      }
    } catch {
      setGeocodeError('Ошибка геокодирования')
    } finally {
      setGeocodeLoading(false)
    }
  }

  const activeOrders = orders.filter(o => !['PENDING', 'CANCELLED'].includes(o.status))

  return (
    <div className="flex h-[calc(100vh-76px)] gap-5 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────── */}
      <div className="flex w-[300px] flex-shrink-0 flex-col gap-4 overflow-y-auto">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Карта</h1>
          <p className="mt-0.5 text-sm text-gray-400">Маршруты и геопоиск</p>
        </div>

        {/* Geocode search */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Поиск адреса</p>
          <form onSubmit={handleGeocode} className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" strokeWidth={2} />
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-8 pr-3 text-sm text-gray-800 outline-none placeholder:text-gray-300 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="Москва, Красная площадь"
                required
              />
            </div>
            <button
              type="submit"
              disabled={geocodeLoading}
              className="w-full rounded-xl bg-blue-600 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-60"
            >
              {geocodeLoading ? 'Поиск...' : 'Найти на карте'}
            </button>
          </form>
          {geocodeError && (
            <p className="mt-2 text-xs text-red-500">{geocodeError}</p>
          )}
          {geocodeResult && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-violet-500" strokeWidth={2} />
              <div>
                <p className="text-xs font-medium text-violet-700">{geocodeResult.name}</p>
                <p className="text-[10px] text-violet-400">{geocodeResult.lat.toFixed(5)}, {geocodeResult.lon.toFixed(5)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Route info */}
        {route && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-400">Маршрут #{selected?.id}</p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-blue-500">
                  <Navigation className="h-3.5 w-3.5" strokeWidth={2} />
                  Расстояние
                </div>
                <span className="text-sm font-semibold text-blue-700">{route.totalKm} км</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-blue-500">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                  Время в пути
                </div>
                <span className="text-sm font-semibold text-blue-700">{route.durationMin} мин</span>
              </div>
            </div>
          </div>
        )}

        {/* Order list */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="border-b border-gray-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Активные маршруты</p>
          </div>
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Route className="h-8 w-8 text-gray-200" strokeWidth={1.5} />
              <p className="text-xs text-gray-300">Нет активных маршрутов</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => handleSelect(order)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    selected?.id === order.id ? 'bg-blue-50/80' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                        selected?.id === order.id ? 'bg-blue-100' : 'bg-gray-50'
                      }`}>
                        <Package className={`h-3.5 w-3.5 ${selected?.id === order.id ? 'text-blue-600' : 'text-gray-400'}`} strokeWidth={1.75} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">#{order.id}</span>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1.5 truncate pl-9 text-xs text-gray-400">{order.originAddress}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Map ─────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden rounded-2xl border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.08)]"
      />
    </div>
  )
}
