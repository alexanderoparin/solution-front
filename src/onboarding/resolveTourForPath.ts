import { getTour } from './tours'
import type { OnboardingTourDefinition, OnboardingTourId } from './types'

/** Проверяет, что текущий pathname подходит для тура. */
export function matchesTourPath(pathname: string, tour: OnboardingTourDefinition): boolean {
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
  if (pathname.startsWith('/profile')) {
    return 'profile'
  }
  return 'profile'
}

/** Проверка маршрута по id тура. */
export function matchesTourIdPath(pathname: string, tourId: OnboardingTourId): boolean {
  return matchesTourPath(pathname, getTour(tourId))
}
