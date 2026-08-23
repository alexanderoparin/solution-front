import { ONBOARDING_TARGETS } from '../targets'
import type { OnboardingTourDefinition } from '../types'

export const profileTour: OnboardingTourDefinition = {
  id: 'profile',
  pathPrefix: '/profile',
  steps: [
    {
      targetId: ONBOARDING_TARGETS.SUBSCRIPTION_BADGE,
      fallbackTargetId: ONBOARDING_TARGETS.SUBSCRIPTION_CARD,
      text: 'Отображение текущего статуса вашей подписки.',
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
      text: 'Меню сервиса. Самое время открыть его и посмотреть, какие возможности он предлагает.',
      placement: 'bottom',
    },
  ],
}
