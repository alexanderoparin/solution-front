import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Checkbox, Drawer, Grid, Input, Pagination, Segmented, Select, Space, Table, Tag, Tooltip, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FilterValue, SorterResult, TableCurrentDataSource, TablePaginationConfig } from 'antd/es/table/interface'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SyncOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { adminApi } from '../api/admin'
import type { SortDirection, WbApiEventDto, WbApiEventSortField, WbApiEventStatus, WbApiEventType, OzonApiEventDto, OzonApiEventSortField, OzonApiEventStatus, OzonApiEventType, PageResponse } from '../types/api'

type Marketplace = 'WB' | 'OZON'
type ApiEventDto = WbApiEventDto | OzonApiEventDto
type ApiEventSortField = WbApiEventSortField | OzonApiEventSortField

interface ApiEventStatsDto {
  total: number
  byStatus: Record<string, number>
}

interface ApiEventTypeStatsDto {
  baseStatus: string | null
  total: number
  byType: Record<string, number>
}

interface ApiEventCabinetStatsDto {
  baseStatus: string | null
  baseEventType: string | null
  total: number
  byCabinet: Array<{ cabinetId: number; cabinetName: string; count: number }>
}

const WB_STATUS_COLORS: Record<WbApiEventStatus, string> = {
  CREATED: 'blue',
  RUNNING: 'processing',
  SUCCESS: 'green',
  FAILED_RETRYABLE: 'orange',
  FAILED_FINAL: 'red',
  FAILED_WITH_FALLBACK: 'gold',
  DEFERRED_RATE_LIMIT: 'purple',
  CANCELLED: 'default',
}

const WB_STATUS_LABELS: Record<WbApiEventStatus, string> = {
  CREATED: 'Создано',
  RUNNING: 'Выполняется',
  SUCCESS: 'Успешно',
  FAILED_RETRYABLE: 'Ошибка (retry)',
  FAILED_FINAL: 'Ошибка (финальная)',
  FAILED_WITH_FALLBACK: 'Успех с fallback',
  DEFERRED_RATE_LIMIT: 'Отложено (лимит)',
  CANCELLED: 'Отменено',
}

const OZON_STATUS_COLORS: Record<OzonApiEventStatus, string> = {
  CREATED: 'blue',
  RUNNING: 'processing',
  SUCCESS: 'green',
  FAILED_RETRYABLE: 'orange',
  FAILED_FINAL: 'red',
  DEFERRED_RATE_LIMIT: 'purple',
  CANCELLED: 'default',
}

const OZON_STATUS_LABELS: Record<OzonApiEventStatus, string> = {
  CREATED: 'Создано',
  RUNNING: 'Выполняется',
  SUCCESS: 'Успешно',
  FAILED_RETRYABLE: 'Ошибка (retry)',
  FAILED_FINAL: 'Ошибка (финальная)',
  DEFERRED_RATE_LIMIT: 'Отложено (лимит)',
  CANCELLED: 'Отменено',
}

function getStatusColor(marketplace: Marketplace, status: string): string {
  if (marketplace === 'OZON') {
    return OZON_STATUS_COLORS[status as OzonApiEventStatus] ?? 'default'
  }
  return WB_STATUS_COLORS[status as WbApiEventStatus] ?? 'default'
}

function getStatusLabel(marketplace: Marketplace, status: string): string {
  if (marketplace === 'OZON') {
    return OZON_STATUS_LABELS[status as OzonApiEventStatus] ?? status
  }
  return WB_STATUS_LABELS[status as WbApiEventStatus] ?? status
}

function renderStatusLabel(label: string) {
  const parenIdx = label.indexOf(' (')
  if (parenIdx >= 0) {
    return (
      <>
        {label.slice(0, parenIdx)}
        <br />
        {label.slice(parenIdx + 1)}
      </>
    )
  }
  const withIdx = label.indexOf(' с ')
  if (withIdx >= 0) {
    return (
      <>
        {label.slice(0, withIdx)}
        <br />
        {label.slice(withIdx + 1)}
      </>
    )
  }
  return label
}

