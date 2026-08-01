import { useNavigate } from 'react-router-dom'
import { useCampaignManageAccess } from '../../hooks/useCampaignManageAccess'
import { useCampaignManageSubscriptionUi } from '../../store/campaignManageSubscriptionUi'
import { campaignManageDaysLabel } from '../../utils/campaignManageSubscription'

/**
 * Бейдж тарифа в шапке: на FREE предлагает PRO; при активной/истёкшей услуге РК — статус по дням.
 */
export default function CampaignManageSubscriptionBadge() {
  const navigate = useNavigate()
  const { showBadge, campaignManage } = useCampaignManageAccess()
  const openPlans = useCampaignManageSubscriptionUi((s) => s.openPlans)

  if (!showBadge || !campaignManage) {
    return null
  }

  let line1 = 'Бесплатный доступ'
  let line2 = 'Перейти на PRO'
  let onLine2Click: () => void = () => navigate('/subscription')

  if (campaignManage.status === 'ACTIVE') {
    line1 = 'Управление РК подключено'
    const days = campaignManage.daysRemaining ?? 0
    line2 = days > 0 ? `Осталось ${campaignManageDaysLabel(days)}` : 'Осталось менее дня'
    onLine2Click = openPlans
  } else if (campaignManage.status === 'EXPIRED') {
    line1 = 'Управление РК'
    const ago = campaignManage.daysExpiredAgo ?? 0
    line2 = ago > 0
      ? `Закончилось ${campaignManageDaysLabel(ago)} назад`
      : 'Закончилось сегодня'
    onLine2Click = () => navigate('/subscription')
  }

  return (
    <div
      style={{
        background: 'rgba(124, 58, 237, 0.22)',
        border: '1px solid rgba(167, 139, 250, 0.4)',
        borderRadius: 10,
        padding: '6px 12px',
        maxWidth: 220,
        lineHeight: 1.35,
      }}
    >
      <div style={{ fontSize: 12, color: '#E9D5FF', fontWeight: 500 }}>{line1}</div>
      <button
        type="button"
        onClick={onLine2Click}
        style={{
          margin: 0,
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: 12,
          textAlign: 'left',
          color: '#C4B5FD',
          fontWeight: 600,
        }}
      >
        {line2}
      </button>
    </div>
  )
}
