import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Hexagon, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../api/authApi.js'
import useAuthStore from '../store/authStore.js'

export default function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const upd = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Введите email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Некорректный формат email'
    if (!form.password) e.password = 'Введите пароль'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      login(data.accessToken, data.refreshToken, null)
      const { default: instance } = await import('../api/axios.js')
      const userRes = await instance.get('/auth/me')
      login(data.accessToken, data.refreshToken, userRes.data)
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      const msg    = err.response?.data?.message || ''
      if (status === 401 || status === 403) {
        setError('Неверный email или пароль')
      } else if (status === 404) {
        setErrors(e => ({ ...e, email: 'Пользователь с таким email не найден' }))
      } else if (status === 423) {
        setError('Аккаунт временно заблокирован. Обратитесь в поддержку')
      } else if (status >= 500) {
        setError('Ошибка сервера — попробуйте позже')
      } else {
        setError(msg || 'Ошибка входа')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleYandex = () => {
    window.location.href = '/oauth2/authorization/yandex'
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6FA] px-4 font-sans">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link to="/">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-[0_4px_16px_rgba(37,99,235,0.35)] transition-transform hover:scale-105">
              <Hexagon className="h-6 w-6 fill-white text-white" strokeWidth={1.5} />
            </div>
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">Маршруты Про</h1>
            <p className="mt-0.5 text-sm text-gray-400">Войдите в свой аккаунт</p>
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
            <Field label="Email" error={errors.email}>
              <input
                type="email" value={form.email}
                onChange={e => upd('email', e.target.value)}
                placeholder="you@company.ru" autoComplete="email"
                className={inp(errors.email)}
              />
            </Field>

            <Field label="Пароль" error={errors.password}>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => upd('password', e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  className={inp(errors.password) + ' pr-10'}
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <button
              type="submit" disabled={loading}
              className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Входим…' : 'Войти'}
            </button>
          </form>

        </div>

        <p className="mt-5 text-center text-sm text-gray-400">
          Нет аккаунта?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Зарегистрироваться
          </Link>
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
