import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authApi } from '../api/auth'
import type { RegisterRequest } from '../types/api'

const { Title, Text } = Typography

export default function Register() {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      message.success('Регистрация успешна. Войдите в систему.')
      navigate('/login')
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Ошибка регистрации'
      message.error(msg)
    },
  })

  const onFinish = (values: { email: string; password: string; confirmPassword: string }) => {
    registerMutation.mutate({ email: values.email, password: values.password })
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
            <Title level={2} style={{ marginBottom: 4, color: '#1E293B', margin: 0 }}>Регистрация</Title>
            <Text type="secondary" style={{ color: '#64748B', fontSize: 14 }}>WB-Solution</Text>
          </div>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Минимум 6 символов' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Пароль" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Повторите пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Пароли не совпадают'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Повторите пароль" autoComplete="new-password" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={registerMutation.isPending}
              block
              style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED', height: 44 }}
            >
              Зарегистрироваться
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">Уже есть аккаунт? </Text>
          <Link to="/login" style={{ color: '#7C3AED', fontWeight: 500 }}>Войти</Link>
        </div>
      </Card>
    </div>
  )
}
