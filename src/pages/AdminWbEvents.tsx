import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Drawer, Input, Select, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { adminApi } from '../api/admin'
import type { WbApiEventDto, WbApiEventStatus, WbApiEventType } from '../types/api'

const STATUS_COLORS: Record<WbApiEventStatus, string> = {
  CREATED: 'blue',
  RUNNING: 'processing',
  SUCCESS: 'green',
  FAILED_RETRYABLE: 'orange',
  FAILED_FINAL: 'red',
  FAILED_WITH_FALLBACK: 'gold',
  DEFERRED_RATE_LIMIT: 'purple',
  DUPLICATE_SKIPPED: 'default',
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
  DUPLICATE_SKIPPED: 'Дубликат пропущен',
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

export default function AdminWbEvents() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [status, setStatus] = useState<WbApiEventStatus | undefined>(undefined)
  const [eventType, setEventType] = useState<WbApiEventType | undefined>(undefined)
  const [cabinetIdInput, setCabinetIdInput] = useState('')
  const [onlyErrors, setOnlyErrors] = useState(false)
  const [inProgress, setInProgress] = useState(false)
  const [deferredOnly, setDeferredOnly] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)

  if (role !== 'ADMIN') {
    navigate('/profile', { replace: true })
    return null
  }

  const cabinetId = useMemo(() => {
    const parsed = Number(cabinetIdInput)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [cabinetIdInput])

  const effectiveStatus = useMemo(() => {
    if (inProgress) return 'RUNNING' as WbApiEventStatus
    if (onlyErrors) return 'FAILED_FINAL' as WbApiEventStatus
    if (deferredOnly) return 'DEFERRED_RATE_LIMIT' as WbApiEventStatus
    return status
  }, [inProgress, onlyErrors, deferredOnly, status])

  const { data, isLoading } = useQuery({
    queryKey: ['adminWbEvents', page, size, effectiveStatus, eventType, cabinetId],
    queryFn: () => adminApi.getWbEvents({ page, size, status: effectiveStatus, eventType, cabinetId }),
    refetchInterval: 5000,
  })
  const { data: stats } = useQuery({
    queryKey: ['adminWbEventsStats'],
    queryFn: () => adminApi.getWbEventsStats(),
    refetchInterval: 5000,
  })

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
    { title: 'ID', dataIndex: 'id', width: 90 },
    {
      title: 'Тип',
      dataIndex: 'eventType',
      width: 250,
      render: (value: WbApiEventType) => TYPE_LABELS[value],
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      width: 190,
      render: (value: WbApiEventStatus) => <Tag color={STATUS_COLORS[value]}>{STATUS_LABELS[value]}</Tag>,
    },
    { title: 'Кабинет', dataIndex: 'cabinetId', width: 120 },
    { title: 'Попытки', key: 'attempts', width: 120, render: (_, row) => `${row.attemptCount}/${row.maxAttempts}` },
    {
      title: 'Начало выполнения',
      dataIndex: 'startedAt',
      width: 190,
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM HH:mm:ss') : '—'),
    },
    { title: 'Следующая попытка', dataIndex: 'nextAttemptAt', width: 180, render: (v: string) => dayjs(v).format('DD.MM HH:mm:ss') },
    { title: 'Создано', dataIndex: 'createdAt', width: 180, render: (v: string) => dayjs(v).format('DD.MM HH:mm:ss') },
    {
      title: 'Действия',
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
            <Space wrap style={{ marginBottom: 12 }}>
              <Tag color="blue">Всего: {stats?.total ?? 0}</Tag>
              {(Object.keys(STATUS_LABELS) as WbApiEventStatus[]).map((s) => (
                <Tag key={s} color={STATUS_COLORS[s]}>
                  {STATUS_LABELS[s]}: {stats?.byStatus?.[s] ?? 0}
                </Tag>
              ))}
            </Space>
            <Space wrap style={{ marginBottom: 16 }}>
              <Select
                allowClear
                placeholder="Статус"
                style={{ width: 220 }}
                value={status}
                onChange={(value) => {
                  setOnlyErrors(false)
                  setInProgress(false)
                  setDeferredOnly(false)
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
              <Button
                type={onlyErrors ? 'primary' : 'default'}
                onClick={() => {
                  setPage(0)
                  setInProgress(false)
                  setDeferredOnly(false)
                  setStatus(undefined)
                  setOnlyErrors((prev) => !prev)
                }}
              >
                Только ошибки
              </Button>
              <Button
                type={inProgress ? 'primary' : 'default'}
                onClick={() => {
                  setPage(0)
                  setOnlyErrors(false)
                  setDeferredOnly(false)
                  setStatus(undefined)
                  setInProgress((prev) => !prev)
                }}
              >
                В работе
              </Button>
              <Button
                type={deferredOnly ? 'primary' : 'default'}
                onClick={() => {
                  setPage(0)
                  setOnlyErrors(false)
                  setInProgress(false)
                  setStatus(undefined)
                  setDeferredOnly((prev) => !prev)
                }}
              >
                Отложенные
              </Button>
            </Space>

            <Table<WbApiEventDto>
              rowKey="id"
              loading={isLoading}
              columns={columns}
              dataSource={data?.content ?? []}
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
