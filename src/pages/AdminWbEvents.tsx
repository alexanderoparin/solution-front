import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Checkbox, Drawer, Input, Select, Space, Table, Tag, Tooltip, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FilterValue, SorterResult, TableCurrentDataSource, TablePaginationConfig } from 'antd/es/table/interface'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SyncOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { adminApi } from '../api/admin'
import type { SortDirection, WbApiEventDto, WbApiEventSortField, WbApiEventStatus, WbApiEventType } from '../types/api'

const STATUS_COLORS: Record<WbApiEventStatus, string> = {
  CREATED: 'blue',
  RUNNING: 'processing',
  SUCCESS: 'green',
  FAILED_RETRYABLE: 'orange',
  FAILED_FINAL: 'red',
  FAILED_WITH_FALLBACK: 'gold',
  DEFERRED_RATE_LIMIT: 'purple',
  CANCELLED: 'default',
}

const STATUS_LABELS: Record<WbApiEventStatus, string> = {
  CREATED: 'Создано',
  RUNNING: 'Выполняется',
  SUCCESS: 'Успешно',
  FAILED_RETRYABLE: 'Ошибка (retry)',
  FAILED_FINAL: 'Ошибка (финальная)',
  FAILED_WITH_FALLBACK: 'Успех с fallback',
  DEFERRED_RATE_LIMIT: 'Отложено (лимит)',
  CANCELLED: 'Отменено',
}

const TYPE_LABELS: Record<WbApiEventType, string> = {
  CONTENT_CARDS_LIST_PAGE: 'Контент: страница карточек',
  ANALYTICS_SALES_FUNNEL_NMID: 'Аналитика: воронка по nmID',
  PRICES_CABINET_WITH_SPP: 'Цены + СПП (кабинет)',
  PROMOTION_COUNT: 'Промо: count кампаний',
  PROMOTION_ADVERTS_BATCH: 'Промо: батч adverts v2',
  PROMOTION_STATS_BATCH: 'Промо: батч full stats',
  FEEDBACKS_SYNC_CABINET: 'Отзывы: кабинет',
  PROMOTION_CALENDAR_SYNC_CABINET: 'Календарь акций: кабинет',
  WAREHOUSES_SYNC_CABINET: 'Склады WB: кабинет',
  STOCKS_BY_NMID: 'Остатки: nmID',
}

const TYPE_COLORS: Record<WbApiEventType, string> = {
  CONTENT_CARDS_LIST_PAGE: 'geekblue',
  ANALYTICS_SALES_FUNNEL_NMID: 'cyan',
  PRICES_CABINET_WITH_SPP: 'gold',
  PROMOTION_COUNT: 'orange',
  PROMOTION_ADVERTS_BATCH: 'volcano',
  PROMOTION_STATS_BATCH: 'red',
  FEEDBACKS_SYNC_CABINET: 'purple',
  PROMOTION_CALENDAR_SYNC_CABINET: 'magenta',
  WAREHOUSES_SYNC_CABINET: 'lime',
  STOCKS_BY_NMID: 'blue',
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
} as const satisfies Record<string, WbApiEventSortField>

type SortableColumnKey = keyof typeof COLUMN_SORT_FIELDS
const GROUP_BY_TYPE_STORAGE_KEY = 'admin_wb_events_group_by_type'

