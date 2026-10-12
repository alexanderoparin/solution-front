import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
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
  type HypothesisCriterionKey,
  type HypothesisCriterionValue,
  type HypothesisUpsertRequest,
  type HypothesisVerdict,
} from '../types/hypothesis'
import { colors, shadows, spacing, transitions } from '../styles/analytics'
import HypothesisFormModal from '../components/hypothesis/HypothesisFormModal'

dayjs.locale('ru')

const LINE_COLORS = ['#7C3AED', '#2563EB', '#16A34A', '#EA580C', '#DB2777', '#0891B2', '#CA8A04', '#4B5563']
const ACCENT = '#7C3AED'

function criterionColor(key: string, index = 0): string {
  const ordered = HYPOTHESIS_CRITERIA.findIndex((c) => c.key === key)
  const i = ordered >= 0 ? ordered : index
  return LINE_COLORS[i % LINE_COLORS.length]
}

function formatMetric(value: number | null | undefined): string {
  if (value == null) return '—'
  return Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 })
}

function CriterionResultIcon({ improved }: { improved: boolean | null | undefined }) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    fontSize: 12,
  }
  if (improved === true) {
    return (
      <span style={{ ...base, background: colors.successLight, color: colors.success }}>
        <CheckOutlined />
      </span>
    )
  }
  if (improved === false) {
    return (
      <span style={{ ...base, background: colors.errorLight, color: colors.error }}>
        <MinusOutlined />
      </span>
    )
  }
  return <span style={{ color: colors.textMuted }}>—</span>
}

