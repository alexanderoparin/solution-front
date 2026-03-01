import apiClient from './client'
import { LoginRequest, AuthResponse, ChangePasswordRequest, MessageResponse, RegisterRequest } from '../types/api'

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/register', data)
    return response.data
  },

  changePassword: async (data: ChangePasswordRequest): Promise<MessageResponse> => {
    const response = await apiClient.put<MessageResponse>('/user/password', data)
    return response.data
  },

  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, newPassword: string): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>('/auth/reset-password', { token, newPassword })
    return response.data
  },
}

