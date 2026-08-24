/** Стартовая страница после смены кабинета в шапке. */
export const CABINET_HOME_PATH = '/analytics/products'

/** Страницы аналитики, на которых можно остаться при смене кабинета. */
const ANALYTICS_SAFE_PATHS = new Set([CABINET_HOME_PATH, '/analytics'])

/**
 * Нужен ли переход на «Аналитика → Товары» при смене кабинета.
 * На «Товарах» и «Сводной» остаёмся; при одном кабинете редирект не нужен.
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
  if (ANALYTICS_SAFE_PATHS.has(pathname)) {
    return false
  }
  if (currentCabinetId == null) {
    return false
  }
  return Number(currentCabinetId) !== Number(newCabinetId)
}
