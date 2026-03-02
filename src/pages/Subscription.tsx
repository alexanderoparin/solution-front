import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button, Card, Spin, Table, Typography, message, Tag, Tooltip } from 'antd'
import { CreditCardOutlined } from '@ant-design/icons'
import { userApi } from '../api/user'
import { subscriptionApi } from '../api/subscription'
import type { PaymentDto } from '../types/api'
import { getPaymentStatusLabel, getPaymentStatusColor } from '../utils/paymentStatus'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import dayjs from 'dayjs'

const accent = '#7C3AED'

export default function Subscription() {
  const navigate = useNavigate()

  const { data: access, isLoading: accessLoading } = useQuery({
    queryKey: ['accessStatus'],
    queryFn: () => userApi.getAccessStatus(),
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

  if (accessLoading || access === undefined) {
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
                <Tag color="green">Активна</Tag>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {plans.map((plan) => (
                  <Button
                    key={plan.id}
                    type="primary"
                    icon={<CreditCardOutlined />}
                    loading={initiateMutation.isPending}
                    onClick={() => initiateMutation.mutate(plan.id)}
                    style={{ background: accent, borderColor: accent }}
                  >
                    {plan.name} — {plan.priceRub} ₽
                  </Button>
                ))}
              </div>
            )}
          </Card>

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
