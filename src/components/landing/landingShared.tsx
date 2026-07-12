import type { CSSProperties, ReactNode } from 'react'
import { landingColors, landingLayout, landingRadii } from '../../styles/landing'

export const LANDING_HEADER_OFFSET = landingLayout.headerHeight

export function landingContainerStyle(extra?: CSSProperties): CSSProperties {
  return {
    maxWidth: landingLayout.maxWidth,
    margin: '0 auto',
    paddingLeft: landingLayout.containerPaddingX,
    paddingRight: landingLayout.containerPaddingX,
    boxSizing: 'border-box',
    width: '100%',
    ...extra,
  }
}

export function landingSectionStyle(extra?: CSSProperties): CSSProperties {
  return {
    paddingTop: landingLayout.sectionPaddingY,
    paddingBottom: landingLayout.sectionPaddingY,
    scrollMarginTop: LANDING_HEADER_OFFSET + 8,
    ...extra,
  }
}

export function LandingSectionTitle({
  eyebrow,
  title,
  subtitle,
  light = false,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  light?: boolean
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 36, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
      {eyebrow ? (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: light ? landingColors.textOnDarkMuted : landingColors.accent,
            marginBottom: 12,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <h2
        style={{
          margin: 0,
          fontSize: 'clamp(28px, 4vw, 36px)',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: light ? landingColors.textOnDark : landingColors.textPrimary,
        }}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          style={{
            margin: '16px 0 0',
            fontSize: 17,
            lineHeight: 1.6,
            color: light ? landingColors.textOnDarkMuted : landingColors.textSecondary,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

export function LandingIconCircle({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: landingRadii.md,
        backgroundColor: landingColors.accentLight,
        color: landingColors.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  )
}
