import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// Используем переменную окружения или дефолтное значение
// В dev режиме можно использовать прокси Vite (/api) или прямой URL
// В продакшене используем относительный путь, так как nginx проксирует запросы
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
    const token = useAuthStore.getState().token
    const requestUrl = error.config?.url || ''
    
    // 401 (Unauthorized) - токен отсутствует, истек или невалиден - редиректим на логин
    if (status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    // 403 (Forbidden) - может быть из-за отсутствия токена, истекшего токена или отсутствия прав
    if (status === 403) {
      // Если токена нет в store, считаем это как 401 и редиректим на логин
      if (!token) {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }
      
      // Для базовых эндпоинтов (profile, active-sellers) 403 скорее всего означает истекший токен
      // Редиректим на логин
      const isBasicEndpoint = requestUrl.includes('/user/profile') || 
                              requestUrl.includes('/users/active-sellers')
      if (isBasicEndpoint) {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    
    // 403 (Forbidden) - токен валиден, но нет прав доступа - не редиректим, просто пробрасываем ошибку
    // Компоненты сами обработают и покажут сообщение пользователю
    return Promise.reject(error)
  }
)

export default apiClient

