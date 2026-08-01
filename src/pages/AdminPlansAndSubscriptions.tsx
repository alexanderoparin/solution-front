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
import type { PlanDto, SubscriptionDto, PaymentDto } from '../types/api'
import { getPaymentStatusLabel, getPaymentStatusColor, getSubscriptionStatusLabel } from '../utils/paymentStatus'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'

function formatPlanPeriod(plan: PlanDto): string {
  if (plan.kind === 'AB_PACK') return `${plan.creditAmount ?? 0} тест.`
  if (plan.periodType === 'CALENDAR_MONTH') return '1 месяц'
  const d = plan.periodDays
  if (d === 0) return 'разово'
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
  const [selectedCabinetId, setSelectedCabinetId] = useState<number | null>(null)
  const [planKindFilter, setPlanKindFilter] = useState<string>('ALL')

  if (role !== 'ADMIN') {
    navigate('/profile', { replace: true })
    return null
  }

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['adminPlans'],
    queryFn: () => adminApi.getPlans(),
  })

  const sortedPlans = useMemo(() => sortPlans(plans), [plans])

  const filteredPlans = useMemo(() => {
    if (planKindFilter === 'ALL') return sortedPlans
    return sortedPlans.filter((p) => (p.kind ?? '') === planKindFilter)
  }, [sortedPlans, planKindFilter])

  const activePlans = useMemo(
    () => sortedPlans.filter((p) => p.isActive !== false),
    [sortedPlans],
  )

  const { data: managedCabinetsPage } = useQuery({
    queryKey: ['managedCabinets', 0, 500],
    queryFn: () => userApi.getManagedCabinets({ page: 0, size: 500 }),
  })
  const managedCabinets = managedCabinetsPage?.content ?? []

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery<SubscriptionDto[]>({
    queryKey: ['adminSubscriptions', selectedUserId],
    queryFn: () => adminApi.getUserSubscriptions(selectedUserId!),
    enabled: selectedUserId != null,
  })

  const { data: cabinetSubscriptions = [], isLoading: cabinetSubsLoading } = useQuery<SubscriptionDto[]>({
    queryKey: ['adminCabinetSubscriptions', selectedCabinetId],
    queryFn: () => adminApi.getCabinetSubscriptions(selectedCabinetId!),
    enabled: selectedCabinetId != null,
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
      if (selectedCabinetId != null) {
        queryClient.invalidateQueries({ queryKey: ['adminCabinetSubscriptions', selectedCabinetId] })
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
      kind: 'CAMPAIGN',
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
      kind: plan.kind ?? 'CAMPAIGN',
      creditAmount: plan.creditAmount ?? undefined,
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
        kind: values.kind,
        creditAmount: values.creditAmount,
      }
      if (editingPlan) {
        updatePlanMutation.mutate({ id: editingPlan.id, data: payload })
      } else {
        createPlanMutation.mutate(payload)
      }
    })
  }

  const handleExtendSubmit = () => {
    extendForm.validateFields().then((values) => {
      const expiresAt = values.expiresAt ? dayjs(values.expiresAt).format('YYYY-MM-DDTHH:mm:ss') : undefined
      if (!values.planId) {
        message.error('Выберите план')
        return
      }
      if (!values.cabinetId) {
        message.error('Выберите кабинет')
        return
      }
      extendMutation.mutate({
        userId: selectedUserId ?? undefined,
        cabinetId: values.cabinetId,
        planId: values.planId,
        expiresAt,
        abCredits: values.abCredits,
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
      title: 'Тип',
      dataIndex: 'kind',
      key: 'kind',
      width: 100,
      render: (v: string | null | undefined) => v ?? '—',
    },
    {
      title: 'Кредиты',
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      width: 80,
      render: (v: number | null | undefined) => v ?? '—',
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
    { title: 'Кабинет', dataIndex: 'cabinetId', key: 'cabinetId', width: 90, render: (v: number | null) => v ?? '—' },
    { title: 'План', dataIndex: 'planName', key: 'planName' },
    { title: 'Kind', dataIndex: 'planKind', key: 'planKind', width: 100, render: (v: string | null) => v ?? '—' },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (s: string) => <Tag>{getSubscriptionStatusLabel(s)}</Tag> },
    {
      title: 'Начало',
      dataIndex: 'startedAt',
      key: 'startedAt',
      render: (v: string) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
    },
    {
      title: 'Окончание',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : 'бессрочно'),
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
            Тарифы и услуги
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
            Основной тариф (FREE/PRO), услуга «Управление РК» и пакеты А/Б — на уровне кабинета.
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
                      message="Фильтруйте по типу: MAIN (основной), CAMPAIGN (Управление РК), AB_PACK (пакеты А/Б)."
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
                      <Select
                        style={{ width: 200 }}
                        value={planKindFilter}
                        onChange={setPlanKindFilter}
                        options={[
                          { value: 'ALL', label: 'Все типы' },
                          { value: 'MAIN', label: 'MAIN' },
                          { value: 'CAMPAIGN', label: 'CAMPAIGN' },
                          { value: 'AB_PACK', label: 'AB_PACK' },
                        ]}
                      />
                      <Button type="primary" icon={<PlusOutlined />} onClick={openCreatePlan}>
                        Добавить план
                      </Button>
                    </div>
                    <Table
                      rowKey="id"
                      loading={plansLoading}
                      columns={planColumns}
                      dataSource={filteredPlans}
                      pagination={false}
                      size="small"
                      scroll={{ x: 1000 }}
                    />
                  </Card>
                ),
              },
              {
                key: 'subscriptions',
                label: 'Подписки по кабинетам',
                children: (
                  <Card>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <div>
                        <Typography.Text strong style={{ marginRight: 8 }}>
                          Кабинет:
                        </Typography.Text>
                        <Select
                          placeholder="Выберите кабинет"
                          style={{ width: 420 }}
                          showSearch
                          optionFilterProp="label"
                          value={selectedCabinetId ?? undefined}
                          onChange={(id) => {
                            setSelectedCabinetId(id)
                            const row = managedCabinets.find((c) => c.cabinet?.id === id)
                            setSelectedUserId(row?.sellerId ?? null)
                          }}
                          options={managedCabinets.map((row) => ({
                            value: row.cabinet.id,
                            label: `${row.cabinet.name} — ${row.sellerEmail}`,
                          }))}
                        />
                      </div>
                      {selectedCabinetId != null && (
                        <>
                          <div>
                            <Button
                              type="primary"
                              icon={<CreditCardOutlined />}
                              onClick={() => {
                                extendForm.setFieldsValue({
                                  cabinetId: selectedCabinetId,
                                  planId: activePlans[0]?.id,
                                  expiresAt: null,
                                  abCredits: undefined,
                                })
                                setExtendModalOpen(true)
                              }}
                            >
                              Продлить / назначить / начислить А/Б
                            </Button>
                          </div>
                          <Typography.Title level={5}>Подписки кабинета</Typography.Title>
                          {cabinetSubsLoading ? (
                            <Spin />
                          ) : (
                            <Table
                              rowKey="id"
                              columns={subColumns}
                              dataSource={cabinetSubscriptions}
                              pagination={false}
                              size="small"
                            />
                          )}
                          {selectedUserId != null && (
                            <>
                              <Typography.Title level={5}>Все подписки владельца</Typography.Title>
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
                              <Typography.Title level={5}>Платежи владельца</Typography.Title>
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
            <Input placeholder="pro_month / campaign_week / ab_pack_5" disabled={!!editingPlan?.code} />
          </Form.Item>
          <Form.Item name="kind" label="Тип" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'MAIN', label: 'MAIN — основной тариф' },
                { value: 'CAMPAIGN', label: 'CAMPAIGN — Управление РК' },
                { value: 'AB_PACK', label: 'AB_PACK — пакет А/Б' },
              ]}
            />
          </Form.Item>
          <Form.Item name="creditAmount" label="Кредиты А/Б (для AB_PACK)">
            <InputNumber min={0} style={{ width: '100%' }} />
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
          <Form.Item name="periodDays" label="Период, дней (0 для AB_PACK)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
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
        title="Продлить / назначить / начислить А/Б"
        open={extendModalOpen}
        onCancel={() => setExtendModalOpen(false)}
        onOk={handleExtendSubmit}
        confirmLoading={extendMutation.isPending}
      >
        <Form form={extendForm} layout="vertical">
          <Form.Item name="cabinetId" label="Кабинет" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={managedCabinets.map((row) => ({
                value: row.cabinet.id,
                label: `${row.cabinet.name} — ${row.sellerEmail}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="planId" label="План" rules={[{ required: true, message: 'Выберите план' }]}>
            <Select
              options={activePlans.map((p) => ({
                value: p.id,
                label: `${p.name} [${p.kind ?? '?'}] (${formatPlanPeriod(p)}, ${p.priceRub} ₽)`,
              }))}
            />
          </Form.Item>
          <Form.Item name="abCredits" label="Кредиты А/Б (если AB_PACK; пусто = из плана)">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expiresAt" label="Дата окончания (MAIN/CAMPAIGN; для AB_PACK не нужна)">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
