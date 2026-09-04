import { useMemo, useState } from 'react'
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
import { DEMO_ARTICLES } from '../../../onboarding/demoConstants'
import { generateDefaultPeriods } from '../../../utils/periodGenerator'
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

/** Учебные значения по периодам (до 5 колонок). */
const AGGREGATED: Record<MetricKey, number[]> = {
  transitions: [12450, 9380, 10880, 12610, 13140],
  cart: [842, 631, 790, 915, 948],
  orders: [186, 142, 198, 214, 221],
  orders_amount: [284000, 213500, 301200, 348900, 362100],
  cart_conversion: [6.76, 6.73, 7.26, 7.26, 7.21],
  order_conversion: [1.49, 1.51, 1.82, 1.7, 1.68],
  views: [98200, 74100, 85600, 99300, 102400],
  clicks: [1240, 980, 1310, 1518, 1580],
  costs: [18400, 15200, 19850, 21150, 21980],
  cpc: [14.84, 15.51, 15.15, 13.93, 13.91],
  ctr: [1.26, 1.32, 1.53, 1.53, 1.54],
  cpo: [98.92, 107.04, 100.25, 98.83, 99.46],
  drr: [6.48, 7.12, 6.59, 6.06, 6.07],
}

const ARTICLE_SHARES = [0.28, 0.22, 0.24, 0.12, 0.14]

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

function metricValue(metricKey: MetricKey, periodIndex: number, articleIndex?: number): number {
  const base = AGGREGATED[metricKey][periodIndex] ?? AGGREGATED[metricKey][AGGREGATED[metricKey].length - 1]
  if (articleIndex == null) {
    return base
  }
  if (isPercentMetric(metricKey) || metricKey === 'cpc' || metricKey === 'cpo') {
    return Number((base * (0.9 + articleIndex * 0.035)).toFixed(2))
  }
  return Math.round(base * ARTICLE_SHARES[articleIndex])
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
        data-tour-id={datePickerTourId}
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
  const [periods, setPeriods] = useState<Period[]>(() => generateDefaultPeriods())
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
    const newEnd = earliest.subtract(1, 'day')
    const newStart = newEnd.subtract(2, 'day')
    const next = [
      ...periods,
      {
        id: periods.length + 1,
        name: `период №${periods.length + 1}`,
        dateFrom: newStart.format('YYYY-MM-DD'),
        dateTo: newEnd.format('YYYY-MM-DD'),
      },
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
                          <DemoPhotoPlaceholder width={40} height={40} />
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
          <div style={{ fontSize: 14, fontWeight: 400, color: colors.textPrimary, textAlign: 'center', whiteSpace: 'nowrap' }}>
            Выберите периоды для сравнения
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {periods.map((period, periodIndex) => (
              <PeriodPicker
                key={period.id}
                period={period}
                periodsCount={periods.length}
                onPeriodChange={handlePeriodChange}
                onRemovePeriod={handleRemovePeriod}
                datePickerTourId={periodIndex === 1 ? ONBOARDING_TARGETS.SUMMARY_PERIOD_DATES : undefined}
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
  onToggle,
}: {
  metricKey: MetricKey
  metricIndex: number
  isExpanded: boolean
  rowBg: string
  rowHover: string
  periods: Period[]
  articles: typeof DEMO_ARTICLES
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
          const value = metricValue(metricKey, periodIndex)
          const prev = periodIndex > 0 ? metricValue(metricKey, periodIndex - 1) : null
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
                <DemoPhotoPlaceholder width={100} height={100} />
                <div style={{ minWidth: 0 }}>
                  <span style={{ color: colors.primary, fontWeight: 500 }}>{article.nmId}</span>
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
              const value = metricValue(metricKey, periodIndex, articleIndex)
              const prev = periodIndex > 0 ? metricValue(metricKey, periodIndex - 1, articleIndex) : null
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
