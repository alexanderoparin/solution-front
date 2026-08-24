import { useCallback, useEffect, useState } from 'react'
import { getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'

/**
 * Выбранный кабинет селлера: читаем и пишем в localStorage.
 */
export function useStoredCabinet(myCabinets: readonly { id: number }[]) {
  const [cabinetId, setCabinetIdState] = useState<number | null>(() => getStoredCabinetId())

  const setCabinetId = useCallback((id: number | null) => {
    setCabinetIdState(id)
    setStoredCabinetId(id)
  }, [])

  /** Если сохранённый id недоступен — первый из списка. */
  useEffect(() => {
    if (myCabinets.length === 0) {
      return
    }

    const stored = getStoredCabinetId()
    if (stored != null && myCabinets.some((c) => Number(c.id) === Number(stored))) {
      setCabinetIdState(stored)
      return
    }

    const first = myCabinets[0].id
    setCabinetIdState(first)
    setStoredCabinetId(first)
  }, [myCabinets])

  return { cabinetId, setCabinetId }
}
