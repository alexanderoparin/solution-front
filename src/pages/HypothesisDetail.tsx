import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Dropdown,
  Modal,
  Space,
  Table,
  Tag,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { useWorkContextForAdmin } from '../hooks/useWorkContextForAdmin'
import { cabinetsApi } from '../api/cabinets'
import { useStoredCabinet } from '../hooks/useStoredCabinet'
import { useEntityCabinetResolve } from '../hooks/useEntityCabinetResolve'
import { analyticsApi } from '../api/analytics'
import { hypothesisApi } from '../api/hypothesis'
import {
  HYPOTHESIS_CRITERIA,
  HYPOTHESIS_STATUS_LABELS,
  type HypothesisCriterionValue,
  type HypothesisUpsertRequest,
  type HypothesisVerdict,
} from '../types/hypothesis'
import { colors, shadows, spacing, transitions } from '../styles/analytics'
import HypothesisFormModal from '../components/hypothesis/HypothesisFormModal'

dayjs.locale('ru')

const LINE_COLORS = ['#7C3AED', '#2563EB', '#16A34A', '#EA580C', '#DB2777', '#0891B2', '#CA8A04', '#4B5563']

function formatMetric(value: number | null | undefined): string {
  if (value == null) return '—'
  return Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 })
}

function CriterionResultIcon({ improved }: { improved: boolean | null | undefined }) {
  if (improved === true) return <CheckOutlined style={{ color: colors.success }} />
  if (improved === false) return <MinusOutlined style={{ color: colors.textMuted }} />
  return <span style={{ color: colors.textMuted }}>—</span>
}

