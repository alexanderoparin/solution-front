import { useCampaignManageSubscriptionUi } from '../../store/campaignManageSubscriptionUi'
import CampaignManagePlansModal from './CampaignManagePlansModal'
import CampaignManagePaywallModal from './CampaignManagePaywallModal'

/** Глобальные модалки подписки на Управление РК. */
export default function CampaignManageSubscriptionModals() {
  const plansOpen = useCampaignManageSubscriptionUi((s) => s.plansOpen)
  const paywallOpen = useCampaignManageSubscriptionUi((s) => s.paywallOpen)
  const closePlans = useCampaignManageSubscriptionUi((s) => s.closePlans)
  const closePaywall = useCampaignManageSubscriptionUi((s) => s.closePaywall)

  return (
    <>
      <CampaignManagePlansModal open={plansOpen} onClose={closePlans} />
      <CampaignManagePaywallModal open={paywallOpen} onClose={closePaywall} />
    </>
  )
}
