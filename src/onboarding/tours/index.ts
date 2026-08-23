import { profileTour } from './profileTour'
import { analyticsProductsTour } from './analyticsProductsTour'
import { analyticsSummaryTour } from './analyticsSummaryTour'
import { advertisingCampaignsTour } from './advertisingCampaignsTour'
import { advertisingCampaignDetailTour } from './advertisingCampaignDetailTour'
import { advertisingBidderTour } from './advertisingBidderTour'
import type { OnboardingTourDefinition, OnboardingTourId } from '../types'

export const ONBOARDING_TOURS: Record<OnboardingTourId, OnboardingTourDefinition> = {
  profile: profileTour,
  analyticsProducts: analyticsProductsTour,
  analyticsSummary: analyticsSummaryTour,
  advertisingCampaigns: advertisingCampaignsTour,
  advertisingCampaignDetail: advertisingCampaignDetailTour,
  advertisingBidder: advertisingBidderTour,
}

export function getTour(tourId: OnboardingTourId): OnboardingTourDefinition {
  return ONBOARDING_TOURS[tourId]
}
