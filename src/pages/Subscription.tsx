import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Spin, Table, Typography, Tag, Tooltip, Select, message } from 'antd'
import { BarChartOutlined, ExperimentOutlined } from '@ant-design/icons'
import { userApi } from '../api/user'
import { subscriptionApi } from '../api/subscription'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
import type { CabinetBillingServiceStatusDto, CabinetDto, PaymentDto, PlanDto } from '../types/api'
import { getPaymentStatusLabel, getPaymentStatusColor } from '../utils/paymentStatus'
import { useCampaignManageSubscriptionUi } from '../store/campaignManageSubscriptionUi'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import AbTestPacksModal from '../components/subscription/AbTestPacksModal'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

const accent = '#7C3AED'
const border = '#E2E8F0'

const SERVICE_COPY: Record<string, { description: string; iconBg: string; iconColor: string }> = {
  CAMPAIGN_MANAGE: {
    description: 'Автоматизация рекламы, управление ставками, автобюджет, расписание и аналитика.',
    iconBg: '#F5F3FF',
    iconColor: accent,
  },
  AB_TESTS: {
    description: 'Тестируйте карточки товаров и находите лучшие варианты для роста конверсии.',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
  },
}

function formatMainPlanPrice(plan: PlanDto): string {
  const price = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(plan.priceRub)
  if (plan.priceRub <= 0) {
    return '0 руб · бессрочно'
  }
  if (plan.periodType === 'CALENDAR_MONTH') {
    return `${price} руб / месяц`
  }
  return `${price} руб / ${plan.periodDays} дн.`
}

function formatServicePrice(plan: PlanDto | undefined): string | null {
  if (!plan || plan.priceRub <= 0) return null
  const price = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(plan.priceRub)
  if (plan.periodType === 'CALENDAR_MONTH' || plan.code === 'campaign_month') {
    return `${price} ₽ / мес`
  }
  return `${price} ₽ / ${plan.periodDays} дн.`
}

