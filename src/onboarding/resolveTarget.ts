import type { OnboardingStep } from './types'

export function resolveTourTarget(step: OnboardingStep): HTMLElement | null {
  const primary = document.querySelector(`[data-tour-id="${step.targetId}"]`)
  if (primary instanceof HTMLElement) {
    return primary
  }
  if (step.fallbackTargetId) {
    const fallback = document.querySelector(`[data-tour-id="${step.fallbackTargetId}"]`)
    if (fallback instanceof HTMLElement) {
      return fallback
    }
  }
  return null
}

export function scrollTargetIntoView(el: HTMLElement): void {
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
}
