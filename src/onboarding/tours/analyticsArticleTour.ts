import { ONBOARDING_TARGETS } from '../targets'
import type { OnboardingTourDefinition } from '../types'

export const analyticsArticleTour: OnboardingTourDefinition = {
  id: 'analyticsArticle',
  pathPrefix: '/analytics/article',
  pathPattern: /^\/analytics\/article\/[^/]+$/,
  steps: [
    {
      targetId: ONBOARDING_TARGETS.ARTICLE_HEADER,
      text: 'Карточка товара: фото, название, артикулы WB и продавца, цель и товары в связке.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.ARTICLE_METRICS,
      text: 'Выберите интересующие показатели. Данные по СПП появляются после начала использования системы.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.ARTICLE_CHART,
      text: 'Для наглядности данные можно посмотреть на графике.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.ARTICLE_EXPORT,
      text: 'Скачайте таблицу воронок в Excel для дальнейшей работы.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.ARTICLE_COMPARE,
      text: 'Сравните два периода: общая и рекламная воронка считаются по этому артикулу.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.ARTICLE_STOCK_FULFILLMENT,
      text: 'Остатки можно смотреть и по FBO, и по FBS.',
      placement: 'left',
    },
    {
      targetId: ONBOARDING_TARGETS.ARTICLE_STOCK_EXPAND,
      text: 'Нажмите на треугольник, чтобы раскрыть остатки по размерам.',
      placement: 'right',
    },
    {
      targetId: ONBOARDING_TARGETS.ARTICLE_CAMPAIGNS,
      text: 'Все рекламные кампании, в которых участвует этот артикул.',
      placement: 'top',
    },
  ],
}
