import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  message,
  Tag,
  Popconfirm,
  Tooltip,
  Typography,
  Spin,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  DeleteOutlined,
  SyncOutlined,
  MinusOutlined,
  RightOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/user'
import { UserListItem, CreateUserRequest, UpdateUserRequest, UserRole, CabinetDto } from '../types/api'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

const { Text } = Typography

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  SELLER: 'Селлер',
  WORKER: 'Работник',
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'red',
  MANAGER: 'purple',
  SELLER: 'blue',
  WORKER: 'green',
}

const ROLE_ORDER: Record<UserRole, number> = {
  ADMIN: 0,
  MANAGER: 1,
  SELLER: 2,
  WORKER: 3,
}

function SellerCabinetsInline({ sellerId }: { sellerId: number }) {
  const queryClient = useQueryClient()
  const [validateCooldowns, setValidateCooldowns] = useState<Record<number, number>>({})
  const [editKeyCabinetId, setEditKeyCabinetId] = useState<number | null>(null)
  const [editKeyValue, setEditKeyValue] = useState('')

  const { data: cabinets = [], isLoading, error } = useQuery<CabinetDto[]>({
    queryKey: ['sellerCabinets', sellerId],
    queryFn: () => userApi.getSellerCabinets(sellerId),
  })

  const validateKeyMutation = useMutation({
    mutationFn: (cabinetId: number) => userApi.validateSellerCabinetKey(cabinetId),
    onMutate: (cabinetId: number) => {
      setValidateCooldowns((prev) => ({ ...prev, [cabinetId]: 30 }))
    },
    onSuccess: (data) => {
      message.success(data.message || 'Проверка ключа выполнена')
      queryClient.invalidateQueries({ queryKey: ['sellerCabinets', sellerId] })
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка проверки ключа')
    },
  })

  const updateKeyMutation = useMutation({
    mutationFn: ({ cabinetId, apiKey }: { cabinetId: number; apiKey: string }) =>
      userApi.updateSellerCabinetKey(cabinetId, apiKey),
    onSuccess: () => {
      message.success('Ключ обновлён')
      queryClient.invalidateQueries({ queryKey: ['sellerCabinets', sellerId] })
      setEditKeyCabinetId(null)
      setEditKeyValue('')
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка обновления ключа')
    },
  })

  useEffect(() => {
    const hasCooldown = Object.values(validateCooldowns).some((v) => v > 0)
    if (!hasCooldown) return
    const t = setInterval(() => {
      setValidateCooldowns((prev) => {
        const next: Record<number, number> = {}
        for (const [key, value] of Object.entries(prev)) {
          next[Number(key)] = Math.max(0, value - 1)
        }
        return next
      })
    }, 1000)
    return () => clearInterval(t)
  }, [validateCooldowns])

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—'
    return dayjs(dateString).format('DD.MM.YYYY HH:mm')
  }

  // Для админа/менеджера в блоке кабинетов селлера — ограничение раз в 5 минут
  const ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES = 5
  const getLastUpdateOrRequested = (cab: CabinetDto): string | null => {
    const a = cab.lastDataUpdateAt ?? cab.apiKey?.lastDataUpdateAt ?? null
    const b = cab.lastDataUpdateRequestedAt ?? cab.apiKey?.lastDataUpdateRequestedAt ?? null
    if (!a && !b) return null
    if (!a) return b
    if (!b) return a
    return dayjs(a).isAfter(dayjs(b)) ? a : b
  }
  const canUpdateCabinetData = (cab: CabinetDto): boolean => {
    const lastAt = getLastUpdateOrRequested(cab)
    if (!lastAt) return true
    return dayjs().diff(dayjs(lastAt), 'minute') >= ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES
  }
  const getCabinetRemainingTime = (cab: CabinetDto): string | null => {
    const lastAt = getLastUpdateOrRequested(cab)
    if (!lastAt) return null
    const lastUpdate = dayjs(lastAt)
    const minutesSince = dayjs().diff(lastUpdate, 'minute')
    const remainingMinutes = ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES - minutesSince
    if (remainingMinutes <= 0) return null
    const word = remainingMinutes === 1 ? 'минуту' : remainingMinutes < 5 ? 'минуты' : 'минут'
    return `${remainingMinutes} ${word}`
  }

  const triggerCabinetUpdateMutation = useMutation({
    mutationFn: (cabinetId: number) => userApi.triggerCabinetDataUpdate(cabinetId),
    onSuccess: (data) => {
      message.success(data.message || 'Обновление запущено')
      queryClient.invalidateQueries({ queryKey: ['sellerCabinets', sellerId] })
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Ошибка запуска обновления')
    },
  })

  if (isLoading) {
    return (
      <div style={{ padding: '12px 24px' }}>
        <Spin size="small" /> <Text type="secondary">Загрузка кабинетов…</Text>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '12px 24px' }}>
        <Text type="danger">Не удалось загрузить кабинеты продавца</Text>
      </div>
    )
  }

  if (!cabinets.length) {
    return (
      <div style={{ padding: '12px 24px' }}>
        <Text type="secondary">У продавца нет кабинетов</Text>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 24px', background: '#fafafa' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cabinets.map((cab) => {
          const cabinetCooldown = validateCooldowns[cab.id] ?? 0
          return (
            <div
              key={cab.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 12,
                width: '100%',
                boxSizing: 'border-box',
                background: '#fff',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Text strong>{cab.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ID кабинета: {cab.id}
                </Text>
              </div>

              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  API ключ:
                </Text>
                {editKeyCabinetId === cab.id ? (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Input.Password
                      placeholder="Новый API ключ"
                      value={editKeyValue}
                      onChange={(e) => setEditKeyValue(e.target.value)}
                      style={{ width: 280, fontFamily: 'monospace', fontSize: 12 }}
                      autoComplete="off"
                    />
                    <Space>
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          const key = editKeyValue.trim()
                          if (!key) {
                            message.warning('Введите ключ')
                            return
                          }
                          updateKeyMutation.mutate({ cabinetId: cab.id, apiKey: key })
                        }}
                        loading={updateKeyMutation.isPending}
                      >
                        Сохранить
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setEditKeyCabinetId(null)
                          setEditKeyValue('')
                        }}
                      >
                        Отмена
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <>
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {cab.apiKey?.apiKey ? (
                        <Text
                          code
                          copyable={{ text: cab.apiKey.apiKey }}
                          style={{ fontSize: 12, fontFamily: 'monospace', maxWidth: '100%', wordBreak: 'break-all' }}
                        >
                          {cab.apiKey.apiKey.length > 16
                            ? `${cab.apiKey.apiKey.substring(0, 8)}...${cab.apiKey.apiKey.substring(cab.apiKey.apiKey.length - 8)}`
                            : cab.apiKey.apiKey}
                        </Text>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          не задан
                        </Text>
                      )}
                      <Tooltip title="Редактировать ключ">
                        <Button
                          type="link"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setEditKeyCabinetId(cab.id)
                            setEditKeyValue('')
                          }}
                          style={{ padding: 0, height: 'auto' }}
                        />
                      </Tooltip>
                    </div>
                    {cab.apiKey?.validationError && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="danger" style={{ fontSize: 12 }}>
                          {cab.apiKey.validationError}
                        </Text>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Последняя проверка ключа:
                  </Text>
                  <div>
                    <Text style={{ fontSize: 12 }}>{formatDate(cab.apiKey?.lastValidatedAt ?? null)}</Text>
                  </div>
                </div>
                <div>
                  <Tooltip
                    title={
                      cabinetCooldown > 0
                        ? `Следующая проверка через ${cabinetCooldown} сек (не чаще 1 раза в 30 сек)`
                        : 'Проверка подключения и доступа токена к категориям WB API'
                    }
                  >
                    <span style={{ display: 'inline-block' }}>
                      <Button
                        type="default"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => validateKeyMutation.mutate(cab.id)}
                        loading={validateKeyMutation.isPending}
                        disabled={cabinetCooldown > 0}
                      >
                        Проверить ключ
                      </Button>
                    </span>
                  </Tooltip>
                </div>
                <div style={{ marginLeft: 24, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Последнее обновление данных:
                    </Text>
                    <div>
                      <Text style={{ fontSize: 12 }}>{formatDate(cab.apiKey?.lastDataUpdateAt ?? cab.lastDataUpdateAt)}</Text>
                    </div>
                  </div>
                  <div>
                    <Tooltip
                      title={
                        canUpdateCabinetData(cab)
                          ? 'Запускает обновление карточек, кампаний и аналитики по этому кабинету.'
                          : `Обновление не чаще одного раза в ${ADMIN_CABINET_UPDATE_COOLDOWN_MINUTES} мин. Через ${getCabinetRemainingTime(cab) || '…'}.`
                      }
                    >
                      <span style={{ display: 'inline-block' }}>
                        <Button
                          type="default"
                          size="small"
                          icon={<SyncOutlined />}
                          onClick={() => triggerCabinetUpdateMutation.mutate(cab.id)}
                          loading={triggerCabinetUpdateMutation.isPending}
                          disabled={!canUpdateCabinetData(cab) || triggerCabinetUpdateMutation.isPending}
                        >
                          Обновить данные
                        </Button>
                      </span>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {cab.scopeStatuses && cab.scopeStatuses.length > 0 && (
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 8, marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                    Доступ к категориям WB API
                  </Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                    {cab.scopeStatuses.map((s) => {
                      const checkedText = s.lastCheckedAt
                        ? `Последняя проверка:\n${formatDate(s.lastCheckedAt)}`
                        : 'Не проверялось'
                      const tooltipTitle =
                        s.success === false && s.errorMessage
                          ? `${checkedText}\nТекст ошибки от API WB:\n«${s.errorMessage}»`
                          : checkedText
                      return (
                        <Tooltip
                          key={s.category}
                          title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipTitle}</span>}
                          overlayInnerStyle={{ maxWidth: 520 }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 12,
                              cursor: 'default',
                            }}
                          >
                            {s.success === true && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            {s.success === false && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                            {s.success !== true && s.success !== false && <MinusOutlined style={{ color: '#8c8c8c' }} />}
                            <span>{s.categoryDisplayName}</span>
                          </span>
                        </Tooltip>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function UsersManagementSection() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null)
  const [searchEmail, setSearchEmail] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role) as UserRole

  const getCreatableRole = (): UserRole => {
    if (role === 'ADMIN') return 'MANAGER'
    if (role === 'MANAGER') return 'SELLER'
    if (role === 'SELLER') return 'WORKER'
    return 'WORKER'
  }

  const getCreatableRoles = (): UserRole[] => {
    if (role === 'ADMIN') return ['MANAGER', 'SELLER']
    if (role === 'MANAGER') return ['SELLER']
    if (role === 'SELLER') return ['WORKER']
    return []
  }

  const { data, isLoading } = useQuery({
    queryKey: ['managedUsers', page, pageSize],
    queryFn: () => userApi.getManagedUsers({ page: page - 1, size: pageSize }),
  })

  const isAdminOrManager = role === 'ADMIN' || role === 'MANAGER'

  const users = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const filteredUsers = searchEmail.trim()
    ? users.filter((u) => u.email.toLowerCase().includes(searchEmail.trim().toLowerCase()))
    : users

  const createMutation = useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      message.success('Пользователь успешно создан')
      setIsCreateModalOpen(false)
      createForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка при создании пользователя')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: UpdateUserRequest }) =>
      userApi.updateUser(userId, data),
    onSuccess: () => {
      message.success('Пользователь успешно обновлен')
      setIsEditModalOpen(false)
      setEditingUser(null)
      editForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка при обновлении пользователя')
    },
  })

  const triggerSellerUpdateMutation = useMutation({
    mutationFn: userApi.triggerSellerDataUpdate,
    onSuccess: (data) => {
      message.success(data.message || 'Обновление кабинетов запущено')
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка при запуске обновления')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: userApi.toggleUserActive,
    onSuccess: () => {
      message.success('Статус активности изменен')
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка при изменении статуса')
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: () => {
      message.success('Пользователь удалён')
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка при удалении пользователя')
    },
  })

  const handleCreate = (values: CreateUserRequest) => {
    createMutation.mutate(values)
  }

  const handleEdit = (user: UserListItem) => {
    setEditingUser(user)
    editForm.setFieldsValue({
      email: user.email,
      isActive: user.isActive,
    })
    setIsEditModalOpen(true)
  }

  const handleUpdate = (values: UpdateUserRequest) => {
    if (editingUser) {
      updateMutation.mutate({ userId: editingUser.id, data: values })
    }
  }

  const handleToggleActive = (user: UserListItem) => {
    toggleActiveMutation.mutate(user.id)
  }

  const handleDeleteUser = (user: UserListItem) => {
    Modal.confirm({
      title: 'Удалить пользователя?',
      content: (
        <>
          Будет полностью удалена запись пользователя <strong>{user.email}</strong> и все связанные данные (кабинеты, карточки товаров, аналитика, заметки и т.д.). Это действие нельзя отменить.
        </>
      ),
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: () => deleteUserMutation.mutate(user.id),
    })
  }

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a: UserListItem, b: UserListItem) => a.email.localeCompare(b.email),
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (roleVal: UserRole) => <Tag color={ROLE_COLORS[roleVal]}>{ROLE_LABELS[roleVal]}</Tag>,
      sorter: (a: UserListItem, b: UserListItem) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role],
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_: any, record: UserListItem) => (
        <Space>
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? 'Активен' : 'Неактивен'}
          </Tag>
          {record.isTemporaryPassword && <Tag color="orange">Временный пароль</Tag>}
        </Space>
      ),
      sorter: (a: UserListItem, b: UserListItem) => Number(b.isActive) - Number(a.isActive),
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      sorter: (a: UserListItem, b: UserListItem) =>
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: UserListItem) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Редактировать
          </Button>
          <Popconfirm
            title={`${record.isActive ? 'Деактивировать' : 'Активировать'} пользователя?`}
            onConfirm={() => handleToggleActive(record)}
            okText="Да"
            cancelText="Нет"
          >
            <Button
              type="link"
              icon={record.isActive ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
              danger={record.isActive}
              size="small"
              style={{ minWidth: 140 }}
            >
              {record.isActive ? 'Деактивировать' : 'Активировать'}
            </Button>
          </Popconfirm>
          {role === 'ADMIN' && (
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
              size="small"
              onClick={() => handleDeleteUser(record)}
            >
              Удалить
            </Button>
          )}
        </Space>
      ),
    },
    ...((role === 'ADMIN' || role === 'MANAGER')
      ? [
          {
            title: 'Обновить кабинеты',
            key: 'triggerUpdate',
            width: 160,
            align: 'center' as const,
            render: (_: any, record: UserListItem) =>
              record.role === 'SELLER' ? (() => {
                const lastRequested = record.lastDataUpdateRequestedAt ? dayjs(record.lastDataUpdateRequestedAt) : null
                const now = dayjs()
                const minutesSinceLast = lastRequested ? now.diff(lastRequested, 'minute') : null
                const cooldownMinutes = 5
                const remainingMinutes =
                  minutesSinceLast != null ? Math.max(0, cooldownMinutes - minutesSinceLast) : 0
                const isOnCooldown = remainingMinutes > 0

                const tooltipTitle = isOnCooldown
                  ? `Следующий запуск через ${remainingMinutes} мин.\nПоследний запуск: ${lastRequested ? lastRequested.format('DD.MM.YYYY HH:mm') : '—'}`
                  : lastRequested
                    ? `Последний запуск: ${lastRequested.format('DD.MM.YYYY HH:mm')}`
                    : 'Последний запуск: не запускалось'

                return (
                  <Tooltip
                    title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipTitle}</span>}
                  >
                    <span>
                      <Button
                        type="link"
                        icon={<SyncOutlined />}
                        size="small"
                        onClick={() => triggerSellerUpdateMutation.mutate(record.id)}
                        disabled={triggerSellerUpdateMutation.isPending || isOnCooldown}
                      >
                        Обновить
                      </Button>
                    </span>
                  </Tooltip>
                )
              })() : (
                '—'
              ),
          },
        ]
      : []),
  ]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <Input
          placeholder="Поиск по email"
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalOpen(true)}
          style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
        >
          Создать пользователя
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: totalElements,
          showSizeChanger: true,
          showTotal: (total) => `Всего: ${total}`,
          onChange: (newPage, newSize) => {
            setPage(newPage)
            if (newSize != null) {
              if (newSize !== pageSize) {
                setPageSize(newSize)
                setPage(1)
              }
            }
          },
          locale: {
            items_per_page: 'на страницу',
            jump_to: 'Перейти',
            page: 'Страница',
            prev_page: 'Назад',
            next_page: 'Вперёд',
            prev_5: 'Пред. 5',
            next_5: 'След. 5',
          },
        }}
        expandable={
          isAdminOrManager
            ? {
                expandedRowRender: (record: UserListItem) =>
                  record.role === 'SELLER' ? <SellerCabinetsInline sellerId={record.id} /> : null,
                rowExpandable: (record: UserListItem) => record.role === 'SELLER',
                expandIcon: ({ expanded, onExpand, record }) =>
                  record.role === 'SELLER' ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => onExpand(record, e)}
                      onKeyDown={(e) => {
                      if (e.key === 'Enter') onExpand(record, e as unknown as React.MouseEvent<HTMLElement>)
                    }}
                      style={{ cursor: 'pointer', padding: '0 4px' }}
                    >
                      {expanded ? <DownOutlined /> : <RightOutlined />}
                    </span>
                  ) : null,
              }
            : undefined
        }
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      />
      <Modal
        title="Создать пользователя"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false)
          createForm.resetFields()
        }}
        footer={null}
        width={500}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate} autoComplete="off">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Временный пароль"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Пароль должен содержать минимум 6 символов' },
            ]}
          >
            <Input.Password placeholder="Временный пароль" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Роль"
            initialValue={getCreatableRole()}
            rules={[{ required: true, message: 'Выберите роль' }]}
          >
            <Select>
              {getCreatableRoles().map((r) => (
                <Select.Option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending}
                style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
              >
                Создать
              </Button>
              <Button onClick={() => setIsCreateModalOpen(false)}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Редактировать пользователя"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false)
          setEditingUser(null)
          editForm.resetFields()
        }}
        footer={null}
        width={500}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate} autoComplete="off">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="isActive" label="Активен" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateMutation.isPending}
                style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
              >
                Сохранить
              </Button>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingUser(null)
                  editForm.resetFields()
                }}
              >
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
