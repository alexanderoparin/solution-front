import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Checkbox, DatePicker, Input, Switch, Tooltip } from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import locale from 'antd/locale/ru_RU'
import FboFbsStocksSwitch, { type StocksFulfillment } from '../../FboFbsStocksSwitch'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { ONBOARDING_DEMO_CAMPAIGN_PATH, onboardingDemoArticlePath } from '../../../onboarding/demoPaths'
import {
  DEMO_ARTICLES,
  DEMO_CAMPAIGNS,
  DEMO_WAREHOUSE_SIZES,
  DEMO_WAREHOUSES,
  type DemoArticle,
  type DemoCampaignRow,
  type DemoCampaignStatus,
} from '../../../onboarding/demoConstants'
import {
  ARTICLE_HEADER_PHOTO_HEIGHT,
  ARTICLE_HEADER_PHOTO_WIDTH,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
} from '../../../styles/analytics'
import { demoPageWrap } from './demoUi'
import { DemoPhotoPlaceholder } from './DemoPhotoPlaceholder'

const FONT_PAGE = { fontSize: 12 as const }
const FONT_PAGE_SMALL = { fontSize: 11 as const }
const ARTICLE_SHARES = [0.28, 0.22, 0.24, 0.12, 0.14]
const METRICS_WITH_CHANGE_NUMBER = ['transitions', 'cart', 'orders', 'views', 'clicks']
const LOWER_IS_BETTER = ['cpc', 'cpo', 'costs', 'drr']
const BUNDLE_LINKED_INNER_HEIGHT_PX = 144
const BUNDLE_LINKED_ROW_GAP_PX = 8
const BUNDLE_THUMB_WIDTH_PX = 96
const WAREHOUSE_BASE_TOTAL = DEMO_WAREHOUSES.reduce((sum, row) => sum + row.amount, 0)

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

const STATUS_LABEL: Record<DemoCampaignStatus, string> = {
  active: 'Активна',
  paused: 'Приостановлена',
  finished: 'Завершена',
}

const STATUS_BG: Record<DemoCampaignStatus, string> = {
  active: colors.success,
  paused: colors.warning,
  finished: colors.textMuted,
}

const ARTICLE_RK_COL_WIDTHS_PCT = {
  createdAt: 8,
  name: 11,
  id: 7,
  type: 8,
  status: 8,
  views: 8,
  clicks: 8,
  costs: 8,
  cpc: 7,
  ctr: 7,
  cart: 9,
  orders: 9,
} as const

const CAMPAIGN_NEEDLES: Record<string, string[]> = {
  Пижамы: ['Пижама', 'Новинки'],
  Халаты: ['Халат'],
  Сорочки: ['Сорочка'],
  'Постельное бельё': ['Постельное', 'текстиль', 'Новинки'],
}

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

