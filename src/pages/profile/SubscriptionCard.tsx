import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button, Card, Select, Spin, Typography } from 'antd'
import {
  AppstoreOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  CreditCardOutlined,
  CrownOutlined,
  ExperimentOutlined,
  LockOutlined,
  NotificationOutlined,
  ShoppingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId, subscribeStoredCabinetId } from '../../api/cabinets'
import { subscriptionApi } from '../../api/subscription'
import { userApi } from '../../api/user'
import { ONBOARDING_TARGETS } from '../../onboarding/targets'
import type { CabinetBillingServiceStatusDto, ProfileSubscriptionSummary } from '../../types/api'

dayjs.locale('ru')

const { Text, Title } = Typography

const accent = '#7C3AED'
const border = '#E2E8F0'
const textMuted = '#64748B'
const chipBg = '#F5F3FF'
const chipLockedBg = '#F1F5F9'
const chipHighlightBg = '#EDE9FE'

/** Услуги, входящие в PRO по промокоду (на каждый кабинет, пока промокод действует). */
const PROMO_INCLUDED_SERVICES: CabinetBillingServiceStatusDto[] = [
  { serviceCode: 'CAMPAIGN_MANAGE', name: 'Управление РК', connected: true, status: 'INCLUDED' },
  { serviceCode: 'AB_TESTS', name: 'А/Б тесты', connected: true, status: 'INCLUDED' },
]

type SubscriptionViewMode = 'pro' | 'free' | 'campaign' | 'ab' | 'addons'

type FeatureKey =
  | 'products'
  | 'summary'
  | 'campaigns'
  | 'campaignManage'
  | 'hypotheses'
  | 'abTests'

interface FeatureChipDef {
  key: FeatureKey
  label: string
  icon: ReactNode
}

