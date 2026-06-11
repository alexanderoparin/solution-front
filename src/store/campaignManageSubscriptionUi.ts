import { create } from 'zustand'

interface CampaignManageSubscriptionUiState {
  plansOpen: boolean
  paywallOpen: boolean
  openPlans: () => void
  openPaywall: () => void
  closePlans: () => void
  closePaywall: () => void
}

export const useCampaignManageSubscriptionUi = create<CampaignManageSubscriptionUiState>((set) => ({
  plansOpen: false,
  paywallOpen: false,
  openPlans: () => set({ plansOpen: true, paywallOpen: false }),
  openPaywall: () => set({ paywallOpen: true }),
  closePlans: () => set({ plansOpen: false }),
  closePaywall: () => set({ paywallOpen: false }),
}))
