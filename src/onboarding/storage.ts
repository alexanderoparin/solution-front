import { useAuthStore } from '../store/authStore'
import { isOnboardingTourId, type OnboardingTourId } from './types'

const PREFIX = 'clicki.onboarding.'
const PENDING_KEY = `${PREFIX}pending`
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

/** Учебная витрина: влияет на UI, не на ключ прохождения тура. */
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
 * Прогресс тура — один на пользователя и страницу.
 * Учебный кабинет и реальные кабинеты делят одну отметку «уже показывали».
 */
export function resolveOnboardingScope(userId: number | null = currentUserId()): string {
  return userId != null ? `user.${userId}` : GLOBAL_SCOPE
}

function listStorageKeys(): string[] {
  try {
    const keys: string[] = []
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key) {
        keys.push(key)
      }
    }
    return keys
  } catch {
    return []
  }
}

/**
 * Старые ключи: user.{id}.demo|global|cabinet.{id}.{tour}.completed|skipped.
 * Если тур уже проходили в любом из них — считаем страницу закрытой.
 */
function migrateLegacyTourFlag(
  tourId: OnboardingTourId,
  scope: string,
  userId: number | null,
): 'completed' | 'skipped' | null {
  const prefix = userId != null ? `${PREFIX}user.${userId}.` : PREFIX
  const completedKey = tourKey(scope, tourId, 'completed')
  const skippedKey = tourKey(scope, tourId, 'skipped')
  let foundCompleted = false
  let foundSkipped = false
  for (const key of listStorageKeys()) {
    if (!key.startsWith(prefix) || key === completedKey || key === skippedKey) {
      continue
    }
    if (key.endsWith(`.${tourId}.completed`) && readFlag(key)) {
      foundCompleted = true
    }
    if (key.endsWith(`.${tourId}.skipped`) && readFlag(key)) {
      foundSkipped = true
    }
  }
  if (!foundCompleted && !foundSkipped) {
    return null
  }
  const suffix = foundCompleted ? 'completed' : 'skipped'
  writeFlag(tourKey(scope, tourId, suffix))
  return suffix
}

export function isTourFinished(tourId: OnboardingTourId, scope: string = resolveOnboardingScope()): boolean {
  if (readFlag(tourKey(scope, tourId, 'completed')) || readFlag(tourKey(scope, tourId, 'skipped'))) {
    return true
  }
  return migrateLegacyTourFlag(tourId, scope, currentUserId()) != null
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
