import { useState, useMemo, useCallback, useEffect, useRef, type RefObject } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Spin, Input, Button, Popover, Checkbox } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined, StarFilled, HolderOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
import type { ArticleSummary, Period } from '../types/analytics'
import { colors, typography, spacing, borderRadius, transitions, shadows, PRODUCT_PHOTO_WIDTH, PRODUCT_PHOTO_HEIGHT } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useWorkContextForManagerAdmin } from '../hooks/useWorkContextForManagerAdmin'

dayjs.locale('ru')

const FONT_PAGE_SMALL = { fontSize: '11px' as const }
const PAGE_SIZE = 10
/** Размер одной загрузки списка артикулов для выбора в фильтре; достаточно большой, чтобы при снятии одной галочки с «все» получать «все кроме одного». */
const FILTER_LIST_PAGE_SIZE = 500

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
/** Общий ключ с Сводной: один и тот же выбор артикулов при переключении между Сводной и Товарами */
const SHARED_FILTER_KEY_PREFIX = 'analytics_shared_selected_nm_ids_'
/** Порядок строк в списке товаров (перетаскивание), по кабинету */
const PRODUCTS_ROW_ORDER_STORAGE_PREFIX = 'products_row_order_'

function sortArticlesByManualOrder(articles: ArticleSummary[], manualOrder: number[]): ArticleSummary[] {
  const orderPos = new Map(manualOrder.map((id, i) => [id, i]))
  const listed: ArticleSummary[] = []
  const rest: ArticleSummary[] = []
  for (const a of articles) {
    if (orderPos.has(a.nmId)) listed.push(a)
    else rest.push(a)
  }
  listed.sort((a, b) => orderPos.get(a.nmId)! - orderPos.get(b.nmId)!)
  return [...listed, ...rest]
}

function moveArrayItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return [...arr]
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function persistProductsRowOrder(cabinetId: number | null, order: number[]) {
  if (cabinetId == null) return
  try {
    localStorage.setItem(`${PRODUCTS_ROW_ORDER_STORAGE_PREFIX}${cabinetId}`, JSON.stringify(order))
  } catch {
    /* ignore quota */
  }
}

