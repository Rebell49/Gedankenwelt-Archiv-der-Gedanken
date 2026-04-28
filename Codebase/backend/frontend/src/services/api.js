import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    // Add timestamp to prevent stale responses
    config.params = {
      ...config.params,
      _t: Date.now(),
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config

    if (originalRequest && !error.response) {
      originalRequest.__retryCount = originalRequest.__retryCount || 0
      if (originalRequest.__retryCount < 2) {
        originalRequest.__retryCount += 1
        return api(originalRequest)
      }
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      return new Promise(async (resolve, reject) => {
        try {
          const { refreshAccessToken } = useAuthStore.getState()
          await refreshAccessToken()
          const { accessToken } = useAuthStore.getState()
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          processQueue(null, accessToken)
          resolve(api(originalRequest))
        } catch (refreshError) {
          processQueue(refreshError, null)
          useAuthStore.getState().logout()
          reject(refreshError)
        } finally {
          isRefreshing = false
        }
      })
    }

    return Promise.reject(error)
  }
)

export default api
