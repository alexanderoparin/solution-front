import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Checkbox,
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
  RightOutlined,
  DownOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { SortOrder, SorterResult, TablePaginationConfig } from 'antd/es/table/interface'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/user'
import { CabinetAdminCard } from './CabinetAdminCard'
import { CabinetTableRowAdminProvider } from './CabinetTableRowAdminContext'
import { CabinetTableKeyColumn } from './CabinetTableKeyColumn'
import { CabinetTableScopesColumn } from './CabinetTableScopesColumn'
import { CabinetTableMainUpdateColumn } from './CabinetTableMainUpdateColumn'
import { CabinetTableStocksUpdateColumn } from './CabinetTableStocksUpdateColumn'
import {
  UserListItem,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
  CabinetDto,
  ManagedCabinetRowDto,
} from '../types/api'
import { useAuthStore } from '../store/authStore'
import { SORT_DIRECTIONS, USER_SORT_FIELDS, type SortDirection, type UserSortField } from '../constants/userSorting'
import { CABINET_SORT_FIELDS, type CabinetSortField } from '../constants/cabinetSorting'
import { USER_MANAGEMENT_VIEW, type UserManagementView } from '../constants/userManagementView'
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

/** Совпадает с rowKey таблицы кабинетов — из него читаем sellerId в кастомной строке (rc-table не передаёт record в RowComponent). */
function managedCabinetRowKey(row: ManagedCabinetRowDto): string {
  return `${row.sellerId}-${row.cabinet.id}`
}

function sellerIdFromManagedCabinetRowKey(dataRowKey: string | undefined): number | null {
  if (dataRowKey == null || dataRowKey === '') return null
  const i = dataRowKey.indexOf('-')
  if (i <= 0) return null
  const n = Number(dataRowKey.slice(0, i))
  return Number.isFinite(n) ? n : null
}

/** Обёртка строки: один useCabinetAdminPanel на строку для всех ячеек действий. */
function CabinetManagementTableRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
  const { children, ...rest } = props
  const rawKey = (rest as { 'data-row-key'?: React.Key })['data-row-key']
  const sellerId = sellerIdFromManagedCabinetRowKey(rawKey != null ? String(rawKey) : undefined)
  if (sellerId != null) {
    return (
      <CabinetTableRowAdminProvider sellerId={sellerId}>
        <tr {...rest}>{children}</tr>
      </CabinetTableRowAdminProvider>
    )
  }
  return <tr {...rest}>{children}</tr>
}

