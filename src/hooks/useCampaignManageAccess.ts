import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { accessStatusQueryKey, ACCESS_STATUS_STALE_MS, userApi } from '../api/user'
import { cabinetsApi, getStoredCabinetId } from '../api/cabinets'
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

function isCabinetInOverview(
  cabinetId: number,
  overview: { owned?: { id: number }[]; granted?: { id: number }[] } | undefined,
): boolean {
  if (overview == null) {
    return false
  }
  const ids = [
    ...(overview.owned ?? []).map((c) => Number(c.id)),
    ...(overview.granted ?? []).map((c) => Number(c.id)),
  ]
  return ids.includes(Number(cabinetId))
}

/**
 * Доступ к «Управление РК» и бейдж в шапке.
 * Не меняет глобальный выбор кабинета аналитики — только читает storage.
 */
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

    const stored = getStoredCabinetId()
    if (stored != null && isCabinetInOverview(stored, overview)) {
      return stored
    }

    return overview?.owned?.[0]?.id ?? overview?.granted?.[0]?.id
  }, [overrideCabinetId, isAdmin, workContext.selectedCabinetId, overview])

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
