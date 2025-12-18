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
  photoTm: string | null // URL миниатюры первой фотографии товара
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
}

export interface Stock {
  warehouseName: string
  amount: number
  updatedAt: string | null
}

export interface ArticleResponse {
  article: ArticleDetail
  periods: Period[]
  metrics: Metric[]
  dailyData: DailyData[]
  campaigns: Campaign[]
  stocks: Stock[]
}

