import type { CampaignScheduleSlot } from '../types/analytics'
import type { CampaignBudgetChartData } from '../types/analytics'

/** Учебные данные витрины, пока у пользователя нет кабинета. */
export const DEMO_CAMPAIGN_NAME = 'Пижама — поиск'
export const DEMO_CAMPAIGN_WB_ID = '01234567'
export const DEMO_CAMPAIGN_WB_ID_SECOND = '12345678'
export const DEMO_CAMPAIGN_TYPE = 'Поиск'

/** Учебный артикул витрины (вымышленные nmId / арт. продавца). */
export interface DemoArticle {
  nmId: string
  vendorCode: string
  title: string
  subjectName: string
  brand: string
  createdAt: string
  rating: number | null
  priority: boolean
  fbo: number
  fbs: number
  /** Подписи размеров, как в живой колонке «Размеры» (не количество). */
  sizes: string
  orders: readonly number[]
  inAdvertising: boolean
}

export const DEMO_ARTICLES: readonly DemoArticle[] = [
  {
    nmId: '482910375',
    vendorCode: 'pjcot42wh',
    title: 'Пижама женская хлопок с длинным рукавом, однотонная',
    subjectName: 'Пижамы',
    brand: 'CottonSleep',
    createdAt: '2024-01-19T15:13:00',
    rating: 5,
    priority: true,
    fbo: 201,
    fbs: 14,
    sizes: 'S, M, L, XL',
    orders: [4, 6, 3, 8, 5, 7, 9],
    inAdvertising: true,
  },
  {
    nmId: '591028446',
    vendorCode: 'pjlacenight',
    title: 'Пижама женская с кружевом, короткий рукав',
    subjectName: 'Пижамы',
    brand: 'CottonSleep',
    createdAt: '2024-02-03T11:40:00',
    rating: 4.9,
    priority: true,
    fbo: 86,
    fbs: 9,
    sizes: 'M, L, XL',
    orders: [2, 3, 1, 4, 2, 5, 3],
    inAdvertising: true,
  },
  {
    nmId: '603184759',
    vendorCode: 'robehome46',
    title: 'Халат махровый женский с карманами и поясом',
    subjectName: 'Халаты',
    brand: 'CottonSleep',
    createdAt: '2024-03-12T09:05:00',
    rating: 4.5,
    priority: true,
    fbo: 2424,
    fbs: 287,
    sizes: 'S, M, L, XL, XXL',
    orders: [11, 8, 14, 9, 12, 10, 16],
    inAdvertising: false,
  },
  {
    nmId: '718293560',
    vendorCode: 'ngnslk40',
    title: 'Сорочка ночная однотонная, удлинённая',
    subjectName: 'Сорочки',
    brand: 'CottonSleep',
    createdAt: '2024-04-28T18:22:00',
    rating: 4.3,
    priority: false,
    fbo: 0,
    fbs: 261,
    sizes: '40, 42, 44',
    orders: [1, 0, 2, 1, 3, 2, 2],
    inAdvertising: false,
  },
  {
    nmId: '829405671',
    vendorCode: 'bedlinen2sp',
    title: 'Комплект постельного белья двуспальный, сатин',
    subjectName: 'Постельное бельё',
    brand: 'CottonSleep',
    createdAt: '2024-06-07T13:51:00',
    rating: null,
    priority: true,
    fbo: 5945,
    fbs: 38,
    sizes: '-',
    orders: [7, 9, 6, 10, 8, 12, 11],
    inAdvertising: true,
  },
]

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
