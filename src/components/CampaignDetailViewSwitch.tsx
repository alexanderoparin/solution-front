import { colors, borderRadius, typography, spacing } from '../styles/analytics'

export type CampaignDetailViewMode = 'statistics' | 'clusters'

interface CampaignDetailViewSwitchProps {
  value: CampaignDetailViewMode
  onChange: (mode: CampaignDetailViewMode) => void
}

const OPTIONS: { id: CampaignDetailViewMode; label: string }[] = [
  { id: 'statistics', label: 'Статистика' },
  { id: 'clusters', label: 'Кластеры' },
]

export default function CampaignDetailViewSwitch({ value, onChange }: CampaignDetailViewSwitchProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: spacing.sm,
        marginBottom: spacing.md,
        flexWrap: 'wrap',
      }}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              ...typography.body,
              padding: '5px 14px',
              minHeight: 32,
              lineHeight: 1.25,
              borderRadius: borderRadius.sm,
              border: active ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
              backgroundColor: active ? colors.primary : colors.bgWhite,
              color: active ? '#fff' : colors.textPrimary,
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: 'none',
              transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
