import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Select, Spin, Typography } from 'antd'
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
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId, subscribeStoredCabinetId } from '../../api/cabinets'
import { subscriptionApi } from '../../api/subscription'
import { userApi } from '../../api/user'
import { useCampaignManageSubscriptionUi } from '../../store/campaignManageSubscriptionUi'
import AbTestPacksModal from '../../components/subscription/AbTestPacksModal'
import { ONBOARDING_TARGETS } from '../../onboarding/targets'
import type { CabinetBillingServiceStatusDto, ProfileSubscriptionSummary } from '../../types/api'

dayjs.locale('ru')

const { Text, Title } = Typography

const accent = '#7C3AED'
const border = '#E2E8F0'
const textMuted = '#64748B'

/** Услуги, входящие в PRO по промокоду (на каждый кабинет, пока промокод действует). */
const PROMO_INCLUDED_SERVICES: CabinetBillingServiceStatusDto[] = [
  { serviceCode: 'CAMPAIGN_MANAGE', name: 'Управление РК', connected: true, status: 'INCLUDED' },
  { serviceCode: 'AB_TESTS', name: 'А/Б тесты', connected: true, status: 'INCLUDED' },
]

interface SubscriptionCardProps {
  /** Сводка промокода с профиля; на странице кабинета можно не передавать. */
  subscription?: ProfileSubscriptionSummary | null
  /** Зафиксировать кабинет (страница управления кабинетом) — без селектора. */
  fixedCabinetId?: number
  /** Название кабинета, если список кабинетов не загружается. */
  cabinetName?: string
  /** Карточка на странице кабинета вместо вставки в профиль. */
  layout?: 'profile' | 'cabinet'
}

function formatExpires(expiresAt: string | null | undefined): string {
  if (!expiresAt) return 'Бессрочно'
  return dayjs(expiresAt).format('DD.MM.YYYY HH:mm')
}

function serviceIcon(serviceCode: string) {
  if (serviceCode === 'AB_TESTS') {
    return <ExperimentOutlined style={{ color: '#16A34A', fontSize: 16 }} />
  }
  return <BarChartOutlined style={{ color: accent, fontSize: 16 }} />
}

/**
 * Тариф выбранного кабинета. FREE — с момента создания кабинета; промокод FULL_ACCESS — на все кабинеты.
 */
