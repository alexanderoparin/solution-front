import apiClient from './client'
import {
  UserProfileResponse,
  UpdateApiKeyRequest,
  MessageResponse,
  UserListItem,
  CreateUserRequest,
  UpdateUserRequest,
  CabinetDto,
} from '../types/api'

export const userApi = {
  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await apiClient.get<UserProfileResponse>('/user/profile')
    return response.data
  },

  updateApiKey: async (data: UpdateApiKeyRequest): Promise<MessageResponse> => {
    const response = await apiClient.put<MessageResponse>('/user/api-key', data)
    return response.data
  },

  validateApiKey: async (): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/user/api-key/validate')
    return response.data
  },

  /**
   * Запускает обновление данных для текущего селлера.
   */
  triggerDataUpdate: async (): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/user/update-data')
    return response.data
  },

  // Управление пользователями
  getManagedUsers: async (): Promise<UserListItem[]> => {
    const response = await apiClient.get<UserListItem[]>('/users')
    return response.data
  },

  /**
   * Получает список активных селлеров.
   * Для ADMIN возвращает всех активных селлеров.
   * Для MANAGER возвращает только своих активных селлеров.
   */
  getActiveSellers: async (): Promise<UserListItem[]> => {
    const response = await apiClient.get<UserListItem[]>('/users/active-sellers')
    return response.data
  },

  createUser: async (data: CreateUserRequest): Promise<UserListItem> => {
    const response = await apiClient.post<UserListItem>('/users', data)
    return response.data
  },

  updateUser: async (userId: number, data: UpdateUserRequest): Promise<UserListItem> => {
    const response = await apiClient.put<UserListItem>(`/users/${userId}`, data)
    return response.data
  },

  toggleUserActive: async (userId: number): Promise<MessageResponse> => {
    const response = await apiClient.put<MessageResponse>(`/users/${userId}/toggle-active`)
    return response.data
  },

  /**
   * Запускает обновление данных для указанного селлера.
   * Доступно только для ADMIN и MANAGER.
   */
  triggerSellerDataUpdate: async (sellerId: number): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/users/${sellerId}/trigger-update`)
    return response.data
  },

  /**
   * Запускает обновление данных для указанного кабинета (даты и ограничение 6 ч по кабинету).
   * Доступно для ADMIN и MANAGER.
   */
  triggerCabinetDataUpdate: async (cabinetId: number): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/users/cabinets/${cabinetId}/trigger-update`)
    return response.data
  },

  /**
   * Список кабинетов селлера (для ADMIN/MANAGER при просмотре аналитики селлера).
   */
  getSellerCabinets: async (sellerId: number): Promise<CabinetDto[]> => {
    const response = await apiClient.get<CabinetDto[]>(`/users/${sellerId}/cabinets`)
    return response.data
  },
}

