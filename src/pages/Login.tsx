import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import ChangePasswordModal from '../components/ChangePasswordModal'
import type { LoginRequest } from '../types/api'

const { Title, Text } = Typography

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    const stateMessage = (location.state as { message?: string })?.message
    if (stateMessage) {
      message.success(stateMessage)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  const getInitialRoute = () => {
    return '/profile'
  }

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data.token, data.email, data.userId, data.role)
      
      if (data.isTemporaryPassword) {
        setShowChangePasswordModal(true)
      } else {
        message.success('Вход выполнен успешно')
        navigate(getInitialRoute())
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Ошибка входа'
      message.error(errorMessage)
    },
  })

  const onFinish = (values: LoginRequest) => {
    loginMutation.mutate(values)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
          <Link
            to="/"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              flexShrink: 0,
              textDecoration: 'none',
            }}
            title="На главную"
          >
            S
          </Link>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 4, color: '#1E293B', margin: 0 }}>
              WB-Solution
            </Title>
            <Text type="secondary" style={{ color: '#64748B', fontSize: 14 }}>
              Управление рекламными кампаниями Wildberries
            </Text>
          </div>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Пароль"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loginMutation.isPending}
              block
              style={{
                backgroundColor: '#7C3AED',
                borderColor: '#7C3AED',
                height: 44,
              }}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <Text type="secondary" style={{ marginRight: 4 }}>Нет аккаунта?</Text>
            <Link to="/register" style={{ color: '#7C3AED', fontWeight: 500 }}>Зарегистрироваться</Link>
          </div>
          <div>
            <Link to="/forgot-password" style={{ color: '#64748B', fontSize: 13 }}>Забыли пароль?</Link>
          </div>
        </div>
      </Card>

      <ChangePasswordModal
        open={showChangePasswordModal}
        onSuccess={() => {
          setShowChangePasswordModal(false)
          message.success('Пароль успешно изменен')
          navigate(getInitialRoute())
        }}
        onCancel={() => {
          setShowChangePasswordModal(false)
          useAuthStore.getState().clearAuth()
        }}
      />
    </div>
  )
}

