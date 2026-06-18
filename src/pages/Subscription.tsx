import { useNavigate } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Spin, Table, Typography, Tag, Tooltip } from 'antd'
import { PAYMENT_UNAVAILABLE_PATH } from '../constants/subscriptionRoutes'
import { ACCESS_STATUS_QUERY_KEY, ACCESS_STATUS_STALE_MS, userApi } from '../api/user'
import { subscriptionApi } from '../api/subscription'
import type { PaymentDto } from '../types/api'
import { getPaymentStatusLabel, getPaymentStatusColor } from '../utils/paymentStatus'
import { getRequestFailureDescription, isTransientRequestError } from '../utils/requestError'
import { campaignManageDaysLabel } from '../utils/campaignManageSubscription'
import { useCampaignManageSubscriptionUi } from '../store/campaignManageSubscriptionUi'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import dayjs from 'dayjs'

const accent = '#7C3AED'
const textPrimary = '#1E293B'
const textSecondary = '#64748B'
const border = '#E2E8F0'

export default function Subscription() {
  const navigate = useNavigate()
  const openPlans = useCampaignManageSubscriptionUi((s) => s.openPlans)

  const {
    data: access,
    isPending: accessPending,
    isError: accessQueryFailed,
    isFetching: accessFetching,
    refetch: refetchAccess,
    error: accessErr,
  } = useQuery({
    queryKey: ACCESS_STATUS_QUERY_KEY,
    queryFn: () => userApi.getAccessStatus(),
    staleTime: ACCESS_STATUS_STALE_MS,
    retry: (failureCount, err) => failureCount < 3 && isTransientRequestError(err),
    retryDelay: (attempt) => Math.min(1200 * 2 ** attempt, 10000),
  })

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentDto[]>({
    queryKey: ['myPayments'],
    queryFn: () => userApi.getMyPayments(),
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => subscriptionApi.getPlans(),
  })

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 2 }).format(amount) + ' ' + currency

  const formatPriceShort = (rub: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 0 }).format(rub) + ' ₽'

  const tariffCardStyle = {
    borderRadius: 16,
    border: `1px solid ${border}`,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  }

  if (accessQueryFailed) {
    return (
      <>
        <Header />
        <Breadcrumbs />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 48,
            backgroundColor: '#F8FAFC',
            textAlign: 'center',
          }}
        >
          <Typography.Paragraph type="danger" style={{ marginBottom: 0, maxWidth: 420 }}>
            Не удалось загрузить статус подписки. {getRequestFailureDescription(accessErr)}
          </Typography.Paragraph>
          <Button type="primary" loading={accessFetching} onClick={() => refetchAccess()} style={{ backgroundColor: accent, borderColor: accent }}>
            Повторить
          </Button>
        </div>
      </>
    )
  }

  if (accessPending || access === undefined) {
    return (
      <>
        <Header />
        <Breadcrumbs />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48, backgroundColor: '#F8FAFC' }}>
          <Spin size="large" />
        </div>
      </>
    )
  }

  const hasAccess = access.hasAccess
  const billingEnabled = access.billingEnabled ?? true
  const subscriptionStatus = access.subscriptionStatus ?? null
  const campaignManage = access.campaignManage
  const legacyExpiresAt = access.subscriptionExpiresAt ? dayjs(access.subscriptionExpiresAt) : null
  const isLegacyTrial = subscriptionStatus === 'trial'
  const isLegacyExpired = legacyExpiresAt ? legacyExpiresAt.isBefore(dayjs()) : true

  const statusRowStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 0',
    borderBottom: `1px solid ${border}`,
  }

  const renderCampaignManageStatus = () => {
    if (!campaignManage?.enabled) {
      if (hasAccess && legacyExpiresAt) {
        return (
          <>
            {isLegacyTrial ? <Tag color="blue">Пробный период</Tag> : <Tag color="green">Активна</Tag>}
            <Typography.Text>
              до {legacyExpiresAt.format('DD.MM.YYYY')}
              {isLegacyExpired && ' (истекла)'}
            </Typography.Text>
          </>
        )
      }
      if (hasAccess) {
        return <Tag color="green">Доступ есть</Tag>
      }
      return (
        <>
          <Tag color="orange">Нет доступа</Tag>
          <Button type="link" size="small" style={{ padding: 0, height: 'auto' }} onClick={() => navigate('/subscribe')}>
            Оформить подписку
          </Button>
        </>
      )
    }

    const cmExpiresAt = campaignManage.expiresAt ? dayjs(campaignManage.expiresAt) : null

    if (campaignManage.status === 'ACTIVE' && cmExpiresAt) {
      const days = campaignManage.daysRemaining ?? 0
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <Tag color="green">Подключено</Tag>
            <Typography.Text>
              Действует до <Typography.Text strong>{cmExpiresAt.format('DD.MM.YYYY HH:mm')}</Typography.Text>
            </Typography.Text>
          </div>
          <Typography.Text type="secondary">
            {days > 0 ? `Осталось ${campaignManageDaysLabel(days)}` : 'Осталось менее суток'}
          </Typography.Text>
          <Button
            type="link"
            size="small"
            style={{ padding: 0, height: 'auto', alignSelf: 'flex-start', color: accent }}
            onClick={openPlans}
          >
            Продлить или сменить тариф
          </Button>
        </div>
      )
    }

    if (campaignManage.status === 'EXPIRED' && cmExpiresAt) {
      const ago = campaignManage.daysExpiredAgo ?? 0
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Tag color="orange">Подписка истекла</Tag>
          <Typography.Text type="secondary">
            Закончилась {cmExpiresAt.format('DD.MM.YYYY HH:mm')}
            {ago > 0 ? ` (${campaignManageDaysLabel(ago)} назад)` : ' (сегодня)'}
          </Typography.Text>
          <Typography.Text>Раздел «Управление РК» недоступен до продления подписки.</Typography.Text>
          <Button type="primary" size="small" onClick={openPlans} style={{ alignSelf: 'flex-start', backgroundColor: accent, borderColor: accent }}>
            Подключить снова
          </Button>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Tag color="default">Не подключено</Tag>
        <Typography.Text type="secondary">
          Аналитика и реклама доступны бесплатно. Раздел «Управление РК» (расписание, автобюджет и др.) требует подписки.
        </Typography.Text>
        <Button type="primary" size="small" onClick={openPlans} style={{ alignSelf: 'flex-start', backgroundColor: accent, borderColor: accent }}>
          Подключить Управление РК
        </Button>
      </div>
    )
  }

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
        <div style={{ width: '100%', maxWidth: 1200 }}>
          <Typography.Title level={4} style={{ marginTop: 16, marginBottom: 24 }}>
            Подписка
          </Typography.Title>

          <Card
            style={{
              marginBottom: 24,
              borderRadius: 8,
            }}
          >
            <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
              Текущий статус
            </Typography.Title>

            {campaignManage?.enabled ? (
              <>
                <div style={statusRowStyle}>
                  <Typography.Text strong style={{ minWidth: 200 }}>
                    Аналитика и реклама
                  </Typography.Text>
                  <div>
                    <Tag color="cyan">Бесплатный доступ</Tag>
                    <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 8, maxWidth: 520 }}>
                      Основные разделы сервиса доступны без оплаты.
                    </Typography.Paragraph>
                  </div>
                </div>
                <div style={{ ...statusRowStyle, borderBottom: 'none', paddingBottom: 0 }}>
                  <Typography.Text strong style={{ minWidth: 200 }}>
                    Управление РК
                  </Typography.Text>
                  <div style={{ flex: 1, minWidth: 240 }}>{renderCampaignManageStatus()}</div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                <Typography.Text strong>Текущий статус: </Typography.Text>
                {renderCampaignManageStatus()}
              </div>
            )}
          </Card>

          {billingEnabled && (
            <Card
              title="Оплатить или продлить"
              style={{
                marginBottom: 24,
                borderRadius: 8,
              }}
            >
              {plans.length === 0 ? (
                <Typography.Text type="secondary">Нет доступных тарифов.</Typography.Text>
              ) : (
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                  {plans.map((plan) => (
                    <Card
                      key={plan.id}
                      style={{ width: 280, ...tariffCardStyle }}
                      bodyStyle={{ padding: '28px 24px' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.12)'
                        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.35)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = ''
                        e.currentTarget.style.boxShadow = tariffCardStyle.boxShadow
                        e.currentTarget.style.borderColor = border
                      }}
                      onClick={() => navigate(PAYMENT_UNAVAILABLE_PATH)}
                    >
                      <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>{plan.name}</div>
                      {plan.description && (
                        <div style={{ color: textSecondary, marginBottom: 20, fontSize: 14, lineHeight: 1.5 }}>
                          {plan.description}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: accent,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {formatPriceShort(plan.priceRub)}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card
            title="История платежей"
            style={{
              marginBottom: 24,
              borderRadius: 8,
            }}
          >
            {paymentsLoading ? (
              <Spin />
            ) : payments.length === 0 ? (
              <Typography.Text type="secondary">Платежей пока нет.</Typography.Text>
            ) : (
              <Table
                rowKey="id"
                columns={paymentColumns}
                dataSource={payments}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
