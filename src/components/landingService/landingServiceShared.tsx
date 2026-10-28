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
  afterAccent = true,
  size = 'md',
  lineHeight = 1.15,
}: {
  before: string
  highlight?: string
  after?: string
  /** Подсветка с новой строки (как в блоке «перед глазами»). */
  highlightOnNewLine?: boolean
  /** Продолжение заголовка с новой строки (после «аналитика»). */
  afterOnNewLine?: boolean
  /**
   * Если after и highlight на одной новой строке: красить ли `after` акцентом.
   * false — `after` тёмный, акцент только у `highlight` (блок «зачем отдельный сервис»).
   */
  afterAccent?: boolean
  size?: 'md' | 'lg'
  /** Межстрочный интервал заголовка. */
  lineHeight?: number
}) {
  return (
    <h2
      style={{
        margin: 0,
        fontSize: size === 'lg' ? 'clamp(32px, 3.8vw, 46px)' : 'clamp(28px, 3.2vw, 40px)',
        lineHeight,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: svc.text,
      }}
    >
      {before}
      {after && afterOnNewLine && highlight && !highlightOnNewLine ? (
        <span style={{ display: 'block', whiteSpace: 'nowrap' }}>
          {afterAccent ? (
            <span style={{ color: svc.accent }}>
              {after} {highlight}
            </span>
          ) : (
            <>
              {after}{' '}
              <span style={{ color: svc.accent }}>{highlight}</span>
            </>
          )}
        </span>
      ) : (
        <>
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
        </>
      )}
    </h2>
  )
}

export function SvcLead({ children, large }: { children: ReactNode; large?: boolean }) {
  return (
    <p
      style={{
        margin: large ? '16px 0 0' : '12px 0 0',
        fontSize: large ? 20 : 18,
        lineHeight: 1.55,
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

export type SvcTone = 'purple' | 'green' | 'blue' | 'violet'

export function toneSoftBg(tone: SvcTone): string {
  if (tone === 'green') return svc.greenSoft
  if (tone === 'blue') return svc.blueSoft
  if (tone === 'violet') return '#EDE9FE'
  return svc.accentSoft
}

export function toneColor(tone: SvcTone): string {
  if (tone === 'green') return svc.green
  if (tone === 'blue') return '#2563EB'
  if (tone === 'violet') return '#7C3AED'
  return svc.accent
}

export function ToneIconBox({
  tone,
  children,
}: {
  tone: SvcTone
  children: ReactNode
}) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: toneSoftBg(tone),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 18,
        color: toneColor(tone),
      }}
    >
      {children}
    </div>
  )
}
