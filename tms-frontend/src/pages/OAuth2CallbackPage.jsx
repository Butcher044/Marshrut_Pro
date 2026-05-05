import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '../store/authStore.js'
import instance from '../api/axios.js'

export default function OAuth2CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    const token = searchParams.get('token')
    const refresh = searchParams.get('refresh')

    if (!token) {
      navigate('/login')
      return
    }

    const fetchUser = async () => {
      try {
        login(token, refresh, null)
        const { data } = await instance.get('/auth/me')
        login(token, refresh, data)
        navigate('/dashboard')
      } catch {
        navigate('/login')
      }
    }

    fetchUser()
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Выполняется вход через Яндекс...</p>
    </div>
  )
}
