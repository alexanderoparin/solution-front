import { useMemo, useState } from 'react'
import { Button, Card, Spin, Typography } from 'antd'
import {
  ArrowRightOutlined,
  BarChartOutlined,
  CreditCardOutlined,
  CrownOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { cabinetsApi, getStoredCabinetId } from '../../api/cabinets'
import { subscriptionApi } from '../../api/subscription'
import { useCampaignManageSubscriptionUi } from '../../store/campaignManageSubscriptionUi'
import AbTestPacksModal from '../../components/subscription/AbTestPacksModal'
import type { CabinetBillingServiceStatusDto, ProfileSubscriptionSummary } from '../../types/api'

dayjs.locale('ru')

const { Text, Title } = Typography

const accent = '#7C3AED'
const border = '#E2E8F0'
const textMuted = '#64748B'

interface SubscriptionCardProps {
  subscription: ProfileSubscriptionSummary | null | undefined
}

function formatExpires(expiresAt: string | null | undefined): string {
  if (!expiresAt) return 'Бессрочно'
  return dayjs(expiresAt).format('DD.MM.YYYY')
}

function serviceIcon(serviceCode: string) {
  if (serviceCode === 'AB_TESTS') {
    return <ExperimentOutlined style={{ color: '#16A34A', fontSize: 16 }} />
  }
  return <BarChartOutlined style={{ color: accent, fontSize: 16 }} />
}

/**
 * Блок подписки в профиле: основной тариф кабинета и дополнительные услуги.
 */
export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const navigate = useNavigate()
  const openPlans = useCampaignManageSubscriptionUi((s) => s.openPlans)
  const [abPacksOpen, setAbPacksOpen] = useState(false)

  const { data: cabinets = [], isLoading: cabinetsLoading } = useQuery({
    queryKey: ['myCabinets'],
    queryFn: () => cabinetsApi.list(),
  })

  const cabinetId = useMemo(() => {
    const stored = getStoredCabinetId()
    if (stored != null && cabinets.some((c) => c.id === stored)) {
      return stored
    }
    return cabinets[0]?.id ?? null
  }, [cabinets])

  const {
    data: billing,
    isPending: billingPending,
    refetch: refetchBilling,
  } = useQuery({
    queryKey: ['cabinetBilling', cabinetId],
    queryFn: () => subscriptionApi.getCabinetBillingStatus(cabinetId!),
    enabled: cabinetId != null,
  })

  const onPro =
    Boolean(billing?.mainTariff?.unlimitedAccess)
    || billing?.mainTariff?.code === 'pro_month'
    || billing?.mainTariff?.status === 'AGENCY'

  const planName = billing?.mainTariff?.name ?? subscription?.planName ?? '—'
  const isActive = billing != null
    ? !['NONE', 'EXPIRED', 'CANCELLED'].includes(String(billing.mainTariff.status ?? '').toUpperCase())
    : Boolean(subscription?.active)
  const statusLabel = isActive ? 'Активен' : (subscription?.statusLabel ?? 'Неактивен')
  const expiresLabel = billing
    ? formatExpires(billing.mainTariff.expiresAt)
    : (subscription?.freePlanHint ? 'Бессрочно' : formatExpires(subscription?.expiresAt))
  const autoRenewLabel = billing?.mainTariff?.expiresAt
    ? (subscription?.autoRenew ? 'Включено' : 'Выключено')
    : '—'

  const planDescription =
    subscription?.freePlanHint
    ?? 'Включает все основные функции сервиса: Товары, Сводная, Рекламные кампании и др.'

  const onConnectService = (svc: CabinetBillingServiceStatusDto) => {
    if (svc.serviceCode === 'CAMPAIGN_MANAGE') {
      openPlans()
      return
    }
    if (svc.serviceCode === 'AB_TESTS') {
      setAbPacksOpen(true)
    }
  }

  const loading = cabinetsLoading || (cabinetId != null && billingPending)

  return (
    <>
      <Card
        style={{
          borderRadius: 16,
          border: `1px solid ${border}`,
          width: '100%',
        }}
        styles={{ body: { padding: 24 } }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#F5F3FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CreditCardOutlined style={{ color: accent, fontSize: 18 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <Title level={4} style={{ margin: 0, fontSize: 20, lineHeight: '28px' }}>
              Подписка
            </Title>
            <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.45 }}>
              Здесь показаны ваши активные тарифы и подключенные услуги.
            </Text>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : cabinetId == null || !billing ? (
          <Text type="secondary">Сначала создайте кабинет, чтобы управлять тарифами и услугами.</Text>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)',
                gap: 16,
                marginBottom: 16,
              }}
              className="profile-subscription-grid"
            >
              {/* Основной тариф */}
              <div
                style={{
                  border: `1px solid ${border}`,
                  borderRadius: 14,
                  padding: 20,
                  background: '#fff',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'stretch',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#F5F3FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CrownOutlined style={{ color: accent, fontSize: 20 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: accent,
                      textTransform: 'uppercase',
                      letterSpacing: 0.4,
                      marginBottom: 6,
                    }}
                  >
                    Основной тариф
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                      {planName}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 10px',
                        borderRadius: 999,
                        background: isActive ? '#DCFCE7' : '#F1F5F9',
                        color: isActive ? '#166534' : textMuted,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.45, display: 'block' }}>
                    {planDescription.includes('В бесплатный')
                      ? 'Включает все основные функции сервиса: Товары, Сводная, Рекламные кампании и др.'
                      : planDescription}
                  </Text>
                </div>
                <div
                  style={{
                    borderLeft: `1px solid ${border}`,
                    paddingLeft: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 14,
                    flexShrink: 0,
                    minWidth: 120,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>Действует</div>
                    <div style={{ fontWeight: 600, color: '#0F172A' }}>{expiresLabel}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>Автопродление</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#0F172A' }}>
                      {autoRenewLabel !== '—' ? (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: autoRenewLabel === 'Включено' ? '#16A34A' : '#94A3B8',
                            display: 'inline-block',
                          }}
                        />
                      ) : null}
                      {autoRenewLabel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Дополнительные услуги */}
              <div
                style={{
                  border: `1px solid ${border}`,
                  borderRadius: 14,
                  padding: 20,
                  background: '#fff',
                  minWidth: 0,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>
                  Дополнительные услуги
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(billing.services ?? []).map((svc) => {
                    const includedInPro = onPro && (svc.status === 'INCLUDED' || svc.connected)
                    const connected = svc.connected || includedInPro
                    return (
                      <div
                        key={svc.serviceCode}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: svc.serviceCode === 'AB_TESTS' ? '#F0FDF4' : '#F5F3FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {serviceIcon(svc.serviceCode)}
                        </div>
                        <div style={{ flex: '1 1 100px', minWidth: 0, fontWeight: 600, color: '#0F172A' }}>
                          {svc.name}
                        </div>
                        <span
                          style={{
                            display: 'inline-flex',
                            padding: '2px 10px',
                            borderRadius: 999,
                            background: connected ? '#DCFCE7' : '#F1F5F9',
                            color: connected ? '#166534' : textMuted,
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {includedInPro ? 'В PRO' : connected ? 'Подключен' : 'Не подключен'}
                        </span>
                        {billing.canManageBilling ? (
                          <Button
                            size="small"
                            disabled={includedInPro}
                            onClick={() => onConnectService(svc)}
                            type={!connected && !includedInPro ? 'primary' : 'default'}
                            style={
                              !connected && !includedInPro
                                ? { borderRadius: 8, background: accent, borderColor: accent, fontWeight: 600 }
                                : { borderRadius: 8, borderColor: accent, color: accent, fontWeight: 600 }
                            }
                          >
                            {includedInPro ? 'Включено' : connected ? 'Управление' : 'Подключить'}
                          </Button>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <style>{`
              @media (max-width: 900px) {
                .profile-subscription-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>

            <Button
              block
              size="large"
              onClick={() => navigate('/subscription')}
              style={{
                height: 48,
                borderRadius: 12,
                borderColor: accent,
                color: accent,
                fontWeight: 600,
                paddingInline: 16,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <CreditCardOutlined />
                Управление подпиской
                <ArrowRightOutlined />
              </span>
            </Button>
          </>
        )}
      </Card>

      <AbTestPacksModal
        open={abPacksOpen}
        cabinetId={cabinetId}
        freeAlreadyUsed={Boolean(billing?.abTestQuota?.activated || billing?.abTestQuota?.unlimited || onPro)}
        onClose={() => setAbPacksOpen(false)}
        onActivated={() => {
          void refetchBilling()
        }}
      />
    </>
  )
}
