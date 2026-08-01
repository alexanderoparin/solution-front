import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { accessStatusQueryKey, ACCESS_STATUS_STALE_MS, userApi } from '../api/user'
import { getStoredCabinetId } from '../api/cabinets'
import { useAuthStore } from '../store/authStore'
import { useWorkContextForAdmin } from './useWorkContextForAdmin'

function resolveSellerIdForAccess(role: string | null, userId: number | null): number | undefined {
  if (role === 'USER' && userId != null) {
    return userId
  }
  if (role === 'ADMIN') {
    const raw = localStorage.getItem('analytics_selected_seller_id')
    const parsed = raw ? parseInt(raw, 10) : NaN
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

export function useCampaignManageAccess(overrideSellerId?: number, overrideCabinetId?: number) {
  const role = useAuthStore((s) => s.role)
  const userId = useAuthStore((s) => s.userId)
  const isAdmin = role === 'ADMIN'
  const workContext = useWorkContextForAdmin(isAdmin)

  const sellerId = overrideSellerId ?? resolveSellerIdForAccess(role, userId)
  const cabinetId =
    overrideCabinetId ??
    (isAdmin ? workContext.selectedCabinetId ?? undefined : getStoredCabinetId() ?? undefined)

  const { data: access, isLoading, refetch } = useQuery({
    queryKey: accessStatusQueryKey(sellerId, cabinetId),
    queryFn: () => userApi.getAccessStatus(sellerId, cabinetId),
    staleTime: ACCESS_STATUS_STALE_MS,
  })

  const campaignManage = access?.campaignManage

  const showBadge = useMemo(() => {
    if (role !== 'USER') return false
    if (campaignManage?.status === 'AGENCY' || campaignManage?.status === 'PRO') return false
    return campaignManage?.enabled === true
  }, [role, campaignManage?.enabled, campaignManage?.status])

  return {
    access,
    campaignManage,
    hasCampaignManageAccess: campaignManage?.hasAccess === true,
    showBadge,
    isLoading,
    refetchAccess: refetch,
    sellerId,
    cabinetId,
  }
}
