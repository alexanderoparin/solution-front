import apiClient from './client'
import type {
  SummaryResponse,
  MetricGroupResponse,
  ArticleResponse,
  Period,
  StockSize,
  ArticleNote,
  ArticleNoteFile,
  CreateNoteRequest,
  UpdateNoteRequest,
  Campaign,
  CampaignDetail,
  CampaignNote,
} from '../types/analytics'

export interface SummaryRequest {
  periods: Period[]
  excludedNmIds?: number[]
  sellerId?: number
  cabinetId?: number
  /** Номер страницы (0-based). Вместе с size — пагинация. */
  page?: number
  /** Размер страницы. */
  size?: number
  /** Поиск по названию, nmId, артикулу продавца. */
  search?: string
  /** Если задан — только артикулы с этими nmId (фильтр по чипам). */
  includedNmIds?: number[]
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
   * Список рекламных кампаний кабинета (статистика за последние 30 дней).
   */
  getCampaigns: async (sellerId?: number, cabinetId?: number): Promise<Campaign[]> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.get<Campaign[]>(`/advertising/campaigns${params}`)
    return response.data
  },

  /**
   * Детали комбо-кампании: название, статус, список артикулов.
   */
  getCampaignDetail: async (campaignId: number, sellerId?: number, cabinetId?: number): Promise<CampaignDetail> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.get<CampaignDetail>(`/advertising/campaigns/${campaignId}${params}`)
    return response.data
  },

  /**
   * Заметки по рекламной кампании (РК).
   */
  getCampaignNotes: async (campaignId: number, sellerId?: number, cabinetId?: number): Promise<CampaignNote[]> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.get<CampaignNote[]>(`/advertising/campaigns/${campaignId}/notes${params}`)
    return response.data
  },

  createCampaignNote: async (campaignId: number, request: CreateNoteRequest, sellerId?: number, cabinetId?: number): Promise<CampaignNote> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.post<CampaignNote>(`/advertising/campaigns/${campaignId}/notes${params}`, request)
    return response.data
  },

  updateCampaignNote: async (campaignId: number, noteId: number, request: UpdateNoteRequest, sellerId?: number, cabinetId?: number): Promise<CampaignNote> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.put<CampaignNote>(`/advertising/campaigns/${campaignId}/notes/${noteId}${params}`, request)
    return response.data
  },

  deleteCampaignNote: async (campaignId: number, noteId: number, sellerId?: number, cabinetId?: number): Promise<void> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    await apiClient.delete(`/advertising/campaigns/${campaignId}/notes/${noteId}${params}`)
  },

  /**
   * Получает детальную информацию по артикулу.
   */
  getArticle: async (nmId: number, periods: Period[], sellerId?: number, cabinetId?: number): Promise<ArticleResponse> => {
    const response = await apiClient.post<ArticleResponse>(
      `/analytics/article/${nmId}`,
      { periods, sellerId, cabinetId }
    )
    return response.data
  },

  /**
   * Получает детализацию остатков по размерам для товара на конкретном складе.
   */
  getStockSizes: async (nmId: number, warehouseName: string, sellerId?: number, cabinetId?: number): Promise<StockSize[]> => {
    const encodedWarehouseName = encodeURIComponent(warehouseName)
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.get<StockSize[]>(
      `/analytics/article/${nmId}/stocks/${encodedWarehouseName}/sizes${params}`
    )
    return response.data
  },

  /**
   * Получает все заметки для артикула.
   */
  getNotes: async (nmId: number, sellerId?: number, cabinetId?: number): Promise<ArticleNote[]> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.get<ArticleNote[]>(
      `/analytics/article/${nmId}/notes${params}`
    )
    return response.data
  },

  /**
   * Создает новую заметку для артикула.
   */
  createNote: async (nmId: number, request: CreateNoteRequest, sellerId?: number, cabinetId?: number): Promise<ArticleNote> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.post<ArticleNote>(
      `/analytics/article/${nmId}/notes${params}`,
      request
    )
    return response.data
  },

  /**
   * Обновляет заметку.
   */
  updateNote: async (nmId: number, noteId: number, request: UpdateNoteRequest, sellerId?: number, cabinetId?: number): Promise<ArticleNote> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.put<ArticleNote>(
      `/analytics/article/${nmId}/notes/${noteId}${params}`,
      request
    )
    return response.data
  },

  /**
   * Удаляет заметку.
   */
  deleteNote: async (nmId: number, noteId: number, sellerId?: number, cabinetId?: number): Promise<void> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    await apiClient.delete(`/analytics/article/${nmId}/notes/${noteId}${params}`)
  },

  /**
   * Загружает файл для заметки.
   */
  uploadFile: async (nmId: number, noteId: number, file: File, sellerId?: number, cabinetId?: number): Promise<ArticleNoteFile> => {
    const formData = new FormData()
    formData.append('file', file)
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.post<ArticleNoteFile>(
      `/analytics/article/${nmId}/notes/${noteId}/files${params}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Получает файл как blob (для просмотра изображений).
   */
  getFileBlob: async (nmId: number, noteId: number, fileId: number, sellerId?: number, cabinetId?: number): Promise<Blob> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.get(
      `/analytics/article/${nmId}/notes/${noteId}/files/${fileId}${params}`,
      {
        responseType: 'blob',
      }
    )
    return new Blob([response.data])
  },

  /**
   * Скачивает файл заметки.
   */
  downloadFile: async (nmId: number, noteId: number, fileId: number, fileName: string, sellerId?: number, cabinetId?: number): Promise<void> => {
    const blob = await analyticsApi.getFileBlob(nmId, noteId, fileId, sellerId, cabinetId)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  /**
   * Удаляет файл заметки.
   */
  deleteFile: async (nmId: number, noteId: number, fileId: number, sellerId?: number, cabinetId?: number): Promise<void> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    await apiClient.delete(`/analytics/article/${nmId}/notes/${noteId}/files/${fileId}${params}`)
  },
}

