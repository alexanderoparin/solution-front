import { profileTour } from './profileTour'
import { analyticsProductsTour } from './analyticsProductsTour'
import { analyticsSummaryTour } from './analyticsSummaryTour'
import { advertisingCampaignsTour } from './advertisingCampaignsTour'
import type { OnboardingTourDefinition, OnboardingTourId } from '../types'

export const ONBOARDING_TOURS: Record<OnboardingTourId, OnboardingTourDefinition> = {
  profile: profileTour,
  analyticsProducts: analyticsProductsTour,
  analyticsSummary: analyticsSummaryTour,
  advertisingCampaigns: advertisingCampaignsTour,
}

export function getTour(tourId: OnboardingTourId): OnboardingTourDefinition {
  return ONBOARDING_TOURS[tourId]
}
