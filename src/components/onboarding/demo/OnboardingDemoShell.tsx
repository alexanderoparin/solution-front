import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { isTourFinished } from '../../../onboarding/storage'
import { resolveTourIdForPath } from '../../../onboarding/resolveTourForPath'
import { useOnboardingStore } from '../../../store/onboardingStore'
import OnboardingDemoBanner from './OnboardingDemoBanner'

interface OnboardingDemoShellProps {
  children: ReactNode
  onCreated?: () => void
}

/**
 * Обёртка учебной витрины: плашка «это пример» и автозапуск тура страницы.
 */
export default function OnboardingDemoShell({ children, onCreated }: OnboardingDemoShellProps) {
  const location = useLocation()
  const startTour = useOnboardingStore((s) => s.startTour)
  const activeTourId = useOnboardingStore((s) => s.activeTourId)

  useEffect(() => {
    const tourId = resolveTourIdForPath(location.pathname)
    if (tourId === 'profile') {
      return
    }
    if (isTourFinished(tourId) || activeTourId != null) {
      return
    }
    const timer = window.setTimeout(() => {
      if (useOnboardingStore.getState().activeTourId != null) {
        return
      }
      if (isTourFinished(tourId)) {
        return
      }
      startTour(tourId)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [location.pathname, activeTourId, startTour])

  const handleCreated = () => {
    useOnboardingStore.setState({ activeTourId: null, stepIndex: 0, skipHintVisible: false })
    onCreated?.()
  }

  return (
    <>
      <OnboardingDemoBanner onCreated={handleCreated} />
      {children}
    </>
  )
}
