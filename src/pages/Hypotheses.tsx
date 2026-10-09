import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Button,
  Checkbox,
  DatePicker,
  Dropdown,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  EditOutlined,
  ExperimentOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import locale from 'antd/locale/ru_RU'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { useWorkContextForAdmin } from '../hooks/useWorkContextForAdmin'
import { cabinetsApi } from '../api/cabinets'
import { useStoredCabinet } from '../hooks/useStoredCabinet'
import { analyticsApi } from '../api/analytics'
import { hypothesisApi } from '../api/hypothesis'
import {
  HYPOTHESIS_CRITERIA,
  HYPOTHESIS_STATUS_LABELS,
  type Hypothesis,
  type HypothesisCriterionKey,
  type HypothesisDisplayStatus,
  type HypothesisUpsertRequest,
} from '../types/hypothesis'
import { colors, shadows, spacing, transitions } from '../styles/analytics'
import HypothesisFormModal from '../components/hypothesis/HypothesisFormModal'

dayjs.locale('ru')

const accent = '#7C3AED'

function statusColor(status: HypothesisDisplayStatus): string {
  switch (status) {
    case 'SUCCESS':
      return 'success'
    case 'FAILURE':
      return 'error'
    case 'IN_PROGRESS':
      return 'processing'
    case 'WAITING_DATA':
      return 'default'
    default:
      return 'purple'
  }
}

function CriteriaCell({ criteria }: { criteria: HypothesisCriterionKey[] }) {
  const labels = criteria.map(
    (key) => HYPOTHESIS_CRITERIA.find((c) => c.key === key)?.label ?? key,
  )
  const visible = labels.slice(0, 3)
  const rest = labels.slice(3)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 52, overflow: 'hidden' }}>
      {visible.map((label) => (
        <Tag key={label} style={{ margin: 0 }}>
          {label}
        </Tag>
      ))}
      {rest.length > 0 && (
        <Dropdown
          menu={{
            items: rest.map((label) => ({ key: label, label })),
          }}
        >
          <Tag style={{ margin: 0, cursor: 'pointer' }}>+{rest.length}</Tag>
        </Dropdown>
      )}
    </div>
  )
}