export default function Subscription() {
  const navigate = useNavigate()
  const openPlans = useCampaignManageSubscriptionUi((s) => s.openPlans)
  const [abPacksOpen, setAbPacksOpen] = useState(false)
  const [cabinetId, setCabinetId] = useState<number | null>(() => getStoredCabinetId())
  const [payingPlanId, setPayingPlanId] = useState<number | null>(null)

  const { data: cabinets = [], isLoading: cabinetsLoading } = useQuery<CabinetDto[]>({
    queryKey: ['myCabinets'],
    queryFn: () => cabinetsApi.list(),
  })

  const effectiveCabinetId = useMemo(() => {
    if (cabinetId != null && cabinets.some((c: CabinetDto) => c.id === cabinetId)) {
      return cabinetId
    }
    return cabinets[0]?.id ?? null
  }, [cabinetId, cabinets])

  const {
    data: billing,
    isPending: billingPending,
    refetch: refetchBilling,
  } = useQuery({
    queryKey: ['cabinetBilling', effectiveCabinetId],
    queryFn: () => subscriptionApi.getCabinetBillingStatus(effectiveCabinetId!),
    enabled: effectiveCabinetId != null,
  })

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentDto[]>({
    queryKey: ['myPayments'],
    queryFn: () => userApi.getMyPayments(),
  })

  const { data: mainPlans = [], isLoading: mainPlansLoading } = useQuery({
    queryKey: ['subscriptionPlans', 'MAIN'],
    queryFn: () => subscriptionApi.getMainPlans(),
  })

  const { data: campaignPlans = [] } = useQuery({
    queryKey: ['subscriptionPlans', 'CAMPAIGN'],
    queryFn: () => subscriptionApi.getCampaignManagePlans(),
  })

  const campaignMonthPlan = useMemo(
    () =>
      campaignPlans.find((p) => p.code === 'campaign_month')
      ?? campaignPlans.filter((p) => (p.priceRub ?? 0) > 0).sort((a, b) => a.priceRub - b.priceRub)[0],
    [campaignPlans],
  )

  const sortedMainPlans = useMemo(
    () => [...mainPlans].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id),
    [mainPlans],
  )

  const currentMainCode = billing?.mainTariff?.code
  const onPro =
    Boolean(billing?.mainTariff?.unlimitedAccess)
    || currentMainCode === 'pro_month'
    || billing?.mainTariff?.status === 'AGENCY'

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 2 }).format(amount) + ' ' + currency

  const paymentColumns = [
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Сумма',
      key: 'amount',
      render: (_: unknown, r: PaymentDto) => (
        <span style={{ whiteSpace: 'nowrap' }}>{formatPrice(r.amount, r.currency)}</span>
      ),
    },
    {
      title: 'Назначение',
      dataIndex: 'description',
      key: 'description',
      render: (v: string | null) =>
        v ? (
          <Tooltip title={v}>
            <span
              style={{
                display: 'inline-block',
                maxWidth: 260,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {v}
            </span>
          </Tooltip>
        ) : (
          '—'
        ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>{getPaymentStatusLabel(status)}</Tag>
      ),
    },
    {
      title: 'Оплачено',
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
    },
  ]

  const onConnectService = (serviceCode: string) => {
    if (serviceCode === 'CAMPAIGN_MANAGE') {
      openPlans()
      return
    }
    if (serviceCode === 'AB_TESTS') {
      setAbPacksOpen(true)
    }
  }

  const payMainPlan = async (plan: PlanDto) => {
    if (effectiveCabinetId == null) {
      message.warning('Выберите кабинет')
      return
    }
    if (plan.priceRub <= 0) {
      return
    }
    setPayingPlanId(plan.id)
    try {
      const res = await subscriptionApi.initiatePayment(plan.id, effectiveCabinetId)
      window.location.href = res.paymentUrl
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string } } })?.response?.data
      message.error(data?.error || 'Не удалось перейти к оплате')
    } finally {
      setPayingPlanId(null)
    }
  }

  const isCurrentMainPlan = (plan: PlanDto) => {
    if (plan.code === 'pro_month') {
      return onPro
    }
    if (plan.code === 'analytics_free') {
      return !onPro
    }
    return plan.code === currentMainCode
  }

  return (
    <>
      <Header />
      <Breadcrumbs />
      <div
        style={{
          width: '100%',
          padding: 24,
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: 960 }}>
          <Typography.Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
            Подписка
          </Typography.Title>
          <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography.Text type="secondary">Кабинет:</Typography.Text>
            <Select
              style={{ minWidth: 260 }}
              loading={cabinetsLoading}
              value={effectiveCabinetId ?? undefined}
              options={cabinets.map((c: CabinetDto) => ({ value: c.id, label: c.name }))}
              onChange={(id) => {
                setCabinetId(id)
                setStoredCabinetId(id)
              }}
              placeholder="Выберите кабинет"
            />
          </div>

          {effectiveCabinetId == null ? (
            <Card>
              <Typography.Text type="secondary">Сначала создайте кабинет.</Typography.Text>
              <div style={{ marginTop: 12 }}>
                <Button type="primary" onClick={() => navigate('/profile')} style={{ background: accent, borderColor: accent }}>
                  К профилю
                </Button>
              </div>
            </Card>
          ) : billingPending || !billing || mainPlansLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Card style={{ marginBottom: 24, borderRadius: 8 }}>
                <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                  Основной тариф
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  Выберите основной тариф кабинета. Сейчас активен:{' '}
                  <Typography.Text strong>{billing.mainTariff.name}</Typography.Text>
                  {billing.mainTariff.expiresAt
                    ? ` до ${dayjs(billing.mainTariff.expiresAt).format('DD.MM.YYYY')}`
                    : ' · бессрочно'}
                  .
                </Typography.Paragraph>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 16,
                  }}
                >
                  {sortedMainPlans.map((plan) => {
                    const current = isCurrentMainPlan(plan)
                    const canBuy =
                      billing.canManageBilling
                      && plan.priceRub > 0
                      && !current
                      && billing.mainTariff.status !== 'AGENCY'

                    return (
                      <div
                        key={plan.id}
                        style={{
                          background: current ? '#F5F3FF' : '#F8FAFC',
                          border: current ? `1px solid ${accent}` : `1px solid ${border}`,
                          borderRadius: 12,
                          padding: 20,
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: 240,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>{plan.name}</div>
                          {current ? <Tag color="purple">Текущий</Tag> : null}
                        </div>
                        <div style={{ fontSize: 13, color: '#475569', flex: 1, marginBottom: 16, lineHeight: 1.45 }}>
                          {plan.description || '—'}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1E293B' }}>
                          {formatMainPlanPrice(plan)}
                        </div>
                        {current ? (
                          <Button block disabled>
                            Подключен
                          </Button>
                        ) : canBuy ? (
                          <Button
                            type="primary"
                            block
                            loading={payingPlanId === plan.id}
                            onClick={() => void payMainPlan(plan)}
                            style={{ backgroundColor: accent, borderColor: accent }}
                          >
                            Подключить
                          </Button>
                        ) : (
                          <Button block disabled>
                            {billing.mainTariff.status === 'AGENCY' ? 'Входит в доступ агентства' : 'Недоступно'}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card style={{ marginBottom: 24, borderRadius: 12 }}>
                <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                  Дополнительные услуги
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  Подключаются отдельно к кабинету. Можно комбинировать с любым основным тарифом
                  {onPro ? ' (на PRO услуги уже включены без ограничений)' : ''}.
                </Typography.Paragraph>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(billing.services ?? []).map((svc) => {
                    const includedInPro = onPro && (svc.status === 'INCLUDED' || svc.connected)
                    const connected = Boolean(svc.connected || includedInPro)
                    const copy = SERVICE_COPY[svc.serviceCode]
                    const nextBilling =
                      connected && !includedInPro && svc.expiresAt
                        ? `Следующее списание ${dayjs(svc.expiresAt).format('D MMMM YYYY')}`
                        : null

                    return (
                      <ServiceAddonCard
                        key={svc.serviceCode}
                        svc={svc}
                        description={copy?.description ?? ''}
                        iconBg={copy?.iconBg ?? '#F8FAFC'}
                        iconColor={copy?.iconColor ?? accent}
                        connected={connected}
                        includedInPro={includedInPro}
                        priceLabel={
                          includedInPro
                            ? null
                            : svc.serviceCode === 'CAMPAIGN_MANAGE'
                              ? formatServicePrice(campaignMonthPlan)
                              : null
                        }
                        nextBilling={nextBilling}
                        canManage={billing.canManageBilling}
                        abQuotaHint={
                          svc.serviceCode === 'AB_TESTS'
                          && billing.abTestQuota
                          && !billing.abTestQuota.unlimited
                          && billing.abTestQuota.activated
                            ? `Использовано: ${billing.abTestQuota.usedStarts ?? 0}, доступно: ${billing.abTestQuota.remaining ?? 0}`
                            : null
                        }
                        onAction={() => onConnectService(svc.serviceCode)}
                      />
                    )
                  })}
                </div>
              </Card>
            </>
          )}

          <Card title="История платежей" style={{ marginBottom: 24, borderRadius: 8 }}>
            {paymentsLoading ? (
              <Spin />
            ) : payments.length === 0 ? (
              <Typography.Text type="secondary">Платежей пока нет.</Typography.Text>
            ) : (
              <Table rowKey="id" columns={paymentColumns} dataSource={payments} pagination={false} size="small" />
            )}
          </Card>
        </div>
      </div>

      <AbTestPacksModal
        open={abPacksOpen}
        cabinetId={effectiveCabinetId}
        freeAlreadyUsed={Boolean(billing?.abTestQuota?.activated || billing?.abTestQuota?.unlimited || onPro)}
        onClose={() => setAbPacksOpen(false)}
        onActivated={() => {
          void refetchBilling()
        }}
      />
    </>
  )
}

function ServiceAddonCard({
  svc,
  description,
  iconBg,
  iconColor,
  connected,
  includedInPro,
  priceLabel,
  nextBilling,
  abQuotaHint,
  canManage,
  onAction,
}: {
  svc: CabinetBillingServiceStatusDto
  description: string
  iconBg: string
  iconColor: string
  connected: boolean
  includedInPro: boolean
  priceLabel: string | null
  nextBilling: string | null
  abQuotaHint: string | null
  canManage: boolean
  onAction: () => void
}) {
  const statusText = includedInPro ? 'Включено в PRO' : connected ? 'Подключен' : 'Не подключен'
  const actionLabel = includedInPro ? 'Включено в PRO' : connected ? 'Управление' : 'Подключить'
  const isConnect = !connected && !includedInPro

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        border: `1px solid ${border}`,
        borderRadius: 12,
        background: '#fff',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {svc.serviceCode === 'AB_TESTS' ? (
          <ExperimentOutlined style={{ color: iconColor, fontSize: 20 }} />
        ) : (
          <BarChartOutlined style={{ color: iconColor, fontSize: 20 }} />
        )}
      </div>

      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{svc.name}</span>
          <span
            style={{
              display: 'inline-flex',
              padding: '2px 10px',
              borderRadius: 999,
              background: connected ? '#DCFCE7' : '#F1F5F9',
              color: connected ? '#166534' : '#64748B',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {statusText}
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.45 }}>{description}</div>
        {abQuotaHint ? (
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{abQuotaHint}</div>
        ) : null}
      </div>

      <div style={{ minWidth: 140, textAlign: 'right' }}>
        {priceLabel ? (
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{priceLabel}</div>
        ) : null}
        {nextBilling ? (
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{nextBilling}</div>
        ) : includedInPro && svc.planName ? (
          <div style={{ fontSize: 12, color: '#64748B' }}>{svc.planName}</div>
        ) : null}
      </div>

      {canManage ? (
        <Button
          disabled={includedInPro}
          onClick={onAction}
          type={isConnect ? 'primary' : 'default'}
          style={
            isConnect
              ? { background: accent, borderColor: accent, borderRadius: 10, fontWeight: 600, minWidth: 120 }
              : { borderColor: accent, color: accent, borderRadius: 10, fontWeight: 600, minWidth: 120 }
          }
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
