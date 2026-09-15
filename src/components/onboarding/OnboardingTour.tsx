import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from 'antd'
import { getTour } from '../../onboarding/tours'
import { resolveTourTargetElements, measureTargetRect, scrollTargetsIntoView } from '../../onboarding/resolveTarget'
import type { TargetRect } from '../../onboarding/resolveTarget'
import type { OnboardingPlacement } from '../../onboarding/types'
import { useOnboardingStore } from '../../store/onboardingStore'

const OVERLAY_Z = 10050
/** После смены шага блокируем клик по оверлею — иначе «Далее» после scrollIntoView попадает в skipTour. */
const OVERLAY_CLICK_GUARD_MS = 450
const MARGIN = 12
const GAP = 12
const NARROW_MAX = 900
const TOOLTIP_MAX_WIDTH = 320
const ESTIMATED_TOOLTIP_HEIGHT = 160

interface Rect extends TargetRect {}

interface TooltipLayout {
  top: number
  left: number
  width: number
  placement: OnboardingPlacement
}

function isNarrowViewport(): boolean {
  return window.innerWidth <= NARROW_MAX
}

function viewportTooltipWidth(): number {
  if (isNarrowViewport()) {
    return window.innerWidth - MARGIN * 2
  }
  return Math.min(TOOLTIP_MAX_WIDTH, window.innerWidth - MARGIN * 2)
}

function measureTargets(elements: HTMLElement[]): Rect | null {
  return measureTargetRect(elements)
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min
  }
  return Math.min(Math.max(min, value), max)
}

function computeTooltipLayout(
  target: Rect,
  preferred: OnboardingPlacement,
  tooltipSize: { width: number; height: number },
): TooltipLayout {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const tw = tooltipSize.width
  const th = tooltipSize.height
  const narrow = isNarrowViewport()

  if (narrow) {
    return {
      top: Math.max(MARGIN, vh - th - MARGIN),
      left: MARGIN,
      width: tw,
      placement: 'top',
    }
  }

  let placement: OnboardingPlacement = preferred

  const spaceBelow = vh - (target.top + target.height) - MARGIN
  const spaceAbove = target.top - MARGIN
  const spaceRight = vw - (target.left + target.width) - MARGIN
  const spaceLeft = target.left - MARGIN

  if (placement === 'bottom' && spaceBelow < th + GAP && spaceAbove > spaceBelow) {
    placement = 'top'
  } else if (placement === 'top' && spaceAbove < th + GAP && spaceBelow > spaceAbove) {
    placement = 'bottom'
  } else if (placement === 'right' && spaceRight < tw + GAP && spaceLeft > spaceRight) {
    placement = 'left'
  } else if (placement === 'left' && spaceLeft < tw + GAP && spaceRight > spaceLeft) {
    placement = 'right'
  }

  if ((placement === 'left' || placement === 'right') && Math.max(spaceLeft, spaceRight) < tw + GAP) {
    placement = spaceBelow >= spaceAbove ? 'bottom' : 'top'
  }

  let top: number
  let left: number
  if (placement === 'bottom') {
    top = target.top + target.height + GAP
    left = target.left + target.width / 2 - tw / 2
  } else if (placement === 'top') {
    top = target.top - th - GAP
    left = target.left + target.width / 2 - tw / 2
  } else if (placement === 'right') {
    left = target.left + target.width + GAP
    top = target.top + target.height / 2 - th / 2
  } else {
    left = target.left - tw - GAP
    top = target.top + target.height / 2 - th / 2
  }

  left = clamp(left, MARGIN, vw - tw - MARGIN)
  top = clamp(top, MARGIN, vh - th - MARGIN)

  return { top, left, width: tw, placement }
}

