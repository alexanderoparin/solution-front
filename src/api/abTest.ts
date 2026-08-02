import apiClient from './client'
import type { AbTest, AbTestStatus, CreateAbTestRequest, UpdateAbTestSettingsRequest } from '../types/abTest'

function buildParams(sellerId?: number, cabinetId?: number, extra?: Record<string, string | boolean>): string {
  const searchParams = new URLSearchParams()
  if (sellerId != null) searchParams.set('sellerId', String(sellerId))
  if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      searchParams.set(key, String(value))
    })
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const abTestApi = {
  list: async (sellerId?: number, cabinetId?: number, activeOnly = false): Promise<AbTest[]> => {
    const response = await apiClient.get<AbTest[]>(
      `/advertising/ab-tests${buildParams(sellerId, cabinetId, { activeOnly })}`,
    )
    return response.data
  },

  get: async (id: number, sellerId?: number, cabinetId?: number): Promise<AbTest> => {
    const response = await apiClient.get<AbTest>(
      `/advertising/ab-tests/${id}${buildParams(sellerId, cabinetId)}`,
    )
    return response.data
  },

  create: async (
    request: CreateAbTestRequest,
    files: File[],
    sellerId?: number,
    cabinetId?: number,
  ): Promise<AbTest> => {
    const form = new FormData()
    form.append(
      'request',
      new Blob([JSON.stringify(request)], { type: 'application/json' }),
    )
    files.forEach((file) => form.append('files', file))
    const response = await apiClient.post<AbTest>(
      `/advertising/ab-tests${buildParams(sellerId, cabinetId)}`,
      form,
    )
    return response.data
  },
  updateStatus: async (
    id: number,
    status: AbTestStatus,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<AbTest> => {
    const response = await apiClient.patch<AbTest>(
      `/advertising/ab-tests/${id}/status${buildParams(sellerId, cabinetId)}`,
      { status },
    )
    return response.data
  },

  updateSettings: async (
    id: number,
    request: UpdateAbTestSettingsRequest,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<AbTest> => {
    const response = await apiClient.patch<AbTest>(
      `/advertising/ab-tests/${id}/settings${buildParams(sellerId, cabinetId)}`,
      request,
    )
    return response.data
  },

  getVariantImageBlob: async (
    testId: number,
    variantId: number,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<Blob> => {
    const response = await apiClient.get<Blob>(
      `/advertising/ab-tests/${testId}/variants/${variantId}/image${buildParams(sellerId, cabinetId)}`,
      { responseType: 'blob' },
    )
    return response.data
  },

  setVariantPaused: async (
    testId: number,
    variantId: number,
    paused: boolean,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<AbTest> => {
    const response = await apiClient.patch<AbTest>(
      `/advertising/ab-tests/${testId}/variants/${variantId}/pause${buildParams(sellerId, cabinetId)}`,
      { paused },
    )
    return response.data
  },
}
