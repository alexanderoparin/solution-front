import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { getStoredCabinetId } from '../api/cabinets'
import {
  persistSellerCabinetId,
  readCabinetIdFromNavigationState,
  resolveSellerCabinetId,
} from '../utils/sellerCabinetSelection'

interface UseSellerCabinetSelectionOptions {
  /** Navigation state после редиректа при смене кабинета (только «Товары»). */
  navigationState?: unknown
  /** Вызывается после применения cabinetId из navigation state. */
  onNavigationStateConsumed?: () => void
}

/**
 * Выбор кабинета для USER: localStorage — единый источник между «Товарами» и «Сводной».
 */
export function useSellerCabinetSelection(
  myCabinets: readonly { id: number }[],
  options?: UseSellerCabinetSelectionOptions,
) {
  const [sellerSelectedCabinetId, setSellerSelectedCabinetId] = useState<number | null>(() =>
    getStoredCabinetId(),
  )

  const setSelectedCabinetId = useCallback((id: number | null) => {
    setSellerSelectedCabinetId(id)
    persistSellerCabinetId(id)
  }, [])

  /** Перечитать storage до первых API-запросов (переход Товары → Сводная). */
  useLayoutEffect(() => {
    const stored = getStoredCabinetId()
    if (stored != null) {
      setSellerSelectedCabinetId(stored)
    }
  }, [])

  useEffect(() => {
    const fromNav = readCabinetIdFromNavigationState(options?.navigationState)
    if (fromNav != null) {
      setSelectedCabinetId(fromNav)
      options?.onNavigationStateConsumed?.()
    }
  }, [options?.navigationState, options?.onNavigationStateConsumed, setSelectedCabinetId])

  useEffect(() => {
    if (myCabinets.length === 0) {
      return
    }

    const resolved = resolveSellerCabinetId(sellerSelectedCabinetId, myCabinets)
    if (resolved == null) {
      return
    }

    if (sellerSelectedCabinetId == null || Number(sellerSelectedCabinetId) !== Number(resolved)) {
      setSelectedCabinetId(resolved)
    }
  }, [myCabinets, sellerSelectedCabinetId, setSelectedCabinetId])

  useEffect(() => {
    return () => {
      if (sellerSelectedCabinetId != null) {
        persistSellerCabinetId(sellerSelectedCabinetId)
      }
    }
  }, [sellerSelectedCabinetId])

  return {
    selectedCabinetId: sellerSelectedCabinetId,
    setSelectedCabinetId,
  }
}