function SellerCabinetsInline({ sellerId }: { sellerId: number }) {
  const { data: cabinets = [], isLoading, error } = useQuery<CabinetDto[]>({
    queryKey: ['sellerCabinets', sellerId],
    queryFn: () => userApi.getSellerCabinets(sellerId),
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
        {cabinets.map((cab) => (
          <CabinetAdminCard key={cab.id} cabinet={cab} sellerId={sellerId} />
        ))}
      </div>
    </div>
  )
}

export interface UsersManagementSectionProps {
  managementView?: UserManagementView
  onManagementViewChange?: (view: UserManagementView) => void
}

export default function UsersManagementSection({
  managementView: managementViewProp,
  onManagementViewChange,
}: UsersManagementSectionProps = {}) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null)
  const [internalManagementView] = useState<UserManagementView>(USER_MANAGEMENT_VIEW.CABINETS)
  const [searchEmail, setSearchEmail] = useState('')
  const [onlySellers, setOnlySellers] = useState(true)
  const [cabinetPage, setCabinetPage] = useState(1)
  const [cabinetPageSize, setCabinetPageSize] = useState(20)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState<UserSortField>(USER_SORT_FIELDS.LAST_DATA_UPDATE_AT)
  const [sortDir, setSortDir] = useState<SortDirection>(SORT_DIRECTIONS.ASC)
  const [cabinetSortBy, setCabinetSortBy] = useState<CabinetSortField>(CABINET_SORT_FIELDS.LAST_DATA_UPDATE_AT)
  const [cabinetSortDir, setCabinetSortDir] = useState<SortDirection>(SORT_DIRECTIONS.ASC)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role) as UserRole
  const isAdminOrManager = role === 'ADMIN' || role === 'MANAGER'
  const isManagementControlled =
    isAdminOrManager && managementViewProp !== undefined && onManagementViewChange !== undefined
  const managementView = isManagementControlled ? managementViewProp! : internalManagementView

  useEffect(() => {
    setPage(1)
  }, [searchEmail, onlySellers])

  useEffect(() => {
    setCabinetPage(1)
  }, [searchEmail, managementView, cabinetSortBy, cabinetSortDir])

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
    queryKey: ['managedUsers', page, pageSize, searchEmail, onlySellers, sortBy, sortDir],
    queryFn: () => userApi.getManagedUsers({
      page: page - 1,
      size: pageSize,
      email: searchEmail.trim() || undefined,
      onlySellers,
      sortBy,
      sortDir,
    }),
    enabled: !isAdminOrManager || managementView === USER_MANAGEMENT_VIEW.USERS,
  })

  const {
    data: cabinetListPage,
    isLoading: managedCabinetsLoading,
    isError: managedCabinetsError,
  } = useQuery({
    queryKey: [
      'managedCabinets',
      cabinetPage,
      cabinetPageSize,
      searchEmail,
      cabinetSortBy,
      cabinetSortDir,
      managementView,
    ],
    queryFn: () =>
      userApi.getManagedCabinets({
        page: cabinetPage - 1,
        size: cabinetPageSize,
        search: searchEmail.trim() || undefined,
        sortBy: cabinetSortBy,
        sortDir: cabinetSortDir,
      }),
    enabled: isAdminOrManager && managementView === USER_MANAGEMENT_VIEW.CABINETS,
  })

  const cabinetTableColumns: ColumnsType<ManagedCabinetRowDto> = useMemo(
    () => [
      {
        title: 'ID',
        key: CABINET_SORT_FIELDS.CABINET_ID,
        width: 68,
        align: 'right',
        sorter: true,
        sortOrder:
          cabinetSortBy === CABINET_SORT_FIELDS.CABINET_ID
            ? ((cabinetSortDir === SORT_DIRECTIONS.ASC ? 'ascend' : 'descend') as SortOrder)
            : null,
        render: (_: unknown, r: ManagedCabinetRowDto) => r.cabinet.id,
      },
      {
        title: 'Название',
        key: CABINET_SORT_FIELDS.CABINET_NAME,
        width: 188,
        ellipsis: true,
        align: 'left',
        sorter: true,
        sortOrder:
          cabinetSortBy === CABINET_SORT_FIELDS.CABINET_NAME
            ? ((cabinetSortDir === SORT_DIRECTIONS.ASC ? 'ascend' : 'descend') as SortOrder)
            : null,
        render: (_: unknown, r: ManagedCabinetRowDto) => r.cabinet.name,
      },
      {
        title: 'Email селлера',
        dataIndex: 'sellerEmail',
        key: CABINET_SORT_FIELDS.SELLER_EMAIL,
        width: 224,
        ellipsis: true,
        align: 'left',
        sorter: true,
        sortOrder:
          cabinetSortBy === CABINET_SORT_FIELDS.SELLER_EMAIL
            ? ((cabinetSortDir === SORT_DIRECTIONS.ASC ? 'ascend' : 'descend') as SortOrder)
            : null,
      },
      {
        title: 'Основное обновление',
        key: CABINET_SORT_FIELDS.LAST_DATA_UPDATE_AT,
        width: 156,
        align: 'left',
        sorter: true,
        sortOrder:
          cabinetSortBy === CABINET_SORT_FIELDS.LAST_DATA_UPDATE_AT
            ? ((cabinetSortDir === SORT_DIRECTIONS.ASC ? 'ascend' : 'descend') as SortOrder)
            : null,
        render: (_: unknown, row: ManagedCabinetRowDto) => <CabinetTableMainUpdateColumn row={row} />,
      },
      {
        title: 'Обновление остатков',
        key: CABINET_SORT_FIELDS.LAST_STOCKS_UPDATE_AT,
        width: 156,
        align: 'left',
        sorter: true,
        sortOrder:
          cabinetSortBy === CABINET_SORT_FIELDS.LAST_STOCKS_UPDATE_AT
            ? ((cabinetSortDir === SORT_DIRECTIONS.ASC ? 'ascend' : 'descend') as SortOrder)
            : null,
        render: (_: unknown, row: ManagedCabinetRowDto) => <CabinetTableStocksUpdateColumn row={row} />,
      },
      {
        title: 'Ключ',
        key: 'cabinetKey',
        width: 264,
        align: 'left',
        render: (_: unknown, row: ManagedCabinetRowDto) => <CabinetTableKeyColumn row={row} />,
      },
      {
        title: 'Доступ WB API',
        key: 'cabinetScopes',
        width: 252,
        align: 'left',
        render: (_: unknown, row: ManagedCabinetRowDto) => <CabinetTableScopesColumn row={row} />,
      },
    ],
    [cabinetSortBy, cabinetSortDir],
  )

  const cabinetTableComponents = useMemo(
    () => ({
      body: {
        row: CabinetManagementTableRow,
        cell: (p: React.TdHTMLAttributes<HTMLTableCellElement>) => (
          <td {...p} style={{ ...p.style, verticalAlign: 'top' }} />
        ),
      },
    }),
    [],
  )

  const users = data?.content ?? []

  const createMutation = useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      message.success('Пользователь успешно создан')
      setIsCreateModalOpen(false)
      createForm.resetFields()
      void queryClient.invalidateQueries({ queryKey: ['managedUsers'] })
      void queryClient.invalidateQueries({ queryKey: ['managedCabinets'] })
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
      void queryClient.invalidateQueries({ queryKey: ['managedUsers'] })
      void queryClient.invalidateQueries({ queryKey: ['managedCabinets'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка при обновлении пользователя')
    },
  })

  const triggerSellerUpdateMutation = useMutation({
    mutationFn: ({ sellerId, includeStocks }: { sellerId: number; includeStocks: boolean }) =>
      userApi.triggerSellerDataUpdate(sellerId, includeStocks),
    onSuccess: (data) => {
      message.success(data.message || 'Обновление кабинетов запущено')
      void queryClient.invalidateQueries({ queryKey: ['managedUsers'] })
      void queryClient.invalidateQueries({ queryKey: ['managedCabinets'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка при запуске обновления')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: userApi.toggleUserActive,
    onSuccess: () => {
      message.success('Статус активности изменен')
      void queryClient.invalidateQueries({ queryKey: ['managedUsers'] })
      void queryClient.invalidateQueries({ queryKey: ['managedCabinets'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка при изменении статуса')
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: () => {
      message.success('Пользователь удалён')
      void queryClient.invalidateQueries({ queryKey: ['managedUsers'] })
      void queryClient.invalidateQueries({ queryKey: ['managedCabinets'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Ошибка при удалении пользователя')
    },
  })

  const handleCreate = (values: CreateUserRequest & { isAgencyManager?: boolean }) => {
    const { isAgencyManager, ...rest } = values
    const payload: CreateUserRequest = { ...rest }
    if (role === 'ADMIN' && values.role === 'MANAGER') {
      payload.isAgencyManager = isAgencyManager !== false
    }
    createMutation.mutate(payload)
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
      sorter: true,
      sortOrder: sortBy === USER_SORT_FIELDS.EMAIL
        ? (sortDir === SORT_DIRECTIONS.ASC ? 'ascend' : 'descend') as SortOrder
        : null,
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (roleVal: UserRole) => <Tag color={ROLE_COLORS[roleVal]}>{ROLE_LABELS[roleVal]}</Tag>,
      sorter: true,
      sortOrder: sortBy === USER_SORT_FIELDS.ROLE
        ? (sortDir === SORT_DIRECTIONS.ASC ? 'ascend' : 'descend') as SortOrder
        : null,
    },
    {
      title: 'Статус',
      key: 'isActive',
      render: (_: any, record: UserListItem) => (
        record.isTemporaryPassword
          ? <Tag color="orange">Временный пароль</Tag>
          : <Tag color="green">Активен</Tag>
      ),
      sorter: true,
      sortOrder: sortBy === USER_SORT_FIELDS.IS_ACTIVE
        ? (sortDir === SORT_DIRECTIONS.ASC ? 'ascend' : 'descend') as SortOrder
        : null,
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      sorter: true,
      sortOrder: sortBy === USER_SORT_FIELDS.CREATED_AT
        ? (sortDir === SORT_DIRECTIONS.ASC ? 'ascend' : 'descend') as SortOrder
        : null,
    },
    ...((role === 'ADMIN' || role === 'MANAGER')
      ? [
          {
            title: 'Дата обновления',
            dataIndex: 'lastDataUpdateAt',
            key: 'lastDataUpdateAt',
            render: (date: string | null) => (date ? dayjs(date).format('DD.MM.YYYY HH:mm') : '—'),
            sorter: true,
            sortOrder: sortBy === USER_SORT_FIELDS.LAST_DATA_UPDATE_AT
              ? (sortDir === SORT_DIRECTIONS.ASC ? 'ascend' : 'descend') as SortOrder
              : null,
          },
        ]
      : []),
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
                        onClick={() => {
                          let includeStocks = false
                          Modal.confirm({
                            title: 'Запустить обновление кабинетов селлера?',
                            content: (
                              <Space direction="vertical" size={8}>
                                <span>Будет запущено фоновое обновление всех активных кабинетов выбранного селлера.</span>
                                <Checkbox onChange={(e) => { includeStocks = e.target.checked }}>
                                  Включить обновление остатков
                                </Checkbox>
                              </Space>
                            ),
                            okText: 'Запустить',
                            cancelText: 'Отмена',
                            onOk: () => triggerSellerUpdateMutation.mutate({ sellerId: record.id, includeStocks }),
                          })
                        }}
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

  const tablePaginationLocale = {
    items_per_page: 'на страницу',
    jump_to: 'Перейти',
    page: 'Страница',
    prev_page: 'Назад',
    next_page: 'Вперёд',
    prev_5: 'Пред. 5',
    next_5: 'След. 5',
  }

  const showUsersTable = !isAdminOrManager || managementView === USER_MANAGEMENT_VIEW.USERS
  const showCabinetsTable = isAdminOrManager && managementView === USER_MANAGEMENT_VIEW.CABINETS

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <Space wrap align="center">
          <Input
            placeholder={
              showCabinetsTable
                ? 'Поиск: ID, название кабинета или email селлера'
                : 'Поиск по email'
            }
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            allowClear
            style={{ width: 280 }}
          />
          {showUsersTable && (
            <Checkbox checked={onlySellers} onChange={(e) => setOnlySellers(e.target.checked)}>
              Только селлеры
            </Checkbox>
          )}
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            createForm.setFieldsValue({ role: getCreatableRole(), isAgencyManager: true })
            setIsCreateModalOpen(true)
          }}
          style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
        >
          Создать пользователя
        </Button>
      </div>
      {showCabinetsTable && managedCabinetsError && (
        <div style={{ marginBottom: 16 }}>
          <Text type="danger">Не удалось загрузить список кабинетов</Text>
        </div>
      )}
      {showCabinetsTable ? (
        <Table<ManagedCabinetRowDto>
          size="small"
          tableLayout="fixed"
          columns={cabinetTableColumns}
          dataSource={cabinetListPage?.content ?? []}
          rowKey={managedCabinetRowKey}
          loading={managedCabinetsLoading}
          components={cabinetTableComponents}
          scroll={{ x: 1310 }}
          pagination={{
            current: cabinetPage,
            pageSize: cabinetPageSize,
            total: cabinetListPage?.totalElements ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `Кабинетов: ${total}`,
            onChange: (newPage, newSize) => {
              setCabinetPage(newPage)
              if (newSize != null && newSize !== cabinetPageSize) {
                setCabinetPageSize(newSize)
                setCabinetPage(1)
              }
            },
            locale: tablePaginationLocale,
          }}
          onChange={(pagination: TablePaginationConfig, _filters, sorter) => {
            const current = pagination.current ?? 1
            const size = pagination.pageSize ?? cabinetPageSize
            setCabinetPage(current)
            if (size !== cabinetPageSize) {
              setCabinetPageSize(size)
              setCabinetPage(1)
            }

            const resolvedSorter = Array.isArray(sorter) ? sorter[0] : (sorter as SorterResult<ManagedCabinetRowDto>)
            const order = resolvedSorter?.order
            const field = (resolvedSorter?.field ?? resolvedSorter?.columnKey) as string | undefined

            if (order && field) {
              const dir: SortDirection = order === 'ascend' ? SORT_DIRECTIONS.ASC : SORT_DIRECTIONS.DESC
              if (
                field === CABINET_SORT_FIELDS.CABINET_ID ||
                field === CABINET_SORT_FIELDS.CABINET_NAME ||
                field === CABINET_SORT_FIELDS.SELLER_EMAIL ||
                field === CABINET_SORT_FIELDS.LAST_DATA_UPDATE_AT ||
                field === CABINET_SORT_FIELDS.LAST_STOCKS_UPDATE_AT
              ) {
                setCabinetSortBy(field as CabinetSortField)
                setCabinetSortDir(dir)
              }
            }
          }}
          locale={{ emptyText: managedCabinetsLoading ? 'Загрузка…' : 'Нет кабинетов' }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        />
      ) : (
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.totalElements ?? 0,
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
          locale: tablePaginationLocale,
        }}
        onChange={(pagination: TablePaginationConfig, _filters, sorter) => {
          const current = pagination.current ?? 1
          const size = pagination.pageSize ?? pageSize
          setPage(current)
          if (size !== pageSize) {
            setPageSize(size)
            setPage(1)
          }

          const resolvedSorter = Array.isArray(sorter) ? sorter[0] : (sorter as SorterResult<UserListItem>)
          const order = resolvedSorter?.order
          const field = (resolvedSorter?.field ?? resolvedSorter?.columnKey) as string | undefined

          if (order && field) {
            const dir: SortDirection = order === 'ascend' ? SORT_DIRECTIONS.ASC : SORT_DIRECTIONS.DESC
            if (
              field === USER_SORT_FIELDS.EMAIL ||
              field === USER_SORT_FIELDS.ROLE ||
              field === USER_SORT_FIELDS.CREATED_AT ||
              field === USER_SORT_FIELDS.LAST_DATA_UPDATE_AT ||
              field === USER_SORT_FIELDS.IS_ACTIVE
            ) {
              setSortBy(field as UserSortField)
              setSortDir(dir)
            }
          }
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
      )}
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
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.role !== cur.role}>
            {() =>
              role === 'ADMIN' && createForm.getFieldValue('role') === 'MANAGER' ? (
                <Form.Item
                  name="isAgencyManager"
                  valuePropName="checked"
                  initialValue
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>Менеджер агентства</Checkbox>
                </Form.Item>
              ) : null
            }
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
