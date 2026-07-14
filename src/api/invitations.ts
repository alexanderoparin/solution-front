import apiClient from './client'
import type { CabinetInvitationPreviewDto } from '../types/api'

export const invitationsApi = {
  preview: async (token: string): Promise<CabinetInvitationPreviewDto> => {
    const response = await apiClient.get<CabinetInvitationPreviewDto>(`/public/invitations/${token}`)
    return response.data
  },

  accept: async (token: string): Promise<CabinetInvitationPreviewDto> => {
    const response = await apiClient.post<CabinetInvitationPreviewDto>(`/public/invitations/${token}/accept`)
    return response.data
  },

  decline: async (token: string): Promise<void> => {
    await apiClient.post(`/public/invitations/${token}/decline`)
  },
}
