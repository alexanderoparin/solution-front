import type { PlanDto } from '../types/api'

export type LandingMainTierId = 'start' | 'optimum' | 'profi'

export type LandingTierPrices = {
  twoWeeks: number | null
  month: number | null
}

const TIERS: { id: LandingMainTierId; min: number; max: number }[] = [
  { id: 'start', min: 1, max: 1 },
  { id: 'optimum', min: 2, max: 5 },
  { id: 'profi', min: 6, max: 10 },
]

function is14d(plan: PlanDto): boolean {
  return plan.periodType === 'DAYS' && plan.periodDays === 14
}

function isMonth(plan: PlanDto): boolean {
  return plan.periodType === 'CALENDAR_MONTH'
}

function matchTier(plan: PlanDto, min: number, max: number): boolean {
  return (plan.minCabinets ?? 1) === min && (plan.maxCabinets ?? max) === max
}

/**
 * Цены полного доступа (MAIN) для карточек лендинга по тирам кабинетов.
 */
export function pricesFromMainPlans(
  plans: PlanDto[],
): Record<LandingMainTierId, LandingTierPrices> {
  const result = {
    start: { twoWeeks: null, month: null },
    optimum: { twoWeeks: null, month: null },
    profi: { twoWeeks: null, month: null },
  } as Record<LandingMainTierId, LandingTierPrices>

  for (const tier of TIERS) {
    const twoWeeks = plans.find((p) => matchTier(p, tier.min, tier.max) && is14d(p))
    const month = plans.find((p) => matchTier(p, tier.min, tier.max) && isMonth(p))
    result[tier.id] = {
      twoWeeks: twoWeeks?.priceRub ?? null,
      month: month?.priceRub ?? null,
    }
  }
  return result
}
