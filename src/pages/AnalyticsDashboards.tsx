import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Input, Popover, Tooltip, message } from 'antd'
import { FilterOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi } from '../api/cabinets'
import { generateDefaultPeriods, validatePeriods } from '../utils/periodGenerator'
import {
  analyticsSharedKeys,
  excludedNmIdsStorageKey,
  readSharedFilterToNone,
  readSharedOnlyInAdvertising,
  readSharedOnlyPriority,
  readSharedOnlyWithPhoto,
  readSharedSearch,
  writeSharedFilterToNone,
  writeSharedOnlyInAdvertising,
  writeSharedOnlyPriority,
  writeSharedOnlyWithPhoto,
  writeSharedSearch,
} from '../utils/analyticsSharedFilterStorage'
import type {
  ArticleSummary,
  DashboardDailyMetric,
  DashboardFulfillment,
  Period,
} from '../types/analytics'
import type { CabinetDto } from '../types/api'
import { colors, spacing, borderRadius } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useWorkContextForAdmin } from '../hooks/useWorkContextForAdmin'
import { useStoredCabinet } from '../hooks/useStoredCabinet'
import { useCabinetCurrency } from '../hooks/useCabinetCurrency'
import { currencyLabel } from '../utils/money'
import DashboardPeriodCards from '../components/dashboards/DashboardPeriodCards'
import DashboardKpiCards from '../components/dashboards/DashboardKpiCards'
import DashboardDynamicsChart from '../components/dashboards/DashboardDynamicsChart'
import DashboardStocksBlock from '../components/dashboards/DashboardStocksBlock'
import DashboardRankingsBlock from '../components/dashboards/DashboardRankingsBlock'
import { MAX_DASHBOARD_PERIODS } from '../components/dashboards/dashboardConstants'

dayjs.locale('ru')

const PERIODS_STORAGE_KEY = 'analytics_dashboard_periods'

/**
 * Страница «Аналитика → Дашборды» (только WB; для Ozon — заглушка).
 */
