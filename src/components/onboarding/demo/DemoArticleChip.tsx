import { Link } from 'react-router-dom'
import { colors, spacing, typography } from '../../../styles/analytics'
import { DemoPhotoPlaceholder } from './DemoPhotoPlaceholder'
import { onboardingDemoArticlePath } from '../../../onboarding/demoPaths'

interface DemoArticleChipProps {
  nmId: string
  title: string
  photoSize?: number
}

/**
 * Карточка артикула в учебной витрине со ссылкой на учебную карточку товара.
 */
export default function DemoArticleChip({ nmId, title, photoSize = 56 }: DemoArticleChipProps) {
  return (
    <Link
      to={onboardingDemoArticlePath(nmId)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.sm,
        flexShrink: 0,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <DemoPhotoPlaceholder width={photoSize} height={photoSize} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: photoSize, maxWidth: 160 }}>
        <div style={{ ...typography.body, fontSize: 12, color: colors.textPrimary, lineHeight: 1.3 }}>{title}</div>
        <div style={{ ...typography.bodySmall, marginTop: 2, color: colors.textSecondary }}>{nmId}</div>
      </div>
    </Link>
  )
}
