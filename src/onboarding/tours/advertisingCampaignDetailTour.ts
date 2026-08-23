import { ONBOARDING_TARGETS } from '../targets'
import type { OnboardingTourDefinition } from '../types'

export const advertisingCampaignDetailTour: OnboardingTourDefinition = {
  id: 'advertisingCampaignDetail',
  pathPrefix: '/advertising/campaigns',
  pathPattern: /^\/advertising\/campaigns\/[^/]+$/,
  steps: [
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_DETAIL_ARTICLES,
      text: 'Отображение всех артикулов, участвующих в кампании.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_DETAIL_METRICS,
      text: 'Выберите интересующие показатели. Обратите внимание: данные по СПП не передаются за период до начала использования системы.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_DETAIL_CHART,
      text: 'Для наглядности данные можно посмотреть на графике.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_DETAIL_EXPORT,
      text: 'Скачайте данные в формате Excel для дальнейшей работы с ними.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_DETAIL_MANAGE,
      text: 'Переход в раздел настройки автоматического запуска. Раздел доступен на платном тарифе.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_DETAIL_COMPARE_PERIODS,
      text: 'Выберите периоды для сравнения.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_DETAIL_STOCK_ARTICLE,
      text: 'Выберите интересующий артикул, чтобы посмотреть информацию по его остаткам.',
      placement: 'left',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_DETAIL_STOCK_FULFILLMENT,
      text: 'Остатки по FBS также доступны для просмотра.',
      placement: 'left',
    },
    {
      targetId: ONBOARDING_TARGETS.CAMPAIGN_DETAIL_STOCK_EXPAND,
      text: 'Нажмите на треугольник, чтобы раскрыть подробную информацию по каждому размеру.',
      placement: 'right',
    },
  ],
}
