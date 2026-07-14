import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cabinetsApi, getStoredCabinetId } from '../api/cabinets'
import type { CabinetAccessSection } from '../types/api'
import { useAuthStore } from '../store/authStore'

const ALL_SECTIONS: CabinetAccessSection[] = [
  'PRODUCTS',
  'SUMMARY',
  'AD_CAMPAIGNS',
  'CAMPAIGN_MANAGE',
]

/**
 * Разрешённые разделы для выбранного кабинета (владелец / ADMIN — все).
 */
export function useCabinetSectionAccess(selectedCabinetId?: number | null) {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'ADMIN'

  const cabinetId = selectedCabinetId ?? getStoredCabinetId()

  const { data, isFetched, isError } = useQuery({
    queryKey: ['cabinetsOverview', ''],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: !isAdmin,
    staleTime: 60_000,
  })

  /** Готовность проверить доступ: админ сразу, остальные — после overview. */
  const isReady = isAdmin || isFetched || isError

  const sections = useMemo(() => {
    if (isAdmin) {
      return new Set(ALL_SECTIONS)
    }

    if (!isReady || data == null) {
      return new Set(ALL_SECTIONS)
    }

    const ownedIds = new Set((data.owned ?? []).map((c) => c.id))
    const granted = data.granted ?? []

    if (cabinetId != null && ownedIds.has(cabinetId)) {
      return new Set(ALL_SECTIONS)
    }

    const grant = cabinetId != null ? granted.find((g) => g.id === cabinetId) : undefined
    if (grant) {
      return new Set(grant.sections)
    }

    // Кабинет ещё не выбран — не блокируем заранее
    if (cabinetId == null) {
      return new Set(ALL_SECTIONS)
    }

    return new Set<CabinetAccessSection>()
  }, [isAdmin, isReady, cabinetId, data])

  const hasSection = useCallback(
    (section: CabinetAccessSection) => sections.has(section),
    [sections],
  )

  return { cabinetId, sections, hasSection, isReady }
}
