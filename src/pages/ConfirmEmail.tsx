import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Typography, Spin, Button, Modal } from 'antd'
import { CloseCircleOutlined } from '@ant-design/icons'
import { authApi } from '../api/auth'
import { ACCESS_STATUS_QUERY_KEY, ACCESS_STATUS_STALE_MS, userApi } from '../api/user'
import { useAuthStore } from '../store/authStore'
import { EMAIL_CONFIRMED_MODAL_KEY } from '../constants/emailConfirmStorage'
import { useEffect, useState } from 'react'

const { Title, Text } = Typography

const PROFILE_AFTER_CONFIRM = '/profile?emailConfirmed=1'

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)
  const token = searchParams.get('token')
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const confirmMutation = useMutation({
    mutationFn: (t: string) => authApi.confirmEmail(t),
    onSuccess: async (auth) => {
      setAuth(auth.token, auth.email, auth.userId, auth.role)
      try {
        sessionStorage.setItem(EMAIL_CONFIRMED_MODAL_KEY, '1')
      } catch {
        /* ignore */
      }
      try {
        await queryClient.prefetchQuery({
          queryKey: ACCESS_STATUS_QUERY_KEY,
          queryFn: () => userApi.getAccessStatus(),
          staleTime: ACCESS_STATUS_STALE_MS,
        })
      } catch {
        /* AccessGuard повторит */
      }
      void queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      navigate(PROFILE_AFTER_CONFIRM, { replace: true })
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
        ?? (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message
        ?? 'Ссылка недействительна или истекла.'
      setErrorMessage(msg)
      setErrorModalOpen(true)
    },
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
        {confirmMutation.isPending || confirmMutation.isSuccess ? (
          <>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                {confirmMutation.isSuccess ? 'Входим в аккаунт…' : 'Подтверждение email…'}
              </Text>
            </div>
          </>
        ) : (
          <Text type="secondary">Обработка подтверждения email…</Text>
        )}
      </Card>

      <Modal
        open={errorModalOpen}
        centered
        onCancel={() => setErrorModalOpen(false)}
        footer={[
          <Button key="login" onClick={() => navigate('/login')}>
            Войти
          </Button>,
          <Button
            key="profile"
            type="primary"
            onClick={() => navigate('/profile')}
            style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
          >
            Перейти в профиль
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <CloseCircleOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
          <Title level={4} style={{ marginBottom: 8 }}>Ошибка подтверждения</Title>
          <Text type="secondary">{errorMessage}</Text>
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Запросите новое письмо для подтверждения в разделе «Профиль».</Text>
          </div>
        </div>
      </Modal>
    </div>
  )
}
