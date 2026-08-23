import { ONBOARDING_TARGETS } from '../targets'
import type { OnboardingTourDefinition } from '../types'

export const advertisingCampaignsTour: OnboardingTourDefinition = {
  id: 'advertisingCampaigns',
  pathPrefix: '/advertising/campaigns',
  exactPath: true,
  steps: [
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGNS_REFRESH,
      text: 'Перед началом работы, нажмите «Обновить все РК». Рекомендуем обновлять статистику раз в 2-3 часа, так как данные могут отдаваться с задержкой.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGNS_PERIOD,
      text: 'Выберите период, за который хотите посмотреть общую статистику по всем кампаниям.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGNS_NAME,
      text: 'Чтобы открыть подробные данные по кампании, нажмите на её название.',
      placement: 'right',
    },
  ],
}
