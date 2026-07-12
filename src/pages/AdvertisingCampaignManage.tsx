import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spin, Checkbox, InputNumber, Select, Button, message, Table, Alert, Modal, Switch, Space } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignManageApi, type CampaignAutoBudgetRequest, type CampaignScheduleSlotRequest } from '../api/campaignManage'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
import type { ArticleSummary, CampaignScheduleSlot, CampaignSlotRepeatMode } from '../types/analytics'
import { resolveArticlePhotoUrl } from '../types/analytics'
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useWorkContextForManagerAdmin } from '../hooks/useWorkContextForManagerAdmin'
import { useCampaignManagePaywall } from '../hooks/useCampaignManagePaywall'
import CampaignManagePaywallShield from '../components/campaignManageSubscription/CampaignManagePaywallShield'
import CampaignWeekCalendar, { type SlotCreateRange } from '../components/campaignManage/CampaignWeekCalendar'
import { validateSlotNoOverlap } from '../utils/campaignSlotOverlap'
import CampaignSlotModal, { type SlotModalDraft } from '../components/campaignManage/CampaignSlotModal'
import CampaignBudgetChart from '../components/campaignManage/CampaignBudgetChart'
import CampaignBudgetChartPeriodPicker from '../components/campaignManage/CampaignBudgetChartPeriodPicker'
import { bidderStatusColor, bidderStatusIcon, bidderStatusLabel } from '../utils/bidderStatus'
import {
  defaultBudgetChartPeriod,
  formatBudgetChartPeriodParam,
} from '../utils/budgetChartPeriod'
import dayjs, { type Dayjs } from 'dayjs'

const COMBO_PHOTO_SIZE = 80
const CHANGE_LOG_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
/** Минимальная сумма пополнения бюджета РК на Wildberries, ₽. */
const MIN_AUTO_TOP_UP_AMOUNT_RUB = 1000

function formatControlError(err: unknown): string {
  const ax = err as { response?: { data?: { message?: string; error?: string } } }
  return ax.response?.data?.error || ax.response?.data?.message || 'Не удалось выполнить действие'
}

const cardStyle = {
  backgroundColor: colors.bgWhite,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: borderRadius.md,
  padding: spacing.lg,
  marginBottom: spacing.lg,
  boxShadow: shadows.md,
  transition: transitions.normal,
} as const

