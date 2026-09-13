import { useNavigate } from 'react-router-dom'
import { useCampaignManageAccess } from '../../hooks/useCampaignManageAccess'
import { useCampaignManageSubscriptionUi } from '../../store/campaignManageSubscriptionUi'
import { ONBOARDING_TARGETS } from '../../onboarding/targets'
import { campaignManageDaysLabel } from '../../utils/campaignManageSubscription'

/**
 * Бейдж тарифа в шапке: на FREE предлагает PRO; при активной/истёкшей услуге РК — статус по дням.
 */
export default function CampaignManageSubscriptionBadge() {
  const navigate = useNavigate()
  const {
    showBadge,
    campaignManage,
    onPro,
    proTariffLabel,
    proDaysRemaining,
  } = useCampaignManageAccess()
  const openPlans = useCampaignManageSubscriptionUi((s) => s.openPlans)

  if (!showBadge || !campaignManage) {
    return null
  }

  let line1 = 'Бесплатный доступ'
  let line2 = 'Перейти на PRO'
  let shortLabel = 'PRO'
  let onLine2Click: () => void = () => navigate('/subscription')

  if (campaignManage.status === 'PRO' || onPro) {
    line1 = proTariffLabel
    const days = proDaysRemaining ?? campaignManage.daysRemaining ?? 0
    line2 = days > 0 ? `Осталось ${campaignManageDaysLabel(days)}` : 'Осталось менее дня'
    shortLabel = 'PRO'
    onLine2Click = () => navigate('/profile')
  } else if (campaignManage.status === 'ACTIVE') {
    line1 = 'Управление РК подключено'
    const days = campaignManage.daysRemaining ?? 0
    line2 = days > 0 ? `Осталось ${campaignManageDaysLabel(days)}` : 'Осталось менее дня'
    shortLabel = 'РК'
    onLine2Click = openPlans
  } else if (campaignManage.status === 'EXPIRED') {
    line1 = 'Управление РК'
    const ago = campaignManage.daysExpiredAgo ?? 0
    line2 = ago > 0
      ? `Закончилось ${campaignManageDaysLabel(ago)} назад`
      : 'Закончилось сегодня'
    shortLabel = 'РК'
    onLine2Click = () => navigate('/subscription')
  }

  return (
    <button
      type="button"
      className="header-subscription-badge"
      data-tour-id={ONBOARDING_TARGETS.SUBSCRIPTION_BADGE}
      title={`${line1}. ${line2}`}
      aria-label={`${line1}. ${line2}`}
      onClick={onLine2Click}
    >
      <span className="header-subscription-badge-full">
        <span className="header-subscription-badge-title">{line1}</span>
        <span className="header-subscription-badge-action">{line2}</span>
      </span>
      <span className="header-subscription-badge-short">{shortLabel}</span>
    </button>
  )
}
