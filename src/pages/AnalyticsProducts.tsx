import { useState, useMemo, useCallback, useEffect, useRef, type RefObject } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Spin, Input, Button, Popover, Checkbox, Select } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined, StarFilled } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId, getStoredCabinetIdForSeller, setStoredCabinetIdForSeller } from '../api/cabinets'
import { userApi } from '../api/user'
import type { ArticleSummary, Period } from '../types/analytics'
import { colors, typography, spacing, borderRadius, transitions, shadows } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'

dayjs.locale('ru')

const FONT_PAGE = { fontSize: '12px' as const }
const FONT_PAGE_SMALL = { fontSize: '11px' as const }
const PAGE_SIZE = 10

const WB_CATALOG_URL = (nmId: number) => `https://www.wildberries.ru/catalog/${nmId}/detail.aspx`

/** Период «последние 7 дней» для списка товаров */
function getLast7DaysPeriod(): Period {
  const yesterday = dayjs().subtract(1, 'day')
  const dateFrom = yesterday.subtract(6, 'day')
  return {
    id: 1,
    name: '7 дней',
    dateFrom: dateFrom.format('YYYY-MM-DD'),
    dateTo: yesterday.format('YYYY-MM-DD'),
  }
}

const STORAGE_KEY_PREFIX = 'products_selected_nm_ids_'

