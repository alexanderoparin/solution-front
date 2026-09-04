import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Checkbox, DatePicker, Input, Select, Switch } from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import locale from 'antd/locale/ru_RU'
import FboFbsStocksSwitch, { type StocksFulfillment } from '../../FboFbsStocksSwitch'
import CampaignDetailViewSwitch, { type CampaignDetailViewMode } from '../../CampaignDetailViewSwitch'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { ONBOARDING_DEMO_MANAGE_PATH } from '../../../onboarding/demoPaths'
import {
  DEMO_ARTICLES,
  DEMO_CAMPAIGN_NAME,
  DEMO_CAMPAIGN_WB_ID,
  DEMO_WAREHOUSE_SIZES,
  DEMO_WAREHOUSES,
} from '../../../onboarding/demoConstants'
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../../../styles/analytics'
import { demoCard, demoPageWrap } from './demoUi'
import DemoArticleChip from './DemoArticleChip'
import { DemoPhotoPlaceholder } from './DemoPhotoPlaceholder'

const COMBO_PHOTO_SIZE = 80
const ALL_ARTICLES = 'all'
const FONT_PAGE = { fontSize: 12 as const }
const STOCKS_NM_SELECT_STYLE = { width: 115, minWidth: 115, flexShrink: 0 } as const
const ARTICLE_SHARES = [0.28, 0.22, 0.24, 0.12, 0.14]
const METRICS_WITH_CHANGE_NUMBER = ['transitions', 'cart', 'orders', 'views', 'clicks']
const LOWER_IS_BETTER = ['cpc', 'cpo', 'costs', 'drr']

const FUNNELS = {
  general: {
    name: 'Общая воронка',
    metrics: [
      { key: 'transitions', name: 'Переходы\nв карточку' },
      { key: 'cart', name: 'Положили\nв корзину, шт' },
      { key: 'orders', name: 'Заказали\nтоваров, шт' },
      { key: 'orders_amount', name: 'Заказали\nна сумму, руб' },
      { key: 'cart_conversion', name: 'Конверсия\nв корзину, %' },
      { key: 'order_conversion', name: 'Конверсия\nв заказ, %' },
    ],
  },
  advertising: {
    name: 'Рекламная воронка',
    metrics: [
      { key: 'views', name: 'Просмотры' },
      { key: 'clicks', name: 'Клики' },
      { key: 'costs', name: 'Затраты,\nруб' },
      { key: 'cpc', name: 'СРС,\nруб' },
      { key: 'ctr', name: 'CTR, %' },
      { key: 'cpo', name: 'СРО,\nруб' },
      { key: 'drr', name: 'ДРР, %' },
    ],
  },
  pricing: {
    name: 'Ценообразование',
    metrics: [
      { key: 'price_before_discount', name: 'Цена до\nскидки, руб' },
      { key: 'seller_discount', name: 'Скидка\nпродавца, %' },
      { key: 'price_with_discount', name: 'Цена со\nскидкой, руб' },
      { key: 'wb_club_discount', name: 'Скидка\nWB Клуба, %' },
      { key: 'price_with_wb_club', name: 'Цена со скидкой\nWB Клуба, руб' },
      { key: 'price_with_spp', name: 'Цена с СПП,\nруб' },
      { key: 'spp_amount', name: 'СПП,\nруб' },
      { key: 'spp_percent', name: 'СПП, %' },
    ],
  },
} as const

type FunnelKey = keyof typeof FUNNELS
type MetricKey = (typeof FUNNELS)[FunnelKey]['metrics'][number]['key']
type DailyMetrics = Record<MetricKey, number>

const FUNNEL_ORDER: FunnelKey[] = ['general', 'advertising', 'pricing']
const WAREHOUSE_BASE_TOTAL = DEMO_WAREHOUSES.reduce((sum, row) => sum + row.amount, 0)

const DEMO_CLUSTERS = [
  { query: 'пижама женская хлопок', avgPos: 4.2, clicks: 186, atbs: 41, orders: 18, spend: 2480, cpo: 137.78, cpc: 13.33 },
  { query: 'пижама с длинным рукавом', avgPos: 6.8, clicks: 142, atbs: 28, orders: 12, spend: 1910, cpo: 159.17, cpc: 13.45 },
  { query: 'халат махровый женский', avgPos: 9.1, clicks: 98, atbs: 19, orders: 8, spend: 1340, cpo: 167.5, cpc: 13.67 },
  { query: 'сорочка ночная', avgPos: 11.4, clicks: 64, atbs: 11, orders: 5, spend: 880, cpo: 176, cpc: 13.75 },
  { query: 'комплект постельного белья сатин', avgPos: 7.6, clicks: 121, atbs: 22, orders: 9, spend: 1640, cpo: 182.22, cpc: 13.55 },
  { query: 'домашний костюм женский', avgPos: 14.3, clicks: 47, atbs: 8, orders: 3, spend: 640, cpo: 213.33, cpc: 13.62 },
] as const

function formatValue(value: number | null): string {
  if (value == null || value === 0) return '-'
  return value.toLocaleString('ru-RU')
}

