import { profileTour } from './profileTour'
import type { OnboardingTourDefinition, OnboardingTourId } from '../types'

export const ONBOARDING_TOURS: Record<OnboardingTourId, OnboardingTourDefinition> = {
  profile: profileTour,
}

export function getTour(tourId: OnboardingTourId): OnboardingTourDefinition {
  return ONBOARDING_TOURS[tourId]
}
