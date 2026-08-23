import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { matchesTourIdPath } from '../../onboarding/resolveTourForPath'
import { getTour } from '../../onboarding/tours'
import { useOnboardingStore } from '../../store/onboardingStore'
import type { OnboardingTourId } from '../../onboarding/types'
import { ONBOARDING_TARGETS } from '../../onboarding/targets'

interface OnboardingHelpButtonProps {
  /** Какой тур запускать по умолчанию с текущей страницы */
  defaultTourId?: OnboardingTourId
}

export default function OnboardingHelpButton({ defaultTourId = 'profile' }: OnboardingHelpButtonProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const startTour = useOnboardingStore((s) => s.startTour)
  const activeTourId = useOnboardingStore((s) => s.activeTourId)

  const handleClick = useCallback(() => {
    if (!matchesTourIdPath(location.pathname, defaultTourId)) {
      const tour = getTour(defaultTourId)
      navigate(`${tour.pathPrefix}?tour=${defaultTourId}&force=1`)
      return
    }
    startTour(defaultTourId)
  }, [defaultTourId, location.pathname, navigate, startTour])

  return (
    <Tooltip title="Обучение по сервису">
      <Button
        type="text"
        aria-label="Обучение по сервису"
        data-tour-id={ONBOARDING_TARGETS.HELP_BUTTON}
        icon={<QuestionCircleOutlined style={{ fontSize: 18 }} />}
        onClick={handleClick}
        disabled={activeTourId != null}
        style={{
          color: '#CBD5E1',
          width: 36,
          height: 36,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    </Tooltip>
  )
}
