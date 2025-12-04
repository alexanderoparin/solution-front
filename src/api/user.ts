import apiClient from './client'
import { UserProfileResponse, UpdateApiKeyRequest, MessageResponse } from '../types/api'

export const userApi = {
  getProfile: async (): Promise<UserProfileResponse> => {
    const response = await apiClient.get<UserProfileResponse>('/user/profile')
    return response.data
  },

  updateApiKey: async (data: UpdateApiKeyRequest): Promise<MessageResponse> => {
    const response = await apiClient.put<MessageResponse>('/user/api-key', data)
    return response.data
  },

  validateApiKey: async (): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/user/api-key/validate')
    return response.data
  },
}

