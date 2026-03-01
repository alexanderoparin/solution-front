import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { authApi } from '../api/auth'

const { Title, Text } = Typography

export default function ForgotPassword() {
  const forgotMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      message.success('Если аккаунт с таким email существует, на него отправлена ссылка для сброса пароля.')
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Ошибка отправки'
      message.error(msg)
    },
  })

  const onFinish = (values: { email: string }) => {
    forgotMutation.mutate(values.email)
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
      <Card style={{ width: '100%', maxWidth: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
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
            <Title level={2} style={{ marginBottom: 4, color: '#1E293B', margin: 0 }}>Восстановление пароля</Title>
            <Text type="secondary" style={{ color: '#64748B', fontSize: 14 }}>Введите email для отправки ссылки</Text>
          </div>
        </div>

        <Form name="forgot" onFinish={onFinish} layout="vertical" size="large" autoComplete="off">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" autoComplete="email" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={forgotMutation.isPending}
              block
              style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED', height: 44 }}
            >
              Отправить ссылку
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login" style={{ color: '#7C3AED', fontWeight: 500 }}>Вернуться к входу</Link>
        </div>
      </Card>
    </div>
  )
}