function formatPercent(value: number | null): string {
  if (value == null || value === 0) return '-'
  return `${value.toFixed(2).replace('.', ',')}%`
}

function formatCurrency(value: number | null): string {
  if (value == null || value === 0) return '-'
  return `${value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`
}

function formatMetric(key: string, value: number | null): string {
  if (value == null || value === 0) return '-'
  const isPercent = key.includes('conversion') || key === 'ctr' || key === 'drr' || key === 'seller_discount' || key === 'wb_club_discount' || key === 'spp_percent'
  const isCurrency = key === 'orders_amount' || key === 'costs' || key === 'cpc' || key === 'cpo' || key.startsWith('price_') || key === 'spp_amount'
  if (isPercent) return formatPercent(value)
  if (isCurrency) return formatCurrency(value)
  return formatValue(value)
}

function funnelBg(funnelKey: FunnelKey): string {
  if (funnelKey === 'general') return colors.funnelBg
  if (funnelKey === 'advertising') return colors.advertisingBg
  return colors.pricingBg
}

function getDatesInRange(from: Dayjs, to: Dayjs): string[] {
  const days: string[] = []
  let current = from.startOf('day')
  const end = to.startOf('day')
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    days.push(current.format('YYYY-MM-DD'))
    current = current.add(1, 'day')
  }
  return days
}

function dayWave(date: string): number {
  let hash = 0
  for (let index = 0; index < date.length; index += 1) {
    hash = (hash * 31 + date.charCodeAt(index)) | 0
  }
  return 1 + Math.sin(Math.abs(hash) / 17) * 0.11
}

function recomputeDerived(metrics: DailyMetrics): DailyMetrics {
  const next = { ...metrics }
  next.cart_conversion = next.transitions > 0 ? (next.cart / next.transitions) * 100 : 0
  next.order_conversion = next.transitions > 0 ? (next.orders / next.transitions) * 100 : 0
  next.ctr = next.views > 0 ? (next.clicks / next.views) * 100 : 0
  next.cpc = next.clicks > 0 ? next.costs / next.clicks : 0
  next.cpo = next.orders > 0 ? next.costs / next.orders : 0
  next.drr = next.orders_amount > 0 ? (next.costs / next.orders_amount) * 100 : 0
  return next
}

function buildDayMetrics(date: string, share: number): DailyMetrics {
  const wave = dayWave(date) * share
  const views = Math.round(3480 * wave)
  const clicks = Math.round(108 * wave)
  const transitions = Math.round(92 * wave)
  const cart = Math.round(15 * wave)
  const orders = Math.round(7 * wave)
  const costs = Math.round(1510 * wave)
  return recomputeDerived({
    transitions,
    cart,
    orders,
    orders_amount: orders * 2180,
    cart_conversion: 0,
    order_conversion: 0,
    views,
    clicks,
    costs,
    cpc: 0,
    ctr: 0,
    cpo: 0,
    drr: 0,
    price_before_discount: 2490,
    seller_discount: 20,
    price_with_discount: 1992,
    wb_club_discount: 5,
    price_with_wb_club: 1892.4,
    price_with_spp: 1741,
    spp_amount: 151.4,
    spp_percent: 8,
  })
}

function sumMetrics(rows: DailyMetrics[]): DailyMetrics | null {
  if (rows.length === 0) return null
  const acc = { ...rows[0] }
  for (const key of Object.keys(acc) as MetricKey[]) {
    acc[key] = 0
  }
  for (const row of rows) {
    acc.transitions += row.transitions
    acc.cart += row.cart
    acc.orders += row.orders
    acc.orders_amount += row.orders_amount
    acc.views += row.views
    acc.clicks += row.clicks
    acc.costs += row.costs
    acc.price_before_discount += row.price_before_discount
    acc.seller_discount += row.seller_discount
    acc.price_with_discount += row.price_with_discount
    acc.wb_club_discount += row.wb_club_discount
    acc.price_with_wb_club += row.price_with_wb_club
    acc.price_with_spp += row.price_with_spp
    acc.spp_amount += row.spp_amount
    acc.spp_percent += row.spp_percent
  }
  const count = rows.length
  acc.price_before_discount /= count
  acc.seller_discount /= count
  acc.price_with_discount /= count
  acc.wb_club_discount /= count
  acc.price_with_wb_club /= count
  acc.price_with_spp /= count
  acc.spp_amount /= count
  acc.spp_percent /= count
  return recomputeDerived(acc)
}

function scaleMetrics(metrics: DailyMetrics, share: number): DailyMetrics {
  return recomputeDerived({
    ...metrics,
    transitions: Math.round(metrics.transitions * share),
    cart: Math.round(metrics.cart * share),
    orders: Math.round(metrics.orders * share),
    orders_amount: Math.round(metrics.orders_amount * share),
    views: Math.round(metrics.views * share),
    clicks: Math.round(metrics.clicks * share),
    costs: Math.round(metrics.costs * share),
  })
}

function articleShare(nmId: string): number {
  const index = DEMO_ARTICLES.findIndex((article) => article.nmId === nmId)
  return ARTICLE_SHARES[index] ?? 0.2
}

