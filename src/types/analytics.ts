export interface Period {
  id: number
  name: string
  dateFrom: string
  dateTo: string
}

export interface GeneralInfo {
  startOfWork: string
  generalFunnelAvailableFrom: string
  advertisingFunnelAvailableFrom: string
  articlesInWork: number
}

export interface ArticleSummary {
  nmId: number
  title: string
  brand: string
  subjectName: string
  photoTm: string | null // URL миниатюры первой фотографии товара (tm, ~75×100)
  /** Превью 246×328 из WB; для шапки артикула предпочтительнее, чем tm */
  photoC246x328?: string | null
  /** Приоритетная карточка для первоочередной обработки событий по nmID */
  isPriority?: boolean | null
  vendorCode?: string | null // Артикул продавца
  /** Средний рейтинг по отзывам WB (1–5). */
  rating?: number | null
  /** Количество отзывов по товару. */
  reviewsCount?: number | null
}

export interface AggregatedMetrics {
  transitions: number | null
  cart: number | null
  orders: number | null
  ordersAmount: number | null
  cartConversion: number | null
  orderConversion: number | null
  views: number | null
  clicks: number | null
  costs: number | null
  cpc: number | null
  ctr: number | null
  cpo: number | null
  drr: number | null
}

export interface SummaryResponse {
  periods: Period[]
  articles: ArticleSummary[]
  aggregatedMetrics: Record<number, AggregatedMetrics>
  /** При пагинации — общее число артикулов после фильтров. */
  totalArticles?: number | null
}

export interface PeriodMetricValue {
  periodId: number
  value: number | null
  changePercent: number | null
}

export interface ArticleMetric {
  nmId: number
  photoTm: string | null // URL миниатюры первой фотографии товара
  periods: PeriodMetricValue[]
}

export interface CampaignMetric {
  campaignId: number
  campaignName: string
  articles: number[] // Список артикулов (nmId)
  periods: PeriodMetricValue[]
}

export interface MetricGroupResponse {
  metricName: string // Английский ключ
  metricNameRu: string // Русское название
  category: 'funnel' | 'advertising'
  articles?: ArticleMetric[] // Для метрик воронки
  campaigns?: CampaignMetric[] // Для рекламных метрик
}

export interface ArticleDetail {
  nmId: number
  imtId: number | null
  title: string
  brand: string
  subjectName: string
  vendorCode: string
  photoTm: string | null
  /** Превью 246×328; в шапке артикула используем вместо tm, если задано */
  photoC246x328?: string | null
  rating: number | null
  reviewsCount: number | null
  productUrl: string
  createdAt: string | null
  updatedAt: string | null
}

export interface Metric {
  metricName: string // Английский ключ
  metricNameRu: string // Русское название
  category: 'funnel' | 'advertising'
  periods: PeriodMetricValue[]
}

export interface DailyData {
  date: string
  transitions: number | null
  cart: number | null
  orders: number | null
  ordersAmount: number | null
  cartConversion: number | null
  orderConversion: number | null
  views: number | null
  clicks: number | null
  costs: number | null
  cpc: number | null
  ctr: number | null
  cpo: number | null
  drr: number | null
  priceBeforeDiscount: number | null
  sellerDiscount: number | null
  priceWithDiscount: number | null
  wbClubDiscount: number | null
  priceWithWbClub: number | null
  priceWithSpp: number | null
  sppAmount: number | null
  sppPercent: number | null
}

export interface Campaign {
  id: number
  name: string
  type: string | null
  status: number | null
  statusName: string | null
  createdAt: string
  /** WB change_time или время последней синхронизации в БД. */
  updatedAt?: string | null
  /** Количество артикулов в кампании. */
  articlesCount?: number | null
  // Опциональные метрики (суммы за период или за весь срок РК), пока бэкенд может не отдавать
  views?: number | null
  clicks?: number | null
  ctr?: number | null
  cpc?: number | null
  costs?: number | null
  cart?: number | null
  orders?: number | null
}

/** Срез рекламы кампании по дню и appType из WB fullstats (сайт / Android / iOS). */
export interface CampaignAdvertisingPlatformSlice {
  appType: number
  wbLabelRu: string
  viewsSharePercent: number | null
  views: number | null
  clicks: number | null
  ctr: number | null
  cpc: number | null
  costs: number | null
  cart: number | null
  orders: number | null
  cr: number | null
  cpo: number | null
}

export interface CampaignAdvertisingPlatformDay {
  date: string
  platforms: CampaignAdvertisingPlatformSlice[]
}

/** Детали страницы комбо-кампании: название, статус, артикулы. */
export interface CampaignDetail {
  id: number
  name: string
  status: number | null
  statusName: string | null
  articlesCount: number
  articles: ArticleSummary[]
  createdAt: string
  campaignGoal?: string | null
  /** Разбивка рекламы по площадкам WB за период (если запрошено с датами). */
  advertisingByPlatform?: CampaignAdvertisingPlatformDay[] | null
}

