import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { authApi } from '../api/auth'

const { Title, Text } = Typography

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const resetMutation = useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
    onSuccess: () => {
      message.success('Пароль изменён. Войдите с новым паролем.')
      navigate('/login')
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Ошибка сброса пароля'
      message.error(msg)
    },
  })

  const onFinish = (values: { newPassword: string; confirmPassword: string }) => {
    if (!token) {
      message.error('Отсутствует токен сброса. Запросите ссылку заново.')
      return
    }
    resetMutation.mutate({ token, newPassword: values.newPassword })
  }

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
          <Text type="secondary">Ссылка для сброса пароля недействительна или отсутствует. Запросите новую ссылку.</Text>
          <div style={{ marginTop: 24 }}>
            <Link to="/forgot-password" style={{ color: '#7C3AED', fontWeight: 500 }}>Запросить ссылку</Link>
          </div>
          <div style={{ marginTop: 12 }}>
            <Link to="/login" style={{ color: '#64748B' }}>Войти</Link>
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
            <Title level={2} style={{ marginBottom: 4, color: '#1E293B', margin: 0 }}>Новый пароль</Title>
            <Text type="secondary" style={{ color: '#64748B', fontSize: 14 }}>Введите новый пароль</Text>
          </div>
        </div>

        <Form name="reset" onFinish={onFinish} layout="vertical" size="large" autoComplete="off">
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: 'Введите новый пароль' },
              { min: 6, message: 'Минимум 6 символов' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Новый пароль" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Повторите пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve()
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
              loading={resetMutation.isPending}
              block
              style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED', height: 44 }}
            >
              Сохранить пароль
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
