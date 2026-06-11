import { useCallback } from 'react'
import { useCampaignManageAccess } from './useCampaignManageAccess'
import { useCampaignManageSubscriptionUi } from '../store/campaignManageSubscriptionUi'

export function useCampaignManagePaywall(overrideSellerId?: number) {
  const { hasCampaignManageAccess, isLoading } = useCampaignManageAccess(overrideSellerId)
  const openPaywall = useCampaignManageSubscriptionUi((s) => s.openPaywall)

  const guardAction = useCallback(
    (action: () => void) => {
      if (hasCampaignManageAccess) {
        action()
      } else {
        openPaywall()
      }
    },
    [hasCampaignManageAccess, openPaywall],
  )

  const guardClick = useCallback(
    (e: React.MouseEvent) => {
      if (!hasCampaignManageAccess) {
        e.preventDefault()
        e.stopPropagation()
        openPaywall()
      }
    },
    [hasCampaignManageAccess, openPaywall],
  )

  return {
    hasCampaignManageAccess,
    isAccessLoading: isLoading,
    guardAction,
    guardClick,
    openPaywall,
  }
}
