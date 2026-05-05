import instance from './axios.js'

export const vehiclesApi = {
  getAll: () => instance.get('/vehicles'),
  getById: (id) => instance.get(`/vehicles/${id}`),
  create: (data) => instance.post('/vehicles', data),
  update: (id, data) => instance.put(`/vehicles/${id}`, data),
  delete: (id) => instance.delete(`/vehicles/${id}`),
}
