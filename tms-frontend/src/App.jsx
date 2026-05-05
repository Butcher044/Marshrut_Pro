import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './router/PrivateRoute.jsx'
import Layout from './components/Layout.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import OAuth2CallbackPage from './pages/OAuth2CallbackPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import OrderDetailPage from './pages/OrderDetailPage.jsx'
import OrderWizardPage from './pages/OrderWizardPage.jsx'
import TrackingPage from './pages/TrackingPage.jsx'
import DriversPage from './pages/DriversPage.jsx'
import VehiclesPage from './pages/VehiclesPage.jsx'
import MapPage from './pages/MapPage.jsx'
import UsersPage from './pages/UsersPage.jsx'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
      <Route path="/unauthorized" element={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <p className="text-4xl font-bold text-gray-200">403</p>
          <p className="text-sm text-gray-500">Доступ запрещён</p>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">На главную</a>
        </div>
      } />

      {/* Protected — layout wrapper */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>

        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Orders — all roles */}
        <Route path="/orders" element={
          <PrivateRoute allowedRoles={['ADMIN', 'MANAGER', 'CLIENT', 'DRIVER']}>
            <OrdersPage />
          </PrivateRoute>
        } />
        <Route path="/orders/:id" element={<OrderDetailPage />} />

        {/* Order wizard — CLIENT + MANAGER + ADMIN */}
        <Route path="/create-order" element={
          <PrivateRoute allowedRoles={['CLIENT', 'ADMIN', 'MANAGER']}>
            <OrderWizardPage />
          </PrivateRoute>
        } />

        {/* Live tracking — CLIENT (+ others can view) */}
        <Route path="/track/:id" element={<TrackingPage />} />

        {/* Drivers — managers only */}
        <Route path="/drivers" element={
          <PrivateRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <DriversPage />
          </PrivateRoute>
        } />

        {/* Vehicles — managers only */}
        <Route path="/vehicles" element={
          <PrivateRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <VehiclesPage />
          </PrivateRoute>
        } />

        {/* Map — all authenticated */}
        <Route path="/map" element={<MapPage />} />

        {/* Admin */}
        <Route path="/admin/users" element={
          <PrivateRoute allowedRoles={['ADMIN']}>
            <UsersPage />
          </PrivateRoute>
        } />
        <Route path="/admin/dispatchers" element={<Navigate to="/admin/users" replace />} />

      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
