import { useQuery } from '@tanstack/react-query'
import { useNavigate, Navigate } from 'react-router-dom'
import { Button, Card, Spin, Typography } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { userApi } from '../api/user'
import { useAuthStore } from '../store/authStore'
import Header from './Header'
import Breadcrumbs from './Breadcrumbs'

interface AccessGuardProps {
  children: React.ReactNode
}

/**
 * Для авторизованных пользователей проверяет доступ (подписка / клиент агентства / подтверждение почты).
 * ADMIN и MANAGER всегда пропускаются.
 * Селлер без подтверждённой почты — показываем сообщение и кнопку «Перейти в профиль».
 * Нет доступа по подписке — редирект на /subscribe.
 */
export default function AccessGuard({ children }: AccessGuardProps) {
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)
  const { data: access, isLoading } = useQuery({
    queryKey: ['accessStatus'],
    queryFn: () => userApi.getAccessStatus(),
    retry: false,
  })

  if (role === 'ADMIN' || role === 'MANAGER') {
    return <>{children}</>
  }

  if (isLoading || access === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!access.agencyClient && !access.emailConfirmed) {
    return (
      <>
        <Header />
        <Breadcrumbs />
        <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
          <Card
            style={{ borderRadius: 12, borderLeft: '4px solid #7C3AED' }}
            bodyStyle={{ padding: 32 }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <MailOutlined style={{ fontSize: 28, color: '#7C3AED', marginTop: 4 }} />
              <div>
                <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 12 }}>
                  Подтвердите email для доступа
                </Typography.Title>
                <Typography.Paragraph style={{ color: '#64748B', marginBottom: 24 }}>
                  Чтобы пользоваться аналитикой, рекламой и другими разделами, нужно подтвердить адрес почты.
                  Перейдите в профиль и запросите письмо с ссылкой для подтверждения.
                </Typography.Paragraph>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate('/profile')}
                  style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
                >
                  Перейти в профиль
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </>
    )
  }

  if (!access.hasAccess && !access.agencyClient) {
    return <Navigate to="/subscribe" replace />
  }

  return <>{children}</>
}