function arrowStyle(
  placement: OnboardingPlacement,
  target: Rect,
  tooltip: TooltipLayout,
  tooltipHeight: number,
): React.CSSProperties {
  const arrowSize = 10
  if (placement === 'top' || placement === 'bottom') {
    const centerX = target.left + target.width / 2
    const arrowLeft = clamp(centerX - tooltip.left - arrowSize, arrowSize, tooltip.width - arrowSize * 2)
    if (placement === 'top') {
      return {
        bottom: -arrowSize,
        left: arrowLeft,
        borderLeft: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid transparent`,
        borderTop: `${arrowSize}px solid #fff`,
      }
    }
    return {
      top: -arrowSize,
      left: arrowLeft,
      borderLeft: `${arrowSize}px solid transparent`,
      borderRight: `${arrowSize}px solid transparent`,
      borderBottom: `${arrowSize}px solid #fff`,
    }
  }

  const centerY = target.top + target.height / 2
  const arrowTop = clamp(centerY - tooltip.top - arrowSize, arrowSize, Math.max(arrowSize, tooltipHeight - arrowSize * 2))
  if (placement === 'left') {
    return {
      right: -arrowSize,
      top: arrowTop,
      borderTop: `${arrowSize}px solid transparent`,
      borderBottom: `${arrowSize}px solid transparent`,
      borderLeft: `${arrowSize}px solid #fff`,
    }
  }
  return {
    left: -arrowSize,
    top: arrowTop,
    borderTop: `${arrowSize}px solid transparent`,
    borderBottom: `${arrowSize}px solid transparent`,
    borderRight: `${arrowSize}px solid #fff`,
  }
}

function capTargetRect(rect: Rect, tooltipHeight: number): Rect {
  const vh = window.innerHeight
  const reservedBottom = isNarrowViewport() ? tooltipHeight + GAP + MARGIN : MARGIN
  const maxBottom = vh - reservedBottom
  const top = clamp(rect.top, 8, Math.max(8, maxBottom - 72))
  const bottom = Math.min(rect.top + rect.height, maxBottom)
  return {
    ...rect,
    top,
    height: Math.max(48, bottom - top),
  }
}

function clampHighlight(rect: Rect): Rect {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const left = Math.max(4, rect.left)
  const top = Math.max(4, rect.top)
  const right = Math.min(vw - 4, rect.left + rect.width)
  const bottom = Math.min(vh - 4, rect.top + rect.height)
  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  }
}

