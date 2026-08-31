import { useMemo, useState, useCallback, type CSSProperties } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spin, Alert, DatePicker, Button, message, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import locale from 'antd/locale/ru_RU'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import type { ArticleResponse, Metric, Period, Stock } from '../types/analytics'
import { resolveArticlePhotoUrl } from '../types/analytics'
import Header, { type CabinetSelectProps, type WorkContextCabinetSelectProps } from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import OzonAnalyticsChart from '../components/OzonAnalyticsChart'
import FboFbsStocksSwitch, { type StocksFulfillment } from '../components/FboFbsStocksSwitch'
import { userApi } from '../api/user'
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  ARTICLE_HEADER_PHOTO_HEIGHT,
  ARTICLE_HEADER_PHOTO_WIDTH,
} from '../styles/analytics'

dayjs.locale('ru')

const FONT_PAGE = { fontSize: '12px' as const }

const PERCENT_METRICS = new Set(['cart_conversion', 'order_conversion', 'ctr', 'drr'])
const CURRENCY_METRICS = new Set(['orders_amount', 'costs', 'cpc', 'cpo'])
const LOWER_IS_BETTER = new Set(['costs', 'cpc', 'cpo', 'drr'])

const OZON_CATALOG_URL = (productId: number) => `https://www.ozon.ru/product/${productId}/`

function formatMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

