import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Form, Input, Button, Card, Typography, message, Checkbox, Tooltip, Radio } from 'antd'
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons'
import { authApi } from '../api/auth'
import { ACCESS_STATUS_QUERY_KEY, ACCESS_STATUS_STALE_MS, userApi } from '../api/user'
import { useAuthStore } from '../store/authStore'
import type { AccountType, RegisterRequest } from '../types/api'
import { ACCOUNT_TYPE_LABELS } from '../constants/accountTypeLabels'
import { getStoredInvitationToken } from '../constants/invitationStorage'
import SiteLogo from '../components/SiteLogo'
import { activateBidderTrialPlanIfAvailable } from '../utils/activateBidderTrialPlan'
import {
  consumeBidderTrialRegisterIntent,
  isBidderTrialRegisterSearch,
  markBidderTrialRegisterIntent,
} from '../utils/registerBidderTrial'

const { Title, Text } = Typography

const REGISTRATION_ACCOUNT_TYPES: AccountType[] = ['SELLER', 'AGENCY', 'EMPLOYEE']

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const setAuth = useAuthStore((state) => state.setAuth)
  const agreeToOffer = Form.useWatch('agreeToOffer', form)
  const invitationToken = getStoredInvitationToken()
  const isInviteFlow = invitationToken != null
  const consentTooltip = 'Необходимо согласие с условиями оферты и политикой конфиденциальности'

  useEffect(() => {
    if (isBidderTrialRegisterSearch(searchParams.toString())) {
      markBidderTrialRegisterIntent()
    }
  }, [searchParams])

  useEffect(() => {
    if (isInviteFlow) {
      form.setFieldValue('accountType', 'EMPLOYEE')
    }
  }, [isInviteFlow, form])

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: async (_, variables) => {
      try {
        const auth = await authApi.login({ email: variables.email, password: variables.password })
        setAuth(auth.token, auth.email, auth.userId, auth.role)
        userApi.sendEmailConfirmation().catch(() => { /* письмо не чаще 1 раза в 12 ч или ошибка отправки */ })
        message.success('Регистрация успешна')
        try {
          await queryClient.prefetchQuery({
            queryKey: ACCESS_STATUS_QUERY_KEY,
            queryFn: () => userApi.getAccessStatus(),
            staleTime: ACCESS_STATUS_STALE_MS,
          })
        } catch {
          /* см. Login */
        }
        if (consumeBidderTrialRegisterIntent()) {
          try {
            await activateBidderTrialPlanIfAvailable()
            message.success('Подключён пробный доступ к автозапуску рекламы на 3 дня')
          } catch {
            message.info('Аккаунт создан. Пробный доступ к автозапуску можно подключить в профиле после подтверждения email.')
          }
        }
        navigate('/profile')
      } catch {
        message.success('Регистрация успешна. Войдите в систему.')
        navigate('/login')
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Ошибка регистрации'
      message.error(msg)
    },
  })

  const onFinish = (values: {
    name: string
    email: string
    password: string
    confirmPassword: string
    accountType: AccountType
    agreeToOffer: boolean
    marketingConsent?: boolean
  }) => {
    if (!values.agreeToOffer) return
    const accountType = isInviteFlow ? 'EMPLOYEE' : values.accountType
    registerMutation.mutate({
      name: values.name.trim(),
      email: values.email,
      password: values.password,
      agreeToOffer: values.agreeToOffer,
      marketingConsent: values.marketingConsent ?? false,
      accountTypes: [accountType],
      invitationToken: invitationToken ?? undefined,
    })
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
      <Card style={{ width: '100%', maxWidth: 440, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <SiteLogo to="/" borderRadius={10} />
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 4, color: '#1E293B', margin: 0 }}>
              {isInviteFlow ? 'Регистрация по приглашению' : 'Регистрация'}
            </Title>
          </div>
        </div>

        {isInviteFlow && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 16, textAlign: 'center' }}>
            Вы регистрируетесь как сотрудник по приглашению в кабинет.
          </Text>
        )}

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
          initialValues={{ accountType: 'SELLER' }}
        >
          <Form.Item
            name="name"
            rules={[
              { required: true, message: 'Введите имя' },
              { max: 255, message: 'Имя слишком длинное' },
            ]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="Имя" autoComplete="name" />
          </Form.Item>
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
          <Form.Item
            name="accountType"
            label="Тип аккаунта"
            rules={[{ required: !isInviteFlow, message: 'Выберите тип аккаунта' }]}
          >
            <Radio.Group disabled={isInviteFlow}>
              {REGISTRATION_ACCOUNT_TYPES.map((type) => (
                <Radio key={type} value={type}>
                  {ACCOUNT_TYPE_LABELS[type]}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item name="agreeToOffer" valuePropName="checked">
            <Checkbox>
              Я согласен(-на) с условиями{' '}
              <Link to="/oferta" target="_blank" rel="noopener noreferrer" style={{ color: '#7C3AED' }}>
                Договора публичной оферты
              </Link>
              ,{' '}
              <Link to="/user-agreement" target="_blank" rel="noopener noreferrer" style={{ color: '#7C3AED' }}>
                Пользовательского соглашения
              </Link>
              ,{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#7C3AED' }}>
                Политика конфиденциальности
              </Link>
              {' '}и даю согласие на обработку моих персональных данных.
            </Checkbox>
          </Form.Item>
          <Form.Item name="marketingConsent" valuePropName="checked">
            <Checkbox>Я согласен(-на) на получение информационных и маркетинговых сообщений.</Checkbox>
          </Form.Item>
          <Form.Item>
            <style>{`
              .register-submit-btn.ant-btn-primary:disabled {
                opacity: 1 !important;
                color: #6D28D9 !important;
                background: #EDE9FE !important;
                border-color: #C4B5FD !important;
                cursor: not-allowed;
                box-shadow: none;
              }
            `}</style>
            <Tooltip title={!agreeToOffer ? consentTooltip : null}>
              <span style={{ display: 'inline-block', width: '100%' }}>
                <Button
                  className="register-submit-btn"
                  type="primary"
                  htmlType="submit"
                  loading={registerMutation.isPending}
                  block
                  disabled={!agreeToOffer}
                  style={{
                    height: 44,
                    width: '100%',
                    ...(agreeToOffer
                      ? { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }
                      : {}),
                  }}
                >
                  Зарегистрироваться
                </Button>
              </span>
            </Tooltip>
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
