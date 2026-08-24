/** Стартовая страница после смены кабинета на детальной странице. */
export const CABINET_HOME_PATH = '/analytics/products'

/**
 * Страница привязана к конкретной сущности (id в URL).
 * При смене кабинета здесь нельзя остаться — уходим на «Товары».
 */
export function isCabinetScopedDetailPage(pathname: string): boolean {
  if (/^\/analytics\/article\/[^/]+$/.test(pathname)) {
    return true
  }
  if (/^\/advertising\/campaigns\/[^/]+\/manage$/.test(pathname)) {
    return true
  }
  if (/^\/advertising\/campaigns\/[^/]+$/.test(pathname)) {
    return true
  }
  if (/^\/advertising\/ab-test\/[^/]+$/.test(pathname)) {
    return true
  }
  return false
}

/** Редирект на «Товары» только на деталках с id в адресе. */
export function shouldRedirectOnCabinetSwitch(
  pathname: string,
  currentCabinetId: number | null | undefined,
  newCabinetId: number,
  cabinetCount: number,
): boolean {
  if (cabinetCount <= 1) {
    return false
  }
  if (currentCabinetId == null) {
    return false
  }
  if (Number(currentCabinetId) === Number(newCabinetId)) {
    return false
  }
  return isCabinetScopedDetailPage(pathname)
}
