import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Hexagon, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { authApi } from '../api/authApi.js'
import useAuthStore from '../store/authStore.js'
import instance from '../api/axios.js'

const passwordRules = [
  { test: v => v.length >= 8,           label: 'Минимум 8 символов'        },
  { test: v => /[A-Za-z]/.test(v),      label: 'Хотя бы одна буква'        },
  { test: v => /[0-9]/.test(v),         label: 'Хотя бы одна цифра'        },
]

export default function RegisterPage() {
  const [form, setForm]         = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [errors, setErrors]     = useState({})
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPw, setShowPw]     = useState(false)
  const { login }  = useAuthStore()
  const navigate   = useNavigate()

  const upd = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Введите имя'
    else if (form.firstName.trim().length < 2) e.firstName = 'Минимум 2 символа'

    if (!form.lastName.trim()) e.lastName = 'Введите фамилию'
    else if (form.lastName.trim().length < 2) e.lastName = 'Минимум 2 символа'

    if (!form.email) e.email = 'Введите email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Некорректный email'

    if (!form.password) e.password = 'Введите пароль'
    else if (form.password.length < 8) e.password = 'Минимум 8 символов'
    else if (!/[0-9]/.test(form.password)) e.password = 'Добавьте хотя бы одну цифру'

    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      login(data.accessToken, data.refreshToken, null)
      const userRes = await instance.get('/auth/me')
      login(data.accessToken, data.refreshToken, userRes.data)
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      const msg    = err.response?.data?.message || ''
      if (status === 409 || msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('email')) {
        setErrors(e => ({ ...e, email: 'Этот email уже зарегистрирован' }))
      } else if (status === 400) {
        setError('Проверьте правильность заполнения полей')
      } else if (status >= 500) {
        setError('Ошибка сервера — попробуйте позже')
      } else {
        setError(msg || 'Ошибка регистрации')
      }
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = passwordRules.filter(r => r.test(form.password)).length
  const strengthColor = ['#EF4444', '#F59E0B', '#10B981'][pwStrength - 1] || '#E5E7EB'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6FA] px-4 py-8 font-sans">
      <div className="w-full max-w-[440px]">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link to="/">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-[0_4px_16px_rgba(37,99,235,0.35)] transition-transform hover:scale-105">
              <Hexagon className="h-6 w-6 fill-white text-white" strokeWidth={1.5} />
            </div>
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">Создать аккаунт</h1>
            <p className="mt-0.5 text-sm text-gray-400">Зарегистрируйтесь как клиент Маршруты Про</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">

          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Имя" error={errors.firstName}>
                <input
                  type="text" value={form.firstName}
                  onChange={e => upd('firstName', e.target.value)}
                  placeholder="Иван" autoComplete="given-name"
                  className={inp(errors.firstName)}
                />
              </Field>
              <Field label="Фамилия" error={errors.lastName}>
                <input
                  type="text" value={form.lastName}
                  onChange={e => upd('lastName', e.target.value)}
                  placeholder="Иванов" autoComplete="family-name"
                  className={inp(errors.lastName)}
                />
              </Field>
            </div>

            <Field label="Email" error={errors.email}>
              <input
                type="email" value={form.email}
                onChange={e => upd('email', e.target.value)}
                placeholder="ivan@company.ru" autoComplete="email"
                className={inp(errors.email)}
              />
            </Field>

            <Field label="Пароль" error={errors.password}>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => upd('password', e.target.value)}
                  placeholder="Минимум 8 символов" autoComplete="new-password"
                  className={inp(errors.password) + ' pr-10'}
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength */}
              {form.password && (
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all"
                        style={{ background: i < pwStrength ? strengthColor : '#E5E7EB' }} />
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    {passwordRules.map(r => (
                      <div key={r.label} className="flex items-center gap-1.5">
                        <CheckCircle2 className={`h-3 w-3 flex-shrink-0 transition-colors ${r.test(form.password) ? 'text-emerald-500' : 'text-gray-300'}`} strokeWidth={2.5} />
                        <span className={`text-[11px] ${r.test(form.password) ? 'text-emerald-600' : 'text-gray-400'}`}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Field>

            <button
              type="submit" disabled={loading}
              className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-400">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Войти</Link>
        </p>

        <p className="mt-3 text-center text-xs text-gray-300">
          Регистрируясь, вы соглашаетесь с условиями использования платформы
        </p>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inp = (hasError) =>
  `w-full rounded-xl border bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-300 focus:bg-white focus:ring-2 ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-blue-300 focus:ring-blue-100'
  }`
