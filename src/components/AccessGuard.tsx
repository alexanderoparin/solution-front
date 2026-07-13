import { useQuery } from '@tanstack/react-query'
import { useNavigate, Navigate } from 'react-router-dom'
import { Button, Card, Spin, Typography } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { ACCESS_STATUS_QUERY_KEY, ACCESS_STATUS_STALE_MS, userApi } from '../api/user'
import { cabinetsApi } from '../api/cabinets'
import { getRequestFailureDescription, isTransientRequestError } from '../utils/requestError'
import { useAuthStore } from '../store/authStore'
import type { AccountType } from '../types/api'
import Header from './Header'
import Breadcrumbs from './Breadcrumbs'
import NoCabinetsPlaceholder from './NoCabinetsPlaceholder'

interface AccessGuardProps {
  children: React.ReactNode
}

const OWNER_ACCOUNT_TYPES: AccountType[] = ['SELLER', 'AGENCY']

function isOwnerAccount(accountTypes: AccountType[] | undefined): boolean {
  return accountTypes?.some((t) => OWNER_ACCOUNT_TYPES.includes(t)) ?? false
}

/**
 * Для авторизованных пользователей проверяет доступ (подписка / подтверждение почты).
 * Без подтверждённой почты — экран с переходом в профиль.
 * Владелец без кабинетов — онбординг с добавлением кабинета.
 * Нет доступа по подписке — редирект на /subscribe.
 */
export default function AccessGuard({ children }: AccessGuardProps) {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'ADMIN'

  const {
    data: access,
    isPending,
    isError,
    isFetching,
    refetch,
    error: accessError,
  } = useQuery({
    queryKey: ACCESS_STATUS_QUERY_KEY,
    queryFn: () => userApi.getAccessStatus(),
    staleTime: ACCESS_STATUS_STALE_MS,
    retry: (failureCount, err) => failureCount < 3 && isTransientRequestError(err),
    retryDelay: (attempt) => Math.min(1200 * 2 ** attempt, 10000),
  })

  const emailConfirmed = access?.emailConfirmed === true

  const { data: profile, isPending: profilePending } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userApi.getProfile(),
    enabled: !isAdmin && emailConfirmed,
    staleTime: ACCESS_STATUS_STALE_MS,
  })

  const {
    data: cabinetsOverview,
    isPending: overviewPending,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['cabinetsOverview'],
    queryFn: () => cabinetsApi.getOverview(),
    enabled: !isAdmin && emailConfirmed,
    staleTime: 30_000,
  })

  if (isError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          padding: 24,
          gap: 16,
          textAlign: 'center',
          maxWidth: 420,
          margin: '0 auto',
        }}
      >
        <Typography.Paragraph type="danger" style={{ marginBottom: 0 }}>
          Не удалось проверить доступ к сервису. {getRequestFailureDescription(accessError)}
        </Typography.Paragraph>
        <Button type="primary" loading={isFetching} onClick={() => refetch()} style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}>
          Повторить
        </Button>
      </div>
    )
  }

  if (isPending || access === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!access.emailConfirmed) {
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

  if (
    !isAdmin
    && (profilePending || overviewPending)
  ) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (
    !isAdmin
    && isOwnerAccount(profile?.accountTypes)
    && cabinetsOverview != null
    && cabinetsOverview.owned.length === 0
  ) {
    return (
      <>
        <Header />
        <Breadcrumbs />
        <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
          <NoCabinetsPlaceholder
            onCreated={() => {
              void refetchOverview()
              void refetch()
            }}
          />
        </div>
      </>
    )
  }

  if (!access.hasAccess) {
    return <Navigate to="/subscribe" replace />
  }

  return <>{children}</>
}
