import api from './axios.js'

export const statsApi = {
  summary: () => api.get('/stats/summary'),
}
