import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore.js'

export default function PrivateRoute({ allowedRoles, children }) {
  const { accessToken, user } = useAuthStore()

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