function StatusTag({ marketplace, status }: { marketplace: Marketplace; status: string }) {
  return (
    <Tag
      color={getStatusColor(marketplace, status)}
      style={{ whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.2, margin: 0 }}
    >
      {renderStatusLabel(getStatusLabel(marketplace, status))}
    </Tag>
  )
}

const WB_TYPE_LABELS: Record<WbApiEventType, string> = {
  CONTENT_CARDS_LIST_PAGE: 'Контент: страница карточек',
  ANALYTICS_SALES_FUNNEL_NMID: 'Аналитика: воронка по nmID',
  PRICES_CABINET_WITH_SPP: 'Цены + СПП (кабинет)',
  PROMOTION_COUNT: 'Промо: count кампаний',
  PROMOTION_ADVERTS_BATCH: 'Промо: батч adverts v2',
  PROMOTION_STATS_BATCH: 'Промо: батч full stats',
  PROMOTION_NORMQUERY_STATS_BATCH: 'Промо: батч normquery (кластеры)',
  PROMOTION_CAMPAIGN_START: 'Промо: запуск РК',
  PROMOTION_CAMPAIGN_PAUSE: 'Промо: пауза РК',
  ANALYTICS_ITEM_RATING_CABINET: 'Рейтинг: кабинет',
  PROMOTION_CALENDAR_SYNC_CABINET: 'Календарь акций: кабинет',
  WAREHOUSES_SYNC_CABINET: 'Склады WB: кабинет',
  STOCKS_BY_NMID: 'Остатки: nmID',
  FBS_WAREHOUSES_SYNC_CABINET: 'Склады продавца FBS: кабинет',
  FBS_STOCKS_CABINET: 'Остатки FBS: кабинет',
}

const OZON_TYPE_LABELS: Record<OzonApiEventType, string> = {
  PRODUCT_LIST_PAGE: 'Каталог: страница товаров',
  PRICES_CABINET: 'Цены (кабинет)',
  STOCKS_CABINET: 'Остатки (кабинет)',
  ANALYTICS_DATA_CABINET: 'Аналитика продаж (кабинет)',
  CAMPAIGNS_CABINET: 'Реклама: список РК (Performance)',
}

function getTypeLabel(marketplace: Marketplace, eventType: string): string {
  if (marketplace === 'OZON') {
    return OZON_TYPE_LABELS[eventType as OzonApiEventType] ?? eventType
  }
  return WB_TYPE_LABELS[eventType as WbApiEventType] ?? eventType
}

const WB_TYPE_COLORS: Record<WbApiEventType, string> = {
  CONTENT_CARDS_LIST_PAGE: 'geekblue',
  ANALYTICS_SALES_FUNNEL_NMID: 'cyan',
  PRICES_CABINET_WITH_SPP: 'gold',
  PROMOTION_COUNT: 'orange',
  PROMOTION_ADVERTS_BATCH: 'volcano',
  PROMOTION_STATS_BATCH: 'red',
  PROMOTION_NORMQUERY_STATS_BATCH: 'volcano',
  PROMOTION_CAMPAIGN_START: 'green',
  PROMOTION_CAMPAIGN_PAUSE: 'default',
  ANALYTICS_ITEM_RATING_CABINET: 'purple',
  PROMOTION_CALENDAR_SYNC_CABINET: 'magenta',
  WAREHOUSES_SYNC_CABINET: 'lime',
  STOCKS_BY_NMID: 'blue',
  FBS_WAREHOUSES_SYNC_CABINET: 'green',
  FBS_STOCKS_CABINET: 'cyan',
}

const OZON_TYPE_COLORS: Record<OzonApiEventType, string> = {
  PRODUCT_LIST_PAGE: 'geekblue',
  PRICES_CABINET: 'gold',
  STOCKS_CABINET: 'blue',
  ANALYTICS_DATA_CABINET: 'cyan',
  CAMPAIGNS_CABINET: 'purple',
}

function getTypeColor(marketplace: Marketplace, eventType: string): string {
  if (marketplace === 'OZON') {
    return OZON_TYPE_COLORS[eventType as OzonApiEventType] ?? 'default'
  }
  return WB_TYPE_COLORS[eventType as WbApiEventType] ?? 'default'
}

