import { ONBOARDING_TARGETS } from '../targets'
import type { OnboardingTourDefinition } from '../types'

export const profileTour: OnboardingTourDefinition = {
  id: 'profile',
  pathPrefix: '/profile',
  steps: [
    {
      targetId: ONBOARDING_TARGETS.SUBSCRIPTION_BADGE,
      fallbackTargetId: ONBOARDING_TARGETS.SUBSCRIPTION_CARD,
      text: 'Здесь отображается доступ к сервису. Тариф каждого кабинета смотрите на странице кабинета.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.ADD_CABINET,
      text: 'Здесь вы можете добавлять свои кабинеты для работы с ними.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.GRANTED_ACCESS,
      text: 'Здесь отображаются доступы к сторонним кабинетам, которые были вам предоставлены.',
      placement: 'top',
    },
    {
      targetId: ONBOARDING_TARGETS.MAIN_NAV,
      text: 'Меню сервиса в шапке слева: «Аналитика» и «Реклама». Откройте разделы и посмотрите, какие возможности есть.',
      placement: 'bottom',
    },
  ],
}
