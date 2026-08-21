import type { CSSProperties } from 'react'
import type { MarketplaceType } from '../types/api'
import { marketplaceTypeLabel } from '../utils/marketplace'

interface MarketplaceTypeTagProps {
  type?: MarketplaceType | null
  /** Размер иконки в px (по умолчанию 18). */
  size?: number
  /** @deprecated иконки-фавиконы одинаковы на любом фоне */
  onDark?: boolean
  style?: CSSProperties
}

function iconSrc(type: MarketplaceType | null | undefined): string {
  return type === 'OZON' ? '/marketplace/ozon.svg' : '/marketplace/wb.svg'
}

/**
 * Значок маркетплейса кабинета (фавикон-стиль WB / Ozon).
 */
export default function MarketplaceTypeTag({ type, size = 18, style }: MarketplaceTypeTagProps) {
  const label = marketplaceTypeLabel(type)
  return (
    <img
      src={iconSrc(type)}
      alt={label}
      title={label}
      width={size}
      height={size}
      draggable={false}
      style={{
        display: 'block',
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.25),
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
