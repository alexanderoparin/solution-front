import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useWorkContextForAdmin } from './useWorkContextForAdmin'
import { cabinetsApi } from '../api/cabinets'
import { useStoredCabinet } from './useStoredCabinet'
import { normalizeCurrencyCode } from '../utils/money'

/**
 * Валюта текущего (или переданного) кабинета — ISO 4217 для подписей денежных сумм.
 */
export function useCabinetCurrency(overrideCabinetId?: number | null): string {
  const role = useAuthStore((state) => state.role)
  const isAdmin = role === 'ADMIN'
  const workContext = useWorkContextForAdmin(isAdmin)

  const { data: myCabinets = [] } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'USER',
  })
  const { cabinetId: sellerCabinetId } = useStoredCabinet(myCabinets)

  const cabinetId =
    overrideCabinetId ??
    (isAdmin ? workContext.selectedCabinetId : sellerCabinetId) ??
    null

  return useMemo(() => {
    if (cabinetId == null) {
      return 'RUB'
    }
    if (isAdmin) {
      const row = workContext.workContextOptions.find((o) => o.cabinetId === cabinetId)
      return normalizeCurrencyCode(row?.currency)
    }
    const mine = myCabinets.find((c) => c.id === cabinetId)
    return normalizeCurrencyCode(mine?.currency)
  }, [cabinetId, isAdmin, workContext.workContextOptions, myCabinets])
}
