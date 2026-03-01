import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Spin } from 'antd'
import { subscriptionApi } from '../api/subscription'

const accentColor = '#7C3AED'
const accentHover = '#6D28D9'

export default function Landing() {
  const navigate = useNavigate()
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => subscriptionApi.getPlans(),
  })

  const formatPrice = (rub: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 0 }).format(rub) + ' ₽'

  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, #F0F4FF 0%, #FFFFFF 45%, #F8FAFC 100%)' }}>
      <style>{`
        .landing-page .tariff-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .landing-page .tariff-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(124,58,237,0.15); }
      `}</style>
      <header
        style={{
          padding: '18px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${accentColor} 0%, ${accentHover} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 18, boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
            S
          </div>
          <span style={{ fontSize: 20, fontWeight: 600, color: '#1E293B', letterSpacing: '-0.02em' }}>WB-Solution</span>
        </div>
        <Button type="primary" size="large" onClick={() => navigate('/login')} style={{ backgroundColor: accentColor, borderColor: accentColor, borderRadius: 10, paddingLeft: 20, paddingRight: 20, height: 42, fontWeight: 500, boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}>
          Войти
        </Button>
      </header>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: '56px 24px 72px', flex: 1 }}>
        <section style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700, color: '#0F172A', marginBottom: 20, lineHeight: 1.2, letterSpacing: '-0.03em' }}>
            Управление рекламными кампаниями Wildberries
          </h1>
          <p style={{ fontSize: 18, color: '#64748B', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Сервис для продавцов WB: аналитика товаров и воронок, рекламные кампании, отчёты и управление кабинетами в одном месте.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#1E293B', marginBottom: 28, textAlign: 'center' }}>
            Тарифы
          </h2>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className="tariff-card"
                  style={{
                    width: 300,
                    borderRadius: 16,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(226,232,240,0.8)',
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1E293B', marginBottom: 8 }}>{plan.name}</div>
                  {plan.description && (
                    <div style={{ color: '#64748B', marginBottom: 20, fontSize: 14 }}>{plan.description}</div>
                  )}
                  <div style={{ fontSize: 32, fontWeight: 700, color: accentColor, marginBottom: 8, letterSpacing: '-0.02em' }}>
                    {formatPrice(plan.priceRub)}
                  </div>
                  <div style={{ fontSize: 13, color: '#94A3B8' }}>
                    на {plan.periodDays === 30 ? '1 месяц' : plan.periodDays === 365 ? '1 год' : `${plan.periodDays} дн.`}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
