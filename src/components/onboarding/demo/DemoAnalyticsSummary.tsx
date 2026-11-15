import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Checkbox, DatePicker, Input, Popover, Tooltip } from 'antd'
import {
  CaretDownOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import locale from 'antd/locale/ru_RU'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { onboardingDemoArticlePath } from '../../../onboarding/demoPaths'
import { DEMO_ARTICLES, type DemoArticle } from '../../../onboarding/demoConstants'
import type { Period } from '../../../types/analytics'
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../../../styles/analytics'
import { DemoPhotoPlaceholder } from './DemoPhotoPlaceholder'

const METRIC_KEYS = [
  'transitions',
  'cart',
  'orders',
  'orders_amount',
  'cart_conversion',
  'order_conversion',
  'views',
  'clicks',
  'costs',
  'cpc',
  'ctr',
  'cpo',
  'drr',
] as const

type MetricKey = (typeof METRIC_KEYS)[number]

/** Базовые метрики, из которых считаются конверсии / CPC / CTR / CPO / ДРР. */
type BaseMetricKey = 'transitions' | 'cart' | 'orders' | 'orders_amount' | 'views' | 'clicks' | 'costs'

const METRIC_NAMES_RU: Record<MetricKey, string> = {
  transitions: 'Переходы в карточку',
  cart: 'Положили в корзину, шт',
  orders: 'Заказали товаров, шт',
  orders_amount: 'Заказали на сумму, руб',
  cart_conversion: 'Конверсия в корзину, %',
  order_conversion: 'Конверсия в заказ, %',
  views: 'Просмотры',
  clicks: 'Клики',
  costs: 'Затраты, руб',
  cpc: 'СРС, руб',
  ctr: 'CTR, %',
  cpo: 'СРО, руб',
  drr: 'ДРР, %',
}

const FUNNEL_METRICS: readonly MetricKey[] = [
  'transitions',
  'cart',
  'orders',
  'orders_amount',
  'cart_conversion',
  'order_conversion',
]

const LOWER_IS_BETTER: readonly MetricKey[] = ['cpc', 'cpo', 'costs', 'drr']

const METRIC_COLUMN_WIDTH_PERCENT = 35

/**
 * Недели демо-сводной под ролик: 4 на экране + 5-я (09.10–15.10) по «+».
 * Индекс 0 — скрытая до «+», 1…4 — стартовый набор.
 */
const DEMO_SUMMARY_WEEKS = [
  { dateFrom: '2026-10-09', dateTo: '2026-10-15' },
  { dateFrom: '2026-10-16', dateTo: '2026-10-22' },
  { dateFrom: '2026-10-23', dateTo: '2026-10-29' },
  { dateFrom: '2026-10-30', dateTo: '2026-11-05' },
  { dateFrom: '2026-11-06', dateTo: '2026-11-12' },
] as const

/** Абсолютные значения по артикулам × 5 недель (см. ТЗ демо-сводной). */
const ARTICLE_BASE: Record<string, Record<BaseMetricKey, readonly number[]>> = {
  '482910375': {
    transitions: [3120, 3200, 3280, 3340, 3400],
    cart: [219, 225, 231, 234, 238],
    orders: [49, 50, 51, 52, 53],
    orders_amount: [73500, 75000, 76500, 78000, 79500],
    views: [25300, 26000, 27000, 27800, 28300],
    clicks: [322, 330, 345, 355, 362],
    costs: [4800, 5000, 5400, 6000, 9300],
  },
  '591028446': {
    transitions: [2340, 2400, 2460, 2510, 2560],
    cart: [164, 168, 173, 176, 179],
    orders: [35, 36, 37, 38, 40],
    orders_amount: [49000, 50400, 51800, 53200, 56000],
    views: [18500, 19000, 19600, 20100, 20400],
    clicks: [229, 235, 245, 252, 258],
    costs: [3150, 3300, 3600, 3800, 4000],
  },
  '603184759': {
    transitions: [2920, 3000, 3080, 3150, 3220],
    cart: [204, 210, 216, 220, 225],
    orders: [46, 47, 49, 50, 52],
    orders_amount: [78200, 79900, 83300, 85000, 88400],
    views: [23400, 24000, 24700, 25300, 25700],
    clicks: [292, 300, 312, 322, 330],
    costs: [3850, 4000, 4300, 4700, 4900],
  },
  '718293560': {
    transitions: [1270, 1300, 1330, 1360, 1390],
    cart: [88, 90, 93, 95, 97],
    orders: [18, 19, 19, 20, 20],
    orders_amount: [23400, 24700, 24700, 26000, 26000],
    views: [9800, 10000, 10300, 10500, 10600],
    clicks: [122, 125, 130, 134, 137],
    costs: [1550, 1600, 1750, 1900, 2000],
  },
  '829405671': {
    transitions: [2050, 2100, 2150, 2190, 2230],
    cart: [143, 147, 152, 155, 156],
    orders: [37, 38, 39, 40, 41],
    orders_amount: [51800, 53200, 54600, 56000, 57400],
    views: [16600, 17000, 17400, 17800, 18000],
    clicks: [205, 210, 218, 227, 233],
    costs: [2950, 3100, 3350, 3700, 3920],
  },
}

function generateDemoSummaryPeriods(): Period[] {
  return DEMO_SUMMARY_WEEKS.slice(1).map((week, index) => ({
    id: index + 1,
    name: `период №${index + 1}`,
    dateFrom: week.dateFrom,
    dateTo: week.dateTo,
  }))
}

function weekIndexForPeriod(period: Period, periods: Period[]): number {
  const known = DEMO_SUMMARY_WEEKS.findIndex((week) => week.dateFrom === period.dateFrom)
  if (known >= 0) {
    return known
  }
  const fallbackOffset = DEMO_SUMMARY_WEEKS.length - periods.length
  const position = periods.findIndex((item) => item.id === period.id)
  return Math.max(0, fallbackOffset + position)
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function deriveMetric(metricKey: MetricKey, base: Record<BaseMetricKey, number>): number {
  switch (metricKey) {
    case 'cart_conversion':
      return base.transitions > 0 ? round2((base.cart / base.transitions) * 100) : 0
    case 'order_conversion':
      return base.transitions > 0 ? round2((base.orders / base.transitions) * 100) : 0
    case 'cpc':
      return base.clicks > 0 ? round2(base.costs / base.clicks) : 0
    case 'ctr':
      return base.views > 0 ? round2((base.clicks / base.views) * 100) : 0
    case 'cpo':
      return base.orders > 0 ? round2(base.costs / base.orders) : 0
    case 'drr':
      return base.orders_amount > 0 ? round2((base.costs / base.orders_amount) * 100) : 0
    default:
      return base[metricKey]
  }
}

function articleBaseAt(nmId: string, weekIndex: number): Record<BaseMetricKey, number> {
  const series = ARTICLE_BASE[nmId]
  if (!series) {
    return {
      transitions: 0,
      cart: 0,
      orders: 0,
      orders_amount: 0,
      views: 0,
      clicks: 0,
      costs: 0,
    }
  }
  const safeIndex = Math.min(Math.max(weekIndex, 0), series.transitions.length - 1)
  return {
    transitions: series.transitions[safeIndex],
    cart: series.cart[safeIndex],
    orders: series.orders[safeIndex],
    orders_amount: series.orders_amount[safeIndex],
    views: series.views[safeIndex],
    clicks: series.clicks[safeIndex],
    costs: series.costs[safeIndex],
  }
}

function aggregateBase(articles: readonly DemoArticle[], weekIndex: number): Record<BaseMetricKey, number> {
  return articles.reduce(
    (acc, article) => {
      const values = articleBaseAt(article.nmId, weekIndex)
      acc.transitions += values.transitions
      acc.cart += values.cart
      acc.orders += values.orders
      acc.orders_amount += values.orders_amount
      acc.views += values.views
      acc.clicks += values.clicks
      acc.costs += values.costs
      return acc
    },
    {
      transitions: 0,
      cart: 0,
      orders: 0,
      orders_amount: 0,
      views: 0,
      clicks: 0,
      costs: 0,
    },
  )
}

function isPercentMetric(metricKey: MetricKey): boolean {
  return metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr'
}

function formatValue(value: number | null): string {
  if (value == null) return '-'
  return value.toLocaleString('ru-RU')
}

function formatPercent(value: number | null): string {
  if (value == null) return '-%'
  return `${value.toFixed(2)}%`
}

function formatChangePercent(value: number | null): string {
  if (value == null) return '-%'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatPeriodDates(period: Period): string {
  return `${dayjs(period.dateFrom).format('DD.MM')} - ${dayjs(period.dateTo).format('DD.MM')}`
}

function changePercent(current: number, previous: number | null): number | null {
  if (previous == null || previous === 0) {
    return null
  }
  return ((current - previous) / previous) * 100
}

function changeColor(metricKey: MetricKey, percent: number | null): string {
  if (percent == null) {
    return colors.textSecondary
  }
  if (LOWER_IS_BETTER.includes(metricKey)) {
    return percent <= 0 ? colors.success : colors.error
  }
  return percent >= 0 ? colors.success : colors.error
}

function metricValue(
  metricKey: MetricKey,
  period: Period,
  periods: Period[],
  articles: readonly DemoArticle[],
  nmId?: string,
): number {
  const weekIndex = weekIndexForPeriod(period, periods)
  const base = nmId != null ? articleBaseAt(nmId, weekIndex) : aggregateBase(articles, weekIndex)
  return deriveMetric(metricKey, base)
}

function PeriodPicker({
  period,
  periodsCount,
  onPeriodChange,
  onRemovePeriod,
  datePickerTourId,
}: {
  period: Period
  periodsCount: number
  onPeriodChange: (periodId: number, dates: [Dayjs, Dayjs]) => void
  onRemovePeriod: (periodId: number) => void
  datePickerTourId?: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <div
      data-tour-id={datePickerTourId}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        maxWidth: 220,
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, textAlign: 'center' }}>{period.name}</div>
      <DatePicker.RangePicker
        locale={locale.DatePicker}
        value={[dayjs(period.dateFrom), dayjs(period.dateTo)]}
        onChange={(dates) => {
          if (dates?.[0] != null && dates[1] != null) {
            onPeriodChange(period.id, [dates[0], dates[1]])
          }
        }}
        allowClear={false}
        format="DD.MM.YYYY"
        separator="→"
      />
      {periodsCount > 2 && isHovered && (
        <Tooltip title="Удалить период">
          <button
            type="button"
            onClick={() => onRemovePeriod(period.id)}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: borderRadius.full,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bgWhite,
              color: colors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              lineHeight: 1,
              padding: 0,
              boxShadow: shadows.sm,
            }}
          >
            <DeleteOutlined />
          </button>
        </Tooltip>
      )}
    </div>
  )
}

