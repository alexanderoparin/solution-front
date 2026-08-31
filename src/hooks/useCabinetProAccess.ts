import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '../api/subscription'
import { userApi } from '../api/user'
import { cabinetsApi } from '../api/cabinets'
import { useAuthStore } from '../store/authStore'
import type { ProfileSubscriptionSummary } from '../types/api'

function isProfilePromoActive(subscription: ProfileSubscriptionSummary | null | undefined): boolean {
  if (!subscription) return false
  if (subscription.promoCode) return true
  return subscription.planCode === 'pro_month'
    && subscription.active
    && Boolean(subscription.expiresAt)
}

function isBillingPro(billing: Awaited<ReturnType<typeof subscriptionApi.getCabinetBillingStatus>> | undefined): boolean {
  if (!billing?.mainTariff) return false
  const t = billing.mainTariff
  return Boolean(
    t.unlimitedAccess
    || t.status === 'PROMO'
    || t.status === 'AGENCY'
    || t.code === 'pro_month',
  )
}

/**
 * PRO / промокод для выбранного кабинета: billing API + промо владельца из профиля.
 * Промо user-level действует только на собственные кабинеты пользователя.
 */
export function useCabinetProAccess(cabinetId: number | null | undefined) {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'ADMIN'

  const { data: billing, isPending: billingPending, isFetching: billingFetching } = useQuery({
    queryKey: ['cabinetBilling', cabinetId],
    queryFn: () => subscriptionApi.getCabinetBillingStatus(cabinetId!),
    enabled: cabinetId != null,
    staleTime: 0,
  })

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userApi.getProfile(),
    enabled: !isAdmin,
    staleTime: 60_000,
  })

  const { data: overview } = useQuery({
    queryKey: ['cabinetsOverview'],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: !isAdmin && cabinetId != null,
    staleTime: 30_000,
  })

  const isOwnCabinet = useMemo(() => {
    if (isAdmin || cabinetId == null) return false
    return (overview?.owned ?? []).some((c) => Number(c.id) === Number(cabinetId))
  }, [isAdmin, cabinetId, overview?.owned])

  const profilePromoActive = isOwnCabinet && isProfilePromoActive(profile?.subscription)

  const onPro = isAdmin || isBillingPro(billing) || profilePromoActive

  const abServiceReady = onPro || Boolean(billing?.abTestQuota?.unlimited || billing?.abTestQuota?.activated)

  const campaignManageReady = onPro
    || Boolean(billing?.services?.some(
      (s) => s.serviceCode === 'CAMPAIGN_MANAGE' && (s.connected || s.status === 'INCLUDED'),
    ))

  return {
    billing,
    onPro,
    abServiceReady,
    campaignManageReady,
    profilePromoActive,
    isOwnCabinet,
    isLoading: cabinetId != null && (billingPending || billingFetching),
  }
}
