import api from './axios.js'

export const usersApi = {
  list:    (params) => api.get('/auth/admin/users', { params }),
  getById: (id)     => api.get(`/auth/users/${id}`),
  create:  (data)   => api.post('/auth/admin/users', data),
  update:  (id, data) => api.put(`/auth/admin/users/${id}`, data),
  remove:  (id)     => api.delete(`/auth/admin/users/${id}`),
}
