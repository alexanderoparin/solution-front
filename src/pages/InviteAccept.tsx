import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Button, Card, Spin, Tag, Typography, message } from 'antd'
import { CheckCircleOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons'
import { invitationsApi } from '../api/invitations'
import { formatCabinetAccessSections } from '../constants/cabinetAccessSections'
import { useAuthStore } from '../store/authStore'
import { getRequestFailureDescription } from '../utils/requestError'

const { Title, Text } = Typography

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const authToken = useAuthStore((s) => s.token)
  const invitePath = token ? `/invite/${token}` : '/'

  const {
    data: preview,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['invitationPreview', token],
    queryFn: () => invitationsApi.preview(token!),
    enabled: !!token,
    retry: false,
  })

  const acceptMutation = useMutation({
    mutationFn: () => invitationsApi.accept(token!),
    onSuccess: () => {
      message.success('Приглашение принято')
      void refetch()
    },
    onError: (err: unknown) => {
      message.error(getRequestFailureDescription(err))
    },
  })

  const pageShell = (children: React.ReactNode) => (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 480, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        {children}
      </Card>
    </div>
  )

  if (!token) {
    return pageShell(
      <>
        <Title level={4} style={{ marginBottom: 16 }}>
          Неверная ссылка
        </Title>
        <Text type="secondary">Ссылка приглашения недействительна или отсутствует.</Text>
        <div style={{ marginTop: 24 }}>
          <Link to="/login" style={{ color: '#7C3AED', fontWeight: 500 }}>
            Войти
          </Link>
        </div>
      </>,
    )
  }

  if (isLoading) {
    return pageShell(
      <div style={{ textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Загрузка приглашения…</Text>
        </div>
      </div>,
    )
  }

  if (error || !preview) {
    return pageShell(
      <>
        <Title level={4} style={{ marginBottom: 16 }}>
          Приглашение недоступно
        </Title>
        <Text type="secondary">{getRequestFailureDescription(error)}</Text>
        <div style={{ marginTop: 24 }}>
          <Link to="/login" style={{ color: '#7C3AED', fontWeight: 500 }}>
            Войти
          </Link>
        </div>
      </>,
    )
  }

  const canAccept = authToken && !preview.expired && !preview.alreadyAccepted

  return pageShell(
    <>
      {preview.alreadyAccepted ? (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
        </div>
      ) : null}

      <Title level={4} style={{ marginBottom: 8 }}>
        Приглашение в кабинет
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        {preview.inviterName || preview.inviterEmail} приглашает вас в кабинет «{preview.cabinetName}».
      </Text>

      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">Email приглашения: </Text>
        <Text>{preview.email}</Text>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">Разделы: </Text>
        <Text>{formatCabinetAccessSections(preview.sections)}</Text>
      </div>

      {preview.expired && (
        <Alert type="warning" showIcon message="Срок приглашения истёк" style={{ marginBottom: 16 }} />
      )}
      {preview.alreadyAccepted && (
        <Alert type="success" showIcon message="Приглашение уже принято" style={{ marginBottom: 16 }} />
      )}

      {!authToken && !preview.expired && !preview.alreadyAccepted && (
        <>
          <Alert
            type="info"
            showIcon
            message="Войдите или зарегистрируйтесь"
            description="После авторизации вернитесь по этой ссылке, чтобы принять приглашение."
            style={{ marginBottom: 16 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to={`/login?next=${encodeURIComponent(invitePath)}`}>
              <Button type="primary" block icon={<LoginOutlined />} style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}>
                Войти
              </Button>
            </Link>
            <Link to={`/register?next=${encodeURIComponent(invitePath)}`}>
              <Button block icon={<UserAddOutlined />}>
                Зарегистрироваться
              </Button>
            </Link>
          </div>
        </>
      )}

      {canAccept && (
        <Button
          type="primary"
          block
          size="large"
          loading={acceptMutation.isPending}
          onClick={() => acceptMutation.mutate()}
          style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED', marginTop: 8 }}
        >
          Принять приглашение
        </Button>
      )}

      {authToken && preview.alreadyAccepted && (
        <Button type="primary" block onClick={() => navigate('/profile?inviteAccepted=1')} style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED', marginTop: 16 }}>
          Перейти к кабинетам
        </Button>
      )}

      {authToken && !preview.expired && !preview.alreadyAccepted && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Tag color="processing">Вы авторизованы</Tag>
        </div>
      )}
    </>,
  )
}
