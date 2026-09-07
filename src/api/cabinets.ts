import apiClient from './client'
import type {
  CabinetAccessEntryDto,
  CabinetDto,
  CabinetsOverviewDto,
  CreateCabinetRequest,
  GrantCabinetAccessRequest,
  MessageResponse,
  UpdateCabinetAccessValidUntilRequest,
  UpdateCabinetAccessSectionsRequest,
  UpdateCabinetRequest,
} from '../types/api'

export {
  CABINET_ID_CHANGED_EVENT,
  getStoredCabinetId,
  setStoredCabinetId,
  subscribeStoredCabinetId,
  getStoredCabinetIdForSeller,
  setStoredCabinetIdForSeller,
} from './cabinetSelection'

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

  triggerDataUpdate: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/cabinets/${id}/update-data`)
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

  validateOzonPerformance: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/cabinets/${id}/ozon-performance/validate`)
    return response.data
  },

  delete: async (id: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/cabinets/${id}`)
    return response.data
  },

  getOverview: async (search?: string): Promise<CabinetsOverviewDto> => {
    const response = await apiClient.get<CabinetsOverviewDto>('/cabinets/overview', {
      params: search?.trim() ? { search: search.trim() } : undefined,
    })
    return response.data
  },

  listAccess: async (cabinetId: number): Promise<CabinetAccessEntryDto[]> => {
    const response = await apiClient.get<CabinetAccessEntryDto[]>(`/cabinets/${cabinetId}/access`)
    return response.data
  },

  grantAccess: async (cabinetId: number, body: GrantCabinetAccessRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(`/cabinets/${cabinetId}/access`, body)
    return response.data
  },

  revokeGrant: async (cabinetId: number, grantId: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(`/cabinets/${cabinetId}/access/grants/${grantId}`)
    return response.data
  },

  updateGrantValidUntil: async (
    cabinetId: number,
    grantId: number,
    body: UpdateCabinetAccessValidUntilRequest,
  ): Promise<MessageResponse> => {
    const response = await apiClient.patch<MessageResponse>(
      `/cabinets/${cabinetId}/access/grants/${grantId}`,
      body,
    )
    return response.data
  },

  updateInvitationValidUntil: async (
    cabinetId: number,
    invitationId: number,
    body: UpdateCabinetAccessValidUntilRequest,
  ): Promise<MessageResponse> => {
    const response = await apiClient.patch<MessageResponse>(
      `/cabinets/${cabinetId}/access/invitations/${invitationId}`,
      body,
    )
    return response.data
  },

  updateGrantSections: async (
    cabinetId: number,
    grantId: number,
    body: UpdateCabinetAccessSectionsRequest,
  ): Promise<MessageResponse> => {
    const response = await apiClient.patch<MessageResponse>(
      `/cabinets/${cabinetId}/access/grants/${grantId}/sections`,
      body,
    )
    return response.data
  },

  updateInvitationSections: async (
    cabinetId: number,
    invitationId: number,
    body: UpdateCabinetAccessSectionsRequest,
  ): Promise<MessageResponse> => {
    const response = await apiClient.patch<MessageResponse>(
      `/cabinets/${cabinetId}/access/invitations/${invitationId}/sections`,
      body,
    )
    return response.data
  },

  revokeInvitation: async (cabinetId: number, invitationId: number): Promise<MessageResponse> => {
    const response = await apiClient.delete<MessageResponse>(
      `/cabinets/${cabinetId}/access/invitations/${invitationId}`,
    )
    return response.data
  },

  resendInvitation: async (cabinetId: number, invitationId: number): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      `/cabinets/${cabinetId}/access/invitations/${invitationId}/resend`,
    )
    return response.data
  },

  reinviteFromGrant: async (cabinetId: number, grantId: number): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      `/cabinets/${cabinetId}/access/grants/${grantId}/reinvite`,
    )
    return response.data
  },
}
