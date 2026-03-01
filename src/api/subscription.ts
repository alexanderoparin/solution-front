import apiClient from './client'
import type { PlanDto } from '../types/api'

export const subscriptionApi = {
  getPlans: async (): Promise<PlanDto[]> => {
    const response = await apiClient.get<PlanDto[]>('/subscription/plans')
    return response.data
  },
}