function getStoredSelectedNmIds(cabinetId: number | null): number[] {
  if (cabinetId == null) return []
  try {
    const sharedRaw = localStorage.getItem(`${SHARED_FILTER_KEY_PREFIX}${cabinetId}`)
    if (sharedRaw != null) {
      const parsed = JSON.parse(sharedRaw) as number[]
      if (Array.isArray(parsed)) return parsed
    }
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
  const key = `${SHARED_FILTER_KEY_PREFIX}${cabinetId}`
  localStorage.setItem(key, JSON.stringify(nmIds))
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
  const [allDeselected, setAllDeselected] = useState(false)
  const [filterSearch, setFilterSearch] = useState('')
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const filterListArticlesRef = useRef<ArticleSummary[]>([])
  /** Пропустить одну запись в storage, если только что восстановили выбор из общего ключа (чтобы не перезаписать 155 на []) */
  const skipNextWriteRef = useRef(false)

  const workContext = useWorkContextForManagerAdmin(isManagerOrAdmin)

  const selectedSellerId = isManagerOrAdmin ? workContext.selectedSellerId : undefined

  const { data: myCabinets = [], isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: !isManagerOrAdmin,
  })

  const cabinets = useMemo(() => {
    if (isManagerOrAdmin) {
      return workContext.workContextOptions.map((o) => ({ id: o.cabinetId, name: o.cabinetName }))
    }
    return myCabinets
  }, [isManagerOrAdmin, workContext.workContextOptions, myCabinets])

  const cabinetsLoadingState = isManagerOrAdmin ? workContext.workContextLoading : cabinetsLoading

  const [sellerSelectedCabinetId, setSellerSelectedCabinetId] = useState<number | null>(() => getStoredCabinetId())

  const selectedCabinetId = isManagerOrAdmin ? workContext.selectedCabinetId : sellerSelectedCabinetId

  const setSelectedCabinetId = useCallback(
    (id: number | null) => {
      if (isManagerOrAdmin) {
        if (id != null) workContext.applyWorkContextCabinet(id)
      } else {
        setSellerSelectedCabinetId(id)
        setStoredCabinetId(id)
      }
    },
    [isManagerOrAdmin, workContext.applyWorkContextCabinet],
  )

  useEffect(() => {
    if (!isManagerOrAdmin) {
      setSellerSelectedCabinetId(getStoredCabinetId())
    }
  }, [isManagerOrAdmin])

  useEffect(() => {
    if (isManagerOrAdmin) return
    if (myCabinets.length > 0 && sellerSelectedCabinetId === null) {
      const first = myCabinets[0].id
      setSellerSelectedCabinetId(first)
      setStoredCabinetId(first)
    }
  }, [isManagerOrAdmin, myCabinets, sellerSelectedCabinetId])

  const last7DaysPeriod = useMemo(() => getLast7DaysPeriod(), [])

  const searchTrimmed = searchQuery.trim()
  const {
    data: summaryData,
    isLoading: summaryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError: summaryError,
    error: summaryErr,
  } = useInfiniteQuery({
    queryKey: [
      'analytics-products-summary',
      selectedCabinetId,
      selectedSellerId,
      last7DaysPeriod,
      searchTrimmed,
      onlyWithPhoto,
      allDeselected ? 'none' : (selectedNmIds.length > 0 ? [...selectedNmIds].sort((a, b) => a - b) : null),
    ],
    queryFn: ({ pageParam }) =>
      analyticsApi.getSummary({
        periods: [last7DaysPeriod],
        cabinetId: selectedCabinetId ?? undefined,
        sellerId: selectedSellerId,
        page: pageParam as number,
        size: PAGE_SIZE,
        search: searchTrimmed || undefined,
        onlyWithPhoto: onlyWithPhoto || undefined,
        ...(allDeselected ? { filterToNone: true } : selectedNmIds.length > 0 ? { includedNmIds: selectedNmIds } : {}),
      }),
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.totalArticles ?? 0
      const loaded = allPages.reduce((s, p) => s + p.articles.length, 0)
      const next = (total > 0 && loaded >= total) || lastPage.articles.length < PAGE_SIZE ? undefined : allPages.length
      return next
    },
    initialPageParam: 0,
    enabled: selectedCabinetId != null,
  })

  const { data: filterListData } = useQuery({
    queryKey: [
      'analytics-products-filter-list',
      selectedCabinetId,
      selectedSellerId,
      last7DaysPeriod,
      searchTrimmed,
      onlyWithPhoto,
    ],
    queryFn: () =>
      analyticsApi.getSummary({
        periods: [last7DaysPeriod],
        cabinetId: selectedCabinetId ?? undefined,
        sellerId: selectedSellerId,
        page: 0,
        size: FILTER_LIST_PAGE_SIZE,
        search: searchTrimmed || undefined,
        onlyWithPhoto: onlyWithPhoto || undefined,
      }),
    enabled: selectedCabinetId != null,
  })

  const filterListArticles = useMemo(
    () => filterListData?.articles ?? [],
    [filterListData]
  )
  /** Общее число артикулов (как в Сводной), из API; для списка в фильтре может быть загружено меньше из-за лимита */
  const filterListTotal = filterListData?.totalArticles ?? filterListArticles.length
  filterListArticlesRef.current = filterListArticles

  const summaryErrorMessage =
    summaryError && (summaryErr as any)?.response?.data?.error ||
    summaryError && (summaryErr as any)?.response?.data?.message ||
    null

  const emptyStateMessage =
    isManagerOrAdmin && !workContext.workContextLoading && workContext.workContextOptions.length === 0
      ? 'Нет кабинетов с API-ключом'
      : summaryErrorMessage ?? 'Нет товаров за последние 7 дней'

  const articles = useMemo(
    () => summaryData?.pages.flatMap((p) => p.articles) ?? [],
    [summaryData]
  )

  const [manualRowOrderNmIds, setManualRowOrderNmIds] = useState<number[]>([])

  useEffect(() => {
    if (selectedCabinetId == null) {
      setManualRowOrderNmIds([])
      return
    }
    try {
      const raw = localStorage.getItem(`${PRODUCTS_ROW_ORDER_STORAGE_PREFIX}${selectedCabinetId}`)
      if (!raw) {
        setManualRowOrderNmIds([])
        return
      }
      const parsed = JSON.parse(raw) as number[]
      setManualRowOrderNmIds(Array.isArray(parsed) ? parsed : [])
    } catch {
      setManualRowOrderNmIds([])
    }
  }, [selectedCabinetId])

  useEffect(() => {
    if (articles.length === 0) return
    const ids = new Set(articles.map((a) => a.nmId))
    setManualRowOrderNmIds((prev) => {
      const next = prev.filter((id) => ids.has(id))
      if (next.length === prev.length) return prev
      persistProductsRowOrder(selectedCabinetId, next)
      return next
    })
  }, [articles, selectedCabinetId])

  const sortedArticles = useMemo(
    () => sortArticlesByManualOrder(articles, manualRowOrderNmIds),
    [articles, manualRowOrderNmIds]
  )

  const handleReorderRows = useCallback(
    (fromIndex: number, toIndex: number) => {
      setManualRowOrderNmIds((prev) => {
        const list = sortArticlesByManualOrder(articles, prev)
        const next = moveArrayItem(list, fromIndex, toIndex).map((a) => a.nmId)
        persistProductsRowOrder(selectedCabinetId, next)
        return next
      })
    },
    [articles, selectedCabinetId]
  )

  const cabinetSelectProps =
    !isManagerOrAdmin && cabinets.length > 0
      ? {
          cabinets: cabinets.map((c) => ({ id: c.id, name: c.name })),
          selectedCabinetId,
          onCabinetChange: setSelectedCabinetId,
          loading: cabinetsLoadingState,
        }
      : undefined

  // Восстановление выбранных артикулов из localStorage при смене кабинета
  useEffect(() => {
    const stored = getStoredSelectedNmIds(selectedCabinetId)
    setSelectedNmIds(stored)
    setAllDeselected(false)
    if (stored.length > 0) skipNextWriteRef.current = true
  }, [selectedCabinetId])

  useEffect(() => {
    if (selectedNmIds.length === 0 && skipNextWriteRef.current) {
      skipNextWriteRef.current = false
      return
    }
    setStoredSelectedNmIds(selectedCabinetId, selectedNmIds)
  }, [selectedCabinetId, selectedNmIds])

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const autoLoadCountRef = useRef(0)
  const MAX_AUTO_LOAD = 2

  const scrollHandler = useCallback(
    (fromUserScroll: boolean) => {
      const el = containerRef.current
      const distToBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight : null
      const nearBottom = el != null && distToBottom != null && distToBottom < 300
      if (!el) return
      if (!nearBottom || !hasNextPage || isFetchingNextPage) return
      if (!fromUserScroll && autoLoadCountRef.current >= MAX_AUTO_LOAD) return
      if (!fromUserScroll) autoLoadCountRef.current += 1
      loadMore()
    },
    [loadMore, hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    if (articles.length === PAGE_SIZE) autoLoadCountRef.current = 0
    if (!hasNextPage || isFetchingNextPage) return
    const id = requestAnimationFrame(() => scrollHandler(false))
    return () => cancelAnimationFrame(id)
  }, [articles.length, hasNextPage, isFetchingNextPage, scrollHandler])

  const toggleFilterNmId = useCallback((nmId: number, checked: boolean) => {
    setAllDeselected(false)
    setSelectedNmIds((prev) => {
      if (checked) return [...prev, nmId]
      if (prev.length === 0) {
        const list = filterListArticlesRef.current.map((a) => a.nmId)
        return list.filter((id) => id !== nmId)
      }
      return prev.filter((id) => id !== nmId)
    })
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
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header
          workContextCabinetSelect={isManagerOrAdmin ? workContext.workContextCabinetSelectProps : undefined}
          cabinetSelectProps={cabinetSelectProps}
        />
        <Breadcrumbs />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: `${spacing.lg}px 0`,
            width: '100%',
            backgroundColor: colors.bgGray,
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              backgroundColor: colors.bgWhite,
              borderTop: `1px solid ${colors.borderLight}`,
              borderBottom: `1px solid ${colors.borderLight}`,
              padding: spacing.lg,
              boxShadow: shadows.md,
              transition: transitions.normal,
            }}
          >
          <div style={{ width: '100%', minWidth: 0 }}>
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
              placeholder="Поиск по артикулу или названию"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <Popover
              content={
                (() => {
                  const q = filterSearch.trim().toLowerCase()
                  const filterListFiltered = q
                    ? filterListArticles.filter(
                        (a) =>
                          String(a.nmId).includes(filterSearch.trim()) ||
                          a.vendorCode?.toLowerCase().includes(q) ||
                          a.title?.toLowerCase().includes(q)
                      )
                    : filterListArticles
                  const selectedNotInList = selectedNmIds.filter(
                    (id) => !filterListArticles.some((a) => a.nmId === id)
                  )
                  return (
                    <div style={{ width: 400, maxHeight: 400, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Input
                        placeholder="Поиск по арт. продавца или WB"
                        prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        style={{ marginBottom: 12 }}
                        allowClear
                      />
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexShrink: 0 }}>
                        <Button
                          size="small"
                          onClick={() => {
                            setAllDeselected(false)
                            setSelectedNmIds([])
                          }}
                        >
                          Выбрать все
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedNmIds([])
                            setAllDeselected(true)
                          }}
                        >
                          Снять все
                        </Button>
                      </div>
                      {selectedNotInList.length > 0 && (
                        <div style={{ marginBottom: 8, flexShrink: 0 }}>
                          <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Выбраны (вне списка):</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {selectedNotInList.map((nmId) => (
                              <span
                                key={nmId}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '2px 8px',
                                  borderRadius: borderRadius.sm,
                                  backgroundColor: '#E0F2FE',
                                  color: '#0369A1',
                                  fontSize: 12,
                                }}
                              >
                                {nmId}
                                <button
                                  type="button"
                                  onClick={() => toggleFilterNmId(nmId, false)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: 'inherit',
                                    display: 'flex',
                                  }}
                                  aria-label="Снять выбор"
                                >
                                  <CloseOutlined style={{ fontSize: 10 }} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
                        {filterListFiltered.map((a) => (
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
                              checked={!allDeselected && (selectedNmIds.length === 0 || selectedNmIds.includes(a.nmId))}
                              onChange={(e) => toggleFilterNmId(a.nmId, e.target.checked)}
                              style={{ marginRight: 12 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: colors.textPrimary }}>
                                {a.nmId}
                              </div>
                              <div style={{ fontSize: 12, color: colors.textSecondary }} title={a.title ?? undefined}>
                                {a.title || '—'}
                              </div>
                              <div style={{ fontSize: 12, color: colors.textSecondary }}>
                                Артикул продавца: {a.vendorCode || '—'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()
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
                {filterListTotal > 0 && (
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
                    {allDeselected ? 0 : selectedNmIds.length > 0 ? selectedNmIds.length : filterListTotal}/{filterListTotal}
                  </span>
                )}
              </Button>
            </Popover>
            <Checkbox
              checked={onlyWithPhoto}
              onChange={(e) => setOnlyWithPhoto(e.target.checked)}
            >
              Только с фото
            </Checkbox>
            </div>
          </div>

          {/* Выбранные артикулы ВБ под фильтром — на всю ширину; по клику «ещё» раскрывается весь список */}
          {selectedNmIds.length > 0 && (
            <div
              style={{
                width: '100%',
                minWidth: '100%',
                maxWidth: '100%',
                marginBottom: spacing.sm,
                boxSizing: 'border-box',
                alignSelf: 'stretch',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexWrap: tagsExpanded ? 'wrap' : 'nowrap',
                  overflow: tagsExpanded ? 'visible' : 'hidden',
                  minWidth: 0,
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {(tagsExpanded ? [...selectedNmIds].sort((a, b) => a - b) : [...selectedNmIds].sort((a, b) => a - b).slice(0, 8)).map((nmId) => (
                  <span
                    key={nmId}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: borderRadius.sm,
                      backgroundColor: '#E0F2FE',
                      color: '#0369A1',
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {nmId}
                    <button
                      type="button"
                      onClick={() => toggleFilterNmId(nmId, false)}
                      style={{
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'inherit',
                        display: 'flex',
                        lineHeight: 1,
                      }}
                      aria-label="Снять выбор"
                    >
                      <CloseOutlined style={{ fontSize: 10 }} />
                    </button>
                  </span>
                ))}
                {!tagsExpanded && selectedNmIds.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setTagsExpanded(true)}
                    style={{
                      flexShrink: 0,
                      fontSize: 12,
                      color: colors.primary,
                      background: 'none',
                      border: 'none',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    … ещё {selectedNmIds.length - 8}
                  </button>
                )}
                {tagsExpanded && selectedNmIds.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setTagsExpanded(false)}
                    style={{
                      flexShrink: 0,
                      fontSize: 12,
                      color: colors.textSecondary,
                      background: 'none',
                      border: 'none',
                      padding: '4px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    Свернуть
                  </button>
                )}
              </div>
            </div>
          )}
          </div>

          {summaryLoading ? (
            <div style={{ textAlign: 'center', padding: spacing.xxl }}>
              <Spin />
            </div>
          ) : articles.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: spacing.xxl,
                ...typography.body,
                color: colors.textSecondary,
              }}
            >
              {emptyStateMessage}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                width: '100%',
              }}
            >
              <ProductsTable
                visibleArticles={sortedArticles}
                last7Dates={last7Dates}
                last7DaysPeriod={last7DaysPeriod}
                selectedCabinetId={selectedCabinetId}
                selectedSellerId={selectedSellerId}
                containerRef={containerRef}
                onScroll={() => scrollHandler(true)}
                onReorderRows={handleReorderRows}
              />
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  )
}

const thBase = { borderBottom: `2px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary, padding: '8px 10px' as const }

/** Правая граница ячейки (col 0 — ручка перетаскивания, 1 — фото … 5 — размеры, 6.. — дни) */
function getCellBorderRight(colIndex: number, dateColsCount: number): string {
  const sizesColIndex = 5
  const lastDateIndex = 6 + dateColsCount - 1
  if (colIndex === sizesColIndex || colIndex === lastDateIndex) return `2px solid ${colors.border}`
  return `1px solid ${colors.border}`
}

/** Ширины колонок (px) для выравнивания шапки и тела таблицы */
const COL_WIDTHS = {
  drag: 32,
  photo: PRODUCT_PHOTO_WIDTH, /* колонка по ширине фото */
  name: 200, /* название и детали */
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
  containerRef: RefObject<HTMLDivElement>
  onScroll: () => void
  onReorderRows: (fromIndex: number, toIndex: number) => void
}

function ProductsTable({
  visibleArticles,
  last7Dates,
  last7DaysPeriod,
  selectedCabinetId,
  selectedSellerId,
  containerRef,
  onScroll,
  onReorderRows,
}: ProductsTableProps) {
  const [scrollbarWidth, setScrollbarWidth] = useState(0)
  const dragFromIndexRef = useRef<number | null>(null)
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null)
  const onScrollRef = useRef(onScroll)
  onScrollRef.current = onScroll

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = () => {
      onScrollRef.current?.()
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [containerRef])

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

  const handleRowDragStart = useCallback((rowIndex: number, e: React.DragEvent) => {
    e.stopPropagation()
    dragFromIndexRef.current = rowIndex
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(rowIndex))
  }, [])

  const handleRowDragEnd = useCallback(() => {
    dragFromIndexRef.current = null
    setDragOverRowIndex(null)
  }, [])

  const handleRowDragOver = useCallback((rowIndex: number, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverRowIndex(rowIndex)
  }, [])

  const handleRowDrop = useCallback(
    (rowIndex: number, e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const from = dragFromIndexRef.current
      dragFromIndexRef.current = null
      setDragOverRowIndex(null)
      if (from == null || from === rowIndex) return
      onReorderRows(from, rowIndex)
    },
    [onReorderRows]
  )

  const handleRowDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null
    if (related && (e.currentTarget as HTMLElement).contains(related)) return
    setDragOverRowIndex(null)
  }, [])

  return (
    <div
      className="products-table-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        maxHeight: 'calc(100vh - 220px)',
        width: '100%',
        overflow: 'hidden',
        overflowX: 'auto',
      }}
    >
      <style>{`
        .products-table-wrapper table.products-table colgroup col:nth-child(1),
        .products-table-wrapper table.products-table thead th:nth-child(1),
        .products-table-wrapper table.products-table tbody td:nth-child(1) {
          width: ${COL_WIDTHS.drag}px !important;
          min-width: ${COL_WIDTHS.drag}px !important;
          max-width: ${COL_WIDTHS.drag}px !important;
          box-sizing: border-box !important;
        }
        .products-table-wrapper table.products-table colgroup col:nth-child(2),
        .products-table-wrapper table.products-table thead th:nth-child(2),
        .products-table-wrapper table.products-table tbody td:nth-child(2) {
          width: ${PRODUCT_PHOTO_WIDTH}px !important;
          min-width: ${PRODUCT_PHOTO_WIDTH}px !important;
          max-width: ${PRODUCT_PHOTO_WIDTH}px !important;
          box-sizing: border-box !important;
        }
        .products-table-wrapper table.products-table colgroup col:nth-child(3),
        .products-table-wrapper table.products-table thead th:nth-child(3),
        .products-table-wrapper table.products-table tbody td:nth-child(3) {
          width: ${COL_WIDTHS.name}px !important;
          min-width: ${COL_WIDTHS.name}px !important;
          max-width: ${COL_WIDTHS.name}px !important;
          box-sizing: border-box !important;
        }
      `}</style>
      {/* Шапка таблицы — отступ справа под ширину скроллбара тела (измеряется под текущую ОС/браузер) */}
      <div style={{ flexShrink: 0, borderBottom: `2px solid ${colors.border}`, paddingRight: scrollbarWidth }}>
        <table className="products-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 1032 }}>
          <colgroup>
            <col style={{ width: COL_WIDTHS.drag }} />
            <col style={{ width: COL_WIDTHS.photo }} />
            <col style={{ width: COL_WIDTHS.name }} />
            <col />
            <col />
            <col />
            {last7Dates.map((d) => (
              <col key={d} />
            ))}
            <col />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: colors.bgGray }}>
              <th
                title="Перетащите строку за ручку слева"
                style={{ ...thBase, textAlign: 'center', borderRight: getCellBorderRight(0, last7Dates.length), padding: '8px 2px', width: COL_WIDTHS.drag, maxWidth: COL_WIDTHS.drag, boxSizing: 'border-box' }}
              >
                <HolderOutlined style={{ color: colors.textMuted, fontSize: 14 }} />
              </th>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRight(1, last7Dates.length), padding: '8px 4px', width: COL_WIDTHS.photo, maxWidth: COL_WIDTHS.photo, boxSizing: 'border-box' }}>Фото</th>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRight(2, last7Dates.length), width: COL_WIDTHS.name, maxWidth: COL_WIDTHS.name, boxSizing: 'border-box' }}>Название и детали</th>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRight(3, last7Dates.length) }}>Рейтинг</th>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRight(4, last7Dates.length) }}>Остаток</th>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRight(5, last7Dates.length) }}>Размеры</th>
              {last7Dates.map((d, i) => (
                <th
                  key={d}
                  style={{
                    ...thBase,
                    textAlign: 'center',
                    padding: '8px 6px',
                    verticalAlign: 'bottom',
                    borderRight: getCellBorderRight(6 + i, last7Dates.length),
                  }}
                >
                  <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(-180deg)', display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {dayjs(d).format('DD.MM')}
                  </span>
                </th>
              ))}
              <th style={{ ...thBase, textAlign: 'center', color: colors.primary, borderRight: getCellBorderRight(6 + last7Dates.length, last7Dates.length) }}>Динамика</th>
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
        <table className="products-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 1032 }}>
          <colgroup>
            <col style={{ width: COL_WIDTHS.drag }} />
            <col style={{ width: COL_WIDTHS.photo }} />
            <col style={{ width: COL_WIDTHS.name }} />
            <col />
            <col />
            <col />
            {last7Dates.map((d) => (
              <col key={d} />
            ))}
            <col />
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
                onDragHandleStart={handleRowDragStart}
                onDragHandleEnd={handleRowDragEnd}
                onRowDragOver={handleRowDragOver}
                onRowDrop={handleRowDrop}
                onRowDragLeave={handleRowDragLeave}
                isDragOver={dragOverRowIndex === idx}
              />
            ))}
          </tbody>
        </table>
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
  onDragHandleStart: (rowIndex: number, e: React.DragEvent) => void
  onDragHandleEnd: () => void
  onRowDragOver: (rowIndex: number, e: React.DragEvent) => void
  onRowDrop: (rowIndex: number, e: React.DragEvent) => void
  onRowDragLeave: (e: React.DragEvent) => void
  isDragOver: boolean
}

function ProductRow({
  article,
  last7Dates,
  last7DaysPeriod,
  selectedCabinetId,
  selectedSellerId,
  rowIndex,
  onDragHandleStart,
  onDragHandleEnd,
  onRowDragOver,
  onRowDrop,
  onRowDragLeave,
  isDragOver,
}: ProductRowProps) {
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
  const promotionTooltip = useMemo(() => {
    const names = articleDetail?.wbPromotionNames?.filter(Boolean) ?? []
    const types = articleDetail?.wbPromotionTypes ?? []
    if (!names.length) return ''
    return names.map((n, i) => (types[i] ? `${n} (${types[i]})` : n)).join('\n')
  }, [articleDetail?.wbPromotionNames, articleDetail?.wbPromotionTypes])
  const rating = articleDetail?.article?.rating ?? article?.rating ?? null
  const reviewsCount = articleDetail?.article?.reviewsCount ?? article?.reviewsCount ?? null
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
      onDragOver={(e) => onRowDragOver(rowIndex, e)}
      onDrop={(e) => onRowDrop(rowIndex, e)}
      onDragLeave={(e) => onRowDragLeave(e)}
      style={{
        backgroundColor: rowIndex % 2 === 0 ? colors.bgWhite : colors.bgGrayLight,
        transition: transitions.fast,
        cursor: 'pointer',
        boxShadow: isDragOver ? `inset 0 0 0 2px ${colors.primary}` : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.bgGray
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? colors.bgWhite : colors.bgGrayLight
      }}
    >
      <td
        draggable
        onDragStart={(e) => onDragHandleStart(rowIndex, e)}
        onDragEnd={onDragHandleEnd}
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '4px 2px',
          borderBottom: `1px solid ${colors.border}`,
          borderRight: getCellBorderRight(0, last7Dates.length),
          verticalAlign: 'middle',
          textAlign: 'center',
          width: COL_WIDTHS.drag,
          maxWidth: COL_WIDTHS.drag,
          boxSizing: 'border-box',
          cursor: 'grab',
          userSelect: 'none',
        }}
        title="Перетащите строку"
      >
        <HolderOutlined style={{ color: colors.textMuted, fontSize: 16, pointerEvents: 'none' }} />
      </td>
      <td
        style={{
          padding: '6px 0',
          borderBottom: `1px solid ${colors.border}`,
          borderRight: getCellBorderRight(1, last7Dates.length),
          verticalAlign: 'top',
          width: COL_WIDTHS.photo,
          maxWidth: COL_WIDTHS.photo,
          boxSizing: 'border-box',
          position: 'relative',
          minHeight: PRODUCT_PHOTO_HEIGHT + 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 0,
            width: PRODUCT_PHOTO_WIDTH,
            height: PRODUCT_PHOTO_HEIGHT,
            maxWidth: PRODUCT_PHOTO_WIDTH,
            maxHeight: PRODUCT_PHOTO_HEIGHT,
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
            style={{ display: 'block', width: '100%', height: '100%', overflow: 'hidden' }}
          >
            {article.photoTm ? (
              <img
                src={article.photoTm}
                alt=""
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  maxWidth: PRODUCT_PHOTO_WIDTH,
                  maxHeight: PRODUCT_PHOTO_HEIGHT,
                  objectFit: 'cover',
                  objectPosition: 'center',
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
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRight(2, last7Dates.length), width: COL_WIDTHS.name, maxWidth: COL_WIDTHS.name, boxSizing: 'border-box', ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top' }}>
        <Link
          to={articlePath}
          onClick={stopProp}
          className="products-table-link"
          style={{ fontWeight: 700, fontSize: 13, color: colors.textPrimary, marginBottom: 4, display: 'inline-block' }}
        >
          {article.title || '-'}
        </Link>
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
        {inPromotion && (
          <span
            title={promotionTooltip || undefined}
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: borderRadius.sm,
              fontSize: 11,
              fontWeight: 500,
              backgroundColor: colors.successLight,
              color: colors.success,
              cursor: promotionTooltip ? 'help' : undefined,
            }}
          >
            В акции
          </span>
        )}
      </td>
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRight(3, last7Dates.length), ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top' }}>
        {isLoading && rating == null && reviewsCount == null ? (
          <Spin size="small" />
        ) : (
          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <StarFilled style={{ color: '#FBBF24', fontSize: 12 }} />
              <span>{rating != null ? Number(rating).toFixed(1) : '-'}</span>
            </span>
            {reviewsCount != null && reviewsCount > 0 && (
              <span style={{ color: colors.textSecondary, fontSize: '0.85em' }}>
                {reviewsCount} {reviewsCount % 10 === 1 && reviewsCount % 100 !== 11 ? 'отзыв' : reviewsCount % 10 >= 2 && reviewsCount % 10 <= 4 && (reviewsCount % 100 < 10 || reviewsCount % 100 >= 20) ? 'отзыва' : 'отзывов'}
              </span>
            )}
          </span>
        )}
      </td>
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRight(4, last7Dates.length), ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top' }}>
        {isLoading ? '-' : stocksTotal.toLocaleString('ru-RU')}
      </td>
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRight(5, last7Dates.length), ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top' }}>
        {!firstStockWarehouse ? '-' : sizesLabel}
      </td>
      {last7Dates.map((d, i) => (
        <td
          key={d}
          style={{
            textAlign: 'center',
            padding: '6px',
            borderBottom: `1px solid ${colors.border}`,
            borderRight: getCellBorderRight(6 + i, last7Dates.length),
            ...typography.body,
            ...FONT_PAGE_SMALL,
            verticalAlign: 'top',
          }}
        >
          {isLoading ? '-' : (dailyByDate.get(d) ?? 0).toLocaleString('ru-RU')}
        </td>
      ))}
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRight(6 + last7Dates.length, last7Dates.length), verticalAlign: 'top' }}>
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
