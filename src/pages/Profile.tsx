import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Form, Input, Button, message, Spin, Tag, Space, Typography, Divider, Row, Col, Tooltip, Modal } from 'antd'
import { UserOutlined, KeyOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, MinusOutlined, ExclamationCircleOutlined, LogoutOutlined, SyncOutlined, PlusOutlined, AppstoreOutlined, DeleteOutlined, CreditCardOutlined } from '@ant-design/icons'
import { userApi } from '../api/user'
import { authApi } from '../api/auth'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
import type { UserProfileResponse, ChangePasswordRequest, CabinetDto } from '../types/api'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import Header from '../components/Header'

dayjs.locale('ru')
import Breadcrumbs from '../components/Breadcrumbs'
import UsersManagementSection from '../components/UsersManagementSection'

const { Text } = Typography

export default function Profile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [passwordForm] = Form.useForm()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [editingCabinetId, setEditingCabinetId] = useState<number | null>(null)
  const [editingCabinetName, setEditingCabinetName] = useState('')
  const [newCabinetName, setNewCabinetName] = useState('')
  const [expandedKeyCabinetId, setExpandedKeyCabinetId] = useState<number | null>(null)
  const [showApiKeyFormForCabinetId, setShowApiKeyFormForCabinetId] = useState<number | null>(null)
  const [cabinetNewKeyValue, setCabinetNewKeyValue] = useState('')
  
  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const { data: profile, isLoading, error } = useQuery<UserProfileResponse>({
    queryKey: ['userProfile'],
    queryFn: () => userApi.getProfile(),
  })

  const { data: cabinets = [], isLoading: cabinetsLoading } = useQuery<CabinetDto[]>({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: profile?.role === 'SELLER',
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

  const sendEmailConfirmationMutation = useMutation({
    mutationFn: () => userApi.sendEmailConfirmation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      message.success('Письмо для подтверждения отправлено на вашу почту.')
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error ?? error.response?.data?.message ?? 'Ошибка отправки'
      message.error(msg)
    },
  })

  const createCabinetMutation = useMutation({
    mutationFn: (name: string) => cabinetsApi.create({ name }),
    onSuccess: () => {
      setNewCabinetName('')
      queryClient.invalidateQueries({ queryKey: ['cabinets'] })
      message.success('Кабинет создан')
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка создания кабинета')
    },
  })

  const updateCabinetMutation = useMutation({
    mutationFn: ({ id, name, apiKey }: { id: number; name?: string; apiKey?: string }) =>
      cabinetsApi.update(id, { ...(name !== undefined && { name }), ...(apiKey !== undefined && { apiKey }) }),
    onSuccess: (_, variables) => {
      setEditingCabinetId(null)
      if (variables.apiKey !== undefined) {
        setShowApiKeyFormForCabinetId(null)
        setCabinetNewKeyValue('')
      }
      queryClient.invalidateQueries({ queryKey: ['cabinets'] })
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      message.success('Кабинет обновлён')
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка обновления кабинета')
    },
  })

  const validateCabinetKeyMutation = useMutation({
    mutationFn: (cabinetId: number) => cabinetsApi.validateApiKey(cabinetId),
    onSuccess: (data) => {
      message.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['cabinets'] })
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка проверки ключа')
    },
  })

  const deleteCabinetMutation = useMutation({
    mutationFn: (id: number) => cabinetsApi.delete(id),
    onSuccess: (_, deletedId) => {
      if (getStoredCabinetId() === deletedId) {
        setStoredCabinetId(null)
      }
      queryClient.invalidateQueries({ queryKey: ['cabinets'] })
      message.success('Кабинет удалён')
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка удаления кабинета')
    },
  })

  const triggerDataUpdateMutation = useMutation({
    mutationFn: () => userApi.triggerDataUpdate(),
    onSuccess: (data) => {
      message.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
      queryClient.invalidateQueries({ queryKey: ['cabinets'] })
    },
    onError: (error: any) => {
      // Обрабатываем ошибку 429 (Too Many Requests) - слишком частые обновления
      const statusCode = error.response?.status
      const errorMessage = error.response?.data?.message || 'Ошибка запуска обновления данных'
      
      if (statusCode === 429) {
        message.error(errorMessage)
      } else {
        message.error(errorMessage)
      }
    },
  })

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

  // Минимальный интервал между обновлениями (6 часов)
  const MIN_UPDATE_INTERVAL_HOURS = 6

  // Более поздняя из двух дат: реальный старт обновления или запрос (кнопка нажата, задача в очереди)
  const getLastUpdateOrRequested = (cab: CabinetDto): string | null => {
    const a = cab.lastDataUpdateAt ?? cab.apiKey?.lastDataUpdateAt ?? null
    const b = cab.lastDataUpdateRequestedAt ?? cab.apiKey?.lastDataUpdateRequestedAt ?? null
    if (!a && !b) return null
    if (!a) return b
    if (!b) return a
    return dayjs(a).isAfter(dayjs(b)) ? a : b
  }

  // Проверяет, можно ли запустить обновление (6 ч с последнего старта или запроса)
  const canUpdateData = (cab: CabinetDto): boolean => {
    const lastAt = getLastUpdateOrRequested(cab)
    if (!lastAt) return true
    const hoursSinceLastUpdate = dayjs().diff(dayjs(lastAt), 'hour')
    return hoursSinceLastUpdate >= MIN_UPDATE_INTERVAL_HOURS
  }

  // Оставшееся время до следующего обновления
  const getRemainingTime = (cab: CabinetDto): string | null => {
    const lastAt = getLastUpdateOrRequested(cab)
    if (!lastAt) return null
    const lastUpdate = dayjs(lastAt)
    const hoursSinceLastUpdate = dayjs().diff(lastUpdate, 'hour')
    const minutesSinceLastUpdate = dayjs().diff(lastUpdate, 'minute')
    if (hoursSinceLastUpdate >= MIN_UPDATE_INTERVAL_HOURS) return null
    const remainingMinutes = MIN_UPDATE_INTERVAL_HOURS * 60 - minutesSinceLastUpdate
    const remainingHours = Math.floor(remainingMinutes / 60)
    const remainingMins = remainingMinutes % 60
    if (remainingHours > 0) {
      return `${remainingHours} ${getHoursWord(remainingHours)} ${remainingMins > 0 ? `и ${remainingMins} ${getMinutesWord(remainingMins)}` : ''}`
    }
    return `${remainingMins} ${getMinutesWord(remainingMins)}`
  }

  // Возвращает правильное склонение слова "час/часа/часов"
  const getHoursWord = (hours: number): string => {
    if (hours % 10 === 1 && hours % 100 !== 11) {
      return 'час'
    } else if (hours % 10 >= 2 && hours % 10 <= 4 && (hours % 100 < 10 || hours % 100 >= 20)) {
      return 'часа'
    } else {
      return 'часов'
    }
  }

  // Возвращает правильное склонение слова "минута/минуты/минут"
  const getMinutesWord = (minutes: number): string => {
    if (minutes % 10 === 1 && minutes % 100 !== 11) {
      return 'минута'
    } else if (minutes % 10 >= 2 && minutes % 10 <= 4 && (minutes % 100 < 10 || minutes % 100 >= 20)) {
      return 'минуты'
    } else {
      return 'минут'
    }
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
      <Header
        cabinetSelectProps={
          cabinets.length > 0
            ? {
                cabinets: cabinets.map((c) => ({ id: c.id, name: c.name })),
                selectedCabinetId: getStoredCabinetId(),
                onCabinetChange: setStoredCabinetId,
                loading: cabinetsLoading,
              }
            : undefined
        }
      />
      <Breadcrumbs />
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
          <Row gutter={[24, 16]} align="middle" style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
            <Col xs={24} sm={24} style={{ flex: '1 1 0%', minWidth: 120, maxWidth: '100%' }} className="profile-info-col">
              <div>
                <Text type="secondary">Email:</Text>
                <div style={{ marginTop: '4px' }}>
                  <div><Text strong>{profile.email}</Text></div>
                  {profile.role === 'SELLER' && !profile.isAgencyClient && (
                    <div style={{ marginTop: 6 }}>
                      {profile.emailConfirmed ? (
                        <span style={{ fontSize: 13, color: '#52c41a', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircleOutlined /> Подтверждён
                        </span>
                      ) : (
                        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ fontSize: 13, color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ExclamationCircleOutlined style={{ color: '#f59e0b' }} /> Не подтверждён
                          </span>
                          {(() => {
                            const sentAt = profile.lastEmailConfirmationSentAt ? new Date(profile.lastEmailConfirmationSentAt).getTime() : 0
                            const sentAtIso = profile.lastEmailConfirmationSentAt ?? null
                            const now = Date.now()
                            const cooldownMs = 24 * 60 * 60 * 1000
                            const canSendAgain = now - sentAt >= cooldownMs
                            const nextAvailableMs = sentAt ? sentAt + cooldownMs - now : 0
                            const sendButton = (
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => sendEmailConfirmationMutation.mutate()}
                                loading={sendEmailConfirmationMutation.isPending}
                                disabled={!canSendAgain}
                                style={{
                                  backgroundColor: canSendAgain ? '#7C3AED' : undefined,
                                  borderColor: canSendAgain ? '#7C3AED' : undefined,
                                  borderRadius: 6,
                                  fontWeight: 500,
                                }}
                              >
                                Отправить письмо
                              </Button>
                            )
                            return (
                              <>
                                {!canSendAgain && sentAtIso ? (
                                  <Tooltip title={`Письмо отправлено ${dayjs(sentAtIso).format('D MMM YYYY, HH:mm')}`}>
                                    <span style={{ display: 'inline-block' }}>{sendButton}</span>
                                  </Tooltip>
                                ) : (
                                  sendButton
                                )}
                                {!canSendAgain && sentAt > 0 && nextAvailableMs > 0 && (
                                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                    Повторно — через {Math.ceil(nextAvailableMs / (60 * 60 * 1000))} ч
                                  </span>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Col>
            
            <Col xs={24} sm={24} style={{ flex: '1 1 0%', minWidth: 80 }} className="profile-info-col">
              <div>
                <Text type="secondary">Роль:</Text>
                <div style={{ marginTop: '4px' }}>
                  <Tag color={profile.role === 'SELLER' ? 'purple' : 'blue'}>
                    {profile.role === 'SELLER' ? 'Продавец' : profile.role}
                  </Tag>
                </div>
              </div>
            </Col>

            {profile.role === 'SELLER' && profile.isAgencyClient && (
              <Col xs={24} sm={24} style={{ flex: '1 1 0%', minWidth: 100 }} className="profile-info-col">
                <div>
                  <Text type="secondary">Тип:</Text>
                  <div style={{ marginTop: '4px' }}>
                    <Tag color="cyan">Клиент агентства</Tag>
                  </div>
                </div>
              </Col>
            )}

            <Col xs={24} sm={24} style={{ flex: '1 1 0%', minWidth: 80 }} className="profile-info-col">
              <div>
                <Text type="secondary">Статус:</Text>
                <div style={{ marginTop: '4px' }}>
                  <Tag color={profile.isActive ? 'success' : 'default'}>
                    {profile.isActive ? 'Активен' : 'Неактивен'}
                  </Tag>
                </div>
              </div>
            </Col>

            <Col xs={24} sm={24} style={{ flex: '1 1 0%', minWidth: 180, display: 'flex', justifyContent: 'flex-end' }} className="profile-info-col">
              <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 220 }}>
                {!showPasswordForm ? (
                  <Button
                    type="primary"
                    icon={<LockOutlined />}
                    onClick={() => setShowPasswordForm(true)}
                    size="large"
                    style={{
                      backgroundColor: '#7C3AED',
                      borderColor: '#7C3AED',
                      width: '100%',
                    }}
                  >
                    Сменить пароль
                  </Button>
                ) : null}
                {profile.role === 'SELLER' && !profile.isAgencyClient && (
                  <Button
                    icon={<CreditCardOutlined />}
                    onClick={() => navigate('/subscription')}
                    size="large"
                    style={{ width: '100%' }}
                  >
                    Подписка
                  </Button>
                )}
                {profile.role === 'ADMIN' && (
                  <Button
                    icon={<CreditCardOutlined />}
                    onClick={() => navigate('/admin/plans')}
                    size="large"
                    style={{ width: '100%' }}
                  >
                    Планы и подписки
                  </Button>
                )}
                <Button
                  type="primary"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  size="large"
                  style={{ width: '100%' }}
                >
                  Выйти из системы
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Управление кабинетами (только для продавцов) */}
        {profile.role === 'SELLER' && (
          <Card
            title={
              <Space>
                <AppstoreOutlined />
                <KeyOutlined />
                <span>Управление кабинетами</span>
              </Space>
            }
            style={{ marginBottom: '24px' }}
          >
            {cabinetsLoading ? (
              <Spin />
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <Space>
                    <Input
                      placeholder="Название кабинета"
                      value={newCabinetName}
                      onChange={(e) => setNewCabinetName(e.target.value)}
                      style={{ width: 260 }}
                      onPressEnter={() => {
                        if (newCabinetName.trim()) createCabinetMutation.mutate(newCabinetName.trim())
                      }}
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        if (newCabinetName.trim()) {
                          createCabinetMutation.mutate(newCabinetName.trim())
                        } else {
                          message.warning('Введите название кабинета')
                        }
                      }}
                      loading={createCabinetMutation.isPending}
                      style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
                    >
                      Добавить кабинет
                    </Button>
                  </Space>
                </div>

                {cabinets.length === 0 ? (
                  <Text type="secondary">Нет кабинетов. Добавьте кабинет и привяжите к нему WB API ключ.</Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {cabinets.map((cab) => (
                      <div
                        key={cab.id}
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '16px',
                          backgroundColor: '#FAFAFA',
                        }}
                      >
                        {/* Название кабинета */}
                        <div style={{ marginBottom: '16px' }}>
                          {editingCabinetId === cab.id ? (
                            <Space>
                              <Input
                                value={editingCabinetName}
                                onChange={(e) => setEditingCabinetName(e.target.value)}
                                style={{ width: 220 }}
                                onPressEnter={() => {
                                  const v = editingCabinetName.trim()
                                  if (v) {
                                    updateCabinetMutation.mutate({ id: cab.id, name: v })
                                    setEditingCabinetId(null)
                                  }
                                }}
                              />
                              <Button
                                size="small"
                                onClick={() => {
                                  const v = editingCabinetName.trim()
                                  if (v) {
                                    updateCabinetMutation.mutate({ id: cab.id, name: v })
                                    setEditingCabinetId(null)
                                  }
                                }}
                              >
                                Сохранить
                              </Button>
                              <Button size="small" onClick={() => { setEditingCabinetId(null); setEditingCabinetName(''); }}>
                                Отмена
                              </Button>
                            </Space>
                          ) : (
                            <Space>
                              <Text strong style={{ fontSize: '16px' }}>{cab.name}</Text>
                              <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => {
                                  setEditingCabinetId(cab.id)
                                  setEditingCabinetName(cab.name)
                                }}
                              />
                              <Button
                                type="link"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                loading={deleteCabinetMutation.isPending}
                                onClick={() => {
                                  Modal.confirm({
                                    title: 'Удалить кабинет?',
                                    content: `Кабинет «${cab.name}» и все связанные данные (остатки, аналитика, кампании, заметки) будут удалены. Это действие нельзя отменить.`,
                                    okText: 'Удалить',
                                    okType: 'danger',
                                    cancelText: 'Отмена',
                                    onOk: () => deleteCabinetMutation.mutate(cab.id),
                                  })
                                }}
                              />
                            </Space>
                          )}
                        </div>

                        {/* Под кабинетом — инфо по ключу как раньше */}
                        {showApiKeyFormForCabinetId === cab.id ? (
                          <>
                            <Divider style={{ margin: '12px 0' }} />
                            <Space align="start">
                              <Input.Password
                                prefix={<KeyOutlined />}
                                placeholder="Введите новый WB API ключ"
                                value={cabinetNewKeyValue}
                                onChange={(e) => setCabinetNewKeyValue(e.target.value)}
                                style={{ width: 320 }}
                                autoComplete="off"
                              />
                              <Button
                                onClick={() => {
                                  setShowApiKeyFormForCabinetId(null)
                                  setCabinetNewKeyValue('')
                                }}
                              >
                                Отмена
                              </Button>
                              <Button
                                type="primary"
                                loading={updateCabinetMutation.isPending}
                                style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
                                onClick={() => {
                                  const key = cabinetNewKeyValue.trim()
                                  if (key) {
                                    updateCabinetMutation.mutate({ id: cab.id, apiKey: key })
                                  } else {
                                    message.warning('Введите ключ')
                                  }
                                }}
                              >
                                Сохранить ключ
                              </Button>
                            </Space>
                          </>
                        ) : (
                          <>
                            {cab.apiKey?.validationError && (
                              <div style={{ marginBottom: '8px' }}>
                                <Text type="danger">{cab.apiKey.validationError}</Text>
                              </div>
                            )}
                            <Row gutter={24} style={{ marginBottom: 0 }}>
                              <Col xs={24} sm={8}>
                                <Space direction="vertical" size="middle" style={{ width: '100%' }} align="center">
                                  <div style={{ textAlign: 'center', width: '100%' }}>
                                    <Text type="secondary">API Ключ:</Text>
                                    <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                                      {cab.apiKey?.apiKey ? (
                                        <Space>
                                          <Text
                                            code
                                            copyable={{ text: cab.apiKey.apiKey }}
                                            style={{
                                              cursor: 'pointer',
                                              fontSize: '13px',
                                              fontFamily: 'monospace',
                                              maxWidth: '100%',
                                              wordBreak: 'break-all',
                                            }}
                                            onClick={() => setExpandedKeyCabinetId(expandedKeyCabinetId === cab.id ? null : cab.id)}
                                          >
                                            {expandedKeyCabinetId === cab.id
                                              ? cab.apiKey.apiKey
                                              : `${cab.apiKey.apiKey.substring(0, 8)}...${cab.apiKey.apiKey.substring(cab.apiKey.apiKey.length - 8)}`}
                                          </Text>
                                          <Button
                                            type="text"
                                            size="small"
                                            icon={expandedKeyCabinetId === cab.id ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                            onClick={() => setExpandedKeyCabinetId(expandedKeyCabinetId === cab.id ? null : cab.id)}
                                            style={{ padding: '0 4px' }}
                                          />
                                        </Space>
                                      ) : (
                                        <Text type="secondary">Не задан</Text>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    type="default"
                                    icon={<EditOutlined />}
                                    onClick={() => {
                                      setShowApiKeyFormForCabinetId(cab.id)
                                      setCabinetNewKeyValue('')
                                    }}
                                    style={{ width: '100%' }}
                                  >
                                    Сменить ключ
                                  </Button>
                                </Space>
                              </Col>
                              <Col xs={24} sm={8}>
                                <Space direction="vertical" size="middle" style={{ width: '100%' }} align="center">
                                  {cab.apiKey?.lastValidatedAt ? (
                                    <div style={{ textAlign: 'center', width: '100%' }}>
                                      <Text type="secondary" style={{ fontSize: '12px' }}>Последняя проверка:</Text>
                                      <div style={{ marginTop: '4px' }}>
                                        <Text style={{ fontSize: '12px' }}>{formatDate(cab.apiKey.lastValidatedAt)}</Text>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ height: '40px' }} />
                                  )}
                                  <Button
                                    type="default"
                                    icon={<CheckCircleOutlined />}
                                    onClick={() => validateCabinetKeyMutation.mutate(cab.id)}
                                    loading={validateCabinetKeyMutation.isPending}
                                    style={{ width: '100%' }}
                                  >
                                    Проверить ключ
                                  </Button>
                                </Space>
                              </Col>
                              <Col xs={24} sm={8}>
                                <Space direction="vertical" size="middle" style={{ width: '100%' }} align="center">
                                  {cab.apiKey?.lastDataUpdateAt ? (
                                    <div style={{ textAlign: 'center', width: '100%' }}>
                                      <Text type="secondary" style={{ fontSize: '12px' }}>Последнее обновление:</Text>
                                      <div style={{ marginTop: '4px' }}>
                                        <Text style={{ fontSize: '12px' }}>{formatDate(cab.apiKey.lastDataUpdateAt)}</Text>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ height: '40px' }} />
                                  )}
                                  {(() => {
                                    const canUpdate = canUpdateData(cab)
                                    const remainingTime = getRemainingTime(cab)
                                    const tooltipTitle = canUpdate
                                      ? 'Запускает обновление карточек, кампаний и аналитики.'
                                      : `Обновление не чаще одного раза в ${MIN_UPDATE_INTERVAL_HOURS} ч. Через ${remainingTime || '…'}.`
                                    return (
                                      <Tooltip title={tooltipTitle}>
                                        <Button
                                          type="default"
                                          icon={<SyncOutlined />}
                                          onClick={() => triggerDataUpdateMutation.mutate()}
                                          loading={triggerDataUpdateMutation.isPending}
                                          disabled={!canUpdate || triggerDataUpdateMutation.isPending}
                                          style={{ width: '100%' }}
                                        >
                                          Обновить данные
                                        </Button>
                                      </Tooltip>
                                    )
                                  })()}
                                </Space>
                              </Col>
                            </Row>
                            {cab.scopeStatuses && cab.scopeStatuses.length > 0 && (
                              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                                  Доступ к категориям WB API
                                </Text>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                                  {cab.scopeStatuses.map((s) => (
                                    <Tooltip
                                      key={s.category}
                                      title={s.lastCheckedAt ? `Последняя проверка: ${formatDate(s.lastCheckedAt)}` : 'Не проверялось'}
                                    >
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'default' }}>
                                        {s.success === true && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                        {s.success === false && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                                        {(s.success !== true && s.success !== false) && <MinusOutlined style={{ color: '#8c8c8c' }} />}
                                        <span>{s.categoryDisplayName}</span>
                                        {s.success === false && s.errorMessage && (
                                          <span style={{ color: '#ff4d4f', fontSize: '12px' }} title={s.errorMessage}>
                                            ({s.errorMessage.length > 40 ? s.errorMessage.slice(0, 40) + '…' : s.errorMessage})
                                          </span>
                                        )}
                                      </span>
                                    </Tooltip>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        )}

        {/* Работники / Селлеры / Менеджеры */}
        {(profile.role === 'ADMIN' || profile.role === 'MANAGER' || profile.role === 'SELLER') && (
          <Card
            title={
              profile.role === 'ADMIN'
                ? 'Пользователи'
                : profile.role === 'MANAGER'
                  ? 'Селлеры'
                  : 'Работники'
            }
            style={{ marginBottom: '24px' }}
          >
            <UsersManagementSection />
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
