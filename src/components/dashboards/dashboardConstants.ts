import type { AggregatedMetrics } from '../../types/analytics'
import type { DashboardDailyMetric } from '../../types/analytics'

/** Цвета периодов P1–P5 по макету. */
export const PERIOD_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'] as const

/** Пастельные заливки карточек периодов (фон). */
export const PERIOD_BG_COLORS = [
  '#F3E8FF',
  '#DBEAFE',
  '#D1FAE5',
  '#FEF3C7',
  '#FCE7F3',
] as const

export const MAX_DASHBOARD_PERIODS = 5

export type KpiMetricKey =
  | 'transitions'
  | 'cart'
  | 'orders'
  | 'ordersAmount'
  | 'costs'
  | 'views'
  | 'clicks'
  | 'cartConversion'
  | 'orderConversion'
  | 'cpc'
  | 'drr'

export type KpiIconTone = 'violet' | 'blue' | 'green' | 'amber' | 'pink' | 'slate'

export interface KpiMetricDef {
  key: KpiMetricKey
  /** Ключ поля в AggregatedMetrics */
  field: keyof AggregatedMetrics
  label: string
  lowerIsBetter: boolean
  isPercent: boolean
  /** Формат с суффиксом валюты */
  isMoney: boolean
  iconTone: KpiIconTone
}

/** Первый ряд — 5 KPI (как в макете). */
export const KPI_PRIMARY: KpiMetricDef[] = [
  { key: 'transitions', field: 'transitions', label: 'Переходы в карточку', lowerIsBetter: false, isPercent: false, isMoney: false, iconTone: 'violet' },
  { key: 'cart', field: 'cart', label: 'Положили в корзину', lowerIsBetter: false, isPercent: false, isMoney: false, iconTone: 'blue' },
  { key: 'orders', field: 'orders', label: 'Заказали товаров', lowerIsBetter: false, isPercent: false, isMoney: false, iconTone: 'pink' },
  { key: 'ordersAmount', field: 'ordersAmount', label: 'Заказали на сумму', lowerIsBetter: false, isPercent: false, isMoney: true, iconTone: 'amber' },
  { key: 'costs', field: 'costs', label: 'Затраты на рекламу', lowerIsBetter: true, isPercent: false, isMoney: true, iconTone: 'blue' },
]

/** Второй ряд — 6 KPI. */
export const KPI_SECONDARY: KpiMetricDef[] = [
  { key: 'views', field: 'views', label: 'Просмотры', lowerIsBetter: false, isPercent: false, isMoney: false, iconTone: 'green' },
  { key: 'clicks', field: 'clicks', label: 'Клики', lowerIsBetter: false, isPercent: false, isMoney: false, iconTone: 'blue' },
  { key: 'cartConversion', field: 'cartConversion', label: 'Конверсия в корзину', lowerIsBetter: false, isPercent: true, isMoney: false, iconTone: 'violet' },
  { key: 'orderConversion', field: 'orderConversion', label: 'Конверсия в заказ', lowerIsBetter: false, isPercent: true, isMoney: false, iconTone: 'blue' },
  { key: 'cpc', field: 'cpc', label: 'CPC', lowerIsBetter: true, isPercent: false, isMoney: true, iconTone: 'green' },
  { key: 'drr', field: 'drr', label: 'ДРР', lowerIsBetter: true, isPercent: true, isMoney: false, iconTone: 'pink' },
]

/** Плашка иконки + слабый фон всей KPI-карточки (как в макете). */
export const KPI_ICON_TONES: Record<KpiIconTone, { bg: string; fg: string; cardBg: string }> = {
  violet: { bg: '#EDE9FE', fg: '#7C3AED', cardBg: '#FBF8FF' },
  blue: { bg: '#DBEAFE', fg: '#2563EB', cardBg: '#F7FAFF' },
  green: { bg: '#D1FAE5', fg: '#059669', cardBg: '#F6FDF9' },
  amber: { bg: '#FFEDD5', fg: '#EA580C', cardBg: '#FFFBF5' },
  pink: { bg: '#FCE7F3', fg: '#DB2777', cardBg: '#FFF7FB' },
  slate: { bg: '#F1F5F9', fg: '#475569', cardBg: '#F8FAFC' },
}

export const DAILY_METRIC_OPTIONS: { value: DashboardDailyMetric; label: string }[] = [
  { value: 'orders', label: 'Заказы, шт' },
  { value: 'ordersAmount', label: 'Заказы, ₽' },
  { value: 'transitions', label: 'Переходы' },
  { value: 'cart', label: 'Корзина, шт' },
  { value: 'costs', label: 'Затраты, ₽' },
  { value: 'clicks', label: 'Клики' },
  { value: 'views', label: 'Просмотры' },
]

export function periodColor(index: number): string {
  return PERIOD_COLORS[index % PERIOD_COLORS.length]
}

export function periodBgColor(index: number): string {
  return PERIOD_BG_COLORS[index % PERIOD_BG_COLORS.length]
}

/**
 * Основное значение KPI. Валюта только в заголовке карточки — сюда суффикс не добавляем.
 */
export function formatKpiValue(
  value: number | null | undefined,
  def: KpiMetricDef
): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const num = Number(value)
  if (def.isPercent) {
    return `${num.toLocaleString('ru-RU', { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`
  }
  return num.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
}

/** Компактное значение под sparkline (без длинного суффикса). */
export function formatKpiSparkValue(
  value: number | null | undefined,
  def: KpiMetricDef
): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const num = Number(value)
  if (def.isPercent) {
    return `${num.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`
  }
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}M`
  }
  if (Math.abs(num) >= 10_000) {
    return `${(num / 1_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}K`
  }
  return num.toLocaleString('ru-RU', { maximumFractionDigits: def.isMoney ? 0 : 0 })
}

export function formatChangePercent(change: number | null): string {
  if (change == null || Number.isNaN(change)) return ''
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export function calcChangePercent(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current == null || previous == null || previous === 0) return null
  return ((Number(current) - Number(previous)) / Number(previous)) * 100
}