export default function AdvertisingCampaignManage() {
  const { id } = useParams<{ id: string }>()
  const advertId = Number(id)
  const queryClient = useQueryClient()
  const role = useAuthStore((s) => s.role)
  const isManagerOrAdmin = role === 'ADMIN' || role === 'MANAGER'
  const workContext = useWorkContextForManagerAdmin(isManagerOrAdmin)
  const selectedSellerId = isManagerOrAdmin ? workContext.selectedSellerId : undefined

  const { data: myCabinets = [] } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'SELLER' || role === 'WORKER',
  })

  const cabinets = useMemo(() => {
    if (isManagerOrAdmin) {
      return workContext.workContextOptions.map((o) => ({ id: o.cabinetId, name: o.cabinetName }))
    }
    return myCabinets
  }, [isManagerOrAdmin, workContext.workContextOptions, myCabinets])

  const [sellerCabinetId, setSellerCabinetId] = useState<number | null>(() => getStoredCabinetId())
  const selectedCabinetId = isManagerOrAdmin ? workContext.selectedCabinetId : sellerCabinetId

  const manageKey = ['campaign-manage', advertId, selectedSellerId, selectedCabinetId] as const

  const { data: manage, isLoading, refetch } = useQuery({
    queryKey: manageKey,
    queryFn: () => campaignManageApi.getManage(advertId, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    enabled: Number.isFinite(advertId) && selectedCabinetId != null,
  })

  const balanceSourcesKey = ['campaign-balance-sources', advertId, selectedCabinetId] as const

  const { data: balanceSources } = useQuery({
    queryKey: balanceSourcesKey,
    queryFn: () =>
      campaignManageApi.getBalanceSources(advertId, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    enabled: Number.isFinite(advertId) && selectedCabinetId != null,
    staleTime: 30 * 60 * 1000,
  })

  const [chartPeriod, setChartPeriod] = useState<[Dayjs, Dayjs]>(() => defaultBudgetChartPeriod())

  useEffect(() => {
    setChartPeriod(defaultBudgetChartPeriod())
  }, [advertId, selectedCabinetId, selectedSellerId])

  const budgetChartKey = [
    'campaign-budget-chart',
    advertId,
    selectedCabinetId,
    chartPeriod[0].valueOf(),
    chartPeriod[1].valueOf(),
  ] as const

  const [changeLogPage, setChangeLogPage] = useState(0)
  const [changeLogPageSize, setChangeLogPageSize] = useState<number>(CHANGE_LOG_PAGE_SIZE_OPTIONS[0])

  useEffect(() => {
    setChangeLogPage(0)
  }, [advertId, selectedCabinetId, selectedSellerId])

  const changeLogKey = [
    'campaign-change-log',
    advertId,
    selectedSellerId,
    selectedCabinetId,
    changeLogPage,
    changeLogPageSize,
  ] as const

  const { data: changeLogData, isLoading: changeLogLoading } = useQuery({
    queryKey: changeLogKey,
    queryFn: () =>
      campaignManageApi.getChangeLog(
        advertId,
        changeLogPage,
        changeLogPageSize,
        selectedSellerId ?? undefined,
        selectedCabinetId ?? undefined,
      ),
    enabled: Number.isFinite(advertId) && selectedCabinetId != null,
  })

  const { data: budgetChart, isLoading: budgetChartLoading } = useQuery({
    queryKey: budgetChartKey,
    queryFn: () =>
      campaignManageApi.getBudgetChart(advertId, selectedSellerId ?? undefined, selectedCabinetId ?? undefined, {
        from: formatBudgetChartPeriodParam(chartPeriod[0]),
        to: formatBudgetChartPeriodParam(chartPeriod[1]),
      }),
    enabled: Number.isFinite(advertId) && selectedCabinetId != null,
    staleTime: 3 * 60 * 1000,
  })

  const refreshBalanceMutation = useMutation({
    mutationFn: () =>
      campaignManageApi.refreshBalanceSources(advertId, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    onSuccess: (result) => {
      if (result.sources) {
        queryClient.setQueryData(balanceSourcesKey, result.sources)
      }
      if (result.refreshed) {
        message.success('Баланс обновлён')
      } else if (result.message) {
        message.warning(result.message)
      }
    },
    onError: (err: unknown) => {
      const ax = err as {
        response?: {
          status?: number
          data?: { message?: string; nextAvailableInSeconds?: number; sources?: { sources: unknown[]; fetchedAt?: string; stale?: boolean } }
        }
      }
      if (ax.response?.status === 429) {
        const body = ax.response.data
        const sec = body?.nextAvailableInSeconds
        message.warning(body?.message ?? (sec ? `Повторите через ${sec} с` : 'Лимит WB'))
        if (body?.sources) {
          queryClient.setQueryData(balanceSourcesKey, body.sources)
        }
        return
      }
      message.error('Не удалось обновить баланс')
    },
  })

  const { data: controlCapabilities } = useQuery({
    queryKey: ['manage-control-capabilities', selectedSellerId, selectedCabinetId],
    queryFn: () =>
      analyticsApi.getPromotionControlCapabilities(selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    enabled: selectedCabinetId != null,
  })

  const [autoEnabled, setAutoEnabled] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null)
  const [sourceType, setSourceType] = useState<number | null>(1)
  const [thresholdRub, setThresholdRub] = useState<number | null>(null)
  const [maxTopUps, setMaxTopUps] = useState<number | null>(null)
  const [autoLocked, setAutoLocked] = useState(false)
  const [manualTopUpOpen, setManualTopUpOpen] = useState(false)
  const [manualTopUpAmount, setManualTopUpAmount] = useState<number | null>(MIN_AUTO_TOP_UP_AMOUNT_RUB)
  const [manualSourceType, setManualSourceType] = useState<number | null>(1)

  useEffect(() => {
    if (!manage?.autoBudget) return
    const a = manage.autoBudget
    setAutoEnabled(a.enabled)
    setTopUpAmount(a.topUpAmount)
    setSourceType(a.sourceType ?? 1)
    setThresholdRub(a.thresholdRub)
    setMaxTopUps(a.maxTopUpsPerDay)
    setAutoLocked(a.locked)
  }, [manage?.autoBudget])

  const [slotModalOpen, setSlotModalOpen] = useState(false)
  const [slotModalTitle, setSlotModalTitle] = useState('Новый слот')
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null)
  const [slotDraft, setSlotDraft] = useState<SlotModalDraft>({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    budgetRub: 1000,
    repeat: false,
    repeatMode: 'DAILY',
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: manageKey })
    queryClient.invalidateQueries({ queryKey: budgetChartKey })
    queryClient.invalidateQueries({ queryKey: ['campaign-change-log', advertId] })
  }

  const saveAutoMutation = useMutation({
    mutationFn: (body: CampaignAutoBudgetRequest) =>
      campaignManageApi.saveAutoBudget(advertId, body, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    onSuccess: () => {
      message.success('Настройки автопополнения сохранены')
      invalidate()
    },
    onError: (e) => message.error(formatControlError(e)),
  })

  const unlockAutoMutation = useMutation({
    mutationFn: () =>
      campaignManageApi.unlockAutoBudget(advertId, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    onSuccess: () => invalidate(),
    onError: (e) => message.error(formatControlError(e)),
  })

  const manualTopUpMutation = useMutation({
    mutationFn: (body: { topUpAmount: number; sourceType: number }) =>
      campaignManageApi.manualTopUp(advertId, body, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    onSuccess: (result) => {
      message.success(result.message || 'Бюджет пополнен')
      setManualTopUpOpen(false)
      invalidate()
      queryClient.invalidateQueries({ queryKey: balanceSourcesKey })
    },
    onError: (e) => message.error(formatControlError(e)),
  })

  const openManualTopUp = useCallback(() => {
    setManualTopUpAmount(topUpAmount ?? MIN_AUTO_TOP_UP_AMOUNT_RUB)
    setManualSourceType(sourceType ?? balanceSources?.sources?.[0]?.type ?? 1)
    setManualTopUpOpen(true)
  }, [topUpAmount, sourceType, balanceSources?.sources])

  const createSlotsMutation = useMutation({
    mutationFn: (body: CampaignScheduleSlotRequest) =>
      campaignManageApi.createSlots(advertId, body, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    onSuccess: () => {
      message.success('Слот добавлен')
      setSlotModalOpen(false)
      invalidate()
    },
    onError: (e) => message.error(formatControlError(e)),
  })

  const updateSlotMutation = useMutation({
    mutationFn: ({ slotId, body }: { slotId: number; body: { startTime?: string; endTime?: string; budgetRub?: number } }) =>
      campaignManageApi.updateSlot(advertId, slotId, body, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    onSuccess: () => invalidate(),
    onError: (e) => message.error(formatControlError(e)),
  })

  const deleteSlotMutation = useMutation({
    mutationFn: ({ slotId, deleteAll }: { slotId: number; deleteAll?: boolean }) =>
      campaignManageApi.deleteSlot(advertId, slotId, {
        deleteAll,
        sellerId: selectedSellerId ?? undefined,
        cabinetId: selectedCabinetId ?? undefined,
      }),
    onSuccess: (_data, variables) => {
      message.success(variables.deleteAll ? 'Расписание удалено' : 'Слот удалён')
      invalidate()
    },
    onError: (e) => message.error(formatControlError(e)),
  })

  const confirmDeleteSlot = useCallback(
    (slotId: number) => {
      const deleteAllRef = { current: false }
      Modal.confirm({
        title: 'Удалить слот?',
        content: (
          <div>
            <p style={{ margin: '0 0 12px' }}>Слот будет удалён из расписания.</p>
            <Checkbox onChange={(event) => { deleteAllRef.current = event.target.checked }}>
              <span style={{ color: colors.error }}>удалить все</span>
            </Checkbox>
          </div>
        ),
        okText: 'Удалить',
        okType: 'danger',
        cancelText: 'Отмена',
        onOk: () => deleteSlotMutation.mutateAsync({ slotId, deleteAll: deleteAllRef.current }),
      })
    },
    [deleteSlotMutation],
  )

  const startMutation = useMutation({
    mutationFn: () => campaignManageApi.start(advertId, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    onSuccess: (r) => {
      message.success(r.message ?? (r.enqueued ? 'Запуск поставлен в очередь' : 'Запуск выполнен'))
      invalidate()
    },
    onError: (e) => message.error(formatControlError(e)),
  })

  const pauseMutation = useMutation({
    mutationFn: () => campaignManageApi.pause(advertId, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    onSuccess: (r) => {
      message.success(r.message ?? (r.enqueued ? 'Пауза поставлена в очередь' : 'Пауза выполнена'))
      invalidate()
    },
    onError: (e) => message.error(formatControlError(e)),
  })

  const { hasCampaignManageAccess } = useCampaignManagePaywall(selectedSellerId)
  const subscriptionBlocked = !hasCampaignManageAccess

  const controlBlocked = controlCapabilities != null && !controlCapabilities.canControl
  const formDisabled = autoLocked || controlBlocked || subscriptionBlocked

  const openCreateFromRange = useCallback((range: SlotCreateRange) => {
    setEditingSlotId(null)
    setSlotModalTitle('Новый слот')
    setSlotDraft({
      dayOfWeek: range.dayOfWeek,
      startTime: range.startTime,
      endTime: range.endTime,
      budgetRub: 1000,
      repeat: false,
      repeatMode: 'DAILY',
    })
    setSlotModalOpen(true)
  }, [])

  const openEditSlot = useCallback((slot: CampaignScheduleSlot) => {
    setEditingSlotId(slot.id)
    setSlotModalTitle('Редактирование слота')
    setSlotDraft({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      budgetRub: slot.budgetRub,
      repeat: false,
      repeatMode: (slot.repeatMode as CampaignSlotRepeatMode) ?? 'DAILY',
    })
    setSlotModalOpen(true)
  }, [])

  const saveSlotDraft = (draft: SlotModalDraft) => {
    const overlapError = validateSlotNoOverlap(
      manage?.slots ?? [],
      draft.dayOfWeek,
      draft.startTime,
      draft.endTime,
      draft.repeat,
      draft.repeatMode,
      editingSlotId ?? undefined,
    )
    if (overlapError) {
      message.warning(overlapError)
      return
    }
    if (editingSlotId != null) {
      updateSlotMutation.mutate({
        slotId: editingSlotId,
        body: {
          startTime: draft.startTime,
          endTime: draft.endTime,
          budgetRub: draft.budgetRub,
        },
      })
      setSlotModalOpen(false)
      return
    }
    createSlotsMutation.mutate({
      dayOfWeek: draft.dayOfWeek,
      startTime: draft.startTime,
      endTime: draft.endTime,
      budgetRub: draft.budgetRub,
      repeat: draft.repeat,
      repeatMode: draft.repeatMode,
    })
  }

  const cabinetSelectProps =
    role === 'SELLER' || role === 'WORKER'
      ? {
          cabinets,
          selectedCabinetId,
          onCabinetChange: (cabinetId: number | null) => {
            setSellerCabinetId(cabinetId)
            if (cabinetId != null) setStoredCabinetId(cabinetId)
          },
        }
      : undefined

  const statusBg = bidderStatusColor(manage?.bidderStatus)
  const statusText = `${bidderStatusIcon(manage?.bidderStatus)}${bidderStatusLabel(manage?.bidderStatus)}`
  const scheduleTogglePending = startMutation.isPending || pauseMutation.isPending

  const historyColumns = [
    {
      title: 'Дата и время',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => (v ? v.replace('T', ' ').slice(0, 16) : '—'),
    },
    { title: 'Пользователь', dataIndex: 'userDisplay', key: 'userDisplay' },
    { title: 'Изменения', dataIndex: 'message', key: 'message' },
  ]

  if (!Number.isFinite(advertId)) {
    return <div>Некорректный ID кампании</div>
  }

  return (
    <>
      <Header
        workContextCabinetSelect={isManagerOrAdmin ? workContext.workContextCabinetSelectProps : undefined}
        cabinetSelectProps={cabinetSelectProps}
      />
      <Breadcrumbs />
      <div style={{ padding: spacing.lg, backgroundColor: colors.bgGray, minHeight: '100vh' }}>
        {isLoading || !manage ? (
          <div style={{ textAlign: 'center', padding: spacing.xxl }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
                <h1 style={{ ...typography.h2, margin: 0 }}>{manage.name}</h1>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: borderRadius.sm,
                    backgroundColor: statusBg,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {statusText}
                </span>
                <span style={{ color: colors.textSecondary }}>ID {manage.id}</span>
                <span style={{ color: colors.textSecondary }}>{manage.articlesCount} шт.</span>
                <Link to={`/advertising/campaigns/${manage.id}`} style={{ marginLeft: 'auto', color: colors.primary }}>
                  Статистика кампании →
                </Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', gap: spacing.lg }}>
                  {(manage.articles ?? []).map((art) => (
                    <ComboProductItem key={art.nmId} article={art} />
                  ))}
                </div>
              </div>
            </div>

            <CampaignManagePaywallShield active={subscriptionBlocked}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ ...typography.h2, fontSize: 16, margin: '0 0 12px' }}>Автопополнение бюджета</h2>
                  {balanceSources?.fetchedAt && (
                    <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 12px' }}>
                      {balanceSources.stale ? 'Данные из кэша' : 'Обновлено'}: {dayjs(balanceSources.fetchedAt).format('DD.MM.YYYY HH:mm')}
                    </p>
                  )}
                  <Checkbox
                    checked={autoEnabled}
                    disabled={formDisabled}
                    onChange={(e) => setAutoEnabled(e.target.checked)}
                  >
                    Пополнять бюджет автоматически
                  </Checkbox>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>Сумма пополнения, ₽</div>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={MIN_AUTO_TOP_UP_AMOUNT_RUB}
                        step={100}
                        disabled={formDisabled}
                        value={topUpAmount}
                        onChange={setTopUpAmount}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>Источник</div>
                      <Select
                        style={{ width: '100%' }}
                        disabled={formDisabled}
                        value={sourceType}
                        onChange={setSourceType}
                        options={(balanceSources?.sources ?? []).map((s) => ({
                          value: s.type,
                          label: `${s.label}${s.availableRub != null ? ` (${s.availableRub} ₽)` : ''}`,
                        }))}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>Пополнить если ниже, ₽</div>
                      <InputNumber style={{ width: '100%' }} min={0} disabled={formDisabled} value={thresholdRub} onChange={setThresholdRub} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>Макс. пополнений в день</div>
                      <InputNumber style={{ width: '100%' }} min={1} disabled={formDisabled} value={maxTopUps} onChange={setMaxTopUps} />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'stretch',
                    width: 200,
                  }}
                >
                  <Button
                    size="small"
                    loading={refreshBalanceMutation.isPending}
                    onClick={() => refreshBalanceMutation.mutate()}
                  >
                    Обновить баланс
                  </Button>
                  <Button size="small" onClick={openManualTopUp} disabled={controlBlocked || subscriptionBlocked}>
                    Единоразовое пополнение
                  </Button>
                  {autoLocked ? (
                    <Button size="small" onClick={() => unlockAutoMutation.mutate()} disabled={controlBlocked}>
                      Редактировать
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      loading={saveAutoMutation.isPending}
                      disabled={controlBlocked}
                      onClick={() =>
                        saveAutoMutation.mutate({
                          enabled: autoEnabled,
                          topUpAmount,
                          sourceType,
                          thresholdRub,
                          maxTopUpsPerDay: maxTopUps,
                        })
                      }
                    >
                      Сохранить
                    </Button>
                  )}
                </div>
              </div>
            </div>
            </CampaignManagePaywallShield>

            <CampaignManagePaywallShield active={subscriptionBlocked}>
            <div style={cardStyle}>
              {controlBlocked && controlCapabilities?.message && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: spacing.md }}
                  message="Управление расписанием недоступно"
                  description={controlCapabilities.message}
                />
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Space align="center" size={12} style={{ flex: 1 }}>
                  <h2 style={{ ...typography.h2, fontSize: 16, margin: 0 }}>Расписание</h2>
                  <Switch
                    checked={manage.scheduleEnabled ?? false}
                    disabled={controlBlocked || subscriptionBlocked || scheduleTogglePending}
                    loading={scheduleTogglePending}
                    onChange={(checked) => {
                      if (checked) {
                        startMutation.mutate()
                      } else {
                        pauseMutation.mutate()
                      }
                    }}
                  />
                  <span style={{ fontSize: 13, color: colors.textSecondary }}>
                    {(manage.scheduleEnabled ?? false) ? 'Вкл' : 'Выкл'}
                  </span>
                </Space>
                <Button onClick={() => refetch()}>Обновить</Button>
              </div>
              <CampaignWeekCalendar
                slots={manage.slots}
                disabled={controlBlocked || subscriptionBlocked}
                onCreateRange={openCreateFromRange}
                onUpdateSlot={(slotId, body) => updateSlotMutation.mutate({ slotId, body })}
                onEditSlot={openEditSlot}
                onDeleteSlot={confirmDeleteSlot}
              />
            </div>
            </CampaignManagePaywallShield>

            <div style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: spacing.sm,
                  marginBottom: 12,
                }}
              >
                <h2 style={{ ...typography.h2, fontSize: 16, margin: 0 }}>График бюджета</h2>
                <CampaignBudgetChartPeriodPicker
                  value={chartPeriod}
                  onChange={setChartPeriod}
                  disabled={budgetChartLoading}
                />
              </div>
              <CampaignBudgetChart data={budgetChart} loading={budgetChartLoading} />
            </div>

            <div style={cardStyle}>
              <h2 style={{ ...typography.h2, fontSize: 16, margin: 0, marginBottom: 12 }}>История изменений</h2>
              <Table
                size="small"
                loading={changeLogLoading}
                rowKey={(r, i) => `${r.createdAt}-${i}`}
                columns={historyColumns}
                dataSource={changeLogData?.content ?? []}
                pagination={{
                  current: changeLogPage + 1,
                  pageSize: changeLogPageSize,
                  total: changeLogData?.totalElements ?? 0,
                  showSizeChanger: true,
                  pageSizeOptions: [...CHANGE_LOG_PAGE_SIZE_OPTIONS],
                  hideOnSinglePage: (changeLogData?.totalElements ?? 0) <= changeLogPageSize,
                  onChange: (page) => setChangeLogPage(page - 1),
                  onShowSizeChange: (_page, size) => {
                    setChangeLogPageSize(size)
                    setChangeLogPage(0)
                  },
                }}
              />
            </div>
          </>
        )}
      </div>

      <CampaignSlotModal
        open={slotModalOpen}
        title={slotModalTitle}
        initial={slotDraft}
        onCancel={() => setSlotModalOpen(false)}
        onSave={saveSlotDraft}
        saving={createSlotsMutation.isPending || updateSlotMutation.isPending}
      />

      <Modal
        title="Единоразовое пополнение"
        open={manualTopUpOpen}
        onCancel={() => !manualTopUpMutation.isPending && setManualTopUpOpen(false)}
        footer={null}
        destroyOnClose
        width={420}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>Сумма пополнения, ₽</div>
            <InputNumber
              style={{ width: '100%' }}
              min={MIN_AUTO_TOP_UP_AMOUNT_RUB}
              step={100}
              value={manualTopUpAmount}
              onChange={setManualTopUpAmount}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>Источник</div>
            <Select
              style={{ width: '100%' }}
              value={manualSourceType}
              onChange={setManualSourceType}
              options={(balanceSources?.sources ?? []).map((s) => ({
                value: s.type,
                label: `${s.label}${s.availableRub != null ? ` (${s.availableRub} ₽)` : ''}`,
              }))}
            />
          </div>
          <Button
            type="primary"
            block
            loading={manualTopUpMutation.isPending}
            disabled={
              manualTopUpAmount == null
              || manualTopUpAmount < MIN_AUTO_TOP_UP_AMOUNT_RUB
              || manualSourceType == null
            }
            onClick={() => {
              if (manualTopUpAmount == null || manualSourceType == null) {
                return
              }
              manualTopUpMutation.mutate({
                topUpAmount: manualTopUpAmount,
                sourceType: manualSourceType,
              })
            }}
          >
            Пополнить
          </Button>
        </div>
      </Modal>
    </>
  )
}

function ComboProductItem({ article }: { article: ArticleSummary }) {
  const thumbUrl = resolveArticlePhotoUrl(article)
  return (
    <Link
      to={`/analytics/article/${article.nmId}`}
      style={{ display: 'flex', gap: spacing.sm, textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
    >
      <div
        style={{
          width: COMBO_PHOTO_SIZE,
          height: COMBO_PHOTO_SIZE,
          borderRadius: borderRadius.sm,
          backgroundColor: colors.bgGrayLight,
          overflow: 'hidden',
        }}
      >
        {thumbUrl ? (
          <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : null}
      </div>
      <div style={{ maxWidth: 160 }}>
        <div style={{ fontSize: 12 }}>{article.title || `Артикул ${article.nmId}`}</div>
        <div style={{ fontSize: 11, color: colors.textSecondary }}>{article.nmId}</div>
      </div>
    </Link>
  )
}
