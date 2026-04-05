import { useState, useMemo, useCallback, useEffect, useRef, Fragment } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Spin, DatePicker, Checkbox, Switch, Button, Select, message, Input, Modal, Tooltip, Upload } from 'antd'
import { DownloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, RightOutlined, DownOutlined, ReloadOutlined, PaperClipOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import locale from 'antd/locale/ru_RU'
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
import { userApi } from '../api/user'
import type { ArticleSummary, ArticleResponse, DailyData, Stock, StockSize, CampaignNote } from '../types/analytics'
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useWorkContextForManagerAdmin } from '../hooks/useWorkContextForManagerAdmin'
import AnalyticsChart from '../components/AnalyticsChart'
import * as XLSX from 'xlsx'
import { getFilesFromClipboardData, renameGenericClipboardFile } from '../utils/clipboardFiles'

dayjs.locale('ru')

const COMBO_PHOTO_SIZE = 80
/** Значение «все артикулы» для воронки (таблица/график по сумме по всем артикулам). */
const ALL_ARTICLES_NM_ID = 0
const FONT_PAGE = { fontSize: '12px' as const }
const FONT_PAGE_SMALL = { fontSize: '11px' as const }
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
const FUNNEL_ORDER: FunnelKey[] = ['general', 'advertising', 'pricing']

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
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)
  const isManagerOrAdmin = role === 'ADMIN' || role === 'MANAGER'

  const workContext = useWorkContextForManagerAdmin(isManagerOrAdmin)
  const selectedSellerId = isManagerOrAdmin ? workContext.selectedSellerId : undefined
  const prevAdminCabinetRef = useRef<number | null>(null)

  const { data: myCabinets = [], isLoading: myCabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'SELLER' || role === 'WORKER',
  })

  const cabinets = useMemo(() => {
    if (isManagerOrAdmin) {
      return workContext.workContextOptions.map((o) => ({ id: o.cabinetId, name: o.cabinetName }))
    }
    return myCabinets
  }, [isManagerOrAdmin, workContext.workContextOptions, myCabinets])

  const cabinetsLoading = isManagerOrAdmin ? workContext.workContextLoading : myCabinetsLoading

  const storedCabinetIdSeller = !isManagerOrAdmin ? getStoredCabinetId() : null
  const selectedCabinetIdSeller =
    !isManagerOrAdmin && myCabinets.length > 0
      ? (storedCabinetIdSeller != null && myCabinets.some((c) => c.id === storedCabinetIdSeller)
          ? storedCabinetIdSeller
          : myCabinets[0].id)
      : null

  const selectedCabinetId = isManagerOrAdmin ? workContext.selectedCabinetId : selectedCabinetIdSeller

  useEffect(() => {
    if (!isManagerOrAdmin) {
      prevAdminCabinetRef.current = null
      return
    }
    const cur = workContext.selectedCabinetId
    if (cur == null) {
      prevAdminCabinetRef.current = null
      return
    }
    if (prevAdminCabinetRef.current != null && prevAdminCabinetRef.current !== cur) {
      navigate('/advertising/campaigns')
    }
    prevAdminCabinetRef.current = cur
  }, [isManagerOrAdmin, workContext.selectedCabinetId, navigate])

  const setSelectedCabinetId = useCallback(
    (cid: number | null) => {
      if (isManagerOrAdmin) {
        if (cid != null) workContext.applyWorkContextCabinet(cid)
      } else {
        setStoredCabinetId(cid)
      }
    },
    [isManagerOrAdmin, workContext.applyWorkContextCabinet],
  )

  const cabinetSelectProps =
    !isManagerOrAdmin && cabinets.length > 0
      ? {
          cabinets: cabinets.map((c) => ({ id: c.id, name: c.name })),
          selectedCabinetId,
          onCabinetChange: setSelectedCabinetId,
          loading: cabinetsLoading,
        }
      : undefined

  const userId = useAuthStore((s) => s.userId)
  const getSelectedSellerId = () => (isManagerOrAdmin ? selectedSellerId : userId ?? undefined)

  const campaignId = id != null ? parseInt(id, 10) : NaN
  const cabinetIdForRequest = selectedCabinetId ?? undefined
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

  const [selectedFunnelArticleNmId, setSelectedFunnelArticleNmId] = useState<number | null>(() => ALL_ARTICLES_NM_ID)
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
  /** При наведении на строку в таблице периодов — подсвечиваем эту строку и строку с тем же артикулом в соседней таблице. */
  const [hoveredPeriodNmId, setHoveredPeriodNmId] = useState<number | null>(null)
  const [selectedStockNmId, setSelectedStockNmId] = useState<number | null>(null)
  const [expandedStocks, setExpandedStocks] = useState<Set<string>>(new Set())
  const [stockSizes, setStockSizes] = useState<Record<string, StockSize[]>>({})
  const [loadingSizes, setLoadingSizes] = useState<Record<string, boolean>>({})
  const [stocksUpdateLoading, setStocksUpdateLoading] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (firstNmId != null && selectedStockNmId == null) setSelectedStockNmId(firstNmId)
  }, [firstNmId, selectedStockNmId])

  useEffect(() => {
    setExpandedStocks(new Set())
    setStockSizes({})
    setLoadingSizes({})
  }, [selectedStockNmId])

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
    enabled: selectedFunnelArticleNmId != null && selectedFunnelArticleNmId !== ALL_ARTICLES_NM_ID && cabinetIdForRequest != null,
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

  /** Агрегированные дневные данные по всем артикулам кампании (для режима «все»). */
  const aggregatedFunnelDailyData = useMemo((): DailyData[] => {
    if (articles.length === 0) return []
    const result: DailyData[] = []
    const priceFields: Array<keyof Pick<DailyData, 'priceBeforeDiscount' | 'sellerDiscount' | 'priceWithDiscount' | 'wbClubDiscount' | 'priceWithWbClub' | 'priceWithSpp' | 'sppAmount' | 'sppPercent'>> = ['priceBeforeDiscount', 'sellerDiscount', 'priceWithDiscount', 'wbClubDiscount', 'priceWithWbClub', 'priceWithSpp', 'sppAmount', 'sppPercent']
    for (const date of rangeDates) {
      let transitions = 0, cart = 0, orders = 0, ordersAmount = 0, views = 0, clicks = 0, costs = 0
      const priceSums: Record<string, number> = {}
      const priceCounts: Record<string, number> = {}
      priceFields.forEach((f) => { priceSums[f] = 0; priceCounts[f] = 0 })
      for (const art of articles) {
        const data = articleDataByNmId[art.nmId]
        const daily = data?.dailyData?.find((d) => d.date === date)
        if (!daily) continue
        transitions += daily.transitions ?? 0
        cart += daily.cart ?? 0
        orders += daily.orders ?? 0
        ordersAmount += daily.ordersAmount ?? 0
        views += daily.views ?? 0
        clicks += daily.clicks ?? 0
        costs += daily.costs ?? 0
        for (const f of priceFields) {
          const v = daily[f]
          if (v != null) { priceSums[f] += v; priceCounts[f] += 1 }
        }
      }
      const cartConversion = transitions > 0 ? (cart / transitions) * 100 : null
      const orderConversion = cart > 0 ? (orders / cart) * 100 : null
      const cpc = clicks > 0 ? costs / clicks : null
      const ctr = views > 0 ? (clicks / views) * 100 : null
      const cpo = orders > 0 ? costs / orders : null
      const drr = ordersAmount > 0 ? (costs / ordersAmount) * 100 : null
      const getPrice = (f: string): number | null => (priceCounts[f] > 0 ? priceSums[f] / priceCounts[f] : null)
      result.push({
        date,
        transitions: transitions || null,
        cart: cart || null,
        orders: orders || null,
        ordersAmount: ordersAmount || null,
        cartConversion,
        orderConversion,
        views: views || null,
        clicks: clicks || null,
        costs: costs || null,
        cpc,
        ctr,
        cpo,
        drr,
        priceBeforeDiscount: getPrice('priceBeforeDiscount'),
        sellerDiscount: getPrice('sellerDiscount'),
        priceWithDiscount: getPrice('priceWithDiscount'),
        wbClubDiscount: getPrice('wbClubDiscount'),
        priceWithWbClub: getPrice('priceWithWbClub'),
        priceWithSpp: getPrice('priceWithSpp'),
        sppAmount: getPrice('sppAmount'),
        sppPercent: getPrice('sppPercent'),
      })
    }
    return result
  }, [articles, articleDataByNmId, rangeDates])

  const getMetricValueForDate = useCallback((dailyData: DailyData[] | undefined, metricKey: string, date: string): number | null => {
    if (!dailyData?.length) return null
    const d = dailyData.find((x) => x.date === date)
    if (!d) return null
    const map: Record<string, number | null | undefined> = {
      transitions: d.transitions, cart: d.cart, orders: d.orders, orders_amount: d.ordersAmount,
      cart_conversion: d.cartConversion, order_conversion: d.orderConversion,
      views: d.views, clicks: d.clicks, costs: d.costs, cpc: d.cpc, ctr: d.ctr, cpo: d.cpo, drr: d.drr,
      price_before_discount: d.priceBeforeDiscount, seller_discount: d.sellerDiscount,
      price_with_discount: d.priceWithDiscount, wb_club_discount: d.wbClubDiscount,
      price_with_wb_club: d.priceWithWbClub, price_with_spp: d.priceWithSpp,
      spp_amount: d.sppAmount, spp_percent: d.sppPercent,
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
    if (metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr' || metricKey === 'cpc' || metricKey === 'cpo' ||
        metricKey === 'seller_discount' || metricKey === 'wb_club_discount' || metricKey === 'spp_percent' ||
        metricKey.startsWith('price_') || metricKey === 'spp_amount') {
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

  const funnelDailyData =
    selectedFunnelArticleNmId === ALL_ARTICLES_NM_ID ? aggregatedFunnelDailyData : funnelArticle?.dailyData

  /** Метрики, у которых показываем число изменения (остальные — только стрелка) */
  const METRICS_WITH_CHANGE_NUMBER = ['transitions', 'cart', 'orders', 'views', 'clicks']

  /** Изменение к хронологически предыдущему дню при отображении дат по убыванию (rangeDatesDesc) */
  const getMetricChangeVsPreviousDayDesc = useCallback((dateIndex: number, metricKey: string): number | null => {
    if (!funnelDailyData?.length || dateIndex >= rangeDatesDesc.length - 1) return null
    const currentDate = rangeDatesDesc[dateIndex]
    const prevDate = rangeDatesDesc[dateIndex + 1]
    const current = getMetricValueForDate(funnelDailyData, metricKey, currentDate)
    const prev = getMetricValueForDate(funnelDailyData, metricKey, prevDate)
    if (current === null || prev === null) return null
    return current - prev
  }, [funnelDailyData, rangeDatesDesc, getMetricValueForDate])

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
    if (!funnelDailyData?.length || selectedFunnelArticleNmId == null) return
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
        const isPercent = metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr' || metricKey === 'seller_discount' || metricKey === 'wb_club_discount' || metricKey === 'spp_percent'
        const isCurrency = metricKey === 'orders_amount' || metricKey === 'costs' || metricKey === 'cpc' || metricKey === 'cpo' || metricKey.startsWith('price_') || metricKey === 'spp_amount'
        row.push(v === null ? '' : isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v))
      }
      rows.push(row)
    }
    const totalRow: (string | number)[] = ['Весь период']
    for (const metricKey of metricKeys) {
      const v = getMetricTotalForPeriod(funnelDailyData, rangeDates, metricKey)
      const isPercent = metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr' || metricKey === 'seller_discount' || metricKey === 'wb_club_discount' || metricKey === 'spp_percent'
      const isCurrency = metricKey === 'orders_amount' || metricKey === 'costs' || metricKey === 'cpc' || metricKey === 'cpo' || metricKey.startsWith('price_') || metricKey === 'spp_amount'
      totalRow.push(v === null ? '' : isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v))
    }
    rows.push(totalRow)
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Воронки')
    const fileSuffix = selectedFunnelArticleNmId === ALL_ARTICLES_NM_ID ? 'all' : String(selectedFunnelArticleNmId)
    XLSX.writeFile(wb, `combo_${fileSuffix}_воронки_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}.xlsx`)
    message.success('Файл выгружен')
  }, [funnelDailyData, selectedFunnelArticleNmId, rangeDatesDesc, rangeDates, dateRange, getMetricValueForDate, getMetricTotalForPeriod, formatValue, formatPercent, formatCurrency])

  const isActive = campaign?.status === 9
  const statusLabel = campaign ? (isActive ? 'активна' : 'приостановлена') : ''
  const statusBg = isActive ? colors.success : colors.error

  if (campaignId == null || Number.isNaN(campaignId)) {
    return (
      <>
        <Header
          workContextCabinetSelect={isManagerOrAdmin ? workContext.workContextCabinetSelectProps : undefined}
          cabinetSelectProps={cabinetSelectProps}
        />
        <Breadcrumbs />
        <div style={{ padding: spacing.lg, color: colors.textSecondary }}>Неверный ID кампании</div>
      </>
    )
  }

  if (!Number.isNaN(campaignId) && isFetched && (error || !campaign)) {
    return (
      <>
        <Header
          workContextCabinetSelect={isManagerOrAdmin ? workContext.workContextCabinetSelectProps : undefined}
          cabinetSelectProps={cabinetSelectProps}
        />
        <Breadcrumbs />
        <div style={{ padding: spacing.lg, color: colors.error }}>Кампания не найдена</div>
      </>
    )
  }
  if (!Number.isNaN(campaignId) && cabinetIdForRequest == null && !cabinetsLoading) {
    return (
      <>
        <Header
          workContextCabinetSelect={isManagerOrAdmin ? workContext.workContextCabinetSelectProps : undefined}
          cabinetSelectProps={cabinetSelectProps}
        />
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
        <Header
          workContextCabinetSelect={isManagerOrAdmin ? workContext.workContextCabinetSelectProps : undefined}
          cabinetSelectProps={cabinetSelectProps}
        />
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
      <Header
        workContextCabinetSelect={isManagerOrAdmin ? workContext.workContextCabinetSelectProps : undefined}
        cabinetSelectProps={cabinetSelectProps}
      />
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
            {/* Блок 1: название, статус, артикулы — как в инфо об артикуле: тень, закругление */}
            <div
              style={{
                backgroundColor: colors.bgWhite,
                border: `1px solid ${colors.borderLight}`,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                marginBottom: spacing.lg,
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
                    <Checkbox checked={selectedFunnelKeys.includes('pricing')} onChange={() => toggleFunnel('pricing')}>Цены</Checkbox>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, ...typography.body }}>
                      <Switch checked={showChart} onChange={setShowChart} size="small" />
                      <span>График</span>
                    </span>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportFunnelsExcel} disabled={!funnelDailyData?.length}>
                      Выгрузить
                    </Button>
                  </div>
                </div>
                <div style={{ marginBottom: spacing.md, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, marginRight: spacing.md }}>
                    <Checkbox
                      checked={selectedFunnelArticleNmId === ALL_ARTICLES_NM_ID}
                      onChange={() => setSelectedFunnelArticleNmId(ALL_ARTICLES_NM_ID)}
                    >
                      <span style={{ marginLeft: -4 }}>Все</span>
                    </Checkbox>
                  </span>
                  {articles.map((art) => (
                    <Checkbox
                      key={art.nmId}
                      checked={selectedFunnelArticleNmId === art.nmId}
                      onChange={() => setSelectedFunnelArticleNmId(art.nmId)}
                    >
                      {art.nmId}
                    </Checkbox>
                  ))}
                </div>
                {funnelArticleLoading && selectedFunnelArticleNmId !== ALL_ARTICLES_NM_ID && <Spin size="small" style={{ marginBottom: spacing.md }} />}
                {selectedFunnel1 && funnelDailyData?.length !== 0 && (() => {
                  const metricsWithFunnel = FUNNEL_ORDER.filter((k) => selectedFunnelKeys.includes(k)).flatMap((funnelKey) =>
                    FUNNELS[funnelKey].metrics.map((m) => ({ funnelKey, m }))
                  )
                  const totalCols = metricsWithFunnel.length
                  return (
                  <div style={{ maxHeight: 438, overflowY: 'auto', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
                      <thead>
                        <tr style={{ fontWeight: 700 }}>
                          <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `2px solid ${colors.border}`, fontSize: 12, fontWeight: 700, position: 'sticky', top: 0, left: 0, backgroundColor: colors.bgWhite, zIndex: 2, width: 90, boxShadow: `0 1px 0 0 ${colors.border}` }}>Дата</th>
                          {metricsWithFunnel.map(({ funnelKey, m }, index) => {
                            const isGeneral = funnelKey === 'general'
                            const isAdvertising = funnelKey === 'advertising'
                            const isPricing = funnelKey === 'pricing'
                            const headerBg = isGeneral ? colors.funnelBg : isAdvertising ? colors.advertisingBg : isPricing ? colors.pricingBg : colors.bgWhite
                            return (
                              <th key={m.key} style={{ textAlign: 'center', padding: '4px 6px', borderBottom: `1px solid ${colors.border}`, boxShadow: `0 1px 0 0 ${colors.border}`, borderRight: index === totalCols - 1 ? 'none' : `1px solid ${colors.border}`, fontSize: 10, fontWeight: 700, whiteSpace: 'pre-line', lineHeight: 1.2, backgroundColor: headerBg, position: 'sticky', top: 0, zIndex: 2, width: totalCols ? `${100 / totalCols}%` : undefined }}>
                                {m.name}
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {rangeDatesDesc.map((date, dateIndex) => (
                          <tr
                            key={date}
                            style={{ transition: transitions.fast, backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => {
                              const row = e.currentTarget
                              row.style.backgroundColor = colors.bgGrayLight
                              Array.from(row.querySelectorAll('td')).forEach((cell: Element, cellIndex: number) => {
                                const td = cell as HTMLElement
                                const hoverBg = (key: FunnelKey) => key === 'general' ? colors.funnelBgHover : key === 'advertising' ? colors.advertisingBgHover : colors.pricingBgHover
                                if (cellIndex === 0) td.style.backgroundColor = metricsWithFunnel[0] ? hoverBg(metricsWithFunnel[0].funnelKey) : colors.bgGrayLight
                                else {
                                  const item = metricsWithFunnel[cellIndex - 1]
                                  td.style.backgroundColor = item ? hoverBg(item.funnelKey) : colors.bgGrayLight
                                }
                              })
                            }}
                            onMouseLeave={(e) => {
                              const row = e.currentTarget
                              row.style.backgroundColor = 'transparent'
                              Array.from(row.querySelectorAll('td')).forEach((cell: Element, cellIndex: number) => {
                                const td = cell as HTMLElement
                                const cellBg = (key: FunnelKey) => key === 'general' ? colors.funnelBg : key === 'advertising' ? colors.advertisingBg : colors.pricingBg
                                if (cellIndex === 0) td.style.backgroundColor = colors.bgWhite
                                else {
                                  const item = metricsWithFunnel[cellIndex - 1]
                                  td.style.backgroundColor = item ? cellBg(item.funnelKey) : colors.bgWhite
                                }
                              })
                            }}
                          >
                            <td style={{ padding: '6px 8px', borderTop: dateIndex === 0 ? 'none' : undefined, borderBottom: `1px solid ${colors.border}`, borderRight: `2px solid ${colors.border}`, fontSize: 12, fontWeight: 500, position: 'sticky', left: 0, backgroundColor: colors.bgWhite, zIndex: 1 }}>
                              {dayjs(date).format('DD.MM.YYYY')}
                            </td>
                            {metricsWithFunnel.map(({ funnelKey, m }, index) => {
                              const v = getMetricValueForDate(funnelDailyData, m.key, date)
                              const change = getMetricChangeVsPreviousDayDesc(dateIndex, m.key)
                              const isPercent = m.key.includes('conversion') || m.key === 'ctr' || m.key === 'drr' || m.key === 'seller_discount' || m.key === 'wb_club_discount' || m.key === 'spp_percent'
                              const isCurrency = m.key === 'orders_amount' || m.key === 'costs' || m.key === 'cpc' || m.key === 'cpo' || m.key.startsWith('price_') || m.key === 'spp_amount'
                              const showChangeNumber = METRICS_WITH_CHANGE_NUMBER.includes(m.key)
                              const lowerIsBetter = ['cpc', 'cpo', 'costs', 'drr'].includes(m.key)
                              const changeColor = change !== null && change !== 0 ? (lowerIsBetter ? (change < 0 ? colors.success : colors.error) : (change > 0 ? colors.success : colors.error)) : undefined
                              const isGeneral = funnelKey === 'general'
                              const isAdvertising = funnelKey === 'advertising'
                              const isPricing = funnelKey === 'pricing'
                              const cellBg = isGeneral ? colors.funnelBg : isAdvertising ? colors.advertisingBg : isPricing ? colors.pricingBg : colors.bgWhite
                              return (
                                <td key={m.key} style={{ textAlign: 'center', padding: '4px 6px', borderTop: dateIndex === 0 ? 'none' : undefined, borderBottom: `1px solid ${colors.border}`, borderRight: index === totalCols - 1 ? 'none' : `1px solid ${colors.border}`, backgroundColor: cellBg, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', transition: transitions.fast, position: 'relative' }}>
                                  {(v === null || v === 0) ? '-' : isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v)}
                                  {change !== null && change !== 0 && changeColor && (
                                    <div style={{ position: 'absolute', top: 1, right: 2, display: 'flex', alignItems: 'center', gap: 0, fontSize: '9px', fontWeight: 600, color: changeColor, lineHeight: 1 }}>
                                      {showChangeNumber && <span>{change > 0 ? '+' : ''}{change}</span>}
                                      {change > 0 ? <ArrowUpOutlined style={{ fontSize: '9px' }} /> : <ArrowDownOutlined style={{ fontSize: '9px' }} />}
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: colors.bgGray }}>
                          <td style={{ padding: '6px 8px', borderBottom: `1px solid ${colors.border}`, borderRight: `2px solid ${colors.border}`, borderTop: `2px solid ${colors.border}`, fontSize: 12, fontWeight: 700, position: 'sticky', left: 0, backgroundColor: colors.bgGray, zIndex: 1 }}>
                            Весь период
                          </td>
                          {metricsWithFunnel.map(({ m }, index) => {
                            const v = getMetricTotalForPeriod(funnelDailyData, rangeDates, m.key)
                            const isPercent = m.key.includes('conversion') || m.key === 'ctr' || m.key === 'drr' || m.key === 'seller_discount' || m.key === 'wb_club_discount' || m.key === 'spp_percent'
                            const isCurrency = m.key === 'orders_amount' || m.key === 'costs' || m.key === 'cpc' || m.key === 'cpo' || m.key.startsWith('price_') || m.key === 'spp_amount'
                            return (
                              <td key={m.key} style={{ textAlign: 'center', padding: '4px 6px', borderBottom: `1px solid ${colors.border}`, borderTop: `2px solid ${colors.border}`, borderRight: index === totalCols - 1 ? 'none' : `1px solid ${colors.border}`, backgroundColor: colors.bgGray, fontSize: 11, fontWeight: 500 }}>
                                {(v === null || v === 0) ? '-' : isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v)}
                              </td>
                            )
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  )
                })()}
              </div>
              {showChart && funnelDailyData?.length && (
                <AnalyticsChart
                  dailyData={funnelDailyData}
                  nmId={selectedFunnelArticleNmId ?? ALL_ARTICLES_NM_ID}
                  sellerId={getSelectedSellerId() ?? undefined}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              )}
            </div>

            {/* Блок 3 — Сравнение периодов: два блока один под другим (период 1, период 2) */}
            <div style={{ backgroundColor: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg, boxShadow: shadows.md }}>
              <h2 style={{ ...typography.h2, margin: '0 0 16px 0', fontSize: 16, color: colors.textPrimary }}>Сравнение периодов</h2>
              {([{ period: 1, periodDates: period1, setPeriod: setPeriod1, aggKey: 'p1' as const, total: totalPeriod1 }, { period: 2, periodDates: period2, setPeriod: setPeriod2, aggKey: 'p2' as const, total: totalPeriod2 }] as const).map(({ period, periodDates, setPeriod, aggKey, total }) => (
                <div key={period} style={{ marginBottom: period === 1 ? spacing.xl : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
                    <span style={{ ...typography.body, fontWeight: 600, color: colors.textPrimary }}>Период {period}</span>
                    <DatePicker.RangePicker
                      locale={locale.DatePicker}
                      value={periodDates}
                      onChange={(dates) => dates?.[0] && dates?.[1] && setPeriod([dates[0], dates[1]])}
                      format="DD.MM.YYYY"
                      separator="→"
                      style={{ width: 220 }}
                    />
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: 120 }} />
                      <col span={FUNNELS.general.metrics.length + FUNNELS.advertising.metrics.length} />
                    </colgroup>
                    <thead>
                      <tr style={{ backgroundColor: colors.bgGrayLight }}>
                        <th style={{ padding: '6px 12px', textAlign: 'left', border: `1px solid ${colors.border}`, borderRight: 'none', backgroundColor: colors.bgGrayLight, width: 120, boxSizing: 'border-box' }}>Товар</th>
                        {FUNNELS.general.metrics.map((m, i) => (
                          <th key={m.key} style={{ padding: '4px 6px', textAlign: 'center', border: `1px solid ${colors.border}`, fontSize: 10, whiteSpace: 'pre-line', lineHeight: 1.2, backgroundColor: colors.funnelBg, borderRight: i === FUNNELS.general.metrics.length - 1 ? `2px solid ${colors.border}` : undefined }}>{m.name}</th>
                        ))}
                        {FUNNELS.advertising.metrics.map((m) => (
                          <th key={m.key} style={{ padding: '4px 6px', textAlign: 'center', border: `1px solid ${colors.border}`, fontSize: 10, whiteSpace: 'pre-line', lineHeight: 1.2, backgroundColor: colors.advertisingBg }}>{m.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((art) => {
                        const agg = periodAggregatesByNmId[art.nmId]?.[aggKey]
                        const isHovered = hoveredPeriodNmId === art.nmId
                      const getVal = (agg: ReturnType<typeof aggregatePeriodData>, key: string) => {
                        if (!agg) return null
                        const map: Record<string, number | null | undefined> = {
                          transitions: agg.transitions, cart: agg.cart, orders: agg.orders, orders_amount: agg.ordersAmount,
                          cart_conversion: agg.cartConversion, order_conversion: agg.orderConversion,
                          views: agg.views, clicks: agg.clicks, costs: agg.costs, cpc: agg.cpc, ctr: agg.ctr, cpo: agg.cpo, drr: agg.drr,
                        }
                        return map[key] != null ? map[key]! : null
                      }
                      const fmt = (key: string, v: number | null) => {
                        if (v === null || v === 0) return '-'
                        const isPercent = key.includes('conversion') || key === 'ctr' || key === 'drr'
                        const isCurrency = key === 'orders_amount' || key === 'costs' || key === 'cpc' || key === 'cpo'
                        return isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v)
                      }
                      return (
                        <tr
                          key={art.nmId}
                          onMouseEnter={() => setHoveredPeriodNmId(art.nmId)}
                          onMouseLeave={() => setHoveredPeriodNmId(null)}
                          style={{ transition: transitions.fast }}
                        >
                          <td style={{ padding: '6px 12px', border: `1px solid ${colors.border}`, borderRight: 'none', display: 'flex', alignItems: 'center', gap: 8, backgroundColor: isHovered ? colors.bgGrayLight : colors.bgWhite }}>
                            {art.photoTm && <img src={art.photoTm} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }} />}
                            <span style={{ fontSize: 11 }}>{art.nmId}</span>
                          </td>
                          {FUNNELS.general.metrics.map((m, i) => (
                            <td key={m.key} style={{ padding: '4px 6px', border: `1px solid ${colors.border}`, textAlign: 'center', whiteSpace: 'nowrap', backgroundColor: isHovered ? colors.funnelBgHover : colors.funnelBg, borderRight: i === FUNNELS.general.metrics.length - 1 ? `2px solid ${colors.border}` : undefined }}>{fmt(m.key, getVal(agg, m.key))}</td>
                          ))}
                            {FUNNELS.advertising.metrics.map((m) => (
                              <td key={m.key} style={{ padding: '4px 6px', border: `1px solid ${colors.border}`, textAlign: 'center', whiteSpace: 'nowrap', backgroundColor: isHovered ? colors.advertisingBgHover : colors.advertisingBg }}>{fmt(m.key, getVal(agg, m.key))}</td>
                            ))}
                          </tr>
                      )
                    })}
                      <tr style={{ backgroundColor: colors.bgGrayLight, fontWeight: 600 }}>
                        <td style={{ padding: '6px 12px', border: `1px solid ${colors.border}`, borderRight: 'none', backgroundColor: colors.bgGray }}>СУММАРНО</td>
                        {FUNNELS.general.metrics.map((m, i) => {
                          const v = total && (m.key === 'transitions' ? total.transitions : m.key === 'cart' ? total.cart : m.key === 'orders' ? total.orders : m.key === 'orders_amount' ? total.ordersAmount : m.key === 'cart_conversion' ? total.cartConversion : total.orderConversion)
                          const isPercent = m.key.includes('conversion')
                          const isCurrency = m.key === 'orders_amount'
                          const display = (v == null || v === 0) ? '-' : isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v)
                          return <td key={m.key} style={{ padding: '4px 6px', border: `1px solid ${colors.border}`, textAlign: 'center', whiteSpace: 'nowrap', color: colors.primary, borderRight: i === FUNNELS.general.metrics.length - 1 ? `2px solid ${colors.border}` : undefined }}>{display}</td>
                        })}
                        {FUNNELS.advertising.metrics.map((m) => {
                          const v = total && (m.key === 'views' ? total.views : m.key === 'clicks' ? total.clicks : m.key === 'costs' ? total.costs : m.key === 'cpc' ? total.cpc : m.key === 'ctr' ? total.ctr : m.key === 'cpo' ? total.cpo : total.drr)
                          const isPercent = m.key === 'ctr' || m.key === 'drr'
                          const isCurrency = m.key === 'costs' || m.key === 'cpc' || m.key === 'cpo'
                          const display = (v == null || v === 0) ? '-' : isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v)
                          return <td key={m.key} style={{ padding: '4px 6px', border: `1px solid ${colors.border}`, textAlign: 'center', whiteSpace: 'nowrap', color: colors.success }}>{display}</td>
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Блок 4 + 5 в один ряд: слева — сравнение периодов (суммарно), справа — остатки (оформление как в «Инфа по артикулу») */}
            <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'stretch', marginBottom: spacing.lg, flexWrap: 'wrap', backgroundColor: colors.bgWhite, border: `1px solid ${colors.borderLight}`, borderRadius: borderRadius.md, padding: spacing.lg, boxShadow: shadows.md }}>
              {totalPeriod1 && totalPeriod2 && (() => {
                const getVal = (key: string, tot: typeof totalPeriod1) => {
                  if (!tot) return null
                  const map: Record<string, number | null | undefined> = {
                    transitions: tot.transitions, cart: tot.cart, orders: tot.orders, orders_amount: tot.ordersAmount,
                    cart_conversion: tot.cartConversion, order_conversion: tot.orderConversion,
                    views: tot.views, clicks: tot.clicks, costs: tot.costs, cpc: tot.cpc, ctr: tot.ctr, cpo: tot.cpo, drr: tot.drr,
                  }
                  return map[key] != null ? map[key]! : null
                }
                const fmt = (key: string, v: number | null) => {
                  if (v === null || v === 0) return '-'
                  const isPercent = key.includes('conversion') || key === 'ctr' || key === 'drr'
                  const isCurrency = key === 'orders_amount' || key === 'costs' || key === 'cpc' || key === 'cpo'
                  return isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v)
                }
                const lowerIsBetterKeys = ['costs', 'cpc', 'cpo', 'drr']
                const renderDiff = (key: string) => {
                  const v1 = getVal(key, totalPeriod1)
                  const v2 = getVal(key, totalPeriod2)
                  const noData1 = v1 == null || v1 === 0
                  const noData2 = v2 == null || v2 === 0
                  const isPercentMetric = key.includes('conversion') || key === 'ctr' || key === 'drr'
                  const lowerIsBetter = lowerIsBetterKeys.includes(key)
                  if (noData1 || noData2) return { text: '-', color: colors.textPrimary }
                  if (isPercentMetric) {
                    const p1 = v1 ?? 0
                    const p2 = v2 ?? 0
                    const diffPoints = Math.round((p2 - p1) * 100) / 100
                    if (Math.abs(diffPoints) < 0.01) return { text: '-', color: colors.textPrimary }
                    const good = lowerIsBetter ? diffPoints < 0 : diffPoints > 0
                    return { text: (diffPoints > 0 ? '+' : '') + formatPercent(diffPoints), color: good ? colors.success : colors.error }
                  }
                  const diff = Math.round(((v2! - v1!) / v1!) * 10000) / 100
                  if (Math.abs(diff) < 0.01) return { text: '-', color: colors.textPrimary }
                  const good = lowerIsBetter ? diff < 0 : diff > 0
                  return { text: (diff > 0 ? '+' : '') + formatPercent(diff), color: good ? colors.success : colors.error }
                }
                const thPeriod = { textAlign: 'center' as const, padding: spacing.md, borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, fontSize: 12, fontWeight: 600 }
                const tdCell = { padding: spacing.md, borderBottom: `1px solid ${colors.border}`, ...typography.body, fontSize: 12 }
                return (
                <div style={{ flex: '0 1 75%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ ...typography.h2, margin: '0 0 12px 0', fontSize: 16, color: colors.textPrimary }}>
                    Сравнение периодов (суммарно по Рекламной Компании)
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, alignContent: 'start' }}>
                    {/* Таблица: Общая воронка */}
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
                          {FUNNELS.general.metrics.map((m) => {
                            const { text: diffText, color: diffColor } = renderDiff(m.key)
                            return (
                              <tr key={m.key} style={{ backgroundColor: colors.bgWhite }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.funnelBgHover; Array.from(e.currentTarget.querySelectorAll('td')).forEach((c) => { (c as HTMLElement).style.backgroundColor = colors.funnelBgHover }) }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.bgWhite; Array.from(e.currentTarget.querySelectorAll('td')).forEach((c) => { (c as HTMLElement).style.backgroundColor = 'transparent' }) }}>
                                <td style={{ ...tdCell, borderRight: `2px solid ${colors.border}` }}>{m.name.replace(/\n/g, ' ')}</td>
                                <td style={{ ...tdCell, textAlign: 'center', borderLeft: `2px solid ${colors.border}`, borderRight: `1px solid ${colors.border}` }}>{fmt(m.key, getVal(m.key, totalPeriod1))}</td>
                                <td style={{ ...tdCell, textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>{fmt(m.key, getVal(m.key, totalPeriod2))}</td>
                                <td style={{ ...tdCell, textAlign: 'center', borderLeft: `1px solid ${colors.border}`, color: diffColor, fontWeight: 600 }}>{diffText}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* Таблица: Рекламная воронка */}
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
                          {FUNNELS.advertising.metrics.map((m) => {
                            const { text: diffText, color: diffColor } = renderDiff(m.key)
                            return (
                              <tr key={m.key} style={{ backgroundColor: colors.bgWhite }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.advertisingBgHover; Array.from(e.currentTarget.querySelectorAll('td')).forEach((c) => { (c as HTMLElement).style.backgroundColor = colors.advertisingBgHover }) }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.bgWhite; Array.from(e.currentTarget.querySelectorAll('td')).forEach((c) => { (c as HTMLElement).style.backgroundColor = 'transparent' }) }}>
                                <td style={{ ...tdCell, borderRight: `2px solid ${colors.border}` }}>{m.name.replace(/\n/g, ' ')}</td>
                                <td style={{ ...tdCell, textAlign: 'center', borderLeft: `2px solid ${colors.border}`, borderRight: `1px solid ${colors.border}` }}>{fmt(m.key, getVal(m.key, totalPeriod1))}</td>
                                <td style={{ ...tdCell, textAlign: 'center', borderRight: `1px solid ${colors.border}` }}>{fmt(m.key, getVal(m.key, totalPeriod2))}</td>
                                <td style={{ ...tdCell, textAlign: 'center', borderLeft: `1px solid ${colors.border}`, color: diffColor, fontWeight: 600 }}>{diffText}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                )
              })()}

              {/* Блок 5 — Остатки: заголовок, кнопка и выбор артикула в одну строку */}
              <div style={{ flex: '1 1 280px', minWidth: 280, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'nowrap', minWidth: 0 }}>
                  <h2 style={{ ...typography.h2, margin: 0, fontSize: 16, color: colors.textPrimary, flexShrink: 0 }}>
                    {(() => {
                      const stocks = stockArticle?.stocks ?? []
                      const latestStocksUpdate = stocks.length > 0
                        ? stocks.map((s: Stock) => s.updatedAt).filter((d): d is string => d != null).sort().reverse()[0]
                        : null
                      return latestStocksUpdate ? `Остатки на ${dayjs(latestStocksUpdate).format('DD.MM.YY HH:mm')}` : 'Остатки'
                    })()}
                  </h2>
                  {cabinetIdForRequest != null && (() => {
                      const triggeredAt = stockArticle?.lastStocksUpdateTriggeredAt ?? null
                      const tooRecent = triggeredAt != null && dayjs(triggeredAt).isAfter(dayjs().subtract(1, 'hour'))
                      const tooltipTitle = tooRecent && triggeredAt
                        ? (() => {
                            const nextAt = dayjs(triggeredAt).add(1, 'hour')
                            const remainingMin = Math.max(0, nextAt.diff(dayjs(), 'minute', true))
                            const mins = Math.ceil(remainingMin)
                            if (mins >= 60) {
                              const h = Math.ceil(mins / 60)
                              return `Повторное обновление доступно через ${h} ${h === 1 ? 'час' : h < 5 ? 'часа' : 'часов'}`
                            }
                            return `Повторное обновление доступно через ${mins} ${mins === 1 ? 'минуту' : mins < 5 ? 'минуты' : 'минут'}`
                          })()
                        : 'Запустить обновление остатков'
                      return (
                    <Tooltip title={tooltipTitle}>
                      <Button
                        type="text"
                        size="small"
                        icon={<ReloadOutlined style={{ fontSize: 14 }} />}
                        loading={stocksUpdateLoading}
                        disabled={tooRecent || stocksUpdateLoading}
                        onClick={async () => {
                          if (cabinetIdForRequest == null) return
                          setStocksUpdateLoading(true)
                          try {
                            await userApi.triggerCabinetStocksUpdate(cabinetIdForRequest)
                            message.success('Обновление остатков запущено. Данные обновятся в течение нескольких минут.')
                            await queryClient.invalidateQueries({ queryKey: ['article-stocks', selectedStockNmId, cabinetIdForRequest] })
                          } catch (err: any) {
                            message.error(err.response?.data?.message ?? 'Не удалось запустить обновление остатков')
                          } finally {
                            setStocksUpdateLoading(false)
                          }
                        }}
                        style={{ width: 28, height: 28, padding: 0, flexShrink: 0 }}
                      />
                    </Tooltip>
                  )
                  })()}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: spacing.sm, flexShrink: 0 }}>
                    <Select
                      value={selectedStockNmId ?? undefined}
                      onChange={(v) => setSelectedStockNmId(v ?? null)}
                      style={{ width: 115, minWidth: 115, flexShrink: 0 }}
                      options={articles.map((a) => ({ value: a.nmId, label: String(a.nmId) }))}
                      placeholder="Артикул"
                    />
                    {(() => {
                      const stocks = stockArticle?.stocks ?? []
                      if (stocks.length === 0) return null
                      const latestStocksUpdate = stocks
                        .map((s: Stock) => s.updatedAt)
                        .filter((d): d is string => d != null)
                        .sort()
                        .reverse()[0]
                      const totalAmount = stocks.reduce((sum, stock) => sum + stock.amount, 0)
                      return (
                        <div
                          title={latestStocksUpdate ? `Дата обновления ${dayjs(latestStocksUpdate).format('DD.MM.YY HH:mm')}` : ''}
                          style={{ cursor: 'help' }}
                        >
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
                            }}
                          >
                            Всего {totalAmount.toLocaleString('ru-RU')}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
                {stockArticle?.stocks && stockArticle.stocks.length > 0 ? (
                  <div style={{ flex: '1 1 0', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ backgroundColor: colors.primaryLight }}>
                          <th style={{ textAlign: 'left', padding: spacing.md, borderBottom: `2px solid ${colors.primary}`, ...typography.body, fontSize: 12, fontWeight: 600, color: colors.primary }}>Склад</th>
                          <th style={{ textAlign: 'left', padding: spacing.md, borderBottom: `2px solid ${colors.primary}`, ...typography.body, fontSize: 12, fontWeight: 600, backgroundColor: colors.primaryLight, color: colors.primary }}>Кол-во</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockArticle.stocks.map((s: Stock, index: number) => {
                          const isExpanded = expandedStocks.has(s.warehouseName)
                          const sizes = stockSizes[s.warehouseName] ?? []
                          const isLoading = loadingSizes[s.warehouseName] ?? false
                          const handleRowClick = async () => {
                            if (isExpanded) {
                              setExpandedStocks((prev) => {
                                const next = new Set(prev)
                                next.delete(s.warehouseName)
                                return next
                              })
                            } else {
                              setExpandedStocks((prev) => new Set(prev).add(s.warehouseName))
                              if (selectedStockNmId != null && !stockSizes[s.warehouseName] && !loadingSizes[s.warehouseName]) {
                                setLoadingSizes((prev) => ({ ...prev, [s.warehouseName]: true }))
                                try {
                                  const sizesData = await analyticsApi.getStockSizes(selectedStockNmId, s.warehouseName, getSelectedSellerId() ?? undefined, cabinetIdForRequest ?? undefined)
                                  setStockSizes((prev) => ({ ...prev, [s.warehouseName]: sizesData }))
                                } catch (err) {
                                  console.error('Ошибка при загрузке размеров:', err)
                                } finally {
                                  setLoadingSizes((prev) => ({ ...prev, [s.warehouseName]: false }))
                                }
                              }
                            }
                          }
                          const isZeroStock = s.amount === 0
                          const isLowStock = s.amount > 0 && s.amount <= 1
                          return (
                            <Fragment key={s.warehouseName}>
                              <tr
                                onClick={handleRowClick}
                                style={{ backgroundColor: index % 2 === 0 ? colors.bgWhite : colors.bgGrayLight, transition: transitions.fast, cursor: 'pointer' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.primaryLight }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? colors.bgWhite : colors.bgGrayLight }}
                              >
                                <td style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border}`, ...typography.body, fontSize: 12, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                                  {isExpanded ? <DownOutlined style={{ fontSize: 12, color: colors.primary }} /> : <RightOutlined style={{ fontSize: 12, color: colors.textSecondary }} />}
                                  {s.warehouseName}
                                </td>
                                <td style={{ textAlign: 'center', padding: spacing.md, borderBottom: `1px solid ${colors.border}`, ...typography.body, fontSize: 12, fontWeight: 600, color: isZeroStock ? colors.error : isLowStock ? colors.error : colors.textPrimary }}>{formatValue(s.amount)}</td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={2} style={{ padding: spacing.md, backgroundColor: colors.bgGrayLight, borderBottom: `1px solid ${colors.borderLight}` }}>
                                    {isLoading ? (
                                      <div style={{ textAlign: 'center', padding: spacing.md }}><Spin size="small" /></div>
                                    ) : (() => {
                                      const hasSizeBreakdown = sizes.length > 1 || (sizes.length === 1 && sizes[0].techSize != null && String(sizes[0].techSize) !== '0')
                                      if (!hasSizeBreakdown && sizes.length > 0) {
                                        return <div style={{ ...typography.body, fontSize: 11, color: colors.textSecondary }}>Товар без разбивки по размерам</div>
                                      }
                                      return sizes.length > 0 ? (
                                        <div style={{ paddingLeft: spacing.lg }}>
                                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                            <thead>
                                              <tr>
                                                <th style={{ textAlign: 'left', padding: `${spacing.xs} ${spacing.sm}`, borderBottom: `1px solid ${colors.border}`, ...typography.body, fontSize: 11, fontWeight: 600, color: colors.textSecondary }}>Размер</th>
                                                <th style={{ textAlign: 'center', padding: `${spacing.xs} ${spacing.sm}`, borderBottom: `1px solid ${colors.border}`, ...typography.body, fontSize: 11, fontWeight: 600, color: colors.textSecondary }}>Кол-во</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {sizes.map((size: StockSize, sizeIndex: number) => (
                                                <tr key={sizeIndex} style={{ backgroundColor: sizeIndex % 2 === 0 ? colors.bgWhite : colors.bgGrayLight }}>
                                                  <td style={{ padding: `${spacing.xs} ${spacing.sm}`, borderBottom: `1px solid ${colors.border}`, ...typography.body, fontSize: 11 }}>{size.wbSize || size.techSize || 'Неизвестно'}</td>
                                                  <td style={{ textAlign: 'center', padding: `${spacing.xs} ${spacing.sm}`, borderBottom: `1px solid ${colors.border}`, ...typography.body, fontSize: 11, fontWeight: 500, color: size.amount === 0 ? colors.error : undefined }}>{formatValue(size.amount)}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <div style={{ ...typography.body, fontSize: 11, color: colors.textSecondary }}>Нет данных по размерам</div>
                                      )
                                    })()}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: colors.textSecondary, padding: spacing.md }}>Нет данных по остаткам</div>
                )}
              </div>
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

type CampaignNoteFileEntry = { uid: string; file: File }

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
  const [noteFileItems, setNoteFileItems] = useState<CampaignNoteFileEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<{ url: string; fileName: string } | null>(null)

  const { data: notes = [], isLoading: loadingNotes, refetch: refetchNotes } = useQuery({
    queryKey: ['campaign-notes', campaignId, sellerId, cabinetId],
    queryFn: () => analyticsApi.getCampaignNotes(campaignId, sellerId, cabinetId),
    enabled: !Number.isNaN(campaignId),
  })

  const openNoteModal = (note?: CampaignNote) => {
    setEditingNote(note ?? null)
    setNoteContent(note?.content ?? '')
    setNoteFileItems([])
    setIsNoteModalOpen(true)
  }

  const handleNoteModalPaste = useCallback((e: React.ClipboardEvent) => {
    const files = getFilesFromClipboardData(e.clipboardData)
    if (files.length === 0) return
    e.preventDefault()
    const base = Date.now()
    setNoteFileItems((prev) => [
      ...prev,
      ...files.map((file, i) => ({
        uid: `paste-${base}-${i}-${Math.random().toString(36).slice(2, 9)}`,
        file: renameGenericClipboardFile(file),
      })),
    ])
    message.success(files.length === 1 ? 'Файл добавлен из буфера обмена' : `Добавлено файлов: ${files.length}`)
  }, [])

  const handleCreateNote = async () => {
    if (!noteContent.trim()) {
      message.warning('Введите текст заметки')
      return
    }
    setSaving(true)
    try {
      const created = await analyticsApi.createCampaignNote(campaignId, { content: noteContent.trim() }, sellerId, cabinetId)
      message.success('Заметка создана')
      if (noteFileItems.length > 0) {
        for (const { file } of noteFileItems) {
          try {
            await analyticsApi.uploadCampaignNoteFile(campaignId, created.id, file, sellerId, cabinetId)
          } catch (err: unknown) {
            message.error(
              `Ошибка при загрузке файла ${file.name}: ${(err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Неизвестная ошибка'}`
            )
          }
        }
        message.success(`Загружено файлов: ${noteFileItems.length}`)
      }
      setIsNoteModalOpen(false)
      setNoteContent('')
      setNoteFileItems([])
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
      if (noteFileItems.length > 0) {
        for (const { file } of noteFileItems) {
          try {
            await analyticsApi.uploadCampaignNoteFile(campaignId, editingNote.id, file, sellerId, cabinetId)
          } catch (err: unknown) {
            message.error(
              `Ошибка при загрузке файла ${file.name}: ${(err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Неизвестная ошибка'}`
            )
          }
        }
        message.success(`Загружено файлов: ${noteFileItems.length}`)
      }
      setIsNoteModalOpen(false)
      setEditingNote(null)
      setNoteContent('')
      setNoteFileItems([])
      refetchNotes()
    } catch (err: unknown) {
      message.error(((err as { response?: { data?: { message?: string } } })?.response?.data?.message) ?? 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = (noteId: number) => {
    Modal.confirm({
      title: 'Удалить заметку?',
      content: 'Это действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await analyticsApi.deleteCampaignNote(campaignId, noteId, sellerId, cabinetId)
          message.success('Заметка удалена')
          refetchNotes()
        } catch (err: unknown) {
          message.error(((err as { response?: { data?: { message?: string } } })?.response?.data?.message) ?? 'Ошибка')
        }
      },
    })
  }

  const isImageFile = (mimeType: string | null) => !!mimeType && mimeType.startsWith('image/')

  const handleViewImage = async (noteId: number, fileId: number, fileName: string) => {
    try {
      const blob = await analyticsApi.getCampaignNoteFileBlob(campaignId, noteId, fileId, sellerId, cabinetId)
      const url = window.URL.createObjectURL(blob)
      setImagePreview({ url, fileName })
    } catch (err: unknown) {
      message.error(((err as { response?: { data?: { message?: string } } })?.response?.data?.message) ?? 'Ошибка при загрузке изображения')
    }
  }

  const handleDownloadFile = async (noteId: number, fileId: number, fileName: string) => {
    try {
      await analyticsApi.downloadCampaignNoteFile(campaignId, noteId, fileId, fileName, sellerId, cabinetId)
    } catch (err: unknown) {
      message.error(((err as { response?: { data?: { message?: string } } })?.response?.data?.message) ?? 'Ошибка при скачивании')
    }
  }

  const handleDeleteFile = async (noteId: number, fileId: number) => {
    Modal.confirm({
      title: 'Удалить файл?',
      content: 'Это действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await analyticsApi.deleteCampaignNoteFile(campaignId, noteId, fileId, sellerId, cabinetId)
          message.success('Файл удален')
          refetchNotes()
        } catch (err: unknown) {
          message.error(((err as { response?: { data?: { message?: string } } })?.response?.data?.message) ?? 'Ошибка')
        }
      },
    })
  }

  return (
    <>
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
              {note.files && note.files.length > 0 && (
                <div style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                    {note.files.map((file) => (
                      <div
                        key={file.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: spacing.xs,
                          backgroundColor: colors.bgWhite,
                          borderRadius: borderRadius.sm,
                          border: `1px solid ${colors.borderLight}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, flex: 1 }}>
                          <PaperClipOutlined style={{ color: colors.textSecondary }} />
                          <span style={{ ...FONT_PAGE, color: colors.textPrimary }}>{file.fileName}</span>
                          <span style={{ ...FONT_PAGE_SMALL, color: colors.textSecondary }}>({(file.fileSize / 1024).toFixed(2)} КБ)</span>
                        </div>
                        <div style={{ display: 'flex', gap: spacing.xs }}>
                          {isImageFile(file.mimeType) && (
                            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewImage(note.id, file.id, file.fileName)} title="Просмотр" />
                          )}
                          <Button type="text" size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadFile(note.id, file.id, file.fileName)} title="Скачать" />
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteFile(note.id, file.id)} title="Удалить" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editingNote ? 'Редактировать заметку' : 'Создать заметку'}
        open={isNoteModalOpen}
        onOk={editingNote ? handleUpdateNote : handleCreateNote}
        onCancel={() => {
          setIsNoteModalOpen(false)
          setEditingNote(null)
          setNoteContent('')
          setNoteFileItems([])
        }}
        okText={editingNote ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        width={600}
        confirmLoading={saving}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }} onPaste={handleNoteModalPaste}>
          <Input.TextArea rows={6} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Введите текст заметки..." />
          <div>
            <div style={{ marginBottom: spacing.xs, ...FONT_PAGE_SMALL, color: colors.textSecondary }}>
              Прикрепить файлы или вставьте из буфера обмена:
            </div>
            <Upload
              multiple
              beforeUpload={(file) => {
                setNoteFileItems((prev) => [
                  ...prev,
                  { uid: `pick-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, file },
                ])
                return false
              }}
              onRemove={(file) => {
                setNoteFileItems((prev) => prev.filter((x) => x.uid !== file.uid))
              }}
              fileList={noteFileItems.map(({ uid, file }) => ({
                uid,
                name: file.name,
                status: 'done' as const,
              }))}
            >
              <Button icon={<PaperClipOutlined />}>Выбрать файлы</Button>
            </Upload>
          </div>
        </div>
      </Modal>
    </div>

    <Modal
      title={imagePreview?.fileName || 'Просмотр изображения'}
      open={!!imagePreview}
      onCancel={() => {
        if (imagePreview?.url) window.URL.revokeObjectURL(imagePreview.url)
        setImagePreview(null)
      }}
      footer={null}
      width={800}
      centered
    >
      {imagePreview && (
        <div style={{ textAlign: 'center' }}>
          <img
            src={imagePreview.url}
            alt={imagePreview.fileName}
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: borderRadius.sm }}
          />
        </div>
      )}
    </Modal>
    </>
  )
}

function ComboProductItem({ article, photoSize }: { article: ArticleSummary; photoSize: number }) {
  const articlePath = `/analytics/article/${article.nmId}`
  return (
    <Link
      to={articlePath}
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
    </Link>
  )
}
