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

interface Rect extends TargetRect {}

interface TooltipLayout {
  top: number
  left: number
  placement: OnboardingPlacement
}

function measureTargets(elements: HTMLElement[]): Rect | null {
  return measureTargetRect(elements)
}

function computeTooltipLayout(target: Rect, placement: OnboardingPlacement): TooltipLayout {
  const tooltipWidth = 320
  const tooltipHeight = 160
  const gap = 14
  const margin = 12
  const vw = window.innerWidth
  const vh = window.innerHeight

  let top = target.top + target.height + gap
  let left = target.left
  let resolvedPlacement = placement

  if (placement === 'bottom' && top + tooltipHeight > vh - margin) {
    resolvedPlacement = 'top'
  }
  if (placement === 'top' || resolvedPlacement === 'top') {
    top = target.top - tooltipHeight - gap
    resolvedPlacement = 'top'
  }
  if (top < margin) {
    top = target.top + target.height + gap
    resolvedPlacement = 'bottom'
  }

  left = Math.min(Math.max(margin, left), vw - tooltipWidth - margin)

  return { top, left, placement: resolvedPlacement }
}

function arrowStyle(placement: OnboardingPlacement, target: Rect, tooltipLeft: number): React.CSSProperties {
  const arrowSize = 10
  const centerX = target.left + target.width / 2
  const arrowLeft = Math.min(
    Math.max(arrowSize, centerX - tooltipLeft - arrowSize),
    320 - arrowSize * 2,
  )

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

export default function OnboardingTour() {
  const activeTourId = useOnboardingStore((s) => s.activeTourId)
  const stepIndex = useOnboardingStore((s) => s.stepIndex)
  const nextStep = useOnboardingStore((s) => s.nextStep)
  const skipTour = useOnboardingStore((s) => s.skipTour)
  const completeTour = useOnboardingStore((s) => s.completeTour)

  const overlayGuardUntilRef = useRef(0)
  const [overlayClickBlocked, setOverlayClickBlocked] = useState(false)

  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [tooltipLayout, setTooltipLayout] = useState<TooltipLayout | null>(null)
  const [stepText, setStepText] = useState('')

  const remeasure = useCallback(() => {
    if (activeTourId == null) {
      return
    }
    const tour = getTour(activeTourId)
    const step = tour.steps[stepIndex]
    if (!step) {
      return
    }
    setStepText(step.text)
    const elements = resolveTourTargetElements(step)
    if (elements.length === 0) {
      setTargetRect(null)
      setTooltipLayout({
        top: Math.max(12, window.innerHeight - 200),
        left: Math.max(12, (window.innerWidth - 320) / 2),
        placement: 'top',
      })
      return
    }
    const rect = measureTargets(elements)
    if (!rect) {
      return
    }
    const layout = computeTooltipLayout(rect, step.placement ?? 'bottom')
    setTargetRect(rect)
    setTooltipLayout(layout)
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
      scrollTargetsIntoView(el)
    }
    const timer = window.setTimeout(remeasure, 280)
    remeasure()
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(unblockTimer)
    }
  }, [activeTourId, stepIndex, remeasure, completeTour])

  useEffect(() => {
    if (activeTourId == null) {
      return
    }
    const onResize = () => remeasure()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
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

  return createPortal(
    <>
      <div
        role="presentation"
        onClick={handleOverlayClick}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: OVERLAY_Z,
          background: targetRect ? 'transparent' : 'rgba(15, 23, 42, 0.45)',
          pointerEvents: overlayClickBlocked ? 'none' : 'auto',
        }}
      />
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)',
            zIndex: OVERLAY_Z + 1,
            pointerEvents: 'none',
          }}
        />
      )}
      {tooltipLayout && (
        <div
          role="dialog"
          aria-live="polite"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: tooltipLayout.top,
            left: tooltipLayout.left,
            width: 320,
            zIndex: OVERLAY_Z + 2,
            background: '#fff',
            borderRadius: 12,
            padding: '16px 16px 14px',
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.18)',
          }}
        >
          {targetRect && (
            <div
              style={{
                position: 'absolute',
                width: 0,
                height: 0,
                ...arrowStyle(tooltipLayout.placement, targetRect, tooltipLayout.left),
              }}
            />
          )}
          <div style={{ fontSize: 14, lineHeight: 1.5, color: '#1E293B', marginBottom: 16, minHeight: 44 }}>
            {stepText}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>
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
