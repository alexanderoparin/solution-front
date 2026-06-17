import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
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
import { getPaymentStatusLabel, getPaymentStatusColor, getSubscriptionStatusLabel } from '../utils/paymentStatus'
import { useAuthStore } from '../store/authStore'
import { userRoleLabel } from '../constants/userRoleLabels'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'

function formatPlanPeriod(plan: PlanDto): string {
  if (plan.periodType === 'CALENDAR_MONTH') return '1 месяц'
  const d = plan.periodDays
  if (d === 1) return '1 день'
  if (d >= 2 && d <= 4) return `${d} дня`
  return `${d} дней`
}

function sortPlans(list: PlanDto[]): PlanDto[] {
  return [...list].sort((a, b) => {
    const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    return order !== 0 ? order : a.id - b.id
  })
}

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

  const sortedPlans = useMemo(() => sortPlans(plans), [plans])

  const activePlans = useMemo(
    () => sortedPlans.filter((p) => p.isActive !== false),
    [sortedPlans],
  )

  const { data: usersPage } = useQuery({
    queryKey: ['managedUsers', 0, 500],
    queryFn: () => userApi.getManagedUsers({ page: 0, size: 500 }),
  })
  const users: UserListItem[] = usersPage?.content ?? []

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
    onError: (e: { response?: { data?: { message?: string } } }) =>
      message.error(e.response?.data?.message || 'Ошибка создания плана'),
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
    onError: (e: { response?: { data?: { message?: string } } }) =>
      message.error(e.response?.data?.message || 'Ошибка обновления плана'),
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
    onError: (e: { response?: { data?: { message?: string } } }) =>
      message.error(e.response?.data?.message || 'Ошибка продления подписки'),
  })

  const openCreatePlan = () => {
    setEditingPlan(null)
    planForm.resetFields()
    planForm.setFieldsValue({
      periodType: 'DAYS',
      sortOrder: (sortedPlans.length + 1) * 10,
      isActive: true,
    })
    setPlanModalOpen(true)
  }

  const openEditPlan = (plan: PlanDto) => {
    setEditingPlan(plan)
    planForm.setFieldsValue({
      name: plan.name,
      description: plan.description ?? '',
      priceRub: plan.priceRub,
      periodDays: plan.periodDays,
      sortOrder: plan.sortOrder ?? 0,
      isActive: plan.isActive ?? true,
      code: plan.code ?? '',
      periodType: plan.periodType ?? 'DAYS',
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
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        code: values.code?.trim() || undefined,
        periodType: values.periodType,
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
      if (!values.planId) {
        message.error('Выберите план')
        return
      }
      extendMutation.mutate({
        userId: selectedUserId,
        planId: values.planId,
        expiresAt,
      })
    })
  }

  const planColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 56 },
    { title: 'Название', dataIndex: 'name', key: 'name', width: 120 },
    {
      title: 'Код',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Цена, ₽',
      dataIndex: 'priceRub',
      key: 'priceRub',
      width: 100,
      render: (v: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(v),
    },
    {
      title: 'Период',
      key: 'period',
      width: 100,
      render: (_: unknown, record: PlanDto) => formatPlanPeriod(record),
    },
    {
      title: 'Порядок',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 72,
      render: (v: number | undefined) => v ?? 0,
    },
    {
      title: 'Активен',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 88,
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
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (s: string) => <Tag>{getSubscriptionStatusLabel(s)}</Tag> },
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
    {
      title: 'Назначение',
      dataIndex: 'description',
      key: 'description',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={getPaymentStatusColor(s)}>{getPaymentStatusLabel(s)}</Tag>,
    },
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
      <Breadcrumbs />
      <div
        style={{
          width: '100%',
          padding: 24,
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: 1200 }}>
          <Typography.Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
            Управление РК — планы и подписки
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
            Тарифы раздела «Управление РК». Остальной функционал сервиса бесплатен.
          </Typography.Paragraph>

          <Tabs
            items={[
              {
                key: 'plans',
                label: 'Планы',
                children: (
                  <Card>
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                      message="Активные планы отображаются пользователям в модалке подписки на Управление РК."
                    />
                    <div
                      style={{
                        marginBottom: 16,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Button type="primary" icon={<PlusOutlined />} onClick={openCreatePlan}>
                        Добавить план
                      </Button>
                    </div>
                    <Table
                      rowKey="id"
                      loading={plansLoading}
                      columns={planColumns}
                      dataSource={sortedPlans}
                      pagination={false}
                      size="small"
                      scroll={{ x: 900 }}
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
                            label: `${u.email} (${userRoleLabel(u.role)})`,
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
                                const now = dayjs()
                                const currentSub =
                                  subscriptions?.find(
                                    (s) =>
                                      (s.status === 'active' || s.status === 'trial')
                                      && dayjs(s.expiresAt).isAfter(now),
                                  ) ?? null
                                extendForm.setFieldsValue({
                                  planId: currentSub?.planId ?? activePlans[0]?.id,
                                  expiresAt: null,
                                })
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
        width={520}
      >
        <Form form={planForm} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="code" label="Код (уникальный)">
            <Input placeholder="campaign_week" disabled={!!editingPlan?.code} />
          </Form.Item>
          <Form.Item name="priceRub" label="Цена, ₽" rules={[{ required: true }]}>
            <InputNumber min={0} step={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="periodType" label="Тип периода" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'DAYS', label: 'Дни (period_days)' },
                { value: 'CALENDAR_MONTH', label: 'Календарный месяц (+1 мес.)' },
              ]}
            />
          </Form.Item>
          <Form.Item name="periodDays" label="Период, дней (для отображения)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
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
          {(() => {
            const now = dayjs()
            const currentSub =
              subscriptions?.find(
                (s) => (s.status === 'active' || s.status === 'trial') && dayjs(s.expiresAt).isAfter(now),
              ) ?? null
            const currentExpiresAt = currentSub?.expiresAt
            return (
              <Form.Item label="Текущая дата окончания">
                <Typography.Text type="secondary">
                  {currentExpiresAt ? dayjs(currentExpiresAt).format('DD.MM.YYYY HH:mm') : '—'}
                </Typography.Text>
              </Form.Item>
            )
          })()}
          <Form.Item name="planId" label="План" rules={[{ required: true, message: 'Выберите план' }]}>
            <Select
              options={activePlans.map((p) => ({
                value: p.id,
                label: `${p.name} (${formatPlanPeriod(p)}, ${p.priceRub} ₽)`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="expiresAt"
            label="Новая дата окончания"
            rules={[{ required: true, message: 'Укажите новую дату окончания' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
