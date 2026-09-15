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

const connectedButtonStyle = {
  background: '#F8FAFC',
  borderColor: '#E2E8F0',
  color: '#94A3B8',
} as const

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
  const { campaignManage, access, cabinetId, isLoading: accessLoading } = useCampaignManageAccess()

  const emailConfirmed = access?.emailConfirmed === true
  const needsEmailConfirmation = access != null && !emailConfirmed
  /** Без кабинета бэкенд всегда отдаёт canActivateFree=false — это не «триал уже использован». */
  const trialStatusReady = cabinetId != null && !accessLoading

  const { data: plans = [], isLoading: plansLoading, isError, error } = useQuery({
    queryKey: ['campaignManagePlans'],
    queryFn: () => subscriptionApi.getCampaignManagePlans(),
    enabled: open && emailConfirmed,
  })

  const { data: billing, isPending: billingPending } = useQuery({
    queryKey: ['cabinetBilling', cabinetId],
    queryFn: () => subscriptionApi.getCabinetBillingStatus(cabinetId!),
    enabled: open && cabinetId != null && emailConfirmed,
  })

  const campaignService = billing?.services?.find((s) => s.serviceCode === 'CAMPAIGN_MANAGE')
  const campaignIncluded =
    campaignManage?.status === 'PRO'
    || campaignManage?.status === 'AGENCY'
    || campaignService?.status === 'INCLUDED'
  const activeCampaignPlanCode = campaignService?.connected ? campaignService.planCode : null

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
        centered
        className="campaign-manage-plans-modal"
        styles={{ content: { padding: 20 } }}
      >
        <style>{`
          @media (max-width: 900px) {
            .campaign-manage-plans-modal {
              max-width: calc(100vw - 16px) !important;
              top: 0;
              padding-bottom: 0;
              margin: 0 auto;
            }
            .campaign-manage-plans-modal .ant-modal-content {
              padding: 12px 12px 14px !important;
            }
            .campaign-manage-plans-modal .ant-modal-header {
              margin-bottom: 8px;
            }
            .campaign-manage-plans-modal .ant-modal-title {
              font-size: 16px;
              line-height: 1.3;
            }
            .campaign-plan-grid {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }
            .campaign-plan-card {
              min-height: 0 !important;
              padding: 10px 12px !important;
              border-radius: 10px !important;
              display: grid !important;
              grid-template-columns: minmax(0, 1fr) auto;
              grid-template-areas:
                "title price"
                "desc desc"
                "btn btn";
              column-gap: 10px;
              row-gap: 4px;
              align-items: start;
            }
            .campaign-plan-title {
              grid-area: title;
              font-size: 15px !important;
              margin-bottom: 0 !important;
            }
            .campaign-plan-desc {
              grid-area: desc;
              font-size: 12px !important;
              margin-bottom: 2px !important;
              flex: none !important;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .campaign-plan-price {
              grid-area: price;
              margin-bottom: 0 !important;
              text-align: right;
              font-size: 13px !important;
              justify-self: end;
              white-space: nowrap;
            }
            .campaign-plan-btn {
              grid-area: btn;
              margin-top: 4px;
            }
          }
        `}</style>
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
        ) : accessLoading || plansLoading || (cabinetId != null && billingPending) ? (
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
          <div
            className="campaign-plan-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}
          >
            {plans.map((plan) => {
              const connected =
                campaignIncluded
                || (Boolean(activeCampaignPlanCode) && plan.code === activeCampaignPlanCode)
              const freeUsed =
                !connected
                && plan.code === 'campaign_free'
                && trialStatusReady
                && campaignManage?.canActivateFree === false
              const inactive = connected || freeUsed
              return (
              <div
                key={plan.id}
                className="campaign-plan-card"
                style={{
                  background: '#F8FAFC',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 280,
                }}
              >
                <div className="campaign-plan-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>{plan.name}</div>
                <div className="campaign-plan-desc" style={{ fontSize: 13, color: '#475569', flex: 1, marginBottom: 16, lineHeight: 1.45 }}>
                  {plan.description}
                </div>
                <div className="campaign-plan-price" style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1E293B' }}>
                  {formatPriceLabel(plan)}
                </div>
                <Button
                  className="campaign-plan-btn"
                  type={inactive ? 'default' : 'primary'}
                  block
                  disabled={inactive}
                  title={
                    connected
                      ? 'Тариф уже подключен'
                      : freeUsed
                        ? 'Бесплатный период уже был использован'
                        : undefined
                  }
                  onClick={inactive ? undefined : () => setCheckoutPlan(plan)}
                  style={inactive ? connectedButtonStyle : { backgroundColor: accent, borderColor: accent }}
                >
                  {connected ? 'Подключено' : 'Подключить'}
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
