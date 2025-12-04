import type { Period } from '../types/analytics'

const PERIOD_COUNT = 4
const PERIOD_DAYS = 3

/**
 * Генерирует 4 периода по 3 дня, начиная со вчерашней даты.
 * Периоды не пересекаются.
 */
export function generateDefaultPeriods(): Period[] {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  const periods: Period[] = []
  
  for (let i = 0; i < PERIOD_COUNT; i++) {
    const periodEnd = new Date(yesterday)
    periodEnd.setDate(periodEnd.getDate() - i * PERIOD_DAYS)
    
    const periodStart = new Date(periodEnd)
    periodStart.setDate(periodStart.getDate() - (PERIOD_DAYS - 1))
    
    periods.push({
      id: i + 1,
      name: `период №${i + 1}`,
      dateFrom: formatDate(periodStart),
      dateTo: formatDate(periodEnd),
    })
  }
  
  // Возвращаем периоды в обратном порядке: самый старый первым, самый новый последним
  return periods.reverse()
}

/**
 * Форматирует дату в формат YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Валидирует периоды - проверяет только наличие дат и их корректность.
 * Пересечения периодов разрешены.
 */
export function validatePeriods(periods: Period[]): boolean {
  if (!periods || periods.length === 0) {
    return false
  }
  
  for (let i = 0; i < periods.length; i++) {
    const period = periods[i]
    if (!period.dateFrom || !period.dateTo) {
      return false
    }
    
    const dateFrom = new Date(period.dateFrom)
    const dateTo = new Date(period.dateTo)
    
    // Проверяем только, что даты валидны
    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
      return false
    }
  }
  
  return true
}

