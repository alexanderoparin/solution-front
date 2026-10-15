import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Button,
  Checkbox,
  DatePicker,
  Dropdown,
  Input,
  Modal,
  Select,
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

function useIsNarrow(maxWidthPx = 900): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${maxWidthPx}px)`).matches : false,
  )
  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${maxWidthPx}px)`)
    const onChange = () => setNarrow(mediaQuery.matches)
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }, [maxWidthPx])
  return narrow
}

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
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {labels.map((label) => (
        <Tag key={label} style={{ margin: 0, paddingInline: 5, fontSize: 12, lineHeight: '20px' }}>
          {label}
        </Tag>
      ))}
    </div>
  )
}

function formatResultNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 })
}

function formatSignedChange(value: number | null | undefined): string {
  if (value == null) return '—'
  const abs = Math.abs(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 })
  if (value > 0) return `+${abs}`
  if (value < 0) return `−${abs}`
  return abs
}

function ResultCell({ row }: { row: Hypothesis }) {
  const resultsByKey = new Map(
    (row.criterionResults ?? []).map((item) => [item.key, item]),
  )
  const keys =
    row.criteria.length > 0
      ? row.criteria
      : (row.criterionResults ?? []).map((item) => item.key as HypothesisCriterionKey)

  if (keys.length === 0) return <span>—</span>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, lineHeight: 1.35 }}>
      {keys.map((key) => {
        const item = resultsByKey.get(key)
        const label = item?.label ?? HYPOTHESIS_CRITERIA.find((c) => c.key === key)?.label ?? key
        if (item == null || item.check == null || item.change == null) {
          return (
            <div key={key} style={{ whiteSpace: 'nowrap', color: colors.textMuted }}>
              {label} —
            </div>
          )
        }
        const arrow =
          item.improved === true ? '↑' : item.improved === false ? '↓' : '→'
        return (
          <div key={key} style={{ whiteSpace: 'nowrap' }}>
            {label} {formatResultNumber(item.check)} {arrow} {formatSignedChange(item.change)}
          </div>
        )
      })}
    </div>
  )
}

function HypothesisMobileCard({
  row,
  selected,
  onToggleSelect,
  onOpen,
  onEdit,
  onDelete,
}: {
  row: Hypothesis
  selected: boolean
  onToggleSelect: (checked: boolean) => void
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="hypothesis-mobile-card"
      onClick={onOpen}
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 12,
        background: colors.bgWhite,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Checkbox
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onToggleSelect(e.target.checked)}
        />
        {row.nmPhotoUrl ? (
          <img
            src={row.nmPhotoUrl}
            alt=""
            style={{ width: 40, height: 52, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 52,
              background: colors.bgGray,
              borderRadius: 6,
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 600, color: colors.textPrimary, overflowWrap: 'anywhere' }}>
              {row.title}
            </div>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'edit',
                    icon: <EditOutlined />,
                    label: 'Редактировать',
                    onClick: () => onEdit(),
                  },
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    danger: true,
                    label: 'Удалить',
                    onClick: () => onDelete(),
                  },
                ],
              }}
              trigger={['click']}
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </div>
          <div style={{ marginTop: 4 }}>
            <Tag color={statusColor(row.displayStatus)} style={{ margin: 0 }}>
              {HYPOTHESIS_STATUS_LABELS[row.displayStatus]}
            </Tag>
          </div>
          <div style={{ marginTop: 6, color: colors.textSecondary, fontSize: 13 }}>
            {row.nmId}
            {' · '}
            {dayjs(row.checkFrom).format('DD.MM.YY')}–{dayjs(row.checkTo).format('DD.MM.YY')}
          </div>
        </div>
      </div>
      <CriteriaCell criteria={row.criteria} />
      <div style={{ color: colors.textMuted, fontSize: 12 }}>
        Создано {dayjs(row.createdAt).format('DD.MM.YYYY')}
      </div>
    </div>
  )
}

