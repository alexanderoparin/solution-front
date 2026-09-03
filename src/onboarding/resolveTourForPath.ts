import { getTour } from './tours'
import type { OnboardingTourDefinition, OnboardingTourId } from './types'

/** Проверяет, что текущий pathname подходит для тура. */
export function matchesTourPath(pathname: string, tour: OnboardingTourDefinition): boolean {
  if (tour.pathPattern != null) {
    return tour.pathPattern.test(pathname)
  }
  if (tour.exactPath) {
    return pathname === tour.pathPrefix
  }
  return pathname === tour.pathPrefix || pathname.startsWith(`${tour.pathPrefix}/`)
}

/** Тур для текущего маршрута (кнопка «?» и ?tour=). */
export function resolveTourIdForPath(pathname: string): OnboardingTourId {
  if (pathname.startsWith('/analytics/products')) {
    return 'analyticsProducts'
  }
  if (pathname === '/analytics') {
    return 'analyticsSummary'
  }
  if (pathname === '/advertising/campaigns') {
    return 'advertisingCampaigns'
  }
  if (/^\/advertising\/campaigns\/[^/]+\/manage$/.test(pathname)) {
    return 'advertisingCampaignManage'
  }
  if (/^\/advertising\/campaigns\/[^/]+$/.test(pathname)) {
    return 'advertisingCampaignDetail'
  }
  if (pathname === '/advertising/bidder') {
    return 'advertisingBidder'
  }
  if (pathname === '/advertising/ab-test') {
    return 'advertisingAbTest'
  }
  if (/^\/advertising\/ab-test\/[^/]+$/.test(pathname)) {
    return 'advertisingAbTestDetail'
  }
  if (pathname.startsWith('/profile')) {
    return 'profile'
  }
  return 'profile'
}

/** Проверка маршрута по id тура. */
export function matchesTourIdPath(pathname: string, tourId: OnboardingTourId): boolean {
  return matchesTourPath(pathname, getTour(tourId))
}
