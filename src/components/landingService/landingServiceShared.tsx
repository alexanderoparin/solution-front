import type { CSSProperties, ReactNode } from 'react'
import { landingColors, landingLayout, landingRadii } from '../../styles/landing'

export const svc = {
  accent: landingColors.accent,
  accentHover: landingColors.accentHover,
  accentSoft: '#F3E8FF',
  green: landingColors.brandGreen,
  greenSoft: '#ECFCCB',
  greenDark: '#3F6212',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E5E7EB',
  softBg: '#F8FAFC',
  blueSoft: '#EFF6FF',
} as const

export function svcContainer(extra?: CSSProperties): CSSProperties {
  return {
    maxWidth: landingLayout.maxWidth,
    margin: '0 auto',
    paddingLeft: landingLayout.containerPaddingX,
    paddingRight: landingLayout.containerPaddingX,
    width: '100%',
    boxSizing: 'border-box',
    ...extra,
  }
}

export function svcSection(extra?: CSSProperties): CSSProperties {
  return {
    paddingTop: landingLayout.sectionPaddingY,
    paddingBottom: landingLayout.sectionPaddingY,
    ...extra,
  }
}

export function SvcTitle({
  before,
  highlight,
  after,
  highlightOnNewLine,
  afterOnNewLine,
  size = 'md',
}: {
  before: string
  highlight?: string
  after?: string
  /** Подсветка с новой строки (как в блоке «перед глазами»). */
  highlightOnNewLine?: boolean
  /** Продолжение заголовка с новой строки (после «аналитика»). */
  afterOnNewLine?: boolean
  size?: 'md' | 'lg'
}) {
  return (
    <h2
      style={{
        margin: 0,
        fontSize: size === 'lg' ? 'clamp(32px, 3.8vw, 46px)' : 'clamp(28px, 3.2vw, 40px)',
        lineHeight: 1.15,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: svc.text,
      }}
    >
      {before}
      {after ? (
        afterOnNewLine ? (
          <span style={{ display: 'block' }}>{after}</span>
        ) : (
          <> {after}</>
        )
      ) : null}
      {highlight ? (
        highlightOnNewLine ? (
          <span style={{ display: 'block', color: svc.accent }}>{highlight}</span>
        ) : (
          <>
            {' '}
            <span style={{ color: svc.accent }}>{highlight}</span>
          </>
        )
      ) : null}
    </h2>
  )
}

export function SvcLead({ children, large }: { children: ReactNode; large?: boolean }) {
  return (
    <p
      style={{
        margin: large ? '18px 0 0' : '14px 0 0',
        fontSize: large ? 18 : 16,
        lineHeight: 1.6,
        color: svc.muted,
        maxWidth: 640,
      }}
    >
      {children}
    </p>
  )
}

export function SvcPrimaryButton({
  children,
  onClick,
  fullWidth,
}: {
  children: ReactNode
  onClick?: () => void
  fullWidth?: boolean
}) {
  return (
    <button
      type="button"
      className="svc-primary-btn"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        padding: '0 22px',
        border: 'none',
        borderRadius: landingRadii.md,
        background: svc.accent,
        color: '#fff',
        fontSize: 15,
        fontWeight: 600,
        cursor: 'pointer',
        width: fullWidth ? '100%' : undefined,
        boxShadow: '0 10px 24px rgba(124, 58, 237, 0.25)',
      }}
    >
      {children}
      <span aria-hidden>→</span>
    </button>
  )
}

export function ToneIconBox({
  tone,
  children,
}: {
  tone: 'purple' | 'green' | 'blue'
  children: ReactNode
}) {
  const bg =
    tone === 'green' ? svc.greenSoft : tone === 'blue' ? svc.blueSoft : svc.accentSoft
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: bg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 18,
      }}
    >
      {children}
    </div>
  )
}
