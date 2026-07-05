/**
 * Общие настройки фильтра аналитики для страниц «Сводная» и «Товары» (ключ по id кабинета).
 */

export const analyticsSharedKeys = {
  selectedNmIds: (cabinetId: number) => `analytics_shared_selected_nm_ids_${cabinetId}`,
  search: (cabinetId: number) => `analytics_shared_search_${cabinetId}`,
  onlyWithPhoto: (cabinetId: number) => `analytics_shared_only_with_photo_${cabinetId}`,
  onlyPriority: (cabinetId: number) => `analytics_shared_only_priority_${cabinetId}`,
  onlyInAdvertising: (cabinetId: number) => `analytics_shared_only_in_advertising_${cabinetId}`,
  filterToNone: (cabinetId: number) => `analytics_shared_filter_to_none_${cabinetId}`,
  productsSort: (cabinetId: number) => `analytics_shared_products_sort_${cabinetId}`,
} as const

export type ProductsSortField = 'wbCreatedAt'

export interface ProductsSortPreference {
  field: ProductsSortField
  order: 'asc' | 'desc'
}

const DEFAULT_PRODUCTS_SORT: ProductsSortPreference = { field: 'wbCreatedAt', order: 'desc' }

function readBool(raw: string | null, defaultValue: boolean): boolean {
  if (raw == null || raw === '') return defaultValue
  return raw === 'true' || raw === '1'
}

function writeBool(cabinetId: number | null, keyFn: (id: number) => string, value: boolean): void {
  if (cabinetId == null) return
  try {
    localStorage.setItem(keyFn(cabinetId), value ? 'true' : 'false')
  } catch {
    /* quota / private mode */
  }
}

export function readSharedSearch(cabinetId: number | null): string {
  if (cabinetId == null) return ''
  try {
    const v = localStorage.getItem(analyticsSharedKeys.search(cabinetId))
    return typeof v === 'string' ? v : ''
  } catch {
    return ''
  }
}

export function writeSharedSearch(cabinetId: number | null, q: string): void {
  if (cabinetId == null) return
  try {
    localStorage.setItem(analyticsSharedKeys.search(cabinetId), q)
  } catch {
    /* ignore */
  }
}

export function readSharedOnlyWithPhoto(cabinetId: number | null): boolean {
  if (cabinetId == null) return true
  try {
    return readBool(localStorage.getItem(analyticsSharedKeys.onlyWithPhoto(cabinetId)), true)
  } catch {
    return true
  }
}

export function writeSharedOnlyWithPhoto(cabinetId: number | null, value: boolean): void {
  writeBool(cabinetId, analyticsSharedKeys.onlyWithPhoto, value)
}

export function readSharedOnlyPriority(cabinetId: number | null): boolean {
  if (cabinetId == null) return false
  try {
    return readBool(localStorage.getItem(analyticsSharedKeys.onlyPriority(cabinetId)), false)
  } catch {
    return false
  }
}

export function writeSharedOnlyPriority(cabinetId: number | null, value: boolean): void {
  writeBool(cabinetId, analyticsSharedKeys.onlyPriority, value)
}

export function readSharedOnlyInAdvertising(cabinetId: number | null): boolean {
  if (cabinetId == null) return false
  try {
    return readBool(localStorage.getItem(analyticsSharedKeys.onlyInAdvertising(cabinetId)), false)
  } catch {
    return false
  }
}

export function writeSharedOnlyInAdvertising(cabinetId: number | null, value: boolean): void {
  writeBool(cabinetId, analyticsSharedKeys.onlyInAdvertising, value)
}

export function readSharedFilterToNone(cabinetId: number | null): boolean {
  if (cabinetId == null) return false
  try {
    return readBool(localStorage.getItem(analyticsSharedKeys.filterToNone(cabinetId)), false)
  } catch {
    return false
  }
}

export function writeSharedFilterToNone(cabinetId: number | null, value: boolean): void {
  writeBool(cabinetId, analyticsSharedKeys.filterToNone, value)
}

export function readSharedProductsSort(cabinetId: number | null): ProductsSortPreference {
  if (cabinetId == null) return DEFAULT_PRODUCTS_SORT
  try {
    const raw = localStorage.getItem(analyticsSharedKeys.productsSort(cabinetId))
    if (!raw) return DEFAULT_PRODUCTS_SORT
    const parsed = JSON.parse(raw) as Partial<ProductsSortPreference>
    if (parsed.field === 'wbCreatedAt' && (parsed.order === 'asc' || parsed.order === 'desc')) {
      return { field: 'wbCreatedAt', order: parsed.order }
    }
    return DEFAULT_PRODUCTS_SORT
  } catch {
    return DEFAULT_PRODUCTS_SORT
  }
}

export function writeSharedProductsSort(cabinetId: number | null, sort: ProductsSortPreference): void {
  if (cabinetId == null) return
  try {
    localStorage.setItem(analyticsSharedKeys.productsSort(cabinetId), JSON.stringify(sort))
  } catch {
    /* ignore */
  }
}

/** Ключ для списка исключённых nmId в Сводной: у админа/менеджера — по sellerId, у продавца/работника — по кабинету. */
export function excludedNmIdsStorageKey(cabinetId: number | null, sellerId: number | undefined): string | null {
  if (sellerId != null) return `analytics_excluded_nm_ids_${sellerId}`
  if (cabinetId == null) return null
  return `analytics_excluded_nm_ids_cabinet_${cabinetId}`
}
