import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { accessStatusQueryKey, ACCESS_STATUS_STALE_MS, userApi } from '../api/user'
import { useAuthStore } from '../store/authStore'

function resolveSellerIdForAccess(role: string | null, userId: number | null): number | undefined {
  if (role === 'SELLER' && userId != null) {
    return userId
  }
  if (role === 'ADMIN' || role === 'MANAGER') {
    const raw = localStorage.getItem('analytics_selected_seller_id')
    const parsed = raw ? parseInt(raw, 10) : NaN
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

export function useCampaignManageAccess(overrideSellerId?: number) {
  const role = useAuthStore((s) => s.role)
  const userId = useAuthStore((s) => s.userId)

  const sellerId = overrideSellerId ?? resolveSellerIdForAccess(role, userId)

  const { data: access, isLoading, refetch } = useQuery({
    queryKey: accessStatusQueryKey(sellerId),
    queryFn: () => userApi.getAccessStatus(sellerId),
    staleTime: ACCESS_STATUS_STALE_MS,
  })

  const campaignManage = access?.campaignManage

  const showBadge = useMemo(() => {
    // Подписку на Управление РК оформляет селлер; менеджер/работник наследуют доступ.
    if (role !== 'SELLER') return false
    return campaignManage?.enabled === true
  }, [role, campaignManage?.enabled])

  return {
    access,
    campaignManage,
    hasCampaignManageAccess: campaignManage?.hasAccess === true,
    showBadge,
    isLoading,
    refetchAccess: refetch,
    sellerId,
  }
}
