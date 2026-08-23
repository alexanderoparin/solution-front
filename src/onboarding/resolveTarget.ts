import type { OnboardingStep } from './types'

const HIGHLIGHT_PADDING = 8

export interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

/** Все элементы шага (несколько узлов с одним data-tour-id объединяются). */
export function resolveTourTargetElements(step: OnboardingStep): HTMLElement[] {
  const primary = Array.from(document.querySelectorAll(`[data-tour-id="${step.targetId}"]`))
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
  if (primary.length > 0) {
    return primary
  }
  if (step.fallbackTargetId) {
    const fallback = document.querySelector(`[data-tour-id="${step.fallbackTargetId}"]`)
    if (fallback instanceof HTMLElement) {
      return [fallback]
    }
  }
  return []
}

export function measureTargetRect(elements: HTMLElement[]): TargetRect | null {
  if (elements.length === 0) {
    return null
  }
  let top = Number.POSITIVE_INFINITY
  let left = Number.POSITIVE_INFINITY
  let right = Number.NEGATIVE_INFINITY
  let bottom = Number.NEGATIVE_INFINITY
  for (const el of elements) {
    const r = el.getBoundingClientRect()
    top = Math.min(top, r.top)
    left = Math.min(left, r.left)
    right = Math.max(right, r.right)
    bottom = Math.max(bottom, r.bottom)
  }
  return {
    top: top - HIGHLIGHT_PADDING,
    left: left - HIGHLIGHT_PADDING,
    width: right - left + HIGHLIGHT_PADDING * 2,
    height: bottom - top + HIGHLIGHT_PADDING * 2,
  }
}

export function scrollTargetsIntoView(elements: HTMLElement[]): void {
  if (elements.length === 0) {
    return
  }
  const rect = measureTargetRect(elements)
  if (!rect) {
    return
  }
  const centerY = rect.top + rect.height / 2
  const viewportH = window.innerHeight
  if (centerY < 80 || centerY > viewportH - 80) {
    elements[0].scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
  }
}
