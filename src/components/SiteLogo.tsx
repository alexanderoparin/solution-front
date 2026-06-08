import { Link } from 'react-router-dom'
import { LEGAL_OPERATOR } from '../constants/legalOperator'

interface SiteLogoProps {
  size?: number
  to?: string
  title?: string
  borderRadius?: number
  style?: React.CSSProperties
}

export default function SiteLogo({
  size = 40,
  to,
  title = 'На главную',
  borderRadius = 8,
  style,
}: SiteLogoProps) {
  const image = (
    <img
      src="/logo.png"
      alt={LEGAL_OPERATOR.siteBrandName}
      width={size}
      height={size}
      style={{
        display: 'block',
        borderRadius,
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
