import instance from './axios.js'

export const ordersApi = {
  getAll: (params) => instance.get('/orders', { params }),
  getMy: (params) => instance.get('/orders/my', { params }),
  getMyTrips: (params) => instance.get('/orders/my-trips', { params }),
  getById: (id) => instance.get(`/orders/${id}`),
  create: (data) => instance.post('/orders', data),
  updateStatus: (id, status) => instance.patch(`/orders/${id}/status`, { status }),
  assignDriver: (id) => instance.post(`/orders/${id}/assign`),
  delete: (id) => instance.delete(`/orders/${id}`),
}
