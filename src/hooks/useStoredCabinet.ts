import { useCallback, useEffect, useState } from 'react'
import { getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'

function isCabinetAvailable(cabinetId: number, cabinets: readonly { id: number }[]): boolean {
  return cabinets.some((c) => Number(c.id) === Number(cabinetId))
}

/**
 * Выбранный кабинет селлера — только localStorage, без рассинхрона state/storage.
 */
export function useStoredCabinet(myCabinets: readonly { id: number }[]) {
  const [revision, setRevision] = useState(0)

  const setCabinetId = useCallback((id: number | null) => {
    setStoredCabinetId(id)
    setRevision((r) => r + 1)
  }, [])

  /** Только если в storage пусто или id недоступен — первый кабинет из списка. */
  useEffect(() => {
    if (myCabinets.length === 0) {
      return
    }

    const stored = getStoredCabinetId()
    if (stored != null && isCabinetAvailable(stored, myCabinets)) {
      return
    }

    setStoredCabinetId(myCabinets[0].id)
    setRevision((r) => r + 1)
  }, [myCabinets])

  void revision

  return {
    cabinetId: getStoredCabinetId(),
    setCabinetId,
  }
}
