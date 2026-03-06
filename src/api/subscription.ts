import apiClient from './client'
import type { PlanDto, InitiatePaymentResponse, SubscriptionStatusResponse } from '../types/api'

export const subscriptionApi = {
  getPlans: async (): Promise<PlanDto[]> => {
    const response = await apiClient.get<PlanDto[]>('/subscription/plans')
    return response.data
  },

  /** Статус оплаты/тарифов (для скрытия блоков в UI) */
  getStatus: async (): Promise<SubscriptionStatusResponse> => {
    const response = await apiClient.get<SubscriptionStatusResponse>('/subscription/status')
    return response.data
  },

  /** Инициация оплаты плана; возвращает URL для редиректа в Робокассу */
  initiatePayment: async (planId: number): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post<InitiatePaymentResponse>('/subscription/initiate', { planId })
    return response.data
  },
}
