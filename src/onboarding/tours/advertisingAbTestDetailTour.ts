import { ONBOARDING_TARGETS } from '../targets'
import type { OnboardingTourDefinition } from '../types'

export const advertisingAbTestDetailTour: OnboardingTourDefinition = {
  id: 'advertisingAbTestDetail',
  pathPrefix: '/advertising/ab-test',
  pathPattern: /^\/advertising\/ab-test\/[^/]+$/,
  steps: [
    {
      targetId: ONBOARDING_TARGETS.AB_TEST_DETAIL_SETTINGS,
      text: 'Периодичность ротации, срок и действие по завершении. Пока тест включён, настройки можно изменить.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.AB_TEST_DETAIL_VARIANTS,
      text: 'Сравнение вариантов: CTR, доля показов, корзина и заказы.',
      placement: 'top',
    },
    {
      targetId: ONBOARDING_TARGETS.AB_TEST_DETAIL_ACTIVE_WB,
      fallbackTargetId: ONBOARDING_TARGETS.AB_TEST_DETAIL_VARIANTS,
      text: '«Сейчас на ВБ» — какое фото сейчас стоит главным на карточке.',
      placement: 'bottom',
    },
  ],
}