function defaultRange(): [Dayjs, Dayjs] {
  const end = dayjs().subtract(1, 'day')
  return [end.subtract(13, 'day'), end]
}

function defaultPeriod1(): [Dayjs, Dayjs] {
  const end = dayjs().subtract(1, 'day')
  return [end.subtract(13, 'day'), end.subtract(7, 'day')]
}

function defaultPeriod2(): [Dayjs, Dayjs] {
  const end = dayjs().subtract(1, 'day')
  return [end.subtract(6, 'day'), end]
}

function renderDiff(key: string, first: number | null, second: number | null): { text: string; color: string } {
  if (first == null || first === 0 || second == null || second === 0) {
    return { text: '-', color: colors.textPrimary }
  }
  const isPercentMetric = key.includes('conversion') || key === 'ctr' || key === 'drr'
  const lowerIsBetter = LOWER_IS_BETTER.includes(key)
  if (isPercentMetric) {
    const diffPoints = Math.round((second - first) * 100) / 100
    if (Math.abs(diffPoints) < 0.01) return { text: '-', color: colors.textPrimary }
    const good = lowerIsBetter ? diffPoints < 0 : diffPoints > 0
    return { text: `${diffPoints > 0 ? '+' : ''}${formatPercent(diffPoints)}`, color: good ? colors.success : colors.error }
  }
  const diff = Math.round(((second - first) / first) * 10000) / 100
  if (Math.abs(diff) < 0.01) return { text: '-', color: colors.textPrimary }
  const good = lowerIsBetter ? diff < 0 : diff > 0
  return { text: `${diff > 0 ? '+' : ''}${formatPercent(diff)}`, color: good ? colors.success : colors.error }
}

/**
 * Учебная карточка кампании: воронки, сравнение периодов, остатки и заметки.
 */
