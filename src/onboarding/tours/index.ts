import { profileTour } from './profileTour'
import { analyticsProductsTour } from './analyticsProductsTour'
import { analyticsArticleTour } from './analyticsArticleTour'
import { analyticsSummaryTour } from './analyticsSummaryTour'
import { advertisingCampaignsTour } from './advertisingCampaignsTour'
import { advertisingCampaignDetailTour } from './advertisingCampaignDetailTour'
import { advertisingBidderTour } from './advertisingBidderTour'
import { advertisingCampaignManageTour } from './advertisingCampaignManageTour'
import { advertisingAbTestTour } from './advertisingAbTestTour'
import { advertisingAbTestDetailTour } from './advertisingAbTestDetailTour'
import type { OnboardingTourDefinition, OnboardingTourId } from '../types'

export const ONBOARDING_TOURS: Record<OnboardingTourId, OnboardingTourDefinition> = {
  profile: profileTour,
  analyticsProducts: analyticsProductsTour,
  analyticsArticle: analyticsArticleTour,
  analyticsSummary: analyticsSummaryTour,
  advertisingCampaigns: advertisingCampaignsTour,
  advertisingCampaignDetail: advertisingCampaignDetailTour,
  advertisingBidder: advertisingBidderTour,
  advertisingCampaignManage: advertisingCampaignManageTour,
  advertisingAbTest: advertisingAbTestTour,
  advertisingAbTestDetail: advertisingAbTestDetailTour,
}

export function getTour(tourId: OnboardingTourId): OnboardingTourDefinition {
  return ONBOARDING_TOURS[tourId]
}
