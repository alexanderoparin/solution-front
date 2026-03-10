import apiClient from './client'
import type {
  PlanDto,
  CreatePlanRequest,
  UpdatePlanRequest,
  SubscriptionDto,
  PaymentDto,
  ExtendSubscriptionRequest,
  TriggerCooldownResponse,
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
}
