import { useCallback, useEffect, useState } from 'react'
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
 * Выбранный кабинет: state + localStorage, синхронно при setCabinetId.
 */
export function useStoredCabinet(myCabinets: readonly { id: number }[]) {
  const [cabinetId, setCabinetIdState] = useState<number | null>(() => getStoredCabinetId())

  const setCabinetId = useCallback((id: number | null) => {
    setCabinetIdState(id)
    setStoredCabinetId(id)
  }, [])

  /** Только если storage пуст/битый — подставить первый кабинет. Выбор пользователя не трогаем. */
  useEffect(() => {
    if (myCabinets.length === 0) {
      return
    }

    const stored = getStoredCabinetId()
    if (isCabinetAvailable(stored, myCabinets)) {
      return
    }

    setCabinetId(myCabinets[0].id)
  }, [myCabinets, setCabinetId])

  return { cabinetId, setCabinetId }
}
