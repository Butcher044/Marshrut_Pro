import instance from './axios.js'

export const driversApi = {
  getAll: () => instance.get('/drivers'),
  getMe: () => instance.get('/drivers/me'),
  getById: (id) => instance.get(`/drivers/${id}`),
  create: (data) => instance.post('/drivers', data),
  updateStatus: (id, status) => instance.patch(`/drivers/${id}/status`, null, { params: { status } }),
  logLocation: (id, data) => instance.post(`/drivers/${id}/location`, data),
}