export default function AdminWbEvents() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [status, setStatus] = useState<WbApiEventStatus | undefined>(undefined)
  const [eventType, setEventType] = useState<WbApiEventType | undefined>(undefined)
  const [cabinetIdInput, setCabinetIdInput] = useState('')
  const [groupByType, setGroupByType] = useState<boolean>(() => {
    const raw = localStorage.getItem(GROUP_BY_TYPE_STORAGE_KEY)
    return raw == null ? true : raw === 'true'
  })
  const [sortBy, setSortBy] = useState<WbApiEventSortField>('ID')
  const [sortDir, setSortDir] = useState<SortDirection>('DESC')
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)

  useEffect(() => {
    localStorage.setItem(GROUP_BY_TYPE_STORAGE_KEY, String(groupByType))
  }, [groupByType])

  if (role !== 'ADMIN') {
    navigate('/profile', { replace: true })
    return null
  }

  const cabinetId = useMemo(() => {
    const parsed = Number(cabinetIdInput)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [cabinetIdInput])

  const { data, isLoading } = useQuery({
    queryKey: ['adminWbEvents', page, size, status, eventType, cabinetId, sortBy, sortDir],
    queryFn: () => adminApi.getWbEvents({ page, size, status, eventType, cabinetId, sortBy, sortDir }),
    refetchInterval: 5000,
  })
  const { data: stats } = useQuery({
    queryKey: ['adminWbEventsStats'],
    queryFn: () => adminApi.getWbEventsStats(),
    refetchInterval: 5000,
  })
  const { data: typeStats } = useQuery({
    queryKey: ['adminWbEventsTypeStats', status],
    queryFn: () => adminApi.getWbEventsStatsByType(status),
    enabled: groupByType,
    refetchInterval: 5000,
  })
  const failedFinalCount = stats?.byStatus?.FAILED_FINAL ?? 0

  const { data: selectedEvent, isLoading: selectedLoading } = useQuery({
    queryKey: ['adminWbEvent', selectedEventId],
    queryFn: () => adminApi.getWbEvent(selectedEventId!),
    enabled: selectedEventId != null,
  })

  const retryMutation = useMutation({
    mutationFn: (eventId: number) => adminApi.retryWbEvent(eventId),
    onSuccess: () => {
      message.success('Событие отправлено на повторное выполнение')
      queryClient.invalidateQueries({ queryKey: ['adminWbEvents'] })
      queryClient.invalidateQueries({ queryKey: ['adminWbEvent', selectedEventId] })
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'Ошибка retry'),
  })

  const retryAllFailedFinalMutation = useMutation({
    mutationFn: () => adminApi.retryAllFailedFinalWbEvents(),
    onSuccess: (result) => {
      message.success(`${result.message}. Кол-во: ${result.updatedCount}`)
      queryClient.invalidateQueries({ queryKey: ['adminWbEvents'] })
      queryClient.invalidateQueries({ queryKey: ['adminWbEventsStats'] })
      queryClient.invalidateQueries({ queryKey: ['adminWbEvent', selectedEventId] })
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'Ошибка массового retry'),
  })

  const cancelMutation = useMutation({
    mutationFn: (eventId: number) => adminApi.cancelWbEvent(eventId),
    onSuccess: () => {
      message.success('Событие отменено')
      queryClient.invalidateQueries({ queryKey: ['adminWbEvents'] })
      queryClient.invalidateQueries({ queryKey: ['adminWbEvent', selectedEventId] })
    },
    onError: (e: any) => message.error(e.response?.data?.message || 'Ошибка отмены'),
  })

  const columns: ColumnsType<WbApiEventDto> = [
    { title: 'ID', dataIndex: 'id', width: 90, sorter: true, sortOrder: sortBy === 'ID' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null },
    {
      title: 'Тип',
      dataIndex: 'eventType',
      width: 250,
      sorter: true,
      sortOrder: sortBy === 'EVENT_TYPE' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
      render: (value: WbApiEventType) => TYPE_LABELS[value],
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 190,
      sorter: true,
      sortOrder: sortBy === 'STATUS' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
      render: (value: WbApiEventStatus) => <Tag color={STATUS_COLORS[value]}>{STATUS_LABELS[value]}</Tag>,
    },
    { title: 'Кабинет', dataIndex: 'cabinetId', width: 120, sorter: true, sortOrder: sortBy === 'CABINET_ID' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null },
    {
      title: 'Попытки',
      key: 'attempts',
      width: 120,
      sorter: true,
      sortOrder: sortBy === 'ATTEMPT_COUNT' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
      render: (_, row) => `${row.attemptCount}/${row.maxAttempts}`,
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
      title: 'Создано',
      dataIndex: 'createdAt',
      width: 180,
      sorter: true,
      sortOrder: sortBy === 'CREATED_AT' ? (sortDir === 'ASC' ? 'ascend' : 'descend') : null,
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
                ? `Retry всех финальных ошибок (${failedFinalCount})`
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
    sorter: SorterResult<WbApiEventDto> | SorterResult<WbApiEventDto>[],
    _extra: TableCurrentDataSource<WbApiEventDto>
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

  return (
    <>
      <Header />
      <Breadcrumbs />
      <div style={{ width: '100%', padding: 24, minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1400 }}>
          <Typography.Title level={4} style={{ marginTop: 16, marginBottom: 24 }}>
            Администрирование. WB API события
          </Typography.Title>

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
                {(Object.keys(STATUS_LABELS) as WbApiEventStatus[]).map((s) => (
                  <Tag
                    key={s}
                    color={STATUS_COLORS[s]}
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
                    {STATUS_LABELS[s]}: {stats?.byStatus?.[s] ?? 0}
                  </Tag>
                ))}
              </Space>
              <Checkbox checked={groupByType} onChange={(e) => setGroupByType(e.target.checked)}>
                Группировать по типу
              </Checkbox>
            </div>
            {groupByType && (
              <Space wrap style={{ marginTop: 8, marginBottom: 12 }}>
                {(Object.keys(TYPE_LABELS) as WbApiEventType[])
                  .filter((t) => (typeStats?.byType?.[t] ?? 0) > 0)
                  .map((t) => (
                    <Tag
                      key={t}
                      color={TYPE_COLORS[t]}
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
                      {TYPE_LABELS[t]}: {typeStats?.byType?.[t] ?? 0}
                    </Tag>
                  ))}
              </Space>
            )}
            <Space wrap style={{ marginBottom: 16 }}>
              <Select
                allowClear
                placeholder="Статус"
                style={{ width: 220 }}
                value={status}
                onChange={(value) => {
                  setPage(0)
                  setStatus(value)
                }}
                options={(Object.keys(STATUS_COLORS) as WbApiEventStatus[]).map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
              />
              <Select
                allowClear
                placeholder="Тип события"
                style={{ width: 260 }}
                value={eventType}
                onChange={(value) => { setPage(0); setEventType(value) }}
                options={[
                  { value: 'CONTENT_CARDS_LIST_PAGE', label: TYPE_LABELS.CONTENT_CARDS_LIST_PAGE },
                  { value: 'ANALYTICS_SALES_FUNNEL_NMID', label: TYPE_LABELS.ANALYTICS_SALES_FUNNEL_NMID },
                  { value: 'PRICES_CABINET_WITH_SPP', label: TYPE_LABELS.PRICES_CABINET_WITH_SPP },
                  { value: 'PROMOTION_COUNT', label: TYPE_LABELS.PROMOTION_COUNT },
                  { value: 'PROMOTION_ADVERTS_BATCH', label: TYPE_LABELS.PROMOTION_ADVERTS_BATCH },
                  { value: 'PROMOTION_STATS_BATCH', label: TYPE_LABELS.PROMOTION_STATS_BATCH },
                  { value: 'FEEDBACKS_SYNC_CABINET', label: TYPE_LABELS.FEEDBACKS_SYNC_CABINET },
                  { value: 'PROMOTION_CALENDAR_SYNC_CABINET', label: TYPE_LABELS.PROMOTION_CALENDAR_SYNC_CABINET },
                  { value: 'WAREHOUSES_SYNC_CABINET', label: TYPE_LABELS.WAREHOUSES_SYNC_CABINET },
                  { value: 'STOCKS_BY_NMID', label: TYPE_LABELS.STOCKS_BY_NMID },
                ]}
              />
              <Input
                placeholder="Cabinet ID"
                style={{ width: 160 }}
                value={cabinetIdInput}
                onChange={(e) => setCabinetIdInput(e.target.value)}
                onPressEnter={() => setPage(0)}
              />
              <Button onClick={() => { setPage(0); queryClient.invalidateQueries({ queryKey: ['adminWbEvents'] }) }}>
                Применить
              </Button>
            </Space>

            <Table<WbApiEventDto>
              rowKey="id"
              loading={isLoading}
              columns={columns}
              dataSource={data?.content ?? []}
              onChange={handleTableChange}
              /** По умолчанию в antd ['ascend','descend']: при активном DESC следующий клик — «отмена», а не ASC. У нас дефолт ID DESC. */
              sortDirections={['descend', 'ascend']}
              pagination={{
                current: (data?.number ?? 0) + 1,
                pageSize: data?.size ?? size,
                total: data?.totalElements ?? 0,
                onChange: (current, pageSize) => {
                  setPage(current - 1)
                  setSize(pageSize)
                },
              }}
              scroll={{ x: 1300 }}
            />
          </Card>
        </div>
      </div>

      <Drawer
        title={selectedEventId ? `Событие #${selectedEventId}` : 'Событие'}
        open={selectedEventId != null}
        onClose={() => setSelectedEventId(null)}
        width={720}
      >
        {selectedLoading || !selectedEvent ? (
          <Typography.Text>Загрузка...</Typography.Text>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Typography.Text><b>Тип:</b> {selectedEvent.eventType}</Typography.Text>
            <Typography.Text><b>Тип (читаемо):</b> {TYPE_LABELS[selectedEvent.eventType]}</Typography.Text>
            <Typography.Text><b>Статус:</b> {selectedEvent.status}</Typography.Text>
            <Typography.Text><b>Статус (читаемо):</b> {STATUS_LABELS[selectedEvent.status]}</Typography.Text>
            <Typography.Text><b>Executor:</b> {selectedEvent.executorBeanName}</Typography.Text>
            <Typography.Text><b>Кабинет:</b> {selectedEvent.cabinetId}</Typography.Text>
            <Typography.Text><b>Dedup key:</b> {selectedEvent.dedupKey}</Typography.Text>
            <Typography.Text><b>Попытки:</b> {selectedEvent.attemptCount}/{selectedEvent.maxAttempts}</Typography.Text>
            <Typography.Text><b>Priority:</b> {selectedEvent.priority}</Typography.Text>
            <Typography.Text><b>Source:</b> {selectedEvent.triggerSource}</Typography.Text>
            <Typography.Text><b>Created:</b> {dayjs(selectedEvent.createdAt).format('DD.MM.YYYY HH:mm:ss')}</Typography.Text>
            <Typography.Text><b>Started:</b> {selectedEvent.startedAt ? dayjs(selectedEvent.startedAt).format('DD.MM.YYYY HH:mm:ss') : '—'}</Typography.Text>
            <Typography.Text><b>Finished:</b> {selectedEvent.finishedAt ? dayjs(selectedEvent.finishedAt).format('DD.MM.YYYY HH:mm:ss') : '—'}</Typography.Text>
            <Typography.Text><b>Next attempt:</b> {dayjs(selectedEvent.nextAttemptAt).format('DD.MM.YYYY HH:mm:ss')}</Typography.Text>
            <Typography.Paragraph copyable={{ text: selectedEvent.lastError ?? '' }}>
              <b>Last error:</b> {selectedEvent.lastError ?? '—'}
            </Typography.Paragraph>
          </Space>
        )}
      </Drawer>
    </>
  )
}
