import apiClient from './client'
import type {
  SummaryResponse,
  MetricGroupResponse,
  ArticleResponse,
  ArticleSummary,
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
  /** Если true — вернуть 0 артикулов (все галочки в фильтре сняты). */
  filterToNone?: boolean
  /** Если true — только артикулы с заполненным фото. */
  onlyWithPhoto?: boolean
}

export const analyticsApi = {
  /**
   * Список артикулов кабинета/продавца — только справочная информация для фильтра (nmId, title, photoTm и т.д.).
   */
  getArticleList: async (sellerId?: number, cabinetId?: number, onlyWithPhoto?: boolean): Promise<ArticleSummary[]> => {
    const params = new URLSearchParams()
    if (sellerId != null) params.set('sellerId', String(sellerId))
    if (cabinetId != null) params.set('cabinetId', String(cabinetId))
    if (onlyWithPhoto === true) params.set('onlyWithPhoto', 'true')
    const query = params.toString()
    const response = await apiClient.get<ArticleSummary[]>(
      `/analytics/articles${query ? `?${query}` : ''}`
    )
    return response.data
  },

  /**
   * Получает сводную аналитику по выбранным артикулам (periods + excludedNmIds).
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
   * Список рекламных кампаний кабинета (статистика за период).
   * dateFrom/dateTo в формате yyyy-MM-dd. По умолчанию на бэкенде — последние 14 дней.
   */
  getCampaigns: async (
    sellerId?: number,
    cabinetId?: number,
    dateFrom?: string,
    dateTo?: string
  ): Promise<Campaign[]> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    if (dateFrom) searchParams.set('dateFrom', dateFrom)
    if (dateTo) searchParams.set('dateTo', dateTo)
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.get<Campaign[]>(`/advertising/campaigns${params}`)
    return response.data
  },

  /**
   * Постановка в очередь обновления РК и статистики за период (те же query, что у списка кампаний).
   */
  enqueuePromotionSync: async (
    sellerId?: number,
    cabinetId?: number,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{ enqueued: boolean }> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    if (dateFrom) searchParams.set('dateFrom', dateFrom)
    if (dateTo) searchParams.set('dateTo', dateTo)
    const query = searchParams.toString()
    const response = await apiClient.post<{ enqueued: boolean }>(
      `/advertising/campaigns/promotion-sync${query ? `?${query}` : ''}`
    )
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

  uploadCampaignNoteFile: async (
    campaignId: number,
    noteId: number,
    file: File,
    sellerId?: number,
    cabinetId?: number
  ): Promise<ArticleNoteFile> => {
    const formData = new FormData()
    formData.append('file', file)
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.post<ArticleNoteFile>(
      `/advertising/campaigns/${campaignId}/notes/${noteId}/files${params}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data
  },

  getCampaignNoteFileBlob: async (
    campaignId: number,
    noteId: number,
    fileId: number,
    sellerId?: number,
    cabinetId?: number
  ): Promise<Blob> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    const response = await apiClient.get(
      `/advertising/campaigns/${campaignId}/notes/${noteId}/files/${fileId}${params}`,
      { responseType: 'blob' }
    )
    return new Blob([response.data])
  },

  downloadCampaignNoteFile: async (
    campaignId: number,
    noteId: number,
    fileId: number,
    fileName: string,
    sellerId?: number,
    cabinetId?: number
  ): Promise<void> => {
    const blob = await analyticsApi.getCampaignNoteFileBlob(campaignId, noteId, fileId, sellerId, cabinetId)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  deleteCampaignNoteFile: async (
    campaignId: number,
    noteId: number,
    fileId: number,
    sellerId?: number,
    cabinetId?: number
  ): Promise<void> => {
    const searchParams = new URLSearchParams()
    if (sellerId != null) searchParams.set('sellerId', String(sellerId))
    if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
    const query = searchParams.toString()
    const params = query ? `?${query}` : ''
    await apiClient.delete(`/advertising/campaigns/${campaignId}/notes/${noteId}/files/${fileId}${params}`)
  },

  /**
   * Получает детальную информацию по артикулу.
   * campaignDateFrom/To — период для метрик РК в блоке «Список РК» (опционально).
   */
  getArticle: async (
    nmId: number,
    periods: Period[],
    sellerId?: number,
    cabinetId?: number,
    campaignDateFrom?: string,
    campaignDateTo?: string
  ): Promise<ArticleResponse> => {
    const body: Record<string, unknown> = { periods, sellerId, cabinetId }
    if (campaignDateFrom != null) body.campaignDateFrom = campaignDateFrom
    if (campaignDateTo != null) body.campaignDateTo = campaignDateTo
    const response = await apiClient.post<ArticleResponse>(`/analytics/article/${nmId}`, body)
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

