import { profileTour } from './profileTour'
import { analyticsProductsTour } from './analyticsProductsTour'
import { analyticsSummaryTour } from './analyticsSummaryTour'
import type { OnboardingTourDefinition, OnboardingTourId } from '../types'

export const ONBOARDING_TOURS: Record<OnboardingTourId, OnboardingTourDefinition> = {
  profile: profileTour,
  analyticsProducts: analyticsProductsTour,
  analyticsSummary: analyticsSummaryTour,
}

export function getTour(tourId: OnboardingTourId): OnboardingTourDefinition {
  return ONBOARDING_TOURS[tourId]
}