function formatInt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('ru-RU').format(Number(value))
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value))}%`
}

function formatMetricValue(metricName: string, value: number | null | undefined): string {
  if (PERCENT_METRICS.has(metricName)) return formatPercent(value)
  if (CURRENCY_METRICS.has(metricName)) return formatMoney(value)
  return formatInt(value)
}

function diffColor(metricName: string, changePercent: number | null | undefined): string {
  if (changePercent == null || changePercent === 0) return colors.textPrimary
  const lowerIsBetter = LOWER_IS_BETTER.has(metricName)
  if (lowerIsBetter) {
    return changePercent < 0 ? colors.success : colors.error
  }
  return changePercent > 0 ? colors.success : colors.error
}

function formatDiff(changePercent: number | null | undefined): string {
  if (changePercent == null || Number.isNaN(Number(changePercent))) return '—'
  const sign = changePercent > 0 ? '+' : ''
  return `${sign}${Number(changePercent).toFixed(1)}%`
}

const cardStyle: CSSProperties = {
  backgroundColor: colors.bgWhite,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: borderRadius.md,
  padding: spacing.lg,
  marginBottom: spacing.xl,
  boxShadow: shadows.md,
  transition: transitions.normal,
  width: '100%',
}

export interface OzonAnalyticsArticleProps {
  selectedCabinetId: number | null
  selectedSellerId?: number
  isAdmin: boolean
  workContextCabinetSelect?: WorkContextCabinetSelectProps
  cabinetSelectProps?: CabinetSelectProps
}

export default function OzonAnalyticsArticle({
  selectedCabinetId,
  selectedSellerId,
  workContextCabinetSelect,
  cabinetSelectProps,
}: OzonAnalyticsArticleProps) {
  const { nmId: nmIdParam } = useParams<{ nmId: string }>()
  const productId = Number(nmIdParam)

  const yesterday = dayjs().subtract(1, 'day')
  const defaultDateFrom = yesterday.subtract(13, 'day')

  const [period1, setPeriod1] = useState<[Dayjs, Dayjs]>([
    defaultDateFrom,
    defaultDateFrom.add(6, 'day'),
  ])
  const [period2, setPeriod2] = useState<[Dayjs, Dayjs]>([
    yesterday.subtract(6, 'day'),
    yesterday,
  ])

  const defaultDailyRange = useMemo((): [Dayjs, Dayjs] => [defaultDateFrom, yesterday], [defaultDateFrom, yesterday])
  const [dailyRange, setDailyRange] = useState<[Dayjs, Dayjs]>(defaultDailyRange)
  const [analyticsRefreshLoading, setAnalyticsRefreshLoading] = useState(false)
  const [stocksUpdateLoading, setStocksUpdateLoading] = useState(false)
  const [stocksFulfillment, setStocksFulfillment] = useState<StocksFulfillment>('FBO')

  const periods = useMemo(
    (): Period[] => [
      {
        id: 1,
        name: 'Период 1',
        dateFrom: period1[0].format('YYYY-MM-DD'),
        dateTo: period1[1].format('YYYY-MM-DD'),
      },
      {
        id: 2,
        name: 'Период 2',
        dateFrom: period2[0].format('YYYY-MM-DD'),
        dateTo: period2[1].format('YYYY-MM-DD'),
      },
    ],
    [period1, period2],
  )

  const dailyFrom = dailyRange[0].format('YYYY-MM-DD')
  const dailyTo = dailyRange[1].format('YYYY-MM-DD')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'ozon-article',
      productId,
      selectedCabinetId,
      selectedSellerId,
      dailyFrom,
      dailyTo,
      period1[0].format('YYYY-MM-DD'),
      period1[1].format('YYYY-MM-DD'),
      period2[0].format('YYYY-MM-DD'),
      period2[1].format('YYYY-MM-DD'),
    ],
    queryFn: () =>
      analyticsApi.getArticle(
        productId,
        periods,
        selectedSellerId,
        selectedCabinetId ?? undefined,
        dailyFrom,
        dailyTo,
        dailyFrom,
        dailyTo,
      ),
    enabled: selectedCabinetId != null && !Number.isNaN(productId),
  })

  const funnelMetrics = useMemo(
    () => (data?.metrics ?? []).filter((m) => m.category === 'funnel'),
    [data?.metrics],
  )
  const advertisingMetrics = useMemo(
    () => (data?.metrics ?? []).filter((m) => m.category === 'advertising'),
    [data?.metrics],
  )

  const allStocks = useMemo((): Stock[] => {
    if (!data) return []
    return stocksFulfillment === 'FBS' ? (data.fbsStocks ?? []) : (data.stocks ?? [])
  }, [data, stocksFulfillment])

  const handleDailyRangeChange = useCallback((values: [Dayjs | null, Dayjs | null] | null) => {
    if (values?.[0] && values[1]) {
      setDailyRange([values[0], values[1]])
    }
  }, [])

  const handleRefreshAnalytics = useCallback(async () => {
    if (selectedCabinetId == null) return
    setAnalyticsRefreshLoading(true)
    try {
      const res = await userApi.triggerOzonAnalyticsUpdate(selectedCabinetId)
      message.success(res.message ?? 'Синхронизация аналитики поставлена в очередь')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Не удалось запустить синхронизацию'
      message.error(msg)
    } finally {
      setAnalyticsRefreshLoading(false)
    }
  }, [selectedCabinetId])

  const handleRefreshStocks = useCallback(async () => {
    if (selectedCabinetId == null) return
    setStocksUpdateLoading(true)
    try {
      await userApi.triggerCabinetStocksUpdate(selectedCabinetId)
      message.success('Обновление остатков запущено. Данные обновятся в течение нескольких минут.')
      await refetch()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Не удалось запустить обновление остатков'
      message.error(msg)
    } finally {
      setStocksUpdateLoading(false)
    }
  }, [selectedCabinetId, refetch])

  if (selectedCabinetId == null) {
    return (
      <>
        <Header
          workContextCabinetSelect={workContextCabinetSelect}
          cabinetSelectProps={cabinetSelectProps}
        />
        <Breadcrumbs />
        <div style={{ padding: spacing.xxl, textAlign: 'center' }}>
          <Alert type="info" message="Выберите кабинет Ozon" showIcon />
        </div>
      </>
    )
  }

  return (
    <>
      <Header
        workContextCabinetSelect={workContextCabinetSelect}
        cabinetSelectProps={cabinetSelectProps}
      />
      <Breadcrumbs />
      <div
        style={{
          padding: `${spacing.lg}px ${spacing.md}px`,
          width: '100%',
          backgroundColor: colors.bgGray,
          minHeight: '100vh',
        }}
      >
        {isLoading && (
          <div
            style={{
              padding: spacing.xxl,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 400,
            }}
          >
            <Spin size="large" />
          </div>
        )}

        {error && (
          <Alert
            type="error"
            message="Не удалось загрузить артикул"
            description={(error as Error).message}
            showIcon
            style={{ marginBottom: spacing.lg }}
          />
        )}

        {data && (
          <>
            <ArticleHeader article={data} productId={productId} />

            {(funnelMetrics.length > 0 || advertisingMetrics.length > 0) && (
              <div
                style={cardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = shadows.lg
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = shadows.md
                }}
              >
                <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'stretch' }}>
                  <div style={{ flex: '0 1 75%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: spacing.sm,
                        gap: spacing.lg,
                        flexWrap: 'wrap',
                      }}
                    >
                      <h2
                        style={{
                          ...typography.h2,
                          ...FONT_PAGE,
                          margin: 0,
                          fontSize: 16,
                          lineHeight: 1.4,
                          color: colors.textPrimary,
                        }}
                      >
                        Сравнение периодов
                      </h2>
                      <div
                        style={{
                          display: 'flex',
                          gap: spacing.lg,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <DatePicker.RangePicker
                          locale={locale.DatePicker}
                          value={period1}
                          onChange={(dates) => {
                            if (dates?.[0] && dates[1]) setPeriod1([dates[0], dates[1]])
                          }}
                          format="DD.MM.YYYY"
                          separator="→"
                          style={{ width: 240 }}
                        />
                        <DatePicker.RangePicker
                          locale={locale.DatePicker}
                          value={period2}
                          onChange={(dates) => {
                            if (dates?.[0] && dates[1]) setPeriod2([dates[0], dates[1]])
                          }}
                          format="DD.MM.YYYY"
                          separator="→"
                          style={{ width: 240 }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: funnelMetrics.length > 0 && advertisingMetrics.length > 0 ? '1fr 1fr' : '1fr',
                        gap: spacing.lg,
                        alignContent: 'start',
                      }}
                    >
                      {funnelMetrics.length > 0 && (
                        <MetricsComparisonTable
                          title="Общая воронка"
                          metrics={funnelMetrics}
                          period1Label={`${period1[0].format('DD.MM')} - ${period1[1].format('DD.MM')}`}
                          period2Label={`${period2[0].format('DD.MM')} - ${period2[1].format('DD.MM')}`}
                        />
                      )}
                      {advertisingMetrics.length > 0 && (
                        <MetricsComparisonTable
                          title="Рекламная воронка"
                          metrics={advertisingMetrics}
                          period1Label={`${period1[0].format('DD.MM')} - ${period1[1].format('DD.MM')}`}
                          period2Label={`${period2[0].format('DD.MM')} - ${period2[1].format('DD.MM')}`}
                        />
                      )}
                    </div>
                  </div>

                  <StocksPanel
                    stocks={allStocks}
                    stocksFulfillment={stocksFulfillment}
                    onFulfillmentChange={setStocksFulfillment}
                    stocksUpdateLoading={stocksUpdateLoading}
                    onRefreshStocks={() => void handleRefreshStocks()}
                    lastStocksUpdateTriggeredAt={data.lastStocksUpdateTriggeredAt ?? null}
                    cabinetId={selectedCabinetId}
                  />
                </div>
              </div>
            )}

            {(data.campaigns?.length ?? 0) > 0 && (
              <div
                style={cardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = shadows.lg
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = shadows.md
                }}
              >
                <h2
                  style={{
                    ...typography.h2,
                    ...FONT_PAGE,
                    margin: `0 0 ${spacing.xs}px`,
                    fontSize: 16,
                    color: colors.textPrimary,
                  }}
                >
                  Рекламные кампании
                </h2>
                <p style={{ margin: `0 0 ${spacing.md}px`, ...FONT_PAGE, color: colors.textMuted }}>
                  Метрики — по кампании за выбранный период (не доля SKU). Синхронизируйте РК на странице «Реклама».
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr style={{ backgroundColor: colors.funnelBg }}>
                        {['Название', 'ID', 'Тип', 'Статус', 'SKU', 'Показы', 'Клики', 'Расход'].map(
                          (label, idx) => (
                            <th
                              key={label}
                              style={{
                                ...thStyle,
                                textAlign: idx >= 4 ? 'right' : 'left',
                              }}
                            >
                              {label}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.campaigns.map((c) => (
                        <tr key={c.id}>
                          <td style={tdStyle}>
                            <Link
                              to="/advertising/campaigns"
                              style={{ color: colors.primary, fontWeight: 500, textDecoration: 'none' }}
                            >
                              {c.name}
                            </Link>
                          </td>
                          <td style={tdStyle}>{c.id}</td>
                          <td style={tdStyle}>{c.type ?? '—'}</td>
                          <td style={tdStyle}>{c.statusName ?? '—'}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{formatInt(c.articlesCount)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{formatInt(c.views)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{formatInt(c.clicks)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMoney(c.costs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div
              style={{ ...cardStyle, marginBottom: 0 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = shadows.lg
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = shadows.md
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                  marginBottom: spacing.md,
                }}
              >
                <h2
                  style={{
                    ...typography.h2,
                    ...FONT_PAGE,
                    margin: 0,
                    fontSize: 16,
                    color: colors.textPrimary,
                  }}
                >
                  По дням
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
                  <DatePicker.RangePicker
                    locale={locale.DatePicker}
                    value={dailyRange}
                    onChange={handleDailyRangeChange}
                    format="DD.MM.YYYY"
                    allowClear={false}
                    maxDate={dayjs().subtract(1, 'day')}
                  />
                  <Button
                    icon={<ReloadOutlined />}
                    loading={analyticsRefreshLoading}
                    onClick={() => void handleRefreshAnalytics()}
                  >
                    Синхронизировать аналитику
                  </Button>
                </div>
              </div>
              <OzonAnalyticsChart dailyData={data.dailyData ?? []} dateRange={dailyRange} />
              <div style={{ overflowX: 'auto', marginTop: spacing.md }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.funnelBg }}>
                      <th style={thStyle}>Дата</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Заказы, шт</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Выручка, ₽</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Цена</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Старая цена</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.dailyData ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: colors.textMuted }}>
                          Нет данных за выбранный период. Запустите синхронизацию аналитики Ozon.
                        </td>
                      </tr>
                    ) : (
                      [...(data.dailyData ?? [])].reverse().map((row) => (
                        <tr key={row.date}>
                          <td style={tdStyle}>{dayjs(row.date).format('DD.MM.YYYY')}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{formatInt(row.orders)}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{formatMoney(row.ordersAmount)}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{formatMoney(row.priceWithDiscount)}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{formatMoney(row.priceBeforeDiscount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function MetricsComparisonTable({
  title,
  metrics,
  period1Label,
  period2Label,
}: {
  title: string
  metrics: Metric[]
  period1Label: string
  period2Label: string
}) {
  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: colors.funnelBg }}>
            <th style={metricThStyle}>{title}</th>
            <th style={{ ...metricThStyle, textAlign: 'center', backgroundColor: colors.bgGrayLight }}>
              {period1Label}
            </th>
            <th style={{ ...metricThStyle, textAlign: 'center', backgroundColor: colors.bgGrayLight }}>
              {period2Label}
            </th>
            <th style={{ ...metricThStyle, textAlign: 'center', backgroundColor: colors.bgGrayLight }}>
              Разница
            </th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => {
            const p1 = metric.periods.find((p) => p.periodId === 1)
            const p2 = metric.periods.find((p) => p.periodId === 2)
            const change = p2?.changePercent ?? null
            return (
              <tr
                key={metric.metricName}
                style={{ transition: transitions.fast, backgroundColor: colors.bgWhite }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.funnelBgHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bgWhite
                }}
              >
                <td style={metricTdStyle}>{metric.metricNameRu}</td>
                <td style={{ ...metricTdStyle, textAlign: 'center' }}>
                  {formatMetricValue(metric.metricName, p1?.value as number | null | undefined)}
                </td>
                <td style={{ ...metricTdStyle, textAlign: 'center' }}>
                  {formatMetricValue(metric.metricName, p2?.value as number | null | undefined)}
                </td>
                <td
                  style={{
                    ...metricTdStyle,
                    textAlign: 'center',
                    color: diffColor(metric.metricName, change),
                    fontWeight: 600,
                  }}
                >
                  {formatDiff(change)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function StocksPanel({
  stocks,
  stocksFulfillment,
  onFulfillmentChange,
  stocksUpdateLoading,
  onRefreshStocks,
  lastStocksUpdateTriggeredAt,
  cabinetId,
}: {
  stocks: Stock[]
  stocksFulfillment: StocksFulfillment
  onFulfillmentChange: (v: StocksFulfillment) => void
  stocksUpdateLoading: boolean
  onRefreshStocks: () => void
  lastStocksUpdateTriggeredAt: string | null
  cabinetId: number
}) {
  const latestUpdate =
    stocks.length > 0
      ? stocks
          .map((s) => s.updatedAt)
          .filter((d): d is string => d != null)
          .sort()
          .reverse()[0]
      : null
  const totalAmount = stocks.reduce((sum, stock) => sum + stock.amount, 0)
  const stocksTooRecent =
    lastStocksUpdateTriggeredAt != null &&
    dayjs(lastStocksUpdateTriggeredAt).isAfter(dayjs().subtract(1, 'hour'))
  const stocksButtonDisabled = stocksTooRecent || stocksUpdateLoading

  const stocksTooltipTitle = stocksTooRecent && lastStocksUpdateTriggeredAt
    ? (() => {
        const nextAt = dayjs(lastStocksUpdateTriggeredAt).add(1, 'hour')
        const mins = Math.ceil(Math.max(0, nextAt.diff(dayjs(), 'minute', true)))
        if (mins >= 60) {
          const h = Math.ceil(mins / 60)
          return `Повторное обновление доступно через ${h} ${h === 1 ? 'час' : h < 5 ? 'часа' : 'часов'}`
        }
        return `Повторное обновление доступно через ${mins} ${mins === 1 ? 'минуту' : mins < 5 ? 'минуты' : 'минут'}`
      })()
    : 'Запустить обновление остатков'

  return (
    <div
      style={{
        flex: '0 1 25%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `1px solid ${colors.borderLight}`,
        paddingLeft: spacing.lg,
        minWidth: 280,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spacing.xs }}>
        <FboFbsStocksSwitch value={stocksFulfillment} onChange={onFulfillmentChange} />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
          flexWrap: 'nowrap',
          minWidth: 0,
        }}
      >
        <h2
          style={{
            ...typography.h2,
            ...FONT_PAGE,
            margin: 0,
            color: colors.textPrimary,
            whiteSpace: 'nowrap',
            fontSize: 16,
            lineHeight: 1.4,
            flexShrink: 0,
          }}
        >
          Остатки на {latestUpdate ? dayjs(latestUpdate).format('DD.MM.YY HH:mm') : 'дату'}
        </h2>
        <Tooltip title={stocksTooltipTitle}>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined style={{ fontSize: 14 }} />}
            loading={stocksUpdateLoading}
            disabled={stocksButtonDisabled}
            onClick={onRefreshStocks}
            style={{ width: 28, height: 28, padding: 0, flexShrink: 0 }}
          />
        </Tooltip>
        {stocks.length > 0 && (
          <div style={{ marginLeft: 'auto', flexShrink: 0 }} title={latestUpdate ? `Обновлено ${dayjs(latestUpdate).format('DD.MM.YY HH:mm')}` : ''}>
            <div
              style={{
                ...typography.h3,
                ...FONT_PAGE,
                color: colors.bgWhite,
                backgroundColor: colors.primary,
                padding: `${spacing.xs}px ${spacing.sm}px`,
                borderRadius: borderRadius.sm,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Всего {totalAmount.toLocaleString('ru-RU')}
            </div>
          </div>
        )}
      </div>
      {stocks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: spacing.xl, ...FONT_PAGE, color: colors.textSecondary }}>
          нет данных
        </div>
      ) : (
        <div style={{ flex: '1 1 0', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: colors.primaryLight }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.primary}`,
                    ...FONT_PAGE,
                    fontWeight: 600,
                    color: colors.primary,
                  }}
                >
                  Склад
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.primary}`,
                    ...FONT_PAGE,
                    fontWeight: 600,
                    backgroundColor: colors.primaryLight,
                    color: colors.primary,
                  }}
                >
                  Кол-во
                </th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => {
                const isZeroStock = stock.amount === 0
                const isLowStock = stock.amount > 0 && stock.amount <= 1
                return (
                  <tr key={`${stock.warehouseName}-${index}`}>
                    <td
                      style={{
                        padding: spacing.md,
                        borderBottom: `1px solid ${colors.border}`,
                        ...FONT_PAGE,
                        color: isZeroStock ? colors.textMuted : colors.textPrimary,
                      }}
                    >
                      {stock.warehouseName}
                    </td>
                    <td
                      style={{
                        padding: spacing.md,
                        borderBottom: `1px solid ${colors.border}`,
                        ...FONT_PAGE,
                        fontWeight: isLowStock ? 600 : 400,
                        color: isZeroStock ? colors.textMuted : isLowStock ? colors.error : colors.textPrimary,
                      }}
                    >
                      {stock.amount.toLocaleString('ru-RU')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {!cabinetId && null}
    </div>
  )
}

function ArticleHeader({ article: response, productId }: { article: ArticleResponse; productId: number }) {
  const a = response.article
  const photoUrl = resolveArticlePhotoUrl(a)
  const productUrl = a.productUrl || OZON_CATALOG_URL(productId)

  return (
    <div
      style={{
        backgroundColor: colors.bgWhite,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        marginBottom: spacing.xl,
        boxShadow: shadows.md,
        transition: transitions.normal,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = shadows.lg
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = shadows.md
      }}
    >
      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'stretch' }}>
        {photoUrl ? (
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              flexShrink: 0,
              alignSelf: 'stretch',
              width: ARTICLE_HEADER_PHOTO_WIDTH,
              minWidth: ARTICLE_HEADER_PHOTO_WIDTH,
              minHeight: ARTICLE_HEADER_PHOTO_HEIGHT,
              borderRadius: borderRadius.sm,
              overflow: 'hidden',
              border: `1px solid ${colors.borderLight}`,
              cursor: 'pointer',
              transition: transitions.fast,
              backgroundColor: colors.bgWhite,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            <img
              src={photoUrl}
              alt={a.title ?? ''}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
              }}
            />
          </a>
        ) : (
          <div
            style={{
              width: ARTICLE_HEADER_PHOTO_WIDTH,
              minWidth: ARTICLE_HEADER_PHOTO_WIDTH,
              minHeight: ARTICLE_HEADER_PHOTO_HEIGHT,
              backgroundColor: colors.bgGrayLight,
              borderRadius: borderRadius.sm,
              border: `1px solid ${colors.borderLight}`,
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: '0 1 auto', minWidth: 0 }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>
            <Link to="/analytics/products" style={{ color: colors.primary }}>
              ← Товары
            </Link>
          </div>
          <div
            style={{
              ...typography.body,
              ...FONT_PAGE,
              fontWeight: 700,
              color: colors.textPrimary,
              marginBottom: 4,
            }}
          >
            {a.title || '—'}
          </div>
          {(a.subjectName || a.brand) && (
            <div style={{ color: colors.textSecondary, marginBottom: 2, fontSize: 12 }}>
              {[a.subjectName, a.brand].filter(Boolean).join(' · ')}
            </div>
          )}
          <div style={{ color: colors.textSecondary, marginBottom: 2, fontSize: 12 }}>
            Product ID:{' '}
            <a href={productUrl} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 500 }}>
              {productId}
            </a>
          </div>
          {a.vendorCode && (
            <div style={{ color: colors.textSecondary, marginBottom: 6, fontSize: 12 }}>
              Offer ID:{' '}
              <span style={{ color: colors.primary, fontWeight: 500 }}>{a.vendorCode}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: `${spacing.md}px`,
  borderBottom: `2px solid ${colors.borderHeader}`,
  ...FONT_PAGE,
  fontWeight: 600,
  color: colors.textPrimary,
}

const tdStyle: CSSProperties = {
  padding: `${spacing.sm}px ${spacing.md}px`,
  borderBottom: `1px solid ${colors.border}`,
  ...FONT_PAGE,
  color: colors.textPrimary,
}

const metricThStyle: CSSProperties = {
  textAlign: 'left',
  padding: spacing.md,
  borderBottom: `2px solid ${colors.borderHeader}`,
  borderRight: `2px solid ${colors.border}`,
  ...FONT_PAGE,
  fontWeight: 600,
  width: '35%',
}

const metricTdStyle: CSSProperties = {
  padding: spacing.md,
  borderBottom: `1px solid ${colors.border}`,
  borderRight: `2px solid ${colors.border}`,
  ...FONT_PAGE,
}
