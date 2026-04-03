import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { userApi } from '../api/user'
import { getStoredCabinetIdForSeller, setStoredCabinetIdForSeller } from '../api/cabinets'
import type { WorkContextCabinetDto } from '../types/api'

export const WORK_CONTEXT_CABINETS_QUERY_KEY = ['workContextCabinets'] as const

export function workContextCabinetLabel(row: WorkContextCabinetDto): string {
  return `${row.cabinetName} (${row.sellerEmail})`
}

/**
 * Контекст «кабинет + селлер» для ADMIN/MANAGER в шапке: только кабинеты с API-ключом, по алфавиту названия.
 */
export function useWorkContextForManagerAdmin(isManagerOrAdmin: boolean) {
  const { data: raw = [], isLoading } = useQuery({
    queryKey: WORK_CONTEXT_CABINETS_QUERY_KEY,
    queryFn: () => userApi.getWorkContextCabinets(),
    enabled: isManagerOrAdmin,
    staleTime: 30_000,
  })

  const options = useMemo(() => {
    return [...raw].sort((a, b) =>
      a.cabinetName.localeCompare(b.cabinetName, 'ru', { sensitivity: 'base' }),
    )
  }, [raw])

  const [selectedCabinetId, setSelectedCabinetIdInternal] = useState<number | null>(null)

  useEffect(() => {
    if (!isManagerOrAdmin) {
      setSelectedCabinetIdInternal(null)
      return
    }
    if (options.length === 0) {
      setSelectedCabinetIdInternal(null)
      return
    }
    setSelectedCabinetIdInternal((current) => {
      if (current != null && options.some((o) => o.cabinetId === current)) {
        return current
      }
      const savedSellerRaw = localStorage.getItem('analytics_selected_seller_id')
      const savedSeller = savedSellerRaw ? parseInt(savedSellerRaw, 10) : NaN
      if (!Number.isNaN(savedSeller)) {
        const storedCab = getStoredCabinetIdForSeller(savedSeller)
        if (storedCab != null) {
          const hit = options.find((o) => o.cabinetId === storedCab && o.sellerId === savedSeller)
          if (hit) {
            return storedCab
          }
        }
      }
      const first = options[0]
      localStorage.setItem('analytics_selected_seller_id', String(first.sellerId))
      setStoredCabinetIdForSeller(first.sellerId, first.cabinetId)
      return first.cabinetId
    })
  }, [isManagerOrAdmin, options])

  const applyWorkContextCabinet = useCallback(
    (cabinetId: number) => {
      const opt = options.find((o) => o.cabinetId === cabinetId)
      if (!opt) return
      setSelectedCabinetIdInternal(cabinetId)
      localStorage.setItem('analytics_selected_seller_id', String(opt.sellerId))
      setStoredCabinetIdForSeller(opt.sellerId, cabinetId)
    },
    [options],
  )

  const selectedSellerId = useMemo(() => {
    if (!isManagerOrAdmin || selectedCabinetId == null) return undefined
    return options.find((o) => o.cabinetId === selectedCabinetId)?.sellerId
  }, [isManagerOrAdmin, options, selectedCabinetId])

  const workContextCabinetSelectProps = isManagerOrAdmin
    ? {
        options: options.map((o) => ({
          value: o.cabinetId,
          label: workContextCabinetLabel(o),
        })),
        value: selectedCabinetId ?? undefined,
        onChange: applyWorkContextCabinet,
        loading: isLoading,
      }
    : undefined

  return {
    workContextOptions: options,
    workContextLoading: isLoading,
    selectedCabinetId: isManagerOrAdmin ? selectedCabinetId : null,
    selectedSellerId: isManagerOrAdmin ? selectedSellerId : undefined,
    applyWorkContextCabinet,
    workContextCabinetSelectProps,
  }
}
