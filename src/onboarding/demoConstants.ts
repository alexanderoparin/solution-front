import type { CampaignScheduleSlot } from '../types/analytics'
import type { CampaignBudgetChartData } from '../types/analytics'

/** Учебные данные витрины, пока у пользователя нет кабинета. */
export const DEMO_CAMPAIGN_NAME = 'Пижама — поиск'
export const DEMO_CAMPAIGN_WB_ID = '01234567'
export const DEMO_CAMPAIGN_WB_ID_SECOND = '12345678'
export const DEMO_CAMPAIGN_TYPE = 'Поиск'

/** Статус учебной РК для фильтра списка. */
export type DemoCampaignStatus = 'active' | 'paused' | 'finished'

/** Учебная рекламная кампания в списке РК. */
export interface DemoCampaignRow {
  createdAt: string
  updatedAt: string
  name: string
  id: string
  type: string
  articlesCount: number
  status: DemoCampaignStatus
  views: number
  clicks: number
  costs: number
  cpc: number
  ctr: number
  cart: number
  orders: number
}

/** Учебные РК витрины: активные, на паузе и завершённые, вперемешку. */
export const DEMO_CAMPAIGNS: readonly DemoCampaignRow[] = [
  {
    createdAt: '18.08.2026',
    updatedAt: '03.09.2026 08:05',
    name: 'Новинки — поиск',
    id: '89012345',
    type: 'Поиск',
    articlesCount: 2,
    status: 'active',
    views: 9840,
    clicks: 312,
    costs: 4180,
    cpc: 13.4,
    ctr: 3.17,
    cart: 44,
    orders: 19,
  },
  {
    createdAt: '15.11.2025',
    updatedAt: '30.06.2026 10:00',
    name: 'Пижама кружево — поиск',
    id: '67890123',
    type: 'Поиск',
    articlesCount: 1,
    status: 'finished',
    views: 22140,
    clicks: 640,
    costs: 9740,
    cpc: 15.22,
    ctr: 2.89,
    cart: 86,
    orders: 37,
  },
  {
    createdAt: '12.03.2026',
    updatedAt: '01.09.2026 09:14',
    name: DEMO_CAMPAIGN_NAME,
    id: DEMO_CAMPAIGN_WB_ID,
    type: DEMO_CAMPAIGN_TYPE,
    articlesCount: 2,
    status: 'active',
    views: 48210,
    clicks: 1518,
    costs: 21150,
    cpc: 13.93,
    ctr: 3.15,
    cart: 214,
    orders: 96,
  },
  {
    createdAt: '19.01.2026',
    updatedAt: '22.08.2026 13:18',
    name: 'Сорочка — поиск',
    id: '45678901',
    type: 'Поиск',
    articlesCount: 1,
    status: 'paused',
    views: 7620,
    clicks: 188,
    costs: 2910,
    cpc: 15.48,
    ctr: 2.47,
    cart: 27,
    orders: 11,
  },
  {
    createdAt: '08.03.2026',
    updatedAt: '03.09.2026 11:40',
    name: 'Халат — каталог',
    id: '23456789',
    type: 'Каталог',
    articlesCount: 1,
    status: 'active',
    views: 36180,
    clicks: 892,
    costs: 12840,
    cpc: 14.39,
    ctr: 2.47,
    cart: 128,
    orders: 54,
  },
  {
    createdAt: '12.07.2025',
    updatedAt: '20.03.2026 12:07',
    name: 'Домашний текстиль — полки',
    id: '78901234',
    type: 'Рекомендательные полки',
    articlesCount: 3,
    status: 'finished',
    views: 41280,
    clicks: 980,
    costs: 14110,
    cpc: 14.4,
    ctr: 2.37,
    cart: 118,
    orders: 49,
  },
  {
    createdAt: '04.02.2026',
    updatedAt: '28.08.2026 18:02',
    name: 'Пижама — авто',
    id: DEMO_CAMPAIGN_WB_ID_SECOND,
    type: 'Автоматическая',
    articlesCount: 2,
    status: 'paused',
    views: 12400,
    clicks: 310,
    costs: 4880,
    cpc: 15.74,
    ctr: 2.5,
    cart: 41,
    orders: 18,
  },
  {
    createdAt: '21.02.2026',
    updatedAt: '02.09.2026 16:22',
    name: 'Постельное — поиск',
    id: '34567890',
    type: 'Поиск',
    articlesCount: 1,
    status: 'active',
    views: 27450,
    clicks: 1104,
    costs: 16220,
    cpc: 14.69,
    ctr: 4.02,
    cart: 176,
    orders: 81,
  },
  {
    createdAt: '02.10.2025',
    updatedAt: '14.05.2026 19:41',
    name: 'Халат — авто',
    id: '56789012',
    type: 'Автоматическая',
    articlesCount: 1,
    status: 'finished',
    views: 18920,
    clicks: 405,
    costs: 6320,
    cpc: 15.6,
    ctr: 2.14,
    cart: 52,
    orders: 21,
  },
]

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
