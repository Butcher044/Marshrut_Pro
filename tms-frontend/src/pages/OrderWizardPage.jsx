import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Package, FileText, CheckCircle, ArrowRight, ArrowLeft, Check, X } from 'lucide-react'
import { ordersApi } from '../api/ordersApi.js'

const STEPS = [
  { id: 1, label: 'Маршрут',  icon: MapPin       },
  { id: 2, label: 'Груз',     icon: Package      },
  { id: 3, label: 'Детали',   icon: FileText     },
  { id: 4, label: 'Итог',     icon: CheckCircle  },
]

const CARGO_TYPES = [
  { id: 'general',      label: 'Общий груз',       icon: '📦' },
  { id: 'fragile',      label: 'Хрупкий',          icon: '🔮' },
  { id: 'construction', label: 'Стройматериалы',   icon: '🏗️' },
  { id: 'temperature',  label: 'Температурный',    icon: '🌡️' },
  { id: 'oversize',     label: 'Крупногабаритный', icon: '🚛' },
  { id: 'dangerous',    label: 'Опасный груз',      icon: '⚠️' },
]

function fakeKm(a, b) {
  const n = [...(a + b)].reduce((s, c) => s + c.charCodeAt(0), 0)
  return 60 + (n % 420)
}

export default function OrderWizardPage() {
  const navigate = useNavigate()
  const [step, setStep]     = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({
    originAddress: '', destAddress: '',
    cargoWeight: '', cargoVolume: '',
    cargoType: 'general',
    contactName: '', contactPhone: '', comment: '',
  })
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const km  = form.originAddress && form.destAddress ? fakeKm(form.originAddress, form.destAddress) : 150
  const w   = parseFloat(form.cargoWeight) || 0
  const cost = { base: 1500, byW: Math.round(w * 2), byD: Math.round(km * 12) }
  cost.total = cost.base + cost.byW + cost.byD

  const canNext = step === 1
    ? form.originAddress.trim().length > 3 && form.destAddress.trim().length > 3
    : true

  const submit = async () => {
    setSaving(true); setError('')
    try {
      const { data } = await ordersApi.create({
        originAddress: form.originAddress,
        destAddress:   form.destAddress,
        cargoWeight:   w || null,
        cargoVolume:   parseFloat(form.cargoVolume) || null,
      })
      navigate('/orders', { state: { created: data.id } })
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка создания заказа')
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Новый заказ</h1>
        <p className="mt-1 text-sm text-gray-400">Заполните информацию — займёт меньше минуты</p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-start">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                step > s.id  ? 'bg-blue-600 text-white' :
                step === s.id ? 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.15)]' :
                'bg-gray-100 text-gray-400'
              }`}>
                {step > s.id ? <Check className="h-4 w-4" strokeWidth={2.5} /> : s.id}
              </div>
              <span className={`whitespace-nowrap text-[11px] font-medium ${
                step === s.id ? 'text-blue-600' : step > s.id ? 'text-gray-500' : 'text-gray-400'
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 mt-4 h-0.5 flex-1 rounded ${step > s.id ? 'bg-blue-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        {step === 1 && <StepRoute form={form} upd={upd} />}
        {step === 2 && <StepCargo form={form} upd={upd} />}
        {step === 3 && <StepDetails form={form} upd={upd} />}
        {step === 4 && <StepConfirm form={form} cost={cost} km={km} error={error} />}

        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" /> Назад
            </button>
          ) : (
            <button onClick={() => navigate('/orders')} className="text-sm text-gray-400 transition-colors hover:text-gray-600">
              Отмена
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 disabled:opacity-40 active:scale-95"
            >
              Далее <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-500 disabled:opacity-60 active:scale-95"
            >
              {saving ? 'Отправляем…' : 'Разместить заказ'}
              {!saving && <CheckCircle className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step 1: Route ─────────────────────────────────────────────
function StepRoute({ form, upd }) {
  const containerRef  = useRef(null)
  const mapRef        = useRef(null)
  const pickModeRef   = useRef(null)
  const [pickMode, setPickMode_]    = useState(null)
  const [mapReady, setMapReady]     = useState(false)
  const [routeLoading, setRouteLoading] = useState(false)
  const [waypoints, setWaypoints]   = useState([])

  const setPickMode = (m) => { pickModeRef.current = m; setPickMode_(m) }

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const init = () => {
      const map = new window.ymaps.Map(
        containerRef.current,
        { center: [55.75, 37.62], zoom: 9 },
        { suppressMapOpenBlock: true }
      )

      map.events.add('click', async (e) => {
        const mode = pickModeRef.current
        if (!mode) return
        const coords = e.get('coords')
        try {
          const res = await window.ymaps.geocode(coords, { results: 1 })
          const address = res.geoObjects.get(0)?.getAddressLine?.()
            || `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`
          if (mode === 'origin') upd('originAddress', address)
          else if (mode === 'dest')   upd('destAddress', address)
        } catch (_) {}
        pickModeRef.current = null
        setPickMode_(null)
      })

      mapRef.current = map
      setMapReady(true)
    }

    if (window.ymaps?.ready) window.ymaps.ready(init)

    return () => {
      if (mapRef.current) {
        try { mapRef.current.destroy() } catch (_) {}
        mapRef.current = null
      }
    }
  }, [])

  // Draw route whenever both addresses are ready
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const origin = form.originAddress.trim()
    const dest   = form.destAddress.trim()

    if (!origin || !dest) {
      mapRef.current.geoObjects.removeAll()
      return
    }
    if (origin.length < 4 || dest.length < 4) return

    let cancelled = false
    setRouteLoading(true)

    const timer = setTimeout(() => {
      window.ymaps.route([origin, dest], { mapStateAutoApply: false })
        .then(route => {
          if (cancelled || !mapRef.current) return
          mapRef.current.geoObjects.removeAll()
          mapRef.current.geoObjects.add(route)

          // Style the route path
          route.getPaths().each(path => {
            path.options.set({
              strokeColor: '#2563EB',
              strokeWidth: 5,
              opacity: 0.85,
            })
          })

          try {
            const bounds = route.getBounds()
            if (bounds) mapRef.current.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 })
          } catch (_) {}
          setRouteLoading(false)
        })
        .catch(() => { if (!cancelled) setRouteLoading(false) })
    }, 700)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [mapReady, form.originAddress, form.destAddress])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Маршрут доставки</h2>
        <p className="mt-1 text-sm text-gray-400">Введите адреса или кликните на карте</p>
      </div>

      {/* Map */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm" style={{ height: 300 }}>
        <div ref={containerRef} className="h-full w-full" />
        {pickMode && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <div className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
              {pickMode === 'origin' ? '📍 Кликните — точка отправки' : '🏁 Кликните — точка доставки'}
            </div>
          </div>
        )}
        {routeLoading && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <div className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-xs font-medium text-gray-600 shadow-md backdrop-blur-sm">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Строим маршрут…
            </div>
          </div>
        )}
      </div>

      {/* Route fields */}
      <div className="flex flex-col gap-3">
        <AddrFieldMap
          label="Адрес отправки *"
          value={form.originAddress}
          onChange={v => upd('originAddress', v)}
          dotColor="#10B981"
          placeholder="Москва, ул. Ленина, 1"
          active={pickMode === 'origin'}
          onPick={() => setPickMode(pickMode === 'origin' ? null : 'origin')}
        />
        <div className="ml-[14px] h-5 border-l-2 border-dashed border-gray-200" />

        {waypoints.map((wp, i) => (
          <div key={i}>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <AddrField
                  label={`Промежуточная точка ${i + 1}`}
                  value={wp}
                  onChange={v => setWaypoints(w => w.map((x, j) => j === i ? v : x))}
                  dotColor="#F59E0B"
                  placeholder="Промежуточный адрес"
                />
              </div>
              <button type="button" onClick={() => setWaypoints(w => w.filter((_, j) => j !== i))}
                className="flex h-[46px] w-10 flex-shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 transition-all hover:bg-red-100">
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="ml-[14px] mt-3 h-5 border-l-2 border-dashed border-gray-200" />
          </div>
        ))}

        <AddrFieldMap
          label="Адрес доставки *"
          value={form.destAddress}
          onChange={v => upd('destAddress', v)}
          dotColor="#EF4444"
          placeholder="Тула, пр. Мира, 12"
          active={pickMode === 'dest'}
          onPick={() => setPickMode(pickMode === 'dest' ? null : 'dest')}
        />
      </div>

      <button type="button" onClick={() => setWaypoints(w => [...w, ''])}
        className="flex items-center gap-2 self-start rounded-xl border border-dashed border-gray-300 px-4 py-2 text-xs font-medium text-gray-500 transition-all hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700">
        + Добавить промежуточную точку
      </button>
    </div>
  )
}

