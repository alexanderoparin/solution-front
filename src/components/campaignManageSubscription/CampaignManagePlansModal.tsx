import { useState } from 'react'
import { Modal, Button, Spin, Alert } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { PlanDto } from '../../types/api'
import { subscriptionApi } from '../../api/subscription'
import { useCampaignManageAccess } from '../../hooks/useCampaignManageAccess'
import { getRequestFailureDescription } from '../../utils/requestError'
import CampaignManageCheckoutModal from './CampaignManageCheckoutModal'

const accent = '#7C3AED'

interface CampaignManagePlansModalProps {
  open: boolean
  onClose: () => void
}

function formatPriceLabel(plan: PlanDto): string {
  const price = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(plan.priceRub)
  if (plan.code === 'campaign_month' || plan.periodType === 'CALENDAR_MONTH') {
    return `${price} руб / месяц`
  }
  return `${price} руб / ${plan.periodDays} ${plan.periodDays === 1 ? 'день' : plan.periodDays < 5 ? 'дня' : 'дней'}`
}

export default function CampaignManagePlansModal({ open, onClose }: CampaignManagePlansModalProps) {
  const navigate = useNavigate()
  const [checkoutPlan, setCheckoutPlan] = useState<PlanDto | null>(null)
  const { campaignManage, access, isLoading: accessLoading } = useCampaignManageAccess()

  const emailConfirmed = access?.emailConfirmed === true
  const needsEmailConfirmation = access != null && !emailConfirmed

  const { data: plans = [], isLoading: plansLoading, isError, error } = useQuery({
    queryKey: ['campaignManagePlans'],
    queryFn: () => subscriptionApi.getCampaignManagePlans(),
    enabled: open && emailConfirmed,
  })

  const checkoutOpen = checkoutPlan != null

  const goToProfile = () => {
    onClose()
    navigate('/profile')
  }

  return (
    <>
      <Modal
        open={open && !checkoutOpen}
        onCancel={onClose}
        footer={null}
        width={920}
        title="Подписка на Управление РК"
        destroyOnClose
      >
        <div
          style={{
            background: '#F5F3FF',
            border: `1px solid ${accent}`,
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 14,
            color: '#1E293B',
            lineHeight: 1.5,
          }}
        >
          Подписка открывает доступ только к разделу «Управление РК». Остальные возможности сервиса
          доступны бесплатно.
        </div>

        {needsEmailConfirmation ? (
          <Alert
            type="warning"
            showIcon
            icon={<MailOutlined />}
            message="Подтвердите email"
            description="Чтобы подключить Управление РК, подтвердите почту. Откройте профиль и запросите письмо со ссылкой для подтверждения."
            action={
              <Button type="primary" size="small" onClick={goToProfile} style={{ backgroundColor: accent, borderColor: accent }}>
                Перейти в профиль
              </Button>
            }
            style={{ marginBottom: 8 }}
          />
        ) : accessLoading || plansLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : isError ? (
          <Alert
            type="error"
            showIcon
            message="Не удалось загрузить тарифы"
            description={getRequestFailureDescription(error)}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {plans.map((plan) => {
              const freeUsed = plan.code === 'campaign_free' && campaignManage?.canActivateFree === false
              return (
              <div
                key={plan.id}
                style={{
                  background: '#F8FAFC',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 280,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: '#475569', flex: 1, marginBottom: 16, lineHeight: 1.45 }}>
                  {plan.description}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1E293B' }}>
                  {formatPriceLabel(plan)}
                </div>
                <Button
                  type="primary"
                  block
                  disabled={freeUsed}
                  title={freeUsed ? 'Бесплатный период уже был использован' : undefined}
                  onClick={() => setCheckoutPlan(plan)}
                  style={{ backgroundColor: accent, borderColor: accent }}
                >
                  Подключить
                </Button>
              </div>
            )})}
          </div>
        )}
      </Modal>

      <CampaignManageCheckoutModal
        open={checkoutOpen}
        plan={checkoutPlan}
        onBack={() => setCheckoutPlan(null)}
        onClose={() => {
          setCheckoutPlan(null)
          onClose()
        }}
      />
    </>
  )
}
