import axios from 'axios'
import { API_BASE_URL } from './config'

const api = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:5000',
  withCredentials: true,
  timeout: 20000,
})

api.interceptors.request.use((config) => config)

api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && 'success' in res.data) {
      if (!res.data.success) {
        return Promise.reject(new Error(res.data?.error?.message || 'Request failed'))
      }
      return { ...res, data: res.data.data }
    }
    return res
  },
  (err) => Promise.reject(err)
)

export default api