import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from 'antd'
import { ONBOARDING_TARGETS } from '../../onboarding/targets'
import { useOnboardingStore } from '../../store/onboardingStore'

const Z = 10060

export default function OnboardingSkipHint() {
  const visible = useOnboardingStore((s) => s.skipHintVisible)
  const closeSkipHint = useOnboardingStore((s) => s.closeSkipHint)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)

  const remeasure = useCallback(() => {
    const el = document.querySelector(`[data-tour-id="${ONBOARDING_TARGETS.HELP_BUTTON}"]`)
    if (el instanceof HTMLElement) {
      setAnchor(el.getBoundingClientRect())
    } else {
      setAnchor(null)
    }
  }, [])

  useLayoutEffect(() => {
    if (!visible) {
      setAnchor(null)
      return
    }
    remeasure()
  }, [visible, remeasure])

  useEffect(() => {
    if (!visible) {
      return
    }
    window.addEventListener('resize', remeasure)
    return () => window.removeEventListener('resize', remeasure)
  }, [visible, remeasure])

  if (!visible || typeof document === 'undefined') {
    return null
  }

  const margin = 12
  const tooltipWidth = Math.min(300, window.innerWidth - margin * 2)
  const top = anchor ? Math.min(anchor.bottom + 12, window.innerHeight - 180) : 72
  const left = anchor
    ? Math.min(Math.max(margin, anchor.left + anchor.width / 2 - tooltipWidth / 2), window.innerWidth - tooltipWidth - margin)
    : Math.max(margin, window.innerWidth - tooltipWidth - 24)

  return createPortal(
    <>
      <div
        role="presentation"
        onClick={closeSkipHint}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: Z,
          background: 'rgba(15, 23, 42, 0.35)',
        }}
      />
      <div
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top,
          left,
          width: tooltipWidth,
          zIndex: Z + 1,
          background: '#fff',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.18)',
        }}
      >
        {anchor && (
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: Math.min(
                Math.max(10, anchor.left + anchor.width / 2 - left - 10),
                tooltipWidth - 20,
              ),
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderBottom: '10px solid #fff',
            }}
          />
        )}
        <div style={{ fontSize: 14, lineHeight: 1.5, color: '#1E293B', marginBottom: 14 }}>
          Вы всегда можете продолжить обучение, нажав сюда
        </div>
        <Button type="primary" block onClick={closeSkipHint} style={{ background: '#7C3AED', borderColor: '#7C3AED' }}>
          ОК
        </Button>
      </div>
    </>,
    document.body,
  )
}