const COLUMN_SORT_FIELDS = {
  id: 'ID',
  eventType: 'EVENT_TYPE',
  status: 'STATUS',
  cabinetId: 'CABINET_ID',
  /** Колонка «Попытки» с key: attempts, без dataIndex */
  attempts: 'ATTEMPT_COUNT',
  attemptCount: 'ATTEMPT_COUNT',
  maxAttempts: 'MAX_ATTEMPTS',
  startedAt: 'STARTED_AT',
  nextAttemptAt: 'NEXT_ATTEMPT_AT',
  createdAt: 'CREATED_AT',
  finishedAt: 'FINISHED_AT',
} as const satisfies Record<string, ApiEventSortField>
function formatCabinetLabel(cabinetId: number, cabinetName?: string | null): string {
  if (cabinetName) {
    return `${cabinetId} (${cabinetName})`
  }
  return String(cabinetId)
}

const MOBILE_SORT_OPTIONS: { value: ApiEventSortField; label: string }[] = [
  { value: 'ID', label: 'ID' },
  { value: 'EVENT_TYPE', label: 'Тип события' },
  { value: 'STATUS', label: 'Статус' },
  { value: 'CABINET_ID', label: 'Кабинет' },
  { value: 'ATTEMPT_COUNT', label: 'Попытки' },
  { value: 'STARTED_AT', label: 'Начало выполнения' },
  { value: 'NEXT_ATTEMPT_AT', label: 'Следующая попытка' },
  { value: 'CREATED_AT', label: 'Создано' },
  { value: 'FINISHED_AT', label: 'Завершено' },
]

type SortableColumnKey = keyof typeof COLUMN_SORT_FIELDS
const GROUP_BY_TYPE_STORAGE_KEY = 'admin_api_events_group_by_type'
const GROUP_BY_CABINET_STORAGE_KEY = 'admin_api_events_group_by_cabinet'
const MARKETPLACE_STORAGE_KEY = 'admin_api_events_marketplace'
const { useBreakpoint } = Grid

