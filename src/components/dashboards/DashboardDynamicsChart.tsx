import { useMemo } from 'react'
import { Select, Spin } from 'antd'
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import dayjs from 'dayjs'
import type { DashboardDailyMetric, DashboardDailyPoint, Period } from '../../types/analytics'
import { colors, borderRadius, shadows, spacing, typography } from '../../styles/analytics'
import { DAILY_METRIC_OPTIONS, periodColor } from './dashboardConstants'

interface DashboardDynamicsChartProps {
  periods: Period[]
  points: DashboardDailyPoint[] | undefined
  metric: DashboardDailyMetric
  onMetricChange: (metric: DashboardDailyMetric) => void
  loading: boolean
  error: string | null
}

/**
 * Цвет периода как на карточках: по id (P1→фиолетовый, …).
 */
function colorForPeriod(period: Period): string {
  const index = Math.max(0, (period.id ?? 1) - 1)
  return periodColor(index)
}

/**
 * Период, в который попадает день (dateFrom/dateTo включительно).
 */
function findPeriodForDate(date: string, periods: Period[]): Period | null {
  for (const period of periods) {
    if (date >= period.dateFrom && date <= period.dateTo) {
      return period
    }
  }
  return null
}

/**
 * Дневная динамика с цветными полосами периодов и переключателем метрик.
 * Полосы рисуются по дням (Bar на всю высоту) — обе даты периода включены без «дырок».
 */
export default function DashboardDynamicsChart({
  periods,
  points,
  metric,
  onMetricChange,
  loading,
  error,
}: DashboardDynamicsChartProps) {
  const { chartData, yMax } = useMemo(() => {
    const rows = (points ?? []).map((p) => {
      const period = findPeriodForDate(p.date, periods)
      return {
        date: p.date,
        value: Number(p.value ?? 0),
        bandColor: period ? colorForPeriod(period) : 'transparent',
      }
    })
    const maxValue = rows.reduce((max, row) => Math.max(max, row.value), 0)
    /**
     * Целый «красивый» верх оси: дробный yMax даёт артефакт тика вроде «000001» у Recharts.
     * Тот же потолок у полос периодов — без белого зазора сверху.
     */
    const axisMax = Math.max(1, Math.ceil(maxValue * 1.12))
    return {
      yMax: axisMax,
      chartData: rows.map((row) => ({
        ...row,
        bandHeight: row.bandColor === 'transparent' ? 0 : axisMax,
      })),
    }
  }, [points, periods])

  return (
    <div
      style={{
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.sm,
        padding: spacing.lg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <div style={{ ...typography.h3 }}>Динамика по дням</div>
        <Select
          value={metric}
          onChange={(v) => onMetricChange(v as DashboardDailyMetric)}
          options={DAILY_METRIC_OPTIONS}
          style={{ minWidth: 180 }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginBottom: spacing.md }}>
        {periods.map((period) => (
          <div
            key={period.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: colors.textSecondary,
              paddingRight: 4,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: colorForPeriod(period),
                opacity: 0.45,
                display: 'inline-block',
              }}
            />
            Период {period.id}:{' '}
            {dayjs(period.dateFrom).format('DD.MM')}–{dayjs(period.dateTo).format('DD.MM')} вкл.
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </div>
      ) : error ? (
        <div style={{ color: colors.error, padding: spacing.md }}>{error}</div>
      ) : chartData.length === 0 ? (
        <div style={{ color: colors.textMuted, padding: spacing.md }}>Нет данных за выбранные периоды</div>
      ) : (
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              barCategoryGap={0}
              barGap={0}
            >
              <defs>
                <linearGradient id="dashboard-daily-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: colors.textMuted }}
                tickFormatter={(value: string) => dayjs(value).format('DD.MM')}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: colors.textMuted }}
                width={48}
                domain={[0, yMax]}
                allowDataOverflow={false}
                allowDecimals={false}
                tickFormatter={(value: number) =>
                  Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 0 })
                }
              />
              <Tooltip
                formatter={(value: number | string, name: string) => {
                  if (name === 'bandHeight') return [null, null]
                  return [
                    Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 }),
                    DAILY_METRIC_OPTIONS.find((o) => o.value === metric)?.label ?? metric,
                  ]
                }}
                labelFormatter={(label) => dayjs(String(label)).format('DD.MM.YYYY')}
              />
              {/* Фон периодов: каждый день включительно — колонка на всю высоту, без зазоров */}
              <Bar
                dataKey="bandHeight"
                isAnimationActive={false}
                legendType="none"
                tooltipType="none"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`band-${entry.date}`}
                    fill={entry.bandColor}
                    fillOpacity={0.16}
                    stroke="none"
                  />
                ))}
              </Bar>
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors.primary}
                fill="url(#dashboard-daily-fill)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
