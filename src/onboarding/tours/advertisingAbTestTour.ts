import { ONBOARDING_TARGETS } from '../targets'
import type { OnboardingTourDefinition } from '../types'

export const advertisingAbTestTour: OnboardingTourDefinition = {
  id: 'advertisingAbTest',
  pathPrefix: '/advertising/ab-test',
  exactPath: true,
  steps: [
    {
      targetId: ONBOARDING_TARGETS.AB_TEST_CREATE,
      text: 'Создайте тест: выберите карточку, загрузите варианты главного фото и задайте правила ротации.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.AB_TEST_FILTER,
      text: '«Активные» — только идущие тесты. «Все» — включая уже остановленные.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.AB_TEST_VARIANTS,
      fallbackTargetId: ONBOARDING_TARGETS.AB_TEST_CREATE,
      text: 'Превью вариантов и CTR. Чем выше CTR, тем лучше кликают на это фото.',
      placement: 'bottom',
    },
    {
      targetId: ONBOARDING_TARGETS.AB_TEST_TITLE,
      fallbackTargetId: ONBOARDING_TARGETS.AB_TEST_CREATE,
      text: 'Нажмите на название, чтобы открыть подробную статистику по каждому варианту.',
      placement: 'right',
    },
    {
      targetId: ONBOARDING_TARGETS.AB_TEST_STATUS,
      fallbackTargetId: ONBOARDING_TARGETS.AB_TEST_CREATE,
      text: 'Включите или выключите тест. Выключенный тест останавливает ротацию фото на Wildberries.',
      placement: 'left',
    },
  ],
}
