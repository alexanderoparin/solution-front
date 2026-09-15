import { ONBOARDING_TARGETS } from '../targets'
import type { OnboardingTourDefinition } from '../types'

export const analyticsSummaryTour: OnboardingTourDefinition = {
  id: 'analyticsSummary',
  pathPrefix: '/analytics',
  exactPath: true,
  steps: [
    {
      targetId: ONBOARDING_TARGETS.SUMMARY_FILTER,
      text: 'Выберите товары для сравнения данных.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.SUMMARY_PERIODS,
      fallbackTargetId: ONBOARDING_TARGETS.SUMMARY_PERIOD_DATES,
      text: 'Это периоды для сравнения — календари сверху. Можно добавить до 5.',
      narrowText: 'Это периоды для сравнения — календари сверху. Можно добавить до 4.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.SUMMARY_PERIOD_DATES,
      text: 'Укажите даты, которые хотите проанализировать.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.SUMMARY_METRIC_EXPAND,
      text: 'Нажмите, чтобы открыть список всех артикулов, добавленных для сравнения.',
      placement: 'right',
    },
  ],
}
