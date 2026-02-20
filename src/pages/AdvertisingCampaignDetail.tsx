import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Spin, DatePicker, Checkbox, Switch, Button, Radio, Select, message, Input, Modal } from 'antd'
import { DownloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import locale from 'antd/locale/ru_RU'
import { useQuery, useQueries } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId, getStoredCabinetIdForSeller, setStoredCabinetIdForSeller } from '../api/cabinets'
import { userApi } from '../api/user'
import type { ArticleSummary, ArticleResponse, DailyData, Stock, CampaignNote } from '../types/analytics'
import { colors, typography, spacing, borderRadius, shadows } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import AnalyticsChart from '../components/AnalyticsChart'
import * as XLSX from 'xlsx'

dayjs.locale('ru')

const COMBO_PHOTO_SIZE = 80
const FONT_PAGE = { fontSize: '12px' as const }
const FONT_PAGE_SMALL = { fontSize: '11px' as const }
const WB_CATALOG_URL = (nmId: number) => `https://www.wildberries.ru/catalog/${nmId}/detail.aspx`

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
} as const
type FunnelKey = keyof typeof FUNNELS
const FUNNEL_ORDER: FunnelKey[] = ['general', 'advertising']

function getDatesInRange(from: Dayjs, to: Dayjs): string[] {
  const days: string[] = []
  let cur = from.startOf('day')
  const end = to.endOf('day')
  while (cur.isBefore(end) || cur.isSame(end, 'day')) {
    days.push(cur.format('YYYY-MM-DD'))
    cur = cur.add(1, 'day')
  }
  return days
}

