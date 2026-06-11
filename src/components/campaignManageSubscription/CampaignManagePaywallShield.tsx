import type { ReactNode } from 'react'
import { useCampaignManageSubscriptionUi } from '../../store/campaignManageSubscriptionUi'

interface CampaignManagePaywallShieldProps {
  active: boolean
  children: ReactNode
}

/** Перехватывает клики по интерактивной зоне и открывает paywall. */
export default function CampaignManagePaywallShield({ active, children }: CampaignManagePaywallShieldProps) {
  const openPaywall = useCampaignManageSubscriptionUi((s) => s.openPaywall)

  if (!active) {
    return <>{children}</>
  }

  return (
    <div style={{ position: 'relative' }}>
      {children}
      <div
        role="button"
        tabIndex={0}
        aria-label="Требуется подписка"
        onClick={() => openPaywall()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openPaywall()
          }
        }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          cursor: 'not-allowed',
          background: 'transparent',
        }}
      />
    </div>
  )
}
