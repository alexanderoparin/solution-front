import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Form, Input, Button, message, Spin, Tag, Space, Typography, Divider, Row, Col, Tooltip } from 'antd'
import { UserOutlined, KeyOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, EditOutlined, CheckCircleOutlined, LogoutOutlined, SyncOutlined } from '@ant-design/icons'
import { userApi } from '../api/user'
import { authApi } from '../api/auth'
import type { UserProfileResponse, UpdateApiKeyRequest, ChangePasswordRequest } from '../types/api'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'
import Header from '../components/Header'

const { Text } = Typography

export default function Profile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [apiKeyForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [isApiKeyExpanded, setIsApiKeyExpanded] = useState(false)
  const [showApiKeyForm, setShowApiKeyForm] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  
  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const { data: profile, isLoading, error } = useQuery<UserProfileResponse>({
    queryKey: ['userProfile'],
    queryFn: () => userApi.getProfile(),
  })

  const updateApiKeyMutation = useMutation({
    mutationFn: (data: UpdateApiKeyRequest) => userApi.updateApiKey(data),
    onSuccess: (data) => {
      message.success(data.message)
      apiKeyForm.resetFields()
      setShowApiKeyForm(false)
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка обновления API ключа')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: () => {
      message.success('Пароль успешно изменен')
      passwordForm.resetFields()
      setShowPasswordForm(false)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка смены пароля')
    },
  })

  const validateApiKeyMutation = useMutation({
    mutationFn: () => userApi.validateApiKey(),
    onSuccess: (data) => {
      message.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка проверки API ключа')
    },
  })

  const triggerDataUpdateMutation = useMutation({
    mutationFn: () => userApi.triggerDataUpdate(),
    onSuccess: (data) => {
      message.success(data.message)
      // Обновляем профиль, чтобы получить актуальное время последнего обновления
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка запуска обновления данных')
    },
  })

  const handleApiKeySubmit = (values: { wbApiKey: string }) => {
    updateApiKeyMutation.mutate({ wbApiKey: values.wbApiKey })
  }

  const handlePasswordSubmit = (values: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Пароли не совпадают')
      return
    }

    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return dayjs(dateString).format('DD.MM.YYYY HH:mm')
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        padding: '24px', 
        textAlign: 'center' 
      }}>
        <Text type="danger">Ошибка загрузки профиля</Text>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <>
      <Header />
      <div style={{ 
        width: '100%',
        padding: '24px',
        minHeight: '100vh',
        backgroundColor: '#F8FAFC'
      }}>
        {/* Информация о пользователе */}
        <Card 
          title={
            <Space>
              <UserOutlined />
              <span>Информация о пользователе</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} sm={6}>
              <div>
                <Text type="secondary">Email:</Text>
                <div style={{ marginTop: '4px' }}>
                  <Text strong>{profile.email}</Text>
                </div>
              </div>
            </Col>
            
            <Col xs={24} sm={6}>
              <div>
                <Text type="secondary">Роль:</Text>
                <div style={{ marginTop: '4px' }}>
                  <Tag color={profile.role === 'SELLER' ? 'purple' : 'blue'}>
                    {profile.role === 'SELLER' ? 'Продавец' : profile.role}
                  </Tag>
                </div>
              </div>
            </Col>

            <Col xs={24} sm={6}>
              <div>
                <Text type="secondary">Статус:</Text>
                <div style={{ marginTop: '4px' }}>
                  <Tag color={profile.isActive ? 'success' : 'default'}>
                    {profile.isActive ? 'Активен' : 'Неактивен'}
                  </Tag>
                </div>
              </div>
            </Col>

            <Col xs={24} sm={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {!showPasswordForm ? (
                  <Button
                    type="primary"
                    icon={<LockOutlined />}
                    onClick={() => setShowPasswordForm(true)}
                    block
                    size="large"
                    style={{
                      backgroundColor: '#7C3AED',
                      borderColor: '#7C3AED',
                    }}
                  >
                    Сменить пароль
                  </Button>
                ) : null}
                <Button
                  type="primary"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  block
                  size="large"
                >
                  Выйти из системы
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* WB API Ключ (только для продавцов) */}
        {profile.role === 'SELLER' && (
          <Card 
            title={
              <Space>
                <KeyOutlined />
                <span>WB API Ключ</span>
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            {profile.apiKey && (
              <Row gutter={24} style={{ marginBottom: '16px' }}>
                {/* Первый столбец: API Ключ и под ним "Сменить ключ" */}
                <Col xs={24} sm={8}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }} align="center">
                    <div style={{ textAlign: 'center', width: '100%' }}>
                      <Text type="secondary">API Ключ:</Text>
                      <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
                        <Space>
                          <Text 
                            code 
                            copyable={{ text: profile.apiKey.apiKey || '' }}
                            style={{ 
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontFamily: 'monospace',
                              maxWidth: '100%',
                              wordBreak: 'break-all'
                            }}
                            onClick={() => setIsApiKeyExpanded(!isApiKeyExpanded)}
                          >
                            {profile.apiKey.apiKey && !isApiKeyExpanded
                              ? `${profile.apiKey.apiKey.substring(0, 8)}...${profile.apiKey.apiKey.substring(profile.apiKey.apiKey.length - 8)}`
                              : profile.apiKey.apiKey}
                          </Text>
                          <Button
                            type="text"
                            size="small"
                            icon={isApiKeyExpanded ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                            onClick={() => setIsApiKeyExpanded(!isApiKeyExpanded)}
                            style={{ padding: '0 4px' }}
                          />
                        </Space>
                      </div>
                    </div>
                    <Button
                      type="default"
                      icon={<EditOutlined />}
                      onClick={() => setShowApiKeyForm(true)}
                      style={{ width: '100%' }}
                    >
                      Сменить ключ
                    </Button>
                  </Space>
                </Col>

                {/* Второй столбец: Дата последней проверки и кнопка "Проверить ключ" */}
                <Col xs={24} sm={8}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }} align="center">
                    {profile.apiKey.lastValidatedAt ? (
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Последняя проверка:</Text>
                        <div style={{ marginTop: '4px' }}>
                          <Text style={{ fontSize: '12px' }}>{formatDate(profile.apiKey.lastValidatedAt)}</Text>
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '40px' }}></div>
                    )}
                    <Button
                      type="default"
                      icon={<CheckCircleOutlined />}
                      onClick={() => validateApiKeyMutation.mutate()}
                      loading={validateApiKeyMutation.isPending}
                      style={{ width: '100%' }}
                    >
                      Проверить ключ
                    </Button>
                  </Space>
                </Col>

                {/* Третий столбец: Дата последнего обновления и кнопка "Обновить данные" */}
                <Col xs={24} sm={8}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }} align="center">
                    {profile.apiKey.lastDataUpdateAt ? (
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Последнее обновление:</Text>
                        <div style={{ marginTop: '4px' }}>
                          <Text style={{ fontSize: '12px' }}>{formatDate(profile.apiKey.lastDataUpdateAt)}</Text>
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: '40px' }}></div>
                    )}
                    <Tooltip title="Запускает обновление карточек, кампаний и аналитики. Процесс выполняется в фоновом режиме.">
                      <Button
                        type="default"
                        icon={<SyncOutlined />}
                        onClick={() => triggerDataUpdateMutation.mutate()}
                        loading={triggerDataUpdateMutation.isPending}
                        style={{ width: '100%' }}
                      >
                        Обновить данные
                      </Button>
                    </Tooltip>
                  </Space>
                </Col>
              </Row>
            )}

            {profile.apiKey?.validationError && (
              <div>
                <Text type="secondary">Ошибка валидации:</Text>
                <div style={{ marginTop: '4px' }}>
                  <Text type="danger">{profile.apiKey.validationError}</Text>
                </div>
              </div>
            )}

            {!showApiKeyForm && !profile.apiKey && (
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => setShowApiKeyForm(true)}
                block
                size="large"
              >
                Добавить ключ
              </Button>
            )}

            {showApiKeyForm && (
              <>
                <Divider />
                <Form
                  form={apiKeyForm}
                  onFinish={handleApiKeySubmit}
                  layout="vertical"
                  autoComplete="off"
                >
                  <Form.Item
                    label="Новый WB API ключ"
                    name="wbApiKey"
                    rules={[
                      { required: true, message: 'Введите WB API ключ' },
                      { min: 10, message: 'API ключ должен содержать минимум 10 символов' },
                    ]}
                  >
                    <Input.Password
                      prefix={<KeyOutlined />}
                      placeholder="Введите новый WB API ключ"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Button
                        onClick={() => {
                          setShowApiKeyForm(false)
                          apiKeyForm.resetFields()
                        }}
                        size="large"
                      >
                        Отмена
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={updateApiKeyMutation.isPending}
                        size="large"
                        style={{
                          backgroundColor: '#7C3AED',
                          borderColor: '#7C3AED',
                        }}
                      >
                        Обновить API ключ
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </>
            )}
          </Card>
        )}

        {/* Смена пароля */}
        {showPasswordForm && (
          <Card 
            title={
              <Space>
                <LockOutlined />
                <span>Смена пароля</span>
              </Space>
            }
          >
            <Form
              form={passwordForm}
              onFinish={handlePasswordSubmit}
              layout="vertical"
              autoComplete="off"
            >
              <Form.Item
                label="Текущий пароль"
                name="currentPassword"
                rules={[{ required: true, message: 'Введите текущий пароль' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Введите текущий пароль"
                  size="large"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item
                label="Новый пароль"
                name="newPassword"
                rules={[
                  { required: true, message: 'Введите новый пароль' },
                  { min: 6, message: 'Пароль должен содержать минимум 6 символов' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Введите новый пароль"
                  size="large"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                label="Подтвердите новый пароль"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Подтвердите новый пароль' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Пароли не совпадают'))
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Подтвердите новый пароль"
                  size="large"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Button
                    onClick={() => {
                      setShowPasswordForm(false)
                      passwordForm.resetFields()
                    }}
                    size="large"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={changePasswordMutation.isPending}
                    size="large"
                    style={{
                      backgroundColor: '#7C3AED',
                      borderColor: '#7C3AED',
                    }}
                  >
                    Изменить пароль
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}

      </div>
    </>
  )
}
