import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data.token, data.email, data.userId, data.role)
      
      if (data.isTemporaryPassword) {
        setShowChangePasswordModal(true)
      } else {
        message.success('Вход выполнен успешно')
        navigate('/analytics')
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка входа')
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
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8, color: '#1E293B' }}>
            Solution
          </Title>
          <Text type="secondary" style={{ color: '#64748B' }}>
            Управление рекламными кампаниями Wildberries
          </Text>
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
      </Card>

      <ChangePasswordModal
        open={showChangePasswordModal}
        onSuccess={() => {
          setShowChangePasswordModal(false)
          message.success('Пароль успешно изменен')
          navigate('/analytics')
        }}
        onCancel={() => {
          setShowChangePasswordModal(false)
          useAuthStore.getState().clearAuth()
        }}
      />
    </div>
  )
}