export default function AdminWbEvents() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)

  const [marketplace, setMarketplace] = useState<Marketplace>(() => {
    const raw = localStorage.getItem(MARKETPLACE_STORAGE_KEY)
    return raw === 'OZON' ? 'OZON' : 'WB'
  })
  const isOzon = marketplace === 'OZON'

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(50)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [eventType, setEventType] = useState<string | undefined>(undefined)
  const [cabinetIdInput, setCabinetIdInput] = useState('')
  const [groupByType, setGroupByType] = useState<boolean>(() => {
    const raw = localStorage.getItem(GROUP_BY_TYPE_STORAGE_KEY)
    return raw == null ? true : raw === 'true'
  })
  const [groupByCabinet, setGroupByCabinet] = useState<boolean>(() => {
    const raw = localStorage.getItem(GROUP_BY_CABINET_STORAGE_KEY)
    return raw == null ? false : raw === 'true'
  })
  const [sortBy, setSortBy] = useState<ApiEventSortField>('ID')
  const [sortDir, setSortDir] = useState<SortDirection>('DESC')
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const screens = useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => {
    localStorage.setItem(MARKETPLACE_STORAGE_KEY, marketplace)
  }, [marketplace])
  useEffect(() => {
    localStorage.setItem(GROUP_BY_TYPE_STORAGE_KEY, String(groupByType))
  }, [groupByType])
  useEffect(() => {
    localStorage.setItem(GROUP_BY_CABINET_STORAGE_KEY, String(groupByCabinet))
  }, [groupByCabinet])

  if (role !== 'ADMIN') {
    navigate('/profile', { replace: true })
    return null
  }

  const cabinetId = useMemo(() => {
    const parsed = Number(cabinetIdInput)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [cabinetIdInput])

  const eventsQueryKey = isOzon ? 'adminOzonEvents' : 'adminWbEvents'
  const eventsStatsQueryKey = isOzon ? 'adminOzonEventsStats' : 'adminWbEventsStats'
  const eventsTypeStatsQueryKey = isOzon ? 'adminOzonEventsTypeStats' : 'adminWbEventsTypeStats'
  const eventsCabinetStatsQueryKey = isOzon ? 'adminOzonEventsCabinetStats' : 'adminWbEventsCabinetStats'
  const eventDetailQueryKey = isOzon ? 'adminOzonEvent' : 'adminWbEvent'

  const { data, isLoading } = useQuery<PageResponse<ApiEventDto>>({
    queryKey: [eventsQueryKey, page, size, status, eventType, cabinetId, sortBy, sortDir],
    queryFn: async () =>
      isOzon
        ? adminApi.getOzonEvents({
            page,
            size,
            status: status as OzonApiEventStatus | undefined,
            eventType: eventType as OzonApiEventType | undefined,
            cabinetId,
            sortBy: sortBy as OzonApiEventSortField,
            sortDir,
          })
        : adminApi.getWbEvents({
            page,
            size,
            status: status as WbApiEventStatus | undefined,
            eventType: eventType as WbApiEventType | undefined,
            cabinetId,
            sortBy: sortBy as WbApiEventSortField,
            sortDir,
          }),
    refetchInterval: 5000,
  })
  const { data: stats } = useQuery<ApiEventStatsDto>({
    queryKey: [eventsStatsQueryKey],
    queryFn: async () => (isOzon ? adminApi.getOzonEventsStats() : adminApi.getWbEventsStats()),
    refetchInterval: 5000,
  })
  const { data: typeStats } = useQuery<ApiEventTypeStatsDto>({
    queryKey: [eventsTypeStatsQueryKey, status],
    queryFn: async () =>
      isOzon
        ? adminApi.getOzonEventsStatsByType(status as OzonApiEventStatus | undefined)
        : adminApi.getWbEventsStatsByType(status as WbApiEventStatus | undefined),
    enabled: groupByType,
    refetchInterval: 5000,
  })
  const { data: cabinetStats } = useQuery<ApiEventCabinetStatsDto>({
    queryKey: [eventsCabinetStatsQueryKey, status, eventType],
    queryFn: async () =>
      isOzon
        ? adminApi.getOzonEventsStatsByCabinet(status as OzonApiEventStatus | undefined, eventType as OzonApiEventType | undefined)
        : adminApi.getWbEventsStatsByCabinet(status as WbApiEventStatus | undefined, eventType as WbApiEventType | undefined),
    enabled: groupByCabinet,
    refetchInterval: 5000,
  })
  const failedFinalCount = stats?.byStatus?.FAILED_FINAL ?? 0

  const { data: selectedEvent, isLoading: selectedLoading } = useQuery<ApiEventDto>({
    queryKey: [eventDetailQueryKey, selectedEventId],
    queryFn: async () => (isOzon ? adminApi.getOzonEvent(selectedEventId!) : adminApi.getWbEvent(selectedEventId!)),
    enabled: selectedEventId != null,
  })

  const invalidateEvents = () => {
    queryClient.invalidateQueries({ queryKey: [eventsQueryKey] })
    queryClient.invalidateQueries({ queryKey: [eventsStatsQueryKey] })
    queryClient.invalidateQueries({ queryKey: [eventDetailQueryKey, selectedEventId] })
  }

  const retryMutation = useMutation({
    mutationFn: (eventId: number) => (isOzon ? adminApi.retryOzonEvent(eventId) : adminApi.retryWbEvent(eventId)),
    onSuccess: () => {
      message.success('Событие отправлено на повторное выполнение')
      invalidateEvents()
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'Ошибка retry'),
  })

  const retryAllFailedFinalMutation = useMutation({
    mutationFn: () => (isOzon ? adminApi.retryAllFailedFinalOzonEvents() : adminApi.retryAllFailedFinalWbEvents()),
    onSuccess: (result) => {
      message.success(`${result.message}. Кол-во: ${result.updatedCount}`)
      invalidateEvents()
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'Ошибка массового retry'),
  })

  const cancelMutation = useMutation({
    mutationFn: (eventId: number) => (isOzon ? adminApi.cancelOzonEvent(eventId) : adminApi.cancelWbEvent(eventId)),
    onSuccess: () => {
      message.success('Событие отменено')
      invalidateEvents()
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'Ошибка отмены'),
  })

  const statusOptions = isOzon
    ? (Object.keys(OZON_STATUS_LABELS) as OzonApiEventStatus[])
    : (Object.keys(WB_STATUS_LABELS) as WbApiEventStatus[])

  const typeOptions: { value: string; label: string }[] = isOzon
    ? (Object.keys(OZON_TYPE_LABELS) as OzonApiEventType[]).map((t) => ({ value: t, label: OZON_TYPE_LABELS[t] }))
    : (Object.keys(WB_TYPE_LABELS) as WbApiEventType[]).map((t) => ({ value: t, label: WB_TYPE_LABELS[t] }))

  const handleMarketplaceChange = (value: Marketplace) => {
    setMarketplace(value)
    setPage(0)
    setStatus(undefined)
    setEventType(undefined)
    setSelectedEventId(null)
  }

  const columns: ColumnsType<ApiEventDto> = [
    { title: 'ID', dataIndex: 'id', width: 90, sorter: true, sortOrder: sortBy === 'ID' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null },
    {
      title: 'Тип',
      dataIndex: 'eventType',
      width: 250,
      sorter: true,
      sortOrder: sortBy === 'EVENT_TYPE' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
      render: (value: string) => getTypeLabel(marketplace, value),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 105,
      sorter: true,
      sortOrder: sortBy === 'STATUS' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
      render: (value: string) => <StatusTag marketplace={marketplace} status={value} />,
    },
    {
      title: 'Кабинет',
      dataIndex: 'cabinetId',
      width: 260,
      sorter: true,
      sortOrder: sortBy === 'CABINET_ID' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
      render: (_: number, row) => formatCabinetLabel(row.cabinetId, row.cabinetName),
    },
    {
      title: 'Попытки',
      key: 'attempts',
      width: 80,
      sorter: true,
      sortOrder: sortBy === 'ATTEMPT_COUNT' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
      render: (_, row) => `${row.attemptCount}/${row.maxAttempts}`,
    },
    {
      title: 'Создано',
      dataIndex: 'createdAt',
      width: 180,
      sorter: true,
      sortOrder: sortBy === 'CREATED_AT' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
      render: (v: string) => dayjs(v).format('DD.MM HH:mm:ss'),
    },
    {
      title: 'Начало выполнения',
      dataIndex: 'startedAt',
      width: 190,
      sorter: true,
      sortOrder: sortBy === 'STARTED_AT' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM HH:mm:ss') : '—'),
    },
    {
      title: 'Следующая попытка',
      dataIndex: 'nextAttemptAt',
      width: 180,
      sorter: true,
      sortOrder: sortBy === 'NEXT_ATTEMPT_AT' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
      render: (v: string) => dayjs(v).format('DD.MM HH:mm:ss'),
    },
    {
      title: 'Завершено',
      dataIndex: 'finishedAt',
      width: 180,
      sorter: true,
      sortOrder: sortBy === 'FINISHED_AT' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM HH:mm:ss') : '—'),
    },
    {
      title: (
        <Space size={6}>
          <span>Действия</span>
          <Tooltip
            title={
              failedFinalCount > 0
                ? `Повтор всех финальных ошибок (${failedFinalCount})`
                : 'Нет событий в статусе "Ошибка (финальная)"'
            }
          >
            <Button
              type="default"
              size="small"
              icon={<SyncOutlined />}
              onClick={() => retryAllFailedFinalMutation.mutate()}
              loading={retryAllFailedFinalMutation.isPending}
              disabled={failedFinalCount === 0 || retryAllFailedFinalMutation.isPending}
            />
          </Tooltip>
        </Space>
      ),
      key: 'actions',
      width: 220,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => setSelectedEventId(row.id)}>Детали</Button>
          <Button size="small" onClick={() => retryMutation.mutate(row.id)} loading={retryMutation.isPending}>Retry</Button>
          <Button size="small" danger onClick={() => cancelMutation.mutate(row.id)} loading={cancelMutation.isPending}>Cancel</Button>
        </Space>
      ),
    },
  ]

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<ApiEventDto> | SorterResult<ApiEventDto>[],
    _extra: TableCurrentDataSource<ApiEventDto>
  ) => {
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter
    const columnKey = (singleSorter?.field ?? singleSorter?.columnKey) as SortableColumnKey | undefined
    const nextOrder = singleSorter?.order

    if (columnKey && nextOrder && COLUMN_SORT_FIELDS[columnKey]) {
      setSortBy(COLUMN_SORT_FIELDS[columnKey])
      setSortDir(nextOrder === 'ascend' ? 'ASC' : 'DESC')
    } else {
      setSortBy('ID')
      setSortDir('DESC')
    }

    setPage((pagination.current ?? 1) - 1)
    setSize(pagination.pageSize ?? size)
  }

  const renderRowActions = (row: ApiEventDto) => (
    <Space wrap>
      <Button size="small" onClick={() => setSelectedEventId(row.id)}>Детали</Button>
      <Button size="small" onClick={() => retryMutation.mutate(row.id)} loading={retryMutation.isPending}>Повтор</Button>
      <Button size="small" danger onClick={() => cancelMutation.mutate(row.id)} loading={cancelMutation.isPending}>Отменить</Button>
    </Space>
  )

  return (
    <>
      <Header />
      <Breadcrumbs />
      <div style={{ width: '100%', padding: isMobile ? 12 : 24, minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1400 }}>
          <div style={{ marginTop: 16, marginBottom: isMobile ? 16 : 24, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <Typography.Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
              Администрирование. API события
            </Typography.Title>
            <Segmented
              value={marketplace}
              onChange={(value) => handleMarketplaceChange(value as Marketplace)}
              options={[
                { label: 'WB', value: 'WB' },
                { label: 'Ozon', value: 'OZON' },
              ]}
            />
          </div>

          <Card>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <Space wrap>
                <Tag
                  color="blue"
                  style={{
                    cursor: 'pointer',
                    fontWeight: status == null ? 600 : undefined,
                    boxShadow: status == null ? '0 0 0 1px rgba(0,0,0,0.15) inset' : undefined,
                  }}
                  onClick={() => {
                    setPage(0)
                    setStatus(undefined)
                  }}
                >
                  Всего: {stats?.total ?? 0}
                </Tag>
                {statusOptions.map((s) => (
                  <Tag
                    key={s}
                    color={getStatusColor(marketplace, s)}
                    style={{
                      cursor: 'pointer',
                      fontWeight: status === s ? 600 : undefined,
                      boxShadow: status === s ? '0 0 0 1px rgba(0,0,0,0.15) inset' : undefined,
                    }}
                    onClick={() => {
                      setPage(0)
                      setStatus((prev) => (prev === s ? undefined : s))
                    }}
                  >
                    {getStatusLabel(marketplace, s)}: {stats?.byStatus[s] ?? 0}
                  </Tag>
                ))}
              </Space>
              <Space direction="vertical" size={4} style={{ alignItems: 'flex-start' }}>
                <Checkbox checked={groupByType} onChange={(e) => setGroupByType(e.target.checked)}>
                  Группировать по типу
                </Checkbox>
                <Checkbox checked={groupByCabinet} onChange={(e) => setGroupByCabinet(e.target.checked)}>
                  Группировать по кабинетам
                </Checkbox>
              </Space>
            </div>
            {groupByType && (
              <div style={{ marginTop: 8, marginBottom: 12 }}>
                <Space wrap>
                {(isOzon ? (Object.keys(OZON_TYPE_LABELS) as OzonApiEventType[]) : (Object.keys(WB_TYPE_LABELS) as WbApiEventType[]))
                  .filter((t) => (typeStats?.byType[t] ?? 0) > 0)
                  .map((t) => (
                    <Tag
                      key={t}
                      color={getTypeColor(marketplace, t)}
                      style={{
                        cursor: 'pointer',
                        fontWeight: eventType === t ? 600 : undefined,
                        boxShadow: eventType === t ? '0 0 0 1px rgba(0,0,0,0.15) inset' : undefined,
                      }}
                      onClick={() => {
                        setPage(0)
                        setEventType((prev) => (prev === t ? undefined : t))
                      }}
                    >
                      {getTypeLabel(marketplace, t)}: {typeStats?.byType[t] ?? 0}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
            {groupByCabinet && (
              <div style={{ marginTop: 8, marginBottom: 12 }}>
                <Space wrap>
                {(cabinetStats?.byCabinet ?? [])
                  .filter((item) => (item.count ?? 0) > 0)
                  .sort((a, b) => b.count - a.count)
                  .map((item) => {
                    const cabId = String(item.cabinetId)
                    const active = String(cabinetId ?? '') === cabId
                    return (
                      <Tag
                        key={cabId}
                        color="geekblue"
                        style={{
                          cursor: 'pointer',
                          fontWeight: active ? 600 : undefined,
                          boxShadow: active ? '0 0 0 1px rgba(0,0,0,0.15) inset' : undefined,
                        }}
                        onClick={() => {
                          setPage(0)
                          setCabinetIdInput((prev) => (prev === cabId ? '' : cabId))
                        }}
                      >
                        {cabId} ({item.cabinetName || 'без названия'}): {item.count}
                      </Tag>
                    )
                  })}
                </Space>
              </div>
            )}
            <Space wrap style={{ marginBottom: 16 }}>
              <Select
                allowClear
                placeholder="Статус"
                style={{ width: isMobile ? '100%' : 220 }}
                value={status}
                onChange={(value) => {
                  setPage(0)
                  setStatus(value)
                }}
                options={statusOptions.map((s) => ({ value: s, label: getStatusLabel(marketplace, s) }))}
              />
              <Select
                allowClear
                placeholder="Тип события"
                style={{ width: isMobile ? '100%' : 260 }}
                value={eventType}
                onChange={(value) => { setPage(0); setEventType(value) }}
                options={typeOptions}
              />
              <Input
                placeholder="Cabinet ID"
                style={{ width: isMobile ? '100%' : 160 }}
                value={cabinetIdInput}
                onChange={(e) => setCabinetIdInput(e.target.value)}
                onPressEnter={() => setPage(0)}
              />
              <Button style={{ width: isMobile ? '100%' : undefined }} onClick={() => { setPage(0); queryClient.invalidateQueries({ queryKey: [eventsQueryKey] }) }}>
                Применить
              </Button>
            </Space>
            {isMobile && (
              <Space wrap style={{ marginBottom: 16, width: '100%' }}>
                <Select
                  placeholder="Сортировка"
                  style={{ width: '100%' }}
                  value={sortBy}
                  onChange={(value) => {
                    setPage(0)
                    setSortBy(value)
                  }}
                  options={MOBILE_SORT_OPTIONS}
                />
                <Select
                  placeholder="Направление"
                  style={{ width: '100%' }}
                  value={sortDir}
                  onChange={(value) => {
                    setPage(0)
                    setSortDir(value)
                  }}
                  options={[
                    { value: 'DESC', label: 'По убыванию' },
                    { value: 'ASC', label: 'По возрастанию' },
                  ]}
                />
              </Space>
            )}

            {isMobile ? (
              <>
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {(data?.content ?? []).map((row) => (
                    <Card key={row.id} size="small" bodyStyle={{ padding: 12 }}>
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <Space wrap size={[6, 6]}>
                          <Tag color="blue">#{row.id}</Tag>
                          <Tag color={getTypeColor(marketplace, row.eventType)}>{getTypeLabel(marketplace, row.eventType)}</Tag>
                          <StatusTag marketplace={marketplace} status={row.status} />
                        </Space>
                        <Typography.Text type="secondary">
                          Кабинет: {formatCabinetLabel(row.cabinetId, row.cabinetName)} · Попытки: {row.attemptCount}/{row.maxAttempts}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          Создано: {dayjs(row.createdAt).format('DD.MM HH:mm:ss')}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          Следующая: {dayjs(row.nextAttemptAt).format('DD.MM HH:mm:ss')}
                        </Typography.Text>
                        {renderRowActions(row)}
                      </Space>
                    </Card>
                  ))}
                </Space>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    size="small"
                    current={(data?.number ?? 0) + 1}
                    pageSize={data?.size ?? size}
                    total={data?.totalElements ?? 0}
                    showSizeChanger={false}
                    onChange={(current) => setPage(current - 1)}
                  />
                </div>
              </>
            ) : (
              <Table<ApiEventDto>
                rowKey="id"
                loading={isLoading}
                columns={columns.map((c) => (c.key === 'actions' ? { ...c, render: (_, row) => renderRowActions(row) } : c))}
                dataSource={data?.content ?? []}
                onChange={handleTableChange}
                /** По умолчанию в antd ['ascend','descend']: при активном DESC следующий клик — «отмена», а не ASC. У нас дефолт ID DESC. */
                sortDirections={['descend', 'ascend']}
                pagination={{
                  current: (data?.number ?? 0) + 1,
                  pageSize: data?.size ?? size,
                  total: data?.totalElements ?? 0,
                  showSizeChanger: true,
                  pageSizeOptions: [20, 50, 100],
                  locale: { items_per_page: '/ стр.' },
                  onChange: (current, pageSize) => {
                    setPage(current - 1)
                    setSize(pageSize)
                  },
                }}
                scroll={{ x: 1300 }}
              />
            )}
          </Card>
        </div>
      </div>

      <Drawer
        title={selectedEventId ? `Событие #${selectedEventId}` : 'Событие'}
        open={selectedEventId != null}
        onClose={() => setSelectedEventId(null)}
        width={isMobile ? '100%' : 720}
      >
        {selectedLoading || !selectedEvent ? (
          <Typography.Text>Загрузка...</Typography.Text>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Typography.Text><b>Тип:</b> {selectedEvent.eventType}</Typography.Text>
            <Typography.Text><b>Тип (читаемо):</b> {getTypeLabel(marketplace, selectedEvent.eventType)}</Typography.Text>
            <Typography.Text><b>Статус:</b> {selectedEvent.status}</Typography.Text>
            <Typography.Text><b>Статус (читаемо):</b> {getStatusLabel(marketplace, selectedEvent.status)}</Typography.Text>
            <Typography.Text><b>Исполнитель:</b> {selectedEvent.executorBeanName}</Typography.Text>
            <Typography.Text><b>Кабинет:</b> {formatCabinetLabel(selectedEvent.cabinetId, selectedEvent.cabinetName)}</Typography.Text>
            <Typography.Text><b>Ключ дедупликации:</b> {selectedEvent.dedupKey}</Typography.Text>
            <Typography.Text><b>Попытки:</b> {selectedEvent.attemptCount}/{selectedEvent.maxAttempts}</Typography.Text>
            <Typography.Text><b>Приоритет:</b> {selectedEvent.priority}</Typography.Text>
            <Typography.Text><b>Источник:</b> {selectedEvent.triggerSource}</Typography.Text>
            <Typography.Text><b>Создано:</b> {dayjs(selectedEvent.createdAt).format('DD.MM.YYYY HH:mm:ss')}</Typography.Text>
            <Typography.Text><b>Начато:</b> {selectedEvent.startedAt ? dayjs(selectedEvent.startedAt).format('DD.MM.YYYY HH:mm:ss') : '—'}</Typography.Text>
            <Typography.Text><b>Завершено:</b> {selectedEvent.finishedAt ? dayjs(selectedEvent.finishedAt).format('DD.MM.YYYY HH:mm:ss') : '—'}</Typography.Text>
            <Typography.Text><b>Следующая попытка:</b> {dayjs(selectedEvent.nextAttemptAt).format('DD.MM.YYYY HH:mm:ss')}</Typography.Text>
            <Typography.Paragraph copyable={{ text: selectedEvent.lastError ?? '' }}>
              <b>Последняя ошибка:</b> {selectedEvent.lastError ?? '—'}
            </Typography.Paragraph>
          </Space>
        )}
      </Drawer>
    </>
  )
}
