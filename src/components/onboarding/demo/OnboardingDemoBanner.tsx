import { Typography } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import NoCabinetsPlaceholder from '../../NoCabinetsPlaceholder'
import { colors, borderRadius, spacing } from '../../../styles/analytics'

const { Text } = Typography

interface OnboardingDemoBannerProps {
  onCreated?: () => void
}

/**
 * Плашка над учебной витриной: это пример, данные появятся после добавления кабинета.
 */
export default function OnboardingDemoBanner({ onCreated }: OnboardingDemoBannerProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 56,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        flexWrap: 'wrap',
        margin: `${spacing.md} ${spacing.md} ${spacing.md}`,
        padding: `${spacing.sm} ${spacing.md}`,
        backgroundColor: colors.primaryLight,
        border: `1px solid ${colors.primary}`,
        borderRadius: borderRadius.md,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm, minWidth: 0, flex: 1 }}>
        <InfoCircleOutlined style={{ color: colors.primary, fontSize: 18, marginTop: 2, flexShrink: 0 }} />
        <Text style={{ color: colors.textPrimary, fontSize: 13, lineHeight: 1.45 }}>
          Это учебный пример интерфейса с подсказками. Добавьте кабинет, и те же подсказки появятся на ваших данных.
        </Text>
      </div>
      <NoCabinetsPlaceholder variant="button" onCreated={onCreated} />
    </div>
  )
}