export default function OnboardingTour() {
  const activeTourId = useOnboardingStore((s) => s.activeTourId)
  const stepIndex = useOnboardingStore((s) => s.stepIndex)
  const nextStep = useOnboardingStore((s) => s.nextStep)
  const skipTour = useOnboardingStore((s) => s.skipTour)
  const completeTour = useOnboardingStore((s) => s.completeTour)

  const overlayGuardUntilRef = useRef(0)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const [overlayClickBlocked, setOverlayClickBlocked] = useState(false)

  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [tooltipLayout, setTooltipLayout] = useState<TooltipLayout | null>(null)
  const [stepText, setStepText] = useState('')
  const [preferredPlacement, setPreferredPlacement] = useState<OnboardingPlacement>('bottom')

  const remeasure = useCallback(() => {
    if (activeTourId == null) {
      return
    }
    const tour = getTour(activeTourId)
    const step = tour.steps[stepIndex]
    if (!step) {
      return
    }
    const placement = step.placement ?? 'bottom'
    setStepText(step.text)
    setPreferredPlacement(placement)
    const elements = resolveTourTargetElements(step)
    const tooltipWidth = viewportTooltipWidth()
    const measuredNode = tooltipRef.current
    const tooltipSize = {
      width: measuredNode?.offsetWidth || tooltipWidth,
      height: measuredNode?.offsetHeight || ESTIMATED_TOOLTIP_HEIGHT,
    }
    if (elements.length === 0) {
      setTargetRect(null)
      setTooltipLayout({
        top: Math.max(MARGIN, window.innerHeight - tooltipSize.height - MARGIN),
        left: Math.max(MARGIN, (window.innerWidth - tooltipSize.width) / 2),
        width: tooltipSize.width,
        placement: 'top',
      })
      return
    }
    const rect = measureTargets(elements)
    if (!rect) {
      return
    }
    const fitted = capTargetRect(rect, tooltipSize.height)
    setTargetRect(fitted)
    setTooltipLayout(computeTooltipLayout(fitted, placement, tooltipSize))
  }, [activeTourId, stepIndex])

  useLayoutEffect(() => {
    if (activeTourId == null) {
      setTargetRect(null)
      setTooltipLayout(null)
      return
    }
    const tour = getTour(activeTourId)
    const step = tour.steps[stepIndex]
    if (!step) {
      if (stepIndex >= tour.steps.length) {
        completeTour()
      }
      return
    }
    overlayGuardUntilRef.current = Date.now() + OVERLAY_CLICK_GUARD_MS
    setOverlayClickBlocked(true)
    const unblockTimer = window.setTimeout(() => {
      setOverlayClickBlocked(false)
    }, OVERLAY_CLICK_GUARD_MS)
    const el = resolveTourTargetElements(step)
    if (el.length > 0) {
      scrollTargetsIntoView(el, { placement: step.placement ?? 'bottom' })
    }
    const timer = window.setTimeout(remeasure, 280)
    remeasure()
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(unblockTimer)
    }
  }, [activeTourId, stepIndex, remeasure, completeTour])

  useLayoutEffect(() => {
    const node = tooltipRef.current
    const rect = targetRect
    if (node == null || rect == null) {
      return
    }
    const size = { width: node.offsetWidth, height: node.offsetHeight }
    const fitted = capTargetRect(rect, size.height)
    if (
      fitted.top !== rect.top
      || fitted.left !== rect.left
      || fitted.width !== rect.width
      || fitted.height !== rect.height
    ) {
      setTargetRect(fitted)
    }
    const next = computeTooltipLayout(fitted, preferredPlacement, size)
    setTooltipLayout((prev) => {
      if (
        prev
        && prev.top === next.top
        && prev.left === next.left
        && prev.width === next.width
        && prev.placement === next.placement
      ) {
        return prev
      }
      return next
    })
  }, [targetRect, stepText, preferredPlacement])

  useEffect(() => {
    if (activeTourId == null) {
      return
    }
    const onResize = () => remeasure()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    window.visualViewport?.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
      window.visualViewport?.removeEventListener('resize', onResize)
    }
  }, [activeTourId, remeasure])

  const handleOverlayClick = useCallback(() => {
    if (overlayClickBlocked || Date.now() < overlayGuardUntilRef.current) {
      return
    }
    skipTour()
  }, [overlayClickBlocked, skipTour])

  if (activeTourId == null || typeof document === 'undefined') {
    return null
  }

  const tour = getTour(activeTourId)
  const total = tour.steps.length
  const isLast = stepIndex >= total - 1
  const highlight = targetRect ? clampHighlight(targetRect) : null
  const tooltipWidth = tooltipLayout?.width ?? viewportTooltipWidth()
  const tooltipHeight = tooltipRef.current?.offsetHeight ?? ESTIMATED_TOOLTIP_HEIGHT
  const narrow = typeof window !== 'undefined' && isNarrowViewport()

  return createPortal(
    <>
      <div
        role="presentation"
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: OVERLAY_Z,
          background: highlight ? 'transparent' : 'rgba(15, 23, 42, 0.45)',
          pointerEvents: overlayClickBlocked ? 'none' : 'auto',
        }}
      />
      {highlight && (
        <div
          style={{
            position: 'fixed',
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)',
            zIndex: OVERLAY_Z + 1,
            pointerEvents: 'none',
          }}
        />
      )}
      {tooltipLayout && (
        <div
          ref={tooltipRef}
          className="onboarding-tooltip"
          role="dialog"
          aria-live="polite"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: tooltipLayout.top,
            left: tooltipLayout.left,
            width: tooltipWidth,
            maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
            maxHeight: `calc(100vh - ${MARGIN * 2}px)`,
            overflowY: 'auto',
            zIndex: OVERLAY_Z + 2,
            background: '#fff',
            borderRadius: 12,
            padding: narrow ? '12px 12px 10px' : '16px 16px 14px',
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.18)',
            boxSizing: 'border-box',
          }}
        >
          {targetRect && (
            <div
              style={{
                position: 'absolute',
                width: 0,
                height: 0,
                ...arrowStyle(tooltipLayout.placement, targetRect, tooltipLayout, tooltipHeight),
              }}
            />
          )}
          <div style={{ fontSize: 14, lineHeight: 1.45, color: '#1E293B', marginBottom: 12 }}>
            {stepText}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#64748B', flexShrink: 0 }}>
              {stepIndex + 1} из {total}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={skipTour}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#64748B',
                  textDecoration: 'underline',
                }}
              >
                пропустить
              </button>
              <Button
                type="primary"
                size="small"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  nextStep()
                }}
                style={{ background: '#7C3AED', borderColor: '#7C3AED' }}
              >
                {isLast ? 'Готово' : 'Далее'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  )
}
