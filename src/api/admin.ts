import apiClient from './client'
import type {
  PlanDto,
  CreatePlanRequest,
  UpdatePlanRequest,
  SubscriptionDto,
  PaymentDto,
  ExtendSubscriptionRequest,
  TriggerCooldownResponse,
  WbApiEventDto,
  WbApiEventStatus,
  WbApiEventType,
  PageResponse,
  WbApiEventStatsDto,
} from '../types/api'

export const adminApi = {
  getPlans: async (): Promise<PlanDto[]> => {
    const response = await apiClient.get<PlanDto[]>('/admin/plans')
    return response.data
  },

  createPlan: async (data: CreatePlanRequest): Promise<PlanDto> => {
    const response = await apiClient.post<PlanDto>('/admin/plans', data)
    return response.data
  },

  updatePlan: async (id: number, data: UpdatePlanRequest): Promise<PlanDto> => {
    const response = await apiClient.put<PlanDto>(`/admin/plans/${id}`, data)
    return response.data
  },

  getUserSubscriptions: async (userId: number): Promise<SubscriptionDto[]> => {
    const response = await apiClient.get<SubscriptionDto[]>(`/admin/users/${userId}/subscriptions`)
    return response.data
  },

  getUserPayments: async (userId: number): Promise<PaymentDto[]> => {
    const response = await apiClient.get<PaymentDto[]>(`/admin/users/${userId}/payments`)
    return response.data
  },

  extendSubscription: async (data: ExtendSubscriptionRequest): Promise<SubscriptionDto> => {
    const body = data.expiresAt ? { ...data, expiresAt: data.expiresAt } : { userId: data.userId, planId: data.planId }
    const response = await apiClient.post<SubscriptionDto>('/admin/subscription/extend', body)
    return response.data
  },

  /** Кулдаун ручного запуска «обновить кабинеты» (не чаще 1 раза в 5 мин). Для админов и менеджеров. */
  getTriggerCooldown: async (): Promise<TriggerCooldownResponse> => {
    const response = await apiClient.get<TriggerCooldownResponse>('/admin/trigger-cooldown')
    return response.data
  },

  getWbEvents: async (params: {
    page: number
    size: number
    status?: WbApiEventStatus
    eventType?: WbApiEventType
    cabinetId?: number
  }): Promise<PageResponse<WbApiEventDto>> => {
    const response = await apiClient.get<PageResponse<WbApiEventDto>>('/admin/wb-events', { params })
    return response.data
  },

  getWbEvent: async (eventId: number): Promise<WbApiEventDto> => {
    const response = await apiClient.get<WbApiEventDto>(`/admin/wb-events/${eventId}`)
    return response.data
  },

  getWbEventsStats: async (): Promise<WbApiEventStatsDto> => {
    const response = await apiClient.get<WbApiEventStatsDto>('/admin/wb-events/stats')
    return response.data
  },

  retryWbEvent: async (eventId: number): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/admin/wb-events/${eventId}/retry`)
    return response.data
  },

  cancelWbEvent: async (eventId: number): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`/admin/wb-events/${eventId}/cancel`)
    return response.data
  },
}
