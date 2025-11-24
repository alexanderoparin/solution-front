import apiClient from './client'
import { LoginRequest, AuthResponse, ChangePasswordRequest, MessageResponse } from '../types/api'

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  changePassword: async (data: ChangePasswordRequest): Promise<MessageResponse> => {
    const response = await apiClient.put<MessageResponse>('/user/password', data)
    return response.data
  },
}

