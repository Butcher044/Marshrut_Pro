import instance from './axios.js'
import axios from 'axios'

export const authApi = {
  register: (data) => instance.post('/auth/register', data),
  login: (data) => instance.post('/auth/login', data),
  logout: (refreshToken) => instance.post('/auth/logout', null, { params: { refreshToken } }),
  me: () => instance.get('/auth/me'),
  refresh: (refreshToken) => axios.post('/api/auth/refresh', { refreshToken }),
}
