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
  }
  return config
})

// Перехватчик для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    
    // 401 - неавторизован, всегда редиректим на логин
    if (status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    // 403 - запрещено
    // Для эндпоинтов, которые требуют авторизации (профиль, активные селлеры),
    // 403 с "JWT токен не найден или невалиден" означает проблему с авторизацией
    // Редиректим на логин для этих эндпоинтов
    if (status === 403) {
      const authRequiredEndpoints = ['/user/profile', '/users/active-sellers']
      const isAuthRequiredEndpoint = authRequiredEndpoints.some(endpoint => url.includes(endpoint))
      
      if (isAuthRequiredEndpoint) {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient

