import { getStoredCabinetId } from '../api/cabinetSelection'
import { useAuthStore } from '../store/authStore'
import { isOnboardingTourId, type OnboardingTourId } from './types'

const PREFIX = 'clicki.onboarding.'
const PENDING_KEY = `${PREFIX}pending`
const DEMO_SCOPE = 'demo'
const GLOBAL_SCOPE = 'global'
const DEMO_MODE_EVENT = 'clicki:onboarding-demo-mode'

let demoMode = false

function tourKey(scope: string, tourId: OnboardingTourId, suffix: 'completed' | 'skipped'): string {
  return `${PREFIX}${scope}.${tourId}.${suffix}`
}

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key: string): void {
  try {
    localStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
}

/** Учебная витрина без своего кабинета: туры пишутся в отдельный scope `demo`. */
export function setOnboardingDemoMode(enabled: boolean): void {
  demoMode = enabled
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<boolean>(DEMO_MODE_EVENT, { detail: enabled }))
  }
}

export function isOnboardingDemoMode(): boolean {
  return demoMode
}

export function subscribeOnboardingDemoMode(listener: (enabled: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }
  const handler = (event: Event) => {
    listener(Boolean((event as CustomEvent<boolean>).detail))
  }
  window.addEventListener(DEMO_MODE_EVENT, handler)
  return () => window.removeEventListener(DEMO_MODE_EVENT, handler)
}

function currentUserId(): number | null {
  return useAuthStore.getState().userId
}

/**
 * Ключ прогресса тура: пользователь + демо / кабинет / без кабинета.
 * Другой аккаунт в том же браузере не наследует чужие completed/skipped.
 * Новый кабинет → туры этой страницы снова считаются непройденными.
 */
export function resolveOnboardingScope(
  cabinetId: number | null = getStoredCabinetId(),
  userId: number | null = currentUserId(),
): string {
  const userPrefix = userId != null ? `user.${userId}.` : ''
  if (demoMode) {
    return `${userPrefix}${DEMO_SCOPE}`
  }
  if (cabinetId != null) {
    return `${userPrefix}cabinet.${cabinetId}`
  }
  return `${userPrefix}${GLOBAL_SCOPE}`
}

export function isTourFinished(tourId: OnboardingTourId, scope: string = resolveOnboardingScope()): boolean {
  return readFlag(tourKey(scope, tourId, 'completed')) || readFlag(tourKey(scope, tourId, 'skipped'))
}

export function markTourCompleted(tourId: OnboardingTourId, scope: string = resolveOnboardingScope()): void {
  writeFlag(tourKey(scope, tourId, 'completed'))
}

export function markTourSkipped(tourId: OnboardingTourId, scope: string = resolveOnboardingScope()): void {
  writeFlag(tourKey(scope, tourId, 'skipped'))
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
    if (isOnboardingTourId(value)) {
      return value
    }
    return null
  } catch {
    return null
  }
}
