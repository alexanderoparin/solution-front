import { isOnboardingNarrowViewport, type OnboardingStep } from './types'

const HIGHLIGHT_PADDING = 8
const CHROME_GAP = 16
const STICKY_CHROME_SELECTORS = '.app-header, .app-header-cabinet, .onboarding-sticky-chrome'
const MOBILE_SCROLL_PASSES = 3

export interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

/** Цель лежит в липкой шапке — страницу под неё не крутим. */
export function isInsideAppHeader(elements: HTMLElement[]): boolean {
  return elements.some((el) => el.closest('.app-header') != null)
}

export function isTourTargetPainted(element: HTMLElement): boolean {
  if (!element.isConnected) {
    return false
  }
  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false
  }
  const rect = element.getBoundingClientRect()
  return rect.width >= 2 && rect.height >= 2
}

/**
 * Нижняя граница липкой шапки (включая кабинет на второй строке) и учебной плашки.
 */
export function measureOnboardingChromeBottom(elements?: HTMLElement[]): number {
  if (typeof document === 'undefined') {
    return 8
  }
  if (elements != null && isInsideAppHeader(elements)) {
    return 8
  }
  let bottom = 0
  document.querySelectorAll(STICKY_CHROME_SELECTORS).forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return
    }
    const rect = node.getBoundingClientRect()
    if (rect.height > 0) {
      bottom = Math.max(bottom, rect.bottom)
    }
  })
  return Math.max(8, Math.ceil(bottom) + CHROME_GAP)
}

function collectScrollParents(element: HTMLElement): Array<HTMLElement | Window> {
  const parents: Array<HTMLElement | Window> = []
  let current: HTMLElement | null = element.parentElement
  while (current != null) {
    const style = window.getComputedStyle(current)
    const overflowY = style.overflowY
    const overflowX = style.overflowX
    const scrollableY =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')
      && current.scrollHeight > current.clientHeight + 1
    const scrollableX =
      (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'overlay')
      && current.scrollWidth > current.clientWidth + 1
    if (scrollableY || scrollableX) {
      parents.push(current)
    }
    current = current.parentElement
  }
  parents.push(window)
  return parents
}

function scrollDeltaY(delta: number, element: HTMLElement): void {
  let remaining = delta
  for (const parent of collectScrollParents(element)) {
    if (Math.abs(remaining) < 1) {
      return
    }
    if (parent instanceof HTMLElement) {
      const before = parent.scrollTop
      parent.scrollTop += remaining
      remaining -= parent.scrollTop - before
      continue
    }
    const before = window.scrollY
    window.scrollBy(0, remaining)
    remaining -= window.scrollY - before
  }
}

function scrollDeltaX(delta: number, element: HTMLElement): void {
  let remaining = delta
  for (const parent of collectScrollParents(element)) {
    if (Math.abs(remaining) < 1) {
      return
    }
    if (parent instanceof HTMLElement) {
      const before = parent.scrollLeft
      parent.scrollLeft += remaining
      remaining -= parent.scrollLeft - before
      continue
    }
    const before = window.scrollX
    window.scrollBy(remaining, 0)
    remaining -= window.scrollX - before
  }
}

function queryTourElements(targetId: string): HTMLElement[] {
  return Array.from(document.querySelectorAll(`[data-tour-id="${targetId}"]`))
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
    .filter(isTourTargetPainted)
}

/** Все элементы шага (несколько узлов с одним data-tour-id объединяются). */
export function resolveTourTargetElements(step: OnboardingStep): HTMLElement[] {
  const primary = queryTourElements(step.targetId)
  if (primary.length > 0) {
    return primary
  }
  if (step.fallbackTargetId) {
    return queryTourElements(step.fallbackTargetId)
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

function scrollDesktopIfOffscreen(elements: HTMLElement[]): void {
  const rect = measureTargetRect(elements)
  if (!rect) {
    return
  }
  const viewportH = window.innerHeight
  const centerY = rect.top + rect.height / 2
  if (centerY < 80 || centerY > viewportH - 80) {
    elements[0].scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
  }
}

/**
 * На мобилке — для любого тура: крутит страницу и внутренние скроллы,
 * пока цель не окажется в видимой зоне (ниже шапки, с запасом под подсказку).
 */
function scrollMobileTargetIntoSafeBand(
  elements: HTMLElement[],
  options?: { tooltipHeight?: number },
): void {
  const tooltipReserve = Math.max(168, options?.tooltipHeight ?? 168) + 28
  const chrome = measureOnboardingChromeBottom(elements)
  for (const el of elements) {
    el.style.scrollMarginTop = `${chrome}px`
    el.style.scrollMarginBottom = `${tooltipReserve}px`
  }
  elements[0].scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })

  for (let pass = 0; pass < MOBILE_SCROLL_PASSES; pass += 1) {
    const rect = measureTargetRect(elements)
    if (!rect) {
      return
    }
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth
    const safeTop = measureOnboardingChromeBottom(elements)
    const available = viewportH - safeTop - tooltipReserve
    const desiredTop = available < 48
      ? safeTop
      : safeTop + Math.max(8, (available - rect.height) / 2)
    const deltaY = rect.top - desiredTop
    if (Math.abs(deltaY) > 8) {
      scrollDeltaY(deltaY, elements[0])
    }

    const after = measureTargetRect(elements)
    if (!after) {
      return
    }
    if (after.left < 8) {
      scrollDeltaX(after.left - 8, elements[0])
    } else if (after.left + after.width > viewportW - 8) {
      scrollDeltaX(after.left + after.width - (viewportW - 8), elements[0])
    }

    const settled = measureTargetRect(elements)
    if (
      settled
      && Math.abs(settled.top - desiredTop) <= 12
      && settled.top >= safeTop - 4
    ) {
      return
    }
  }
}

/**
 * Крутит окно и внутренние скроллы, пока цель не окажется в видимой зоне.
 * На мобилке срабатывает на каждом шаге любого тура.
 */
export function scrollTargetsIntoView(
  elements: HTMLElement[],
  options?: { placement?: 'top' | 'bottom' | 'left' | 'right'; tooltipHeight?: number },
): void {
  if (elements.length === 0 || isInsideAppHeader(elements)) {
    return
  }
  if (isOnboardingNarrowViewport()) {
    scrollMobileTargetIntoSafeBand(elements, options)
    return
  }
  scrollDesktopIfOffscreen(elements)
}
