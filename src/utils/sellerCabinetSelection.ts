import { getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'

/** Кабинет из navigation state (после смены кабинета в шапке). */
export function readCabinetIdFromNavigationState(state: unknown): number | null {
  const cabinetId = (state as { cabinetId?: number } | null)?.cabinetId
  if (cabinetId == null || Number.isNaN(Number(cabinetId))) {
    return null
  }
  return Number(cabinetId)
}

/** Есть ли кабинет в списке доступных (с учётом string/number из API). */
export function isCabinetInList(
  cabinetId: number | null | undefined,
  cabinets: readonly { id: number }[],
): boolean {
  if (cabinetId == null) {
    return false
  }
  return cabinets.some((c) => Number(c.id) === Number(cabinetId))
}

/**
 * Выбор кабинета для USER: localStorage + проверка, что id есть в списке.
 * Если сохранённый кабинет недоступен — первый из списка.
 */
export function resolveSellerCabinetId(
  selectedCabinetId: number | null,
  cabinets: readonly { id: number }[],
): number | null {
  if (cabinets.length === 0) {
    return selectedCabinetId
  }

  const storedId = selectedCabinetId ?? getStoredCabinetId()
  if (storedId != null && isCabinetInList(storedId, cabinets)) {
    return storedId
  }

  return cabinets[0].id
}

/** Сохраняет выбранный кабинет в localStorage. */
export function persistSellerCabinetId(cabinetId: number | null): void {
  setStoredCabinetId(cabinetId)
}
