import { useState } from 'react'
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
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/user'
import { UserListItem, CreateUserRequest, UpdateUserRequest, UserRole } from '../types/api'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'

dayjs.locale('ru')

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

export default function UsersManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role) as UserRole

  // Определяем, какую роль можно создавать (по умолчанию)
  const getCreatableRole = (): UserRole => {
    if (role === 'ADMIN') return 'MANAGER'
    if (role === 'MANAGER') return 'SELLER'
    if (role === 'SELLER') return 'WORKER'
    return 'WORKER'
  }

  // Определяем, какие роли можно создавать
  const getCreatableRoles = (): UserRole[] => {
    if (role === 'ADMIN') return ['MANAGER', 'SELLER']
    if (role === 'MANAGER') return ['SELLER']
    if (role === 'SELLER') return ['WORKER']
    return []
  }

  // Получение списка пользователей
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['managedUsers'],
    queryFn: userApi.getManagedUsers,
  })

  // Создание пользователя
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

  // Обновление пользователя
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

  // Переключение активности
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
      render: (role: UserRole) => (
        <Tag color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Tag>
      ),
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_: any, record: UserListItem) => (
        <Space>
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? 'Активен' : 'Неактивен'}
          </Tag>
          {record.isTemporaryPassword && (
            <Tag color="orange">Временный пароль</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
      sorter: (a: UserListItem, b: UserListItem) =>
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
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
            >
              {record.isActive ? 'Деактивировать' : 'Активировать'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <Header />
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              backgroundColor: '#7C3AED',
              borderColor: '#7C3AED',
            }}
          >
            Создать пользователя
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Всего: ${total}`,
          }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        />

        {/* Модальное окно создания */}
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
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreate}
            autoComplete="off"
          >
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
                  style={{
                    backgroundColor: '#7C3AED',
                    borderColor: '#7C3AED',
                  }}
                >
                  Создать
                </Button>
                <Button onClick={() => setIsCreateModalOpen(false)}>Отмена</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Модальное окно редактирования */}
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
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdate}
            autoComplete="off"
          >
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
              name="isActive"
              label="Активен"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updateMutation.isPending}
                  style={{
                    backgroundColor: '#7C3AED',
                    borderColor: '#7C3AED',
                  }}
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
      </div>
    </div>
  )
}

