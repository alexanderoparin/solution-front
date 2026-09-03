import type { CampaignScheduleSlot } from '../types/analytics'
import type { CampaignBudgetChartData } from '../types/analytics'

/** Учебные данные витрины, пока у пользователя нет кабинета. */
export const DEMO_CAMPAIGN_NAME = 'Пижама — поиск'
export const DEMO_CAMPAIGN_WB_ID = '01234567'
export const DEMO_CAMPAIGN_WB_ID_SECOND = '12345678'
export const DEMO_CAMPAIGN_TYPE = 'Поиск'

export const DEMO_ARTICLES = [
  { nmId: '0123456789', title: 'Пижама женская хлопок' },
  { nmId: '1234567890', title: 'Пижама женская с кружевом' },
] as const

export const DEMO_WAREHOUSES = [
  { warehouseName: 'Коледино', amount: 142 },
  { warehouseName: 'Казань', amount: 38 },
  { warehouseName: 'Электросталь', amount: 21 },
] as const

export const DEMO_WAREHOUSE_SIZES: Record<string, { techSize: string; amount: number }[]> = {
  Коледино: [
    { techSize: 'S', amount: 28 },
    { techSize: 'M', amount: 64 },
    { techSize: 'L', amount: 50 },
  ],
}

export const DEMO_SCHEDULE_SLOTS: CampaignScheduleSlot[] = [
  { id: 1, dayOfWeek: 1, startTime: '09:00', endTime: '18:00', budgetRub: 3000 },
  { id: 2, dayOfWeek: 2, startTime: '09:00', endTime: '18:00', budgetRub: 3000 },
  { id: 3, dayOfWeek: 3, startTime: '09:00', endTime: '21:00', budgetRub: 4500 },
  { id: 4, dayOfWeek: 4, startTime: '09:00', endTime: '18:00', budgetRub: 3000 },
  { id: 5, dayOfWeek: 5, startTime: '09:00', endTime: '18:00', budgetRub: 3000 },
]

export function buildDemoBudgetChart(nowIso: string): CampaignBudgetChartData {
  const now = new Date(nowIso).getTime()
  const hour = 60 * 60 * 1000
  const budgetPoints = Array.from({ length: 24 }, (_, index) => {
    const at = new Date(now - (23 - index) * hour).toISOString()
    return { at, budgetRub: 9200 - index * 70 }
  })
  return {
    periodFrom: budgetPoints[0].at,
    periodTo: budgetPoints[budgetPoints.length - 1].at,
    stepHours: 1,
    budgetPoints,
    intervals: [
      { from: budgetPoints[8].at, to: budgetPoints[17].at, active: true },
    ],
    markers: [
      { at: budgetPoints[8].at, type: 'START' },
      { at: budgetPoints[12].at, type: 'TOP_UP', amount: 2000 },
    ],
  }
}