export default function AdvertisingCampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const role = useAuthStore((state) => state.role)
  const isManagerOrAdmin = role === 'ADMIN' || role === 'MANAGER'

  const [selectedSellerId, setSelectedSellerId] = useState<number | undefined>(() => {
    if (!isManagerOrAdmin) return undefined
    const saved = localStorage.getItem('analytics_selected_seller_id')
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!Number.isNaN(parsed)) return parsed
    }
    return undefined
  })

  const { data: myCabinets = [], isLoading: myCabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'SELLER' || role === 'WORKER',
  })

  const { data: activeSellers = [], isLoading: activeSellersLoading } = useQuery({
    queryKey: ['activeSellers'],
    queryFn: () => userApi.getActiveSellers(),
    enabled: isManagerOrAdmin,
  })

  const { data: sellerCabinets = [], isLoading: sellerCabinetsLoading } = useQuery({
    queryKey: ['sellerCabinets', selectedSellerId],
    queryFn: () => userApi.getSellerCabinets(selectedSellerId!),
    enabled: isManagerOrAdmin && selectedSellerId != null,
  })

  const cabinets = isManagerOrAdmin ? sellerCabinets : myCabinets
  const cabinetsLoading = isManagerOrAdmin
    ? (selectedSellerId == null ? activeSellersLoading : sellerCabinetsLoading)
    : myCabinetsLoading
  const storedCabinetId = isManagerOrAdmin && selectedSellerId != null
    ? getStoredCabinetIdForSeller(selectedSellerId)
    : getStoredCabinetId()
  const selectedCabinetId = cabinets.length > 0
    ? (storedCabinetId != null && cabinets.some((c) => c.id === storedCabinetId) ? storedCabinetId : cabinets[0].id)
    : null

  useEffect(() => {
    if (isManagerOrAdmin && activeSellers.length > 0 && selectedSellerId == null) {
      setSelectedSellerId(activeSellers[0].id)
      localStorage.setItem('analytics_selected_seller_id', String(activeSellers[0].id))
    }
  }, [isManagerOrAdmin, activeSellers, selectedSellerId])

  const setSelectedCabinetId = useCallback(
    (cid: number | null) => {
      if (isManagerOrAdmin && selectedSellerId != null) {
        setStoredCabinetIdForSeller(selectedSellerId, cid)
      } else {
        setStoredCabinetId(cid)
      }
    },
    [isManagerOrAdmin, selectedSellerId]
  )

  const cabinetSelectProps =
    cabinets.length > 0
      ? {
          cabinets: cabinets.map((c) => ({ id: c.id, name: c.name })),
          selectedCabinetId,
          onCabinetChange: setSelectedCabinetId,
          loading: false,
        }
      : undefined

  const sellerSelectProps =
    isManagerOrAdmin && activeSellers.length > 0
      ? {
          sellers: activeSellers.map((s) => ({ id: s.id, email: s.email })),
          selectedSellerId: selectedSellerId ?? undefined,
          onSellerChange: (sid: number) => {
            setSelectedSellerId(sid)
            localStorage.setItem('analytics_selected_seller_id', String(sid))
          },
        }
      : undefined

  const userId = useAuthStore((s) => s.userId)
  const getSelectedSellerId = () => (isManagerOrAdmin ? selectedSellerId : userId ?? undefined)

  const campaignId = id != null ? parseInt(id, 10) : NaN
  const cabinetIdForRequest = selectedCabinetId ?? storedCabinetId ?? undefined
  const sellerIdForRequest = isManagerOrAdmin ? selectedSellerId ?? undefined : userId ?? undefined
  const {
    data: campaign,
    isLoading,
    isFetched,
    error,
  } = useQuery({
    queryKey: ['campaign-detail', campaignId, cabinetIdForRequest, sellerIdForRequest],
    queryFn: () =>
      analyticsApi.getCampaignDetail(campaignId, sellerIdForRequest, cabinetIdForRequest),
    enabled: !Number.isNaN(campaignId),
    refetchOnMount: 'always',
  })

  const articles = campaign?.articles ?? []
  const firstNmId = articles.length > 0 ? articles[0].nmId : null

  const [selectedFunnelArticleNmId, setSelectedFunnelArticleNmId] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    const end = dayjs().subtract(1, 'day')
    const start = end.subtract(13, 'day')
    return [start, end]
  })
  const [selectedFunnelKeys, setSelectedFunnelKeys] = useState<FunnelKey[]>(['general', 'advertising'])
  const [showChart, setShowChart] = useState(false)
  const [period1, setPeriod1] = useState<[Dayjs, Dayjs]>(() => {
    const end = dayjs().subtract(1, 'day')
    return [end.subtract(13, 'day'), end.subtract(7, 'day')]
  })
  const [period2, setPeriod2] = useState<[Dayjs, Dayjs]>(() => {
    const end = dayjs().subtract(1, 'day')
    return [end.subtract(6, 'day'), end]
  })
  const [selectedStockNmId, setSelectedStockNmId] = useState<number | null>(null)

  useEffect(() => {
    if (firstNmId != null && selectedFunnelArticleNmId == null) setSelectedFunnelArticleNmId(firstNmId)
  }, [firstNmId, selectedFunnelArticleNmId])
  useEffect(() => {
    if (firstNmId != null && selectedStockNmId == null) setSelectedStockNmId(firstNmId)
  }, [firstNmId, selectedStockNmId])

  const toggleFunnel = useCallback((key: FunnelKey) => {
    setSelectedFunnelKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }, [])

  const { data: funnelArticle, isLoading: funnelArticleLoading } = useQuery({
    queryKey: ['article', selectedFunnelArticleNmId, cabinetIdForRequest],
    queryFn: () =>
      analyticsApi.getArticle(
        selectedFunnelArticleNmId!,
        [],
        getSelectedSellerId() ?? undefined,
        cabinetIdForRequest
      ),
    enabled: selectedFunnelArticleNmId != null && cabinetIdForRequest != null,
  })

  const articleNmIds = useMemo(() => articles.map((a) => a.nmId), [articles])
  const articleQueries = useQueries({
    queries: articleNmIds.map((nmId) => ({
      queryKey: ['article-combo', nmId, cabinetIdForRequest],
      queryFn: () =>
        analyticsApi.getArticle(nmId, [], getSelectedSellerId() ?? undefined, cabinetIdForRequest),
      enabled: cabinetIdForRequest != null && articleNmIds.length > 0,
    })),
  })
  const articleDataByNmId = useMemo(() => {
    const map: Record<number, ArticleResponse> = {}
    articleQueries.forEach((q, i) => {
      if (q.data && articleNmIds[i] != null) map[articleNmIds[i]] = q.data
    })
    return map
  }, [articleQueries, articleNmIds])

  const { data: stockArticle } = useQuery({
    queryKey: ['article-stocks', selectedStockNmId, cabinetIdForRequest],
    queryFn: () =>
      analyticsApi.getArticle(
        selectedStockNmId!,
        [],
        getSelectedSellerId() ?? undefined,
        cabinetIdForRequest
      ),
    enabled: selectedStockNmId != null && cabinetIdForRequest != null,
  })

  const formatValue = (value: number | null): string => {
    if (value === null || value === undefined) return '-'
    return value.toLocaleString('ru-RU')
  }
  const formatPercent = (value: number): string => `${value.toFixed(2).replace('.', ',')}%`
  const formatCurrency = (value: number): string =>
    `${value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`

  const rangeDates = useMemo(() => getDatesInRange(dateRange[0], dateRange[1]), [dateRange])
  const rangeDatesDesc = useMemo(() => [...rangeDates].reverse(), [rangeDates])

  const getMetricValueForDate = useCallback((dailyData: DailyData[] | undefined, metricKey: string, date: string): number | null => {
    if (!dailyData?.length) return null
    const d = dailyData.find((x) => x.date === date)
    if (!d) return null
    const map: Record<string, number | null | undefined> = {
      transitions: d.transitions, cart: d.cart, orders: d.orders, orders_amount: d.ordersAmount,
      cart_conversion: d.cartConversion, order_conversion: d.orderConversion,
      views: d.views, clicks: d.clicks, costs: d.costs, cpc: d.cpc, ctr: d.ctr, cpo: d.cpo, drr: d.drr,
    }
    const v = map[metricKey]
    return v != null ? v : null
  }, [])

  const getMetricTotalForPeriod = useCallback((
    dailyData: DailyData[] | undefined,
    dates: string[],
    metricKey: string
  ): number | null => {
    if (!dailyData?.length) return null
    const values = dates.map((date) => getMetricValueForDate(dailyData, metricKey, date)).filter((v): v is number => v !== null)
    if (values.length === 0) return null
    if (metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr' || metricKey === 'cpc' || metricKey === 'cpo') {
      return values.reduce((a, b) => a + b, 0) / values.length
    }
    return values.reduce((a, b) => a + b, 0)
  }, [getMetricValueForDate])

  const aggregatePeriodData = useCallback((dailyData: DailyData[] | undefined, startDate: Dayjs, endDate: Dayjs) => {
    if (!dailyData?.length) return null
    const periodData = dailyData.filter((d) => {
      const date = dayjs(d.date)
      return (date.isAfter(startDate.startOf('day')) || date.isSame(startDate, 'day')) &&
        (date.isBefore(endDate.endOf('day')) || date.isSame(endDate, 'day'))
    })
    if (periodData.length === 0) return null
    const transitions = periodData.reduce((s, d) => s + (d.transitions || 0), 0)
    const cart = periodData.reduce((s, d) => s + (d.cart || 0), 0)
    const orders = periodData.reduce((s, d) => s + (d.orders || 0), 0)
    const ordersAmount = periodData.reduce((s, d) => s + (d.ordersAmount || 0), 0)
    const views = periodData.reduce((s, d) => s + (d.views || 0), 0)
    const clicks = periodData.reduce((s, d) => s + (d.clicks || 0), 0)
    const costs = periodData.reduce((s, d) => s + (d.costs || 0), 0)
    return {
      transitions, cart, orders, ordersAmount,
      cartConversion: transitions > 0 ? (cart / transitions) * 100 : null,
      orderConversion: cart > 0 ? (orders / cart) * 100 : null,
      views, clicks, costs,
      cpc: clicks > 0 ? costs / clicks : null,
      ctr: views > 0 ? (clicks / views) * 100 : null,
      cpo: orders > 0 ? costs / orders : null,
      drr: ordersAmount > 0 ? (costs / ordersAmount) * 100 : null,
    }
  }, [])

  const calculateDifference = (value1: number | null, value2: number | null, roundToDecimals?: number): number | null => {
    if (value1 === null || value2 === null || value1 === 0) return null
    let v1 = value1, v2 = value2
    if (roundToDecimals !== undefined) {
      const m = Math.pow(10, roundToDecimals)
      v1 = Math.round(value1 * m) / m
      v2 = Math.round(value2 * m) / m
    }
    if (Math.abs(v2 - v1) < 0.001) return null
    const diff = ((v2 - v1) / v1) * 100
    if (Math.abs(diff) < 0.01) return null
    return diff
  }

  const funnelDailyData = funnelArticle?.dailyData
  const sortedFunnelKeys = useMemo(
    () => [...selectedFunnelKeys].sort((a, b) => FUNNEL_ORDER.indexOf(a) - FUNNEL_ORDER.indexOf(b)),
    [selectedFunnelKeys]
  )
  const selectedFunnel1 = sortedFunnelKeys[0]

  const periodAggregatesByNmId = useMemo(() => {
    const map: Record<number, { p1: ReturnType<typeof aggregatePeriodData>; p2: ReturnType<typeof aggregatePeriodData> }> = {}
    articles.forEach((art) => {
      const data = articleDataByNmId[art.nmId]
      const daily = data?.dailyData
      map[art.nmId] = {
        p1: aggregatePeriodData(daily, period1[0], period1[1]),
        p2: aggregatePeriodData(daily, period2[0], period2[1]),
      }
    })
    return map
  }, [articles, articleDataByNmId, period1, period2, aggregatePeriodData])

  const totalPeriod1 = useMemo(() => {
    let t = { transitions: 0, cart: 0, orders: 0, ordersAmount: 0, views: 0, clicks: 0, costs: 0 }
    let hasAny = false
    Object.values(periodAggregatesByNmId).forEach(({ p1 }) => {
      if (!p1) return
      hasAny = true
      t.transitions += p1.transitions
      t.cart += p1.cart
      t.orders += p1.orders
      t.ordersAmount += p1.ordersAmount
      t.views += p1.views
      t.clicks += p1.clicks
      t.costs += p1.costs
    })
    if (!hasAny) return null
    return {
      ...t,
      cartConversion: t.transitions > 0 ? (t.cart / t.transitions) * 100 : null,
      orderConversion: t.cart > 0 ? (t.orders / t.cart) * 100 : null,
      cpc: t.clicks > 0 ? t.costs / t.clicks : null,
      ctr: t.views > 0 ? (t.clicks / t.views) * 100 : null,
      cpo: t.orders > 0 ? t.costs / t.orders : null,
      drr: t.ordersAmount > 0 ? (t.costs / t.ordersAmount) * 100 : null,
    }
  }, [periodAggregatesByNmId])

  const totalPeriod2 = useMemo(() => {
    let t = { transitions: 0, cart: 0, orders: 0, ordersAmount: 0, views: 0, clicks: 0, costs: 0 }
    let hasAny = false
    Object.values(periodAggregatesByNmId).forEach(({ p2 }) => {
      if (!p2) return
      hasAny = true
      t.transitions += p2.transitions
      t.cart += p2.cart
      t.orders += p2.orders
      t.ordersAmount += p2.ordersAmount
      t.views += p2.views
      t.clicks += p2.clicks
      t.costs += p2.costs
    })
    if (!hasAny) return null
    return {
      ...t,
      cartConversion: t.transitions > 0 ? (t.cart / t.transitions) * 100 : null,
      orderConversion: t.cart > 0 ? (t.orders / t.cart) * 100 : null,
      cpc: t.clicks > 0 ? t.costs / t.clicks : null,
      ctr: t.views > 0 ? (t.clicks / t.views) * 100 : null,
      cpo: t.orders > 0 ? t.costs / t.orders : null,
      drr: t.ordersAmount > 0 ? (t.costs / t.ordersAmount) * 100 : null,
    }
  }, [periodAggregatesByNmId])

  const handleExportFunnelsExcel = useCallback(() => {
    if (!funnelArticle || !selectedFunnelArticleNmId) return
    const headers: string[] = ['Дата']
    const metricKeys: string[] = []
    for (const key of FUNNEL_ORDER) {
      for (const m of FUNNELS[key].metrics) {
        headers.push(m.name.replace(/\n/g, ' '))
        metricKeys.push(m.key)
      }
    }
    const rows: (string | number)[][] = [headers]
    for (const date of rangeDatesDesc) {
      const row: (string | number)[] = [dayjs(date).format('DD.MM.YYYY')]
      for (const metricKey of metricKeys) {
        const v = getMetricValueForDate(funnelDailyData, metricKey, date)
        const isPercent = metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr'
        const isCurrency = metricKey === 'orders_amount' || metricKey === 'costs' || metricKey === 'cpc' || metricKey === 'cpo'
        row.push(v === null ? '' : isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v))
      }
      rows.push(row)
    }
    const totalRow: (string | number)[] = ['Весь период']
    for (const metricKey of metricKeys) {
      const v = getMetricTotalForPeriod(funnelDailyData, rangeDates, metricKey)
      const isPercent = metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr'
      const isCurrency = metricKey === 'orders_amount' || metricKey === 'costs' || metricKey === 'cpc' || metricKey === 'cpo'
      totalRow.push(v === null ? '' : isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v))
    }
    rows.push(totalRow)
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Воронки')
    XLSX.writeFile(wb, `combo_${selectedFunnelArticleNmId}_воронки_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}.xlsx`)
    message.success('Файл выгружен')
  }, [funnelArticle, selectedFunnelArticleNmId, funnelDailyData, rangeDatesDesc, rangeDates, dateRange, getMetricValueForDate, getMetricTotalForPeriod, formatValue, formatPercent, formatCurrency])

  const isActive = campaign?.status === 9
  const statusLabel = campaign ? (isActive ? 'активна' : 'приостановлена') : ''
  const statusBg = isActive ? colors.success : colors.error

  if (campaignId == null || Number.isNaN(campaignId)) {
    return (
      <>
        <Header cabinetSelectProps={cabinetSelectProps} sellerSelectProps={sellerSelectProps} />
        <Breadcrumbs />
        <div style={{ padding: spacing.lg, color: colors.textSecondary }}>Неверный ID кампании</div>
      </>
    )
  }

  if (!Number.isNaN(campaignId) && isFetched && (error || !campaign)) {
    return (
      <>
        <Header cabinetSelectProps={cabinetSelectProps} sellerSelectProps={sellerSelectProps} />
        <Breadcrumbs />
        <div style={{ padding: spacing.lg, color: colors.error }}>Кампания не найдена</div>
      </>
    )
  }
  if (!Number.isNaN(campaignId) && cabinetIdForRequest == null && !cabinetsLoading) {
    return (
      <>
        <Header cabinetSelectProps={cabinetSelectProps} sellerSelectProps={sellerSelectProps} />
        <Breadcrumbs />
        <div style={{ padding: spacing.lg, color: colors.textSecondary }}>
          {cabinets.length === 0 ? 'Нет доступных кабинетов' : 'Выберите кабинет для просмотра кампании'}
        </div>
      </>
    )
  }
  if (!Number.isNaN(campaignId) && cabinetIdForRequest == null && cabinetsLoading) {
    return (
      <>
        <Header cabinetSelectProps={cabinetSelectProps} sellerSelectProps={sellerSelectProps} />
        <Breadcrumbs />
        <div style={{ padding: spacing.lg, textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: spacing.md, color: colors.textSecondary }}>Загрузка…</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header cabinetSelectProps={cabinetSelectProps} sellerSelectProps={sellerSelectProps} />
      <Breadcrumbs />
      <div
        style={{
          padding: spacing.lg,
          backgroundColor: colors.bgGray,
          minHeight: '100vh',
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: spacing.xxl }}>
            <Spin size="large" />
          </div>
        ) : campaign ? (
          <>
            {/* Блок 1: Название, статус, ID, кол-во товаров */}
            <div
              style={{
                backgroundColor: colors.bgWhite,
                border: `1px solid ${colors.borderLight}`,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                boxShadow: shadows.md,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
                <h1 style={{ ...typography.h2, margin: 0, color: colors.textPrimary }}>{campaign.name}</h1>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: borderRadius.sm,
                    backgroundColor: statusBg,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {statusLabel}
                </span>
                <span style={{ ...typography.body, color: colors.textSecondary }}>ID {campaign.id}</span>
                <span style={{ ...typography.body, color: colors.textSecondary }}>
                  {campaign.articlesCount} шт.
                </span>
              </div>

              {/* Перечень товаров комбо: в строку, фото + название и артикул в две строки по высоте фото */}
              <div style={{ overflowX: 'auto', paddingBottom: spacing.sm }}>
                <div style={{ display: 'flex', gap: spacing.lg, minWidth: 'min-content' }}>
                  {(campaign.articles ?? []).map((art) => (
                    <ComboProductItem key={art.nmId} article={art} photoSize={COMBO_PHOTO_SIZE} />
                  ))}
                </div>
              </div>
            </div>

            {/* Блок 2 — Воронки + выбор артикула */}
            <div
              style={{
                backgroundColor: colors.bgWhite,
                border: `1px solid ${colors.borderLight}`,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                boxShadow: shadows.md,
              }}
            >
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
                    <Checkbox checked={selectedFunnelKeys.includes('general')} onChange={() => toggleFunnel('general')}>Общая</Checkbox>
                    <Checkbox checked={selectedFunnelKeys.includes('advertising')} onChange={() => toggleFunnel('advertising')}>Реклама</Checkbox>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, ...typography.body }}>
                      <Switch checked={showChart} onChange={setShowChart} size="small" />
                      <span>График</span>
                    </span>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportFunnelsExcel} disabled={!funnelArticle}>
                      Выгрузить
                    </Button>
                  </div>
                </div>
                <div style={{ marginBottom: spacing.md }}>
                  <span style={{ marginRight: spacing.sm, ...typography.body }}>Артикул для воронки:</span>
                  <Radio.Group
                    value={selectedFunnelArticleNmId ?? undefined}
                    onChange={(e) => setSelectedFunnelArticleNmId(e.target.value)}
                    optionType="button"
                    size="small"
                  >
                    {articles.map((art) => (
                      <Radio.Button key={art.nmId} value={art.nmId}>
                        {art.title ? (art.title.length > 25 ? art.title.slice(0, 25) + '…' : art.title) : art.nmId}
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </div>
                {funnelArticleLoading && <Spin size="small" style={{ marginBottom: spacing.md }} />}
                {selectedFunnel1 && funnelArticle?.dailyData && (
                  <div style={{ maxHeight: 438, overflowY: 'auto', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `2px solid ${colors.border}`, fontSize: 12, fontWeight: 600, position: 'sticky', top: 0, left: 0, backgroundColor: colors.bgWhite, zIndex: 2, width: 90 }}>Дата</th>
                          {FUNNEL_ORDER.filter((k) => selectedFunnelKeys.includes(k)).flatMap((key) =>
                            FUNNELS[key].metrics.map((m) => (
                              <th key={m.key} style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`, fontSize: 12, fontWeight: 600, position: 'sticky', top: 0, backgroundColor: colors.bgWhite, zIndex: 2, minWidth: 70 }}>
                                {m.name.split('\n').map((line, i) => (<span key={i}>{line}<br /></span>))}
                              </th>
                            ))
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {rangeDatesDesc.map((date) => (
                          <tr key={date}>
                            <td style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `2px solid ${colors.border}`, ...FONT_PAGE_SMALL }}>{dayjs(date).format('DD.MM.YYYY')}</td>
                            {FUNNEL_ORDER.filter((k) => selectedFunnelKeys.includes(k)).flatMap((key) =>
                              FUNNELS[key].metrics.map((m) => {
                                const v = getMetricValueForDate(funnelDailyData, m.key, date)
                                return (
                                  <td key={m.key} style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`, ...FONT_PAGE_SMALL }}>
                                    {v === null ? '-' : m.key.includes('conversion') || m.key === 'ctr' || m.key === 'drr' ? formatPercent(v) : m.key === 'orders_amount' || m.key === 'costs' || m.key === 'cpc' || m.key === 'cpo' ? formatCurrency(v) : formatValue(v)}
                                  </td>
                                )
                              })
                            )}
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: colors.bgGrayLight, fontWeight: 600 }}>
                          <td style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `2px solid ${colors.border}`, ...FONT_PAGE }}>Весь период</td>
                          {FUNNEL_ORDER.filter((k) => selectedFunnelKeys.includes(k)).flatMap((key) =>
                            FUNNELS[key].metrics.map((m) => {
                              const v = getMetricTotalForPeriod(funnelDailyData, rangeDates, m.key)
                              return (
                                <td key={m.key} style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `1px solid ${colors.border}`, ...FONT_PAGE }}>
                                  {v === null ? '-' : m.key.includes('conversion') || m.key === 'ctr' || m.key === 'drr' ? formatPercent(v) : m.key === 'orders_amount' || m.key === 'costs' || m.key === 'cpc' || m.key === 'cpo' ? formatCurrency(v) : formatValue(v)}
                                </td>
                              )
                            })
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {showChart && funnelArticle?.dailyData?.length && (
                <AnalyticsChart
                  dailyData={funnelArticle.dailyData}
                  nmId={selectedFunnelArticleNmId!}
                  sellerId={getSelectedSellerId() ?? undefined}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              )}
            </div>

            {/* Блок 3 — Два периода (таблицы по артикулам + СУММАРНО) */}
            <div style={{ backgroundColor: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg, boxShadow: shadows.md }}>
              <h2 style={{ ...typography.h2, margin: '0 0 16px 0', fontSize: 16, color: colors.textPrimary }}>Периоды</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.xl }}>
                <div>
                  <div style={{ marginBottom: spacing.sm }}>
                    <DatePicker.RangePicker
                      locale={locale.DatePicker}
                      value={period1}
                      onChange={(dates) => dates?.[0] && dates?.[1] && setPeriod1([dates[0], dates[1]])}
                      format="DD.MM.YYYY"
                      separator="→"
                      style={{ width: 220 }}
                    />
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ backgroundColor: colors.bgGrayLight }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left', border: `1px solid ${colors.border}` }}>Товар</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Переходы</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Корзина</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Заказы</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Сумма</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Клики</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Затраты</th>
                        </tr>
                      </thead>
                      <tbody>
                        {articles.map((art) => {
                          const agg = periodAggregatesByNmId[art.nmId]?.p1
                          return (
                            <tr key={art.nmId}>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {art.photoTm && <img src={art.photoTm} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }} />}
                                <div>
                                  <div style={{ fontSize: 11 }}>{art.title || art.nmId}</div>
                                  <div style={{ fontSize: 10, color: colors.textSecondary }}>{art.nmId}</div>
                                </div>
                              </td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.transitions) : '-'}</td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.cart) : '-'}</td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.orders) : '-'}</td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.ordersAmount) : '-'}</td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.clicks) : '-'}</td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.costs) : '-'}</td>
                            </tr>
                          )
                        })}
                        <tr style={{ backgroundColor: colors.bgGrayLight, fontWeight: 600 }}>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}` }}>СУММАРНО</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod1 ? formatValue(totalPeriod1.transitions) : '-'}</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod1 ? formatValue(totalPeriod1.cart) : '-'}</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod1 ? formatValue(totalPeriod1.orders) : '-'}</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod1 ? formatValue(totalPeriod1.ordersAmount) : '-'}</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod1 ? formatValue(totalPeriod1.clicks) : '-'}</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod1 ? formatValue(totalPeriod1.costs) : '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: spacing.sm }}>
                    <DatePicker.RangePicker
                      locale={locale.DatePicker}
                      value={period2}
                      onChange={(dates) => dates?.[0] && dates?.[1] && setPeriod2([dates[0], dates[1]])}
                      format="DD.MM.YYYY"
                      separator="→"
                      style={{ width: 220 }}
                    />
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ backgroundColor: colors.bgGrayLight }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left', border: `1px solid ${colors.border}` }}>Товар</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Переходы</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Корзина</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Заказы</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Сумма</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Клики</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: `1px solid ${colors.border}` }}>Затраты</th>
                        </tr>
                      </thead>
                      <tbody>
                        {articles.map((art) => {
                          const agg = periodAggregatesByNmId[art.nmId]?.p2
                          return (
                            <tr key={art.nmId}>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {art.photoTm && <img src={art.photoTm} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }} />}
                                <div>
                                  <div style={{ fontSize: 11 }}>{art.title || art.nmId}</div>
                                  <div style={{ fontSize: 10, color: colors.textSecondary }}>{art.nmId}</div>
                                </div>
                              </td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.transitions) : '-'}</td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.cart) : '-'}</td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.orders) : '-'}</td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.ordersAmount) : '-'}</td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.clicks) : '-'}</td>
                              <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{agg ? formatValue(agg.costs) : '-'}</td>
                            </tr>
                          )
                        })}
                        <tr style={{ backgroundColor: colors.bgGrayLight, fontWeight: 600 }}>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}` }}>СУММАРНО</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod2 ? formatValue(totalPeriod2.transitions) : '-'}</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod2 ? formatValue(totalPeriod2.cart) : '-'}</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod2 ? formatValue(totalPeriod2.orders) : '-'}</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod2 ? formatValue(totalPeriod2.ordersAmount) : '-'}</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod2 ? formatValue(totalPeriod2.clicks) : '-'}</td>
                          <td style={{ padding: '6px 8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>{totalPeriod2 ? formatValue(totalPeriod2.costs) : '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Блок 4 — Сравнение периодов (суммарно по комбо, без выбора дат) */}
            {totalPeriod1 && totalPeriod2 && (
              <div style={{ backgroundColor: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg, boxShadow: shadows.md }}>
                <h2 style={{ ...typography.h2, margin: '0 0 16px 0', fontSize: 16, color: colors.textPrimary }}>Сравнение периодов (суммарно по комбо)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ backgroundColor: colors.bgGrayLight }}>
                          <th style={{ padding: 8, textAlign: 'left', border: `1px solid ${colors.border}` }}>Метрика</th>
                          <th style={{ padding: 8, textAlign: 'center', border: `1px solid ${colors.border}` }}>{period1[0].format('DD.MM')}–{period1[1].format('DD.MM')}</th>
                          <th style={{ padding: 8, textAlign: 'center', border: `1px solid ${colors.border}` }}>{period2[0].format('DD.MM')}–{period2[1].format('DD.MM')}</th>
                          <th style={{ padding: 8, textAlign: 'center', border: `1px solid ${colors.border}` }}>Разница</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Переходы в карточку', v1: totalPeriod1.transitions, v2: totalPeriod2.transitions },
                          { label: 'Положили в корзину', v1: totalPeriod1.cart, v2: totalPeriod2.cart },
                          { label: 'Заказали, шт', v1: totalPeriod1.orders, v2: totalPeriod2.orders },
                          { label: 'Заказали на сумму', v1: totalPeriod1.ordersAmount, v2: totalPeriod2.ordersAmount },
                          { label: 'Клики', v1: totalPeriod1.clicks, v2: totalPeriod2.clicks },
                          { label: 'Затраты', v1: totalPeriod1.costs, v2: totalPeriod2.costs },
                        ].map(({ label, v1, v2 }) => {
                          const diff = calculateDifference(v1, v2, label.includes('сумму') || label.includes('Затраты') ? 2 : undefined)
                          return (
                            <tr key={label}>
                              <td style={{ padding: 8, border: `1px solid ${colors.border}` }}>{label}</td>
                              <td style={{ padding: 8, textAlign: 'center', border: `1px solid ${colors.border}` }}>{formatValue(v1)}</td>
                              <td style={{ padding: 8, textAlign: 'center', border: `1px solid ${colors.border}` }}>{formatValue(v2)}</td>
                              <td style={{ padding: 8, textAlign: 'center', border: `1px solid ${colors.border}`, color: diff != null ? (diff > 0 ? colors.success : colors.error) : colors.textPrimary, fontWeight: 600 }}>
                                {diff != null ? `${diff > 0 ? '+' : ''}${formatPercent(diff)}` : '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Блок 5 — Склады: выбор артикула + таблица остатков */}
            <div style={{ backgroundColor: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg, boxShadow: shadows.md }}>
              <h2 style={{ ...typography.h2, margin: '0 0 16px 0', fontSize: 16, color: colors.textPrimary }}>Склады</h2>
              <div style={{ marginBottom: spacing.md }}>
                <span style={{ marginRight: spacing.sm }}>Артикул: </span>
                <Select
                  value={selectedStockNmId ?? undefined}
                  onChange={(v) => setSelectedStockNmId(v ?? null)}
                  style={{ width: 280 }}
                  options={articles.map((a) => ({ value: a.nmId, label: `${a.title || a.nmId} (${a.nmId})` }))}
                  placeholder="Выберите артикул"
                />
              </div>
              {stockArticle?.stocks && stockArticle.stocks.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ backgroundColor: colors.bgGrayLight }}>
                        <th style={{ padding: 8, border: `1px solid ${colors.border}` }}>Склад</th>
                        <th style={{ padding: 8, textAlign: 'center', border: `1px solid ${colors.border}` }}>Остаток</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockArticle.stocks.map((s: Stock) => (
                        <tr key={s.warehouseName}>
                          <td style={{ padding: 8, border: `1px solid ${colors.border}` }}>{s.warehouseName}</td>
                          <td style={{ padding: 8, textAlign: 'center', border: `1px solid ${colors.border}` }}>{formatValue(s.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ color: colors.textSecondary }}>Нет данных по остаткам</div>
              )}
            </div>

            {/* Блок 6 — Заметки по кампании (РК) */}
            <CampaignNotesBlock
              campaignId={campaignId}
              sellerId={getSelectedSellerId() ?? undefined}
              cabinetId={cabinetIdForRequest ?? undefined}
            />
          </>
        ) : null}
      </div>
    </>
  )
}

