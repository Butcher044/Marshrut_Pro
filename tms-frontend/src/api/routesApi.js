import instance from './axios.js'

export const routesApi = {
  getByOrderId: (orderId) => instance.get(`/routes/${orderId}`),
  geocode: (address) => instance.post('/routes/geocode', { address }),
}
