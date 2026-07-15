import { Link } from 'react-router-dom'
import { LEGAL_OPERATOR } from '../constants/legalOperator'

interface SiteLogoProps {
  /** Высота логотипа в px. */
  size?: number
  to?: string
  title?: string
  borderRadius?: number
  style?: React.CSSProperties
  /**
   * mark — квадратный знак «k»;
   * wordmark — белая надпись Clicki (для тёмного фона).
   */
  variant?: 'mark' | 'wordmark'
}

export default function SiteLogo({
  size = 40,
  to,
  title = 'На главную',
  borderRadius = 8,
  style,
  variant = 'mark',
}: SiteLogoProps) {
  const isWordmark = variant === 'wordmark'
  const src = isWordmark ? '/logo-white.png' : '/logo.png'

  const image = (
    <img
      src={src}
      alt={LEGAL_OPERATOR.siteBrandName}
      height={size}
      width={isWordmark ? undefined : size}
      style={{
        display: 'block',
        height: size,
        width: isWordmark ? 'auto' : size,
        borderRadius: isWordmark ? 0 : borderRadius,
        objectFit: 'contain',
        flexShrink: 0,
        ...style,
      }}
    />
  )

  if (to) {
    return (
      <Link to={to} title={title} style={{ lineHeight: 0, flexShrink: 0 }}>
        {image}
      </Link>
    )
  }

  return image
}
