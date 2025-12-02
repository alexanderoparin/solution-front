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
 * Валидирует периоды на пересечение.
 */
export function validatePeriods(periods: Period[]): boolean {
  if (!periods || periods.length < 2) {
    return true
  }
  
  for (let i = 0; i < periods.length; i++) {
    const period1 = periods[i]
    if (!period1.dateFrom || !period1.dateTo) {
      return false
    }
    
    const dateFrom1 = new Date(period1.dateFrom)
    const dateTo1 = new Date(period1.dateTo)
    
    if (dateFrom1 > dateTo1) {
      return false
    }
    
    for (let j = i + 1; j < periods.length; j++) {
      const period2 = periods[j]
      if (!period2.dateFrom || !period2.dateTo) {
        return false
      }
      
      const dateFrom2 = new Date(period2.dateFrom)
      const dateTo2 = new Date(period2.dateTo)
      
      // Проверяем пересечение
      const overlaps = dateTo1 >= dateFrom2 && dateFrom1 <= dateTo2
      
      if (overlaps) {
        return false
      }
    }
  }
  
  return true
}

