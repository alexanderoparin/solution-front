import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Card, Typography, Spin, Button } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { authApi } from '../api/auth'
import { useEffect } from 'react'

const { Title, Text } = Typography

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const confirmMutation = useMutation({
    mutationFn: (t: string) => authApi.confirmEmail(t),
    onSuccess: () => {
      navigate('/login', { replace: true, state: { message: 'Email подтверждён. Войдите в систему.' } })
    },
    onError: () => {},
  })

  useEffect(() => {
    if (token && !confirmMutation.isPending && !confirmMutation.isSuccess && !confirmMutation.isError) {
      confirmMutation.mutate(token)
    }
  }, [token])

  if (!token) {
    return (
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
        <Card style={{ width: '100%', maxWidth: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
          <Title level={4} style={{ marginBottom: 16 }}>Неверная ссылка</Title>
          <Text type="secondary">Ссылка для подтверждения почты недействительна или отсутствует. Запросите новое письмо в профиле.</Text>
          <div style={{ marginTop: 24 }}>
            <Link to="/login" style={{ color: '#7C3AED', fontWeight: 500 }}>Войти</Link>
          </div>
        </Card>
      </div>
    )
  }

  if (confirmMutation.isPending) {
    return (
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
        <Card style={{ width: '100%', maxWidth: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}><Text type="secondary">Подтверждение email…</Text></div>
        </Card>
      </div>
    )
  }

  if (confirmMutation.isError) {
    const msg = (confirmMutation.error as any)?.response?.data?.error ?? (confirmMutation.error as any)?.response?.data?.message ?? 'Ссылка недействительна или истекла.'
    return (
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
        <Card style={{ width: '100%', maxWidth: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
          <Title level={4} style={{ marginBottom: 16 }}>Ошибка подтверждения</Title>
          <Text type="secondary">{msg}</Text>
          <div style={{ marginTop: 24 }}>
            <Text type="secondary">Запросите новое письмо для подтверждения в разделе «Профиль».</Text>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link to="/login" style={{ color: '#7C3AED', fontWeight: 500 }}>Войти</Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
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
      <Card style={{ width: '100%', maxWidth: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
        <Title level={4} style={{ marginBottom: 8 }}>Email подтверждён</Title>
        <Text type="secondary">Ваш адрес электронной почты успешно подтверждён.</Text>
        <div style={{ marginTop: 24 }}>
          <Button type="primary" onClick={() => navigate('/login')} style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}>
            Войти
          </Button>
        </div>
      </Card>
    </div>
  )
}
