import apiClient from './client'
import type { Hypothesis, HypothesisUpsertRequest, HypothesisVerdict } from '../types/hypothesis'

function buildParams(
  sellerId?: number,
  cabinetId?: number,
  extra?: Record<string, string | number | undefined | null>,
): string {
  const searchParams = new URLSearchParams()
  if (sellerId != null) searchParams.set('sellerId', String(sellerId))
  if (cabinetId != null) searchParams.set('cabinetId', String(cabinetId))
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      if (value != null && value !== '') searchParams.set(key, String(value))
    })
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const hypothesisApi = {
  list: async (
    sellerId?: number,
    cabinetId?: number,
    filters?: {
      search?: string
      status?: string
      nmId?: number
      criterion?: string
      periodFrom?: string
      periodTo?: string
    },
  ): Promise<Hypothesis[]> => {
    const response = await apiClient.get<Hypothesis[]>(
      `/analytics/hypotheses${buildParams(sellerId, cabinetId, filters)}`,
    )
    return response.data
  },

  resolveCabinet: async (
    id: number,
  ): Promise<{ cabinetId: number; sellerId: number; cabinetName?: string | null }> => {
    const response = await apiClient.get<{ cabinetId: number; sellerId: number; cabinetName?: string | null }>(
      `/analytics/hypotheses/${id}/cabinet`,
    )
    return response.data
  },

  get: async (id: number, sellerId?: number, cabinetId?: number): Promise<Hypothesis> => {
    const response = await apiClient.get<Hypothesis>(
      `/analytics/hypotheses/${id}${buildParams(sellerId, cabinetId)}`,
    )
    return response.data
  },

  create: async (
    request: HypothesisUpsertRequest,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<Hypothesis> => {
    const response = await apiClient.post<Hypothesis>(
      `/analytics/hypotheses${buildParams(sellerId, cabinetId)}`,
      request,
    )
    return response.data
  },

  update: async (
    id: number,
    request: HypothesisUpsertRequest,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<Hypothesis> => {
    const response = await apiClient.put<Hypothesis>(
      `/analytics/hypotheses/${id}${buildParams(sellerId, cabinetId)}`,
      request,
    )
    return response.data
  },

  setVerdict: async (
    id: number,
    verdict: HypothesisVerdict,
    sellerId?: number,
    cabinetId?: number,
  ): Promise<Hypothesis> => {
    const response = await apiClient.patch<Hypothesis>(
      `/analytics/hypotheses/${id}/verdict${buildParams(sellerId, cabinetId)}`,
      { verdict },
    )
    return response.data
  },

  delete: async (id: number, sellerId?: number, cabinetId?: number): Promise<void> => {
    await apiClient.delete(`/analytics/hypotheses/${id}${buildParams(sellerId, cabinetId)}`)
  },

  bulkDelete: async (
    ids: number[],
    sellerId?: number,
    cabinetId?: number,
  ): Promise<{ deleted: number }> => {
    const response = await apiClient.post<{ deleted: number }>(
      `/analytics/hypotheses/bulk-delete${buildParams(sellerId, cabinetId)}`,
      { ids },
    )
    return response.data
  },
}
