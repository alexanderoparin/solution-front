import { useMemo } from 'react'
import { Select, Spin } from 'antd'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
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
 * Дневная динамика с цветными полосами периодов и переключателем метрик.
 */
export default function DashboardDynamicsChart({
  periods,
  points,
  metric,
  onMetricChange,
  loading,
  error,
}: DashboardDynamicsChartProps) {
  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => a.dateFrom.localeCompare(b.dateFrom)),
    [periods]
  )

  const chartData = useMemo(
    () =>
      (points ?? []).map((p) => ({
        date: p.date,
        value: Number(p.value ?? 0),
        label: dayjs(p.date).format('DD.MM'),
      })),
    [points]
  )

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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {sortedPeriods.map((period, index) => (
          <div
            key={period.id}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textSecondary }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: periodColor(index),
                opacity: 0.35,
                display: 'inline-block',
              }}
            />
            P{period.id}: {dayjs(period.dateFrom).format('DD.MM')}–{dayjs(period.dateTo).format('DD.MM')}
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
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboard-daily-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: colors.textMuted }} width={48} />
              <Tooltip
                formatter={(value: number | string) => [
                  Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 }),
                  DAILY_METRIC_OPTIONS.find((o) => o.value === metric)?.label ?? metric,
                ]}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { date?: string } | undefined
                  return row?.date ? dayjs(row.date).format('DD.MM.YYYY') : ''
                }}
              />
              {sortedPeriods.map((period, index) => (
                <ReferenceArea
                  key={period.id}
                  x1={dayjs(period.dateFrom).format('DD.MM')}
                  x2={dayjs(period.dateTo).format('DD.MM')}
                  fill={periodColor(index)}
                  fillOpacity={0.12}
                  ifOverflow="extendDomain"
                />
              ))}
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors.primary}
                fill="url(#dashboard-daily-fill)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
