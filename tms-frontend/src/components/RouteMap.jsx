import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

export default function RouteMap({ route, order, height = 400 }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    const init = () => {
      if (typeof window.ymaps === 'undefined') {
        if (!cancelled) setStatus('unavailable')
        return
      }
      window.ymaps.ready(() => {
        if (cancelled || !containerRef.current) return
        try {
          const map = new window.ymaps.Map(containerRef.current, {
            center: [55.7558, 37.6173],
            zoom: 10,
            controls: ['zoomControl', 'fullscreenControl'],
          }, { suppressMapOpenBlock: true })
          mapRef.current = map
          setStatus('ready')
        } catch {
          if (!cancelled) setStatus('error')
        }
      })
    }
    init()

    return () => {
      cancelled = true
      if (mapRef.current) {
        try { mapRef.current.destroy() } catch (_) {}
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return
    const map = mapRef.current
    map.geoObjects.removeAll()

    const pts = route?.routePoints?.length
      ? [...route.routePoints]
          .sort((a, b) => a.seqNumber - b.seqNumber)
          .filter(p => p.lat != null && p.lon != null)
      : []

    // Fallback: use order origin/dest coords if no routePoints
    if (pts.length < 2 && order) {
      if (order.originLat && order.destLat) {
        pts.length = 0
        pts.push({ lat: order.originLat, lon: order.originLon, pointType: 'ORIGIN', address: order.originAddress })
        pts.push({ lat: order.destLat,   lon: order.destLon,   pointType: 'DESTINATION', address: order.destAddress })
      }
    }

    if (pts.length < 2) return

    // Polyline through all points
    const coords = pts.map(p => [p.lat, p.lon])
    const polyline = new window.ymaps.Polyline(coords, {}, {
      strokeColor: '#2563EB',
      strokeWidth: 5,
      strokeOpacity: 0.85,
    })
    map.geoObjects.add(polyline)

    // Origin marker
    const origin = pts[0]
    map.geoObjects.add(new window.ymaps.Placemark(
      [origin.lat, origin.lon],
      { balloonContent: `<b>Откуда</b><br>${origin.address || ''}`, hintContent: 'Отправление' },
      { preset: 'islands#greenCircleDotIcon' }
    ))

    // Destination marker
    const dest = pts[pts.length - 1]
    map.geoObjects.add(new window.ymaps.Placemark(
      [dest.lat, dest.lon],
      { balloonContent: `<b>Куда</b><br>${dest.address || ''}`, hintContent: 'Назначение' },
      { preset: 'islands#redCircleDotIcon' }
    ))

    // Waypoint markers (intermediate)
    pts.slice(1, -1).forEach(p => {
      if (p.pointType === 'WAYPOINT') return  // skip auto-generated waypoints
      map.geoObjects.add(new window.ymaps.Placemark(
        [p.lat, p.lon],
        { hintContent: p.address || 'Промежуточная точка' },
        { preset: 'islands#yellowCircleDotIcon' }
      ))
    })

    // Auto-fit bounds
    const lats = pts.map(p => p.lat)
    const lons = pts.map(p => p.lon)
    const minLat = Math.min(...lats), maxLat = Math.max(...lats)
    const minLon = Math.min(...lons), maxLon = Math.max(...lons)
    const padLat = Math.max((maxLat - minLat) * 0.15, 0.02)
    const padLon = Math.max((maxLon - minLon) * 0.15, 0.02)
    map.setBounds(
      [[minLat - padLat, minLon - padLon], [maxLat + padLat, maxLon + padLon]],
      { checkZoomRange: true }
    )
  }, [status, route, order])

  if (status === 'unavailable' || status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-gray-50"
        style={{ height }}>
        <MapPin className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
        <p className="text-sm text-gray-400">Карта недоступна</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
      style={{ height }}>
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
