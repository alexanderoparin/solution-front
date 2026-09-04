export const ONBOARDING_TOUR_IDS = [
  'profile',
  'analyticsProducts',
  'analyticsArticle',
  'analyticsSummary',
  'advertisingCampaigns',
  'advertisingCampaignDetail',
  'advertisingBidder',
  'advertisingCampaignManage',
  'advertisingAbTest',
  'advertisingAbTestDetail',
] as const

export type OnboardingTourId = (typeof ONBOARDING_TOUR_IDS)[number]

export function isOnboardingTourId(value: string | null | undefined): value is OnboardingTourId {
  if (value == null) {
    return false
  }
  return (ONBOARDING_TOUR_IDS as readonly string[]).includes(value)
}

export type OnboardingPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface OnboardingStep {
  /** data-tour-id целевого элемента */
  targetId: string
  /** Запасной target, если основной не найден */
  fallbackTargetId?: string
  text: string
  placement?: OnboardingPlacement
}

export interface OnboardingTourDefinition {
  id: OnboardingTourId
  /** Маршрут, на котором доступен тур */
  pathPrefix: string
  /** Точное совпадение pathname (для /analytics без /analytics/products) */
  exactPath?: boolean
  /** Регулярка pathname (приоритетнее pathPrefix/exactPath) */
  pathPattern?: RegExp
  steps: OnboardingStep[]
}
