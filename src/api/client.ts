import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Используем переменную окружения или дефолтное значение
// В production используем относительный путь /api (проксируется через nginx)
// В dev режиме используем прямой URL на localhost:8080
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8080/api')

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

// Перехватчик для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    
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

