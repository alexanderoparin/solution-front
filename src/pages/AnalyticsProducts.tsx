import { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Spin, Input, Button, Popover, Checkbox, message, Tooltip } from 'antd'
import { SearchOutlined, FilterOutlined, CloseOutlined, StarFilled, HolderOutlined, CaretUpOutlined, CaretDownOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { useQuery, useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi } from '../api/cabinets'
import type { ArticleSummary, Period } from '../types/analytics'
import type { CabinetTokenType } from '../types/api'
import { colors, typography, spacing, borderRadius, transitions, shadows, PRODUCT_PHOTO_WIDTH, PRODUCT_PHOTO_HEIGHT } from '../styles/analytics'
import { ONBOARDING_TARGETS } from '../onboarding/targets'
import {
  analyticsSharedKeys,
  readSharedFilterToNone,
  readSharedOnlyPriority,
  readSharedOnlyInAdvertising,
  readSharedOnlyWithPhoto,
  readSharedProductsSort,
  readSharedSearch,
  writeSharedFilterToNone,
  writeSharedOnlyPriority,
  writeSharedOnlyInAdvertising,
  writeSharedOnlyWithPhoto,
  writeSharedProductsSort,
  writeSharedSearch,
  type ProductsSortField,
} from '../utils/analyticsSharedFilterStorage'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useWorkContextForAdmin } from '../hooks/useWorkContextForAdmin'
import { useStoredCabinet } from '../hooks/useStoredCabinet'
import { hasMeaningfulArticleRating, formatArticleRating, formatOzonContentRating, ozonContentRatingTooltip } from '../utils/articleRating'

dayjs.locale('ru')

const FONT_PAGE_SMALL = { fontSize: '11px' as const }
const PAGE_SIZE = 10
/** Размер одной загрузки списка артикулов для выбора в фильтре; достаточно большой, чтобы при снятии одной галочки с «все» получать «все кроме одного». */
const FILTER_LIST_PAGE_SIZE = 500

const WB_CATALOG_URL = (nmId: number) => `https://www.wildberries.ru/catalog/${nmId}/detail.aspx`
const OZON_CATALOG_URL = (productId: number) => `https://www.ozon.ru/product/${productId}/`

/** Item-rating WB доступен только для персонального/сервисного токена, не для базового. */
function cabinetSupportsItemRating(tokenType?: CabinetTokenType | null): boolean {
  return (tokenType ?? 'BASIC') !== 'BASIC'
}

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
    const sharedRaw = localStorage.getItem(analyticsSharedKeys.selectedNmIds(cabinetId))
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
  const key = analyticsSharedKeys.selectedNmIds(cabinetId)
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

function useIsNarrow(maxWidthPx = 900): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${maxWidthPx}px)`).matches : false,
  )
  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${maxWidthPx}px)`)
    const onChange = () => setNarrow(mediaQuery.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [maxWidthPx])
  return narrow
}