function articleShare(nmId: string): number {
  const index = DEMO_ARTICLES.findIndex((item) => item.nmId === nmId)
  return ARTICLE_SHARES[index] ?? 0.2
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

function resolveArticle(nmId: string | undefined): DemoArticle {
  return DEMO_ARTICLES.find((item) => item.nmId === nmId) ?? DEMO_ARTICLES[0]
}

function campaignsForArticle(article: DemoArticle): DemoCampaignRow[] {
  const needles = CAMPAIGN_NEEDLES[article.subjectName] ?? []
  const matched = DEMO_CAMPAIGNS.filter((campaign) => needles.some((needle) => campaign.name.includes(needle)))
  if (matched.length > 0) {
    return matched
  }
  return DEMO_CAMPAIGNS.filter((campaign) => campaign.status !== 'finished').slice(0, 2)
}

function defaultGoal(article: DemoArticle): string {
  const sizeHint = article.sizes.split(',')[0]?.trim()
  if (article.priority) {
    return `Держать ДРР в пределах 12% и не терять ${sizeHint ?? 'ходовые размеры'} на Коледино.`
  }
  return 'Следить за оборачиваемостью и не допускать обнуления FBS.'
}

function cardStyle(extra?: CSSProperties): CSSProperties {
  return {
    backgroundColor: colors.bgWhite,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: borderRadius.md,
    boxShadow: shadows.md,
    ...extra,
  }
}

/**
 * Учебная карточка товара: воронки, сравнение периодов, остатки, РК и заметки.
 */
export default function DemoAnalyticsArticle() {
  const { nmId } = useParams<{ nmId: string }>()
  const article = resolveArticle(nmId)
  const share = articleShare(article.nmId)
  const yesterday = dayjs().subtract(1, 'day')
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([yesterday.subtract(13, 'day'), yesterday])
  const [period1, setPeriod1] = useState<[Dayjs, Dayjs]>([yesterday.subtract(13, 'day'), yesterday.subtract(7, 'day')])
  const [period2, setPeriod2] = useState<[Dayjs, Dayjs]>([yesterday.subtract(6, 'day'), yesterday])
  const [campaignDateRange, setCampaignDateRange] = useState<[Dayjs, Dayjs]>([yesterday.subtract(13, 'day'), yesterday])
  const [showChart, setShowChart] = useState(false)
  const [selectedFunnelKeys, setSelectedFunnelKeys] = useState<FunnelKey[]>(['general', 'advertising'])
  const [goal, setGoal] = useState(() => defaultGoal(article))
  const [fulfillment, setFulfillment] = useState<StocksFulfillment>('FBO')
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(null)
  const [campaignSearch, setCampaignSearch] = useState('')

  useEffect(() => {
    const current = resolveArticle(nmId)
    setGoal(defaultGoal(current))
    setExpandedWarehouse(null)
    setCampaignSearch('')
  }, [nmId])

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
    () => sumMetrics(getDatesInRange(period1[0], period1[1]).map((date) => buildDayMetrics(date, share))),
    [period1, share],
  )
  const period2Total = useMemo(
    () => sumMetrics(getDatesInRange(period2[0], period2[1]).map((date) => buildDayMetrics(date, share))),
    [period2, share],
  )

  const metricsWithFunnel = FUNNEL_ORDER.filter((key) => selectedFunnelKeys.includes(key)).flatMap((funnelKey) =>
    FUNNELS[funnelKey].metrics.map((metric) => ({ funnelKey, metric })),
  )
  const totalCols = metricsWithFunnel.length

  const stocks = useMemo(() => {
    const target = fulfillment === 'FBO' ? article.fbo : Math.max(article.fbs, DEMO_WAREHOUSES.length)
    return DEMO_WAREHOUSES.map((row) => ({
      warehouseName: row.warehouseName,
      amount: Math.round((row.amount / WAREHOUSE_BASE_TOTAL) * target),
    }))
  }, [article, fulfillment])
  const totalAmount = stocks.reduce((sum, row) => sum + row.amount, 0)
  const stocksUpdatedAt = yesterday.hour(9).minute(14).format('DD.MM.YY HH:mm')

  const bundleItems = DEMO_ARTICLES.filter((item) => item.nmId !== article.nmId)
  const bundlePairs: DemoArticle[][] = []
  for (let index = 0; index < bundleItems.length; index += 2) {
    bundlePairs.push(bundleItems.slice(index, index + 2))
  }
  const bundleRowHeight = Math.floor((BUNDLE_LINKED_INNER_HEIGHT_PX - BUNDLE_LINKED_ROW_GAP_PX) / 2)

  const articleCampaigns = useMemo(() => {
    const list = campaignsForArticle(article).map((campaign) => ({
      ...campaign,
      views: Math.round(campaign.views * share),
      clicks: Math.round(campaign.clicks * share),
      costs: Math.round(campaign.costs * share),
      cart: Math.round(campaign.cart * share),
      orders: Math.round(campaign.orders * share),
    }))
    const query = campaignSearch.trim().toLowerCase()
    if (query.length === 0) {
      return list
    }
    return list.filter((campaign) => campaign.name.toLowerCase().includes(query) || campaign.id.includes(query))
  }, [article, campaignSearch, share])

  const toggleFunnel = (key: FunnelKey) => {
    setSelectedFunnelKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))
  }

  const thPeriod = { textAlign: 'center' as const, padding: spacing.md, borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, fontSize: 12, fontWeight: 600 }
  const tdCell = { padding: spacing.md, borderBottom: `1px solid ${colors.border}`, ...typography.body, fontSize: 12 }
  const rkTh = {
    padding: '8px 10px',
    borderBottom: `2px solid ${colors.borderHeader}`,
    ...typography.body,
    ...FONT_PAGE_SMALL,
    fontWeight: 600,
    color: colors.textPrimary,
  }
  const rkTd = {
    padding: '6px 10px',
    borderBottom: `1px solid ${colors.border}`,
    ...typography.body,
    ...FONT_PAGE_SMALL,
    overflow: 'hidden' as const,
    wordBreak: 'break-word' as const,
  }

  return (
    <div style={{ ...demoPageWrap, padding: spacing.lg }}>
      <div data-tour-id={ONBOARDING_TARGETS.ARTICLE_HEADER} style={cardStyle({ padding: spacing.sm, marginBottom: spacing.xl })}>
        <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'stretch' }}>
          <div style={{ flexShrink: 0, width: ARTICLE_HEADER_PHOTO_WIDTH, minHeight: ARTICLE_HEADER_PHOTO_HEIGHT, borderRadius: borderRadius.sm, overflow: 'hidden', border: `1px solid ${colors.borderLight}` }}>
            <DemoPhotoPlaceholder width={ARTICLE_HEADER_PHOTO_WIDTH} height={ARTICLE_HEADER_PHOTO_HEIGHT} />
          </div>
          <div style={{ flex: '0 1 auto', minWidth: 0 }}>
            <div style={{ ...typography.body, ...FONT_PAGE, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>{article.title}</div>
            <div style={{ color: colors.textSecondary, marginBottom: 2, fontSize: 12 }}>
              {[article.subjectName, article.brand].filter(Boolean).join(' · ')}
            </div>
            <div style={{ color: colors.textSecondary, marginBottom: 2, fontSize: 12 }}>
              Артикул WB: <span style={{ color: colors.primary, fontWeight: 500 }}>{article.nmId}</span>
            </div>
            <div style={{ color: colors.textSecondary, marginBottom: 6, fontSize: 12 }}>
              Артикул продавца: <span style={{ color: colors.primary, fontWeight: 500 }}>{article.vendorCode}</span>
            </div>
            <div style={{ marginTop: spacing.sm, maxWidth: 560, padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.bgGrayLight, border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: colors.textSecondary, marginBottom: 4 }}>Цель на артикул:</div>
              <Input.TextArea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="Кратко опишите цель по этому артикулу"
                autoSize={{ minRows: 2, maxRows: 8 }}
                maxLength={10000}
                styles={{ textarea: { fontSize: 11, lineHeight: 1.45 } }}
              />
            </div>
            {article.inAdvertising && (
              <span
                style={{
                  display: 'inline-block',
                  marginTop: spacing.sm,
                  padding: '2px 8px',
                  borderRadius: borderRadius.sm,
                  fontSize: 11,
                  fontWeight: 500,
                  backgroundColor: colors.successLight,
                  color: colors.success,
                }}
              >
                В акции
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0, height: BUNDLE_LINKED_INNER_HEIGHT_PX + 16, display: 'flex', alignItems: 'stretch', gap: 8 }}>
            <div
              style={{
                width: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 11,
                color: colors.textSecondary,
                fontWeight: 500,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                textAlign: 'center',
              }}
            >
              В связке
            </div>
            <div style={{ flex: 1, minWidth: 0, overflowX: 'auto', overflowY: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8, width: 'max-content', height: BUNDLE_LINKED_INNER_HEIGHT_PX }}>
                {bundlePairs.map((pair) => (
                  <div
                    key={pair.map((item) => item.nmId).join('-')}
                    style={{
                      flexShrink: 0,
                      width: BUNDLE_THUMB_WIDTH_PX + 152,
                      height: BUNDLE_LINKED_INNER_HEIGHT_PX,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: BUNDLE_LINKED_ROW_GAP_PX,
                    }}
                  >
                    {pair.map((item) => (
                      <Link
                        key={item.nmId}
                        to={onboardingDemoArticlePath(item.nmId)}
                        style={{
                          height: bundleRowHeight,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '2px 4px',
                          borderRadius: borderRadius.sm,
                          textDecoration: 'none',
                          color: colors.textPrimary,
                          border: '1px solid transparent',
                        }}
                      >
                        <DemoPhotoPlaceholder width={BUNDLE_THUMB_WIDTH_PX} height={bundleRowHeight - 4} />
                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                          <div style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.nmId} · {item.vendorCode}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle({ padding: spacing.lg, marginBottom: spacing.xl })}>
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
              <span data-tour-id={ONBOARDING_TARGETS.ARTICLE_METRICS} style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' }}>
                <Checkbox checked={selectedFunnelKeys.includes('general')} onChange={() => toggleFunnel('general')}>Общая</Checkbox>
                <Checkbox checked={selectedFunnelKeys.includes('advertising')} onChange={() => toggleFunnel('advertising')}>Реклама</Checkbox>
                <Checkbox checked={selectedFunnelKeys.includes('pricing')} onChange={() => toggleFunnel('pricing')}>Цены</Checkbox>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
              <span data-tour-id={ONBOARDING_TARGETS.ARTICLE_CHART} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, ...typography.body }}>
                <Switch checked={showChart} onChange={setShowChart} size="small" />
                <span>График</span>
              </span>
              <Button type="primary" icon={<DownloadOutlined />} data-tour-id={ONBOARDING_TARGETS.ARTICLE_EXPORT}>Выгрузить</Button>
              <Tooltip title="Загрузите выгрузку «Воронка продаж» из ЛК WB (лист «Товары»).">
                <Button icon={<UploadOutlined />} aria-label="Импорт воронки из Excel" />
              </Tooltip>
            </div>
          </div>
          {totalCols > 0 && (
            <div style={{ maxHeight: 438, overflow: 'auto', position: 'relative' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
                <thead>
                  <tr>
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
                                  {METRICS_WITH_CHANGE_NUMBER.includes(metric.key) && <span>{change > 0 ? '+' : ''}{Math.round(change)}</span>}
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
                    <td style={{ padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `2px solid ${colors.border}`, borderTop: `2px solid ${colors.border}`, fontSize: 12, fontWeight: 700, position: 'sticky', left: 0, backgroundColor: colors.bgGray, zIndex: 1 }}>Весь период</td>
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

      <div style={cardStyle({ padding: spacing.lg, marginBottom: spacing.xl, display: 'flex', flexDirection: 'column', width: '100%' })}>
        <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'stretch' }}>
          <div style={{ flex: '0 1 75%', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, gap: spacing.lg, flexWrap: 'wrap' }}>
              <h2 style={{ ...typography.h2, ...FONT_PAGE, margin: 0, fontSize: 16, color: colors.textPrimary }}>Сравнение периодов</h2>
              <div data-tour-id={ONBOARDING_TARGETS.ARTICLE_COMPARE} style={{ display: 'flex', gap: spacing.lg, alignItems: 'center', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                <DatePicker.RangePicker locale={locale.DatePicker} value={period1} onChange={(dates) => dates?.[0] && dates?.[1] && setPeriod1([dates[0], dates[1]])} format="DD.MM.YYYY" separator="→" style={{ width: 240 }} />
                <DatePicker.RangePicker locale={locale.DatePicker} value={period2} onChange={(dates) => dates?.[0] && dates?.[1] && setPeriod2([dates[0], dates[1]])} format="DD.MM.YYYY" separator="→" style={{ width: 240 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, alignContent: 'start' }}>
              {([
                { funnel: 'general' as const, bg: colors.funnelBg, hover: colors.funnelBgHover },
                { funnel: 'advertising' as const, bg: colors.advertisingBg, hover: colors.advertisingBgHover },
              ]).map(({ funnel, bg, hover }) => (
                <table key={funnel} style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: spacing.md, borderBottom: `2px solid ${colors.borderHeader}`, borderRight: `2px solid ${colors.border}`, ...typography.body, fontSize: 12, fontWeight: 600, backgroundColor: bg, width: '35%' }}>{FUNNELS[funnel].name}</th>
                      <th style={{ ...thPeriod, borderLeft: `2px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`, backgroundColor: funnel === 'advertising' ? bg : colors.bgGrayLight, width: '22%' }}>{period1[0].format('DD.MM')} – {period1[1].format('DD.MM')}</th>
                      <th style={{ ...thPeriod, borderRight: `2px solid ${colors.border}`, backgroundColor: funnel === 'advertising' ? bg : colors.bgGrayLight, width: '22%' }}>{period2[0].format('DD.MM')} – {period2[1].format('DD.MM')}</th>
                      <th style={{ ...thPeriod, borderLeft: `1px solid ${colors.border}`, backgroundColor: funnel === 'advertising' ? bg : colors.bgGrayLight, width: '21%' }}>Разница</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FUNNELS[funnel].metrics.map((metric) => {
                      const diff = renderDiff(metric.key, period1Total?.[metric.key] ?? null, period2Total?.[metric.key] ?? null)
                      return (
                        <tr
                          key={metric.key}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = hover
                            Array.from(event.currentTarget.querySelectorAll('td')).forEach((cell) => {
                              ;(cell as HTMLElement).style.backgroundColor = hover
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
              ))}
            </div>
          </div>

          <div style={{ flex: '0 1 25%', display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${colors.borderLight}`, paddingLeft: spacing.lg, minWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spacing.xs }}>
              <FboFbsStocksSwitch
                value={fulfillment}
                onChange={(next) => {
                  setFulfillment(next)
                  setExpandedWarehouse(null)
                }}
                tourTargetId={ONBOARDING_TARGETS.ARTICLE_STOCK_FULFILLMENT}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, minWidth: 0 }}>
              <h2 style={{ ...typography.h2, ...FONT_PAGE, margin: 0, color: colors.textPrimary, whiteSpace: 'nowrap', fontSize: 16, flexShrink: 0 }}>
                Остатки на {stocksUpdatedAt}
              </h2>
              <Button type="text" size="small" icon={<ReloadOutlined style={{ fontSize: 14 }} />} style={{ width: 28, height: 28, padding: 0 }} />
              <div
                style={{
                  ...typography.h3,
                  ...FONT_PAGE,
                  color: colors.bgWhite,
                  backgroundColor: colors.primary,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: borderRadius.sm,
                  fontWeight: 600,
                  marginLeft: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                Всего {totalAmount.toLocaleString('ru-RU')}
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: colors.primaryLight }}>
                  <th style={{ textAlign: 'left', padding: spacing.md, borderBottom: `2px solid ${colors.primary}`, fontSize: 12, fontWeight: 600, color: colors.primary }}>Склад</th>
                  <th style={{ textAlign: 'left', padding: spacing.md, borderBottom: `2px solid ${colors.primary}`, fontSize: 12, fontWeight: 600, color: colors.primary }}>Кол-во</th>
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
                          <span data-tour-id={index === 0 ? ONBOARDING_TARGETS.ARTICLE_STOCK_EXPAND : undefined} style={{ display: 'inline-flex' }}>
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

      <div data-tour-id={ONBOARDING_TARGETS.ARTICLE_CAMPAIGNS} style={cardStyle({ padding: spacing.lg, marginBottom: spacing.xl, width: '100%' })}>
        <h2 style={{ ...typography.h2, ...FONT_PAGE, margin: `0 0 ${spacing.md} 0`, color: colors.textPrimary }}>Список РК</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center', marginBottom: spacing.md }}>
          <Input
            placeholder="Поиск по ID кампании или названию"
            prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
            value={campaignSearch}
            onChange={(event) => setCampaignSearch(event.target.value)}
            allowClear
            style={{ maxWidth: 360, borderRadius: borderRadius.sm }}
          />
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <span style={{ ...typography.body, fontSize: 12, color: colors.textSecondary }}>Период для метрик:</span>
            <DatePicker.RangePicker
              locale={locale.DatePicker}
              value={campaignDateRange}
              onChange={(dates) => dates?.[0] && dates?.[1] && setCampaignDateRange([dates[0], dates[1]])}
              format="DD.MM.YYYY"
              separator="→"
              style={{ width: 220 }}
            />
          </span>
        </div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: '0 0 8px 0' }}>
          Положили в корзину и заказали товаров — по рекламной статистике WB (fullstats) для этого артикула в каждой РК.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1040 }}>
            <thead>
              <tr style={{ backgroundColor: colors.bgGray }}>
                <th style={{ ...rkTh, textAlign: 'left', width: `${ARTICLE_RK_COL_WIDTHS_PCT.createdAt}%` }}>Дата создания</th>
                <th style={{ ...rkTh, textAlign: 'left', width: `${ARTICLE_RK_COL_WIDTHS_PCT.name}%` }}>Кампания</th>
                <th style={{ ...rkTh, textAlign: 'left', width: `${ARTICLE_RK_COL_WIDTHS_PCT.id}%` }}>ID</th>
                <th style={{ ...rkTh, textAlign: 'left', width: `${ARTICLE_RK_COL_WIDTHS_PCT.type}%` }}>Тип</th>
                <th style={{ ...rkTh, textAlign: 'center', width: `${ARTICLE_RK_COL_WIDTHS_PCT.status}%` }}>Статус</th>
                <th style={{ ...rkTh, textAlign: 'center', width: `${ARTICLE_RK_COL_WIDTHS_PCT.views}%` }}>Просмотры</th>
                <th style={{ ...rkTh, textAlign: 'center', width: `${ARTICLE_RK_COL_WIDTHS_PCT.clicks}%` }}>Клики</th>
                <th style={{ ...rkTh, textAlign: 'center', width: `${ARTICLE_RK_COL_WIDTHS_PCT.costs}%` }}>Затраты</th>
                <th style={{ ...rkTh, textAlign: 'center', width: `${ARTICLE_RK_COL_WIDTHS_PCT.cpc}%` }}>CPC</th>
                <th style={{ ...rkTh, textAlign: 'center', width: `${ARTICLE_RK_COL_WIDTHS_PCT.ctr}%` }}>CTR</th>
                <th style={{ ...rkTh, textAlign: 'center', width: `${ARTICLE_RK_COL_WIDTHS_PCT.cart}%` }}>Положили в корзину</th>
                <th style={{ ...rkTh, textAlign: 'center', width: `${ARTICLE_RK_COL_WIDTHS_PCT.orders}%` }}>Заказали товаров</th>
              </tr>
            </thead>
            <tbody>
              {articleCampaigns.map((campaign, idx) => (
                <tr key={campaign.id} style={{ backgroundColor: idx % 2 === 0 ? colors.bgWhite : colors.bgGrayLight, transition: transitions.fast }}>
                  <td style={{ ...rkTd, width: `${ARTICLE_RK_COL_WIDTHS_PCT.createdAt}%` }}>{campaign.createdAt}</td>
                  <td style={{ ...rkTd, width: `${ARTICLE_RK_COL_WIDTHS_PCT.name}%` }}>
                    <Link to={ONBOARDING_DEMO_CAMPAIGN_PATH} style={{ fontWeight: 500, color: colors.primary, textDecoration: 'none' }}>{campaign.name}</Link>
                  </td>
                  <td style={{ ...rkTd, width: `${ARTICLE_RK_COL_WIDTHS_PCT.id}%` }}>
                    <Link to={ONBOARDING_DEMO_CAMPAIGN_PATH} style={{ color: colors.primary, textDecoration: 'none' }}>{campaign.id}</Link>
                  </td>
                  <td style={{ ...rkTd, width: `${ARTICLE_RK_COL_WIDTHS_PCT.type}%` }}>{campaign.type}</td>
                  <td style={{ ...rkTd, textAlign: 'center', width: `${ARTICLE_RK_COL_WIDTHS_PCT.status}%` }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: borderRadius.sm, backgroundColor: STATUS_BG[campaign.status], color: '#fff', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {STATUS_LABEL[campaign.status]}
                    </span>
                  </td>
                  <td style={{ ...rkTd, textAlign: 'center' }}>{campaign.views.toLocaleString('ru-RU')}</td>
                  <td style={{ ...rkTd, textAlign: 'center' }}>{campaign.clicks.toLocaleString('ru-RU')}</td>
                  <td style={{ ...rkTd, textAlign: 'center' }}>{campaign.costs.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ ...rkTd, textAlign: 'center' }}>{campaign.cpc.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ ...rkTd, textAlign: 'center' }}>{`${campaign.ctr.toFixed(2)}%`}</td>
                  <td style={{ ...rkTd, textAlign: 'center' }}>{campaign.cart.toLocaleString('ru-RU')}</td>
                  <td style={{ ...rkTd, textAlign: 'center' }}>{campaign.orders.toLocaleString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={cardStyle({ padding: spacing.lg, marginTop: spacing.xl })}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <h2 style={{ ...typography.h2, ...FONT_PAGE, margin: 0, color: colors.textPrimary }}>Заметки</h2>
          <Button type="primary" icon={<PlusOutlined />}>Добавить заметку</Button>
        </div>
        <div style={{ textAlign: 'center', padding: spacing.xl, fontSize: 12, color: colors.textSecondary }}>
          Нет заметок. Создайте первую заметку.
        </div>
      </div>
    </div>
  )
}