export default function DemoAdvertisingCampaignDetail() {
  const [viewMode, setViewMode] = useState<CampaignDetailViewMode>('statistics')
  const [showChart, setShowChart] = useState(false)
  const [campaignGoal, setCampaignGoal] = useState('Держать ДРР в пределах 12% и не терять наличие на Коледино.')
  const [selectedFunnelKeys, setSelectedFunnelKeys] = useState<FunnelKey[]>(['general', 'advertising'])
  const [selectedFunnelArticle, setSelectedFunnelArticle] = useState<string>(ALL_ARTICLES)
  const [clusterSearch, setClusterSearch] = useState('')
  const [selectedClusterNmId, setSelectedClusterNmId] = useState(DEMO_ARTICLES[0].nmId)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(defaultRange)
  const [period1, setPeriod1] = useState<[Dayjs, Dayjs]>(defaultPeriod1)
  const [period2, setPeriod2] = useState<[Dayjs, Dayjs]>(defaultPeriod2)
  const [fulfillment, setFulfillment] = useState<StocksFulfillment>('FBO')
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(null)
  const [stockNmId, setStockNmId] = useState(DEMO_ARTICLES[0].nmId)
  const [hoveredPeriodNmId, setHoveredPeriodNmId] = useState<string | null>(null)

  const share = selectedFunnelArticle === ALL_ARTICLES ? 1 : articleShare(selectedFunnelArticle)
  const rangeDates = useMemo(() => getDatesInRange(dateRange[0], dateRange[1]), [dateRange])
  const rangeDatesDesc = useMemo(() => [...rangeDates].reverse(), [rangeDates])
  const dailyByDate = useMemo(() => {
    const map: Record<string, DailyMetrics> = {}
    for (const date of rangeDates) {
      map[date] = buildDayMetrics(date, share)
    }
    return map
  }, [rangeDates, share])
  const periodTotal = useMemo(
    () => sumMetrics(rangeDates.map((date) => dailyByDate[date])),
    [dailyByDate, rangeDates],
  )

  const period1Total = useMemo(
    () => sumMetrics(getDatesInRange(period1[0], period1[1]).map((date) => buildDayMetrics(date, 1))),
    [period1],
  )
  const period2Total = useMemo(
    () => sumMetrics(getDatesInRange(period2[0], period2[1]).map((date) => buildDayMetrics(date, 1))),
    [period2],
  )

  const metricsWithFunnel = FUNNEL_ORDER.filter((key) => selectedFunnelKeys.includes(key)).flatMap((funnelKey) =>
    FUNNELS[funnelKey].metrics.map((metric) => ({ funnelKey, metric })),
  )
  const totalCols = metricsWithFunnel.length

  const stockArticle = DEMO_ARTICLES.find((article) => article.nmId === stockNmId) ?? DEMO_ARTICLES[0]
  const stocks = useMemo(() => {
    const target = fulfillment === 'FBO' ? stockArticle.fbo : Math.max(stockArticle.fbs, DEMO_WAREHOUSES.length)
    return DEMO_WAREHOUSES.map((row) => ({
      warehouseName: row.warehouseName,
      amount: Math.round((row.amount / WAREHOUSE_BASE_TOTAL) * target),
    }))
  }, [fulfillment, stockArticle])
  const totalAmount = stocks.reduce((sum, row) => sum + row.amount, 0)

  const filteredClusters = DEMO_CLUSTERS.filter((row) =>
    clusterSearch.trim().length === 0 ? true : row.query.toLowerCase().includes(clusterSearch.trim().toLowerCase()),
  )

  const toggleFunnel = (key: FunnelKey) => {
    setSelectedFunnelKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))
  }

  const thPeriod = { textAlign: 'center' as const, padding: spacing.md, borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, fontSize: 12, fontWeight: 600 }
  const tdCell = { padding: spacing.md, borderBottom: `1px solid ${colors.border}`, ...typography.body, fontSize: 12 }

  return (
    <div style={demoPageWrap}>
      <div style={demoCard}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
          <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>{DEMO_CAMPAIGN_NAME}</h1>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: borderRadius.sm,
              backgroundColor: colors.success,
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Активна
          </span>
          <span style={{ ...typography.body, color: colors.textSecondary }}>ID {DEMO_CAMPAIGN_WB_ID}</span>
          <span style={{ ...typography.body, color: colors.textSecondary }}>{DEMO_ARTICLES.length} шт.</span>
          <Link
            to={ONBOARDING_DEMO_MANAGE_PATH}
            data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_MANAGE}
            style={{ marginLeft: 'auto', color: colors.primary, fontSize: 13, textDecoration: 'none' }}
          >
            Управление →
          </Link>
        </div>
        <div style={{ overflowX: 'auto', paddingBottom: spacing.sm }}>
          <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start', minWidth: 'min-content' }}>
            <div
              style={{
                width: 240,
                flexShrink: 0,
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                backgroundColor: colors.bgGrayLight,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 500, color: colors.textSecondary, marginBottom: 4, lineHeight: 1.3 }}>
                Цель на рекламную кампанию:
              </div>
              <Input.TextArea
                value={campaignGoal}
                onChange={(event) => setCampaignGoal(event.target.value)}
                placeholder="Кратко опишите цель по этой рекламной кампании"
                autoSize={{ minRows: 2, maxRows: 4 }}
                maxLength={10000}
                styles={{ textarea: { fontSize: 11, lineHeight: 1.45, minHeight: 52, resize: 'none' } }}
              />
            </div>
            <div data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_ARTICLES} style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
              {DEMO_ARTICLES.map((article) => (
                <DemoArticleChip key={article.nmId} nmId={article.nmId} title={article.title} photoSize={COMBO_PHOTO_SIZE} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <CampaignDetailViewSwitch value={viewMode} onChange={setViewMode} />

      {viewMode === 'statistics' && (
        <div style={demoCard}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div style={{ display: 'flex', marginBottom: spacing.md, alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' }}>
                <DatePicker.RangePicker
                  locale={locale.DatePicker}
                  value={dateRange}
                  onChange={(dates) => dates?.[0] && dates?.[1] && setDateRange([dates[0], dates[1]])}
                  format="DD.MM.YYYY"
                  separator="→"
                  style={{ width: 220 }}
                />
                <span data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_METRICS} style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' }}>
                  <Checkbox checked={selectedFunnelKeys.includes('general')} onChange={() => toggleFunnel('general')}>Общая</Checkbox>
                  <Checkbox checked={selectedFunnelKeys.includes('advertising')} onChange={() => toggleFunnel('advertising')}>Реклама</Checkbox>
                  <Checkbox checked={selectedFunnelKeys.includes('pricing')} onChange={() => toggleFunnel('pricing')}>Цены</Checkbox>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
                <span data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_CHART} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, ...typography.body }}>
                  <Switch checked={showChart} onChange={setShowChart} size="small" />
                  <span>График</span>
                </span>
                <Button type="primary" icon={<DownloadOutlined />} data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_EXPORT}>
                  Выгрузить
                </Button>
              </div>
            </div>
            <div style={{ marginBottom: spacing.md, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, marginRight: spacing.md }}>
                <Checkbox checked={selectedFunnelArticle === ALL_ARTICLES} onChange={() => setSelectedFunnelArticle(ALL_ARTICLES)}>
                  <span style={{ marginLeft: -4 }}>Все</span>
                </Checkbox>
              </span>
              {DEMO_ARTICLES.map((article) => (
                <Checkbox
                  key={article.nmId}
                  checked={selectedFunnelArticle === article.nmId}
                  onChange={() => setSelectedFunnelArticle(article.nmId)}
                >
                  {article.nmId}
                </Checkbox>
              ))}
            </div>
            {totalCols > 0 && (
              <div style={{ maxHeight: 438, overflowY: 'auto', overflowX: 'auto', position: 'relative' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ fontWeight: 700 }}>
                      <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `2px solid ${colors.border}`, fontSize: 12, fontWeight: 700, position: 'sticky', top: 0, left: 0, backgroundColor: colors.bgWhite, zIndex: 2, width: 90 }}>Дата</th>
                      {metricsWithFunnel.map(({ funnelKey, metric }, index) => (
                        <th
                          key={metric.key}
                          style={{
                            textAlign: 'center',
                            padding: '4px 6px',
                            borderBottom: `1px solid ${colors.border}`,
                            borderRight: index === totalCols - 1 ? 'none' : `1px solid ${colors.border}`,
                            fontSize: 10,
                            fontWeight: 700,
                            whiteSpace: 'pre-line',
                            lineHeight: 1.2,
                            backgroundColor: funnelBg(funnelKey),
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          {metric.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rangeDatesDesc.map((date, dateIndex) => {
                      const row = dailyByDate[date]
                      return (
                        <tr key={date}>
                          <td style={{ padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `2px solid ${colors.border}`, fontSize: 12, fontWeight: 500, position: 'sticky', left: 0, backgroundColor: colors.bgWhite, zIndex: 1 }}>
                            {dayjs(date).format('DD.MM.YYYY')}
                          </td>
                          {metricsWithFunnel.map(({ funnelKey, metric }, index) => {
                            const value = row[metric.key]
                            const prevDate = rangeDatesDesc[dateIndex + 1]
                            const change = prevDate != null ? value - dailyByDate[prevDate][metric.key] : null
                            const changeColor =
                              change != null && change !== 0
                                ? (LOWER_IS_BETTER.includes(metric.key) ? (change < 0 ? colors.success : colors.error) : (change > 0 ? colors.success : colors.error))
                                : undefined
                            return (
                              <td
                                key={metric.key}
                                style={{
                                  textAlign: 'center',
                                  padding: '4px 6px',
                                  borderBottom: `1px solid ${colors.border}`,
                                  borderRight: index === totalCols - 1 ? 'none' : `1px solid ${colors.border}`,
                                  backgroundColor: funnelBg(funnelKey),
                                  fontSize: 11,
                                  position: 'relative',
                                }}
                              >
                                {formatMetric(metric.key, value)}
                                {change != null && change !== 0 && changeColor != null && (
                                  <div style={{ position: 'absolute', top: 1, right: 2, display: 'flex', alignItems: 'center', fontSize: 9, fontWeight: 600, color: changeColor, lineHeight: 1 }}>
                                    {METRICS_WITH_CHANGE_NUMBER.includes(metric.key) && (
                                      <span>{change > 0 ? '+' : ''}{Math.round(change)}</span>
                                    )}
                                    {change > 0 ? <ArrowUpOutlined style={{ fontSize: 9 }} /> : <ArrowDownOutlined style={{ fontSize: 9 }} />}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                    <tr style={{ backgroundColor: colors.bgGray }}>
                      <td style={{ padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `2px solid ${colors.border}`, borderTop: `2px solid ${colors.border}`, fontSize: 12, fontWeight: 700, position: 'sticky', left: 0, backgroundColor: colors.bgGray, zIndex: 1 }}>
                        Весь период
                      </td>
                      {metricsWithFunnel.map(({ metric }, index) => (
                        <td
                          key={metric.key}
                          style={{
                            textAlign: 'center',
                            padding: '4px 6px',
                            borderBottom: `1px solid ${colors.border}`,
                            borderTop: `2px solid ${colors.border}`,
                            borderRight: index === totalCols - 1 ? 'none' : `1px solid ${colors.border}`,
                            backgroundColor: colors.bgGray,
                            fontSize: 11,
                            fontWeight: 500,
                          }}
                        >
                          {formatMetric(metric.key, periodTotal?.[metric.key] ?? null)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {showChart && (
            <div
              style={{
                height: 160,
                borderRadius: borderRadius.md,
                background: `linear-gradient(180deg, ${colors.primaryLight} 0%, ${colors.bgWhite} 100%)`,
                border: `1px solid ${colors.borderLight}`,
                marginTop: spacing.md,
                overflow: 'hidden',
              }}
            >
              <svg viewBox="0 0 400 160" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <polyline fill="none" stroke={colors.primary} strokeWidth="2.5" points="0,118 40,102 80,108 120,86 160,92 200,70 240,76 280,54 320,60 360,42 400,48" />
              </svg>
            </div>
          )}
        </div>
      )}

      {viewMode === 'clusters' && (
        <div style={demoCard}>
          <div style={{ display: 'flex', marginBottom: spacing.md, alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
              <DatePicker.RangePicker locale={locale.DatePicker} value={dateRange} format="DD.MM.YYYY" separator="→" style={{ width: 220 }} />
              <Input.Search placeholder="Искать кластер" allowClear value={clusterSearch} onChange={(event) => setClusterSearch(event.target.value)} style={{ width: 220 }} />
            </div>
            <Button type="primary" icon={<DownloadOutlined />}>Выгрузить</Button>
          </div>
          <div style={{ marginBottom: spacing.md, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
            {DEMO_ARTICLES.map((article) => (
              <Checkbox key={article.nmId} checked={selectedClusterNmId === article.nmId} onChange={() => setSelectedClusterNmId(article.nmId)}>
                {article.nmId}
              </Checkbox>
            ))}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Кластер', 'Средняя позиция', 'Клики', 'Корзина', 'Заказы, шт', 'Затраты, ₽', 'CPO, ₽', 'CPC, ₽'].map((label, index) => (
                  <th
                    key={label}
                    style={{
                      padding: '10px 12px',
                      borderBottom: `2px solid ${colors.borderHeader}`,
                      textAlign: index === 0 ? 'left' : 'right',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClusters.map((row) => (
                <tr key={row.query}>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.border}`, fontSize: 12 }}>{row.query}</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.border}`, fontSize: 12, textAlign: 'right' }}>{row.avgPos.toFixed(2).replace('.', ',')}</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.border}`, fontSize: 12, textAlign: 'right' }}>{row.clicks}</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.border}`, fontSize: 12, textAlign: 'right' }}>{row.atbs}</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.border}`, fontSize: 12, textAlign: 'right' }}>{row.orders}</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.border}`, fontSize: 12, textAlign: 'right' }}>{formatCurrency(row.spend)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.border}`, fontSize: 12, textAlign: 'right' }}>{formatCurrency(row.cpo)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.border}`, fontSize: 12, textAlign: 'right' }}>{formatCurrency(row.cpc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={demoCard}>
        <h2 style={{ ...typography.h2, margin: '0 0 16px 0', fontSize: 16, color: colors.textPrimary }}>Сравнение периодов</h2>
        {([{ period: 1, dates: period1, setPeriod: setPeriod1, total: period1Total }, { period: 2, dates: period2, setPeriod: setPeriod2, total: period2Total }] as const).map(({ period, dates, setPeriod, total }) => (
          <div key={period} style={{ marginBottom: period === 1 ? spacing.xl : 0 }}>
            <div
              data-tour-id={period === 1 ? ONBOARDING_TARGETS.CAMPAIGN_DETAIL_COMPARE_PERIODS : undefined}
              style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}
            >
              <span style={{ ...typography.body, fontWeight: 600, color: colors.textPrimary }}>Период {period}</span>
              <DatePicker.RangePicker
                locale={locale.DatePicker}
                value={dates}
                onChange={(next) => next?.[0] && next?.[1] && setPeriod([next[0], next[1]])}
                format="DD.MM.YYYY"
                separator="→"
                style={{ width: 220 }}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.bgGrayLight }}>
                    <th style={{ padding: '6px 12px', textAlign: 'left', border: `1px solid ${colors.border}`, borderRight: 'none', width: 120 }}>Товар</th>
                    {FUNNELS.general.metrics.map((metric, index) => (
                      <th key={metric.key} style={{ padding: '4px 6px', textAlign: 'center', border: `1px solid ${colors.border}`, fontSize: 10, whiteSpace: 'pre-line', lineHeight: 1.2, backgroundColor: colors.funnelBg, borderRight: index === FUNNELS.general.metrics.length - 1 ? `2px solid ${colors.border}` : undefined }}>{metric.name}</th>
                    ))}
                    {FUNNELS.advertising.metrics.map((metric) => (
                      <th key={metric.key} style={{ padding: '4px 6px', textAlign: 'center', border: `1px solid ${colors.border}`, fontSize: 10, whiteSpace: 'pre-line', lineHeight: 1.2, backgroundColor: colors.advertisingBg }}>{metric.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ARTICLES.map((article) => {
                    const agg = total != null ? scaleMetrics(total, articleShare(article.nmId)) : null
                    const isHovered = hoveredPeriodNmId === article.nmId
                    return (
                      <tr
                        key={article.nmId}
                        onMouseEnter={() => setHoveredPeriodNmId(article.nmId)}
                        onMouseLeave={() => setHoveredPeriodNmId(null)}
                        style={{ transition: transitions.fast }}
                      >
                        <td style={{ padding: '6px 12px', border: `1px solid ${colors.border}`, borderRight: 'none', backgroundColor: isHovered ? colors.bgGrayLight : colors.bgWhite }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <DemoPhotoPlaceholder width={32} height={32} />
                            <span style={{ fontSize: 11 }}>{article.nmId}</span>
                          </span>
                        </td>
                        {FUNNELS.general.metrics.map((metric, index) => (
                          <td key={metric.key} style={{ padding: '4px 6px', border: `1px solid ${colors.border}`, textAlign: 'center', whiteSpace: 'nowrap', backgroundColor: isHovered ? colors.funnelBgHover : colors.funnelBg, borderRight: index === FUNNELS.general.metrics.length - 1 ? `2px solid ${colors.border}` : undefined }}>
                            {formatMetric(metric.key, agg?.[metric.key] ?? null)}
                          </td>
                        ))}
                        {FUNNELS.advertising.metrics.map((metric) => (
                          <td key={metric.key} style={{ padding: '4px 6px', border: `1px solid ${colors.border}`, textAlign: 'center', whiteSpace: 'nowrap', backgroundColor: isHovered ? colors.advertisingBgHover : colors.advertisingBg }}>
                            {formatMetric(metric.key, agg?.[metric.key] ?? null)}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                  <tr style={{ backgroundColor: colors.bgGrayLight, fontWeight: 600 }}>
                    <td style={{ padding: '6px 12px', border: `1px solid ${colors.border}`, borderRight: 'none', backgroundColor: colors.bgGray }}>СУММАРНО</td>
                    {FUNNELS.general.metrics.map((metric, index) => (
                      <td key={metric.key} style={{ padding: '4px 6px', border: `1px solid ${colors.border}`, textAlign: 'center', whiteSpace: 'nowrap', color: colors.primary, borderRight: index === FUNNELS.general.metrics.length - 1 ? `2px solid ${colors.border}` : undefined }}>
                        {formatMetric(metric.key, total?.[metric.key] ?? null)}
                      </td>
                    ))}
                    {FUNNELS.advertising.metrics.map((metric) => (
                      <td key={metric.key} style={{ padding: '4px 6px', border: `1px solid ${colors.border}`, textAlign: 'center', whiteSpace: 'nowrap', color: colors.success }}>
                        {formatMetric(metric.key, total?.[metric.key] ?? null)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'stretch', marginBottom: spacing.lg, flexWrap: 'wrap', backgroundColor: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: borderRadius.md, padding: spacing.lg, boxShadow: shadows.md }}>
        <div style={{ flex: '0 1 75%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ ...typography.h2, margin: '0 0 12px 0', fontSize: 16, color: colors.textPrimary }}>
            Сравнение периодов (суммарно по рекламной кампании)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, alignContent: 'start' }}>
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: spacing.md, borderBottom: `2px solid ${colors.borderHeader}`, borderRight: `2px solid ${colors.border}`, ...typography.body, fontSize: 12, fontWeight: 600, backgroundColor: colors.funnelBg, width: '35%' }}>Общая воронка</th>
                    <th style={{ ...thPeriod, borderLeft: `2px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`, backgroundColor: colors.bgGrayLight, width: '22%' }}>{period1[0].format('DD.MM')} – {period1[1].format('DD.MM')}</th>
                    <th style={{ ...thPeriod, borderRight: `2px solid ${colors.border}`, backgroundColor: colors.bgGrayLight, width: '22%' }}>{period2[0].format('DD.MM')} – {period2[1].format('DD.MM')}</th>
                    <th style={{ ...thPeriod, borderLeft: `1px solid ${colors.border}`, backgroundColor: colors.bgGrayLight, width: '21%' }}>Разница</th>
                  </tr>
                </thead>
                <tbody>
                  {FUNNELS.general.metrics.map((metric) => {
                    const diff = renderDiff(metric.key, period1Total?.[metric.key] ?? null, period2Total?.[metric.key] ?? null)
                    return (
                      <tr
                        key={metric.key}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = colors.funnelBgHover
                          Array.from(event.currentTarget.querySelectorAll('td')).forEach((cell) => {
                            ;(cell as HTMLElement).style.backgroundColor = colors.funnelBgHover
                          })
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = colors.bgWhite
                          Array.from(event.currentTarget.querySelectorAll('td')).forEach((cell) => {
                            ;(cell as HTMLElement).style.backgroundColor = 'transparent'
                          })
                        }}
                      >
                        <td style={{ ...tdCell, borderRight: `2px solid ${colors.border}` }}>{metric.name.replace(/\n/g, ' ')}</td>
                        <td style={{ ...tdCell, textAlign: 'center', borderLeft: `2px solid ${colors.border}`, borderRight: `1px solid ${colors.border}` }}>{formatMetric(metric.key, period1Total?.[metric.key] ?? null)}</td>
                        <td style={{ ...tdCell, textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>{formatMetric(metric.key, period2Total?.[metric.key] ?? null)}</td>
                        <td style={{ ...tdCell, textAlign: 'center', borderLeft: `1px solid ${colors.border}`, color: diff.color, fontWeight: 600 }}>{diff.text}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: spacing.md, borderBottom: `2px solid ${colors.borderHeader}`, borderRight: `2px solid ${colors.border}`, ...typography.body, fontSize: 12, fontWeight: 600, backgroundColor: colors.advertisingBg, width: '35%' }}>Рекламная воронка</th>
                    <th style={{ ...thPeriod, borderLeft: `2px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`, backgroundColor: colors.advertisingBg, width: '22%' }}>{period1[0].format('DD.MM')} – {period1[1].format('DD.MM')}</th>
                    <th style={{ ...thPeriod, borderRight: `2px solid ${colors.border}`, backgroundColor: colors.advertisingBg, width: '22%' }}>{period2[0].format('DD.MM')} – {period2[1].format('DD.MM')}</th>
                    <th style={{ ...thPeriod, borderLeft: `1px solid ${colors.border}`, backgroundColor: colors.advertisingBg, width: '21%' }}>Разница</th>
                  </tr>
                </thead>
                <tbody>
                  {FUNNELS.advertising.metrics.map((metric) => {
                    const diff = renderDiff(metric.key, period1Total?.[metric.key] ?? null, period2Total?.[metric.key] ?? null)
                    return (
                      <tr
                        key={metric.key}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.backgroundColor = colors.advertisingBgHover
                          Array.from(event.currentTarget.querySelectorAll('td')).forEach((cell) => {
                            ;(cell as HTMLElement).style.backgroundColor = colors.advertisingBgHover
                          })
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.backgroundColor = colors.bgWhite
                          Array.from(event.currentTarget.querySelectorAll('td')).forEach((cell) => {
                            ;(cell as HTMLElement).style.backgroundColor = 'transparent'
                          })
                        }}
                      >
                        <td style={{ ...tdCell, borderRight: `2px solid ${colors.border}` }}>{metric.name.replace(/\n/g, ' ')}</td>
                        <td style={{ ...tdCell, textAlign: 'center', borderLeft: `2px solid ${colors.border}`, borderRight: `1px solid ${colors.border}` }}>{formatMetric(metric.key, period1Total?.[metric.key] ?? null)}</td>
                        <td style={{ ...tdCell, textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>{formatMetric(metric.key, period2Total?.[metric.key] ?? null)}</td>
                        <td style={{ ...tdCell, textAlign: 'center', borderLeft: `1px solid ${colors.border}`, color: diff.color, fontWeight: 600 }}>{diff.text}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ flex: '1 1 280px', minWidth: 280, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spacing.xs }}>
            <FboFbsStocksSwitch
              value={fulfillment}
              onChange={(next) => {
                setFulfillment(next)
                setExpandedWarehouse(null)
              }}
              tourTargetId={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_STOCK_FULFILLMENT}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.sm, rowGap: spacing.sm, marginBottom: spacing.md, minWidth: 0 }}>
            <h2 style={{ ...typography.h2, margin: 0, fontSize: 16, color: colors.textPrimary, whiteSpace: 'nowrap', flexShrink: 0 }}>Остатки</h2>
            <Button type="text" size="small" icon={<ReloadOutlined style={{ fontSize: 14 }} />} style={{ width: 28, height: 28, padding: 0, flexShrink: 0 }} />
            <Select
              data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_STOCK_ARTICLE}
              value={stockNmId}
              onChange={setStockNmId}
              style={{ ...STOCKS_NM_SELECT_STYLE, marginLeft: 'auto' }}
              options={DEMO_ARTICLES.map((article) => ({ value: article.nmId, label: article.nmId }))}
            />
            <div
              style={{
                ...typography.h3,
                ...FONT_PAGE,
                color: colors.bgWhite,
                backgroundColor: colors.primary,
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: borderRadius.sm,
                fontWeight: 600,
                display: 'inline-block',
                whiteSpace: 'nowrap',
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              Всего {totalAmount.toLocaleString('ru-RU')}
            </div>
          </div>
          <div style={{ flex: '1 1 0', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: colors.primaryLight }}>
                  <th style={{ textAlign: 'left', padding: spacing.md, borderBottom: `2px solid ${colors.primary}`, ...typography.body, fontSize: 12, fontWeight: 600, color: colors.primary }}>Склад</th>
                  <th style={{ textAlign: 'left', padding: spacing.md, borderBottom: `2px solid ${colors.primary}`, ...typography.body, fontSize: 12, fontWeight: 600, color: colors.primary }}>Кол-во</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock, index) => {
                  const isExpanded = expandedWarehouse === stock.warehouseName
                  const sizes = DEMO_WAREHOUSE_SIZES[stock.warehouseName] ?? []
                  return (
                    <tr
                      key={stock.warehouseName}
                      onClick={() => setExpandedWarehouse(isExpanded ? null : stock.warehouseName)}
                      style={{ backgroundColor: index % 2 === 0 ? colors.bgWhite : colors.bgGrayLight, cursor: 'pointer' }}
                    >
                      <td style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border}` }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span data-tour-id={index === 0 ? ONBOARDING_TARGETS.CAMPAIGN_DETAIL_STOCK_EXPAND : undefined} style={{ display: 'inline-flex' }}>
                            {isExpanded ? <CaretDownOutlined style={{ fontSize: 12, color: colors.primary }} /> : <CaretRightOutlined style={{ fontSize: 12, color: colors.textSecondary }} />}
                          </span>
                          {stock.warehouseName}
                        </span>
                        {isExpanded && (
                          <div style={{ marginTop: 8, paddingLeft: 20 }}>
                            {sizes.length > 0 ? (
                              sizes.map((size) => (
                                <div key={size.techSize} style={{ fontSize: 11, color: colors.textSecondary }}>
                                  {size.techSize}: {size.amount}
                                </div>
                              ))
                            ) : (
                              <div style={{ fontSize: 11, color: colors.textSecondary }}>Товар без разбивки по размерам</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border}`, fontWeight: 600, textAlign: 'center' }}>{stock.amount.toLocaleString('ru-RU')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={demoCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <h2 style={{ ...typography.h2, ...FONT_PAGE, margin: 0, color: colors.textPrimary }}>Заметки по кампании</h2>
          <Button type="primary" icon={<PlusOutlined />}>Добавить заметку</Button>
        </div>
        <div style={{ textAlign: 'center', padding: spacing.xl, fontSize: 12, color: colors.textSecondary }}>
          Нет заметок по кампании. Создайте первую заметку.
        </div>
      </div>
    </div>
  )
}
