import { colors, borderRadius, spacing, typography } from '../../../styles/analytics'

interface DemoArticleChipProps {
  nmId: string
  title: string
  photoSize?: number
}

/**
 * Карточка артикула в учебной витрине (без ссылки на живую страницу товара).
 */
export default function DemoArticleChip({ nmId, title, photoSize = 56 }: DemoArticleChipProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.sm,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: photoSize,
          height: photoSize,
          borderRadius: borderRadius.sm,
          background: 'linear-gradient(145deg, #EDE9FE 0%, #C4B5FD 55%, #A78BFA 100%)',
          flexShrink: 0,
        }}
      />
      <div style={{ maxWidth: 160 }}>
        <div style={{ ...typography.body, fontSize: 12, lineHeight: 1.3 }}>{title}</div>
        <div style={{ ...typography.bodySmall, marginTop: 2, color: colors.textSecondary }}>{nmId}</div>
      </div>
    </div>
  )
}
