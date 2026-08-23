import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { consumePendingTour, isTourFinished } from '../../onboarding/storage'
import { getTour } from '../../onboarding/tours'
import { matchesTourPath } from '../../onboarding/resolveTourForPath'
import type { OnboardingTourId } from '../../onboarding/types'
import { useOnboardingStore } from '../../store/onboardingStore'
import OnboardingSkipHint from './OnboardingSkipHint'
import OnboardingTour from './OnboardingTour'

function parseTourParam(value: string | null): OnboardingTourId | null {
  if (
    value === 'profile'
    || value === 'analyticsProducts'
    || value === 'analyticsSummary'
    || value === 'advertisingCampaigns'
    || value === 'advertisingCampaignDetail'
  ) {
    return value
  }
  return null
}

/**
 * Глобальный слой обучалки: активный тур, подсказка после «пропустить», автозапуск.
 */
export default function OnboardingProvider() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const startTour = useOnboardingStore((s) => s.startTour)

  useEffect(() => {
    const tourFromQuery = parseTourParam(searchParams.get('tour'))
    const force = searchParams.get('force') === '1'
    if (tourFromQuery != null) {
      const next = new URLSearchParams(searchParams)
      next.delete('tour')
      next.delete('force')
      setSearchParams(next, { replace: true })
      if (force || !isTourFinished(tourFromQuery)) {
        window.setTimeout(() => startTour(tourFromQuery), 400)
      }
      return
    }

    const pending = consumePendingTour()
    if (pending != null && !isTourFinished(pending)) {
      const tour = getTour(pending)
      if (!matchesTourPath(location.pathname, tour)) {
        navigate(`${tour.pathPrefix}?tour=${pending}`, { replace: true })
        return
      }
      window.setTimeout(() => startTour(pending), 400)
    }
  }, [location.pathname, navigate, searchParams, setSearchParams, startTour])

  return (
    <>
      <OnboardingTour />
      <OnboardingSkipHint />
    </>
  )
}
