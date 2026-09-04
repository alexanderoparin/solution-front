import { useLayoutEffect, type ReactNode } from 'react'
import { setOnboardingDemoMode } from '../../../onboarding/storage'
import { useOnboardingStore } from '../../../store/onboardingStore'
import OnboardingDemoBanner from './OnboardingDemoBanner'

interface OnboardingDemoShellProps {
  children: ReactNode
  onCreated?: () => void
}

/**
 * Обёртка учебной витрины: плашка «это пример».
 * Автозапуск тура страницы делает {@link OnboardingProvider} в scope `demo`.
 */
export default function OnboardingDemoShell({ children, onCreated }: OnboardingDemoShellProps) {
  const cancelTour = useOnboardingStore((s) => s.cancelTour)

  useLayoutEffect(() => {
    setOnboardingDemoMode(true)
    return () => {
      setOnboardingDemoMode(false)
      cancelTour()
    }
  }, [cancelTour])

  const handleCreated = () => {
    cancelTour()
    onCreated?.()
  }

  return (
    <>
      <OnboardingDemoBanner onCreated={handleCreated} />
      {children}
    </>
  )
}
