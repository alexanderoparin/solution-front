import { ONBOARDING_TARGETS } from '../targets'
import type { OnboardingTourDefinition } from '../types'

export const advertisingCampaignManageTour: OnboardingTourDefinition = {
  id: 'advertisingCampaignManage',
  pathPrefix: '/advertising/campaigns',
  pathPattern: /^\/advertising\/campaigns\/[^/]+\/manage$/,
  steps: [
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_MANAGE_ARTICLES,
      text: 'Список артикулов, добавленных в кампанию.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_MANAGE_STATS_LINK,
      text: 'Быстрый переход к статистике.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_MANAGE_AUTO_BUDGET,
      text: 'Настройка автоматического пополнения.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_MANAGE_AUTO_BUDGET_SAVE,
      text: 'Сохранение настроек автоматического пополнения.',
      placement: 'left',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_MANAGE_SCHEDULE_TOGGLE,
      text: 'Включение и отключение расписания запуска.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_MANAGE_SCHEDULE_GRID,
      text: 'Нажмите, чтобы создать временные слоты для запуска.',
      placement: 'top',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_MANAGE_BUDGET_CHART,
      text: 'Наглядное отображение работы рекламы на графике.',
      placement: 'top',
    },
  ],
}
