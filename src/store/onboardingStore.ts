import { create } from 'zustand'
import { markTourCompleted, markTourSkipped } from '../onboarding/storage'
import { getTour } from '../onboarding/tours'
import type { OnboardingTourId } from '../onboarding/types'

interface OnboardingState {
  activeTourId: OnboardingTourId | null
  stepIndex: number
  skipHintVisible: boolean
  startTour: (tourId: OnboardingTourId) => void
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
    set({ activeTourId: tourId, stepIndex: 0, skipHintVisible: false })
  },

  nextStep: () => {
    const { activeTourId, stepIndex } = get()
    if (activeTourId == null) {
      return
    }
    const tour = getTour(activeTourId)
    if (stepIndex + 1 >= tour.steps.length) {
      markTourCompleted(activeTourId)
      set({ activeTourId: null, stepIndex: 0, skipHintVisible: false })
      return
    }
    set({ stepIndex: stepIndex + 1 })
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
