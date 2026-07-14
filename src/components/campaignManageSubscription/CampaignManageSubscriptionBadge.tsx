import { useCampaignManageAccess } from '../../hooks/useCampaignManageAccess'
import { useCampaignManageSubscriptionUi } from '../../store/campaignManageSubscriptionUi'
import { campaignManageDaysLabel } from '../../utils/campaignManageSubscription'

const accent = '#7C3AED'

export default function CampaignManageSubscriptionBadge() {
  const { showBadge, campaignManage } = useCampaignManageAccess()
  const openPlans = useCampaignManageSubscriptionUi((s) => s.openPlans)

  if (!showBadge || !campaignManage) {
    return null
  }

  let line1 = 'Бесплатный доступ'
  let line2 = 'Подключить Управление РК'
  let line2Clickable = true

  if (campaignManage.status === 'ACTIVE') {
    line1 = 'Управление РК подключено'
    const days = campaignManage.daysRemaining ?? 0
    line2 = days > 0 ? `Осталось ${campaignManageDaysLabel(days)}` : 'Осталось менее дня'
    line2Clickable = true
  } else if (campaignManage.status === 'EXPIRED') {
    line1 = 'Управление РК'
    const ago = campaignManage.daysExpiredAgo ?? 0
    line2 = ago > 0
      ? `Закончилось ${campaignManageDaysLabel(ago)} назад`
      : 'Закончилось сегодня'
  }

  return (
    <div
      style={{
        background: '#F1F5F9',
        borderRadius: 10,
        padding: '6px 12px',
        maxWidth: 220,
        lineHeight: 1.35,
      }}
    >
      <div style={{ fontSize: 12, color: '#1E293B', fontWeight: 500 }}>{line1}</div>
      {line2Clickable ? (
        <button
          type="button"
          onClick={openPlans}
          style={{
            margin: 0,
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 12,
            textAlign: 'left',
            color: accent,
            fontWeight: 600,
          }}
        >
          {line2}
        </button>
      ) : (
        <div style={{ fontSize: 12, color: '#64748B' }}>{line2}</div>
      )}
    </div>
  )
}
