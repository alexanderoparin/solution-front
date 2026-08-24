/** Стартовая страница после смены кабинета в шапке. */
export const CABINET_HOME_PATH = '/analytics/products'

/**
 * Нужен ли переход на «Аналитика → Товары» при смене кабинета.
 * На самой странице товаров остаёмся; при одном кабинете редирект не нужен.
 */
export function shouldRedirectOnCabinetSwitch(
  pathname: string,
  currentCabinetId: number | null | undefined,
  newCabinetId: number,
  cabinetCount: number,
): boolean {
  if (cabinetCount <= 1) {
    return false
  }
  if (pathname === CABINET_HOME_PATH) {
    return false
  }
  if (currentCabinetId == null) {
    return false
  }
  return Number(currentCabinetId) !== Number(newCabinetId)
}
