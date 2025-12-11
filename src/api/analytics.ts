import apiClient from './client'
import type {
  SummaryResponse,
  MetricGroupResponse,
  ArticleResponse,
  Period,
} from '../types/analytics'

export interface SummaryRequest {
  periods: Period[]
  excludedNmIds?: number[]
  sellerId?: number
}

export const analyticsApi = {
  /**
   * Получает сводную аналитику.
   */
  getSummary: async (request: SummaryRequest): Promise<SummaryResponse> => {
    const response = await apiClient.post<SummaryResponse>('/analytics/summary', request)
    return response.data
  },

  /**
   * Получает детальные метрики по группе.
   */
  getMetricGroup: async (
    metricName: string,
    request: SummaryRequest
  ): Promise<MetricGroupResponse> => {
    const encodedMetricName = encodeURIComponent(metricName)
    const response = await apiClient.post<MetricGroupResponse>(
      `/analytics/summary/metrics/${encodedMetricName}`,
      request
    )
    return response.data
  },

  /**
   * Получает детальную информацию по артикулу.
   */
  getArticle: async (nmId: number, periods: Period[], sellerId?: number): Promise<ArticleResponse> => {
    const response = await apiClient.post<ArticleResponse>(
      `/analytics/article/${nmId}`,
      { periods, sellerId }
    )
    return response.data
  },
}

