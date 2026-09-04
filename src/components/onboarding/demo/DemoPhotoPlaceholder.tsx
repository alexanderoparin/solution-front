import { colors, borderRadius } from '../../../styles/analytics'

/**
 * Учебная заглушка фото: рамка с «пейзажем», чтобы ячейка не выглядела пустым серым прямоугольником.
 */
export function DemoPhotoPlaceholder({ width, height }: { width: number; height: number }) {
  const iconSize = Math.round(Math.min(width, height) * 0.55)
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        maxWidth: width,
        maxHeight: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 55%, #E2E8F0 100%)',
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.sm,
        boxSizing: 'border-box',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 48 48" fill="none">
        <rect x="5" y="9" width="38" height="30" rx="3" fill="#fff" stroke="#CBD5E1" strokeWidth="1.5" />
        <circle cx="16.5" cy="19" r="3.5" fill="#C4B5FD" />
        <path d="M8 35.5 L19 23.5 L27 31 L33 25.5 L40.5 35.5 Z" fill="#A78BFA" fillOpacity="0.55" />
        <path d="M8 35.5 L19 23.5 L27 31 L22 35.5 Z" fill="#7C3AED" fillOpacity="0.28" />
      </svg>
    </div>
  )
}
