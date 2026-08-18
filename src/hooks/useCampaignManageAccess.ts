import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { accessStatusQueryKey, ACCESS_STATUS_STALE_MS, userApi } from '../api/user'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
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

  const { data: overview, isPending: overviewPending } = useQuery({
    queryKey: ['cabinetsOverview'],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: !isAdmin && overrideCabinetId == null,
    staleTime: 30_000,
  })

  const cabinetId = useMemo(() => {
    if (overrideCabinetId != null) {
      return overrideCabinetId
    }
    if (isAdmin) {
      return workContext.selectedCabinetId ?? undefined
    }
    const ownedIds = (overview?.owned ?? []).map((c) => c.id)
    const stored = getStoredCabinetId()
    if (stored != null && ownedIds.includes(stored)) {
      return stored
    }
    return ownedIds[0]
  }, [overrideCabinetId, isAdmin, workContext.selectedCabinetId, overview])

  useEffect(() => {
    if (isAdmin || overrideCabinetId != null || cabinetId == null) {
      return
    }
    if (getStoredCabinetId() !== cabinetId) {
      setStoredCabinetId(cabinetId)
    }
  }, [isAdmin, overrideCabinetId, cabinetId])

  const accessEnabled = isAdmin || overrideCabinetId != null || cabinetId != null || overview !== undefined

  const { data: access, isLoading: accessLoading, refetch } = useQuery({
    queryKey: accessStatusQueryKey(sellerId, cabinetId),
    queryFn: () => userApi.getAccessStatus(sellerId, cabinetId),
    enabled: accessEnabled,
    staleTime: ACCESS_STATUS_STALE_MS,
  })

  const campaignManage = access?.campaignManage
  const cabinetsLoading = !isAdmin && overrideCabinetId == null && overviewPending

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
    isLoading: cabinetsLoading || accessLoading,
    refetchAccess: refetch,
    sellerId,
    cabinetId,
  }
}
