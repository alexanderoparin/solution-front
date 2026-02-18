import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Относительный /api: в production проксируется nginx, в dev — Vite proxy (vite.config.ts → localhost:8080).
// Переопределение: VITE_API_BASE_URL (например, http://localhost:8080/api при отдельном запуске бэкенда).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 секунд таймаут
})

// Перехватчик для добавления токена
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    console.warn('Токен не найден для запроса:', config.url)
  }
  return config
})

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

function isRetryableNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { code?: string; message?: string; response?: unknown }
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') return true
  if (err.message?.includes('Network Error') || err.message?.includes('Connection reset')) return true
  if (!err.response && err.message) return true // нет ответа от сервера
  return false
}

// Перехватчик для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config
    const status = error.response?.status
    const url = config?.url || ''

    // Автоповтор при обрыве соединения (Connection reset by peer и т.п.)
    if (config && isRetryableNetworkError(error)) {
      const retryCount = config.__retryCount ?? 0
      if (retryCount < MAX_RETRIES) {
        config.__retryCount = retryCount + 1
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
        return apiClient.request(config)
      }
    }

    // 401 - неавторизован, редиректим на логин
    // Исключаем эндпоинт логина, чтобы пользователь мог увидеть сообщение об ошибке
    if (status === 401 && !url.includes('/auth/login')) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    // 403 - запрещено
    // Для всех защищенных эндпоинтов 403 означает проблему с авторизацией
    // Редиректим на логин для всех защищенных эндпоинтов (кроме публичных)
    if (status === 403) {
      const publicEndpoints = ['/auth/login', '/health']
      const isPublicEndpoint = publicEndpoints.some(endpoint => url.includes(endpoint))
      
      if (!isPublicEndpoint) {
        // 403 на защищенном эндпоинте означает проблему с токеном
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient

