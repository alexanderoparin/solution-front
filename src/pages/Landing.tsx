import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Spin } from 'antd'
import { subscriptionApi } from '../api/subscription'

const accent = '#7C3AED'
const accentHover = '#6D28D9'
const textPrimary = '#1E293B'
const textSecondary = '#64748B'
const border = '#E2E8F0'
const cardBg = '#FFFFFF'

export default function Landing() {
  const navigate = useNavigate()
  const { data: status } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: () => subscriptionApi.getStatus(),
  })
  const billingEnabled = status?.billingEnabled ?? false
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscriptionPlans', billingEnabled],
    queryFn: () => subscriptionApi.getPlans(),
    enabled: billingEnabled,
  })

  const formatPrice = (rub: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 0 }).format(rub) + ' ₽'

  const cardStyle = {
    borderRadius: 16,
    border: `1px solid ${border}`,
    backgroundColor: cardBg,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.06)',
  }

  return (
    <div
      className="landing-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FAFBFF 0%, #F8FAFC 50%, #FFFFFF 100%)',
      }}
    >
      <style>{`
        .landing-page .tariff-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .landing-page .tariff-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,58,237,0.12); border-color: rgba(124,58,237,0.35); }
        .landing-page .trial-card { transition: box-shadow 0.2s ease; }
        .landing-page .trial-card:hover { box-shadow: 0 8px 24px rgba(124,58,237,0.1); }
      `}</style>

      <header
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${accent} 0%, ${accentHover} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            S
          </div>
          <span style={{ fontSize: 19, fontWeight: 600, color: textPrimary, letterSpacing: '-0.02em' }}>WB-Solution</span>
        </div>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/login')}
          style={{
            backgroundColor: accent,
            borderColor: accent,
            borderRadius: 12,
            paddingLeft: 20,
            paddingRight: 20,
            height: 40,
            fontWeight: 500,
          }}
        >
          Войти
        </Button>
      </header>

      <main style={{ maxWidth: 880, margin: '0 auto', width: '100%', padding: '64px 24px 48px', boxSizing: 'border-box' }}>
        {/* Hero */}
        <section style={{ textAlign: 'center', marginBottom: 56 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: accent,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Для продавцов Wildberries
          </p>
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 42px)',
              fontWeight: 700,
              color: textPrimary,
              marginBottom: 20,
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              maxWidth: 640,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Управление рекламными кампаниями в одном месте
          </h1>
          <p style={{ fontSize: 17, color: textSecondary, maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
            Аналитика товаров и воронок, рекламные кампании, отчёты и кабинеты — без лишних таблиц и переключений.
          </p>
        </section>

        {/* Trial — единый стиль карточки с акцентной полосой */}
        <section style={{ marginBottom: 48 }}>
          <Card
            className="trial-card"
            style={{
              ...cardStyle,
              borderLeft: `4px solid ${accent}`,
            }}
            bodyStyle={{ padding: '28px 32px' }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, justifyContent: 'space-between' }}>
              <div style={{ flex: '1 1 280px' }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: textPrimary, marginBottom: 8 }}>
                  Бесплатный доступ для новых пользователей
                </h2>
                <p style={{ fontSize: 15, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
                  {billingEnabled
                    ? 'Зарегистрируйтесь и подтвердите почту — даём пробный период с полным доступом. Потом выберите тариф ниже.'
                    : 'Зарегистрируйтесь и подтвердите почту — на данный момент сервис бесплатный. Если решим брать плату — заранее сообщим об этом.'}
                </p>
              </div>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/register')}
                style={{
                  flexShrink: 0,
                  backgroundColor: accent,
                  borderColor: accent,
                  borderRadius: 12,
                  paddingLeft: 28,
                  paddingRight: 28,
                  height: 48,
                  fontWeight: 500,
                  fontSize: 15,
                }}
              >
                Зарегистрироваться
              </Button>
            </div>
          </Card>
        </section>

        {/* Тарифы — показываем только при включённой оплате */}
        {billingEnabled && (
          <section style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: textSecondary,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              Тарифы
            </h2>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Spin size="large" />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className="tariff-card"
                    style={{ width: 280, ...cardStyle }}
                    bodyStyle={{ padding: '28px 24px' }}
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
                      {formatPrice(plan.priceRub)}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