// ── Step 2: Cargo ─────────────────────────────────────────────
function StepCargo({ form, upd }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Характеристики груза</h2>
        <p className="mt-1 text-sm text-gray-400">Выберите тип и укажите параметры груза</p>
      </div>
      <div>
        <label className="mb-3 block text-xs font-medium text-gray-500">Тип груза</label>
        <div className="grid grid-cols-3 gap-2.5">
          {CARGO_TYPES.map(ct => (
            <button
              key={ct.id}
              type="button"
              onClick={() => upd('cargoType', ct.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center transition-all ${
                form.cargoType === ct.id
                  ? 'border-blue-300 bg-blue-50 shadow-[0_0_0_2px_rgba(59,130,246,0.15)]'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <span className="text-xl">{ct.icon}</span>
              <span className={`text-[11px] font-medium leading-tight ${
                form.cargoType === ct.id ? 'text-blue-700' : 'text-gray-600'
              }`}>{ct.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <WizField label="Вес груза (кг)">
          <input type="number" min="0" value={form.cargoWeight}
            onChange={e => upd('cargoWeight', e.target.value)}
            placeholder="1 000" className={INP} />
        </WizField>
        <WizField label="Объём груза (м³)">
          <input type="number" min="0" value={form.cargoVolume}
            onChange={e => upd('cargoVolume', e.target.value)}
            placeholder="10" className={INP} />
        </WizField>
      </div>
    </div>
  )
}

// ── Step 3: Details ───────────────────────────────────────────
function StepDetails({ form, upd }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Дополнительная информация</h2>
        <p className="mt-1 text-sm text-gray-400">Не обязательно, но поможет водителю при доставке</p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <WizField label="Контактное лицо">
            <input value={form.contactName} onChange={e => upd('contactName', e.target.value)}
              placeholder="Иванов Иван" className={INP} />
          </WizField>
          <WizField label="Телефон">
            <input value={form.contactPhone} onChange={e => upd('contactPhone', e.target.value)}
              placeholder="+7 (999) 000-00-00" className={INP} />
          </WizField>
        </div>
        <WizField label="Комментарий для водителя">
          <textarea value={form.comment} onChange={e => upd('comment', e.target.value)} rows={3}
            placeholder="Въезд со двора, позвонить за 30 минут до прибытия..."
            className={INP + ' resize-none'} />
        </WizField>
      </div>
    </div>
  )
}

// ── Step 4: Confirm ───────────────────────────────────────────
function StepConfirm({ form, cost, km, error }) {
  const ct = CARGO_TYPES.find(c => c.id === form.cargoType)
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Подтверждение заказа</h2>
        <p className="mt-1 text-sm text-gray-400">Проверьте данные перед отправкой</p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div className="h-8 w-px bg-gray-300" />
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Откуда</p>
              <p className="text-sm font-semibold text-gray-900">{form.originAddress}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Куда</p>
              <p className="text-sm font-semibold text-gray-900">{form.destAddress}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <InfoPill label="Тип груза" value={`${ct?.icon} ${ct?.label}`} />
        <InfoPill label="Вес" value={form.cargoWeight ? `${form.cargoWeight} кг` : '—'} />
        <InfoPill label="Объём" value={form.cargoVolume ? `${form.cargoVolume} м³` : '—'} />
      </div>

      {(form.contactName || form.comment) && (
        <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          {form.contactName && (
            <p className="text-xs text-gray-500">Контакт: <span className="font-medium text-gray-800">{form.contactName} {form.contactPhone}</span></p>
          )}
          {form.comment && (
            <p className="text-xs text-gray-500">Комментарий: <span className="font-medium text-gray-800">{form.comment}</span></p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-blue-500">Предварительная стоимость</p>
        <div className="flex flex-col gap-2">
          <CostLine label="Базовая ставка" val={cost.base} />
          <CostLine
            label={`За вес${form.cargoWeight ? ` (${form.cargoWeight} кг × 2 ₽)` : ''}`}
            val={cost.byW} muted={!form.cargoWeight}
          />
          <CostLine label={`За расстояние (~${km} км × 12 ₽)`} val={cost.byD} />
          <div className="my-1 h-px bg-blue-200" />
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900">Итого</span>
            <span className="text-2xl font-bold text-blue-700">{cost.total.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-blue-400">
          * Предварительный расчёт. Точная стоимость согласовывается с менеджером.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
function AddrFieldMap({ label, value, onChange, dotColor, placeholder, active, onPick }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full" style={{ background: dotColor }} />
          <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-8 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" />
        </div>
        <button type="button" onClick={onPick} title="Выбрать на карте"
          className={`flex h-[46px] w-10 flex-shrink-0 items-center justify-center rounded-xl border text-base transition-all ${
            active
              ? 'border-blue-300 bg-blue-600 text-white shadow-[0_0_0_3px_rgba(59,130,246,0.2)]'
              : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-blue-200 hover:bg-blue-50'
          }`}>
          📍
        </button>
      </div>
    </div>
  )
}

function AddrField({ label, value, onChange, dotColor, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full" style={{ background: dotColor }} />
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-8 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" />
      </div>
    </div>
  )
}

function WizField({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  )
}

function InfoPill({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
      <span className="text-[10px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  )
}

function CostLine({ label, val, muted }) {
  return (
    <div className={`flex items-center justify-between ${muted ? 'opacity-40' : ''}`}>
      <span className="text-xs text-blue-700">{label}</span>
      <span className="text-sm font-semibold text-blue-800">{val.toLocaleString('ru-RU')} ₽</span>
    </div>
  )
}

const INP = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100'
