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
  periods: PeriodMetricValue[]
}

export interface MetricGroupResponse {
  metricName: string // Английский ключ
  metricNameRu: string // Русское название
  category: 'funnel' | 'advertising'
  articles: ArticleMetric[]
}

export interface ArticleDetail {
  nmId: number
  title: string
  brand: string
  subjectName: string
  vendorCode: string
  rating: number | null
  reviewsCount: number | null
  productUrl: string
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
}

export interface Campaign {
  id: number
  name: string
  type: string | null
  createdAt: string
}

export interface ArticleResponse {
  article: ArticleDetail
  periods: Period[]
  metrics: Metric[]
  dailyData: DailyData[]
  campaigns: Campaign[]
}

