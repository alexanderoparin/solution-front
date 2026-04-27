import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button, Card, Spin, Table, Typography, message, Tag, Tooltip } from 'antd'
import { userApi } from '../api/user'
import { subscriptionApi } from '../api/subscription'
import type { PaymentDto } from '../types/api'
import { getPaymentStatusLabel, getPaymentStatusColor } from '../utils/paymentStatus'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import dayjs from 'dayjs'

const accent = '#7C3AED'
const textPrimary = '#1E293B'
const textSecondary = '#64748B'
const border = '#E2E8F0'

export default function Subscription() {
  const navigate = useNavigate()

  const {
    data: access,
    isPending: accessPending,
    isError: accessError,
    isFetching: accessFetching,
    refetch: refetchAccess,
  } = useQuery({
    queryKey: ['accessStatus'],
    queryFn: () => userApi.getAccessStatus(),
    retry: false,
  })

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentDto[]>({
    queryKey: ['myPayments'],
    queryFn: () => userApi.getMyPayments(),
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => subscriptionApi.getPlans(),
  })

  const initiateMutation = useMutation({
    mutationFn: (planId: number) => subscriptionApi.initiatePayment(planId),
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        message.error('Не получен адрес оплаты')
      }
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка инициации оплаты')
    },
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

  if (accessError) {
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
            Не удалось загрузить статус подписки. Проверьте интернет-соединение.
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
  const agencyClient = access.agencyClient
  const billingEnabled = access.billingEnabled ?? true
  const subscriptionStatus = access.subscriptionStatus ?? null
  const isTrial = subscriptionStatus === 'trial'
  const expiresAt = access.subscriptionExpiresAt ? dayjs(access.subscriptionExpiresAt) : null
  const isExpired = expiresAt ? expiresAt.isBefore(dayjs()) : true

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
            <Typography.Text strong>Текущий статус: </Typography.Text>
            {agencyClient ? (
              <Tag color="blue">Клиент агентства</Tag>
            ) : hasAccess && expiresAt ? (
              <>
                {isTrial ? (
                  <Tag color="blue">Пробный период</Tag>
                ) : (
                  <Tag color="green">Активна</Tag>
                )}
                <span style={{ marginLeft: 8 }}>
                  до {expiresAt.format('DD.MM.YYYY')}
                  {isExpired && ' (истекла)'}
                </span>
              </>
            ) : hasAccess ? (
              <Tag color="green">Доступ есть</Tag>
            ) : (
              <>
                <Tag color="orange">Нет доступа</Tag>
                <Button
                  type="link"
                  size="small"
                  style={{ marginLeft: 8 }}
                  onClick={() => navigate('/subscribe')}
                >
                  Оформить подписку
                </Button>
              </>
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
                      onClick={() => !initiateMutation.isPending && initiateMutation.mutate(plan.id)}
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
