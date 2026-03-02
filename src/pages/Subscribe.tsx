import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button, Card, Spin, Typography, message } from 'antd'
import { CreditCardOutlined } from '@ant-design/icons'
import { subscriptionApi } from '../api/subscription'
import Header from '../components/Header'

const accent = '#7C3AED'
const textPrimary = '#1E293B'
const border = '#E2E8F0'

export default function Subscribe() {
  const navigate = useNavigate()

  const { data: plans = [], isLoading } = useQuery({
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

  const formatPrice = (rub: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 0 }).format(rub) + ' ₽'

  return (
    <>
      <Header />
      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <Typography.Title level={3} style={{ marginBottom: 8 }}>
          Оформите подписку
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Для доступа к аналитике и рекламе выберите и оплатите подходящий тариф.
        </Typography.Paragraph>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <Typography.Text type="secondary">Нет доступных тарифов. Обратитесь в поддержку.</Typography.Text>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {plans.map((plan) => (
              <Card
                key={plan.id}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <Typography.Title level={5} style={{ margin: '0 0 4px 0' }}>
                      {plan.name}
                    </Typography.Title>
                    {plan.description && (
                      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        {plan.description}
                      </Typography.Text>
                    )}
                    <div style={{ marginTop: 8, color: textPrimary, fontWeight: 600 }}>
                      {formatPrice(plan.priceRub)}
                      {plan.periodDays > 0 && (
                        <Typography.Text type="secondary" style={{ fontWeight: 400, marginLeft: 6 }}>
                          / {plan.periodDays} дн.
                        </Typography.Text>
                      )}
                    </div>
                  </div>
                  <Button
                    type="primary"
                    icon={<CreditCardOutlined />}
                    loading={initiateMutation.isPending}
                    onClick={() => initiateMutation.mutate(plan.id)}
                    style={{ background: accent, borderColor: accent }}
                  >
                    Оплатить
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <Button type="link" onClick={() => navigate('/profile')}>
            Вернуться в профиль
          </Button>
        </div>
      </div>
    </>
  )
}
