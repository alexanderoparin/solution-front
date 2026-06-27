import dayjs, { type Dayjs } from 'dayjs'

/** Период графика бюджета по умолчанию — 2 суток. */
export const BUDGET_CHART_DEFAULT_DAYS = 2

/** Максимальная длина произвольного периода (как на бэкенде). */
export const BUDGET_CHART_MAX_DAYS = 90

export function defaultBudgetChartPeriod(): [Dayjs, Dayjs] {
  const to = dayjs()
  return [to.subtract(BUDGET_CHART_DEFAULT_DAYS, 'day'), to]
}

export function formatBudgetChartPeriodParam(value: Dayjs): string {
  return value.format('YYYY-MM-DDTHH:mm:ss')
}

export function isBudgetChartPeriodValid(from: Dayjs, to: Dayjs): boolean {
  if (!from.isBefore(to)) {
    return false
  }
  return to.diff(from, 'day', true) <= BUDGET_CHART_MAX_DAYS
}
