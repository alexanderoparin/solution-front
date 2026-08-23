import { ONBOARDING_TARGETS } from '../targets'
import type { OnboardingTourDefinition } from '../types'

export const advertisingBidderTour: OnboardingTourDefinition = {
  id: 'advertisingBidder',
  pathPrefix: '/advertising/bidder',
  exactPath: true,
  steps: [
    {
      targetId: ONBOARDING_TARGETS.BIDDER_STATUS,
      text: 'Текущий статус кампании и быстрое включение автозапуска.',
      placement: 'left',
    },
    {
      targetId: ONBOARDING_TARGETS.BIDDER_CAMPAIGN_NAME,
      text: 'Выберите кампанию из списка, чтобы перейти к её настройкам.',
      placement: 'right',
    },
  ],
}
