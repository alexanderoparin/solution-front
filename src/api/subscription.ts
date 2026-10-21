import apiClient from './client'
import type {
  CabinetBillingStatusDto,
  InitiatePaymentResponse,
  PaymentStatusResponse,
  PlanDto,
  SubscriptionStatusResponse,
  UserBillingOverviewDto,
} from '../types/api'

export const subscriptionApi = {
  getPlans: async (kind?: 'MAIN' | 'CAMPAIGN' | 'AB_PACK'): Promise<PlanDto[]> => {
    const response = await apiClient.get<PlanDto[]>('/subscription/plans', {
      params: kind ? { kind } : undefined,
    })
    return response.data
  },

  /**
   * Публичный каталог (без JWT) — для лендинга.
   */
  getPublicPlans: async (kind?: 'MAIN' | 'CAMPAIGN' | 'AB_PACK'): Promise<PlanDto[]> => {
    const response = await apiClient.get<PlanDto[]>('/public/plans', {
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

  /** MAIN-планы для лендинга (публичный API). */
  getPublicMainPlans: async (): Promise<PlanDto[]> => {
    return subscriptionApi.getPublicPlans('MAIN')
  },

  getAbPackPlans: async (): Promise<PlanDto[]> => {
    return subscriptionApi.getPlans('AB_PACK')
  },

  getOverview: async (): Promise<UserBillingOverviewDto> => {
    const response = await apiClient.get<UserBillingOverviewDto>('/subscription/overview')
    return response.data
  },

  getCabinetBillingStatus: async (cabinetId: number): Promise<CabinetBillingStatusDto> => {
    const response = await apiClient.get<CabinetBillingStatusDto>(
      `/subscription/cabinet/${cabinetId}/status`,
    )
    return response.data
  },

  /** Статус оплаты/тарифов (для скрытия блоков в UI) */
  getStatus: async (): Promise<SubscriptionStatusResponse> => {
    const response = await apiClient.get<SubscriptionStatusResponse>('/subscription/status')
    return response.data
  },

  /**
   * Инициация оплаты.
   * Для MAIN/CAMPAIGN — cabinetIds обязательны; для AB_PACK можно без кабинетов.
   */
  initiatePayment: async (
    planId: number,
    cabinetIds?: number[],
  ): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post<InitiatePaymentResponse>('/subscription/initiate-payment', {
      planId,
      cabinetIds: cabinetIds && cabinetIds.length > 0 ? cabinetIds : undefined,
    })
    return response.data
  },

  /** Статус платежа после возврата с платёжной страницы */
  getPaymentStatus: async (paymentId: number): Promise<PaymentStatusResponse> => {
    const response = await apiClient.get<PaymentStatusResponse>(`/subscription/payment/${paymentId}/status`)
    return response.data
  },

  /**
   * Заявка на тариф свыше 10 кабинетов — письмо на корпоративную почту.
   */
  submitCustomTariffRequest: async (payload: {
    cabinetsCount: number
    telegram?: string
    phone?: string
    message: string
  }): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      '/subscription/custom-tariff-request',
      payload,
    )
    return response.data
  },
}
