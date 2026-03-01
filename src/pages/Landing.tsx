import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Typography, Spin } from 'antd'
import { subscriptionApi } from '../api/subscription'

const { Title, Text, Paragraph } = Typography

const REQUISITES = {
  name: 'Индивидуальный предприниматель Бурцев Даниил Викторович',
  inn: '482619660921',
  bank: 'ООО "Банк Точка"',
  bik: '044525104',
  account: '40802810620000210687',
  corrAccount: '30101810745374525104',
}

const CONTACT_EMAIL = 'support@wb-solution.ru'
const CONTACT_PHONE = '+7 920 526 5666'
// Ссылки как на wbreshenie.ru
const TELEGRAM_URL = 'https://t.me/buryanexx'
const WHATSAPP_URL = 'https://wa.me/79205265666?text=Добрый%20день!%20Хочу%20узнать%20про%20Solution.'

export default function Landing() {
  const navigate = useNavigate()
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => subscriptionApi.getPlans(),
  })

  const formatPrice = (rub: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 0 }).format(rub) + ' ₽'

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #F1F5F9 100%)',
      }}
    >
      <header
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#7C3AED',
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
          <Title level={4} style={{ margin: 0, color: '#1E293B' }}>
            Solution
          </Title>
        </div>
        <Button type="primary" onClick={() => navigate('/login')} style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}>
          Войти
        </Button>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 64px' }}>
        <section style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title level={1} style={{ color: '#1E293B', marginBottom: 16 }}>
            Управление рекламными кампаниями Wildberries
          </Title>
          <Paragraph style={{ fontSize: 18, color: '#64748B', maxWidth: 600, margin: '0 auto' }}>
            Сервис для продавцов WB: аналитика товаров и воронок, рекламные кампании, отчёты и управление кабинетами в одном месте.
          </Paragraph>
        </section>

        <section style={{ marginBottom: 48 }}>
          <Title level={2} style={{ color: '#1E293B', marginBottom: 24, textAlign: 'center' }}>
            Тарифы
          </Title>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Spin size="large" />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  style={{
                    width: 280,
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                >
                  <Title level={4} style={{ marginTop: 0, color: '#1E293B' }}>
                    {plan.name}
                  </Title>
                  {plan.description && (
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                      {plan.description}
                    </Text>
                  )}
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#7C3AED', marginBottom: 8 }}>
                    {formatPrice(plan.priceRub)}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    на {plan.periodDays === 30 ? '1 месяц' : plan.periodDays === 365 ? '1 год' : `${plan.periodDays} дн.`}
                  </Text>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: '16px 24px 20px',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 24,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 14, color: '#64748B' }}>
              © 2024–2025 Solution.
            </div>
            <div style={{ fontSize: 14, color: '#64748B' }}>
              {REQUISITES.name}
            </div>
            <div style={{ fontSize: 14, color: '#64748B' }}>
              ИНН: {REQUISITES.inn}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Link to="/privacy" style={{ color: '#7C3AED', fontSize: 14, textDecoration: 'underline' }}>
              Политика конфиденциальности
            </Link>
            <Link to="/refund" style={{ color: '#7C3AED', fontSize: 14, textDecoration: 'underline' }}>
              Политика возврата
            </Link>
            <Link to="/oferta" style={{ color: '#7C3AED', fontSize: 14, textDecoration: 'underline' }}>
              Публичная оферта
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 64 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>Контакты</div>
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#7C3AED', fontSize: 14, textDecoration: 'underline' }}>
                {CONTACT_EMAIL}
              </a>
              <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} style={{ color: '#7C3AED', fontSize: 14, textDecoration: 'underline' }}>
                {CONTACT_PHONE}
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1E293B',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.69 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.09c-.06-.04-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.53 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1E293B',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