const FEATURE_CHIPS: FeatureChipDef[] = [
  { key: 'products', label: 'Товары', icon: <ShoppingOutlined /> },
  { key: 'summary', label: 'Сводная', icon: <BarChartOutlined /> },
  { key: 'campaigns', label: 'Рекламные кампании', icon: <NotificationOutlined /> },
  { key: 'campaignManage', label: 'Управление РК', icon: <AppstoreOutlined /> },
  { key: 'hypotheses', label: 'Гипотезы', icon: <UnorderedListOutlined /> },
  { key: 'abTests', label: 'A/B тесты', icon: <ExperimentOutlined /> },
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

/**
 * Дата окончания в формате референса: «15 мая 2025».
 */
function formatExpiresDate(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null
  return dayjs(expiresAt).format('D MMMM YYYY')
}

function isProPlanCode(code?: string | null): boolean {
  return Boolean(code && (code === 'pro_month' || code.startsWith('pro_')))
}

/**
 * Тариф выбранного кабинета. FREE — с момента создания кабинета; промокод — на все кабинеты.
 */
export default function SubscriptionCard({
  subscription: subscriptionProp,
  fixedCabinetId,
  cabinetName,
  layout = 'profile',
}: SubscriptionCardProps) {
  const navigate = useNavigate()
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

  const { data: overview, isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinetsOverview'],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: fixedCabinetId == null,
  })
  const cabinets = overview?.owned ?? []

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
  } = useQuery({
    queryKey: ['cabinetBilling', cabinetId],
    queryFn: () => subscriptionApi.getCabinetBillingStatus(cabinetId!),
    enabled: cabinetId != null,
    staleTime: 0,
  })

  const profilePromoActive = Boolean(subscription?.promoCode)
    || (isProPlanCode(subscription?.planCode)
      && Boolean(subscription?.active)
      && Boolean(subscription?.expiresAt))

  const onPro = Boolean(
    billing?.mainTariff?.unlimitedAccess
    || isProPlanCode(billing?.mainTariff?.code)
    || billing?.mainTariff?.status === 'AGENCY'
    || billing?.mainTariff?.status === 'PROMO'
    || billing?.mainTariff?.status === 'TRIAL'
    || profilePromoActive
  )

  const services = billing?.services?.length
    ? billing.services
    : (onPro ? PROMO_INCLUDED_SERVICES : [])

  const campaignService = services.find((s) => s.serviceCode === 'CAMPAIGN_MANAGE')
  const abService = services.find((s) => s.serviceCode === 'AB_TESTS')

  const campaignConnected = onPro || Boolean(campaignService?.connected)
  const abUnlimited = onPro || Boolean(billing?.abTestQuota?.unlimited)
  const abConnected = onPro
    || abUnlimited
    || Boolean(abService?.connected)
    || Boolean(billing?.abTestQuota?.activated)

  const viewMode: SubscriptionViewMode = (() => {
    if (onPro) return 'pro'
    if (campaignConnected && abConnected) return 'addons'
    if (campaignConnected) return 'campaign'
    if (abConnected) return 'ab'
    return 'free'
  })()

  const expiresAt = (() => {
    if (onPro) {
      return billing?.mainTariff?.expiresAt ?? subscription?.expiresAt ?? null
    }
    if (viewMode === 'campaign' || viewMode === 'addons') {
      return campaignService?.expiresAt
        ?? abService?.expiresAt
        ?? billing?.mainTariff?.expiresAt
        ?? null
    }
    if (viewMode === 'ab') {
      return abService?.expiresAt ?? billing?.mainTariff?.expiresAt ?? null
    }
    return null
  })()
  const expiresLabel = formatExpiresDate(expiresAt)

  const headerIcon = (() => {
    if (viewMode === 'ab') {
      return {
        bg: '#F0FDF4',
        node: <ExperimentOutlined style={{ color: '#16A34A', fontSize: 18 }} />,
      }
    }
    if (viewMode === 'campaign' || viewMode === 'addons') {
      return {
        bg: '#F5F3FF',
        node: <BarChartOutlined style={{ color: accent, fontSize: 18 }} />,
      }
    }
    return {
      bg: '#F5F3FF',
      node: <CrownOutlined style={{ color: accent, fontSize: 18 }} />,
    }
  })()

  const subtitle = (() => {
    if (viewMode === 'pro') {
      return 'Полный доступ ко всем функциям этого кабинета'
    }
    if (viewMode === 'campaign') {
      return 'Подключена услуга «Управление РК» для этого кабинета.'
    }
    if (viewMode === 'ab') {
      return 'Подключена услуга «A/B-тесты» для этого кабинета.'
    }
    if (viewMode === 'addons') {
      return 'Подключены дополнительные услуги для этого кабинета.'
    }
    return 'Доступны только бесплатные разделы этого кабинета.'
  })()

  const featureUnlocked: Record<FeatureKey, boolean> = {
    products: true,
    summary: true,
    campaigns: true,
    campaignManage: campaignConnected,
    hypotheses: onPro,
    abTests: abConnected,
  }

  const featureHighlighted: Partial<Record<FeatureKey, boolean>> = {
    campaignManage: viewMode === 'campaign',
    abTests: viewMode === 'ab',
  }

  const goSubscription = () => {
    if (cabinetId != null) {
      setStoredCabinetId(cabinetId)
    }
    navigate('/subscription')
  }

  const loading = (fixedCabinetId == null && cabinetsLoading) || (cabinetId != null && billingPending)
  const showSubscriptionDetails = billing != null || profilePromoActive
  const isFreeView = viewMode === 'free'
  const canManageBilling = Boolean(billing?.canManageBilling) || fixedCabinetId == null

  const body = (
    <>
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
            className="subscription-card-top"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0, flex: '1 1 240px' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: headerIcon.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {headerIcon.node}
              </div>
              <div style={{ minWidth: 0 }}>
                <Title level={5} style={{ margin: 0, fontSize: 16, lineHeight: '24px', color: '#0F172A' }}>
                  Подписка
                </Title>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.45, display: 'block' }}>
                  {subtitle}
                </Text>
                {!isCabinetLayout && selectedCabinetName ? (
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                    Кабинет «{selectedCabinetName}»
                  </Text>
                ) : null}
              </div>
            </div>

            <div
              className="subscription-card-actions"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
                marginLeft: 'auto',
              }}
            >
              {!isCabinetLayout && cabinets.length > 1 ? (
                <Select
                  style={{ minWidth: 180, maxWidth: '100%' }}
                  value={cabinetId ?? undefined}
                  options={cabinets.map((c) => ({ value: c.id, label: c.name }))}
                  onChange={(id: number) => {
                    setSelectedCabinetId(id)
                    setStoredCabinetId(id)
                  }}
                />
              ) : null}

              {isFreeView ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: '#F1F5F9',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Бесплатный доступ
                </span>
              ) : expiresLabel ? (
                <div style={{ minWidth: 120 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      color: textMuted,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        background: '#22C55E',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    Действует до
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', lineHeight: 1.3 }}>
                    {expiresLabel}
                  </div>
                </div>
              ) : null}

              {canManageBilling && cabinetId != null ? (
                isFreeView ? (
                  <Button
                    type="primary"
                    size="large"
                    onClick={goSubscription}
                    style={{
                      height: 44,
                      borderRadius: 12,
                      background: accent,
                      borderColor: accent,
                      fontWeight: 600,
                      paddingInline: 18,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      Выбрать тариф
                      <ArrowRightOutlined />
                    </span>
                  </Button>
                ) : (
                  <Button
                    size="large"
                    onClick={goSubscription}
                    style={{
                      height: 44,
                      borderRadius: 12,
                      borderColor: accent,
                      color: accent,
                      fontWeight: 600,
                      paddingInline: 16,
                      background: '#fff',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <CreditCardOutlined />
                      Управление подпиской
                      <ArrowRightOutlined />
                    </span>
                  </Button>
                )
              ) : null}
            </div>
          </div>

          <div
            className="subscription-feature-chips"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {FEATURE_CHIPS.map((chip) => {
              const unlocked = featureUnlocked[chip.key]
              const highlighted = Boolean(featureHighlighted[chip.key]) && unlocked
              return (
                <span
                  key={chip.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 10,
                    background: unlocked
                      ? (highlighted ? chipHighlightBg : chipBg)
                      : chipLockedBg,
                    color: unlocked ? accent : '#94A3B8',
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: 14, display: 'inline-flex', lineHeight: 1 }}>
                    {unlocked ? chip.icon : <LockOutlined />}
                  </span>
                  {chip.label}
                </span>
              )
            })}
          </div>

          <style>{`
            @media (max-width: 720px) {
              .subscription-card-top {
                flex-direction: column !important;
                align-items: stretch !important;
              }
              .subscription-card-actions {
                margin-left: 0 !important;
                width: 100%;
              }
              .subscription-card-actions .ant-btn {
                width: 100%;
              }
            }
          `}</style>
        </>
      )}
    </>
  )

  return (
    <>
      {isCabinetLayout ? (
        <Card
          className="subscription-card"
          style={{ borderRadius: 16, border: `1px solid ${border}` }}
          styles={{ body: { padding: 24 } }}
        >
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
    </>
  )
}
