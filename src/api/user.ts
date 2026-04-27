import apiClient from './client'
import {
  UserProfileResponse,
  UpdateApiKeyRequest,
  MessageResponse,
  UserListItem,
  PageResponse,
  CreateUserRequest,
  UpdateUserRequest,
  CabinetDto,
  ManagedCabinetRowDto,
  WorkContextCabinetDto,
  AccessStatusResponse,
  PaymentDto,
} from '../types/api'
import type { CabinetTokenType } from '../types/api'
import type { SortDirection, UserSortField } from '../constants/userSorting'
import type { CabinetSortField } from '../constants/cabinetSorting'

const USER_SORT_FIELD_TO_BACKEND: Record<UserSortField, string> = {
  email: 'EMAIL',
  role: 'ROLE',
  isActive: 'IS_ACTIVE',
  createdAt: 'CREATED_AT',
  lastDataUpdateAt: 'LAST_DATA_UPDATE_AT',
  lastDataUpdateRequestedAt: 'LAST_DATA_UPDATE_REQUESTED_AT',
}

/** React Query: ключ и время жизни свежего кеша статуса доступа (префетч после логина / при старте SPA). */
export const ACCESS_STATUS_QUERY_KEY = ['accessStatus'] as const

export const ACCESS_STATUS_STALE_MS = 60_000

const CABINET_SORT_FIELD_TO_BACKEND: Record<CabinetSortField, string> = {
  cabinetId: 'CABINET_ID',
  cabinetName: 'CABINET_NAME',
  sellerEmail: 'SELLER_EMAIL',
  lastDataUpdateAt: 'LAST_DATA_UPDATE_AT',
  lastStocksUpdateAt: 'LAST_STOCKS_UPDATE_AT',
}

export const userApi = {
  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await apiClient.get<UserProfileResponse>('/user/profile')
    return response.data
  },

  /** Доступ к функционалу и статус подписки (для редиректа на «Оформите подписку») */
  getAccessStatus: async (): Promise<AccessStatusResponse> => {
    const response = await apiClient.get<AccessStatusResponse>('/user/access', {
      timeout: 45_000,
    })
    return response.data
  },

  /** Список платежей текущего пользователя */
  getMyPayments: async (): Promise<PaymentDto[]> => {
    const response = await apiClient.get<PaymentDto[]>('/user/payments')
    return response.data
  },

  /**
   * Отправить письмо для подтверждения email (не чаще 1 раза в 24 ч).
   */
  sendEmailConfirmation: async (): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/user/send-email-confirmation')
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

  // Управление пользователями (серверная пагинация/фильтрация/сортировка)
  getManagedUsers: async (params: {
    page: number
    size: number
    email?: string
    onlySellers?: boolean
    sortBy?: UserSortField
    sortDir?: SortDirection
  }): Promise<PageResponse<UserListItem>> => {
    const response = await apiClient.get<PageResponse<UserListItem>>('/users', {
      params: {
        ...params,
        sortBy: params.sortBy ? USER_SORT_FIELD_TO_BACKEND[params.sortBy] : undefined,
        sortDir: params.sortDir ? params.sortDir.toUpperCase() : undefined,
      },
    })
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
   * Полное удаление пользователя и всех связанных данных. Только для ADMIN.
   * Таймаут увеличен (2 мин): коммит большой транзакции на бэкенде может занимать много времени.
   */
  deleteUser: async (userId: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/users/${userId}`)
    return response.data
  },

  /**
   * Запускает обновление данных для указанного селлера.
   * Доступно только для ADMIN и MANAGER.
   */
  triggerSellerDataUpdate: async (sellerId: number, includeStocks = false): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/users/${sellerId}/trigger-update`, undefined, {
      params: { includeStocks },
    })
    return response.data
  },

  /**
   * Запускает полное обновление всех активных кабинетов (как ночной шедулер).
   * Доступно для ADMIN и MANAGER.
   */
  triggerAllCabinetsUpdate: async (includeStocks = false): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/users/trigger-all-cabinets-update', undefined, {
      params: { includeStocks },
    })
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
   * Запускает только обновление остатков по кабинету (не чаще раза в час).
   * Доступно владельцу кабинета, ADMIN и MANAGER.
   */
  triggerCabinetStocksUpdate: async (cabinetId: number): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/users/cabinets/${cabinetId}/trigger-stocks-update`)
    return response.data
  },

  /**
   * Кабинеты с API-ключом в зоне видимости (шапка: админ/менеджер), по алфавиту названия.
   */
  getWorkContextCabinets: async (): Promise<WorkContextCabinetDto[]> => {
    const response = await apiClient.get<WorkContextCabinetDto[]>('/users/work-context-cabinets')
    return response.data
  },

  /**
   * Список кабинетов селлера (для ADMIN/MANAGER при просмотре аналитики селлера).
   */
  getSellerCabinets: async (sellerId: number): Promise<CabinetDto[]> => {
    const response = await apiClient.get<CabinetDto[]>(`/users/${sellerId}/cabinets`)
    return response.data
  },

  /** Постраничный список кабинетов (ADMIN / MANAGER). */
  getManagedCabinets: async (params: {
    page: number
    size: number
    search?: string
    sortBy?: CabinetSortField
    sortDir?: SortDirection
  }): Promise<PageResponse<ManagedCabinetRowDto>> => {
    const response = await apiClient.get<PageResponse<ManagedCabinetRowDto>>('/users/managed-cabinets', {
      params: {
        page: params.page,
        size: params.size,
        search: params.search,
        sortBy: params.sortBy ? CABINET_SORT_FIELD_TO_BACKEND[params.sortBy] : undefined,
        sortDir: params.sortDir ? params.sortDir.toUpperCase() : undefined,
      },
    })
    return response.data
  },

  /**
   * Запуск валидации API ключа кабинета селлера (для ADMIN/MANAGER в блоке кабинетов).
   */
  validateSellerCabinetKey: async (cabinetId: number): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/users/cabinets/${cabinetId}/validate-api-key`)
    return response.data
  },

  /**
   * Обновление API ключа кабинета селлера (для ADMIN/MANAGER).
   */
  updateSellerCabinetKey: async (cabinetId: number, apiKey?: string, tokenType?: CabinetTokenType): Promise<CabinetDto> => {
    const payload: { apiKey?: string; tokenType?: CabinetTokenType } = {}
    if (apiKey !== undefined) payload.apiKey = apiKey
    if (tokenType !== undefined) payload.tokenType = tokenType
    const response = await apiClient.patch<CabinetDto>(`/users/cabinets/${cabinetId}`, payload)
    return response.data
  },
}

