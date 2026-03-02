import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Tabs,
  Select,
  DatePicker,
  Space,
  message,
  Tag,
  Spin,
  Typography,
} from 'antd'
import { PlusOutlined, EditOutlined, CreditCardOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/admin'
import { userApi } from '../api/user'
import type { PlanDto, SubscriptionDto, PaymentDto, UserListItem } from '../types/api'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'

export default function AdminPlansAndSubscriptions() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const [planForm] = Form.useForm()
  const [extendForm] = Form.useForm()
  const [editingPlan, setEditingPlan] = useState<PlanDto | null>(null)
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [extendModalOpen, setExtendModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  if (role !== 'ADMIN') {
    navigate('/profile', { replace: true })
    return null
  }

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['adminPlans'],
    queryFn: () => adminApi.getPlans(),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['managedUsers'],
    queryFn: () => userApi.getManagedUsers(),
  })

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery<SubscriptionDto[]>({
    queryKey: ['adminSubscriptions', selectedUserId],
    queryFn: () => adminApi.getUserSubscriptions(selectedUserId!),
    enabled: selectedUserId != null,
  })

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentDto[]>({
    queryKey: ['adminPayments', selectedUserId],
    queryFn: () => adminApi.getUserPayments(selectedUserId!),
    enabled: selectedUserId != null,
  })

  const createPlanMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createPlan>[0]) => adminApi.createPlan(data),
    onSuccess: () => {
      message.success('План создан')
      setPlanModalOpen(false)
      planForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] })
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'Ошибка создания плана'),
  })

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof adminApi.updatePlan>[1] }) =>
      adminApi.updatePlan(id, data),
    onSuccess: () => {
      message.success('План обновлён')
      setEditingPlan(null)
      setPlanModalOpen(false)
      planForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] })
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'Ошибка обновления плана'),
  })

  const extendMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminApi.extendSubscription>[0]) => adminApi.extendSubscription(data),
    onSuccess: () => {
      message.success('Подписка назначена/продлена')
      setExtendModalOpen(false)
      extendForm.resetFields()
      if (selectedUserId != null) {
        queryClient.invalidateQueries({ queryKey: ['adminSubscriptions', selectedUserId] })
      }
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'Ошибка продления подписки'),
  })

  const openEditPlan = (plan: PlanDto) => {
    setEditingPlan(plan)
    planForm.setFieldsValue({
      name: plan.name,
      description: plan.description ?? '',
      priceRub: plan.priceRub,
      periodDays: plan.periodDays,
      maxCabinets: plan.maxCabinets ?? undefined,
      sortOrder: plan.sortOrder ?? 0,
      isActive: plan.isActive ?? true,
    })
    setPlanModalOpen(true)
  }

  const handlePlanSubmit = () => {
    planForm.validateFields().then((values) => {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        priceRub: values.priceRub,
        periodDays: values.periodDays,
        maxCabinets: values.maxCabinets,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      }
      if (editingPlan) {
        updatePlanMutation.mutate({ id: editingPlan.id, data: payload })
      } else {
        createPlanMutation.mutate(payload)
      }
    })
  }

  const handleExtendSubmit = () => {
    if (selectedUserId == null) return
    extendForm.validateFields().then((values) => {
      const expiresAt = values.expiresAt ? dayjs(values.expiresAt).format('YYYY-MM-DDTHH:mm:ss') : undefined
      extendMutation.mutate({
        userId: selectedUserId,
        planId: values.planId,
        expiresAt,
      })
    })
  }

  const planColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'Цена, ₽', dataIndex: 'priceRub', key: 'priceRub', render: (v: number) => v?.toFixed(2) },
    { title: 'Дней', dataIndex: 'periodDays', key: 'periodDays', width: 80 },
    { title: 'Макс. кабинетов', dataIndex: 'maxCabinets', key: 'maxCabinets', width: 120 },
    {
      title: 'Активен',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (v: boolean) => (v ? <Tag color="green">Да</Tag> : <Tag>Нет</Tag>),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: PlanDto) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditPlan(record)}>
          Изменить
        </Button>
      ),
    },
  ]

  const subColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'План', dataIndex: 'planName', key: 'planName' },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (s: string) => <Tag>{s}</Tag> },
    {
      title: 'Начало',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Окончание',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
  ]

  const paymentColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Сумма',
      key: 'amount',
      render: (_: unknown, r: PaymentDto) => `${Number(r.amount).toFixed(2)} ${r.currency}`,
    },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (s: string) => <Tag>{s}</Tag> },
    {
      title: 'Оплачено',
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
    },
  ]

  const selectedUser = users.find((u: UserListItem) => u.id === selectedUserId)

  return (
    <>
      <Header />
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Breadcrumbs />
        <Typography.Title level={4} style={{ marginTop: 16, marginBottom: 24 }}>
          Админ: планы и подписки
        </Typography.Title>

        <Tabs
          items={[
            {
              key: 'plans',
              label: 'Планы',
              children: (
                <Card>
                  <div style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingPlan(null)
                        planForm.resetFields()
                        setPlanModalOpen(true)
                      }}
                    >
                      Добавить план
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    loading={plansLoading}
                    columns={planColumns}
                    dataSource={plans}
                    pagination={false}
                    size="small"
                  />
                </Card>
              ),
            },
            {
              key: 'subscriptions',
              label: 'Подписки по пользователям',
              children: (
                <Card>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                      <Typography.Text strong style={{ marginRight: 8 }}>
                        Пользователь:
                      </Typography.Text>
                      <Select
                        placeholder="Выберите пользователя"
                        style={{ width: 320 }}
                        value={selectedUserId ?? undefined}
                        onChange={setSelectedUserId}
                        optionFilterProp="label"
                        options={users.map((u: UserListItem) => ({
                          value: u.id,
                          label: `${u.email} (${u.role})`,
                        }))}
                      />
                    </div>
                    {selectedUserId != null && (
                      <>
                        <div>
                          <Button
                            type="primary"
                            icon={<CreditCardOutlined />}
                            onClick={() => {
                              extendForm.setFieldsValue({ userId: selectedUserId, planId: undefined, expiresAt: null })
                              setExtendModalOpen(true)
                            }}
                          >
                            Продлить / назначить подписку
                          </Button>
                        </div>
                        <Typography.Title level={5}>Подписки</Typography.Title>
                        {subsLoading ? (
                          <Spin />
                        ) : (
                          <Table
                            rowKey="id"
                            columns={subColumns}
                            dataSource={subscriptions}
                            pagination={false}
                            size="small"
                          />
                        )}
                        <Typography.Title level={5}>Платежи</Typography.Title>
                        {paymentsLoading ? (
                          <Spin />
                        ) : (
                          <Table
                            rowKey="id"
                            columns={paymentColumns}
                            dataSource={payments}
                            pagination={false}
                            size="small"
                          />
                        )}
                      </>
                    )}
                  </Space>
                </Card>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={editingPlan ? 'Редактировать план' : 'Новый план'}
        open={planModalOpen}
        onCancel={() => {
          setPlanModalOpen(false)
          setEditingPlan(null)
        }}
        onOk={handlePlanSubmit}
        confirmLoading={createPlanMutation.isPending || updatePlanMutation.isPending}
        width={480}
      >
        <Form form={planForm} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="priceRub" label="Цена, ₽" rules={[{ required: true }]}>
            <InputNumber min={0} step={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="periodDays" label="Период, дней" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="maxCabinets" label="Макс. кабинетов">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Не ограничено" />
          </Form.Item>
          <Form.Item name="sortOrder" label="Порядок сортировки">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="Активен" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Продлить подписку: ${selectedUser?.email ?? ''}`}
        open={extendModalOpen}
        onCancel={() => setExtendModalOpen(false)}
        onOk={handleExtendSubmit}
        confirmLoading={extendMutation.isPending}
      >
        <Form form={extendForm} layout="vertical">
          <Form.Item name="planId" label="План" rules={[{ required: true }]}>
            <Select
              placeholder="Выберите план"
              options={plans.filter((p) => p.isActive !== false).map((p) => ({ value: p.id, label: `${p.name} (${p.priceRub} ₽)` }))}
            />
          </Form.Item>
          <Form.Item name="expiresAt" label="Дата окончания (необязательно)">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
