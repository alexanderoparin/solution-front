import { Checkbox, ConfigProvider, Tooltip } from 'antd'
import { colors, typography } from '../styles/analytics'

export type CampaignStatusFilter = 'active' | 'paused' | 'finished'

export const DEFAULT_CAMPAIGN_STATUS_FILTERS: CampaignStatusFilter[] = ['active', 'paused']

const STATUS_CHECKBOXES: {
  value: CampaignStatusFilter
  label: string
  color: string
  tooltip: string
}[] = [
  {
    value: 'active',
    label: 'Активна',
    color: colors.success,
    tooltip: 'Кампания запущена и крутится сейчас',
  },
  {
    value: 'paused',
    label: 'Пауза',
    color: colors.warning,
    tooltip: 'Кампания приостановлена, её можно снова запустить',
  },
  {
    value: 'finished',
    label: 'Завершена',
    color: colors.textMuted,
    tooltip: 'Кампания закончила работу',
  },
]

interface CampaignStatusFilterCheckboxesProps {
  value: CampaignStatusFilter[]
  onChange?: (next: CampaignStatusFilter[]) => void
}

/**
 * Фильтр статусов РК: три цветных чекбокса с подсказкой при наведении.
 */
export default function CampaignStatusFilterCheckboxes({
  value,
  onChange,
}: CampaignStatusFilterCheckboxesProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_CHECKBOXES.map((option) => (
        <ConfigProvider key={option.value} theme={{ token: { colorPrimary: option.color } }}>
          <Tooltip title={option.tooltip}>
            <Checkbox
              checked={value.includes(option.value)}
              onChange={(event) => {
                if (onChange == null) {
                  return
                }
                if (event.target.checked) {
                  onChange(value.includes(option.value) ? value : [...value, option.value])
                } else {
                  onChange(value.filter((item) => item !== option.value))
                }
              }}
            >
              <span style={{ ...typography.bodySmall, color: option.color, fontWeight: 600 }}>
                {option.label}
              </span>
            </Checkbox>
          </Tooltip>
        </ConfigProvider>
      ))}
    </div>
  )
}