export default function Hypotheses() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const isAdmin = role === 'ADMIN'
  const workContext = useWorkContextForAdmin(isAdmin)
  const { data: myCabinets = [], isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: !isAdmin,
  })
  const { cabinetId: sellerCabinetId, setCabinetId: setSellerCabinetId } = useStoredCabinet(myCabinets)
  const requestSellerId = isAdmin ? workContext.selectedSellerId : undefined
  const requestCabinetId = isAdmin ? workContext.selectedCabinetId : sellerCabinetId

  const setSelectedCabinetId = useCallback(
    (id: number | null) => {
      if (isAdmin) {
        if (id != null) workContext.applyWorkContextCabinet(id)
      } else {
        setSellerCabinetId(id)
      }
    },
    [isAdmin, workContext.applyWorkContextCabinet, setSellerCabinetId],
  )

  const cabinetSelectProps =
    !isAdmin && myCabinets.length > 0
      ? {
          cabinets: myCabinets.map((c) => ({
            id: c.id,
            name: c.name,
            marketplaceType: c.marketplaceType,
          })),
          selectedCabinetId: requestCabinetId,
          onCabinetChange: setSelectedCabinetId,
          loading: cabinetsLoading,
        }
      : undefined

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [nmId, setNmId] = useState<number | undefined>()
  const [criterion, setCriterion] = useState<string | undefined>()
  const [period, setPeriod] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Hypothesis | null>(null)

  const { data: articles = [] } = useQuery({
    queryKey: ['hypothesis-articles', requestSellerId, requestCabinetId],
    queryFn: () => analyticsApi.getArticleList(requestSellerId, requestCabinetId ?? undefined),
    enabled: requestCabinetId != null,
  })

  const listQuery = useQuery({
    queryKey: [
      'hypotheses',
      requestSellerId,
      requestCabinetId,
      search,
      status,
      nmId,
      criterion,
      period?.[0]?.format('YYYY-MM-DD'),
      period?.[1]?.format('YYYY-MM-DD'),
    ],
    queryFn: () =>
      hypothesisApi.list(requestSellerId, requestCabinetId ?? undefined, {
        search: search || undefined,
        status,
        nmId,
        criterion,
        periodFrom: period?.[0]?.format('YYYY-MM-DD'),
        periodTo: period?.[1]?.format('YYYY-MM-DD'),
      }),
    enabled: requestCabinetId != null,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => hypothesisApi.delete(id, requestSellerId, requestCabinetId ?? undefined),
    onSuccess: () => {
      message.success('Гипотеза удалена')
      queryClient.invalidateQueries({ queryKey: ['hypotheses'] })
    },
    onError: () => message.error('Не удалось удалить'),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) =>
      hypothesisApi.bulkDelete(ids, requestSellerId, requestCabinetId ?? undefined),
    onSuccess: (res) => {
      message.success(`Удалено: ${res.deleted}`)
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['hypotheses'] })
    },
    onError: () => message.error('Не удалось удалить'),
  })

  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: number; request: HypothesisUpsertRequest }) => {
      if (payload.id != null) {
        return hypothesisApi.update(payload.id, payload.request, requestSellerId, requestCabinetId ?? undefined)
      }
      return hypothesisApi.create(payload.request, requestSellerId, requestCabinetId ?? undefined)
    },
    onSuccess: () => {
      message.success(editing ? 'Гипотеза обновлена' : 'Гипотеза создана')
      setFormOpen(false)
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['hypotheses'] })
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      message.error(e.response?.data?.message || 'Не удалось сохранить')
    },
  })

  const columns: ColumnsType<Hypothesis> = useMemo(
    () => [
      {
        title: '',
        width: 48,
        render: (_, row) => (
          <Checkbox
            checked={selectedIds.includes(row.id)}
            onChange={(e) => {
              setSelectedIds((prev) =>
                e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id),
              )
            }}
          />
        ),
      },
      {
        title: 'Название',
        dataIndex: 'title',
        render: (_, row) => (
          <Link to={`/analytics/hypotheses/${row.id}`} style={{ color: colors.textPrimary }}>
            <div style={{ fontWeight: 600 }}>{row.title}</div>
            {row.description && (
              <div
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {row.description}
              </div>
            )}
          </Link>
        ),
      },
      {
        title: 'Артикул',
        width: 160,
        render: (_, row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {row.nmPhotoUrl ? (
              <img
                src={row.nmPhotoUrl}
                alt=""
                style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }}
              />
            ) : (
              <div style={{ width: 36, height: 48, background: colors.bgGray, borderRadius: 4 }} />
            )}
            <span>{row.nmId}</span>
          </div>
        ),
      },
      {
        title: 'Критерии',
        width: 200,
        render: (_, row) => <CriteriaCell criteria={row.criteria} />,
      },
      {
        title: 'Период проверки',
        width: 150,
        render: (_, row) => (
          <span style={{ whiteSpace: 'nowrap' }}>
            {dayjs(row.checkFrom).format('DD.MM.YYYY')} — {dayjs(row.checkTo).format('DD.MM.YYYY')}
          </span>
        ),
      },
      {
        title: 'Статус',
        width: 140,
        render: (_, row) => (
          <Tag color={statusColor(row.displayStatus)}>
            {HYPOTHESIS_STATUS_LABELS[row.displayStatus]}
          </Tag>
        ),
      },
      {
        title: 'Результат',
        ellipsis: true,
        render: (_, row) => row.resultSummary || '—',
      },
      {
        title: 'Дата создания',
        width: 120,
        render: (_, row) => dayjs(row.createdAt).format('DD.MM.YYYY'),
      },
      {
        title: 'Действия',
        width: 100,
        render: (_, row) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: 'Редактировать',
                  onClick: () => {
                    setEditing(row)
                    setFormOpen(true)
                  },
                },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  danger: true,
                  label: 'Удалить',
                  onClick: () => {
                    Modal.confirm({
                      title: 'Удалить гипотезу?',
                      onOk: () => deleteMutation.mutateAsync(row.id),
                    })
                  },
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    [selectedIds, deleteMutation],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        workContextCabinetSelect={isAdmin ? workContext.workContextCabinetSelectProps : undefined}
        cabinetSelectProps={cabinetSelectProps}
      />
      <Breadcrumbs />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: `${spacing.lg} 0`,
          width: '100%',
          backgroundColor: colors.bgGray,
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            backgroundColor: colors.bgWhite,
            borderTop: `1px solid ${colors.borderLight}`,
            borderBottom: `1px solid ${colors.borderLight}`,
            padding: spacing.lg,
            boxShadow: shadows.md,
            transition: transitions.normal,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              alignItems: 'flex-start',
              marginBottom: spacing.md,
              flexWrap: 'wrap',
            }}
          >
            <p
              style={{
                margin: 0,
                color: colors.textSecondary,
                alignSelf: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ExperimentOutlined style={{ color: accent, fontSize: 18 }} />
              Проверяйте идеи, находите рабочие решения, растите продажи
            </p>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: accent, borderColor: accent }}
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
              disabled={requestCabinetId == null}
            >
              Создать гипотезу
            </Button>
          </div>

          <Space wrap style={{ width: '100%', marginBottom: spacing.md }}>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
              placeholder="Поиск по артикулу, названию или описанию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 320, maxWidth: '100%' }}
            />
            <Select
              allowClear
              placeholder="Все статусы"
              style={{ width: 180 }}
              value={status}
              onChange={setStatus}
              options={Object.entries(HYPOTHESIS_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Все артикулы"
              style={{ width: 200 }}
              value={nmId}
              onChange={setNmId}
              options={articles.map((a) => ({
                value: a.nmId,
                label: `${a.nmId}${a.title ? ` — ${a.title}` : ''}`,
              }))}
            />
            <Select
              allowClear
              placeholder="Все критерии"
              style={{ width: 180 }}
              value={criterion}
              onChange={setCriterion}
              options={HYPOTHESIS_CRITERIA.map((c) => ({ value: c.key, label: c.label }))}
            />
            <DatePicker.RangePicker
              locale={locale.DatePicker}
              format="DD.MM.YYYY"
              separator="→"
              inputReadOnly
              value={period}
              onChange={(v) => setPeriod(v)}
            />
            {selectedIds.length > 0 && (
              <Button
                danger
                onClick={() =>
                  Modal.confirm({
                    title: `Удалить выбранные (${selectedIds.length})?`,
                    onOk: () => bulkDeleteMutation.mutateAsync(selectedIds),
                  })
                }
              >
                Удалить выбранные
              </Button>
            )}
          </Space>

          <Table
            rowKey="id"
            loading={listQuery.isLoading}
            columns={columns}
            dataSource={listQuery.data || []}
            pagination={{ pageSize: 20 }}
            onRow={(row) => ({
              onDoubleClick: () => navigate(`/analytics/hypotheses/${row.id}`),
            })}
          />
        </div>
      </div>

      <HypothesisFormModal
        open={formOpen}
        initial={editing}
        articles={articles}
        loading={saveMutation.isPending}
        onCancel={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={(request, workflowStatus) => {
          const payload: HypothesisUpsertRequest = { ...request, workflowStatus }
          saveMutation.mutate({ id: editing?.id, request: payload })
        }}
      />
    </div>
  )
}