export default function HypothesisDetail() {
  const { id } = useParams()
  const hypothesisId = Number(id)
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
  const selectedCabinetId = isAdmin ? workContext.selectedCabinetId : sellerCabinetId
  const [formOpen, setFormOpen] = useState(false)

  const { requestSellerId, requestCabinetId, cabinetReady } = useEntityCabinetResolve({
    queryKey: ['hypothesis-cabinet', hypothesisId],
    resolveFn: () => hypothesisApi.resolveCabinet(hypothesisId),
    enabled: Number.isFinite(hypothesisId),
    isAdmin,
    selectedCabinetId,
    applyWorkContextCabinet: workContext.applyWorkContextCabinet,
    setSellerCabinetId,
  })

  const cabinetSelectProps =
    !isAdmin && myCabinets.length > 0
      ? {
          cabinets: myCabinets.map((c) => ({
            id: c.id,
            name: c.name,
            marketplaceType: c.marketplaceType,
          })),
          selectedCabinetId,
          onCabinetChange: (id: number | null) => {
            if (id != null) setSellerCabinetId(id)
          },
          loading: cabinetsLoading,
        }
      : undefined

  const pageShell = (children: ReactNode) => (
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
            width: '100%',
            backgroundColor: colors.bgWhite,
            borderTop: `1px solid ${colors.borderLight}`,
            borderBottom: `1px solid ${colors.borderLight}`,
            padding: spacing.lg,
            boxShadow: shadows.md,
            transition: transitions.normal,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )

  const detailQuery = useQuery({
    queryKey: ['hypothesis', hypothesisId, requestSellerId, requestCabinetId],
    queryFn: () => hypothesisApi.get(hypothesisId, requestSellerId, requestCabinetId ?? undefined),
    enabled: cabinetReady && Number.isFinite(hypothesisId),
  })

  const { data: articles = [] } = useQuery({
    queryKey: ['hypothesis-articles', requestSellerId, requestCabinetId],
    queryFn: () => analyticsApi.getArticleList(requestSellerId, requestCabinetId ?? undefined),
    enabled: requestCabinetId != null,
  })

  const verdictMutation = useMutation({
    mutationFn: (verdict: HypothesisVerdict) =>
      hypothesisApi.setVerdict(hypothesisId, verdict, requestSellerId, requestCabinetId ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hypothesis', hypothesisId] })
      queryClient.invalidateQueries({ queryKey: ['hypotheses'] })
    },
    onError: () => message.error('Не удалось обновить статус'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => hypothesisApi.delete(hypothesisId, requestSellerId, requestCabinetId ?? undefined),
    onSuccess: () => {
      message.success('Гипотеза удалена')
      navigate('/analytics/hypotheses')
    },
  })

  const saveMutation = useMutation({
    mutationFn: (request: HypothesisUpsertRequest) =>
      hypothesisApi.update(hypothesisId, request, requestSellerId, requestCabinetId ?? undefined),
    onSuccess: () => {
      message.success('Сохранено')
      setFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['hypothesis', hypothesisId] })
      queryClient.invalidateQueries({ queryKey: ['hypotheses'] })
    },
    onError: () => message.error('Не удалось сохранить'),
  })

  const hypothesis = detailQuery.data

  const chartData = useMemo(() => {
    if (!hypothesis?.dynamics) return []
    return hypothesis.dynamics.map((point) => ({
      date: dayjs(point.date).format('DD.MM'),
      fullDate: point.date,
      period: point.period,
      ...point.values,
    }))
  }, [hypothesis])

  const checkStartLabel = hypothesis ? dayjs(hypothesis.checkFrom).format('DD.MM') : ''

  if (!cabinetReady || detailQuery.isLoading) {
    return pageShell(
      <div style={{ padding: 40, textAlign: 'center', color: colors.textSecondary }}>Загрузка…</div>,
    )
  }

  if (!hypothesis) {
    return pageShell(<div style={{ padding: 40, textAlign: 'center' }}>Гипотеза не найдена</div>)
  }

  const displaySuccess = hypothesis.displayStatus === 'SUCCESS'
  const displayFailure = hypothesis.displayStatus === 'FAILURE'

  return pageShell(
    <>
        <Link
          to="/analytics/hypotheses"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, color: colors.textSecondary }}
        >
          <ArrowLeftOutlined /> Назад к списку
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {hypothesis.nmPhotoUrl ? (
              <img
                src={hypothesis.nmPhotoUrl}
                alt=""
                style={{ width: 56, height: 74, objectFit: 'cover', borderRadius: 8 }}
              />
            ) : null}
            <div>
              <Space wrap style={{ marginBottom: 6 }}>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'SUCCESS',
                        label: 'Успешно',
                        onClick: () => verdictMutation.mutate('SUCCESS'),
                      },
                      {
                        key: 'FAILURE',
                        label: 'Неуспешно',
                        onClick: () => verdictMutation.mutate('FAILURE'),
                      },
                    ],
                  }}
                >
                  <Tag
                    color={displaySuccess ? 'success' : displayFailure ? 'error' : 'processing'}
                    style={{ cursor: 'pointer' }}
                  >
                    {HYPOTHESIS_STATUS_LABELS[hypothesis.displayStatus]}
                  </Tag>
                </Dropdown>
              </Space>
              <h1 style={{ margin: 0, fontSize: 26 }}>{hypothesis.title}</h1>
              {hypothesis.description && (
                <p style={{ margin: '8px 0 0', color: colors.textSecondary }}>{hypothesis.description}</p>
              )}
            </div>
          </div>
          <Space>
            <Button icon={<EditOutlined />} onClick={() => setFormOpen(true)}>
              Редактировать
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'delete',
                    danger: true,
                    icon: <DeleteOutlined />,
                    label: 'Удалить',
                    onClick: () =>
                      Modal.confirm({
                        title: 'Удалить гипотезу?',
                        onOk: () => deleteMutation.mutateAsync(),
                      }),
                  },
                ],
              }}
            >
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 220px',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: colors.bgWhite,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            <Meta label="Артикул" value={String(hypothesis.nmId)} />
            <Meta label="Категория" value={hypothesis.categoryName || '—'} />
            <Meta label="Автор гипотезы" value={hypothesis.createdByName || '—'} />
            <Meta label="Дата создания" value={dayjs(hypothesis.createdAt).format('DD.MM.YYYY')} />
            <Meta
              label="Период проверки"
              value={`${dayjs(hypothesis.checkFrom).format('DD.MM.YYYY')} — ${dayjs(hypothesis.checkTo).format('DD.MM.YYYY')}`}
            />
            <Meta
              label="Начальные данные"
              value={`${dayjs(hypothesis.baselineFrom).format('DD.MM.YYYY')} — ${dayjs(hypothesis.baselineTo).format('DD.MM.YYYY')}`}
            />
          </div>
          <div
            style={{
              background: displaySuccess ? '#ECFDF5' : displayFailure ? '#FEF2F2' : '#F5F3FF',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              border: `1px solid ${colors.border}`,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Результат: {displaySuccess ? 'Успешно' : displayFailure ? 'Неуспешно' : HYPOTHESIS_STATUS_LABELS[hypothesis.displayStatus]}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ background: colors.bgWhite, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Описание гипотезы</div>
            <div style={{ color: colors.textSecondary, whiteSpace: 'pre-wrap' }}>
              {hypothesis.description || '—'}
            </div>
          </div>
          <div style={{ background: colors.bgWhite, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Выбранные критерии</div>
            <Space wrap>
              {hypothesis.criteria.map((key) => (
                <Tag key={key}>{HYPOTHESIS_CRITERIA.find((c) => c.key === key)?.label ?? key}</Tag>
              ))}
            </Space>
          </div>
        </div>

        <div style={{ background: colors.bgWhite, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Результаты по критериям</div>
          <Table
            rowKey="key"
            pagination={false}
            size="middle"
            dataSource={hypothesis.criterionResults || []}
            columns={[
              { title: 'Критерий', dataIndex: 'label' },
              {
                title: `Начальные данные (${dayjs(hypothesis.baselineFrom).format('DD.MM')}–${dayjs(hypothesis.baselineTo).format('DD.MM')})`,
                render: (_, row: HypothesisCriterionValue) => formatMetric(row.baseline),
              },
              {
                title: `Проверка (${dayjs(hypothesis.checkFrom).format('DD.MM')}–${dayjs(hypothesis.checkTo).format('DD.MM')})`,
                render: (_, row: HypothesisCriterionValue) => formatMetric(row.check),
              },
              {
                title: 'Изменение',
                render: (_, row: HypothesisCriterionValue) => {
                  if (row.change == null) return '—'
                  const sign = row.change > 0 ? '+' : ''
                  const pct =
                    row.changePercent != null ? ` (${sign}${formatMetric(row.changePercent)}%)` : ''
                  return `${sign}${formatMetric(row.change)}${pct}`
                },
              },
              {
                title: 'Результат',
                width: 90,
                align: 'center',
                render: (_, row: HypothesisCriterionValue) => <CriterionResultIcon improved={row.improved} />,
              },
            ]}
          />
          <div style={{ marginTop: 8, color: colors.textMuted, fontSize: 12 }}>
            Сравнение одинаковых по длительности периодов: до проверки и период проверки.
          </div>
        </div>

        <div style={{ background: colors.bgWhite, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Динамика показателей</div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {checkStartLabel && (
                  <ReferenceLine x={checkStartLabel} stroke={colors.textMuted} strokeDasharray="4 4" />
                )}
                {(hypothesis.criteria || []).map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={HYPOTHESIS_CRITERIA.find((c) => c.key === key)?.label ?? key}
                    stroke={LINE_COLORS[index % LINE_COLORS.length]}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      <HypothesisFormModal
        open={formOpen}
        initial={hypothesis}
        articles={articles}
        loading={saveMutation.isPending}
        onCancel={() => setFormOpen(false)}
        onSubmit={(request, workflowStatus) => {
          saveMutation.mutate({ ...request, workflowStatus })
        }}
      />
    </>,
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: colors.textMuted }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  )
}