export default function SubscriptionCard({
  subscription: subscriptionProp,
  fixedCabinetId,
  cabinetName,
  layout = 'profile',
}: SubscriptionCardProps) {
  const navigate = useNavigate()
  const openPlans = useCampaignManageSubscriptionUi((s) => s.openPlans)
  const [abPacksOpen, setAbPacksOpen] = useState(false)
  const [selectedCabinetId, setSelectedCabinetId] = useState<number | null>(() => getStoredCabinetId())
  const isCabinetLayout = layout === 'cabinet'

  useEffect(() => {
    if (fixedCabinetId != null) return
    return subscribeStoredCabinetId(setSelectedCabinetId)
  }, [fixedCabinetId])

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userApi.getProfile(),
    enabled: subscriptionProp == null,
    staleTime: 60_000,
  })
  const subscription = subscriptionProp ?? profile?.subscription

  const { data: cabinets = [], isLoading: cabinetsLoading } = useQuery({
    queryKey: ['myCabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: fixedCabinetId == null,
  })

  const cabinetId = useMemo(() => {
    if (fixedCabinetId != null) {
      return fixedCabinetId
    }
    if (selectedCabinetId != null && cabinets.some((c) => c.id === selectedCabinetId)) {
      return selectedCabinetId
    }
    return cabinets[0]?.id ?? null
  }, [fixedCabinetId, selectedCabinetId, cabinets])

  const selectedCabinetName = cabinetName ?? cabinets.find((c) => c.id === cabinetId)?.name

  const {
    data: billing,
    isPending: billingPending,
    refetch: refetchBilling,
  } = useQuery({
    queryKey: ['cabinetBilling', cabinetId],
    queryFn: () => subscriptionApi.getCabinetBillingStatus(cabinetId!),
    enabled: cabinetId != null,
    staleTime: 0,
  })

  const profilePromoActive = Boolean(subscription?.promoCode)
    || (subscription?.planCode === 'pro_month'
      && subscription?.active
      && Boolean(subscription?.expiresAt))

  const billingPromo = billing?.mainTariff?.status === 'PROMO'
  const isPromo = billingPromo || profilePromoActive

  const onPro =
    Boolean(billing?.mainTariff?.unlimitedAccess)
    || billing?.mainTariff?.code === 'pro_month'
    || billing?.mainTariff?.status === 'AGENCY'
    || billing?.mainTariff?.status === 'PROMO'
    || profilePromoActive

  const planName = isPromo
    ? (billing?.mainTariff?.name ?? subscription?.planName ?? 'PRO (промокод)')
    : (billing?.mainTariff?.name ?? 'Бесплатный доступ')
  const isActive = onPro || (billing != null
    ? !['NONE', 'EXPIRED', 'CANCELLED'].includes(String(billing.mainTariff.status ?? '').toUpperCase())
    : Boolean(subscription?.active))
  const statusLabel = isActive ? 'Активен' : (subscription?.statusLabel ?? 'Неактивен')
  const expiresLabel = isPromo
    ? formatExpires(billing?.mainTariff?.expiresAt ?? subscription?.expiresAt)
    : billing
      ? formatExpires(billing.mainTariff.expiresAt)
      : formatExpires(subscription?.expiresAt)
  const autoRenewLabel = (billing?.mainTariff?.expiresAt || subscription?.expiresAt)
    ? (subscription?.autoRenew ? 'Включено' : 'Выключено')
    : '—'

  const planDescription = isPromo
    ? (subscription?.freePlanHint
      ?? 'Полный доступ по промокоду: все разделы сервиса, Управление РК и А/Б тесты без ограничений.')
    : subscription?.freePlanHint
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

  const loading = (fixedCabinetId == null && cabinetsLoading) || (cabinetId != null && billingPending)
  const showSubscriptionDetails = billing != null || profilePromoActive
  const services = billing?.services?.length
    ? billing.services
    : (onPro ? PROMO_INCLUDED_SERVICES : [])
  const canManageBilling = Boolean(billing?.canManageBilling)

  const subtitle = isCabinetLayout
    ? (isPromo
      ? 'Промокод действует на все ваши кабинеты, пока не истечёт.'
      : 'Тариф и дополнительные услуги этого кабинета.')
    : cabinetId != null && selectedCabinetName
      ? (profilePromoActive
        ? `Тариф кабинета «${selectedCabinetName}». Промокод действует на все ваши кабинеты.`
        : `Тариф и услуги кабинета «${selectedCabinetName}».`)
      : profilePromoActive
        ? 'Промокод действует на каждый кабинет, пока не истечёт.'
        : 'Бесплатный доступ подключается при создании кабинета.'

  const body = (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
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
            <Title level={5} style={{ margin: 0, fontSize: 16, lineHeight: '24px' }}>
              Подписка
            </Title>
            <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.45 }}>
              {subtitle}
            </Text>
          </div>
        </div>
        {!isCabinetLayout && cabinets.length > 1 ? (
          <Select
            style={{ minWidth: 220, maxWidth: '100%' }}
            value={cabinetId ?? undefined}
            options={cabinets.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(id: number) => {
              setSelectedCabinetId(id)
              setStoredCabinetId(id)
            }}
          />
        ) : null}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : !showSubscriptionDetails ? (
        <Text type="secondary">
          После создания кабинета на него подключится бесплатный доступ (Товары, Сводная, Рекламные кампании).
        </Text>
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
                    {isPromo
                      ? planDescription
                      : planDescription.includes('В бесплатный')
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
                    <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>
                      {expiresLabel === 'Бессрочно' ? 'Действует' : 'Действует до'}
                    </div>
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
                  {services.map((svc) => {
                    const connected = onPro || svc.connected
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
                          {onPro ? 'В PRO' : connected ? 'Подключен' : 'Не подключен'}
                        </span>
                        {canManageBilling ? (
                          <Button
                            size="small"
                            disabled={onPro}
                            onClick={() => onConnectService(svc)}
                            type={!connected && !onPro ? 'primary' : 'default'}
                            style={
                              !connected && !onPro
                                ? { borderRadius: 8, background: accent, borderColor: accent, fontWeight: 600 }
                                : { borderRadius: 8, borderColor: accent, color: accent, fontWeight: 600 }
                            }
                          >
                            {onPro ? 'Включено' : connected ? 'Управление' : 'Подключить'}
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

            {cabinetId != null ? (
              <Button
                block
                size="large"
                onClick={() => {
                  setStoredCabinetId(cabinetId)
                  navigate('/subscription')
                }}
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
            ) : null}
          </>
        )}
    </>
  )

  return (
    <>
      {isCabinetLayout ? (
        <Card style={{ borderRadius: 16, border: `1px solid ${border}` }} styles={{ body: { padding: 24 } }}>
          {body}
        </Card>
      ) : (
        <section
          data-tour-id={ONBOARDING_TARGETS.SUBSCRIPTION_CARD}
          style={{
            marginBottom: 24,
            paddingBottom: 24,
            borderBottom: `1px solid ${border}`,
          }}
        >
          {body}
        </section>
      )}

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
