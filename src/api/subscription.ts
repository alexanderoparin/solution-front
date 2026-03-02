import apiClient from './client'
import type { PlanDto, InitiatePaymentResponse } from '../types/api'

export const subscriptionApi = {
  getPlans: async (): Promise<PlanDto[]> => {
    const response = await apiClient.get<PlanDto[]>('/subscription/plans')
    return response.data
  },

  /** Инициация оплаты плана; возвращает URL для редиректа в Робокассу */
  initiatePayment: async (planId: number): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post<InitiatePaymentResponse>('/subscription/initiate', { planId })
    return response.data
  },
}
