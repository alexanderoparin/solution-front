import apiClient from './client'
import type {
  CampaignAutoBudgetSettings,
  CampaignChangeLogEntry,
  CampaignManageData,
  CampaignScheduleSlot,
  BalanceSourcesResponse,
  BalanceRefreshResponse,
  CampaignBudgetChartData,
  CampaignSlotRepeatMode,
} from '../types/analytics'
import type { CampaignControlEnqueueResponse } from './analytics'

function buildParams(sellerId?: number, cabinetId?: number): string {
  const searchParams = new URLSearchParams()
  if (sellerId != null) searchParams.set('sellerId', String(sellerId))
  if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export interface CampaignAutoBudgetRequest {
  enabled: boolean
  topUpAmount?: number | null
  sourceType?: number | null
  thresholdRub?: number | null
  maxTopUpsPerDay?: number | null
}

export interface CampaignScheduleSlotRequest {
  dayOfWeek: number
  startTime: string
  endTime: string
  budgetRub: number
  repeat: boolean
  repeatMode?: CampaignSlotRepeatMode
}

export interface CampaignScheduleSlotUpdate {
  startTime?: string
  endTime?: string
  budgetRub?: number
}

export interface ChangeLogPage {
  content: CampaignChangeLogEntry[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const campaignManageApi = {
  getManage: async (advertId: number, sellerId?: number, cabinetId?: number): Promise<CampaignManageData> => {
    const response = await apiClient.get<CampaignManageData>(
      `/advertising/campaigns/${advertId}/manage${buildParams(sellerId, cabinetId)}`,
    )
    return response.data
  },

  getBalanceSources: async (
    advertId: number,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<BalanceSourcesResponse> => {
    const response = await apiClient.get<BalanceSourcesResponse>(
      `/advertising/campaigns/${advertId}/manage/balance-sources${buildParams(sellerId, cabinetId)}`,
    )
    return response.data
  },

  refreshBalanceSources: async (
    advertId: number,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<BalanceRefreshResponse> => {
    const response = await apiClient.post<BalanceRefreshResponse>(
      `/advertising/campaigns/${advertId}/manage/balance-sources/refresh${buildParams(sellerId, cabinetId)}`,
    )
    return response.data
  },

  getBudgetChart: async (
    advertId: number,
    sellerId?: number,
    cabinetId?: number,
    period?: { from: string; to: string },
  ): Promise<CampaignBudgetChartData> => {
    const params = new URLSearchParams(buildParams(sellerId, cabinetId).replace('?', ''))
    if (period != null) {
      params.set('from', period.from)
      params.set('to', period.to)
    } else {
      params.set('hours', '48')
    }
    params.set('stepHours', '0')
    const response = await apiClient.get<CampaignBudgetChartData>(
      `/advertising/campaigns/${advertId}/manage/budget-chart?${params.toString()}`,
    )
    return response.data
  },

  saveAutoBudget: async (
    advertId: number,
    body: CampaignAutoBudgetRequest,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<CampaignAutoBudgetSettings> => {
    const response = await apiClient.put<CampaignAutoBudgetSettings>(
      `/advertising/campaigns/${advertId}/manage/auto-budget${buildParams(sellerId, cabinetId)}`,
      body,
    )
    return response.data
  },

  unlockAutoBudget: async (
    advertId: number,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<CampaignAutoBudgetSettings> => {
    const response = await apiClient.post<CampaignAutoBudgetSettings>(
      `/advertising/campaigns/${advertId}/manage/auto-budget/unlock${buildParams(sellerId, cabinetId)}`,
    )
    return response.data
  },

  createSlots: async (
    advertId: number,
    body: CampaignScheduleSlotRequest,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<CampaignScheduleSlot[]> => {
    const response = await apiClient.post<CampaignScheduleSlot[]>(
      `/advertising/campaigns/${advertId}/manage/slots${buildParams(sellerId, cabinetId)}`,
      body,
    )
    return response.data
  },

  updateSlot: async (
    advertId: number,
    slotId: number,
    body: CampaignScheduleSlotUpdate,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<CampaignScheduleSlot> => {
    const response = await apiClient.put<CampaignScheduleSlot>(
      `/advertising/campaigns/${advertId}/manage/slots/${slotId}${buildParams(sellerId, cabinetId)}`,
      body,
    )
    return response.data
  },

  deleteSlot: async (advertId: number, slotId: number, sellerId?: number, cabinetId?: number): Promise<void> => {
    await apiClient.delete(
      `/advertising/campaigns/${advertId}/manage/slots/${slotId}${buildParams(sellerId, cabinetId)}`,
    )
  },

  start: async (
    advertId: number,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<CampaignControlEnqueueResponse> => {
    const response = await apiClient.post<CampaignControlEnqueueResponse>(
      `/advertising/campaigns/${advertId}/manage/start${buildParams(sellerId, cabinetId)}`,
    )
    return response.data
  },

  pause: async (
    advertId: number,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<CampaignControlEnqueueResponse> => {
    const response = await apiClient.post<CampaignControlEnqueueResponse>(
      `/advertising/campaigns/${advertId}/manage/pause${buildParams(sellerId, cabinetId)}`,
    )
    return response.data
  },

  /**
   * Сохраняет текст «Цель на рекламную кампанию».
   */
  updateCampaignGoal: async (
    advertId: number,
    goal: string,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<void> => {
    await apiClient.put(
      `/advertising/campaigns/${advertId}/manage/campaign-goal${buildParams(sellerId, cabinetId)}`,
      { goal },
    )
  },

  getChangeLog: async (
    advertId: number,
    page: number,
    size: number,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<ChangeLogPage> => {
    const params = new URLSearchParams(buildParams(sellerId, cabinetId).replace('?', ''))
    params.set('page', String(page))
    params.set('size', String(size))
    const q = params.toString()
    const response = await apiClient.get<ChangeLogPage>(
      `/advertising/campaigns/${advertId}/manage/change-log?${q}`,
    )
    return response.data
  },
}
