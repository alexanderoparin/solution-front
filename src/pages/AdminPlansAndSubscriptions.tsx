import { useMemo, useState } from 'react'
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
  Typography,
  Drawer,
} from 'antd'
import { PlusOutlined, EditOutlined, CreditCardOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/admin'
import type { PlanDto, SubscriptionDto, PaymentDto, CabinetBillingOverviewDto } from '../types/api'
import { getPaymentStatusLabel, getPaymentStatusColor, getSubscriptionStatusLabel } from '../utils/paymentStatus'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'

const PLAN_KIND_LABELS: Record<string, string> = {
  MAIN: 'Основной',
  CAMPAIGN: 'Управление РК',
  AB_PACK: 'Пакеты А/Б',
}

/** Порядок типов в списке: Основной → Управление РК → Пакеты А/Б. */
const PLAN_KIND_SORT_ORDER: Record<string, number> = {
  MAIN: 0,
  CAMPAIGN: 1,
  AB_PACK: 2,
}

function formatPlanKind(kind: string | null | undefined): string {
  if (!kind) return '—'
  return PLAN_KIND_LABELS[kind] ?? kind
}

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
    const kindA = PLAN_KIND_SORT_ORDER[a.kind ?? ''] ?? 99
    const kindB = PLAN_KIND_SORT_ORDER[b.kind ?? ''] ?? 99
    if (kindA !== kindB) return kindA - kindB
    const priceDiff = (a.priceRub ?? 0) - (b.priceRub ?? 0)
    if (priceDiff !== 0) return priceDiff
    return a.id - b.id
  })
}

function formatExpires(v: string | null | undefined): string {
  if (!v) return 'бессрочно'
  return dayjs(v).format('DD.MM.YYYY')
}

function formatMainCell(row: CabinetBillingOverviewDto): string {
  const t = row.mainTariff
  if (!t) return '—'
  const exp = t.expiresAt ? ` · до ${formatExpires(t.expiresAt)}` : ''
  return `${t.name}${exp}`
}

function formatCampaignCell(row: CabinetBillingOverviewDto): string {
  const c = row.campaign
  if (!c || !c.connected) return 'нет'
  if (c.status === 'INCLUDED') return c.planName ?? 'Входит в PRO'
  const exp = c.expiresAt ? ` · до ${formatExpires(c.expiresAt)}` : ''
  return `${c.planName ?? 'Подключено'}${exp}`
}

