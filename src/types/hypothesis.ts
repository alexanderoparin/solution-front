export type HypothesisWorkflowStatus = 'PREPARATION' | 'TEST_LAUNCHED'

export type HypothesisDisplayStatus =
  | 'PREPARATION'
  | 'IN_PROGRESS'
  | 'WAITING_DATA'
  | 'SUCCESS'
  | 'FAILURE'

export type HypothesisVerdict = 'SUCCESS' | 'FAILURE'

export type HypothesisCriterionKey =
  | 'drr'
  | 'orders'
  | 'ctr'
  | 'cpc'
  | 'cpo'
  | 'views'
  | 'buyout_percent'
  | 'avg_pos'

export const HYPOTHESIS_CRITERIA: { key: HypothesisCriterionKey; label: string }[] = [
  { key: 'drr', label: 'ДРР' },
  { key: 'orders', label: 'Заказы' },
  { key: 'ctr', label: 'CTR' },
  { key: 'cpc', label: 'CPC' },
  { key: 'cpo', label: 'CPO' },
  { key: 'views', label: 'Показы' },
  { key: 'buyout_percent', label: 'Процент выкупа' },
  { key: 'avg_pos', label: 'Средние позиции' },
]

export interface HypothesisCriterionValue {
  key: string
  label: string
  baseline: number | null
  check: number | null
  change: number | null
  changePercent: number | null
  improved: boolean | null
  lowerIsBetter: boolean
}

export interface HypothesisDailyPoint {
  date: string
  period: 'BASELINE' | 'CHECK'
  values: Record<string, number>
}

export interface Hypothesis {
  id: number
  cabinetId: number
  nmId: number
  nmName?: string | null
  nmPhotoUrl?: string | null
  vendorCode?: string | null
  categoryName?: string | null
  title: string
  description?: string | null
  checkFrom: string
  checkTo: string
  baselineFrom: string
  baselineTo: string
  workflowStatus: HypothesisWorkflowStatus
  displayStatus: HypothesisDisplayStatus
  verdict?: HypothesisVerdict | null
  verdictManual: boolean
  criteria: HypothesisCriterionKey[]
  criterionResults?: HypothesisCriterionValue[]
  dynamics?: HypothesisDailyPoint[]
  resultSummary?: string | null
  createdByUserId?: number | null
  createdByName?: string | null
  createdAt: string
  updatedAt: string
}

export interface HypothesisUpsertRequest {
  nmId: number
  title: string
  description?: string
  checkFrom: string
  checkTo: string
  workflowStatus: HypothesisWorkflowStatus
  criteria: HypothesisCriterionKey[]
}

export const HYPOTHESIS_STATUS_LABELS: Record<HypothesisDisplayStatus, string> = {
  PREPARATION: 'Подготовка к тесту',
  IN_PROGRESS: 'В процессе',
  WAITING_DATA: 'Ожидает данных',
  SUCCESS: 'Успешно',
  FAILURE: 'Неуспешно',
}
