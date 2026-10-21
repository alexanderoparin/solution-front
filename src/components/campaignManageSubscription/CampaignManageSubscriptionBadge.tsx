import { useNavigate } from 'react-router-dom'
import { useCampaignManageAccess } from '../../hooks/useCampaignManageAccess'
import { useCampaignManageSubscriptionUi } from '../../store/campaignManageSubscriptionUi'
import { ONBOARDING_TARGETS } from '../../onboarding/targets'
import {
  campaignManageDaysLabel,
  campaignManageDaysRemainingPhrase,
} from '../../utils/campaignManageSubscription'

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
  let shortLabel = 'FREE'
  let onLine2Click: () => void = () => navigate('/subscription')

  if (campaignManage.status === 'PRO' || onPro) {
    // В шапке — коротко, без «до N кабинетов · период» (полный name — в профиле/подписке).
    line1 = proTariffLabel.includes('промокод') ? proTariffLabel : 'Полный доступ'
    const days = proDaysRemaining ?? campaignManage.daysRemaining ?? 0
    line2 = campaignManageDaysRemainingPhrase(days)
    shortLabel = 'PRO'
    onLine2Click = () => navigate('/profile')
  } else if (campaignManage.status === 'ACTIVE') {
    line1 = 'Управление РК подключено'
    const days = campaignManage.daysRemaining ?? 0
    line2 = campaignManageDaysRemainingPhrase(days)
    shortLabel = 'РК'
    onLine2Click = openPlans
  } else if (campaignManage.status === 'EXPIRED') {
    line1 = 'Управление РК'
    const ago = campaignManage.daysExpiredAgo ?? 0
    const agoMod10 = ago % 10
    const agoMod100 = ago % 100
    const agoVerb = agoMod10 === 1 && agoMod100 !== 11 ? 'Закончился' : 'Закончилось'
    line2 = ago > 0
      ? `${agoVerb} ${campaignManageDaysLabel(ago)} назад`
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
