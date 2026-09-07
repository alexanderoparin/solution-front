import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getStoredCabinetId, subscribeStoredCabinetId } from '../../api/cabinets'
import { ACCESS_STATUS_QUERY_KEY, ACCESS_STATUS_STALE_MS, userApi } from '../../api/user'
import {
  consumePendingTour,
  isOnboardingDemoMode,
  isTourFinished,
  resolveOnboardingScope,
  subscribeOnboardingDemoMode,
} from '../../onboarding/storage'
import { getTour } from '../../onboarding/tours'
import { resolveOptionalTourIdForPath, matchesTourPath } from '../../onboarding/resolveTourForPath'
import { resolveTourTargetElements } from '../../onboarding/resolveTarget'
import { isOnboardingTourId, type OnboardingTourId } from '../../onboarding/types'
import { useAuthStore } from '../../store/authStore'
import { useOnboardingStore } from '../../store/onboardingStore'
import OnboardingSkipHint from './OnboardingSkipHint'
import OnboardingTour from './OnboardingTour'

const AUTO_START_INITIAL_DELAY_MS = 400
const AUTO_START_RETRY_MS = 300
const AUTO_START_GIVE_UP_MS = 15000

function parseTourParam(value: string | null): OnboardingTourId | null {
  return isOnboardingTourId(value) ? value : null
}

function canAutoStartNow(tourId: OnboardingTourId, scope: string): boolean {
  const state = useOnboardingStore.getState()
  if (state.activeTourId != null || state.skipHintVisible) {
    return false
  }
  return !isTourFinished(tourId, scope)
}

/** Не стартовать тур поверх модалки («Принято», добавить кабинет и т.п.). */
function isBlockingModalOpen(): boolean {
  const wraps = document.querySelectorAll('.ant-modal-wrap')
  for (let i = 0; i < wraps.length; i += 1) {
    const wrap = wraps[i]
    if (!(wrap instanceof HTMLElement)) {
      continue
    }
    const style = window.getComputedStyle(wrap)
    if (style.display !== 'none' && style.visibility !== 'hidden') {
      return true
    }
  }
  return false
}

/**
 * Глобальный слой обучалки: активный тур, подсказка после «пропустить», автозапуск
 * при первом визите страницы в текущем кабинете, на учебной витрине и в профиле
 * (профиль — только после подтверждения почты).
 */
export default function OnboardingProvider() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const startTour = useOnboardingStore((s) => s.startTour)
  const cancelTour = useOnboardingStore((s) => s.cancelTour)
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)
  const { data: access } = useQuery({
    queryKey: ACCESS_STATUS_QUERY_KEY,
    queryFn: () => userApi.getAccessStatus(),
    enabled: Boolean(token) && role !== 'ADMIN',
    staleTime: ACCESS_STATUS_STALE_MS,
  })
  const emailConfirmed = access?.emailConfirmed === true
  const [cabinetId, setCabinetId] = useState<number | null>(() => getStoredCabinetId())
  const [demoMode, setDemoMode] = useState(() => isOnboardingDemoMode())
  const previousCabinetIdRef = useRef(cabinetId)

  useEffect(() => subscribeStoredCabinetId(setCabinetId), [])
  useEffect(() => subscribeOnboardingDemoMode(setDemoMode), [])

  useEffect(() => {
    if (demoMode) {
      previousCabinetIdRef.current = cabinetId
      return
    }
    if (previousCabinetIdRef.current === cabinetId) {
      return
    }
    previousCabinetIdRef.current = cabinetId
    cancelTour()
  }, [cabinetId, demoMode, cancelTour])

  useEffect(() => {
    const tourFromQuery = parseTourParam(searchParams.get('tour'))
    const force = searchParams.get('force') === '1'
    if (tourFromQuery != null) {
      const next = new URLSearchParams(searchParams)
      next.delete('tour')
      next.delete('force')
      setSearchParams(next, { replace: true })
      const scope = resolveOnboardingScope(cabinetId)
      if (force || !isTourFinished(tourFromQuery, scope)) {
        window.setTimeout(() => startTour(tourFromQuery), AUTO_START_INITIAL_DELAY_MS)
      }
      return
    }

    const pending = consumePendingTour()
    if (pending != null && !isTourFinished(pending, resolveOnboardingScope(cabinetId))) {
      const tour = getTour(pending)
      if (!matchesTourPath(location.pathname, tour)) {
        navigate(`${tour.pathPrefix}?tour=${pending}`, { replace: true })
        return
      }
      window.setTimeout(() => startTour(pending), AUTO_START_INITIAL_DELAY_MS)
    }
  }, [location.pathname, navigate, searchParams, setSearchParams, startTour, cabinetId])

  const autoStartKey = demoMode ? 'demo' : String(cabinetId ?? '')

  useEffect(() => {
    if (role === 'ADMIN') {
      return
    }
    if (searchParams.get('tour') != null) {
      return
    }
    const tourId = resolveOptionalTourIdForPath(location.pathname)
    if (tourId == null) {
      return
    }
    // Профиль — после подтверждения почты, даже без кабинета.
    // Аналитика и реклама — только с кабинетом или на учебной витрине.
    if (tourId === 'profile' && !emailConfirmed) {
      return
    }
    if (!demoMode && cabinetId == null && tourId !== 'profile') {
      return
    }
    const scope = resolveOnboardingScope(cabinetId)
    if (!canAutoStartNow(tourId, scope)) {
      return
    }

    let cancelled = false
    let timeoutId = 0
    let waitStartedAt: number | null = null

    const tryStart = () => {
      if (cancelled) {
        return
      }
      const currentScope = resolveOnboardingScope(getStoredCabinetId())
      if (!canAutoStartNow(tourId, currentScope)) {
        return
      }
      if (isBlockingModalOpen()) {
        waitStartedAt = null
        timeoutId = window.setTimeout(tryStart, AUTO_START_RETRY_MS)
        return
      }
      if (waitStartedAt == null) {
        waitStartedAt = Date.now()
      }
      const firstStep = getTour(tourId).steps[0]
      const hasTarget = firstStep != null && resolveTourTargetElements(firstStep).length > 0
      if (hasTarget || Date.now() - waitStartedAt >= AUTO_START_GIVE_UP_MS) {
        if (hasTarget) {
          startTour(tourId)
        }
        return
      }
      timeoutId = window.setTimeout(tryStart, AUTO_START_RETRY_MS)
    }

    timeoutId = window.setTimeout(tryStart, AUTO_START_INITIAL_DELAY_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [location.pathname, autoStartKey, demoMode, emailConfirmed, role, startTour, searchParams])

  return (
    <>
      <OnboardingTour />
      <OnboardingSkipHint />
    </>
  )
}