function CampaignNotesBlock({
  campaignId,
  sellerId,
  cabinetId,
}: {
  campaignId: number
  sellerId: number | undefined
  cabinetId: number | undefined
}) {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<CampaignNote | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: notes = [], isLoading: loadingNotes, refetch: refetchNotes } = useQuery({
    queryKey: ['campaign-notes', campaignId, sellerId, cabinetId],
    queryFn: () => analyticsApi.getCampaignNotes(campaignId, sellerId, cabinetId),
    enabled: !Number.isNaN(campaignId),
  })

  const openNoteModal = (note?: CampaignNote) => {
    setEditingNote(note ?? null)
    setNoteContent(note?.content ?? '')
    setIsNoteModalOpen(true)
  }

  const handleCreateNote = async () => {
    if (!noteContent.trim()) return
    setSaving(true)
    try {
      await analyticsApi.createCampaignNote(campaignId, { content: noteContent.trim() }, sellerId, cabinetId)
      message.success('Заметка создана')
      setIsNoteModalOpen(false)
      setNoteContent('')
      refetchNotes()
    } catch (err: unknown) {
      message.error(((err as { response?: { data?: { message?: string } } })?.response?.data?.message) ?? 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateNote = async () => {
    if (!editingNote || !noteContent.trim()) return
    setSaving(true)
    try {
      await analyticsApi.updateCampaignNote(campaignId, editingNote.id, { content: noteContent.trim() }, sellerId, cabinetId)
      message.success('Заметка сохранена')
      setIsNoteModalOpen(false)
      setEditingNote(null)
      setNoteContent('')
      refetchNotes()
    } catch (err: unknown) {
      message.error(((err as { response?: { data?: { message?: string } } })?.response?.data?.message) ?? 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    try {
      await analyticsApi.deleteCampaignNote(campaignId, noteId, sellerId, cabinetId)
      message.success('Заметка удалена')
      refetchNotes()
    } catch (err: unknown) {
      message.error(((err as { response?: { data?: { message?: string } } })?.response?.data?.message) ?? 'Ошибка')
    }
  }

  return (
    <div style={{ backgroundColor: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg, boxShadow: shadows.md }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <h2 style={{ ...typography.h2, ...FONT_PAGE, margin: 0, color: colors.textPrimary }}>Заметки по кампании</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openNoteModal()}>
          Добавить заметку
        </Button>
      </div>
      {loadingNotes ? (
        <div style={{ textAlign: 'center', padding: spacing.xl }}><Spin /></div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: spacing.xl, fontSize: 12, color: colors.textSecondary }}>Нет заметок по кампании. Создайте первую заметку.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {notes.map((note) => (
            <div key={note.id} style={{ border: `1px solid ${colors.border}`, borderRadius: borderRadius.sm, padding: spacing.md, backgroundColor: colors.bgGrayLight }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ ...FONT_PAGE_SMALL, color: colors.textSecondary, marginBottom: 4 }}>{note.userEmail} • {dayjs(note.createdAt).format('DD.MM.YYYY HH:mm')}{note.updatedAt !== note.createdAt ? ' (изменено)' : ''}</div>
                  <div style={{ ...FONT_PAGE, color: colors.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{note.content}</div>
                </div>
                <div style={{ display: 'flex', gap: spacing.xs, marginLeft: spacing.md }}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openNoteModal(note)} />
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteNote(note.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editingNote ? 'Редактировать заметку' : 'Создать заметку'}
        open={isNoteModalOpen}
        onOk={editingNote ? handleUpdateNote : handleCreateNote}
        onCancel={() => { setIsNoteModalOpen(false); setEditingNote(null); setNoteContent('') }}
        okText={editingNote ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        width={500}
        confirmLoading={saving}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <Input.TextArea rows={6} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Введите текст заметки..." />
        </div>
      </Modal>
    </div>
  )
}

function ComboProductItem({ article, photoSize }: { article: ArticleSummary; photoSize: number }) {
  const href = WB_CATALOG_URL(article.nmId)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.sm,
        textDecoration: 'none',
        color: 'inherit',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: photoSize,
          height: photoSize,
          borderRadius: borderRadius.sm,
          backgroundColor: colors.bgGrayLight,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {article.photoTm ? (
          <img
            src={article.photoTm}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: colors.textMuted }}>
            нет фото
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: photoSize, maxWidth: 160 }}>
        <span style={{ ...typography.body, fontSize: 12, color: colors.textPrimary, lineHeight: 1.3 }}>
          {article.title || `Артикул ${article.nmId}`}
        </span>
        <span style={{ ...typography.bodySmall, marginTop: 2, color: colors.textSecondary }}>
          {article.nmId}
        </span>
      </div>
    </a>
  )
}