function formatAbCell(row: CabinetBillingOverviewDto): string {
  const a = row.abTests
  if (!a) return '—'
  if (a.unlimited) return 'безлимит'
  if (!a.connected && !a.activated) return 'не подключено'
  if (a.remaining != null) return `${a.remaining} тест.`
  return a.activated ? 'подключено' : 'не подключено'
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
  const [planKindFilter, setPlanKindFilter] = useState<string>('ALL')
  const [billingPage, setBillingPage] = useState(0)
  const [billingPageSize, setBillingPageSize] = useState(20)
  const [billingSearchInput, setBillingSearchInput] = useState('')
  const [billingSearch, setBillingSearch] = useState('')
  const [billingSortBy, setBillingSortBy] = useState('CABINET_ID')
  const [billingSortDir, setBillingSortDir] = useState<'ASC' | 'DESC'>('DESC')
  const [detailRow, setDetailRow] = useState<CabinetBillingOverviewDto | null>(null)
  const [extendCabinetLabel, setExtendCabinetLabel] = useState('')

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

  const { data: billingPageData, isLoading: billingLoading, isFetching: billingFetching } = useQuery({
    queryKey: ['adminCabinetsBilling', billingPage, billingPageSize, billingSearch, billingSortBy, billingSortDir],
    queryFn: () =>
      adminApi.getCabinetsBilling({
        page: billingPage,
        size: billingPageSize,
        search: billingSearch || undefined,
        sortBy: billingSortBy,
        sortDir: billingSortDir,
      }),
  })

  const billingRows = billingPageData?.content ?? []

  const { data: cabinetSubscriptions = [], isLoading: cabinetSubsLoading } = useQuery<SubscriptionDto[]>({
    queryKey: ['adminCabinetSubscriptions', detailRow?.cabinetId],
    queryFn: () => adminApi.getCabinetSubscriptions(detailRow!.cabinetId),
    enabled: detailRow != null,
  })

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<PaymentDto[]>({
    queryKey: ['adminPayments', detailRow?.sellerId],
    queryFn: () => adminApi.getUserPayments(detailRow!.sellerId!),
    enabled: detailRow?.sellerId != null,
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
      queryClient.invalidateQueries({ queryKey: ['adminCabinetsBilling'] })
      queryClient.invalidateQueries({ queryKey: ['adminCabinetSubscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['adminPayments'] })
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

  const openAssign = (row: CabinetBillingOverviewDto) => {
    setExtendCabinetLabel(`${row.cabinetName} — ${row.sellerEmail ?? '—'}`)
    extendForm.setFieldsValue({
      cabinetId: row.cabinetId,
      planId: activePlans[0]?.id,
      expiresAt: null,
      abCredits: undefined,
    })
    setExtendModalOpen(true)
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
        cabinetId: values.cabinetId,
        planId: values.planId,
        expiresAt,
        abCredits: values.abCredits,
      })
    })
  }

  const planColumns = [
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
      width: 130,
      render: (v: string | null | undefined) => formatPlanKind(v),
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

  const billingSortOrder = (apiField: string) =>
    billingSortBy === apiField ? (billingSortDir === 'ASC' ? 'ascend' : 'descend') : undefined

  const billingColumns = [
    {
      title: 'ID',
      dataIndex: 'cabinetId',
      key: 'cabinetId',
      width: 72,
      sorter: true,
      sortOrder: billingSortOrder('CABINET_ID'),
    },
    {
      title: 'Кабинет',
      dataIndex: 'cabinetName',
      key: 'cabinetName',
      width: 180,
      ellipsis: true,
      sorter: true,
      sortOrder: billingSortOrder('CABINET_NAME'),
    },
    {
      title: 'Владелец',
      dataIndex: 'sellerEmail',
      key: 'sellerEmail',
      width: 200,
      ellipsis: true,
      sorter: true,
      sortOrder: billingSortOrder('SELLER_EMAIL'),
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Основной',
      key: 'main',
      width: 180,
      sorter: true,
      sortOrder: billingSortOrder('MAIN'),
      render: (_: unknown, row: CabinetBillingOverviewDto) => formatMainCell(row),
    },
    {
      title: 'Управление РК',
      key: 'campaign',
      width: 160,
      sorter: true,
      sortOrder: billingSortOrder('CAMPAIGN'),
      render: (_: unknown, row: CabinetBillingOverviewDto) => formatCampaignCell(row),
    },
    {
      title: 'А/Б',
      key: 'ab',
      width: 120,
      sorter: true,
      sortOrder: billingSortOrder('AB'),
      render: (_: unknown, row: CabinetBillingOverviewDto) => formatAbCell(row),
    },
    {
      title: '',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, row: CabinetBillingOverviewDto) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<CreditCardOutlined />} onClick={() => openAssign(row)}>
            Назначить
          </Button>
          <Button type="link" size="small" onClick={() => setDetailRow(row)}>
            Подробнее
          </Button>
        </Space>
      ),
    },
  ]

  const subColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: 'Тип',
      dataIndex: 'planKind',
      key: 'planKind',
      width: 120,
      render: (v: string | null) => formatPlanKind(v),
    },
    { title: 'План', dataIndex: 'planName', key: 'planName' },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag>{getSubscriptionStatusLabel(s)}</Tag>,
    },
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
          <Typography.Title level={4} style={{ marginTop: 16, marginBottom: 24 }}>
            Тарифы и услуги
          </Typography.Title>

          <Tabs
            items={[
              {
                key: 'plans',
                label: 'Планы',
                children: (
                  <Card>
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
                          { value: 'MAIN', label: PLAN_KIND_LABELS.MAIN },
                          { value: 'CAMPAIGN', label: PLAN_KIND_LABELS.CAMPAIGN },
                          { value: 'AB_PACK', label: PLAN_KIND_LABELS.AB_PACK },
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
                      <Input.Search
                        placeholder="Поиск по кабинету или email"
                        allowClear
                        value={billingSearchInput}
                        onChange={(e) => setBillingSearchInput(e.target.value)}
                        onSearch={(value) => {
                          setBillingSearch(value.trim())
                          setBillingPage(0)
                        }}
                        style={{ maxWidth: 420 }}
                      />
                      <Table
                        rowKey="cabinetId"
                        loading={billingLoading || billingFetching}
                        columns={billingColumns}
                        dataSource={billingRows}
                        size="small"
                        scroll={{ x: 1000 }}
                        onChange={(pagination, _filters, sorter) => {
                          const s = Array.isArray(sorter) ? sorter[0] : sorter
                          const key = String(s?.columnKey ?? s?.field ?? '')
                          const keyToApi: Record<string, string> = {
                            cabinetId: 'CABINET_ID',
                            cabinetName: 'CABINET_NAME',
                            sellerEmail: 'SELLER_EMAIL',
                            main: 'MAIN',
                            campaign: 'CAMPAIGN',
                            ab: 'AB',
                          }
                          let nextSortBy = 'CABINET_ID'
                          let nextSortDir: 'ASC' | 'DESC' = 'DESC'
                          if (s?.order && keyToApi[key]) {
                            nextSortBy = keyToApi[key]
                            nextSortDir = s.order === 'ascend' ? 'ASC' : 'DESC'
                          }
                          const sortChanged =
                            nextSortBy !== billingSortBy || nextSortDir !== billingSortDir
                          setBillingSortBy(nextSortBy)
                          setBillingSortDir(nextSortDir)
                          setBillingPageSize(pagination.pageSize ?? billingPageSize)
                          setBillingPage(sortChanged ? 0 : (pagination.current ?? 1) - 1)
                        }}
                        pagination={{
                          current: billingPage + 1,
                          pageSize: billingPageSize,
                          total: billingPageData?.totalElements ?? 0,
                          showSizeChanger: true,
                          pageSizeOptions: ['10', '20', '50'],
                        }}
                      />
                    </Space>
                  </Card>
                ),
              },
            ]}
          />
        </div>
      </div>

      <Drawer
        title={
          detailRow
            ? `${detailRow.cabinetName} — ${detailRow.sellerEmail ?? ''}`
            : 'Детали'
        }
        open={detailRow != null}
        onClose={() => setDetailRow(null)}
        width={720}
        destroyOnClose
      >
        {detailRow && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Button
                type="primary"
                icon={<CreditCardOutlined />}
                onClick={() => openAssign(detailRow)}
                style={{ marginBottom: 16 }}
              >
                Назначить
              </Button>
            </div>
            <div>
              <Typography.Title level={5}>Подписки кабинета</Typography.Title>
              <Table
                rowKey="id"
                loading={cabinetSubsLoading}
                columns={subColumns}
                dataSource={cabinetSubscriptions}
                pagination={false}
                size="small"
              />
            </div>
            <div>
              <Typography.Title level={5}>Платежи владельца</Typography.Title>
              <Table
                rowKey="id"
                loading={paymentsLoading}
                columns={paymentColumns}
                dataSource={payments}
                pagination={false}
                size="small"
              />
            </div>
          </Space>
        )}
      </Drawer>

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
            <Input placeholder="ab_pack_free / ab_pack_5 / pro_month" disabled={!!editingPlan?.code} />
          </Form.Item>
          <Form.Item name="kind" label="Тип" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'MAIN', label: PLAN_KIND_LABELS.MAIN },
                { value: 'CAMPAIGN', label: PLAN_KIND_LABELS.CAMPAIGN },
                { value: 'AB_PACK', label: PLAN_KIND_LABELS.AB_PACK },
              ]}
            />
          </Form.Item>
          <Form.Item name="creditAmount" label="Кредиты А/Б (для пакетов А/Б)">
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
          <Form.Item name="periodDays" label="Период, дней (0 для пакетов А/Б)" rules={[{ required: true }]}>
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
          <Form.Item name="cabinetId" hidden rules={[{ required: true }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item label="Кабинет">
            <Input value={extendCabinetLabel} disabled />
          </Form.Item>
          <Form.Item name="planId" label="План" rules={[{ required: true, message: 'Выберите план' }]}>
            <Select
              options={activePlans.map((p) => ({
                value: p.id,
                label: `${p.name} [${formatPlanKind(p.kind)}] (${formatPlanPeriod(p)}, ${p.priceRub} ₽)`,
              }))}
            />
          </Form.Item>
          <Form.Item name="abCredits" label="Кредиты А/Б (если пакет А/Б; пусто = из плана)">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="expiresAt"
            label="Дата окончания (основной / Управление РК; для пакетов А/Б не нужна)"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
