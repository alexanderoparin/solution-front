import apiClient from './client'
import type {
  ActivatePlanResponse,
  InitiatePaymentResponse,
  PaymentStatusResponse,
  PlanDto,
  SubscriptionStatusResponse,
} from '../types/api'

export const subscriptionApi = {
  getPlans: async (): Promise<PlanDto[]> => {
    const response = await apiClient.get<PlanDto[]>('/subscription/plans')
    return response.data
  },

  getCampaignManagePlans: async (): Promise<PlanDto[]> => {
    return subscriptionApi.getPlans()
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

  /** Инициация оплаты платного плана (Точка Банк) */
  initiatePayment: async (planId: number): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post<InitiatePaymentResponse>('/subscription/initiate-payment', { planId })
    return response.data
  },

  /** Статус платежа после возврата с платёжной страницы */
  getPaymentStatus: async (paymentId: number): Promise<PaymentStatusResponse> => {
    const response = await apiClient.get<PaymentStatusResponse>(`/subscription/payment/${paymentId}/status`)
    return response.data
  },
}