/**
 * Учебная сводная: те же фильтры, периоды и метрики, что на живой странице.
 */
export default function DemoAnalyticsSummary() {
  const [periods, setPeriods] = useState<Period[]>(() => generateDemoSummaryPeriods())
  const [expandedMetrics, setExpandedMetrics] = useState<Set<MetricKey>>(new Set())
  const [search, setSearch] = useState('')
  const [selectedNmIds, setSelectedNmIds] = useState<string[]>(() => DEMO_ARTICLES.map((a) => a.nmId))
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(true)
  const [onlyPriority, setOnlyPriority] = useState(false)
  const [onlyInAdvertising, setOnlyInAdvertising] = useState(false)

  const selectedSet = useMemo(() => new Set(selectedNmIds), [selectedNmIds])

  const visibleArticles = useMemo(() => {
    return DEMO_ARTICLES.filter((article) => {
      if (selectedNmIds.length > 0 && !selectedSet.has(article.nmId)) {
        return false
      }
      if (onlyPriority && !article.priority) {
        return false
      }
      if (onlyInAdvertising && !article.inAdvertising) {
        return false
      }
      return true
    })
  }, [selectedNmIds, selectedSet, onlyPriority, onlyInAdvertising])

  const filterList = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      return DEMO_ARTICLES
    }
    return DEMO_ARTICLES.filter(
      (a) => a.nmId.includes(q) || a.title.toLowerCase().includes(q) || a.vendorCode.toLowerCase().includes(q),
    )
  }, [search])

  const handlePeriodChange = (periodId: number, dates: [Dayjs, Dayjs]) => {
    let dateFrom = dates[0]
    let dateTo = dates[1]
    if (dateFrom.isAfter(dateTo)) {
      dateFrom = dateTo
    }
    setPeriods((prev) =>
      prev.map((period) =>
        period.id === periodId
          ? { ...period, dateFrom: dateFrom.format('YYYY-MM-DD'), dateTo: dateTo.format('YYYY-MM-DD') }
          : period,
      ),
    )
  }

  const handleAddPeriod = () => {
    if (periods.length >= 5) {
      return
    }
    const earliest = periods.reduce((min, period) => {
      const d = dayjs(period.dateFrom)
      return d.isBefore(min) ? d : min
    }, dayjs(periods[0].dateFrom))
    const knownPrev = DEMO_SUMMARY_WEEKS.find((week) => dayjs(week.dateTo).isSame(earliest.subtract(1, 'day'), 'day'))
    const newEnd = earliest.subtract(1, 'day')
    const newStart = knownPrev != null ? dayjs(knownPrev.dateFrom) : newEnd.subtract(6, 'day')
    const next = [
      {
        id: 0,
        name: `период №${periods.length + 1}`,
        dateFrom: newStart.format('YYYY-MM-DD'),
        dateTo: newEnd.format('YYYY-MM-DD'),
      },
      ...periods,
    ]
    setPeriods(next.map((period, index) => ({ ...period, id: index + 1, name: `период №${index + 1}` })))
  }

  const handleRemovePeriod = (periodId: number) => {
    if (periods.length <= 2) {
      return
    }
    setPeriods(
      periods
        .filter((period) => period.id !== periodId)
        .map((period, index) => ({ ...period, id: index + 1, name: `период №${index + 1}` })),
    )
  }

  const toggleMetric = (metricKey: MetricKey) => {
    setExpandedMetrics((prev) => {
      const next = new Set(prev)
      if (next.has(metricKey)) {
        next.delete(metricKey)
      } else {
        next.add(metricKey)
      }
      return next
    })
  }

  const toggleFilterNmId = (nmId: string, checked: boolean) => {
    setSelectedNmIds((prev) => {
      if (checked) {
        return prev.includes(nmId) ? prev : [...prev, nmId]
      }
      return prev.filter((id) => id !== nmId)
    })
  }

  return (
    <div
      style={{
        padding: `${spacing.lg} ${spacing.md}`,
        width: '100%',
        backgroundColor: colors.bgGray,
        minHeight: '100vh',
      }}
    >
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl }}>
          <Input
            placeholder="Поиск по артикулу или названию"
            prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 360, maxWidth: 360, borderRadius: borderRadius.sm, color: colors.textPrimary }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <Popover
              title="Фильтр артикулов"
              trigger="click"
              placement="bottomLeft"
              overlayStyle={{ maxWidth: 450 }}
              content={
                <div style={{ width: 400, maxHeight: 'min(520px, calc(100vh - 160px))', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Input
                    placeholder="Поиск по артикулу или названию"
                    prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ marginBottom: 12 }}
                    allowClear
                  />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <Button size="small" onClick={() => setSelectedNmIds(DEMO_ARTICLES.map((a) => a.nmId))}>
                      Выбрать все
                    </Button>
                    <Button size="small" onClick={() => setSelectedNmIds([])}>
                      Снять все
                    </Button>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    {filterList.map((article) => (
                      <div
                        key={article.nmId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: `1px solid ${colors.borderLight}`,
                        }}
                      >
                        <Checkbox
                          checked={selectedSet.has(article.nmId)}
                          onChange={(e) => toggleFilterNmId(article.nmId, e.target.checked)}
                          style={{ marginRight: 12 }}
                        />
                        <span style={{ marginRight: 12 }}>
                          <DemoPhotoPlaceholder width={40} height={40} src={article.photoUrl} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: colors.textSecondary }}>{article.nmId}</div>
                          <div style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {article.title}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <Button
                icon={<FilterOutlined />}
                data-tour-id={ONBOARDING_TARGETS.SUMMARY_FILTER}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Фильтр
                <span
                  style={{
                    backgroundColor: colors.primary,
                    color: 'white',
                    borderRadius: 10,
                    padding: '0 8px',
                    fontSize: 12,
                    marginLeft: 4,
                  }}
                >
                  {selectedNmIds.length}/{DEMO_ARTICLES.length}
                </span>
              </Button>
            </Popover>
            <Checkbox checked={onlyWithPhoto} onChange={(e) => setOnlyWithPhoto(e.target.checked)}>
              Только с фото
            </Checkbox>
            <Checkbox checked={onlyPriority} onChange={(e) => setOnlyPriority(e.target.checked)}>
              Только приоритетные
            </Checkbox>
            <Tooltip title="Только артикулы, привязанные к незавершённым рекламным кампаниям кабинета">
              <Checkbox checked={onlyInAdvertising} onChange={(e) => setOnlyInAdvertising(e.target.checked)}>
                Только в рекламе
              </Checkbox>
            </Tooltip>
          </div>
        </div>

        <div
          data-tour-id={ONBOARDING_TARGETS.SUMMARY_PERIODS}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}
        >
          <div style={{ fontSize: 14, fontWeight: 400, color: colors.textPrimary, textAlign: 'center', whiteSpace: 'nowrap' }}>
            Выберите периоды для сравнения
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {periods.map((period) => (
              <PeriodPicker
                key={period.id}
                period={period}
                periodsCount={periods.length}
                onPeriodChange={handlePeriodChange}
                onRemovePeriod={handleRemovePeriod}
                datePickerTourId={ONBOARDING_TARGETS.SUMMARY_PERIOD_DATES}
              />
            ))}
            {periods.length < 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 32 }}>
                <Tooltip title="Добавить период">
                  <button
                    type="button"
                    data-tour-id={ONBOARDING_TARGETS.SUMMARY_ADD_PERIOD}
                    aria-label="Добавить период"
                    onClick={handleAddPeriod}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: borderRadius.full,
                      border: `2px dashed ${colors.border}`,
                      backgroundColor: colors.bgWhite,
                      color: colors.textSecondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      lineHeight: 1,
                      padding: 0,
                      marginTop: 20,
                      transition: transitions.normal,
                      boxShadow: shadows.sm,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary
                      e.currentTarget.style.color = colors.primary
                      e.currentTarget.style.backgroundColor = colors.primaryLight
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.color = colors.textSecondary
                      e.currentTarget.style.backgroundColor = colors.bgWhite
                    }}
                  >
                    <PlusOutlined />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: colors.bgWhite,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.xl,
          boxShadow: shadows.md,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ overflowX: 'auto', width: '100%', minWidth: 0 }}>
          <table style={{ width: '100%', minWidth: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: `${METRIC_COLUMN_WIDTH_PERCENT}%` }} />
              {periods.map((period) => (
                <col key={period.id} style={{ width: `${(100 - METRIC_COLUMN_WIDTH_PERCENT) / periods.length}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: colors.bgGrayLight }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.border}`,
                    ...typography.h3,
                    fontWeight: 600,
                  }}
                >
                  Метрика
                </th>
                {periods.map((period) => (
                  <th
                    key={period.id}
                    style={{
                      textAlign: 'center',
                      padding: spacing.md,
                      borderBottom: `2px solid ${colors.border}`,
                      ...typography.h3,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box',
                    }}
                  >
                    {formatPeriodDates(period)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_KEYS.map((metricKey, metricIndex) => {
                const category = FUNNEL_METRICS.includes(metricKey) ? 'funnel' : 'advertising'
                const isExpanded = expandedMetrics.has(metricKey)
                const rowBg = category === 'funnel' ? colors.funnelBg : colors.advertisingBg
                const rowHover = category === 'funnel' ? colors.funnelBgHover : colors.advertisingBgHover
                return (
                  <MetricBlock
                    key={metricKey}
                    metricKey={metricKey}
                    metricIndex={metricIndex}
                    isExpanded={isExpanded}
                    rowBg={rowBg}
                    rowHover={rowHover}
                    periods={periods}
                    articles={visibleArticles}
                    aggregateArticles={visibleArticles}
                    onToggle={() => toggleMetric(metricKey)}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MetricBlock({
  metricKey,
  metricIndex,
  isExpanded,
  rowBg,
  rowHover,
  periods,
  articles,
  aggregateArticles,
  onToggle,
}: {
  metricKey: MetricKey
  metricIndex: number
  isExpanded: boolean
  rowBg: string
  rowHover: string
  periods: Period[]
  articles: readonly DemoArticle[]
  aggregateArticles: readonly DemoArticle[]
  onToggle: () => void
}) {
  const percent = isPercentMetric(metricKey)
  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          backgroundColor: rowBg,
          cursor: 'pointer',
          transition: transitions.fast,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = rowHover
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = rowBg
        }}
      >
        <td
          style={{
            padding: spacing.md,
            borderBottom: `1px solid ${colors.borderLight}`,
            ...typography.body,
            fontWeight: 500,
            color: colors.textPrimary,
            verticalAlign: 'middle',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <span
              data-tour-id={metricIndex === 0 ? ONBOARDING_TARGETS.SUMMARY_METRIC_EXPAND : undefined}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              {isExpanded ? <CaretDownOutlined style={{ fontSize: 12 }} /> : <CaretRightOutlined style={{ fontSize: 12 }} />}
            </span>
            {METRIC_NAMES_RU[metricKey]}
          </div>
        </td>
        {periods.map((period, periodIndex) => {
          const value = metricValue(metricKey, period, periods, aggregateArticles)
          const prevPeriod = periodIndex > 0 ? periods[periodIndex - 1] : null
          const prev = prevPeriod != null ? metricValue(metricKey, prevPeriod, periods, aggregateArticles) : null
          const delta = changePercent(value, prev)
          const empty = value === 0
          return (
            <td
              key={period.id}
              style={{
                textAlign: 'center',
                padding: spacing.md,
                borderBottom: `1px solid ${colors.borderLight}`,
                color: empty ? colors.textMuted : colors.textPrimary,
                ...typography.number,
                verticalAlign: 'middle',
              }}
            >
              <div style={{ fontWeight: 500 }}>{percent ? formatPercent(value) : formatValue(value)}</div>
              {delta != null && (
                <div
                  style={{
                    ...typography.bodySmall,
                    color: changeColor(metricKey, delta),
                    fontWeight: 600,
                    marginTop: spacing.xs,
                  }}
                >
                  {formatChangePercent(delta)}
                </div>
              )}
            </td>
          )
        })}
      </tr>
      {isExpanded &&
        articles.map((article, articleIndex) => (
          <tr
            key={`${metricKey}-${article.nmId}`}
            style={{ backgroundColor: articleIndex % 2 === 0 ? colors.bgWhite : colors.bgGrayLight }}
          >
            <td
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                borderBottom: `1px solid ${colors.borderLight}`,
                ...typography.body,
                fontWeight: 500,
                verticalAlign: 'middle',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                <DemoPhotoPlaceholder width={100} height={100} src={article.photoUrl} />
                <div style={{ minWidth: 0 }}>
                  <Link to={onboardingDemoArticlePath(article.nmId)} style={{ color: colors.primary, fontWeight: 500, textDecoration: 'none' }}>{article.nmId}</Link>
                  <div
                    style={{
                      fontSize: typography.bodySmall.fontSize,
                      color: colors.textSecondary,
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                    title={article.title}
                  >
                    {article.title}
                  </div>
                </div>
              </div>
            </td>
            {periods.map((period, periodIndex) => {
              const value = metricValue(metricKey, period, periods, aggregateArticles, article.nmId)
              const prevPeriod = periodIndex > 0 ? periods[periodIndex - 1] : null
              const prev =
                prevPeriod != null ? metricValue(metricKey, prevPeriod, periods, aggregateArticles, article.nmId) : null
              const delta = changePercent(value, prev)
              const empty = value === 0
              return (
                <td
                  key={period.id}
                  style={{
                    textAlign: 'center',
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    color: empty ? colors.textMuted : colors.textPrimary,
                    verticalAlign: 'middle',
                  }}
                >
                  <div style={{ ...typography.number, fontWeight: 400 }}>
                    {empty ? '-' : percent ? formatPercent(value) : formatValue(value)}
                  </div>
                  {delta != null && (
                    <div
                      style={{
                        ...typography.bodySmall,
                        color: changeColor(metricKey, delta),
                        fontWeight: 600,
                        marginTop: spacing.xs,
                      }}
                    >
                      {formatChangePercent(delta)}
                    </div>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
    </>
  )
}
