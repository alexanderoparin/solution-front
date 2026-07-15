import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { cabinetsApi } from '../../api/cabinets'
import { userApi } from '../../api/user'
import Header from '../../components/Header'
import Breadcrumbs from '../../components/Breadcrumbs'
import { useAuthStore } from '../../store/authStore'
import CabinetAccessPanel from './CabinetAccessPanel'
import { getRequestFailureDescription } from '../../utils/requestError'
import { buildScopeStatusTooltip, ScopeStatusIcon } from '../../utils/scopeStatusUi'
import {
  ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES,
  canUpdateCabinetData,
  canUpdateCabinetStocks,
  formatCabinetAdminDate,
  getCabinetRemainingTime,
  getCabinetStocksRemainingTime,
  maskApiKeyPreview,
  STOCKS_UPDATE_COOLDOWN_MINUTES,
} from '../../utils/cabinetAdminUtils'
import type { CabinetDto, CabinetTokenType, UpdateCabinetRequest } from '../../types/api'

dayjs.locale('ru')

const { Title, Text } = Typography

const border = '#E2E8F0'
const accent = '#7C3AED'

function tokenTypeLabel(tokenType?: 'PERSONAL' | 'BASIC' | null): string {
  if (tokenType === 'PERSONAL') return 'Персональный токен'
  return 'Базовый токен'
}

interface InfoBlockProps {
  label: string
  children: ReactNode
  action: ReactNode
}

function InfoBlock({ label, children, action }: InfoBlockProps) {
  return (
    <Card
      style={{
        height: '100%',
        borderRadius: 16,
        border: `1px solid ${border}`,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      }}
      styles={{
        body: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: 20,
          boxSizing: 'border-box',
        },
      }}
    >
      <Text type="secondary" style={{ fontSize: 13 }}>
        {label}
      </Text>
      <div style={{ flex: 1, minHeight: 56 }}>{children}</div>
      {action}
    </Card>
  )
}

