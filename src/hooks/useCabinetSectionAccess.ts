import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
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
 * Если в localStorage лежит чужой/устаревший cabinetId — подставляет первый доступный.
 */
export function useCabinetSectionAccess(selectedCabinetId?: number | null) {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'ADMIN'

  const [storedCabinetId, setStoredCabinetIdState] = useState<number | null>(() => getStoredCabinetId())
  const cabinetId = selectedCabinetId ?? storedCabinetId

  const { data, isFetched, isError } = useQuery({
    queryKey: ['cabinetsOverview', ''],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: !isAdmin,
    staleTime: 60_000,
  })

  const accessibleCabinetIds = useMemo(() => {
    if (data == null) {
      return null
    }
    const ids = new Set<number>()
    for (const c of data.owned ?? []) {
      ids.add(c.id)
    }
    for (const c of data.granted ?? []) {
      ids.add(c.id)
    }
    return ids
  }, [data])

  /** Нужно поправить выбор: чужой id в storage или пусто при наличии доступных кабинетов. */
  const needsCabinetFix =
    !isAdmin
    && accessibleCabinetIds != null
    && (
      (accessibleCabinetIds.size > 0 && (cabinetId == null || !accessibleCabinetIds.has(cabinetId)))
      || (accessibleCabinetIds.size === 0 && cabinetId != null)
    )

  useEffect(() => {
    if (!needsCabinetFix || data == null) {
      return
    }
    const fallback = data.owned?.[0]?.id ?? data.granted?.[0]?.id ?? null
    setStoredCabinetId(fallback)
    setStoredCabinetIdState(fallback)
  }, [needsCabinetFix, data])

  /** Готовность: админ сразу; иначе — после overview и после автопочинки cabinetId. */
  const isReady = isAdmin || isError || (isFetched && !needsCabinetFix)

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
      return new Set(grant.sections ?? [])
    }

    // Кабинетов ещё нет / кабинет не выбран — не блокируем заранее
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
