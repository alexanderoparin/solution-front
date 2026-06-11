import apiClient from './client'
import type {
  ActivatePlanResponse,
  PlanDto,
  InitiatePaymentResponse,
  SubscriptionStatusResponse,
} from '../types/api'

export const CAMPAIGN_MANAGE_PRODUCT = 'CAMPAIGN_MANAGE'

export const subscriptionApi = {
  getPlans: async (product?: string): Promise<PlanDto[]> => {
    const params = product ? { product } : undefined
    const response = await apiClient.get<PlanDto[]>('/subscription/plans', { params })
    return response.data
  },

  getCampaignManagePlans: async (): Promise<PlanDto[]> => {
    return subscriptionApi.getPlans(CAMPAIGN_MANAGE_PRODUCT)
  },

  /** Статус оплаты/тарифов (для скрытия блоков в UI) */
  getStatus: async (): Promise<SubscriptionStatusResponse> => {
    const response = await apiClient.get<SubscriptionStatusResponse>('/subscription/status')
    return response.data
  },

  /** Активация бесплатного плана */
  activatePlan: async (planId: number): Promise<ActivatePlanResponse> => {
    const response = await apiClient.post<ActivatePlanResponse>('/subscription/activate', { planId })
    return response.data
  },

  /** Инициация оплаты плана; возвращает URL для редиректа в Робокассу */
  initiatePayment: async (planId: number): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post<InitiatePaymentResponse>('/subscription/initiate', { planId })
    return response.data
  },
}
