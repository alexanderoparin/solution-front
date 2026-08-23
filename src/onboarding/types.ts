export type OnboardingTourId = 'profile' | 'analyticsProducts' | 'analyticsSummary'

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
  steps: OnboardingStep[]
}
