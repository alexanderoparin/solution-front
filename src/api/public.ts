import apiClient from './client'
import type { MessageResponse } from '../types/api'

export interface LandingContactRequestPayload {
  name: string
  telegram: string
  agreeToPrivacy: boolean
}

export const publicApi = {
  submitCabinetAuditRequest: async (payload: LandingContactRequestPayload): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/public/cabinet-audit-request', payload)
    return response.data
  },

  submitAgencyConsultationRequest: async (payload: LandingContactRequestPayload): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/public/agency-consultation-request', payload)
    return response.data
  },
}
