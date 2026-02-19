import { useState, useMemo } from 'react'
import { Select } from 'antd'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import type { DailyData } from '../types/analytics'
import { colors, typography, spacing, shadows, borderRadius } from '../styles/analytics'

dayjs.locale('ru')

// Маппинг метрик из воронок (без приписок "шт, руб, %")
const METRIC_OPTIONS = [
  { key: 'transitions', name: 'Переходы в карточку', category: 'funnel' },
  { key: 'cart', name: 'Положили в корзину', category: 'funnel' },
  { key: 'orders', name: 'Заказали товаров', category: 'funnel' },
  { key: 'ordersAmount', name: 'Заказали на сумму', category: 'funnel' },
  { key: 'cartConversion', name: 'Конверсия в корзину', category: 'funnel' },
  { key: 'orderConversion', name: 'Конверсия в заказ', category: 'funnel' },
  { key: 'views', name: 'Просмотры', category: 'advertising' },
  { key: 'clicks', name: 'Клики', category: 'advertising' },
  { key: 'costs', name: 'Затраты', category: 'advertising' },
  { key: 'cpc', name: 'СРС', category: 'advertising' },
  { key: 'ctr', name: 'CTR', category: 'advertising' },
  { key: 'cpo', name: 'СРО', category: 'advertising' },
  { key: 'drr', name: 'ДРР', category: 'advertising' },
]

const CHART_HEIGHT = 300

interface AnalyticsChartProps {
  dailyData: DailyData[]
  nmId: number
  sellerId?: number
  dateRange: [dayjs.Dayjs, dayjs.Dayjs]
  onDateRangeChange: (range: [dayjs.Dayjs, dayjs.Dayjs]) => void
}

export default function AnalyticsChart({ dailyData, dateRange }: AnalyticsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('transitions')

  // Фильтруем данные по выбранному периоду
  const filteredData = useMemo(() => {
    const startDate = dateRange[0].format('YYYY-MM-DD')
    const endDate = dateRange[1].format('YYYY-MM-DD')
    
    return dailyData
      .filter(d => d.date >= startDate && d.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item, index, array) => {
        const value = item[selectedMetric as keyof DailyData] as number | null
        const prevValue = index > 0 
          ? (array[index - 1][selectedMetric as keyof DailyData] as number | null)
          : null
        
        let changePercent: number | null = null
        if (prevValue !== null && prevValue !== 0 && value !== null) {
          changePercent = ((value - prevValue) / prevValue) * 100
        }
        
        return {
          date: item.date,
          dateFormatted: dayjs(item.date).format('DD.MM'),
          value,
          prevValue,
          changePercent,
        }
      })
  }, [dailyData, dateRange, selectedMetric])

  const selectedMetricInfo = METRIC_OPTIONS.find(m => m.key === selectedMetric)

  // Форматирование значения для отображения
  const formatValue = (value: number | null): string => {
    if (value === null || value === undefined) return '-'
    
    const metric = METRIC_OPTIONS.find(m => m.key === selectedMetric)
    if (!metric) return value.toLocaleString('ru-RU')
    
    // Для процентных метрик
    if (selectedMetric.includes('conversion') || selectedMetric === 'ctr' || selectedMetric === 'drr') {
      return `${value.toFixed(2)}%`
    }
    
    // Для валютных метрик
    if (selectedMetric.includes('Amount') || selectedMetric === 'costs' || selectedMetric === 'cpc' || selectedMetric === 'cpo') {
      return `${value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`
    }
    
    // Для остальных - просто число
    return value.toLocaleString('ru-RU')
  }

  // Кастомный tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const changeColor = data.changePercent !== null 
        ? (data.changePercent >= 0 ? colors.success : colors.error)
        : colors.textSecondary
      
      return (
        <div style={{
          backgroundColor: colors.bgWhite,
          border: `1px solid ${colors.border}`,
          borderRadius: borderRadius.sm,
          padding: spacing.sm,
          boxShadow: shadows.md
        }}>
          <div style={{ ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs }}>
            {dayjs(data.date).format('DD.MM.YY')}
          </div>
          {data.changePercent !== null && (
            <div style={{ ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs }}>
              По сравнению с предыдущим днем
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: colors.primary,
              borderRadius: borderRadius.sm
            }} />
            <div style={{ ...typography.body, fontWeight: 600, color: colors.textPrimary }}>
              {selectedMetricInfo?.name || selectedMetric}
            </div>
          </div>
          <div style={{ ...typography.h3, color: colors.textPrimary, marginTop: spacing.xs }}>
            {formatValue(data.value)}
          </div>
          {data.changePercent !== null && (
            <div style={{ 
              ...typography.bodySmall, 
              color: changeColor, 
              fontWeight: 600,
              marginTop: spacing.xs
            }}>
              {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div style={{
      backgroundColor: colors.bgWhite,
      border: `1px solid ${colors.borderLight}`,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      paddingBottom: spacing.md,
      marginBottom: spacing.xl,
      boxShadow: shadows.md
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ ...typography.body, color: colors.textSecondary }}>Показатель:</span>
          <Select
            value={selectedMetric}
            onChange={setSelectedMetric}
            options={METRIC_OPTIONS.map((m) => ({ value: m.key, label: m.name }))}
            style={{ minWidth: 200 }}
          />
        </div>
        <div style={{
          width: '100%',
          height: CHART_HEIGHT
        }}>
          {filteredData.length === 0 ? (
            <div style={{
              ...typography.body,
              textAlign: 'center',
              padding: spacing.xl,
              color: colors.textSecondary
            }}>
              Нет данных за выбранный период
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart data={filteredData} margin={{ top: 8, right: 0, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis 
                  dataKey="dateFormatted" 
                  stroke={colors.textSecondary}
                  style={{ ...typography.bodySmall }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  width={48}
                  stroke={colors.textSecondary}
                  style={{ ...typography.bodySmall }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors.primary}
                  strokeWidth={2}
                  connectNulls
                  dot={{ fill: colors.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
