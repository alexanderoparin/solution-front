import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'

function isCabinetAvailable(
  cabinetId: number | null | undefined,
  cabinets: readonly { id: number }[],
): boolean {
  if (cabinetId == null) {
    return false
  }
  return cabinets.some((c) => Number(c.id) === Number(cabinetId))
}

/**
 * Выбранный кабинет USER: state + localStorage.
 * Fallback на первый кабинет — только если текущий и storage недоступны (список кабинетов изменился).
 */
export function useStoredCabinet(myCabinets: readonly { id: number }[]) {
  const [cabinetId, setCabinetIdState] = useState<number | null>(() => getStoredCabinetId())
  const cabinetIdRef = useRef(cabinetId)
  cabinetIdRef.current = cabinetId

  const setCabinetId = useCallback((id: number | null) => {
    setCabinetIdState(id)
    setStoredCabinetId(id)
  }, [])

  /** Стабильный ключ — не реагируем на каждый refetch массива из React Query. */
  const cabinetIdsKey = useMemo(
    () =>
      myCabinets
        .map((c) => Number(c.id))
        .sort((a, b) => a - b)
        .join(','),
    [myCabinets],
  )

  useEffect(() => {
    if (cabinetIdsKey === '') {
      return
    }

    const current = cabinetIdRef.current
    if (current != null && isCabinetAvailable(current, myCabinets)) {
      return
    }

    const stored = getStoredCabinetId()
    if (isCabinetAvailable(stored, myCabinets)) {
      setCabinetIdState(stored)
      return
    }

    setCabinetId(myCabinets[0].id)
  }, [cabinetIdsKey, myCabinets, setCabinetId])

  return { cabinetId, setCabinetId }
}
