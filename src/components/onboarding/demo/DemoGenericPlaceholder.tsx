import { colors, typography, spacing, borderRadius } from '../../../styles/analytics'
import { demoPageWrap } from './demoUi'

interface DemoGenericPlaceholderProps {
  title: string
  description: string
}

/**
 * Заглушка для экранов без отдельного тура (А/Б-тест, карточка товара и т.п.).
 */
export default function DemoGenericPlaceholder({ title, description }: DemoGenericPlaceholderProps) {
  return (
    <div style={demoPageWrap}>
      <div
        style={{
          maxWidth: 560,
          margin: '40px auto',
          padding: spacing.xl,
          backgroundColor: colors.bgWhite,
          border: `1px dashed ${colors.border}`,
          borderRadius: borderRadius.lg,
          textAlign: 'center',
        }}
      >
        <h1 style={{ ...typography.h2, margin: '0 0 8px' }}>{title}</h1>
        <p style={{ ...typography.body, color: colors.textSecondary, margin: 0 }}>{description}</p>
      </div>
    </div>
  )
}
