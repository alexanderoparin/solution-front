import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId, subscribeStoredCabinetId } from '../api/cabinets'
import type { CabinetAccessSection, MarketplaceType } from '../types/api'
import { useAuthStore } from '../store/authStore'

const ALL_SECTIONS: CabinetAccessSection[] = [
  'PRODUCTS',
  'SUMMARY',
  'AD_CAMPAIGNS',
  'CAMPAIGN_MANAGE',
]

/** Кабинет для селектора шапки (свои + выданные). */
export interface CabinetSectionAccessOption {
  id: number
  name: string
  marketplaceType?: MarketplaceType
}

function overviewCabinetOptions(data: {
  owned?: { id: number; name: string; marketplaceType?: MarketplaceType }[]
  granted?: { id: number; name: string; marketplaceType?: MarketplaceType }[]
} | undefined): CabinetSectionAccessOption[] {
  if (data == null) {
    return []
  }
  const seen = new Set<number>()
  const list: CabinetSectionAccessOption[] = []
  for (const row of [...(data.owned ?? []), ...(data.granted ?? [])]) {
    const id = Number(row.id)
    if (seen.has(id)) {
      continue
    }
    seen.add(id)
    list.push({ id, name: row.name, marketplaceType: row.marketplaceType })
  }
  return list
}

function isCabinetInOptions(
  cabinetId: number | null,
  cabinets: readonly CabinetSectionAccessOption[],
): boolean {
  if (cabinetId == null) {
    return false
  }
  return cabinets.some((c) => c.id === Number(cabinetId))
}

/**
 * Разрешённые разделы для выбранного кабинета (владелец / ADMIN — все).
 * Если сохранённый id не входит в owned/granted — берём первый доступный,
 * как {@link useStoredCabinet} / {@link useCampaignManageAccess}: иначе страница
 * не монтируется, селектор не появляется, пользователь остаётся на 403.
 */
export function useCabinetSectionAccess(selectedCabinetId?: number | null) {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'ADMIN'
  const overrideId = selectedCabinetId != null ? Number(selectedCabinetId) : null

  const [storedCabinetId, setStoredCabinetIdState] = useState<number | null>(() => getStoredCabinetId())

  const setCabinetId = useCallback((id: number | null) => {
    setStoredCabinetIdState(id)
    setStoredCabinetId(id)
  }, [])

  useEffect(() => subscribeStoredCabinetId(setStoredCabinetIdState), [])

  const { data, isFetched, isError } = useQuery({
    queryKey: ['cabinetsOverview'],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: !isAdmin,
    staleTime: 30_000,
  })

  /** Готовность: админ сразу; иначе — после overview. */
  const isReady = isAdmin || isError || isFetched

  const cabinets = useMemo(() => overviewCabinetOptions(data), [data])

  const requestedCabinetId = overrideId ?? storedCabinetId
  const normalizedRequestedId = requestedCabinetId != null ? Number(requestedCabinetId) : null

  useEffect(() => {
    if (isAdmin || overrideId != null || cabinets.length === 0) {
      return
    }
    if (isCabinetInOptions(storedCabinetId, cabinets)) {
      return
    }
    setCabinetId(cabinets[0].id)
  }, [isAdmin, overrideId, cabinets, storedCabinetId, setCabinetId])

  const effectiveCabinetId = useMemo(() => {
    if (isAdmin) {
      return normalizedRequestedId
    }
    if (isCabinetInOptions(normalizedRequestedId, cabinets)) {
      return normalizedRequestedId
    }
    return cabinets[0]?.id ?? null
  }, [isAdmin, normalizedRequestedId, cabinets])

  const sections = useMemo(() => {
    if (isAdmin) {
      return new Set(ALL_SECTIONS)
    }

    if (!isReady || data == null) {
      return new Set(ALL_SECTIONS)
    }

    const ownedIds = new Set((data.owned ?? []).map((c) => Number(c.id)))
    const granted = data.granted ?? []

    if (effectiveCabinetId != null && ownedIds.has(effectiveCabinetId)) {
      return new Set(ALL_SECTIONS)
    }

    const grant =
      effectiveCabinetId != null
        ? granted.find((g) => Number(g.id) === effectiveCabinetId)
        : undefined
    if (grant) {
      return new Set(grant.sections ?? [])
    }

    if (effectiveCabinetId == null) {
      return new Set(ALL_SECTIONS)
    }

    return new Set<CabinetAccessSection>()
  }, [isAdmin, isReady, effectiveCabinetId, data])

  const hasSection = useCallback(
    (section: CabinetAccessSection) => sections.has(section),
    [sections],
  )

  return {
    cabinetId: effectiveCabinetId,
    cabinets,
    setCabinetId,
    sections,
    hasSection,
    isReady,
  }
}
