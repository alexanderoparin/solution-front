/** Выбранный кабинет в этой вкладке (без HTTP-клиента — можно вызывать из authStore). */
const CABINET_STORAGE_KEY = 'analytics_selected_cabinet_id'

/** Смена выбранного кабинета в этой вкладке (localStorage не шлёт storage-событие себе). */
export const CABINET_ID_CHANGED_EVENT = 'clicki:selected-cabinet-id-changed'

export function getStoredCabinetId(): number | null {
  const saved = localStorage.getItem(CABINET_STORAGE_KEY)
  if (!saved) return null
  const id = parseInt(saved, 10)
  return Number.isNaN(id) ? null : id
}

export function setStoredCabinetId(id: number | null): void {
  const previous = getStoredCabinetId()
  if (id == null) {
    localStorage.removeItem(CABINET_STORAGE_KEY)
  } else {
    localStorage.setItem(CABINET_STORAGE_KEY, String(id))
  }
  if (previous === id) {
    return
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<number | null>(CABINET_ID_CHANGED_EVENT, { detail: id }))
  }
}

/** Подписка на смену выбранного кабинета в текущей вкладке. */
export function subscribeStoredCabinetId(listener: (id: number | null) => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<number | null>).detail
    listener(detail === undefined ? getStoredCabinetId() : detail)
  }
  window.addEventListener(CABINET_ID_CHANGED_EVENT, handler)
  return () => window.removeEventListener(CABINET_ID_CHANGED_EVENT, handler)
}

export function getStoredCabinetIdForSeller(sellerId: number): number | null {
  const key = `analytics_selected_cabinet_id_${sellerId}`
  const saved = localStorage.getItem(key)
  if (!saved) return null
  const id = parseInt(saved, 10)
  return Number.isNaN(id) ? null : id
}

export function setStoredCabinetIdForSeller(sellerId: number, cabinetId: number | null): void {
  const key = `analytics_selected_cabinet_id_${sellerId}`
  if (cabinetId == null) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, String(cabinetId))
  }
}
