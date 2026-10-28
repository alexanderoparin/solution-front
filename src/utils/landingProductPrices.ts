import type { PlanDto } from '../types/api'

export type LandingProductPrices = {
  /** Минимальный пакет CAMPAIGN за 14 дней. */
  campaignManageFrom: number | null
  /** Цена одного теста (AB_PACK с creditAmount = 1). */
  abTestFrom: number | null
  /** Минимальный пакет MAIN (полный доступ) за 14 дней. */
  fullAccessFrom: number | null
}

function is14d(plan: PlanDto): boolean {
  return plan.periodType === 'DAYS' && plan.periodDays === 14
}

function minPrice(plans: PlanDto[]): number | null {
  if (plans.length === 0) return null
  let min = plans[0].priceRub
  for (let i = 1; i < plans.length; i += 1) {
    if (plans[i].priceRub < min) min = plans[i].priceRub
  }
  return min
}

/**
 * Цены продуктовых карточек лендинга из публичного каталога планов.
 */
export function pricesFromProductPlans(input: {
  main: PlanDto[]
  campaign: PlanDto[]
  ab: PlanDto[]
}): LandingProductPrices {
  const campaign14 = input.campaign.filter(is14d)
  const main14 = input.main.filter(is14d)
  const singleAb = input.ab.find((p) => (p.creditAmount ?? 0) === 1)

  return {
    campaignManageFrom: minPrice(campaign14),
    abTestFrom: singleAb?.priceRub ?? minPrice(input.ab),
    fullAccessFrom: minPrice(main14),
  }
}

export function formatLandingPrice(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`
}
