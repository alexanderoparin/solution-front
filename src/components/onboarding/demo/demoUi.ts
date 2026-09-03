import type { CSSProperties } from 'react'
import { colors, borderRadius, shadows, spacing, typography } from '../../../styles/analytics'

export const demoPageWrap: CSSProperties = {
  padding: `${spacing.lg} ${spacing.md}`,
  width: '100%',
  backgroundColor: colors.bgGray,
  minHeight: '100vh',
}

export const demoCard: CSSProperties = {
  backgroundColor: colors.bgWhite,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: borderRadius.md,
  padding: spacing.lg,
  marginBottom: spacing.lg,
  boxShadow: shadows.md,
}

export const demoTableHead: CSSProperties = {
  ...typography.bodySmall,
  fontWeight: 600,
  textAlign: 'center',
  padding: '8px 10px',
  borderBottom: `1px solid ${colors.borderHeader}`,
  backgroundColor: colors.bgGrayLight,
  color: colors.textSecondary,
}

export const demoTableCell: CSSProperties = {
  padding: '8px 10px',
  borderBottom: `1px solid ${colors.border}`,
  fontSize: 13,
  color: colors.textPrimary,
}