export default function Hypotheses() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNarrow = useIsNarrow(900)
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
        fixed: 'left',
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
        width: 220,
        ellipsis: true,
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
        width: 150,
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
        width: 180,
        render: (_, row) => <CriteriaCell criteria={row.criteria} />,
      },
      {
        title: 'Период проверки',
        width: 110,
        render: (_, row) => (
          <div style={{ lineHeight: 1.4 }}>
            <div style={{ whiteSpace: 'nowrap' }}>{dayjs(row.checkFrom).format('DD.MM.YYYY')}</div>
            <div style={{ whiteSpace: 'nowrap' }}>{dayjs(row.checkTo).format('DD.MM.YYYY')}</div>
          </div>
        ),
      },
      {
        title: 'Статус',
        width: 130,
        render: (_, row) => (
          <Tag color={statusColor(row.displayStatus)} style={{ marginInlineEnd: 0 }}>
            {HYPOTHESIS_STATUS_LABELS[row.displayStatus]}
          </Tag>
        ),
      },
      {
        title: 'Результат',
        width: 220,
        render: (_, row) => <ResultCell row={row} />,
      },
      {
        title: 'Дата создания',
        width: 120,
        render: (_, row) => (
          <span style={{ whiteSpace: 'nowrap' }}>{dayjs(row.createdAt).format('DD.MM.YYYY')}</span>
        ),
      },
      {
        title: 'Действия',
        width: 100,
        fixed: 'right',
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

  const rows = listQuery.data || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 900px) {
          .hypotheses-shell {
            padding: 12px 0 !important;
          }
          .hypotheses-panel {
            padding: 12px !important;
          }
          .hypotheses-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .hypotheses-toolbar .ant-btn {
            width: 100%;
          }
          .hypotheses-filters {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 8px !important;
            width: 100%;
          }
          .hypotheses-filters .hypotheses-filter-search,
          .hypotheses-filters .hypotheses-filter-period,
          .hypotheses-filters .hypotheses-filter-bulk {
            grid-column: 1 / -1;
          }
          .hypotheses-filters .ant-select,
          .hypotheses-filters .ant-picker,
          .hypotheses-filters .ant-input-affix-wrapper {
            width: 100% !important;
          }
        }
      `}</style>
      <Header
        workContextCabinetSelect={isAdmin ? workContext.workContextCabinetSelectProps : undefined}
        cabinetSelectProps={cabinetSelectProps}
      />
      <Breadcrumbs />
      <div
        className="hypotheses-shell"
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
          className="hypotheses-panel"
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
            className="hypotheses-toolbar"
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
                alignSelf: isNarrow ? 'flex-start' : 'center',
                display: 'inline-flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: isNarrow ? 13 : undefined,
                lineHeight: 1.4,
              }}
            >
              <ExperimentOutlined style={{ color: accent, fontSize: 18, marginTop: 2 }} />
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

          <div
            className="hypotheses-filters"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              width: '100%',
              marginBottom: spacing.md,
              alignItems: 'center',
            }}
          >
            <Input
              className="hypotheses-filter-search"
              allowClear
              prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
              placeholder={isNarrow ? 'Поиск...' : 'Поиск по артикулу, названию или описанию...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: isNarrow ? '100%' : 320, maxWidth: '100%' }}
            />
            <Select
              allowClear
              placeholder="Все статусы"
              style={{ width: isNarrow ? '100%' : 180 }}
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
              style={{ width: isNarrow ? '100%' : 260 }}
              value={nmId}
              onChange={setNmId}
              listHeight={360}
              virtual={false}
              popupMatchSelectWidth={320}
              options={articles.map((a) => ({
                value: a.nmId,
                label: `${a.nmId}${a.title ? ` — ${a.title}` : ''}`,
                title: a.title || 'Без названия',
                photoUrl: a.photoTm ?? a.photoC246x328 ?? null,
              }))}
              optionRender={(option) => {
                const optionTitle = (option.data as { title?: string }).title ?? 'Без названия'
                const photoUrl = (option.data as { photoUrl?: string | null }).photoUrl
                return (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '2px 0' }}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt=""
                        style={{
                          width: 28,
                          height: 36,
                          objectFit: 'cover',
                          borderRadius: 4,
                          flexShrink: 0,
                          background: colors.bgGray,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 28,
                          height: 36,
                          borderRadius: 4,
                          flexShrink: 0,
                          background: colors.bgGray,
                        }}
                      />
                    )}
                    <div style={{ minWidth: 0, lineHeight: 1.25 }}>
                      <div
                        style={{
                          fontSize: 13,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {optionTitle}
                      </div>
                      <div style={{ color: colors.textMuted, fontSize: 11 }}>{option.value}</div>
                    </div>
                  </div>
                )
              }}
              labelRender={(props) => {
                const article = articles.find((a) => a.nmId === props.value)
                const photoUrl = article?.photoTm ?? article?.photoC246x328 ?? null
                const text =
                  article != null
                    ? `${article.nmId}${article.title ? ` — ${article.title}` : ''}`
                    : String(props.value ?? '')
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt=""
                        style={{
                          width: 20,
                          height: 26,
                          objectFit: 'cover',
                          borderRadius: 3,
                          flexShrink: 0,
                          background: colors.bgGray,
                        }}
                      />
                    ) : null}
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {text}
                    </span>
                  </div>
                )
              }}
            />
            <Select
              allowClear
              placeholder="Все критерии"
              style={{ width: isNarrow ? '100%' : 180 }}
              value={criterion}
              onChange={setCriterion}
              options={HYPOTHESIS_CRITERIA.map((c) => ({ value: c.key, label: c.label }))}
            />
            <DatePicker.RangePicker
              className="hypotheses-filter-period"
              locale={locale.DatePicker}
              format={isNarrow ? 'DD.MM.YY' : 'DD.MM.YYYY'}
              separator="→"
              inputReadOnly
              value={period}
              onChange={(v) => setPeriod(v)}
              style={{ width: isNarrow ? '100%' : undefined }}
            />
            {selectedIds.length > 0 && (
              <Button
                className="hypotheses-filter-bulk"
                danger
                block={isNarrow}
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
          </div>

          {isNarrow ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {listQuery.isLoading ? (
                <div style={{ padding: 24, textAlign: 'center', color: colors.textSecondary }}>
                  Загрузка…
                </div>
              ) : rows.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: colors.textSecondary }}>
                  Нет гипотез
                </div>
              ) : (
                rows.map((row) => (
                  <HypothesisMobileCard
                    key={row.id}
                    row={row}
                    selected={selectedIds.includes(row.id)}
                    onToggleSelect={(checked) => {
                      setSelectedIds((prev) =>
                        checked ? [...prev, row.id] : prev.filter((id) => id !== row.id),
                      )
                    }}
                    onOpen={() => navigate(`/analytics/hypotheses/${row.id}`)}
                    onEdit={() => {
                      setEditing(row)
                      setFormOpen(true)
                    }}
                    onDelete={() => {
                      Modal.confirm({
                        title: 'Удалить гипотезу?',
                        onOk: () => deleteMutation.mutateAsync(row.id),
                      })
                    }}
                  />
                ))
              )}
            </div>
          ) : (
            <Table
              rowKey="id"
              loading={listQuery.isLoading}
              columns={columns}
              dataSource={rows}
              pagination={{ pageSize: 20 }}
              scroll={{ x: 1278 }}
              tableLayout="fixed"
              onRow={(row) => ({
                onDoubleClick: () => navigate(`/analytics/hypotheses/${row.id}`),
              })}
            />
          )}
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
        onSubmit={(request) => {
          saveMutation.mutate({ id: editing?.id, request })
        }}
      />
    </div>
  )
}
