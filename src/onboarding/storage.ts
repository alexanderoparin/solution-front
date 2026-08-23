import type { OnboardingTourId } from './types'

const PREFIX = 'clicki.onboarding.'
const PENDING_KEY = `${PREFIX}pending`

function tourKey(tourId: OnboardingTourId, suffix: 'completed' | 'skipped'): string {
  return `${PREFIX}${tourId}.${suffix}`
}

export function isTourFinished(tourId: OnboardingTourId): boolean {
  try {
    return (
      localStorage.getItem(tourKey(tourId, 'completed')) === '1'
      || localStorage.getItem(tourKey(tourId, 'skipped')) === '1'
    )
  } catch {
    return false
  }
}

export function markTourCompleted(tourId: OnboardingTourId): void {
  try {
    localStorage.setItem(tourKey(tourId, 'completed'), '1')
  } catch {
    /* ignore */
  }
}

export function markTourSkipped(tourId: OnboardingTourId): void {
  try {
    localStorage.setItem(tourKey(tourId, 'skipped'), '1')
  } catch {
    /* ignore */
  }
}

export function setPendingTour(tourId: OnboardingTourId): void {
  try {
    sessionStorage.setItem(PENDING_KEY, tourId)
  } catch {
    /* ignore */
  }
}

export function consumePendingTour(): OnboardingTourId | null {
  try {
    const value = sessionStorage.getItem(PENDING_KEY)
    sessionStorage.removeItem(PENDING_KEY)
    if (
      value === 'profile'
      || value === 'analyticsProducts'
      || value === 'analyticsSummary'
      || value === 'advertisingCampaigns'
      || value === 'advertisingCampaignDetail'
      || value === 'advertisingBidder'
      || value === 'advertisingCampaignManage'
    ) {
      return value
    }
    return null
  } catch {
    return null
  }
}
