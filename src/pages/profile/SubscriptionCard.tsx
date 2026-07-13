import { Card, Button, Typography } from 'antd'
import { CreditCardOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import type { ProfileSubscriptionSummary } from '../../types/api'

dayjs.locale('ru')

const { Text } = Typography

const border = '#E2E8F0'

interface SubscriptionCardProps {
  subscription: ProfileSubscriptionSummary | null | undefined
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  return dayjs(dateString).format('DD.MM.YYYY')
}

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const navigate = useNavigate()

  const planName = subscription?.planName ?? '—'
  const statusLabel = subscription?.statusLabel ?? '—'
  const isActive = subscription?.active === true
  const isFreePlan = Boolean(subscription?.freePlanHint)
  const expiresAt = isFreePlan ? 'Бессрочно' : formatDateTime(subscription?.expiresAt)
  const nextBillingAt = isFreePlan ? '—' : formatDateTime(subscription?.nextBillingAt)
  const autoRenewLabel = subscription?.autoRenew ? 'Включено' : 'Выключено'

  const StatItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ minWidth: 180 }}>
      <Text type="secondary">{label}</Text>
      <div style={{ marginTop: 4, fontWeight: 600, lineHeight: '20px' }}>{value}</div>
    </div>
  )

  return (
    <Card
      title="Подписка"
      style={{
        borderRadius: 16,
        border: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <StatItem label="Тариф" value={planName} />
        <StatItem
          label="Статус"
          value={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: isActive ? '#16a34a' : '#94a3b8',
                display: 'inline-block',
              }} />
              <span style={{ fontWeight: 600, color: isActive ? '#16a34a' : '#64748B' }}>{statusLabel}</span>
            </span>
          }
        />
        <StatItem label="Действует до" value={expiresAt} />
        <StatItem label="Следующее списание" value={nextBillingAt} />
        <StatItem
          label="Автопродление"
          value={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: subscription?.autoRenew ? '#16a34a' : '#94a3b8',
                display: 'inline-block',
              }} />
              <span style={{ fontWeight: 600 }}>{autoRenewLabel}</span>
            </span>
          }
        />

        <Button
          type="default"
          icon={<CreditCardOutlined />}
          onClick={() => navigate('/subscription')}
          style={{ justifySelf: 'end', borderRadius: 10, height: 40, padding: '0 16px', minWidth: 210 }}
        >
          Управление подпиской
        </Button>
      </div>

      {subscription?.freePlanHint && (
        <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.5, display: 'block', marginTop: 12 }}>
          {subscription.freePlanHint}
        </Text>
      )}
    </Card>
  )
}