export default function AnalyticsProducts() {
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const isAdmin = role === 'ADMIN'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNmIds, setSelectedNmIds] = useState<number[]>(() => [])
  const [allDeselected, setAllDeselected] = useState(false)
  const [filterSearch, setFilterSearch] = useState('')
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(true)
  const [onlyPriority, setOnlyPriority] = useState(false)
  const [onlyInAdvertising, setOnlyInAdvertising] = useState(false)
  const [bulkPriorityLoading, setBulkPriorityLoading] = useState(false)
  const [sortField, setSortField] = useState<ProductsSortField>('wbCreatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const containerRef = useRef<HTMLDivElement>(null)
  const filterListArticlesRef = useRef<ArticleSummary[]>([])
  const funnelBulkImportInputRef = useRef<HTMLInputElement | null>(null)
  /** Пропустить одну запись в storage, если только что восстановили выбор из общего ключа (чтобы не перезаписать 155 на []) */
  const skipNextWriteRef = useRef(false)

  const workContext = useWorkContextForAdmin(isAdmin)

  const selectedSellerId = isAdmin ? workContext.selectedSellerId : undefined

  const { data: myCabinets = [], isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: !isAdmin,
  })

  const cabinets = useMemo(() => {
    if (isAdmin) {
      return workContext.workContextOptions.map((o) => ({ id: o.cabinetId, name: o.cabinetName, marketplaceType: o.marketplaceType }))
    }
    return myCabinets
  }, [isAdmin, workContext.workContextOptions, myCabinets])

  const cabinetsLoadingState = isAdmin ? workContext.workContextLoading : cabinetsLoading

  const { cabinetId: sellerCabinetId, setCabinetId: setSellerCabinetId } = useStoredCabinet(myCabinets)

  const selectedCabinetId = isAdmin ? workContext.selectedCabinetId : sellerCabinetId

  const isOzonCabinet = useMemo(() => {
    if (selectedCabinetId == null) return false
    if (isAdmin) {
      return workContext.workContextOptions.find((o) => o.cabinetId === selectedCabinetId)?.marketplaceType === 'OZON'
    }
    return myCabinets.find((c) => c.id === selectedCabinetId)?.marketplaceType === 'OZON'
  }, [selectedCabinetId, isAdmin, workContext.workContextOptions, myCabinets])

  useEffect(() => {
    if (isOzonCabinet && onlyPriority) {
      setOnlyPriority(false)
    }
  }, [isOzonCabinet, onlyPriority])

  const setSelectedCabinetId = useCallback(
    (id: number | null) => {
      if (isAdmin) {
        if (id != null) workContext.applyWorkContextCabinet(id)
      } else {
        setSellerCabinetId(id)
      }
    },
    [isAdmin, workContext.applyWorkContextCabinet, setSellerCabinetId],
  )

  const last7DaysPeriod = useMemo(() => getLast7DaysPeriod(), [])

  const funnelBulkImportMutation = useMutation({
    mutationFn: (file: File) =>
      analyticsApi.importCabinetSalesFunnelExcel(
        file,
        selectedSellerId ?? undefined,
        selectedCabinetId ?? undefined,
      ),
    onSuccess: (result) => {
      const period =
        result.periodFrom && result.periodTo
          ? ` (${result.periodFrom} — ${result.periodTo})`
          : ''
      const skippedUnknown =
        result.rowsSkippedUnknownNmId > 0
          ? `, пропущено чужих артикулов: ${result.rowsSkippedUnknownNmId}`
          : ''
      message.success(
        `Воронка импортирована${period}: ${result.rowsImported} строк, создано ${result.rowsCreated}, обновлено ${result.rowsUpdated}${skippedUnknown}`,
      )
      void queryClient.invalidateQueries({ queryKey: ['analytics-products-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['analytics-products-filter-list'] })
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      message.error(msg ?? 'Не удалось импортировать воронку из Excel')
    },
  })

  const searchTrimmed = searchQuery.trim()
  const effectiveOnlyPriority = isOzonCabinet ? false : onlyPriority
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
      effectiveOnlyPriority,
      onlyInAdvertising,
      sortField,
      sortOrder,
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
        onlyPriority: effectiveOnlyPriority || undefined,
        onlyInAdvertising: onlyInAdvertising || undefined,
        sortBy: sortField,
        sortDir: sortOrder,
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
      effectiveOnlyPriority,
      onlyInAdvertising,
      sortField,
      sortOrder,
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
        onlyPriority: effectiveOnlyPriority || undefined,
        onlyInAdvertising: onlyInAdvertising || undefined,
        sortBy: sortField,
        sortDir: sortOrder,
      }),
    enabled: selectedCabinetId != null,
  })

  const filterListArticles = useMemo(
    () => filterListData?.articles ?? [],
    [filterListData]
  )
  const filterListNmIdSet = useMemo(() => new Set(filterListArticles.map((a) => a.nmId)), [filterListArticles])
  /** Общее число артикулов (как в Сводной), из API; для списка в фильтре может быть загружено меньше из-за лимита */
  const filterListTotal = filterListData?.totalArticles ?? filterListArticles.length
  filterListArticlesRef.current = filterListArticles

  /** Сколько из явного списка nmId реально есть в текущем каталоге (после «только приоритетные» и т.д.) — для бейджа «выбрано/всего» */
  const filterBadgeSelectedCount = useMemo(() => {
    if (allDeselected) return 0
    if (selectedNmIds.length === 0) return filterListTotal
    return selectedNmIds.filter((id) => filterListNmIdSet.has(id)).length
  }, [allDeselected, selectedNmIds, filterListTotal, filterListNmIdSet])

  /** Теги под фильтром: при полной загрузке каталога показываем только nmId из текущего списка (как в бейдже) */
  const catalogFullyLoaded =
    filterListTotal > 0 && filterListArticles.length >= filterListTotal

  const selectedNmIdsForTags = useMemo(() => {
    if (selectedNmIds.length === 0) return []
    const sorted = [...selectedNmIds].sort((a, b) => a - b)
    if (!catalogFullyLoaded) return sorted
    return sorted.filter((id) => filterListNmIdSet.has(id))
  }, [selectedNmIds, catalogFullyLoaded, filterListNmIdSet])

  /** Убираем из явного выбора артикулы, не попадающие в текущий каталог (после смены фильтров). */
  useEffect(() => {
    if (allDeselected || selectedNmIds.length === 0 || !catalogFullyLoaded) return
    const pruned = selectedNmIds.filter((id) => filterListNmIdSet.has(id))
    if (pruned.length === selectedNmIds.length) return
    setSelectedNmIds(pruned)
  }, [allDeselected, selectedNmIds, catalogFullyLoaded, filterListNmIdSet])

  const summaryErrorMessage =
    summaryError && (summaryErr as any)?.response?.data?.error ||
    summaryError && (summaryErr as any)?.response?.data?.message ||
    null

  const emptyStateMessage =
    isAdmin && !workContext.workContextLoading && workContext.workContextOptions.length === 0
      ? 'Нет кабинетов с API-ключом'
      : summaryErrorMessage ?? (isOzonCabinet
          ? 'Нет товаров. Запустите «Обновить данные» в профиле кабинета.'
          : 'Нет товаров за последние 7 дней')

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

  const handleSort = useCallback((field: ProductsSortField) => {
    if (sortField === field) {
      setSortOrder((order) => {
        const next = order === 'asc' ? 'desc' : 'asc'
        if (selectedCabinetId != null) {
          writeSharedProductsSort(selectedCabinetId, { field, order: next })
        }
        return next
      })
    } else {
      setSortField(field)
      setSortOrder('desc')
      if (selectedCabinetId != null) {
        writeSharedProductsSort(selectedCabinetId, { field, order: 'desc' })
      }
    }
  }, [sortField, selectedCabinetId])

  const cabinetSelectProps =
    !isAdmin && cabinets.length > 0
      ? {
          cabinets: cabinets.map((c) => ({ id: c.id, name: c.name, marketplaceType: c.marketplaceType })),
          selectedCabinetId,
          onCabinetChange: setSelectedCabinetId,
          loading: cabinetsLoadingState,
        }
      : undefined

  // Восстановление фильтров и выбранных артикулов при смене кабинета (общие с «Сводной»).
  // useLayoutEffect: до эффектов записи в storage, иначе пустые дефолты перезапишут сохранённые значения.
  useLayoutEffect(() => {
    if (selectedCabinetId == null) return
    setSearchQuery(readSharedSearch(selectedCabinetId))
    setOnlyWithPhoto(readSharedOnlyWithPhoto(selectedCabinetId))
    setOnlyPriority(readSharedOnlyPriority(selectedCabinetId))
    setOnlyInAdvertising(readSharedOnlyInAdvertising(selectedCabinetId))
    const storedSort = readSharedProductsSort(selectedCabinetId)
    setSortField(storedSort.field)
    setSortOrder(storedSort.order)
    const ftn = readSharedFilterToNone(selectedCabinetId)
    setAllDeselected(ftn)
    const stored = getStoredSelectedNmIds(selectedCabinetId)
    setSelectedNmIds(ftn ? [] : stored)
    skipNextWriteRef.current = !ftn && stored.length > 0
  }, [selectedCabinetId])

  useEffect(() => {
    if (selectedCabinetId == null) return
    writeSharedSearch(selectedCabinetId, searchQuery)
  }, [selectedCabinetId, searchQuery])

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

  useEffect(() => {
    writeSharedFilterToNone(selectedCabinetId, allDeselected)
    if (selectedNmIds.length === 0 && skipNextWriteRef.current) {
      skipNextWriteRef.current = false
      return
    }
    if (allDeselected && selectedCabinetId != null) {
      try {
        localStorage.setItem(analyticsSharedKeys.selectedNmIds(selectedCabinetId), JSON.stringify([]))
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${selectedCabinetId}`, JSON.stringify([]))
      } catch {
        /* ignore */
      }
      return
    }
    setStoredSelectedNmIds(selectedCabinetId, selectedNmIds)
  }, [selectedCabinetId, selectedNmIds, allDeselected])

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

  const setPriorityForArticles = useCallback(
    async (articlesForUpdate: ArticleSummary[], priority: boolean) => {
      if (selectedCabinetId == null) return
      const nmIds = Array.from(new Set(articlesForUpdate.map((a) => a.nmId).filter((v) => v != null)))
      if (nmIds.length === 0) return
      try {
        setBulkPriorityLoading(true)
        await Promise.all(
          nmIds.map((nmId) =>
            analyticsApi.updateArticlePriority(
              nmId,
              priority,
              selectedSellerId,
              selectedCabinetId
            )
          )
        )
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['analytics-products-summary'] }),
          queryClient.invalidateQueries({ queryKey: ['analytics-products-filter-list'] }),
        ])
        message.success(priority ? 'Приоритет проставлен для выбранных артикулов' : 'Приоритет снят для выбранных артикулов')
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined
        message.error(msg ?? 'Не удалось массово обновить приоритет')
      } finally {
        setBulkPriorityLoading(false)
      }
    },
    [queryClient, selectedCabinetId, selectedSellerId]
  )

  const getSelectedArticlesForBulk = useCallback(
    (candidates: ArticleSummary[]): ArticleSummary[] => {
      if (allDeselected) return []
      if (selectedNmIds.length === 0) return candidates
      const selectedSet = new Set(selectedNmIds)
      return candidates.filter((a) => selectedSet.has(a.nmId))
    },
    [allDeselected, selectedNmIds]
  )

  const last7Dates = useMemo(() => {
    const end = dayjs().subtract(1, 'day')
    const dates: string[] = []
    for (let i = 6; i >= 0; i--) dates.push(end.subtract(i, 'day').format('YYYY-MM-DD'))
    return dates
  }, [])

  const showRatingColumn = useMemo(() => {
    if (isOzonCabinet) return true
    if (selectedCabinetId == null) return false
    if (isAdmin) {
      const row = workContext.workContextOptions.find((o) => o.cabinetId === selectedCabinetId)
      return cabinetSupportsItemRating(row?.tokenType)
    }
    const cab = myCabinets.find((c) => c.id === selectedCabinetId)
    return cabinetSupportsItemRating(cab?.apiKey?.tokenType)
  }, [isOzonCabinet, selectedCabinetId, isAdmin, workContext.workContextOptions, myCabinets])

  return (
    <>
      <style>{`
        .products-table-link { color: ${colors.primary}; text-decoration: none; transition: color 0.2s ease, opacity 0.2s ease, text-decoration 0.2s ease; }
        .products-table-link:hover { color: ${colors.primaryHover}; text-decoration: underline; }
        .products-table-link--img { display: block; opacity: 1; }
        .products-table-link--img:hover { opacity: 0.85; }
        .products-filter-label-short { display: none; }
        .products-card {
          display: flex;
          gap: 12px;
          padding: 12px;
          border: 1px solid ${colors.border};
          border-radius: 12px;
          background: ${colors.bgWhite};
          cursor: pointer;
        }
        .products-card-photo {
          flex-shrink: 0;
          width: 56px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background: ${colors.bgGray};
        }
        .products-card-photo img,
        .products-card-photo-empty {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .products-card-body { min-width: 0; flex: 1; }
        .products-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .products-card-title {
          font-weight: 700;
          font-size: 13px;
          line-height: 1.35;
          color: ${colors.textPrimary} !important;
        }
        .products-card-meta {
          font-size: 12px;
          line-height: 1.4;
          color: ${colors.textSecondary};
          margin-top: 2px;
        }
        .products-card-promo {
          display: inline-block;
          margin-left: 8px;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          background: ${colors.successLight};
          color: ${colors.success};
        }
        .products-card-stats {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: 8px;
          font-size: 12px;
          color: ${colors.textPrimary};
        }
        .products-card-stats-left {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 12px;
          min-width: 0;
        }
        .products-card-chart-wrap {
          margin-left: auto;
          flex-shrink: 0;
        }
        .products-card-chart {
          display: inline-flex;
          align-items: flex-end;
          padding: 4px 2px 0;
          border: none;
          background: transparent;
          cursor: pointer;
        }
        .products-card-orders-popup {
          min-width: 160px;
        }
        .products-card-orders-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          font-size: 13px;
          line-height: 1.5;
          text-transform: capitalize;
        }
        .products-card-orders-total {
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid ${colors.borderLight};
          font-weight: 600;
          text-transform: none;
        }
        .analytics-products-import {
          margin-left: auto;
          flex-shrink: 0;
        }
        @media (max-width: 900px) {
          .analytics-products-shell {
            padding: 12px 0 !important;
          }
          .analytics-products-panel {
            padding: 12px !important;
            box-shadow: none !important;
          }
          .analytics-products-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .analytics-products-search {
            max-width: none !important;
            width: 100%;
          }
          .analytics-products-filters {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px 12px;
            width: 100%;
          }
          .analytics-products-checks {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 12px;
            width: 100%;
            order: 3;
          }
          .analytics-products-checks .ant-checkbox-wrapper {
            font-size: 13px;
            white-space: nowrap;
            margin-inline-end: 0 !important;
          }
          .products-filter-label-full { display: none; }
          .products-filter-label-short { display: inline; }
          .analytics-products-import {
            display: none !important;
          }
          .products-filter-panel {
            width: min(400px, calc(100vw - 32px)) !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header
          workContextCabinetSelect={isAdmin ? workContext.workContextCabinetSelectProps : undefined}
          cabinetSelectProps={cabinetSelectProps}
        />
        <Breadcrumbs />
        <div
          className="analytics-products-shell"
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
            className="analytics-products-panel"
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
            className="analytics-products-toolbar"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: spacing.md,
              alignItems: 'center',
              marginBottom: spacing.sm,
              width: '100%',
            }}
          >
            <Input
              placeholder={isOzonCabinet ? 'Поиск по product_id, offer_id или названию' : 'Поиск по артикулу или названию'}
              prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="analytics-products-search"
              style={{
                maxWidth: 360,
                borderRadius: borderRadius.sm,
                color: colors.textPrimary,
              }}
              classNames={{ input: undefined }}
            />
            <div className="analytics-products-filters" style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
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
                  return (
                    <div className="products-filter-panel" style={{ width: 400, maxHeight: 'min(520px, calc(100vh - 160px))', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Input
                        placeholder={isOzonCabinet ? 'Поиск по offer_id или product_id' : 'Поиск по арт. продавца или WB'}
                        prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        style={{ marginBottom: 12 }}
                        allowClear
                      />
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexShrink: 0 }}>
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
                      {!isOzonCabinet && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexShrink: 0 }}>
                        <Button
                          size="small"
                          loading={bulkPriorityLoading}
                          style={{ whiteSpace: 'nowrap' }}
                          onClick={() => {
                            void setPriorityForArticles(getSelectedArticlesForBulk(filterListFiltered), true)
                          }}
                        >
                          Приоритет выбранным
                        </Button>
                        <Button
                          size="small"
                          loading={bulkPriorityLoading}
                          style={{ whiteSpace: 'nowrap' }}
                          onClick={() => {
                            void setPriorityForArticles(getSelectedArticlesForBulk(filterListFiltered), false)
                          }}
                        >
                          Снять приоритет у выбранных
                        </Button>
                      </div>
                      )}
                      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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
                            {a.photoTm ? (
                              <img
                                src={a.photoTm}
                                alt=""
                                style={{
                                  width: 40,
                                  height: 40,
                                  objectFit: 'cover',
                                  borderRadius: borderRadius.sm,
                                  marginRight: 12,
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: borderRadius.sm,
                                  marginRight: 12,
                                  flexShrink: 0,
                                  backgroundColor: colors.bgGray,
                                }}
                              />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: colors.textPrimary }}>
                                {a.nmId}
                              </div>
                              <div style={{ fontSize: 12, color: colors.textSecondary }} title={a.title ?? undefined}>
                                {a.title || '—'}
                              </div>
                              <div style={{ fontSize: 12, color: colors.textSecondary }}>
                                {isOzonCabinet ? 'Offer ID' : 'Артикул продавца'}: {a.vendorCode || '—'}
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
                data-tour-id={ONBOARDING_TARGETS.PRODUCTS_FILTER}
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
                    {filterBadgeSelectedCount}/{filterListTotal}
                  </span>
                )}
              </Button>
            </Popover>
            <div className="analytics-products-checks" style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <Checkbox
              checked={onlyWithPhoto}
              onChange={(e) => setOnlyWithPhoto(e.target.checked)}
            >
              <span className="products-filter-label-full">Только с фото</span>
              <span className="products-filter-label-short">С фото</span>
            </Checkbox>
            {!isOzonCabinet && (
            <Checkbox
              checked={onlyPriority}
              onChange={(e) => setOnlyPriority(e.target.checked)}
            >
              <span className="products-filter-label-full">Только приоритетные</span>
              <span className="products-filter-label-short">Приоритетные</span>
            </Checkbox>
            )}
            <Tooltip title="Только артикулы, привязанные к незавершённым рекламным кампаниям кабинета">
              <Checkbox
                checked={onlyInAdvertising}
                onChange={(e) => setOnlyInAdvertising(e.target.checked)}
              >
                <span className="products-filter-label-full">Только в рекламе</span>
                <span className="products-filter-label-short">В рекламе</span>
              </Checkbox>
            </Tooltip>
            </div>
            </div>
            {!isOzonCabinet && (
              <>
                <input
                  ref={funnelBulkImportInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  style={{ display: 'none' }}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (file) {
                      funnelBulkImportMutation.mutate(file)
                    }
                  }}
                />
                <span className="analytics-products-import">
                  <Tooltip title="Загрузите выгрузку «Воронка продаж» из ЛК WB (лист «Товары»). Импортируются все артикулы кабинета из файла.">
                    <Button
                      icon={<UploadOutlined />}
                      loading={funnelBulkImportMutation.isPending}
                      disabled={selectedCabinetId == null || funnelBulkImportMutation.isPending}
                      onClick={() => funnelBulkImportInputRef.current?.click()}
                      aria-label="Импорт воронки из Excel для всех артикулов"
                    />
                  </Tooltip>
                </span>
              </>
            )}
          </div>

          {/* Выбранные артикулы ВБ под фильтром — на всю ширину; по клику «ещё» раскрывается весь список */}
          {selectedNmIdsForTags.length > 0 && (
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
                {(tagsExpanded ? selectedNmIdsForTags : selectedNmIdsForTags.slice(0, 8)).map((nmId) => (
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
                {!tagsExpanded && selectedNmIdsForTags.length > 8 && (
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
                    … ещё {selectedNmIdsForTags.length - 8}
                  </button>
                )}
                {tagsExpanded && selectedNmIdsForTags.length > 8 && (
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
                showRatingColumn={showRatingColumn}
                isOzonCabinet={isOzonCabinet}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
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

/** Индекс колонки данных с учётом скрытия «Приоритет» и «Рейтинг». */
function productsDataColIndex(
  showRating: boolean,
  showPriority: boolean,
  slot: 'stock' | 'fbsStock' | 'sizes' | 'date' | 'dynamics',
  dateColsCount: number,
  dateIndex = 0,
): number {
  let col = 3
  if (showPriority) col++
  col++
  if (showRating) col++
  const stockCol = col
  if (slot === 'stock') return stockCol
  if (slot === 'fbsStock') return stockCol + 1
  if (slot === 'sizes') return stockCol + 2
  if (slot === 'date') return stockCol + 3 + dateIndex
  return stockCol + 3 + dateColsCount
}

function WbCreatedAtCell({ value }: { value: string | null | undefined }) {
  if (!value) return <>—</>
  const date = dayjs(value)
  return (
    <div>
      <div>{date.format('DD.MM.YY')}</div>
      <div style={{ color: colors.textSecondary, fontSize: 10, lineHeight: 1.2, marginTop: 1 }}>{date.format('HH:mm')}</div>
    </div>
  )
}

/** Правая граница ячейки с учётом скрытия колонок «Приоритет» и «Рейтинг». */
function getCellBorderRightForTable(
  showRating: boolean,
  showPriority: boolean,
  colIndex: number,
  dateColsCount: number,
): string {
  const sizesIdx = productsDataColIndex(showRating, showPriority, 'sizes', dateColsCount)
  const lastDateIdx = productsDataColIndex(showRating, showPriority, 'date', dateColsCount, dateColsCount - 1)
  if (colIndex === sizesIdx || colIndex === lastDateIdx) return `2px solid ${colors.border}`
  return `1px solid ${colors.border}`
}

/** Ширины колонок (px) для выравнивания шапки и тела таблицы */
const COL_WIDTHS = {
  drag: 32,
  photo: PRODUCT_PHOTO_WIDTH,
  name: 200,
  priority: 72,
  wbCreatedAt: 76,
  rating: 56,
  stock: 72,
  fbsStock: 72,
  sizes: 100,
  date: 44,
  dynamics: 80,
} as const

function productsTableMinWidth(showRating: boolean, showPriority: boolean, dateCols: number): number {
  return (
    COL_WIDTHS.drag +
    COL_WIDTHS.photo +
    COL_WIDTHS.name +
    (showPriority ? COL_WIDTHS.priority : 0) +
    COL_WIDTHS.wbCreatedAt +
    (showRating ? COL_WIDTHS.rating : 0) +
    COL_WIDTHS.stock +
    COL_WIDTHS.fbsStock +
    COL_WIDTHS.sizes +
    COL_WIDTHS.date * dateCols +
    COL_WIDTHS.dynamics
  )
}

function productsTableColumnStyles(showPriorityColumn: boolean, showRatingColumn: boolean): string {
  const colRule = (nth: number, width: number) => `
        .products-table-wrapper table.products-table colgroup col:nth-child(${nth}),
        .products-table-wrapper table.products-table thead th:nth-child(${nth}),
        .products-table-wrapper table.products-table tbody td:nth-child(${nth}) {
          width: ${width}px !important;
          min-width: ${width}px !important;
          max-width: ${width}px !important;
          box-sizing: border-box !important;
        }`
  let nth = 4
  const parts = [
    colRule(1, COL_WIDTHS.drag),
    colRule(2, PRODUCT_PHOTO_WIDTH),
    colRule(3, COL_WIDTHS.name),
  ]
  if (showPriorityColumn) {
    parts.push(colRule(nth, COL_WIDTHS.priority))
    nth++
  }
  parts.push(colRule(nth, COL_WIDTHS.wbCreatedAt))
  nth++
  if (showRatingColumn) {
    parts.push(colRule(nth, COL_WIDTHS.rating))
    nth++
  }
  parts.push(colRule(nth, COL_WIDTHS.stock))
  nth++
  parts.push(colRule(nth, COL_WIDTHS.fbsStock))
  return parts.join('')
}

function ProductsTableColgroup({
  showRatingColumn,
  showPriorityColumn,
  last7Dates,
}: {
  showRatingColumn: boolean
  showPriorityColumn: boolean
  last7Dates: string[]
}) {
  return (
    <colgroup>
      <col style={{ width: COL_WIDTHS.drag }} />
      <col style={{ width: COL_WIDTHS.photo }} />
      <col style={{ width: COL_WIDTHS.name }} />
      {showPriorityColumn && <col style={{ width: COL_WIDTHS.priority }} />}
      <col style={{ width: COL_WIDTHS.wbCreatedAt }} />
      {showRatingColumn && <col style={{ width: COL_WIDTHS.rating }} />}
      <col style={{ width: COL_WIDTHS.stock }} />
      <col style={{ width: COL_WIDTHS.fbsStock }} />
      <col style={{ width: COL_WIDTHS.sizes }} />
      {last7Dates.map((d) => (
        <col key={d} style={{ width: COL_WIDTHS.date }} />
      ))}
      <col style={{ width: COL_WIDTHS.dynamics }} />
    </colgroup>
  )
}

/** Двустрочный заголовок «Остатки / FBO|FBS», чтобы подпись была по центру колонки. */
function StocksColumnHeader({
  fulfillment,
  borderRight,
}: {
  fulfillment: 'FBO' | 'FBS'
  borderRight: string
}) {
  const width = fulfillment === 'FBO' ? COL_WIDTHS.stock : COL_WIDTHS.fbsStock
  return (
    <th
      style={{
        ...thBase,
        textAlign: 'center',
        width,
        maxWidth: width,
        boxSizing: 'border-box',
        padding: '6px 4px',
        lineHeight: 1.2,
        borderRight,
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span>Остатки</span>
        <span>{fulfillment}</span>
      </span>
    </th>
  )
}

interface ProductsTableProps {
  visibleArticles: ArticleSummary[]
  last7Dates: string[]
  last7DaysPeriod: Period
  selectedCabinetId: number | null
  selectedSellerId: number | undefined
  showRatingColumn: boolean
  isOzonCabinet: boolean
  sortField: ProductsSortField
  sortOrder: 'asc' | 'desc'
  onSort: (field: ProductsSortField) => void
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
  showRatingColumn,
  isOzonCabinet,
  sortField,
  sortOrder,
  onSort,
  containerRef,
  onScroll,
  onReorderRows,
}: ProductsTableProps) {
  const compact = useIsNarrow(900)
  const showPriorityColumn = !isOzonCabinet
  const [scrollbarWidth, setScrollbarWidth] = useState(0)
  const dragFromIndexRef = useRef<number | null>(null)
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null)
  const onScrollRef = useRef(onScroll)
  onScrollRef.current = onScroll

  const SortIcon = ({ field }: { field: ProductsSortField }) =>
    sortField !== field ? null : sortOrder === 'asc' ? (
      <CaretUpOutlined style={{ marginLeft: 4, fontSize: 10 }} />
    ) : (
      <CaretDownOutlined style={{ marginLeft: 4, fontSize: 10 }} />
    )

  const sortableThStyle = {
    ...thBase,
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
  }

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

  if (compact) {
    return (
      <div
        ref={containerRef}
        className="products-cards-wrapper"
        onScroll={onScroll}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          width: '100%',
        }}
      >
        {visibleArticles.map((article) => (
          <ProductCard
            key={article.nmId}
            article={article}
            last7Dates={last7Dates}
            last7DaysPeriod={last7DaysPeriod}
            selectedCabinetId={selectedCabinetId}
            selectedSellerId={selectedSellerId}
            showRatingColumn={showRatingColumn}
            showPriorityColumn={showPriorityColumn}
            isOzonCabinet={isOzonCabinet}
          />
        ))}
      </div>
    )
  }

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
        ${productsTableColumnStyles(showPriorityColumn, showRatingColumn)}
      `}</style>
      {/* Шапка таблицы — отступ справа под ширину скроллбара тела (измеряется под текущую ОС/браузер) */}
      <div style={{ flexShrink: 0, borderBottom: `2px solid ${colors.border}`, paddingRight: scrollbarWidth }}>
        <table className="products-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: productsTableMinWidth(showRatingColumn, showPriorityColumn, last7Dates.length) }}>
          <ProductsTableColgroup showRatingColumn={showRatingColumn} showPriorityColumn={showPriorityColumn} last7Dates={last7Dates} />
          <thead>
            <tr style={{ backgroundColor: colors.bgGray }}>
              <th
                title="Перетащите строку за ручку слева"
                style={{ ...thBase, textAlign: 'center', borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, 0, last7Dates.length), padding: '8px 2px', width: COL_WIDTHS.drag, maxWidth: COL_WIDTHS.drag, boxSizing: 'border-box' }}
              >
                <HolderOutlined style={{ color: colors.textMuted, fontSize: 14 }} />
              </th>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, 1, last7Dates.length), padding: '8px 4px', width: COL_WIDTHS.photo, maxWidth: COL_WIDTHS.photo, boxSizing: 'border-box' }}>Фото</th>
              <th style={{ ...thBase, textAlign: 'left', borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, 2, last7Dates.length), width: COL_WIDTHS.name, maxWidth: COL_WIDTHS.name, boxSizing: 'border-box' }}>Название и детали</th>
              {showPriorityColumn && (
              <th style={{ ...thBase, textAlign: 'center', borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, 3, last7Dates.length), width: COL_WIDTHS.priority, maxWidth: COL_WIDTHS.priority, boxSizing: 'border-box' }}>Приоритет</th>
              )}
              <th
                style={{
                  ...sortableThStyle,
                  textAlign: 'center',
                  borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, showPriorityColumn ? 4 : 3, last7Dates.length),
                  width: COL_WIDTHS.wbCreatedAt,
                  maxWidth: COL_WIDTHS.wbCreatedAt,
                  boxSizing: 'border-box',
                }}
                onClick={() => onSort('wbCreatedAt')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  Создан
                  <SortIcon field="wbCreatedAt" />
                </span>
              </th>
              {showRatingColumn && (
                <th style={{ ...thBase, textAlign: 'center', width: COL_WIDTHS.rating, maxWidth: COL_WIDTHS.rating, boxSizing: 'border-box', borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, showPriorityColumn ? 5 : 4, last7Dates.length) }}>
                  {isOzonCabinet ? (
                    <Tooltip title="Оценка качества карточки Ozon, 0–100 баллов">
                      <span>Контент-рейтинг</span>
                    </Tooltip>
                  ) : (
                    'Рейтинг'
                  )}
                </th>
              )}
              <StocksColumnHeader
                fulfillment="FBO"
                borderRight={getCellBorderRightForTable(showRatingColumn, showPriorityColumn, productsDataColIndex(showRatingColumn, showPriorityColumn, 'stock', last7Dates.length), last7Dates.length)}
              />
              <StocksColumnHeader
                fulfillment="FBS"
                borderRight={getCellBorderRightForTable(showRatingColumn, showPriorityColumn, productsDataColIndex(showRatingColumn, showPriorityColumn, 'fbsStock', last7Dates.length), last7Dates.length)}
              />
              <th style={{ ...thBase, textAlign: 'center', borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, productsDataColIndex(showRatingColumn, showPriorityColumn, 'sizes', last7Dates.length), last7Dates.length) }}>Размеры</th>
              {last7Dates.map((d, i) => (
                <th
                  key={d}
                  data-tour-id={ONBOARDING_TARGETS.PRODUCTS_ORDERS_BY_DAY}
                  style={{
                    ...thBase,
                    textAlign: 'center',
                    padding: '8px 6px',
                    verticalAlign: 'bottom',
                    borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, productsDataColIndex(showRatingColumn, showPriorityColumn, 'date', last7Dates.length, i), last7Dates.length),
                  }}
                >
                  <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(-180deg)', display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {dayjs(d).format('DD.MM')}
                  </span>
                </th>
              ))}
              <th
                data-tour-id={ONBOARDING_TARGETS.PRODUCTS_DYNAMICS}
                style={{ ...thBase, textAlign: 'center', color: colors.primary, borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, productsDataColIndex(showRatingColumn, showPriorityColumn, 'dynamics', last7Dates.length), last7Dates.length) }}
              >
                Динамика
              </th>
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
        <table className="products-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: productsTableMinWidth(showRatingColumn, showPriorityColumn, last7Dates.length) }}>
          <ProductsTableColgroup showRatingColumn={showRatingColumn} showPriorityColumn={showPriorityColumn} last7Dates={last7Dates} />
          <tbody>
            {visibleArticles.map((article, idx) => (
              <ProductRow
                key={article.nmId}
                article={article}
                last7Dates={last7Dates}
                last7DaysPeriod={last7DaysPeriod}
                selectedCabinetId={selectedCabinetId}
                selectedSellerId={selectedSellerId}
                showRatingColumn={showRatingColumn}
                showPriorityColumn={showPriorityColumn}
                isOzonCabinet={isOzonCabinet}
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
  showRatingColumn: boolean
  showPriorityColumn: boolean
  isOzonCabinet: boolean
  rowIndex: number
  onDragHandleStart: (rowIndex: number, e: React.DragEvent) => void
  onDragHandleEnd: () => void
  onRowDragOver: (rowIndex: number, e: React.DragEvent) => void
  onRowDrop: (rowIndex: number, e: React.DragEvent) => void
  onRowDragLeave: (e: React.DragEvent) => void
  isDragOver: boolean
}

function useProductRowData(
  article: ArticleSummary,
  last7Dates: string[],
  last7DaysPeriod: Period,
  selectedCabinetId: number | null,
  selectedSellerId: number | undefined,
  isOzonCabinet: boolean,
) {
  const navigate = useNavigate()
  const [isPriority, setIsPriority] = useState(Boolean(article.isPriority))
  const [prioritySaving, setPrioritySaving] = useState(false)

  useEffect(() => {
    setIsPriority(Boolean(article.isPriority))
  }, [article.isPriority])

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
    enabled: !!firstStockWarehouse && !isOzonCabinet,
  })

  const inPromotion = articleDetail?.inWbPromotion === true
  const promotionTooltip = useMemo(() => {
    const names = articleDetail?.wbPromotionNames?.filter(Boolean) ?? []
    const types = articleDetail?.wbPromotionTypes ?? []
    if (!names.length) return ''
    return names.map((n, i) => (types[i] ? `${n} (${types[i]})` : n)).join('\n')
  }, [articleDetail?.wbPromotionNames, articleDetail?.wbPromotionTypes])
  const rating = articleDetail?.article?.rating ?? article?.rating ?? null
  const stocksTotal = useMemo(
    () => (articleDetail?.stocks ?? []).reduce((s, st) => s + (st.amount ?? 0), 0),
    [articleDetail?.stocks]
  )
  const fbsStocksTotal = useMemo(
    () => (articleDetail?.fbsStocks ?? []).reduce((s, st) => s + (st.amount ?? 0), 0),
    [articleDetail?.fbsStocks]
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

  const fboTotal = articleDetail?.stocks?.length
    ? stocksTotal
    : (article.stockFbo ?? 0)
  const fbsTotal = articleDetail?.fbsStocks?.length
    ? fbsStocksTotal
    : (article.stockFbs ?? 0)

  const sizesLabel = useMemo(() => {
    if (isOzonCabinet) return '—'
    if (!stockSizes.length) return '-'
    return stockSizes.map((s) => s.wbSize || s.techSize || '').filter(Boolean).join(', ') || '-'
  }, [isOzonCabinet, stockSizes])

  const goToArticle = () => navigate(`/analytics/article/${article.nmId}`)
  const marketplaceProductUrl = isOzonCabinet ? OZON_CATALOG_URL(article.nmId) : WB_CATALOG_URL(article.nmId)
  const articlePath = `/analytics/article/${article.nmId}`
  const stopProp = (e: React.MouseEvent) => e.stopPropagation()

  const togglePriority = async (checked: boolean) => {
    if (selectedCabinetId == null) return
    try {
      setPrioritySaving(true)
      setIsPriority(checked)
      await analyticsApi.updateArticlePriority(
        article.nmId,
        checked,
        selectedSellerId,
        selectedCabinetId
      )
    } catch (err: unknown) {
      setIsPriority((prev) => !prev)
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      message.error(msg ?? 'Не удалось обновить приоритет карточки')
    } finally {
      setPrioritySaving(false)
    }
  }

  return {
    isPriority,
    prioritySaving,
    togglePriority,
    isLoading,
    inPromotion,
    promotionTooltip,
    rating,
    fboTotal,
    fbsTotal,
    sizesLabel,
    firstStockWarehouse,
    dailyByDate,
    last7Values,
    goToArticle,
    marketplaceProductUrl,
    articlePath,
    stopProp,
  }
}

interface ProductCardProps {
  article: ArticleSummary
  last7Dates: string[]
  last7DaysPeriod: Period
  selectedCabinetId: number | null
  selectedSellerId: number | undefined
  showRatingColumn: boolean
  showPriorityColumn: boolean
  isOzonCabinet: boolean
}

function ProductCard({
  article,
  last7Dates,
  last7DaysPeriod,
  selectedCabinetId,
  selectedSellerId,
  showRatingColumn,
  showPriorityColumn,
  isOzonCabinet,
}: ProductCardProps) {
  const {
    isPriority,
    prioritySaving,
    togglePriority,
    isLoading,
    inPromotion,
    promotionTooltip,
    rating,
    fboTotal,
    fbsTotal,
    dailyByDate,
    last7Values,
    goToArticle,
    marketplaceProductUrl,
    articlePath,
    stopProp,
  } = useProductRowData(
    article,
    last7Dates,
    last7DaysPeriod,
    selectedCabinetId,
    selectedSellerId,
    isOzonCabinet,
  )

  const created = article.wbCreatedAt ? dayjs(article.wbCreatedAt).format('DD.MM.YY') : '—'
  const subtitle = isOzonCabinet
    ? (article.offerId ? `Offer ID: ${article.offerId}` : '—')
    : ([article.subjectName, article.brand].filter(Boolean).join(' · ') || '—')
  const ordersTotal = last7Values.reduce((sum, value) => sum + value, 0)

  return (
    <article
      className="products-card"
      role="button"
      tabIndex={0}
      onClick={goToArticle}
      onKeyDown={(e) => e.key === 'Enter' && goToArticle()}
    >
      <a
        href={marketplaceProductUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stopProp}
        className="products-card-photo"
      >
        {article.photoTm ? (
          <img src={article.photoTm} alt="" />
        ) : (
          <span className="products-card-photo-empty" />
        )}
      </a>
      <div className="products-card-body">
        <div className="products-card-head">
          <Link to={articlePath} onClick={stopProp} className="products-table-link products-card-title">
            {article.title || '—'}
          </Link>
          {showPriorityColumn && (
            <Checkbox
              checked={isPriority}
              disabled={prioritySaving || selectedCabinetId == null}
              onClick={stopProp}
              onChange={(e) => {
                e.stopPropagation()
                void togglePriority(e.target.checked)
              }}
            />
          )}
        </div>
        <div className="products-card-meta">{subtitle}</div>
        <div className="products-card-meta">
          {isOzonCabinet ? 'Product ID' : 'Артикул WB'}:{' '}
          <Link to={articlePath} onClick={stopProp} className="products-table-link">{article.nmId}</Link>
        </div>
        {!isOzonCabinet && (
          <div className="products-card-meta">
            Артикул продавца:{' '}
            <Link to={articlePath} onClick={stopProp} className="products-table-link">
              {article.vendorCode ?? '—'}
            </Link>
          </div>
        )}
        <div className="products-card-meta">
          Создан {created}
          {inPromotion && (
            <span className="products-card-promo" title={promotionTooltip || undefined}>В акции</span>
          )}
        </div>
        <div className="products-card-stats">
          <div className="products-card-stats-left">
          <span>FBO {isLoading && !isOzonCabinet ? '…' : fboTotal.toLocaleString('ru-RU')}</span>
          <span>FBS {isLoading && !isOzonCabinet ? '…' : fbsTotal.toLocaleString('ru-RU')}</span>
          {showRatingColumn && (
            <span>
              {isLoading && !hasMeaningfulArticleRating(rating) ? (
                '…'
              ) : hasMeaningfulArticleRating(rating) ? (
                <>
                  <StarFilled style={{ color: '#FBBF24', fontSize: 11, marginRight: 3 }} />
                  {isOzonCabinet ? formatOzonContentRating(rating) : formatArticleRating(rating)}
                </>
              ) : (
                '—'
              )}
            </span>
          )}
          </div>
          <span className="products-card-chart-wrap" onClick={stopProp} role="presentation">
            <Popover
              trigger="click"
              placement="topRight"
              title="Заказы за 7 дней"
              content={
                <div className="products-card-orders-popup">
                  {last7Dates.map((date) => (
                    <div key={date} className="products-card-orders-row">
                      <span>{dayjs(date).format('dd, DD.MM')}</span>
                      <span>{(dailyByDate.get(date) ?? 0).toLocaleString('ru-RU')}</span>
                    </div>
                  ))}
                  <div className="products-card-orders-row products-card-orders-total">
                    <span>Всего</span>
                    <span>{ordersTotal.toLocaleString('ru-RU')}</span>
                  </div>
                </div>
              }
            >
              <button
                type="button"
                className="products-card-chart"
                aria-label="Заказы по дням"
                onClick={stopProp}
              >
                {isLoading ? <Spin size="small" /> : <MiniChart values={last7Values} height={22} />}
              </button>
            </Popover>
          </span>
        </div>
      </div>
    </article>
  )
}

function ProductRow({
  article,
  last7Dates,
  last7DaysPeriod,
  selectedCabinetId,
  selectedSellerId,
  showRatingColumn,
  showPriorityColumn,
  isOzonCabinet,
  rowIndex,
  onDragHandleStart,
  onDragHandleEnd,
  onRowDragOver,
  onRowDrop,
  onRowDragLeave,
  isDragOver,
}: ProductRowProps) {
  const {
    isPriority,
    prioritySaving,
    togglePriority,
    isLoading,
    inPromotion,
    promotionTooltip,
    rating,
    fboTotal,
    fbsTotal,
    sizesLabel,
    firstStockWarehouse,
    dailyByDate,
    last7Values,
    goToArticle,
    marketplaceProductUrl,
    articlePath,
    stopProp,
  } = useProductRowData(
    article,
    last7Dates,
    last7DaysPeriod,
    selectedCabinetId,
    selectedSellerId,
    isOzonCabinet,
  )

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
          borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, 0, last7Dates.length),
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
          borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, 1, last7Dates.length),
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
            href={marketplaceProductUrl}
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
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, 2, last7Dates.length), width: COL_WIDTHS.name, maxWidth: COL_WIDTHS.name, boxSizing: 'border-box', ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top' }}>
        <Link
          to={articlePath}
          onClick={stopProp}
          className="products-table-link"
          style={{ fontWeight: 700, fontSize: 13, color: colors.textPrimary, marginBottom: 4, display: 'inline-block' }}
        >
          {article.title || '-'}
        </Link>
        <div style={{ color: colors.textSecondary, marginBottom: 2 }}>
          {isOzonCabinet
            ? (article.offerId ? `Offer ID: ${article.offerId}` : '—')
            : ([article.subjectName, article.brand].filter(Boolean).join(' · ') || '-')}
        </div>
        <div style={{ color: colors.textSecondary, marginBottom: 2 }}>
          {isOzonCabinet ? 'Product ID' : 'Артикул WB'}:{' '}
          <Link to={articlePath} onClick={stopProp} className="products-table-link">
            {article.nmId}
          </Link>
        </div>
        {!isOzonCabinet && (
        <div style={{ color: colors.textSecondary, marginBottom: 4 }}>
          Артикул продавца:{' '}
          <Link to={articlePath} onClick={stopProp} className="products-table-link">
            {article.vendorCode ?? '-'}
          </Link>
        </div>
        )}
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
      {showPriorityColumn && (
      <td style={{ padding: '6px 6px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, 3, last7Dates.length), textAlign: 'center', verticalAlign: 'top' }}>
        <Checkbox
          checked={isPriority}
          disabled={prioritySaving || selectedCabinetId == null}
          onClick={stopProp}
          onChange={(e) => {
            e.stopPropagation()
            void togglePriority(e.target.checked)
          }}
        />
      </td>
      )}
      <td
        style={{
          padding: '6px 8px',
          borderBottom: `1px solid ${colors.border}`,
          borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, showPriorityColumn ? 4 : 3, last7Dates.length),
          width: COL_WIDTHS.wbCreatedAt,
          maxWidth: COL_WIDTHS.wbCreatedAt,
          boxSizing: 'border-box',
          ...typography.body,
          ...FONT_PAGE_SMALL,
          verticalAlign: 'top',
          textAlign: 'center',
        }}
      >
        <WbCreatedAtCell value={article.wbCreatedAt} />
      </td>
      {showRatingColumn && (
        <td style={{ padding: '6px 4px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, showPriorityColumn ? 5 : 4, last7Dates.length), width: COL_WIDTHS.rating, maxWidth: COL_WIDTHS.rating, boxSizing: 'border-box', ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top', textAlign: 'center' }}>
          {isLoading && !hasMeaningfulArticleRating(rating) ? (
            <Spin size="small" />
          ) : hasMeaningfulArticleRating(rating) ? (
            isOzonCabinet ? (
              <Tooltip title={ozonContentRatingTooltip(rating)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <StarFilled style={{ color: '#FBBF24', fontSize: 12 }} />
                  <span>{formatOzonContentRating(rating)}</span>
                </span>
              </Tooltip>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <StarFilled style={{ color: '#FBBF24', fontSize: 12 }} />
                <span>{formatArticleRating(rating)}</span>
              </span>
            )
          ) : (
            '—'
          )}
        </td>
      )}
      <td style={{ padding: '6px 4px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, productsDataColIndex(showRatingColumn, showPriorityColumn, 'stock', last7Dates.length), last7Dates.length), width: COL_WIDTHS.stock, maxWidth: COL_WIDTHS.stock, boxSizing: 'border-box', ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top', textAlign: 'center' }}>
        {isLoading && !isOzonCabinet ? '-' : fboTotal.toLocaleString('ru-RU')}
      </td>
      <td style={{ padding: '6px 4px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, productsDataColIndex(showRatingColumn, showPriorityColumn, 'fbsStock', last7Dates.length), last7Dates.length), width: COL_WIDTHS.fbsStock, maxWidth: COL_WIDTHS.fbsStock, boxSizing: 'border-box', ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top', textAlign: 'center' }}>
        {isLoading && !isOzonCabinet ? '-' : fbsTotal.toLocaleString('ru-RU')}
      </td>
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, productsDataColIndex(showRatingColumn, showPriorityColumn, 'sizes', last7Dates.length), last7Dates.length), ...typography.body, ...FONT_PAGE_SMALL, verticalAlign: 'top', textAlign: 'center' }}>
        {isOzonCabinet ? '—' : (!firstStockWarehouse ? '-' : sizesLabel)}
      </td>
      {last7Dates.map((d, i) => (
        <td
          key={d}
          style={{
            textAlign: 'center',
            padding: '6px',
            borderBottom: `1px solid ${colors.border}`,
            borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, productsDataColIndex(showRatingColumn, showPriorityColumn, 'date', last7Dates.length, i), last7Dates.length),
            ...typography.body,
            ...FONT_PAGE_SMALL,
            verticalAlign: 'top',
          }}
        >
          {isLoading ? '-' : (dailyByDate.get(d) ?? 0).toLocaleString('ru-RU')}
        </td>
      ))}
      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, borderRight: getCellBorderRightForTable(showRatingColumn, showPriorityColumn, productsDataColIndex(showRatingColumn, showPriorityColumn, 'dynamics', last7Dates.length), last7Dates.length), verticalAlign: 'top' }}>
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
