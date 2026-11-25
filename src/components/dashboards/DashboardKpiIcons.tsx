import type { CSSProperties } from 'react'
import type { KpiMetricKey } from './dashboardConstants'

interface IconProps {
  color: string
  size?: number
}

/**
 * Линейные иконки KPI в стиле макета агентства (rounded square + stroke glyph).
 */
export function DashboardKpiIcon({
  metricKey,
  color,
  size = 22,
}: {
  metricKey: KpiMetricKey
  color: string
  size?: number
}) {
  const props: IconProps = { color, size }
  switch (metricKey) {
    case 'transitions':
      return <CursorIcon {...props} />
    case 'cart':
      return <CartIcon {...props} />
    case 'orders':
      return <BagIcon {...props} />
    case 'ordersAmount':
      return <CoinsIcon {...props} />
    case 'costs':
      return <WalletIcon {...props} />
    case 'views':
      return <EyeIcon {...props} />
    case 'clicks':
      return <PointerIcon {...props} />
    case 'cartConversion':
      return <UsersIcon {...props} />
    case 'orderConversion':
      return <CartCheckIcon {...props} />
    case 'cpc':
      return <RubleCycleIcon {...props} />
    case 'drr':
      return <TargetIcon {...props} />
    default:
      return <CursorIcon {...props} />
  }
}

function svgStyle(size: number): CSSProperties {
  return { width: size, height: size, display: 'block', flexShrink: 0 }
}

function CursorIcon({ color, size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={svgStyle(size)} aria-hidden>
      <path
        d="M5.5 3.5L10.2 19.2L12.4 13.4L18.2 11.2L5.5 3.5Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12.6 13.6L17.8 19.2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function CartIcon({ color, size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={svgStyle(size)} aria-hidden>
      <path
        d="M3.5 5H5.2L7.1 14.2C7.25 14.95 7.9 15.5 8.66 15.5H17.1C17.8 15.5 18.42 15.05 18.65 14.4L20.5 9H6.2"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.2" cy="18.5" r="1.35" fill={color} />
      <circle cx="16.6" cy="18.5" r="1.35" fill={color} />
    </svg>
  )
}

function BagIcon({ color, size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={svgStyle(size)} aria-hidden>
      <path
        d="M7 8.5H17L18.2 19.2C18.28 19.9 17.75 20.5 17.05 20.5H6.95C6.25 20.5 5.72 19.9 5.8 19.2L7 8.5Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.5V7.2C9 5.54 10.34 4.2 12 4.2C13.66 4.2 15 5.54 15 7.2V8.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CoinsIcon({ color, size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={svgStyle(size)} aria-hidden>
      <ellipse cx="10.5" cy="15.5" rx="5.2" ry="2.4" stroke={color} strokeWidth="1.6" />
      <path d="M5.3 15.5V17.8C5.3 19.12 7.63 20.2 10.5 20.2C13.37 20.2 15.7 19.12 15.7 17.8V15.5" stroke={color} strokeWidth="1.6" />
      <ellipse cx="13.5" cy="8.2" rx="5.2" ry="2.4" stroke={color} strokeWidth="1.6" />
      <path d="M8.3 8.2V10.6C8.3 11.92 10.63 13 13.5 13C14.55 13 15.52 12.86 16.3 12.62" stroke={color} strokeWidth="1.6" />
      <path d="M12.2 7.1V9.4M14.8 7.55V8.7" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function WalletIcon({ color, size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={svgStyle(size)} aria-hidden>
      <rect x="3.5" y="7" width="17" height="12" rx="2.5" stroke={color} strokeWidth="1.7" />
      <path d="M3.5 10H20.5" stroke={color} strokeWidth="1.7" />
      <path d="M16 13.2H19.2C19.75 13.2 20.2 13.65 20.2 14.2V14.8C20.2 15.35 19.75 15.8 19.2 15.8H16C15.45 15.8 15 15.35 15 14.8V14.2C15 13.65 15.45 13.2 16 13.2Z" fill={color} />
      <path d="M7.5 7V5.8C7.5 4.8 8.3 4 9.3 4H14.2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon({ color, size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={svgStyle(size)} aria-hidden>
      <path
        d="M2.8 12C4.6 7.9 8 5.5 12 5.5C16 5.5 19.4 7.9 21.2 12C19.4 16.1 16 18.5 12 18.5C8 18.5 4.6 16.1 2.8 12Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.8" stroke={color} strokeWidth="1.7" />
    </svg>
  )
}

function PointerIcon({ color, size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={svgStyle(size)} aria-hidden>
      <path
        d="M9.2 3.8V13.2L7.4 11.5C6.85 10.98 5.95 11.05 5.5 11.65C5.1 12.18 5.2 12.95 5.72 13.35L10.1 16.8C10.7 17.28 11.45 17.55 12.22 17.55H15.4C17.28 17.55 18.8 16.03 18.8 14.15V10.6C18.8 9.83 18.18 9.2 17.4 9.2H14.8V5.6C14.8 4.6 14 3.8 13 3.8H9.2Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M14.8 9.2H12.6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon({ color, size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={svgStyle(size)} aria-hidden>
      <circle cx="9" cy="8" r="2.6" stroke={color} strokeWidth="1.7" />
      <path
        d="M4.2 18.2C4.5 15.4 6.4 13.6 9 13.6C11.6 13.6 13.5 15.4 13.8 18.2"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="16.2" cy="8.5" r="2.1" stroke={color} strokeWidth="1.6" />
      <path
        d="M15 13.8C16.7 13.95 18.1 15.2 18.5 17.4"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CartCheckIcon({ color, size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={svgStyle(size)} aria-hidden>
      <path
        d="M3.5 5H5.2L6.9 13.5H15.8L17.8 8.2H6.3"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.8" cy="18.2" r="1.25" fill={color} />
      <circle cx="15.2" cy="18.2" r="1.25" fill={color} />
      <path d="M14.2 5.2L16 7L19.4 3.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RubleCycleIcon({ color, size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={svgStyle(size)} aria-hidden>
      <path
        d="M19.2 12C19.2 16 15.97 19.2 12 19.2C8.03 19.2 4.8 16 4.8 12C4.8 8.03 8.03 4.8 12 4.8C14.55 4.8 16.78 6.12 18 8.1"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M17.2 4.5V8.3H13.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M10.2 8.4H12.4C13.5 8.4 14.4 9.3 14.4 10.4C14.4 11.5 13.5 12.4 12.4 12.4H10.2V8.4ZM10.2 12.4H14.6M10.2 14.6H14.2M10.2 8.4V16.2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TargetIcon({ color, size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={svgStyle(size)} aria-hidden>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.6" stroke={color} strokeWidth="1.7" />
      <circle cx="12" cy="12" r="1.6" fill={color} />
      <path d="M12 2.8V5.2M12 18.8V21.2M2.8 12H5.2M18.8 12H21.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
