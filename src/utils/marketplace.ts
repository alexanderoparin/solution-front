import type { MarketplaceType } from '../types/api'

/** Подпись маркетплейса для UI. */
export function marketplaceTypeLabel(type: MarketplaceType | null | undefined): string {
  if (type === 'OZON') return 'Ozon'
  return 'WB'
}

/** Цвета бейджа маркетплейса (нейтральные, без фиолетового «AI»-клише). */
export function marketplaceTypeTagColors(type: MarketplaceType | null | undefined): {
  color: string
  background: string
  border: string
} {
  if (type === 'OZON') {
    return { color: '#005BFF', background: '#E8F1FF', border: '#B3D0FF' }
  }
  return { color: '#7C3AED', background: '#F3E8FF', border: '#E9D5FF' }
}
