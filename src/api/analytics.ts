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

  /**
   * Получает детализацию остатков по размерам для товара на конкретном складе.
   */
  getStockSizes: async (nmId: number, warehouseName: string, sellerId?: number): Promise<StockSize[]> => {
    const encodedWarehouseName = encodeURIComponent(warehouseName)
    const params = sellerId ? `?sellerId=${sellerId}` : ''
    const response = await apiClient.get<StockSize[]>(
      `/analytics/article/${nmId}/stocks/${encodedWarehouseName}/sizes${params}`
    )
    return response.data
  },

  /**
   * Получает все заметки для артикула.
   */
  getNotes: async (nmId: number, sellerId?: number): Promise<ArticleNote[]> => {
    const params = sellerId ? `?sellerId=${sellerId}` : ''
    const response = await apiClient.get<ArticleNote[]>(
      `/analytics/article/${nmId}/notes${params}`
    )
    return response.data
  },

  /**
   * Создает новую заметку для артикула.
   */
  createNote: async (nmId: number, request: CreateNoteRequest, sellerId?: number): Promise<ArticleNote> => {
    const params = sellerId ? `?sellerId=${sellerId}` : ''
    const response = await apiClient.post<ArticleNote>(
      `/analytics/article/${nmId}/notes${params}`,
      request
    )
    return response.data
  },

  /**
   * Обновляет заметку.
   */
  updateNote: async (nmId: number, noteId: number, request: UpdateNoteRequest, sellerId?: number): Promise<ArticleNote> => {
    const params = sellerId ? `?sellerId=${sellerId}` : ''
    const response = await apiClient.put<ArticleNote>(
      `/analytics/article/${nmId}/notes/${noteId}${params}`,
      request
    )
    return response.data
  },

  /**
   * Удаляет заметку.
   */
  deleteNote: async (nmId: number, noteId: number, sellerId?: number): Promise<void> => {
    const params = sellerId ? `?sellerId=${sellerId}` : ''
    await apiClient.delete(`/analytics/article/${nmId}/notes/${noteId}${params}`)
  },

  /**
   * Загружает файл для заметки.
   */
  uploadFile: async (nmId: number, noteId: number, file: File, sellerId?: number): Promise<ArticleNoteFile> => {
    const formData = new FormData()
    formData.append('file', file)
    const params = sellerId ? `?sellerId=${sellerId}` : ''
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
   * Скачивает файл заметки.
   */
  downloadFile: async (nmId: number, noteId: number, fileId: number, fileName: string, sellerId?: number): Promise<void> => {
    const params = sellerId ? `?sellerId=${sellerId}` : ''
    const response = await apiClient.get(
      `/analytics/article/${nmId}/notes/${noteId}/files/${fileId}${params}`,
      {
        responseType: 'blob',
      }
    )
    const url = window.URL.createObjectURL(new Blob([response.data]))
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
  deleteFile: async (nmId: number, noteId: number, fileId: number, sellerId?: number): Promise<void> => {
    const params = sellerId ? `?sellerId=${sellerId}` : ''
    await apiClient.delete(`/analytics/article/${nmId}/notes/${noteId}/files/${fileId}${params}`)
  },
}

