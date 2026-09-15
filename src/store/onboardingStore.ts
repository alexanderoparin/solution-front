import { create } from 'zustand'
import { markTourCompleted, markTourSkipped } from '../onboarding/storage'
import { getTour } from '../onboarding/tours'
import { isOnboardingStepVisible, type OnboardingTourId } from '../onboarding/types'

interface OnboardingState {
  activeTourId: OnboardingTourId | null
  stepIndex: number
  skipHintVisible: boolean
  startTour: (tourId: OnboardingTourId) => void
  /** Сбросить активный тур без отметки «пройден / пропущен». */
  cancelTour: () => void
  nextStep: () => void
  skipTour: () => void
  completeTour: () => void
  closeSkipHint: () => void
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  activeTourId: null,
  stepIndex: 0,
  skipHintVisible: false,

  startTour: (tourId) => {
    const steps = getTour(tourId).steps
    let index = 0
    while (index < steps.length && !isOnboardingStepVisible(steps[index])) {
      index += 1
    }
    if (index >= steps.length) {
      return
    }
    set({ activeTourId: tourId, stepIndex: index, skipHintVisible: false })
  },

  cancelTour: () => {
    set({ activeTourId: null, stepIndex: 0, skipHintVisible: false })
  },

  nextStep: () => {
    const { activeTourId, stepIndex } = get()
    if (activeTourId == null) {
      return
    }
    const tour = getTour(activeTourId)
    let next = stepIndex + 1
    while (next < tour.steps.length && !isOnboardingStepVisible(tour.steps[next])) {
      next += 1
    }
    if (next >= tour.steps.length) {
      markTourCompleted(activeTourId)
      set({ activeTourId: null, stepIndex: 0, skipHintVisible: false })
      return
    }
    set({ stepIndex: next })
  },

  skipTour: () => {
    const { activeTourId } = get()
    if (activeTourId == null) {
      return
    }
    markTourSkipped(activeTourId)
    set({ activeTourId: null, stepIndex: 0, skipHintVisible: true })
  },

  completeTour: () => {
    const { activeTourId } = get()
    if (activeTourId != null) {
      markTourCompleted(activeTourId)
    }
    set({ activeTourId: null, stepIndex: 0, skipHintVisible: false })
  },

  closeSkipHint: () => {
    set({ skipHintVisible: false })
  },
}))