function getStoredSelectedNmIds(cabinetId: number | null): number[] {
  if (cabinetId == null) return []
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${cabinetId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as number[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function setStoredSelectedNmIds(cabinetId: number | null, nmIds: number[]) {
  if (cabinetId == null) return
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${cabinetId}`, JSON.stringify(nmIds))
}

/** Мини-график столбиками по дням (значения orders) */
function MiniChart({ values, height = 32 }: { values: number[]; height?: number }) {
  const max = Math.max(1, ...values)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: max ? `${Math.max(2, (v / max) * 100)}%` : 2,
            minHeight: 2,
            backgroundColor: colors.primary,
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  )
}

export default function AnalyticsProducts() {
  const role = useAuthStore((state) => state.role)
  const isManagerOrAdmin = role === 'ADMIN' || role === 'MANAGER'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNmIds, setSelectedNmIds] = useState<number[]>(() => [])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [filterSearch, setFilterSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: activeSellers = [] } = useQuery({
    queryKey: ['activeSellers'],
    queryFn: () => userApi.getActiveSellers(),
    enabled: isManagerOrAdmin,
  })

  const [selectedSellerId, setSelectedSellerId] = useState<number | undefined>(() => {
    if (!isManagerOrAdmin) return undefined
    const saved = localStorage.getItem('analytics_selected_seller_id')
    if (saved) {
      const id = parseInt(saved, 10)
      if (!Number.isNaN(id)) return id
    }
    return undefined
  })

  const { data: myCabinets = [], isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: !isManagerOrAdmin,
  })

  const { data: sellerCabinets = [], isLoading: sellerCabinetsLoading } = useQuery({
    queryKey: ['sellerCabinets', selectedSellerId],
    queryFn: () => userApi.getSellerCabinets(selectedSellerId!),
    enabled: isManagerOrAdmin && selectedSellerId != null,
  })

  const cabinets = isManagerOrAdmin ? sellerCabinets : myCabinets
  const cabinetsLoadingState = isManagerOrAdmin ? sellerCabinetsLoading : cabinetsLoading

  const [selectedCabinetId, setSelectedCabinetIdState] = useState<number | null>(() => {
    if (isManagerOrAdmin && selectedSellerId != null) return getStoredCabinetIdForSeller(selectedSellerId)
    return getStoredCabinetId()
  })

  const setSelectedCabinetId = useCallback(
    (id: number | null) => {
      setSelectedCabinetIdState(id)
      if (isManagerOrAdmin && selectedSellerId != null) {
        setStoredCabinetIdForSeller(selectedSellerId, id)
      } else {
        setStoredCabinetId(id)
      }
    },
    [isManagerOrAdmin, selectedSellerId]
  )

  useEffect(() => {
    if (isManagerOrAdmin && selectedSellerId != null) {
      setSelectedCabinetIdState(getStoredCabinetIdForSeller(selectedSellerId))
    } else if (!isManagerOrAdmin) {
      setSelectedCabinetIdState(getStoredCabinetId())
    }
  }, [selectedSellerId, isManagerOrAdmin])

  useEffect(() => {
    if (cabinets.length > 0 && selectedCabinetId === null) {
      setSelectedCabinetId(cabinets[0].id)
    }
  }, [cabinets, selectedCabinetId])

  useEffect(() => {
    if (isManagerOrAdmin && activeSellers.length > 0 && selectedSellerId === undefined) {
      const last = activeSellers[activeSellers.length - 1]
      setSelectedSellerId(last.id)
      localStorage.setItem('analytics_selected_seller_id', String(last.id))
    }
  }, [isManagerOrAdmin, activeSellers, selectedSellerId])

  useEffect(() => {
    if (isManagerOrAdmin && selectedSellerId != null) {
      localStorage.setItem('analytics_selected_seller_id', String(selectedSellerId))
    }
  }, [isManagerOrAdmin, selectedSellerId])

  const last7DaysPeriod = useMemo(() => getLast7DaysPeriod(), [])

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-products-summary', selectedCabinetId, selectedSellerId, last7DaysPeriod],
    queryFn: () =>
      analyticsApi.getSummary({
        periods: [last7DaysPeriod],
        cabinetId: selectedCabinetId ?? undefined,
        sellerId: selectedSellerId,
      }),
    enabled: selectedCabinetId != null,
  })

  const articles = summary?.articles ?? []
  const cabinetSelectProps =
    cabinets.length > 0 && (role === 'SELLER' || role === 'WORKER')
      ? {
          cabinets: cabinets.map((c) => ({ id: c.id, name: c.name })),
          selectedCabinetId,
          onCabinetChange: setSelectedCabinetId,
          loading: cabinetsLoadingState,
        }
      : undefined

  // Восстановление выбранных артикулов из localStorage при смене кабинета
  useEffect(() => {
    setSelectedNmIds(getStoredSelectedNmIds(selectedCabinetId))
  }, [selectedCabinetId])

  useEffect(() => {
    setStoredSelectedNmIds(selectedCabinetId, selectedNmIds)
  }, [selectedCabinetId, selectedNmIds])

  const searchLower = searchQuery.trim().toLowerCase()
  const filteredArticles = useMemo(() => {
    let list = selectedNmIds.length > 0
      ? articles.filter((a) => selectedNmIds.includes(a.nmId))
      : articles
    if (searchLower) {
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(searchLower) ||
          String(a.nmId).includes(searchQuery.trim()) ||
          (a.vendorCode && a.vendorCode.toLowerCase().includes(searchLower))
      )
    }
    return list
  }, [articles, selectedNmIds, searchLower, searchQuery])

  const visibleArticles = useMemo(
    () => filteredArticles.slice(0, visibleCount),
    [filteredArticles, visibleCount]
  )

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredArticles.length))
  }, [filteredArticles.length])

  const scrollHandler = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight - scrollTop - clientHeight < 200) loadMore()
  }, [loadMore])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('scroll', scrollHandler, { passive: true })
    return () => el.removeEventListener('scroll', scrollHandler)
  }, [scrollHandler])

  const toggleFilterNmId = useCallback((nmId: number, checked: boolean) => {
    setSelectedNmIds((prev) =>
      checked ? [...prev, nmId] : prev.filter((id) => id !== nmId)
    )
  }, [])

  const removeChip = useCallback((nmId: number) => {
    setSelectedNmIds((prev) => prev.filter((id) => id !== nmId))
  }, [])

  const last7Dates = useMemo(() => {
    const end = dayjs().subtract(1, 'day')
    const dates: string[] = []
    for (let i = 6; i >= 0; i--) dates.push(end.subtract(i, 'day').format('YYYY-MM-DD'))
    return dates
  }, [])

  return (
    <>
      <style>{`
        .products-table-link { color: ${colors.primary}; text-decoration: none; transition: color 0.2s ease, opacity 0.2s ease, text-decoration 0.2s ease; }
        .products-table-link:hover { color: ${colors.primaryHover}; text-decoration: underline; }
        .products-table-link--img { display: block; opacity: 1; }
        .products-table-link--img:hover { opacity: 0.85; }
      `}</style>
      <Header cabinetSelectProps={cabinetSelectProps} />
      <Breadcrumbs />
      <div
        style={{
          padding: `${spacing.lg} ${spacing.md}`,
          width: '100%',
          backgroundColor: colors.bgGray,
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            width: '100%',
            backgroundColor: colors.bgWhite,
            border: `1px solid ${colors.borderLight}`,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            marginBottom: spacing.xl,
            boxShadow: shadows.md,
            transition: transitions.normal,
          }}
        >
          <h2
            style={{
              ...typography.h2,
              ...FONT_PAGE,
              margin: 0,
              marginBottom: spacing.md,
              color: colors.textPrimary,
            }}
          >
            Товары
          </h2>

          {isManagerOrAdmin && activeSellers.length > 0 && (
            <div style={{ marginBottom: spacing.md, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Select
                value={selectedSellerId}
                onChange={setSelectedSellerId}
                style={{ minWidth: 250 }}
                placeholder="Выберите продавца"
                options={activeSellers.map((s) => ({ label: s.email, value: s.id }))}
              />
              {selectedSellerId != null && cabinets.length > 0 && (
                <Select
                  value={selectedCabinetId}
                  onChange={setSelectedCabinetId}
                  style={{ minWidth: 220 }}
                  placeholder="Выберите кабинет"
                  options={cabinets.map((c) => ({ label: c.name, value: c.id }))}
                  loading={cabinetsLoadingState}
                />
              )}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: spacing.md,
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <Input
              placeholder="Поиск по названию, ID"
              prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{
                maxWidth: 360,
                borderRadius: borderRadius.sm,
                color: colors.textPrimary,
              }}
              classNames={{ input: undefined }}
            />
            <Popover
              content={
                <div style={{ width: 400, maxHeight: 400, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Input
                    placeholder="Поиск по арт. продавца или WB"
                    prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    style={{ marginBottom: 12 }}
                    allowClear
                  />
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
                    {articles
                      .filter((a) => {
                        const q = filterSearch.trim().toLowerCase()
                        if (!q) return true
                        return (
                          String(a.nmId).includes(filterSearch.trim()) ||
                          a.vendorCode?.toLowerCase().includes(q) ||
                          a.title?.toLowerCase().includes(q)
                        )
                      })
                      .map((a) => (
                        <div
                          key={a.nmId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: `1px solid ${colors.borderLight}`,
                          }}
                        >
                          <Checkbox
                            checked={selectedNmIds.includes(a.nmId)}
                            onChange={(e) => toggleFilterNmId(a.nmId, e.target.checked)}
                            style={{ marginRight: 12 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: colors.textPrimary }}>
                              {a.vendorCode || a.nmId}
                            </div>
                            <div style={{ fontSize: 12, color: colors.textSecondary }}>{a.nmId}</div>
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
              <Button
                icon={<FilterOutlined />}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Фильтр
                {selectedNmIds.length > 0 && (
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
                    {selectedNmIds.length}
                  </span>
                )}
              </Button>
            </Popover>
          </div>

          {selectedNmIds.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
                marginBottom: spacing.md,
              }}
            >
              {selectedNmIds.map((nmId) => {
                const a = articles.find((x) => x.nmId === nmId)
                const label = a?.vendorCode || String(nmId)
                return (
                  <span
                    key={nmId}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: borderRadius.sm,
                      backgroundColor: '#E0F2FE',
                      color: '#0369A1',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => removeChip(nmId)}
                      style={{
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: '#0369A1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Удалить"
                    >
                      <CloseOutlined style={{ fontSize: 10 }} />
                    </button>
                  </span>
                )
              })}
            </div>
          )}

          {summaryLoading ? (
            <div style={{ textAlign: 'center', padding: spacing.xxl }}>
              <Spin />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: spacing.xxl,
                ...typography.body,
                color: colors.textSecondary,
              }}
            >
              Нет товаров за последние 7 дней
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '70vh',
                width: '100%',
              }}
            >
              <ProductsTable
                visibleArticles={visibleArticles}
                last7Dates={last7Dates}
                last7DaysPeriod={last7DaysPeriod}
                selectedCabinetId={selectedCabinetId}
                selectedSellerId={selectedSellerId}
                onLoadMore={loadMore}
                hasMore={visibleCount < filteredArticles.length}
                containerRef={containerRef}
                onScroll={scrollHandler}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const thBase = { borderBottom: `2px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary, padding: '8px 10px' as const }

/** Правая граница ячейки для визуального разделения колонок (как в воронках в информации об артикуле) */
function getCellBorderRight(colIndex: number, dateColsCount: number): string {
  const lastDateIndex = 5 + dateColsCount - 1
  if (colIndex === 4 || colIndex === lastDateIndex) return `2px solid ${colors.border}`
  return `1px solid ${colors.border}`
}

/** Ширины колонок (px) для выравнивания шапки и тела таблицы */
const COL_WIDTHS = {
  photo: 76,
  name: 220,
  rating: 88,
  stock: 72,
  sizes: 100,
  date: 44,
  dynamics: 80,
} as const

interface ProductsTableProps {
  visibleArticles: ArticleSummary[]
  last7Dates: string[]
  last7DaysPeriod: Period
  selectedCabinetId: number | null
  selectedSellerId: number | undefined
  onLoadMore: () => void
  hasMore: boolean
  containerRef: RefObject<HTMLDivElement>
  onScroll: () => void
}

function ProductsTable({
  visibleArticles,
  last7Dates,
  last7DaysPeriod,
  selectedCabinetId,
  selectedSellerId,
  onLoadMore,
  hasMore,
  containerRef,
  onScroll,
}: ProductsTableProps) {
  const [scrollbarWidth, setScrollbarWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth - containerRef.current.clientWidth
        setScrollbarWidth(w)
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, visibleArticles.length])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        width: '100%',
        overflowX: 'auto',
      }}
    >
      {/* Шапка таблицы — отступ справа под ширину скроллбара тела (измеряется под текущую ОС/браузер) */}
      <div style={{ flexShrink: 0, borderBottom: `2px solid ${colors.border}`, paddingRight: scrollbarWidth }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 1000 }}>
          <colgroup>
            <col style={{ width: COL_WIDTHS.photo }} />
            <col style={{ width: COL_WIDTHS.name }} />
            <col style={{ width: COL_WIDTHS.rating }} />
            <col style={{ width: COL_WIDTHS.stock }} />
            <col style={{ width: COL_WIDTHS.sizes }} />
            {last7Dates.map((d) => (
              <col key={d} style={{ width: COL_WIDTHS.date }} />
            ))}
            <col style={{ width: COL_WIDTHS.dynamics }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: colors.bgGray }}>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRight(0, last7Dates.length) }}>Фото</th>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRight(1, last7Dates.length) }}>Название и детали</th>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRight(2, last7Dates.length) }}>Рейтинг</th>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRight(3, last7Dates.length) }}>Остаток</th>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRight(4, last7Dates.length) }}>Размеры</th>
              {last7Dates.map((d, i) => (
                <th
                  key={d}
                  style={{
                    ...thBase,
                    textAlign: 'center',
                    padding: '8px 6px',
                    verticalAlign: 'bottom',
                    borderRight: getCellBorderRight(5 + i, last7Dates.length),
                  }}
                >
                  <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(-180deg)', display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {dayjs(d).format('DD.MM')}
                  </span>
                </th>
              ))}
              <th style={{ ...thBase, textAlign: 'center', color: colors.primary, borderRight: getCellBorderRight(5 + last7Dates.length, last7Dates.length) }}>Динамика</th>
            </tr>
          </thead>
        </table>
      </div>
      {/* Тело таблицы — только оно прокручивается по вертикали */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, minHeight: 0 }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 1000 }}>
          <colgroup>
            <col style={{ width: COL_WIDTHS.photo }} />
            <col style={{ width: COL_WIDTHS.name }} />
            <col style={{ width: COL_WIDTHS.rating }} />
            <col style={{ width: COL_WIDTHS.stock }} />
            <col style={{ width: COL_WIDTHS.sizes }} />
            {last7Dates.map((d) => (
              <col key={d} style={{ width: COL_WIDTHS.date }} />
            ))}
            <col style={{ width: COL_WIDTHS.dynamics }} />
          </colgroup>
          <tbody>
            {visibleArticles.map((article, idx) => (
              <ProductRow
                key={article.nmId}
                article={article}
                last7Dates={last7Dates}
                last7DaysPeriod={last7DaysPeriod}
                selectedCabinetId={selectedCabinetId}
                selectedSellerId={selectedSellerId}
                rowIndex={idx}
              />
            ))}
          </tbody>
        </table>
        {hasMore && (
          <div style={{ textAlign: 'center', padding: spacing.md }}>
            <Button type="link" onClick={onLoadMore} style={{ color: colors.primary }}>
              Загрузить ещё
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ProductRowProps {
  article: ArticleSummary
  last7Dates: string[]
  last7DaysPeriod: Period
  selectedCabinetId: number | null
  selectedSellerId: number | undefined
  rowIndex: number
}

function ProductRow({ article, last7Dates, last7DaysPeriod, selectedCabinetId, selectedSellerId, rowIndex }: ProductRowProps) {
  const navigate = useNavigate()

  const { data: articleDetail, isLoading } = useQuery({
    queryKey: ['analytics-article', article.nmId, last7DaysPeriod, selectedCabinetId, selectedSellerId],
    queryFn: () =>
      analyticsApi.getArticle(
        article.nmId,
        [last7DaysPeriod],
        selectedSellerId,
        selectedCabinetId ?? undefined
      ),
    enabled: true,
  })

  const firstStockWarehouse = articleDetail?.stocks?.[0]?.warehouseName ?? null
  const { data: stockSizes = [] } = useQuery({
    queryKey: ['analytics-article-stock-sizes', article.nmId, firstStockWarehouse, selectedCabinetId, selectedSellerId],
    queryFn: () =>
      analyticsApi.getStockSizes(
        article.nmId,
        firstStockWarehouse!,
        selectedSellerId,
        selectedCabinetId ?? undefined
      ),
    enabled: !!firstStockWarehouse,
  })

  const inPromotion = articleDetail?.inWbPromotion === true
  const rating = articleDetail?.article?.rating ?? null
  const reviewsCount = articleDetail?.article?.reviewsCount ?? null
  const stocksTotal = useMemo(
    () => (articleDetail?.stocks ?? []).reduce((s, st) => s + (st.amount ?? 0), 0),
    [articleDetail?.stocks]
  )
  const dailyByDate = useMemo(() => {
    const map = new Map<string, number>()
    if (!articleDetail?.dailyData) return map
    for (const d of articleDetail.dailyData) {
      if (d.date && d.orders != null) map.set(d.date, d.orders)
    }
    return map
  }, [articleDetail?.dailyData])
  const last7Values = useMemo(
    () => last7Dates.map((d) => dailyByDate.get(d) ?? 0),
    [last7Dates, dailyByDate]
  )

  const sizesLabel = useMemo(() => {
    if (!stockSizes.length) return '-'
    return stockSizes.map((s) => s.wbSize || s.techSize || '').filter(Boolean).join(', ') || '-'
  }, [stockSizes])

  const goToArticle = () => navigate(`/analytics/article/${article.nmId}`)
  const wbUrl = WB_CATALOG_URL(article.nmId)
  const articlePath = `/analytics/article/${article.nmId}`

  const stopProp = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={goToArticle}
      onKeyDown={(e) => e.key === 'Enter' && goToArticle()}
      style={{
        backgroundColor: rowIndex % 2 === 0 ? colors.bgWhite : colors.bgGrayLight,
        transition: transitions.fast,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.bgGray
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? colors.bgWhite : colors.bgGrayLight
      }}
    >
      <td
        style={{
          padding: '6px 10px',
          borderBottom: `1px solid ${colors.border}`,
          borderRight: getCellBorderRight(0, last7Dates.length),
          verticalAlign: 'top',
          width: COL_WIDTHS.photo,
          position: 'relative',
          minHeight: 64,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 10,
            bottom: 6,
            width: 64,
            minHeight: 64,
            borderRadius: borderRadius.sm,
            overflow: 'hidden',
          }}
        >
          <a
            href={wbUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stopProp}
            className="products-table-link products-table-link--img"
            style={{ display: 'block', width: '100%', height: '100%' }}
          >
            {article.photoTm ? (
              <img
                src={article.photoTm}
                alt=""
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: colors.bgGray,
                }}
              />
            )}
          </a>
        </div>
      </td>
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRight(1, last7Dates.length), ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top' }}>
        <a
          href={wbUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stopProp}
          className="products-table-link"
          style={{ fontWeight: 700, fontSize: 13, color: colors.textPrimary, marginBottom: 4, display: 'inline-block' }}
        >
          {article.title || '-'}
        </a>
        <div style={{ color: colors.textSecondary, marginBottom: 2 }}>
          {[article.subjectName, article.brand].filter(Boolean).join(' · ') || '-'}
        </div>
        <div style={{ color: colors.textSecondary, marginBottom: 2 }}>
          Артикул WB:{' '}
          <Link to={articlePath} onClick={stopProp} className="products-table-link">
            {article.nmId}
          </Link>
        </div>
        <div style={{ color: colors.textSecondary, marginBottom: 4 }}>
          Артикул продавца:{' '}
          <Link to={articlePath} onClick={stopProp} className="products-table-link">
            {article.vendorCode ?? '-'}
          </Link>
        </div>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: borderRadius.sm,
            fontSize: 11,
            fontWeight: 500,
            backgroundColor: inPromotion ? colors.successLight : colors.bgGray,
            color: inPromotion ? colors.success : colors.textSecondary,
          }}
        >
          {inPromotion ? 'В акции' : 'Не в акции'}
        </span>
      </td>
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRight(2, last7Dates.length), ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top' }}>
        {isLoading ? (
          <Spin size="small" />
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <StarFilled style={{ color: '#FBBF24', fontSize: 12 }} />
            <span>{rating != null ? Number(rating).toFixed(1) : '-'}</span>
            {reviewsCount != null && (
              <span style={{ color: colors.textSecondary }}>({reviewsCount})</span>
            )}
          </span>
        )}
      </td>
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRight(3, last7Dates.length), ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top' }}>
        {isLoading ? '-' : stocksTotal.toLocaleString('ru-RU')}
      </td>
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRight(4, last7Dates.length), ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top' }}>
        {!firstStockWarehouse ? '-' : sizesLabel}
      </td>
      {last7Dates.map((d, i) => (
        <td
          key={d}
          style={{
            textAlign: 'center',
            padding: '6px',
            borderBottom: `1px solid ${colors.border}`,
            borderRight: getCellBorderRight(5 + i, last7Dates.length),
            ...typography.body,
            ...FONT_PAGE_SMALL,
            verticalAlign: 'top',
          }}
        >
          {isLoading ? '-' : (dailyByDate.get(d) ?? 0).toLocaleString('ru-RU')}
        </td>
      ))}
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRight(5 + last7Dates.length, last7Dates.length), verticalAlign: 'top' }}>
        {isLoading ? (
          <Spin size="small" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MiniChart values={last7Values} />
          </div>
        )}
      </td>
    </tr>
  )
}
