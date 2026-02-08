import apiClient from './client'
import type { CabinetDto, CreateCabinetRequest, MessageResponse, UpdateCabinetRequest } from '../types/api'

const CABINET_STORAGE_KEY = 'analytics_selected_cabinet_id'

export const cabinetsApi = {
  list: async (): Promise<CabinetDto[]> => {
    const response = await apiClient.get<CabinetDto[]>('/cabinets')
    return response.data
  },

  getById: async (id: number): Promise<CabinetDto> => {
    const response = await apiClient.get<CabinetDto>(`/cabinets/${id}`)
    return response.data
  },

  create: async (data: CreateCabinetRequest): Promise<CabinetDto> => {
    const response = await apiClient.post<CabinetDto>('/cabinets', data)
    return response.data
  },

  update: async (id: number, data: UpdateCabinetRequest): Promise<CabinetDto> => {
    const response = await apiClient.patch<CabinetDto>(`/cabinets/${id}`, data)
    return response.data
  },

  validateApiKey: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/cabinets/${id}/api-key/validate`)
    return response.data
  },
}

export function getStoredCabinetId(): number | null {
  const saved = localStorage.getItem(CABINET_STORAGE_KEY)
  if (!saved) return null
  const id = parseInt(saved, 10)
  return Number.isNaN(id) ? null : id
}

export function setStoredCabinetId(id: number | null): void {
  if (id == null) {
    localStorage.removeItem(CABINET_STORAGE_KEY)
  } else {
    localStorage.setItem(CABINET_STORAGE_KEY, String(id))
  }
}

export function getStoredCabinetIdForSeller(sellerId: number): number | null {
  const key = `analytics_selected_cabinet_id_${sellerId}`
  const saved = localStorage.getItem(key)
  if (!saved) return null
  const id = parseInt(saved, 10)
  return Number.isNaN(id) ? null : id
}

export function setStoredCabinetIdForSeller(sellerId: number, cabinetId: number | null): void {
  const key = `analytics_selected_cabinet_id_${sellerId}`
  if (cabinetId == null) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, String(cabinetId))
  }
}
