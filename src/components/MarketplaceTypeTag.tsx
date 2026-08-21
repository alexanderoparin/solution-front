import type { CSSProperties } from 'react'
import type { MarketplaceType } from '../types/api'
import { marketplaceTypeLabel, marketplaceTypeTagColors } from '../utils/marketplace'

interface MarketplaceTypeTagProps {
  type?: MarketplaceType | null
  /** Компактный вид для шапки на тёмном фоне */
  onDark?: boolean
  style?: CSSProperties
}

/**
 * Бейдж маркетплейса кабинета (WB / Ozon).
 */
export default function MarketplaceTypeTag({ type, onDark = false, style }: MarketplaceTypeTagProps) {
  const colors = marketplaceTypeTagColors(type)
  return (
    <span
      style={{
        display: 'inline-block',
        padding: onDark ? '1px 6px' : '2px 8px',
        borderRadius: 6,
        fontSize: onDark ? 11 : 12,
        fontWeight: 600,
        lineHeight: onDark ? '16px' : '16px',
        color: onDark ? '#fff' : colors.color,
        background: onDark ? 'rgba(255,255,255,0.14)' : colors.background,
        border: onDark ? '1px solid rgba(255,255,255,0.22)' : `1px solid ${colors.border}`,
        flexShrink: 0,
        ...style,
      }}
    >
      {marketplaceTypeLabel(type)}
    </span>
  )
}
