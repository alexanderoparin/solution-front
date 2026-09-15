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
  /** Текст на узком экране, если отличается от desktop */
  narrowText?: string
  /** Не показывать шаг на мобилке (max-width 900px) */
  hideWhenNarrow?: boolean
  /** Не показывать шаг на широком экране */
  hideWhenWide?: boolean
  /**
   * Не показывать шаг, если в DOM нет основного target
   * (карточка списка, строка таблицы и т.п.).
   */
  requireTarget?: boolean
  placement?: OnboardingPlacement
}

const NARROW_TOUR_MAX = 900

export function isOnboardingNarrowViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= NARROW_TOUR_MAX
}

export function isOnboardingStepVisible(step: OnboardingStep, narrow = isOnboardingNarrowViewport()): boolean {
  if (narrow && step.hideWhenNarrow) {
    return false
  }
  if (!narrow && step.hideWhenWide) {
    return false
  }
  if (step.requireTarget) {
    if (typeof document === 'undefined') {
      return false
    }
    return document.querySelector(`[data-tour-id="${step.targetId}"]`) != null
  }
  return true
}

export function visibleOnboardingSteps(
  steps: readonly OnboardingStep[],
  narrow = isOnboardingNarrowViewport(),
): OnboardingStep[] {
  return steps.filter((step) => isOnboardingStepVisible(step, narrow))
}

export function onboardingStepText(step: OnboardingStep, narrow = isOnboardingNarrowViewport()): string {
  if (narrow && step.narrowText) {
    return step.narrowText
  }
  return step.text
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
