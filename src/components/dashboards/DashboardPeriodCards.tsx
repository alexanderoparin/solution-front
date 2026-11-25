import { useState } from 'react'
import { DatePicker, Tooltip } from 'antd'
import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import locale from 'antd/locale/ru_RU'
import type { Period } from '../../types/analytics'
import { colors, borderRadius, spacing, transitions } from '../../styles/analytics'
import { MAX_DASHBOARD_PERIODS, periodBgColor, periodColor } from './dashboardConstants'

interface DashboardPeriodCardsProps {
  periods: Period[]
  onPeriodChange: (periodId: number, dates: [Dayjs, Dayjs]) => void
  onRemovePeriod: (periodId: number) => void
  onAddPeriod: () => void
  /** Подсветка блока (кнопка «Сравнить периоды»). */
  highlighted?: boolean
}

/**
 * Цветные карточки периодов по макету: пастельная заливка, даты, крестик удаления.
 */
export default function DashboardPeriodCards({
  periods,
  onPeriodChange,
  onRemovePeriod,
  onAddPeriod,
  highlighted = false,
}: DashboardPeriodCardsProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'stretch',
        outline: highlighted ? `2px solid ${colors.primary}` : 'none',
        outlineOffset: 4,
        borderRadius: borderRadius.md,
        transition: 'outline 0.2s ease',
      }}
    >
      {periods.map((period, index) => (
        <PeriodCard
          key={period.id}
          period={period}
          index={index}
          canRemove={periods.length > 1}
          onPeriodChange={onPeriodChange}
          onRemovePeriod={onRemovePeriod}
        />
      ))}
      <button
        type="button"
        onClick={onAddPeriod}
        disabled={periods.length >= MAX_DASHBOARD_PERIODS}
        style={{
          minWidth: 148,
          minHeight: 72,
          borderRadius: 14,
          border: `1.5px dashed ${colors.border}`,
          backgroundColor: colors.bgWhite,
          color: periods.length >= MAX_DASHBOARD_PERIODS ? colors.textMuted : colors.textSecondary,
          cursor: periods.length >= MAX_DASHBOARD_PERIODS ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: `${spacing.sm} ${spacing.md}`,
          transition: transitions.fast,
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <PlusOutlined />
        Добавить период
      </button>
    </div>
  )
}

function PeriodCard({
  period,
  index,
  canRemove,
  onPeriodChange,
  onRemovePeriod,
}: {
  period: Period
  index: number
  canRemove: boolean
  onPeriodChange: (periodId: number, dates: [Dayjs, Dayjs]) => void
  onRemovePeriod: (periodId: number) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const accent = periodColor(index)
  const bg = periodBgColor(index)

  return (
    <div
      style={{
        backgroundColor: bg,
        borderRadius: 14,
        border: `1px solid ${accent}33`,
        padding: '10px 12px 12px',
        minWidth: 168,
        maxWidth: 200,
        flex: '1 1 168px',
        position: 'relative',
        boxShadow: `0 1px 0 ${accent}22`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: accent,
              display: 'inline-block',
              boxShadow: `0 0 0 3px ${accent}33`,
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: 0.2 }}>
            Период {period.id}
          </span>
        </div>
        {canRemove && (
          <Tooltip title="Удалить период">
            <button
              type="button"
              onClick={() => onRemovePeriod(period.id)}
              aria-label="Удалить период"
              style={{
                border: 'none',
                background: 'transparent',
                color: colors.textMuted,
                cursor: 'pointer',
                padding: 2,
                lineHeight: 1,
                fontSize: 11,
              }}
            >
              <CloseOutlined />
            </button>
          </Tooltip>
        )}
      </div>

      <DatePicker.RangePicker
        locale={locale.DatePicker}
        value={[dayjs(period.dateFrom), dayjs(period.dateTo)]}
        onChange={(dates) => {
          if (dates?.[0] && dates?.[1]) {
            onPeriodChange(period.id, [dates[0], dates[1]])
            setPickerOpen(false)
          }
        }}
        allowClear={false}
        inputReadOnly
        format="DD.MM.YYYY"
        separator="–"
        size="small"
        variant="borderless"
        style={{
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.72)',
          borderRadius: 8,
          padding: '2px 4px',
        }}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        suffixIcon={null}
      />
    </div>
  )
}
