import apiClient from './client'
import type {
  ActivatePlanResponse,
  AbTestQuotaDto,
  CabinetBillingStatusDto,
  InitiatePaymentResponse,
  PaymentStatusResponse,
  PlanDto,
  SubscriptionStatusResponse,
} from '../types/api'

export const subscriptionApi = {
  getPlans: async (kind?: 'MAIN' | 'CAMPAIGN' | 'AB_PACK'): Promise<PlanDto[]> => {
    const response = await apiClient.get<PlanDto[]>('/subscription/plans', {
      params: kind ? { kind } : undefined,
    })
    return response.data
  },

  getCampaignManagePlans: async (): Promise<PlanDto[]> => {
    return subscriptionApi.getPlans('CAMPAIGN')
  },

  getMainPlans: async (): Promise<PlanDto[]> => {
    return subscriptionApi.getPlans('MAIN')
  },

  getAbPackPlans: async (): Promise<PlanDto[]> => {
    return subscriptionApi.getPlans('AB_PACK')
  },

  getCabinetBillingStatus: async (cabinetId: number): Promise<CabinetBillingStatusDto> => {
    const response = await apiClient.get<CabinetBillingStatusDto>(
      `/subscription/cabinet/${cabinetId}/status`,
    )
    return response.data
  },

  /** Явно подключает 3 бесплатных А/Б теста кабинета */
  activateAbFreeQuota: async (cabinetId: number): Promise<AbTestQuotaDto> => {
    const response = await apiClient.post<AbTestQuotaDto>(
      `/subscription/cabinet/${cabinetId}/ab-tests/activate-free`,
    )
    return response.data
  },

  /** Статус оплаты/тарифов (для скрытия блоков в UI) */
  getStatus: async (): Promise<SubscriptionStatusResponse> => {
    const response = await apiClient.get<SubscriptionStatusResponse>('/subscription/status')
    return response.data
  },

  /** Активация бесплатного плана услуги кабинета */
  activatePlan: async (planId: number, cabinetId: number): Promise<ActivatePlanResponse> => {
    const response = await apiClient.post<ActivatePlanResponse>('/subscription/activate', {
      planId,
      cabinetId,
    })
    return response.data
  },

  /** Инициация оплаты платного плана / услуги / пакета А/Б */
  initiatePayment: async (planId: number, cabinetId: number): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post<InitiatePaymentResponse>('/subscription/initiate-payment', {
      planId,
      cabinetId,
    })
    return response.data
  },

  /** Статус платежа после возврата с платёжной страницы */
  getPaymentStatus: async (paymentId: number): Promise<PaymentStatusResponse> => {
    const response = await apiClient.get<PaymentStatusResponse>(`/subscription/payment/${paymentId}/status`)
    return response.data
  },
}
