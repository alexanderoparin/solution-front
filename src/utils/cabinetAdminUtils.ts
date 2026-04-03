import dayjs from 'dayjs'
import type { CabinetDto } from '../types/api'

export const ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES = 5
export const STOCKS_UPDATE_COOLDOWN_MINUTES = 60

export function formatCabinetAdminDate(dateString: string | null | undefined) {
  if (!dateString) return '—'
  return dayjs(dateString).format('DD.MM.YYYY HH:mm')
}

export function getLastUpdateOrRequested(cab: CabinetDto): string | null {
  const a = cab.lastDataUpdateAt ?? cab.apiKey?.lastDataUpdateAt ?? null
  const b = cab.lastDataUpdateRequestedAt ?? cab.apiKey?.lastDataUpdateRequestedAt ?? null
  if (!a && !b) return null
  if (!a) return b
  if (!b) return a
  return dayjs(a).isAfter(dayjs(b)) ? a : b
}

export function canUpdateCabinetData(cab: CabinetDto): boolean {
  const lastAt = getLastUpdateOrRequested(cab)
  if (!lastAt) return true
  return dayjs().diff(dayjs(lastAt), 'minute') >= ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES
}

export function getCabinetRemainingTime(cab: CabinetDto): string | null {
  const lastAt = getLastUpdateOrRequested(cab)
  if (!lastAt) return null
  const lastUpdate = dayjs(lastAt)
  const minutesSince = dayjs().diff(lastUpdate, 'minute')
  const remainingMinutes = ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES - minutesSince
  if (remainingMinutes <= 0) return null
  const word = remainingMinutes === 1 ? 'минуту' : remainingMinutes < 5 ? 'минуты' : 'минут'
  return `${remainingMinutes} ${word}`
}

export function canUpdateCabinetStocks(cab: CabinetDto): boolean {
  const lastRequested = cab.lastStocksUpdateRequestedAt ? dayjs(cab.lastStocksUpdateRequestedAt) : null
  if (!lastRequested) return true
  return dayjs().diff(lastRequested, 'minute') >= STOCKS_UPDATE_COOLDOWN_MINUTES
}

export function getCabinetStocksRemainingTime(cab: CabinetDto): string | null {
  const lastRequested = cab.lastStocksUpdateRequestedAt ? dayjs(cab.lastStocksUpdateRequestedAt) : null
  if (!lastRequested) return null
  const minutesSince = dayjs().diff(lastRequested, 'minute')
  const remainingMinutes = STOCKS_UPDATE_COOLDOWN_MINUTES - minutesSince
  if (remainingMinutes <= 0) return null
  const word = remainingMinutes === 1 ? 'минуту' : remainingMinutes < 5 ? 'минуты' : 'минут'
  return `${remainingMinutes} ${word}`
}

export function maskApiKeyPreview(apiKey: string): string {
  if (apiKey.length > 16) {
    return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 8)}`
  }
  return apiKey
}