export default function AnalyticsDashboards() {
  const role = useAuthStore((state) => state.role)
  const isAdmin = role === 'ADMIN'
  const workContext = useWorkContextForAdmin(isAdmin)

  const selectedSellerId = isAdmin ? workContext.selectedSellerId : undefined

  const { data: myCabinets = [], isLoading: myCabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: !isAdmin,
  })

  const cabinets: CabinetDto[] = useMemo(() => {
    if (isAdmin) {
      return workContext.workContextOptions.map((o) => ({
        id: o.cabinetId,
        name: o.cabinetName,
        marketplaceType: o.marketplaceType,
        createdAt: '',
        updatedAt: '',
        lastDataUpdateAt: o.lastDataUpdateAt,
        lastDataUpdateRequestedAt: o.lastDataUpdateRequestedAt,
        apiKey: null,
      }))
    }
    return myCabinets
  }, [isAdmin, workContext.workContextOptions, myCabinets])

  const cabinetsLoading = isAdmin ? workContext.workContextLoading : myCabinetsLoading
  const { cabinetId: sellerCabinetId, setCabinetId: setSellerCabinetId } = useStoredCabinet(myCabinets)
  const selectedCabinetId = isAdmin ? workContext.selectedCabinetId : sellerCabinetId
  const cabinetCurrency = useCabinetCurrency(selectedCabinetId)
  const moneySuffix = currencyLabel(cabinetCurrency)

  const setSelectedCabinetId = useCallback(
    (id: number | null) => {
      if (isAdmin) {
        if (id != null) workContext.applyWorkContextCabinet(id)
      } else {
        setSellerCabinetId(id)
      }
    },
    [isAdmin, workContext.applyWorkContextCabinet, setSellerCabinetId]
  )

  const selectedCabinet = useMemo(
    () => (selectedCabinetId != null ? cabinets.find((c) => c.id === selectedCabinetId) : undefined),
    [cabinets, selectedCabinetId]
  )
  const isOzonCabinet = selectedCabinet?.marketplaceType === 'OZON'

  const [periods, setPeriods] = useState<Period[]>(() => {
    const saved = localStorage.getItem(PERIODS_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Period[]
        if (validatePeriods(parsed) && parsed.length <= MAX_DASHBOARD_PERIODS) {
          return parsed.slice(0, MAX_DASHBOARD_PERIODS)
        }
      } catch {
        /* ignore */
      }
    }
    return generateDefaultPeriods().slice(0, MAX_DASHBOARD_PERIODS)
  })

  const [articleSearchText, setArticleSearchText] = useState('')
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(true)
  const [onlyPriority, setOnlyPriority] = useState(false)
  const [onlyInAdvertising, setOnlyInAdvertising] = useState(false)
  const [excludedNmIds, setExcludedNmIds] = useState<Set<number>>(new Set())
  const [originalArticles, setOriginalArticles] = useState<ArticleSummary[]>([])
  const [articleCatalogLoading, setArticleCatalogLoading] = useState(true)
  const [dailyMetric, setDailyMetric] = useState<DashboardDailyMetric>('orders')
  const [stockNmId, setStockNmId] = useState<number | null>(null)
  const [fulfillment, setFulfillment] = useState<DashboardFulfillment>('ALL')
  const [periodsPickerHint, setPeriodsPickerHint] = useState(false)

  useEffect(() => {
    localStorage.setItem(PERIODS_STORAGE_KEY, JSON.stringify(periods))
  }, [periods])

  useLayoutEffect(() => {
    if (selectedCabinetId == null) return
    setArticleSearchText(readSharedSearch(selectedCabinetId))
    setOnlyWithPhoto(readSharedOnlyWithPhoto(selectedCabinetId))
    setOnlyPriority(readSharedOnlyPriority(selectedCabinetId))
    setOnlyInAdvertising(readSharedOnlyInAdvertising(selectedCabinetId))
  }, [selectedCabinetId])

  useEffect(() => {
    if (selectedCabinetId == null) return
    writeSharedSearch(selectedCabinetId, articleSearchText)
  }, [selectedCabinetId, articleSearchText])

  useEffect(() => {
    if (selectedCabinetId == null) return
    writeSharedOnlyWithPhoto(selectedCabinetId, onlyWithPhoto)
  }, [selectedCabinetId, onlyWithPhoto])

  useEffect(() => {
    if (selectedCabinetId == null) return
    writeSharedOnlyPriority(selectedCabinetId, onlyPriority)
  }, [selectedCabinetId, onlyPriority])

  useEffect(() => {
    if (selectedCabinetId == null) return
    writeSharedOnlyInAdvertising(selectedCabinetId, onlyInAdvertising)
  }, [selectedCabinetId, onlyInAdvertising])

  const loadArticles = useCallback(async () => {
    if (isAdmin && selectedSellerId === undefined) return
    setArticleCatalogLoading(true)
    try {
      const list = await analyticsApi.getArticleList(
        selectedSellerId ?? undefined,
        selectedCabinetId ?? undefined,
        onlyWithPhoto,
        onlyPriority,
        onlyInAdvertising
      )
      setOriginalArticles(list ?? [])
    } catch (err) {
      console.error(err)
      setOriginalArticles([])
      message.error('Не удалось загрузить список артикулов')
    } finally {
      setArticleCatalogLoading(false)
    }
  }, [selectedSellerId, selectedCabinetId, onlyWithPhoto, onlyPriority, onlyInAdvertising, isAdmin])

  useEffect(() => {
    if (isAdmin) {
      if (selectedSellerId === undefined) return
      const exKey = excludedNmIdsStorageKey(selectedCabinetId, selectedSellerId)
      if (exKey) {
        const saved = localStorage.getItem(exKey)
        if (saved) {
          try {
            setExcludedNmIds(new Set(JSON.parse(saved) as number[]))
          } catch {
            setExcludedNmIds(new Set())
          }
        } else {
          setExcludedNmIds(new Set())
        }
      } else {
        setExcludedNmIds(new Set())
      }
      setOriginalArticles([])
      void loadArticles()
      return
    }
    void loadArticles()
  }, [isAdmin, selectedSellerId, selectedCabinetId, onlyWithPhoto, onlyPriority, onlyInAdvertising, loadArticles])

  useEffect(() => {
    if (selectedCabinetId == null || originalArticles.length === 0) return
    const exKey = excludedNmIdsStorageKey(selectedCabinetId, selectedSellerId)
    const cabinetExcludedRaw = exKey ? localStorage.getItem(exKey) : null
    const cabinetExcludedEmpty =
      cabinetExcludedRaw == null || cabinetExcludedRaw === '' || cabinetExcludedRaw === '[]'

    if (readSharedFilterToNone(selectedCabinetId)) {
      if (cabinetExcludedEmpty) {
        writeSharedFilterToNone(selectedCabinetId, false)
        setExcludedNmIds(new Set())
        return
      }
      setExcludedNmIds(new Set(originalArticles.map((a) => a.nmId)))
      return
    }
    try {
      const raw = localStorage.getItem(analyticsSharedKeys.selectedNmIds(selectedCabinetId))
      if (raw == null) {
        setExcludedNmIds(new Set())
        return
      }
      const included = JSON.parse(raw) as number[]
      if (!Array.isArray(included) || included.length === 0) {
        setExcludedNmIds(new Set())
        return
      }
      const articleIdSet = new Set(originalArticles.map((a) => a.nmId))
      if (!included.some((id) => articleIdSet.has(id))) {
        setExcludedNmIds(new Set())
        return
      }
      setExcludedNmIds(
        new Set(originalArticles.filter((a) => !included.includes(a.nmId)).map((a) => a.nmId))
      )
    } catch {
      setExcludedNmIds(new Set())
    }
  }, [selectedCabinetId, originalArticles, selectedSellerId])

  useEffect(() => {
    const exKey = excludedNmIdsStorageKey(selectedCabinetId, selectedSellerId)
    if (exKey) {
      try {
        localStorage.setItem(exKey, JSON.stringify(Array.from(excludedNmIds)))
      } catch {
        /* ignore */
      }
    }
    if (selectedCabinetId != null && originalArticles.length > 0) {
      const allExcluded = excludedNmIds.size === originalArticles.length
      writeSharedFilterToNone(selectedCabinetId, allExcluded)
      try {
        const included = originalArticles.filter((a) => !excludedNmIds.has(a.nmId)).map((a) => a.nmId)
        localStorage.setItem(analyticsSharedKeys.selectedNmIds(selectedCabinetId), JSON.stringify(included))
      } catch {
        /* ignore */
      }
    }
  }, [excludedNmIds, selectedSellerId, selectedCabinetId, originalArticles])

  const searchLower = articleSearchText.trim().toLowerCase()

  const filteredArticles = useMemo(() => {
    return originalArticles.filter((article) => {
      if (excludedNmIds.has(article.nmId)) return false
      if (!searchLower) return true
      return (
        article.nmId.toString().includes(searchLower) ||
        (article.title ?? '').toLowerCase().includes(searchLower) ||
        (article.vendorCode ?? '').toLowerCase().includes(searchLower)
      )
    })
  }, [originalArticles, excludedNmIds, searchLower])

  /** Для summary: исключаем всё, что не попало в отфильтрованную выборку (в т.ч. поиск). */
  const excludedForSummary = useMemo(() => {
    const keep = new Set(filteredArticles.map((a) => a.nmId))
    return originalArticles.filter((a) => !keep.has(a.nmId)).map((a) => a.nmId)
  }, [originalArticles, filteredArticles])

  const filterToNone = originalArticles.length > 0 && filteredArticles.length === 0
  const includedNmIds = filteredArticles.map((a) => a.nmId)

  const queriesEnabled =
    !articleCatalogLoading &&
    !isOzonCabinet &&
    !(isAdmin && selectedSellerId === undefined) &&
    selectedCabinetId != null &&
    validatePeriods(periods)

  const commonFilter = useMemo(
    () => ({
      sellerId: selectedSellerId,
      cabinetId: selectedCabinetId ?? undefined,
      excludedNmIds: excludedForSummary.length > 0 ? excludedForSummary : undefined,
      includedNmIds: includedNmIds.length > 0 ? includedNmIds : undefined,
      filterToNone: filterToNone || undefined,
      search: articleSearchText.trim() || undefined,
      onlyWithPhoto: onlyWithPhoto || undefined,
      onlyPriority: onlyPriority || undefined,
      onlyInAdvertising: onlyInAdvertising || undefined,
    }),
    [
      selectedSellerId,
      selectedCabinetId,
      excludedForSummary,
      includedNmIds,
      filterToNone,
      articleSearchText,
      onlyWithPhoto,
      onlyPriority,
      onlyInAdvertising,
    ]
  )

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', commonFilter, periods],
    queryFn: () =>
      analyticsApi.getSummary({
        periods,
        excludedNmIds: commonFilter.excludedNmIds,
        sellerId: commonFilter.sellerId,
        cabinetId: commonFilter.cabinetId,
        onlyWithPhoto: commonFilter.onlyWithPhoto,
        onlyPriority: commonFilter.onlyPriority,
        onlyInAdvertising: commonFilter.onlyInAdvertising,
      }),
    enabled: queriesEnabled,
  })

  const dailyQuery = useQuery({
    queryKey: ['dashboard-daily', commonFilter, periods, dailyMetric],
    queryFn: () =>
      analyticsApi.getDashboardDaily({
        ...commonFilter,
        periods,
        metric: dailyMetric,
      }),
    enabled: queriesEnabled,
  })

  const rankingsQuery = useQuery({
    queryKey: ['dashboard-rankings', commonFilter, periods],
    queryFn: () =>
      analyticsApi.getDashboardRankings({
        ...commonFilter,
        periods,
      }),
    enabled: queriesEnabled,
  })

  const stocksQuery = useQuery({
    queryKey: ['dashboard-stocks', commonFilter, stockNmId, fulfillment],
    queryFn: () =>
      analyticsApi.getDashboardStocks({
        ...commonFilter,
        nmId: stockNmId ?? undefined,
        fulfillment,
      }),
    enabled: queriesEnabled,
  })

  const handlePeriodChange = (periodId: number, dates: [Dayjs, Dayjs]) => {
    let dateFrom = dates[0]
    let dateTo = dates[1]
    if (dateFrom.isAfter(dateTo)) dateFrom = dateTo
    setPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId
          ? { ...p, dateFrom: dateFrom.format('YYYY-MM-DD'), dateTo: dateTo.format('YYYY-MM-DD') }
          : p
      )
    )
  }

  const handleAddPeriod = () => {
    if (periods.length >= MAX_DASHBOARD_PERIODS) return
    const earliest = periods.reduce(
      (min, p) => (dayjs(p.dateFrom).isBefore(min) ? dayjs(p.dateFrom) : min),
      dayjs(periods[0].dateFrom)
    )
    const end = earliest.subtract(1, 'day')
    const start = end.subtract(2, 'day')
    const next = [
      ...periods,
      {
        id: periods.length + 1,
        name: `период №${periods.length + 1}`,
        dateFrom: start.format('YYYY-MM-DD'),
        dateTo: end.format('YYYY-MM-DD'),
      },
    ].map((p, index) => ({ ...p, id: index + 1, name: `период №${index + 1}` }))
    setPeriods(next)
  }

  const handleRemovePeriod = (periodId: number) => {
    if (periods.length <= 1) return
    setPeriods(
      periods
        .filter((p) => p.id !== periodId)
        .map((p, index) => ({ ...p, id: index + 1, name: `период №${index + 1}` }))
    )
  }

  const selectedCount = originalArticles.filter((a) => !excludedNmIds.has(a.nmId)).length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgGray }}>
      <Header
        workContextCabinetSelect={isAdmin ? workContext.workContextCabinetSelectProps : undefined}
        cabinetSelectProps={
          !isAdmin && cabinets.length > 0
            ? {
                cabinets: cabinets.map((c) => ({
                  id: c.id,
                  name: c.name,
                  marketplaceType: c.marketplaceType,
                })),
                selectedCabinetId: selectedCabinetId ?? null,
                onCabinetChange: setSelectedCabinetId,
                loading: cabinetsLoading,
              }
            : undefined
        }
      />
      <Breadcrumbs />

      <div style={{ padding: `${spacing.lg} ${spacing.md}`, width: '100%' }}>
        {isOzonCabinet ? (
          <div
            style={{
              backgroundColor: colors.bgWhite,
              borderRadius: borderRadius.md,
              padding: spacing.xl,
              textAlign: 'center',
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
            }}
          >
            Дашборды доступны для кабинетов Wildberries. Выберите WB-кабинет.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: spacing.lg }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: spacing.md,
                  marginBottom: spacing.md,
                }}
              >
                <Input
                  placeholder="Поиск по артикулу или названию"
                  prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
                  value={articleSearchText}
                  onChange={(e) => setArticleSearchText(e.target.value)}
                  allowClear
                  style={{ width: 360, maxWidth: '100%', borderRadius: borderRadius.sm }}
                />

                {originalArticles.length > 0 ? (
                  <Popover
                    content={
                      <div style={{ width: 400, maxHeight: 480, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                          <Button
                            size="small"
                            onClick={() => {
                              if (selectedCabinetId != null) writeSharedFilterToNone(selectedCabinetId, false)
                              setExcludedNmIds(new Set())
                            }}
                          >
                            Выбрать все
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              if (selectedCabinetId != null) writeSharedFilterToNone(selectedCabinetId, true)
                              setExcludedNmIds(new Set(originalArticles.map((a) => a.nmId)))
                            }}
                          >
                            Снять все
                          </Button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                          {originalArticles
                            .filter((article) => {
                              const q = articleSearchText.toLowerCase()
                              return (
                                article.nmId.toString().includes(q) ||
                                (article.title ?? '').toLowerCase().includes(q) ||
                                (article.vendorCode ?? '').toLowerCase().includes(q)
                              )
                            })
                            .map((article) => (
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
                                  checked={!excludedNmIds.has(article.nmId)}
                                  onChange={(e) => {
                                    const next = new Set(excludedNmIds)
                                    if (e.target.checked) next.delete(article.nmId)
                                    else next.add(article.nmId)
                                    setExcludedNmIds(next)
                                  }}
                                  style={{ marginRight: 12 }}
                                />
                                {article.photoTm && (
                                  <img
                                    src={article.photoTm}
                                    alt=""
                                    style={{
                                      width: 40,
                                      height: 40,
                                      objectFit: 'cover',
                                      borderRadius: 4,
                                      marginRight: 12,
                                    }}
                                  />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, color: colors.textSecondary }}>{article.nmId}</div>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {article.title}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    }
                    title="Фильтр артикулов"
                    trigger="click"
                    placement="bottomLeft"
                  >
                    <Button icon={<FilterOutlined />}>
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
                        {selectedCount}/{originalArticles.length}
                      </span>
                    </Button>
                  </Popover>
                ) : (
                  <Button icon={<FilterOutlined />} disabled>
                    Фильтр
                  </Button>
                )}

                <Checkbox checked={onlyWithPhoto} onChange={(e) => setOnlyWithPhoto(e.target.checked)}>
                  Только с фото
                </Checkbox>
                <Checkbox checked={onlyPriority} onChange={(e) => setOnlyPriority(e.target.checked)}>
                  Только приоритетные
                </Checkbox>
                <Tooltip title="Только артикулы в незавершённых РК">
                  <Checkbox checked={onlyInAdvertising} onChange={(e) => setOnlyInAdvertising(e.target.checked)}>
                    Только в рекламе
                  </Checkbox>
                </Tooltip>

                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
                  <Button disabled>По дням</Button>
                  <Button
                    type={periodsPickerHint ? 'primary' : 'default'}
                    onClick={() => {
                      setPeriodsPickerHint(true)
                      const el = document.getElementById('dashboard-periods')
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      window.setTimeout(() => setPeriodsPickerHint(false), 1600)
                    }}
                  >
                    Сравнить периоды
                  </Button>
                </div>
              </div>

              <div id="dashboard-periods">
                <DashboardPeriodCards
                  periods={periods}
                  onPeriodChange={handlePeriodChange}
                  onRemovePeriod={handleRemovePeriod}
                  onAddPeriod={handleAddPeriod}
                  highlighted={periodsPickerHint}
                />
              </div>
            </div>

            <section style={{ marginBottom: spacing.xl }}>
              <DashboardKpiCards
                periods={periods}
                aggregatedMetrics={summaryQuery.data?.aggregatedMetrics}
                loading={summaryQuery.isLoading || articleCatalogLoading}
                error={summaryQuery.isError ? 'Не удалось загрузить KPI' : null}
                moneySuffix={moneySuffix}
              />
            </section>

            <section style={{ marginBottom: spacing.xl }}>
              <DashboardDynamicsChart
                periods={periods}
                points={dailyQuery.data?.points}
                metric={dailyMetric}
                onMetricChange={setDailyMetric}
                loading={dailyQuery.isLoading || articleCatalogLoading}
                error={dailyQuery.isError ? 'Не удалось загрузить динамику' : null}
              />
            </section>

            <section style={{ marginBottom: spacing.xl }}>
              <DashboardStocksBlock
                data={stocksQuery.data}
                loading={stocksQuery.isLoading || articleCatalogLoading}
                error={stocksQuery.isError ? 'Не удалось загрузить остатки' : null}
                nmId={stockNmId}
                fulfillment={fulfillment}
                onNmIdChange={setStockNmId}
                onFulfillmentChange={setFulfillment}
              />
            </section>

            <section style={{ marginBottom: spacing.xl }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: spacing.md, color: colors.textPrimary }}>
                Рейтинги товаров
              </h2>
              <DashboardRankingsBlock
                data={rankingsQuery.data}
                loading={rankingsQuery.isLoading || articleCatalogLoading}
                error={rankingsQuery.isError ? 'Не удалось загрузить рейтинги' : null}
                articles={filteredArticles}
                moneySuffix={moneySuffix}
              />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
