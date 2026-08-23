import { useMemo, useState } from 'react'
import { Select } from 'antd'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import dayjs, { type Dayjs } from 'dayjs'
import type { DailyData } from '../types/analytics'
import { colors, typography, spacing, shadows, borderRadius } from '../styles/analytics'

const METRIC_OPTIONS = [
  { key: 'orders', name: 'Заказано, шт' },
  { key: 'ordersAmount', name: 'Выручка, ₽' },
  { key: 'priceWithDiscount', name: 'Цена, ₽' },
] as const

type MetricKey = (typeof METRIC_OPTIONS)[number]['key']

const CHART_HEIGHT = 280

interface OzonAnalyticsChartProps {
  dailyData: DailyData[]
  dateRange: [Dayjs, Dayjs]
}

export default function OzonAnalyticsChart({ dailyData, dateRange }: OzonAnalyticsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('orders')

  const chartData = useMemo(() => {
    const startDate = dateRange[0].format('YYYY-MM-DD')
    const endDate = dateRange[1].format('YYYY-MM-DD')
    return dailyData
      .filter((d) => d.date >= startDate && d.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        date: item.date,
        dateFormatted: dayjs(item.date).format('DD.MM'),
        value: item[selectedMetric] as number | null,
      }))
  }, [dailyData, dateRange, selectedMetric])

  const formatValue = (value: number | null | undefined): string => {
    if (value == null) return '—'
    if (selectedMetric === 'orders') {
      return value.toLocaleString('ru-RU')
    }
    return `${value.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽`
  }

  return (
    <div style={{ marginBottom: spacing.lg }}>
      <div style={{ marginBottom: spacing.sm }}>
        <Select
          value={selectedMetric}
          onChange={(v) => setSelectedMetric(v as MetricKey)}
          options={METRIC_OPTIONS.map((m) => ({ value: m.key, label: m.name }))}
          style={{ minWidth: 200 }}
        />
      </div>
      <div style={{ width: '100%', height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
            <XAxis dataKey="dateFormatted" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={56} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as { date: string; value: number | null }
                return (
                  <div
                    style={{
                      backgroundColor: colors.bgWhite,
                      border: `1px solid ${colors.border}`,
                      borderRadius: borderRadius.sm,
                      padding: spacing.sm,
                      boxShadow: shadows.md,
                    }}
                  >
                    <div style={{ ...typography.bodySmall, color: colors.textSecondary }}>
                      {dayjs(row.date).format('DD.MM.YYYY')}
                    </div>
                    <div style={{ fontWeight: 600 }}>{formatValue(row.value)}</div>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors.primary}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