export default function CabinetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const isAdmin = role === 'ADMIN'
  const cabinetId = id ? Number(id) : NaN

  const [editOpen, setEditOpen] = useState(false)
  const [tokenEditOpen, setTokenEditOpen] = useState(false)
  const [validateCooldown, setValidateCooldown] = useState(0)
  const [editForm] = Form.useForm<{ name: string }>()
  const [tokenForm] = Form.useForm<{ apiKey: string; tokenType: CabinetTokenType }>()

  useEffect(() => {
    if (validateCooldown <= 0) return
    const timer = setInterval(() => setValidateCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [validateCooldown])

  const {
    data: cabinet,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cabinet', cabinetId],
    queryFn: () => cabinetsApi.getById(cabinetId),
    enabled: Number.isFinite(cabinetId) && cabinetId > 0,
    retry: (failureCount, err) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 403 || status === 404) return false
      return failureCount < 2
    },
  })

  const invalidateCabinet = () => {
    void queryClient.invalidateQueries({ queryKey: ['cabinet', cabinetId] })
    void queryClient.invalidateQueries({ queryKey: ['cabinetsOverview'] })
    void queryClient.invalidateQueries({ queryKey: ['cabinets'] })
  }

  const updateMutation = useMutation({
    mutationFn: (body: UpdateCabinetRequest) => cabinetsApi.update(cabinetId, body),
    onSuccess: () => {
      message.success('Кабинет обновлён')
      invalidateCabinet()
      setEditOpen(false)
      setTokenEditOpen(false)
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { error?: string; message?: string } } }
      message.error(ax.response?.data?.error ?? ax.response?.data?.message ?? 'Не удалось сохранить')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => cabinetsApi.delete(cabinetId),
    onSuccess: () => {
      message.success('Кабинет удалён')
      void queryClient.invalidateQueries({ queryKey: ['cabinetsOverview'] })
      navigate('/profile', { replace: true })
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { error?: string; message?: string } } }
      message.error(ax.response?.data?.error ?? ax.response?.data?.message ?? 'Не удалось удалить')
    },
  })

  const validateMutation = useMutation({
    mutationFn: () => cabinetsApi.validateApiKey(cabinetId),
    onMutate: () => setValidateCooldown(30),
    onSuccess: (data) => {
      message.success(data.message || 'Проверка ключа выполнена')
      invalidateCabinet()
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { error?: string; message?: string } } }
      message.error(ax.response?.data?.error ?? ax.response?.data?.message ?? 'Ошибка проверки ключа')
      invalidateCabinet()
    },
  })

  const updateDataMutation = useMutation({
    mutationFn: () =>
      isAdmin
        ? userApi.triggerCabinetDataUpdate(cabinetId)
        : userApi.triggerDataUpdate(),
    onSuccess: (data) => {
      message.success(data.message || 'Обновление запущено')
      invalidateCabinet()
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { error?: string; message?: string } } }
      message.error(ax.response?.data?.error ?? ax.response?.data?.message ?? 'Ошибка запуска обновления')
    },
  })

  const updateStocksMutation = useMutation({
    mutationFn: () => userApi.triggerCabinetStocksUpdate(cabinetId),
    onSuccess: (data) => {
      message.success(data.message || 'Обновление остатков запущено')
      invalidateCabinet()
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { error?: string; message?: string } } }
      message.error(ax.response?.data?.error ?? ax.response?.data?.message ?? 'Ошибка обновления остатков')
    },
  })

  const httpStatus = (error as { response?: { status?: number } })?.response?.status

  const openEditName = (cab: CabinetDto) => {
    editForm.setFieldsValue({ name: cab.name })
    setEditOpen(true)
  }

  const openEditToken = (cab: CabinetDto) => {
    tokenForm.setFieldsValue({
      apiKey: '',
      tokenType: cab.apiKey?.tokenType ?? 'BASIC',
    })
    setTokenEditOpen(true)
  }

  const confirmDelete = (cab: CabinetDto) => {
    Modal.confirm({
      title: 'Удалить кабинет?',
      content: `Кабинет «${cab.name}» будет удалён безвозвратно.`,
      okText: 'Удалить',
      okButtonProps: { danger: true },
      cancelText: 'Отмена',
      onOk: () => deleteMutation.mutateAsync(),
    })
  }

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      message.success('Токен скопирован')
    } catch {
      message.error('Не удалось скопировать')
    }
  }

  if (!Number.isFinite(cabinetId) || cabinetId <= 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        <Header />
        <Breadcrumbs />
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
          <Alert type="error" message="Некорректный идентификатор кабинета" showIcon />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <Header />
      <Breadcrumbs />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 16 }}>
          <Link to="/profile" style={{ color: accent, fontSize: 14 }}>
            ← К списку кабинетов
          </Link>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert
            type={httpStatus === 403 ? 'warning' : 'error'}
            showIcon
            message={httpStatus === 403 ? 'Нет доступа' : 'Ошибка загрузки'}
            description={
              httpStatus === 403
                ? 'Управление кабинетом доступно только владельцу.'
                : getRequestFailureDescription(error)
            }
            action={
              httpStatus === 403 ? (
                <a onClick={() => navigate('/profile')} style={{ color: accent }}>
                  К кабинетам
                </a>
              ) : undefined
            }
          />
        ) : cabinet ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <style>{`
              .cabinet-info-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 16px;
                align-items: stretch;
              }
              @media (max-width: 1100px) {
                .cabinet-info-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              }
              @media (max-width: 640px) {
                .cabinet-info-grid { grid-template-columns: 1fr; }
              }
            `}</style>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Управление кабинетом
                </Title>
                <Text type="secondary">
                  {cabinet.name} · ID {cabinet.id}
                </Text>
              </div>
              {!isAdmin && (
                <Space wrap>
                  <Button icon={<EditOutlined />} onClick={() => openEditName(cabinet)}>
                    Переименовать кабинет
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleteMutation.isPending}
                    onClick={() => confirmDelete(cabinet)}
                  >
                    Удалить кабинет
                  </Button>
                </Space>
              )}
            </div>

            <div className="cabinet-info-grid">
              <InfoBlock
                label="API-токен"
                action={
                  <Button block icon={<EditOutlined />} onClick={() => openEditToken(cabinet)}>
                    Изменить токен
                  </Button>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {cabinet.apiKey?.apiKey ? (
                      <>
                        <Text
                          code
                          style={{
                            fontSize: 13,
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          {maskApiKeyPreview(cabinet.apiKey.apiKey)}
                        </Text>
                        <Tooltip title="Скопировать">
                          <Button
                            type="text"
                            size="small"
                            icon={<CopyOutlined style={{ color: '#3B82F6' }} />}
                            onClick={() => void copyToken(cabinet.apiKey!.apiKey!)}
                          />
                        </Tooltip>
                      </>
                    ) : (
                      <Text type="secondary">не задан</Text>
                    )}
                  </div>
                  <Tag color={cabinet.apiKey?.tokenType === 'PERSONAL' ? 'success' : 'default'} style={{ width: 'fit-content', margin: 0 }}>
                    {tokenTypeLabel(cabinet.apiKey?.tokenType ?? null)}
                  </Tag>
                  {cabinet.apiKey?.validationError && (
                    <Text type="danger" style={{ fontSize: 12 }}>
                      {cabinet.apiKey.validationError}
                    </Text>
                  )}
                </div>
              </InfoBlock>

              <InfoBlock
                label="Последняя проверка"
                action={
                  <Tooltip
                    title={
                      validateCooldown > 0
                        ? `Следующая проверка через ${validateCooldown} сек`
                        : 'Проверка подключения и доступа токена к категориям WB API'
                    }
                  >
                    <Button
                      block
                      icon={<SearchOutlined />}
                      loading={validateMutation.isPending}
                      disabled={validateCooldown > 0}
                      onClick={() => validateMutation.mutate()}
                    >
                      Проверить токен
                    </Button>
                  </Tooltip>
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {formatCabinetAdminDate(cabinet.apiKey?.lastValidatedAt ?? null)}
                  </Text>
                  {cabinet.apiKey?.isValid === true ? (
                    <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 18 }} />
                  ) : cabinet.apiKey?.isValid === false ? (
                    <Tag color="error" style={{ margin: 0 }}>Невалиден</Tag>
                  ) : (
                    <Tag style={{ margin: 0 }}>Не проверен</Tag>
                  )}
                </div>
              </InfoBlock>

              <InfoBlock
                label="Обновление данных"
                action={
                  <Tooltip
                    title={
                      canUpdateCabinetData(cabinet)
                        ? 'Запускает в фоновом режиме обновление карточек, кампаний и аналитики'
                        : `Не чаще одного раза в ${ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES} мин. Через ${getCabinetRemainingTime(cabinet) || '…'}.`
                    }
                  >
                    <Button
                      block
                      icon={<SyncOutlined />}
                      loading={updateDataMutation.isPending}
                      disabled={!canUpdateCabinetData(cabinet) || updateDataMutation.isPending}
                      onClick={() => updateDataMutation.mutate()}
                    >
                      Обновить данные
                    </Button>
                  </Tooltip>
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {formatCabinetAdminDate(cabinet.apiKey?.lastDataUpdateAt ?? cabinet.lastDataUpdateAt)}
                  </Text>
                  <SyncOutlined style={{ color: accent, fontSize: 16 }} />
                </div>
              </InfoBlock>

              <InfoBlock
                label="Обновление остатков"
                action={
                  <Tooltip
                    title={
                      canUpdateCabinetStocks(cabinet)
                        ? 'Запускает в фоновом режиме обновление остатков по кабинету'
                        : `Не чаще одного раза в ${STOCKS_UPDATE_COOLDOWN_MINUTES} мин. Через ${getCabinetStocksRemainingTime(cabinet) || '…'}.`
                    }
                  >
                    <Button
                      block
                      icon={<SyncOutlined />}
                      loading={updateStocksMutation.isPending}
                      disabled={!canUpdateCabinetStocks(cabinet) || updateStocksMutation.isPending}
                      onClick={() => updateStocksMutation.mutate()}
                    >
                      Обновить остатки
                    </Button>
                  </Tooltip>
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    {formatCabinetAdminDate(cabinet.apiKey?.lastStocksUpdateAt ?? cabinet.lastStocksUpdateAt ?? null)}
                  </Text>
                  <SyncOutlined style={{ color: accent, fontSize: 16 }} />
                </div>
              </InfoBlock>
            </div>

            {cabinet.scopeStatuses && cabinet.scopeStatuses.length > 0 && (
              <Card
                style={{ borderRadius: 16, border: `1px solid ${border}` }}
                title={
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                    Доступ к категориям WB API
                  </Text>
                }
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                  {cabinet.scopeStatuses.map((s) => (
                    <Tooltip
                      key={s.category}
                      title={
                        <span style={{ whiteSpace: 'pre-line' }}>
                          {buildScopeStatusTooltip(s, 'Последняя проверка')}
                        </span>
                      }
                      overlayInnerStyle={{ maxWidth: 520 }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <ScopeStatusIcon s={s} fontSize={14} />
                        <span>{s.categoryDisplayName}</span>
                      </span>
                    </Tooltip>
                  ))}
                </div>
              </Card>
            )}

            {isAdmin ? null : (
              <Card style={{ borderRadius: 16, border: `1px solid ${border}` }}>
                <CabinetAccessPanel cabinetId={cabinet.id} />
              </Card>
            )}
          </div>
        ) : null}
      </div>

      <Modal
        title="Переименовать кабинет"
        open={editOpen}
        destroyOnClose
        onCancel={() => setEditOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditOpen(false)}>
            Отмена
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={updateMutation.isPending}
            style={{ backgroundColor: accent, borderColor: accent }}
            onClick={() => editForm.submit()}
          >
            Сохранить
          </Button>,
        ]}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => updateMutation.mutate({ name: values.name.trim() })}
        >
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Укажите название' }]}
          >
            <Input placeholder="Название кабинета" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Изменить токен"
        open={tokenEditOpen}
        destroyOnClose
        onCancel={() => setTokenEditOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setTokenEditOpen(false)}>
            Отмена
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={updateMutation.isPending}
            style={{ backgroundColor: accent, borderColor: accent }}
            onClick={() => tokenForm.submit()}
          >
            Сохранить
          </Button>,
        ]}
      >
        <Form
          form={tokenForm}
          layout="vertical"
          onFinish={(values) => {
            const key = values.apiKey.trim()
            updateMutation.mutate({
              ...(key ? { apiKey: key } : {}),
              tokenType: values.tokenType,
            })
          }}
        >
          <Form.Item
            name="apiKey"
            label="Новый API-токен"
            extra="Оставьте пустым, если нужно изменить только тип токена"
          >
            <Input.Password placeholder="Вставьте новый токен" autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="tokenType" label="Тип токена" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'BASIC', label: 'Базовый' },
                { value: 'PERSONAL', label: 'Персональный' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