function SectionCard({
  title,
  accent,
  children,
  style,
}: {
  title?: string
  accent?: string
  children: ReactNode
  style?: CSSProperties
}) {
  const bar = accent ?? ACCENT
  return (
    <div
      style={{
        background: colors.bgWhite,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: bar,
        }}
      />
      {title ? (
        <div style={{ fontWeight: 600, marginBottom: 12, paddingLeft: 8, color: colors.textPrimary }}>
          {title}
        </div>
      ) : null}
      <div style={{ paddingLeft: title ? 8 : 8 }}>{children}</div>
    </div>
  )
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

  const chartCriteria = hypothesis?.criteria ?? []

  const chartData = useMemo(() => {
    if (!hypothesis?.dynamics?.length) return []
    const mins: Partial<Record<HypothesisCriterionKey, number>> = {}
    const maxs: Partial<Record<HypothesisCriterionKey, number>> = {}
    for (const key of chartCriteria) {
      const vals = hypothesis.dynamics
        .map((point) => point.values?.[key])
        .filter((value): value is number => value != null && Number.isFinite(value))
      if (vals.length === 0) continue
      mins[key] = Math.min(...vals)
      maxs[key] = Math.max(...vals)
    }
    return hypothesis.dynamics.map((point) => {
      const row: Record<string, string | number | null> = {
        date: dayjs(point.date).format('DD.MM'),
        fullDate: point.date,
      }
      for (const key of chartCriteria) {
        const raw = point.values?.[key]
        row[`${key}_raw`] = raw ?? null
        if (raw == null || !Number.isFinite(raw)) {
          row[key] = null
          continue
        }
        const min = mins[key]
        const max = maxs[key]
        if (min == null || max == null) {
          row[key] = null
        } else if (max === min) {
          row[key] = 50
        } else {
          row[key] = ((raw - min) / (max - min)) * 100
        }
      }
      return row
    })
  }, [hypothesis, chartCriteria])

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

  const resultLabel = displaySuccess
    ? 'Успешно'
    : displayFailure
      ? 'Неуспешно'
      : HYPOTHESIS_STATUS_LABELS[hypothesis.displayStatus]
  const resultTone = displaySuccess
    ? { bg: 'linear-gradient(145deg, #ECFDF5 0%, #D1FAE5 100%)', border: '#6EE7B7', color: '#047857' }
    : displayFailure
      ? { bg: 'linear-gradient(145deg, #FEF2F2 0%, #FECACA 100%)', border: '#FCA5A5', color: '#B91C1C' }
      : { bg: 'linear-gradient(145deg, #F5F3FF 0%, #DDD6FE 100%)', border: '#C4B5FD', color: '#5B21B6' }

  return pageShell(
    <>
        <Link
          to="/analytics/hypotheses"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, color: ACCENT }}
        >
          <ArrowLeftOutlined /> Назад к списку
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {hypothesis.nmPhotoUrl ? (
              <img
                src={hypothesis.nmPhotoUrl}
                alt=""
                style={{
                  width: 56,
                  height: 74,
                  objectFit: 'cover',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.18)',
                  border: `2px solid ${colors.primaryLight}`,
                }}
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
                    style={{ cursor: 'pointer', fontWeight: 600 }}
                  >
                    {HYPOTHESIS_STATUS_LABELS[hypothesis.displayStatus]}
                  </Tag>
                </Dropdown>
              </Space>
              <h1 style={{ margin: 0, fontSize: 26, color: colors.textPrimary }}>{hypothesis.title}</h1>
            </div>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setFormOpen(true)}
              style={{ background: ACCENT, borderColor: ACCENT }}
            >
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
          <SectionCard accent="#6366F1">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              <Meta label="Артикул" value={String(hypothesis.nmId)} tint="#EEF2FF" />
              <Meta label="Категория" value={hypothesis.categoryName || '—'} tint="#F0FDF4" />
              <Meta label="Автор гипотезы" value={hypothesis.createdByName || '—'} tint="#FDF4FF" />
              <Meta label="Дата создания" value={dayjs(hypothesis.createdAt).format('DD.MM.YYYY')} tint="#FFF7ED" />
              <Meta
                label="Период проверки"
                value={`${dayjs(hypothesis.checkFrom).format('DD.MM.YYYY')} — ${dayjs(hypothesis.checkTo).format('DD.MM.YYYY')}`}
                tint="#ECFEFF"
              />
              <Meta
                label="Начальные данные"
                value={`${dayjs(hypothesis.baselineFrom).format('DD.MM.YYYY')} — ${dayjs(hypothesis.baselineTo).format('DD.MM.YYYY')}`}
                tint="#FEF3C7"
              />
            </div>
          </SectionCard>
          <div
            style={{
              background: resultTone.bg,
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              border: `1px solid ${resultTone.border}`,
              boxShadow: '0 4px 14px rgba(91, 33, 182, 0.08)',
              minHeight: 120,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: resultTone.color, opacity: 0.85, marginBottom: 6 }}>
              Результат
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, color: resultTone.color }}>{resultLabel}</div>
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
          <SectionCard title="Описание гипотезы" accent="#8B5CF6">
            <div style={{ color: colors.textSecondary, whiteSpace: 'pre-wrap' }}>
              {hypothesis.description || '—'}
            </div>
          </SectionCard>
          <SectionCard title="Выбранные критерии" accent="#06B6D4">
            <Space wrap>
              {hypothesis.criteria.map((key, index) => {
                const color = criterionColor(key, index)
                return (
                  <Tag
                    key={key}
                    style={{
                      margin: 0,
                      color,
                      background: `${color}18`,
                      borderColor: `${color}55`,
                      fontWeight: 600,
                    }}
                  >
                    {HYPOTHESIS_CRITERIA.find((c) => c.key === key)?.label ?? key}
                  </Tag>
                )
              })}
            </Space>
          </SectionCard>
        </div>

        <SectionCard title="Результаты по критериям" accent="#10B981" style={{ marginBottom: 16 }}>
          <Table
            rowKey="key"
            pagination={false}
            size="middle"
            dataSource={hypothesis.criterionResults || []}
            columns={[
              {
                title: 'Критерий',
                render: (_, row: HypothesisCriterionValue) => (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: criterionColor(row.key),
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{row.label}</span>
                  </span>
                ),
              },
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
                  const tone =
                    row.improved === true
                      ? colors.success
                      : row.improved === false
                        ? colors.error
                        : colors.textPrimary
                  return (
                    <span style={{ color: tone, fontWeight: 600 }}>
                      {sign}
                      {formatMetric(row.change)}
                      {pct}
                    </span>
                  )
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
        </SectionCard>

        <SectionCard title="Динамика показателей" accent="#F59E0B">
          <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>
            Каждый показатель нормирован по своему диапазону (0–100), чтобы сравнивать форму динамики на разных шкалах.
            В подсказке — исходные значения.
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `${value}`}
                  width={36}
                />
                <Tooltip
                  content={({ active, label, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div
                        style={{
                          background: colors.bgWhite,
                          border: `1px solid ${colors.border}`,
                          borderRadius: 8,
                          padding: '8px 10px',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
                        {payload.map((entry) => {
                          const key = String(entry.dataKey)
                          const raw = (entry.payload as Record<string, number | null | undefined>)[`${key}_raw`]
                          return (
                            <div key={key} style={{ color: entry.color, marginTop: 2 }}>
                              {entry.name}: {formatMetric(raw)}
                            </div>
                          )
                        })}
                      </div>
                    )
                  }}
                />
                <Legend />
                {checkStartLabel && (
                  <ReferenceLine x={checkStartLabel} stroke={colors.textMuted} strokeDasharray="4 4" />
                )}
                {chartCriteria.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={HYPOTHESIS_CRITERIA.find((c) => c.key === key)?.label ?? key}
                    stroke={LINE_COLORS[index % LINE_COLORS.length]}
                    dot={false}
                    strokeWidth={2}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

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

function Meta({
  label,
  value,
  tint,
}: {
  label: string
  value: string
  tint?: string
}) {
  return (
    <div
      style={{
        background: tint ?? colors.bgGray,
        borderRadius: 10,
        padding: '10px 12px',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600, color: colors.textPrimary, wordBreak: 'break-word' }}>{value}</div>
    </div>
  )
}