export interface NormQueryClusterRow {
  normQuery: string
  avgPos: number | null
  clicks: number | null
  atbs: number | null
  orders: number | null
  spend: number | null
  cpc: number | null
}

export type NormQueryClusterSortField =
  | 'normQuery'
  | 'avgPos'
  | 'clicks'
  | 'atbs'
  | 'orders'
  | 'spend'
  | 'cpc'

export type NormQueryClusterSortDirection = 'asc' | 'desc'

export interface NormQueryClustersResponse {
  totals: NormQueryClusterRow | null
  rows: NormQueryClusterRow[]
  totalElements: number
  page: number
  size: number
  hasMore: boolean
  lastSyncedAt: string | null
}

export interface Stock {
  warehouseName: string
  amount: number
  updatedAt: string | null
}

export interface StockSize {
  techSize: string | null
  wbSize: string | null
  amount: number
}

export interface ArticleNoteFile {
  id: number
  fileName: string
  fileSize: number
  mimeType: string | null
  uploadedAt: string
}

export interface ArticleNote {
  id: number
  nmId: number
  sellerId: number
  userId: number
  userEmail: string
  content: string
  files: ArticleNoteFile[]
  createdAt: string
  updatedAt: string
}

export interface CreateNoteRequest {
  content: string
}

export interface UpdateNoteRequest {
  content: string
}

/** Заметка к рекламной кампании (РК). */
export interface CampaignNote {
  id: number
  campaignId: number
  userId: number
  userEmail: string
  content: string
  createdAt: string
  updatedAt: string
  /** Вложения (тот же формат, что у заметок артикула). */
  files?: ArticleNoteFile[]
}

export interface ArticleResponse {
  article: ArticleDetail
  periods: Period[]
  metrics: Metric[]
  dailyData: DailyData[]
  campaigns: Campaign[]
  /** Участвует ли товар в акции WB (календарь акций и/или скидка), не путать с рекламными кампаниями */
  inWbPromotion?: boolean | null
  /** Названия акций календаря WB для тултипа */
  wbPromotionNames?: string[] | null
  /** Типы акций в том же порядке: "regular", "auto" и т.д. */
  wbPromotionTypes?: string[] | null
  stocks: Stock[]
  /** Товары «в связке» для отображения справа от шапки артикула */
  bundleProducts?: ArticleSummary[]
  /** Дата-время последнего запуска обновления остатков по кабинету (для кнопки «Обновить остатки») */
  lastStocksUpdateTriggeredAt?: string | null
  /** Цель рекламной кампании по артикулу в выбранном кабинете */
  articleGoal?: string | null
}

/** Превью карточки для шапки артикула: 246×328, иначе tm. */
export function resolveArticlePhotoUrl(photo: {
  photoC246x328?: string | null
  photoTm?: string | null
}): string | null {
  const hi = photo.photoC246x328?.trim()
  if (hi) return hi
  const tm = photo.photoTm?.trim()
  return tm || null
}

/** Миниатюры «в связке» в шапке артикула: tm (~75×100), при отсутствии — c246x328. */
export function resolveArticleBundleThumbUrl(photo: {
  photoC246x328?: string | null
  photoTm?: string | null
}): string | null {
  const tm = photo.photoTm?.trim()
  if (tm) return tm
  const hi = photo.photoC246x328?.trim()
  return hi || null
}

/** Слот расписания РК (страница управления). */
export interface CampaignScheduleSlot {
  id: number
  dayOfWeek: number
  startTime: string
  endTime: string
  budgetRub: number
  repeatGroupId?: string | null
  repeatMode?: string | null
}

export interface CampaignAutoBudgetSettings {
  enabled: boolean
  topUpAmount: number | null
  sourceType: number | null
  thresholdRub: number | null
  maxTopUpsPerDay: number | null
  locked: boolean
}

export interface CampaignChangeLogEntry {
  createdAt: string
  userDisplay: string
  message: string
}

export interface CampaignManageData {
  id: number
  name: string
  status: number | null
  statusName: string | null
  articlesCount: number
  articles: ArticleSummary[]
  operationalStatus: 'RUNNING' | 'STOPPED'
  autoBudget: CampaignAutoBudgetSettings
  slots: CampaignScheduleSlot[]
}

export interface BalanceSourceOption {
  type: number
  label: string
  availableRub: number | null
}

export interface BalanceSourcesResponse {
  sources: BalanceSourceOption[]
  fetchedAt?: string | null
  stale?: boolean
}

export interface BalanceRefreshResponse {
  sources: BalanceSourcesResponse
  refreshed?: boolean
  stale?: boolean
  fetchedAt?: string | null
  nextAvailableInSeconds?: number | null
  message?: string | null
}

export interface CampaignBudgetChartData {
  periodFrom: string
  periodTo: string
  stepHours: number
  budgetPoints: { at: string; budgetRub: number | null }[]
  intervals: { from: string; to: string; active: boolean }[]
  markers: { at: string; type: 'START' | 'STOP' | 'TOP_UP'; amount?: number | null }[]
}

export type CampaignSlotRepeatMode = 'DAILY' | 'WEEKENDS' | 'WEEKDAYS'
