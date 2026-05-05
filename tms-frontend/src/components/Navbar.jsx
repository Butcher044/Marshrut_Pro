import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore.js'
import { authApi } from '../api/authApi.js'
import {
  LayoutDashboard, Package, Truck, Users, Map, LogOut,
  Bell, Hexagon, Plus, Navigation,
} from 'lucide-react'

export default function Navbar() {
  const { user, logout, refreshToken } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleLogout = async () => {
    try { await authApi.logout(refreshToken) } catch (_) {}
    logout()
    navigate('/login')
  }

  const role      = user?.role
  const isAdmin   = role === 'ADMIN'
  const isManager = role === 'ADMIN' || role === 'MANAGER'
  const isClient  = role === 'CLIENT'
  const isDriver  = role === 'DRIVER'

  // Role-specific nav links
  const links = [
    { to: '/dashboard', label: 'Обзор', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'CLIENT', 'DRIVER'] },
    { to: '/orders',    label: 'Заказы', icon: Package,         roles: ['ADMIN', 'MANAGER', 'CLIENT', 'DRIVER'] },
    ...(isManager ? [
      { to: '/drivers',  label: 'Водители',  icon: Users,  roles: ['ADMIN', 'MANAGER'] },
      { to: '/vehicles', label: 'Транспорт', icon: Truck,  roles: ['ADMIN', 'MANAGER'] },
    ] : []),
    { to: '/map', label: 'Карта', icon: Map, roles: ['ADMIN', 'MANAGER', 'CLIENT', 'DRIVER'] },
    ...(isAdmin ? [
      { to: '/admin/users', label: 'Пользователи', icon: Users, roles: ['ADMIN'] },
    ] : []),
  ].filter(l => l.roles.includes(role))

  const isActive = (to) =>
    to === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-[1400px] items-center gap-1 px-6">

        {/* Logo */}
        <Link to="/dashboard" className="mr-6 flex flex-shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600">
            <Hexagon className="h-4 w-4 fill-white text-white" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-gray-900">Маршруты Про</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                isActive(to)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon className="h-[15px] w-[15px]" strokeWidth={isActive(to) ? 2 : 1.75} />
              <span className="hidden lg:block">{label}</span>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex flex-shrink-0 items-center gap-2">

          {/* CLIENT: prominent "New order" CTA */}
          {isClient && (
            <Link to="/create-order"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-all hover:bg-blue-500">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span className="hidden sm:block">Новый заказ</span>
            </Link>
          )}

          {/* DRIVER: quick tracking link */}
          {isDriver && (
            <Link to="/orders"
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-600 transition-all hover:bg-blue-100">
              <Navigation className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="hidden sm:block">Мои рейсы</span>
            </Link>
          )}

          {/* Bell */}
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600">
            <Bell className="h-[17px] w-[17px]" strokeWidth={1.75} />
          </button>

          {/* User pill */}
          <div className="flex items-center gap-2.5 rounded-full border border-gray-100 bg-gray-50 py-1 pl-1 pr-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-[12px] font-semibold leading-none text-gray-800">{user?.firstName}</p>
              <p className="mt-0.5 text-[10px] leading-none text-gray-400">{roleLabel(role)}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Выйти"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="h-[17px] w-[17px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </nav>
  )
}

function roleLabel(role) {
  return { ADMIN: 'Администратор', MANAGER: 'Менеджер', DRIVER: 'Водитель', CLIENT: 'Клиент' }[role] || role
}
