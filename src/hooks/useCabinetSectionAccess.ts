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
 * Выбор кабинета не меняет — только проверяет доступ к разделу.
 */
export function useCabinetSectionAccess(selectedCabinetId?: number | null) {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'ADMIN'

  const cabinetId = selectedCabinetId ?? getStoredCabinetId()
  const normalizedCabinetId = cabinetId != null ? Number(cabinetId) : null

  const { data, isFetched, isError } = useQuery({
    queryKey: ['cabinetsOverview', ''],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: !isAdmin,
    staleTime: 60_000,
  })

  /** Готовность: админ сразу; иначе — после overview. */
  const isReady = isAdmin || isError || isFetched

  const sections = useMemo(() => {
    if (isAdmin) {
      return new Set(ALL_SECTIONS)
    }

    if (!isReady || data == null) {
      return new Set(ALL_SECTIONS)
    }

    const ownedIds = new Set((data.owned ?? []).map((c) => Number(c.id)))
    const granted = data.granted ?? []

    if (normalizedCabinetId != null && ownedIds.has(normalizedCabinetId)) {
      return new Set(ALL_SECTIONS)
    }

    const grant =
      normalizedCabinetId != null
        ? granted.find((g) => Number(g.id) === normalizedCabinetId)
        : undefined
    if (grant) {
      return new Set(grant.sections ?? [])
    }

    if (normalizedCabinetId == null) {
      return new Set(ALL_SECTIONS)
    }

    return new Set<CabinetAccessSection>()
  }, [isAdmin, isReady, normalizedCabinetId, data])

  const hasSection = useCallback(
    (section: CabinetAccessSection) => sections.has(section),
    [sections],
  )

  return { cabinetId: normalizedCabinetId, sections, hasSection, isReady }
}
