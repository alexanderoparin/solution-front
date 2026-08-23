import { ONBOARDING_TARGETS } from '../targets'
import type { OnboardingTourDefinition } from '../types'

export const analyticsProductsTour: OnboardingTourDefinition = {
  id: 'analyticsProducts',
  pathPrefix: '/analytics/products',
  steps: [
    {
      targetId: ONBOARDING_TARGETS.PRODUCTS_FILTER,
      text: 'Выбор товаров, показатели которых хотите отслеживать в системе.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.PRODUCTS_ORDERS_BY_DAY,
      text: 'Количество заказов по дням.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.PRODUCTS_DYNAMICS,
      text: 'Динамика количества заказов.',
      placement: 'left',
    },
  ],
}
