import { useMemo, useState, useCallback, type CSSProperties } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spin, Alert, DatePicker, Button, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import type { ArticleResponse, Period } from '../types/analytics'
import Header, { type CabinetSelectProps, type WorkContextCabinetSelectProps } from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import OzonAnalyticsChart from '../components/OzonAnalyticsChart'
import { userApi } from '../api/user'
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  ARTICLE_HEADER_PHOTO_HEIGHT,
  ARTICLE_HEADER_PHOTO_WIDTH,
} from '../styles/analytics'

const { RangePicker } = DatePicker

function buildDefaultPeriods(): Period[] {
  const yesterday = dayjs().subtract(1, 'day')
  const period2From = yesterday.subtract(6, 'day')
  const period1To = period2From.subtract(1, 'day')
  const period1From = period1To.subtract(6, 'day')
  return [
    {
      id: 1,
      name: 'Период 1',
      dateFrom: period1From.format('YYYY-MM-DD'),
      dateTo: period1To.format('YYYY-MM-DD'),
    },
    {
      id: 2,
      name: 'Период 2',
      dateFrom: period2From.format('YYYY-MM-DD'),
      dateTo: yesterday.format('YYYY-MM-DD'),
    },
  ]
}

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

function formatPeriodLabel(period: Period): string {
  return `${dayjs(period.dateFrom).format('DD.MM')} – ${dayjs(period.dateTo).format('DD.MM')}`
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
  const periods = useMemo(() => buildDefaultPeriods(), [])

  const defaultDailyRange = useMemo((): [Dayjs, Dayjs] => {
    const end = dayjs().subtract(1, 'day')
    const start = end.subtract(13, 'day')
    return [start, end]
  }, [])

  const [dailyRange, setDailyRange] = useState<[Dayjs, Dayjs]>(defaultDailyRange)
  const [analyticsRefreshLoading, setAnalyticsRefreshLoading] = useState(false)

  const dailyFrom = dailyRange[0].format('YYYY-MM-DD')
  const dailyTo = dailyRange[1].format('YYYY-MM-DD')

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'ozon-article',
      productId,
      selectedCabinetId,
      selectedSellerId,
      dailyFrom,
      dailyTo,
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

  const fboStock = data?.stocks?.[0]?.amount ?? null
  const fbsStock = data?.fbsStocks?.[0]?.amount ?? null

  const ozonMetrics = useMemo(
    () => (data?.metrics ?? []).filter((m) => m.metricName === 'orders' || m.metricName === 'orders_amount'),
    [data?.metrics],
  )

  const handleDailyRangeChange = useCallback(
    (values: [Dayjs | null, Dayjs | null] | null) => {
      if (values?.[0] && values[1]) {
        setDailyRange([values[0], values[1]])
      }
    },
    [],
  )

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
          flex: 1,
          padding: `${spacing.lg}px ${spacing.xl}px ${spacing.xxl}px`,
          backgroundColor: colors.bgGray,
          minHeight: '60vh',
        }}
      >
        {isLoading && (
          <div style={{ textAlign: 'center', padding: spacing.xxl }}>
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
            <ArticleHeader article={data} productId={productId} fboStock={fboStock} fbsStock={fbsStock} />

            {ozonMetrics.length > 0 && data.periods.length > 0 && (
              <section
                style={{
                  backgroundColor: colors.bgWhite,
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.borderLight}`,
                  boxShadow: shadows.md,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                }}
              >
                <h2 style={{ ...typography.h3, margin: `0 0 ${spacing.md}px` }}>Сравнение периодов</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360 }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Метрика</th>
                        {data.periods.map((p) => (
                          <th key={p.id} style={{ ...thStyle, textAlign: 'right' }}>
                            {formatPeriodLabel(p)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ozonMetrics.map((metric) => (
                        <tr key={metric.metricName}>
                          <td style={tdStyle}>{metric.metricNameRu}</td>
                          {data.periods.map((p) => {
                            const pv = metric.periods.find((x) => x.periodId === p.id)
                            const val = pv?.value
                            const display =
                              metric.metricName === 'orders_amount'
                                ? formatMoney(val as number | null)
                                : formatInt(val as number | null)
                            return (
                              <td key={p.id} style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                {display}
                                {pv?.changePercent != null && (
                                  <div style={{ fontSize: 11, color: colors.textMuted }}>
                                    {pv.changePercent >= 0 ? '+' : ''}
                                    {Number(pv.changePercent).toFixed(1)}%
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {(data.campaigns?.length ?? 0) > 0 && (
              <section
                style={{
                  backgroundColor: colors.bgWhite,
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.borderLight}`,
                  boxShadow: shadows.md,
                  padding: spacing.lg,
                  marginBottom: spacing.lg,
                }}
              >
                <h2 style={{ ...typography.h3, margin: `0 0 ${spacing.xs}px` }}>Рекламные кампании</h2>
                <p style={{ margin: `0 0 ${spacing.md}px`, fontSize: 12, color: colors.textMuted }}>
                  Метрики — по кампании за выбранный период (не доля SKU). Синхронизируйте РК на странице «Реклама».
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Название</th>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Тип</th>
                        <th style={thStyle}>Статус</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>SKU</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Показы</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Клики</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Расход</th>
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
              </section>
            )}

            <section
              style={{
                backgroundColor: colors.bgWhite,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.borderLight}`,
                boxShadow: shadows.md,
                padding: spacing.lg,
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
                <h2 style={{ ...typography.h3, margin: 0 }}>По дням</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
                  <RangePicker
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
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Дата</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Заказы, шт</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Выручка, ₽</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Цена</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Старая цена</th>
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
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{formatInt(row.orders)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMoney(row.ordersAmount)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMoney(row.priceWithDiscount)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{formatMoney(row.priceBeforeDiscount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  )
}

function ArticleHeader({
  article: response,
  productId,
  fboStock,
  fbsStock,
}: {
  article: ArticleResponse
  productId: number
  fboStock: number | null
  fbsStock: number | null
}) {
  const a = response.article
  return (
    <div
      style={{
        display: 'flex',
        gap: spacing.lg,
        flexWrap: 'wrap',
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.borderLight}`,
        boxShadow: shadows.md,
        padding: spacing.lg,
        marginBottom: spacing.lg,
      }}
    >
      {a.photoTm ? (
        <img
          src={a.photoTm}
          alt=""
          width={ARTICLE_HEADER_PHOTO_WIDTH}
          height={ARTICLE_HEADER_PHOTO_HEIGHT}
          style={{ objectFit: 'cover', borderRadius: borderRadius.sm, flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: ARTICLE_HEADER_PHOTO_WIDTH,
            height: ARTICLE_HEADER_PHOTO_HEIGHT,
            backgroundColor: colors.bgGrayLight,
            borderRadius: borderRadius.sm,
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>
          <Link to="/analytics/products" style={{ color: colors.primary }}>
            ← Товары Ozon
          </Link>
        </div>
        <h1 style={{ ...typography.h2, margin: `0 0 ${spacing.sm}px` }}>{a.title || '—'}</h1>
        <div style={{ ...typography.body, color: colors.textSecondary, lineHeight: 1.6 }}>
          <div>
            Product ID: <strong>{productId}</strong>
          </div>
          {a.vendorCode && (
            <div>
              Offer ID: <strong>{a.vendorCode}</strong>
            </div>
          )}
          <div style={{ marginTop: spacing.sm }}>
            Остатки: FBO <strong>{fboStock ?? '—'}</strong> · FBS <strong>{fbsStock ?? '—'}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: `2px solid ${colors.border}`,
  fontSize: 12,
  fontWeight: 600,
  color: colors.textPrimary,
}

const tdStyle: CSSProperties = {
  padding: '8px 12px',
  borderBottom: `1px solid ${colors.borderLight}`,
  fontSize: 13,
  color: colors.textPrimary,
}
