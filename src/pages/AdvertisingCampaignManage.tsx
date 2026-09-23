import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spin, Checkbox, InputNumber, Select, Button, message, Table, Alert, Modal, Switch, Space } from 'antd'
import { EditOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignManageApi, type CampaignAutoBudgetRequest, type CampaignScheduleSlotRequest } from '../api/campaignManage'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
import type { ArticleSummary, CampaignScheduleSlot, CampaignSlotRepeatMode, CampaignAutoBudgetSettings } from '../types/analytics'
import { resolveArticlePhotoUrl } from '../types/analytics'
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useWorkContextForAdmin } from '../hooks/useWorkContextForAdmin'
import { useEntityCabinetResolve } from '../hooks/useEntityCabinetResolve'
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
import { ONBOARDING_TARGETS } from '../onboarding/targets'

const COMBO_PHOTO_SIZE = 80
const CHANGE_LOG_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
/** Минимальная сумма пополнения бюджета РК на Wildberries, ₽. */
const MIN_AUTO_TOP_UP_AMOUNT_RUB = 1000

const manageActionButtonStyle = {
  height: 36,
  borderRadius: borderRadius.md,
  fontWeight: 600,
  fontSize: 12,
  paddingInline: 10,
} as const

const manageActionButtonRowStyle = {
  display: 'flex',
  gap: 8,
  width: '100%',
} as const

const manageActionButtonHalfStyle = {
  ...manageActionButtonStyle,
  flex: 1,
  minWidth: 0,
} as const

function applyAutoBudgetFormState(
  a: CampaignAutoBudgetSettings,
  setters: {
    setAutoEnabled: (v: boolean) => void
    setTopUpAmount: (v: number | null) => void
    setSourceType: (v: number | null) => void
    setUsePromoCashback: (v: boolean) => void
    setThresholdRub: (v: number | null) => void
    setMaxTopUps: (v: number | null) => void
    setAutoLocked: (v: boolean) => void
  },
) {
  setters.setAutoEnabled(a.enabled)
  setters.setTopUpAmount(a.topUpAmount ?? null)
  setters.setSourceType(a.sourceType ?? 1)
  setters.setUsePromoCashback(a.usePromoCashback !== false)
  setters.setThresholdRub(a.thresholdRub ?? null)
  setters.setMaxTopUps(a.maxTopUpsPerDay ?? null)
  setters.setAutoLocked(a.locked)
}

function formatControlError(err: unknown): string {
  const ax = err as { response?: { data?: { message?: string; error?: string } } }
  return ax.response?.data?.error || ax.response?.data?.message || 'Не удалось выполнить действие'
}

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

/** Дата журнала: на узком экране две строки `дд:мм` / `чч:мм`, иначе `гггг-мм-дд чч:мм`. */
function ChangeLogDateTimeCell({ value, compact }: { value: string | undefined; compact: boolean }) {
  if (!value) return '—'
  const parsed = dayjs(value)
  if (!parsed.isValid()) {
    return value.replace('T', ' ').slice(0, 16)
  }
  if (!compact) {
    return parsed.format('YYYY-MM-DD HH:mm')
  }
  return (
    <span className="campaign-manage-history-datetime">
      <span>{parsed.format('DD:MM')}</span>
      <span>{parsed.format('HH:mm')}</span>
    </span>
  )
}

/** Подпись источника пополнения (без промо — оно в чекбоксе). */
function formatBalanceSourceLabel(s: {
  label: string
  availableRub?: number | null
}): string {
  const amount = s.availableRub != null ? s.availableRub : 0
  return `${s.label} (${amount} ₽)`
}

/** Промо доступно для источника счёт/баланс. */
function sourceAllowsPromo(s: {
  type: number
  cashbackRub?: number | null
  cashbackPercent?: number | null
} | undefined): boolean {
  if (s == null) return false
  if (s.type !== 0 && s.type !== 1) return false
  return (s.cashbackRub ?? 0) > 0 && (s.cashbackPercent ?? 0) > 0
}

/** Текст чекбокса промо: «Использовать промо-бонусы 163000 ₽ до 50%». */
function formatUsePromoCheckboxLabel(s: {
  cashbackRub?: number | null
  cashbackPercent?: number | null
}): string {
  const rub = s.cashbackRub ?? 0
  const pct = s.cashbackPercent ?? 0
  return `Использовать промо-бонусы ${rub} ₽ до ${pct}%`
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
  const isNarrow = useIsNarrow(900)
  const queryClient = useQueryClient()
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'ADMIN'
  const workContext = useWorkContextForAdmin(isAdmin)
  const selectedSellerId = isAdmin ? workContext.selectedSellerId : undefined

  const { data: myCabinets = [] } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'USER',
  })

  const cabinets = useMemo(() => {
    if (isAdmin) {
      return workContext.workContextOptions.map((o) => ({ id: o.cabinetId, name: o.cabinetName, marketplaceType: o.marketplaceType }))
    }
    return myCabinets
  }, [isAdmin, workContext.workContextOptions, myCabinets])

  const [sellerCabinetId, setSellerCabinetId] = useState<number | null>(() => getStoredCabinetId())
  const selectedCabinetId = isAdmin ? workContext.selectedCabinetId : sellerCabinetId

  const {
    requestCabinetId,
    requestSellerId,
    resolveLoading,
    resolveFailed,
    cabinetReady,
  } = useEntityCabinetResolve({
    queryKey: ['campaign-cabinet', advertId],
    resolveFn: () => campaignManageApi.resolveCabinet(advertId),
    enabled: Number.isFinite(advertId),
    isAdmin,
    selectedCabinetId,
    applyWorkContextCabinet: workContext.applyWorkContextCabinet,
    setSellerCabinetId: (cid) => {
      setSellerCabinetId(cid)
      if (cid != null) setStoredCabinetId(cid)
    },
  })

  const manageKey = ['campaign-manage', advertId, requestSellerId, requestCabinetId] as const

  const {
    data: manage,
    isLoading,
    isFetched: manageFetched,
    isError: manageError,
  } = useQuery({
    queryKey: manageKey,
    queryFn: () =>
      campaignManageApi.getManage(advertId, requestSellerId ?? undefined, requestCabinetId ?? undefined),
    enabled: Number.isFinite(advertId) && cabinetReady,
  })

  const balanceSourcesKey = ['campaign-balance-sources', advertId, requestCabinetId] as const

  const { data: balanceSources } = useQuery({
    queryKey: balanceSourcesKey,
    queryFn: () =>
      campaignManageApi.getBalanceSources(advertId, requestSellerId ?? undefined, requestCabinetId ?? undefined),
    enabled: Number.isFinite(advertId) && cabinetReady,
    staleTime: 30 * 60 * 1000,
  })

  const [chartPeriod, setChartPeriod] = useState<[Dayjs, Dayjs]>(() => defaultBudgetChartPeriod())

  useEffect(() => {
    setChartPeriod(defaultBudgetChartPeriod())
  }, [advertId, requestCabinetId, requestSellerId])

  const budgetChartKey = [
    'campaign-budget-chart',
    advertId,
    requestCabinetId,
    chartPeriod[0].valueOf(),
    chartPeriod[1].valueOf(),
  ] as const

  const [changeLogPage, setChangeLogPage] = useState(0)
  const [changeLogPageSize, setChangeLogPageSize] = useState<number>(CHANGE_LOG_PAGE_SIZE_OPTIONS[0])

  useEffect(() => {
    setChangeLogPage(0)
  }, [advertId, requestCabinetId, requestSellerId])

  const changeLogKey = [
    'campaign-change-log',
    advertId,
    requestSellerId,
    requestCabinetId,
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
        requestSellerId ?? undefined,
        requestCabinetId ?? undefined,
      ),
    enabled: Number.isFinite(advertId) && cabinetReady,
  })

  const { data: budgetChart, isLoading: budgetChartLoading } = useQuery({
    queryKey: budgetChartKey,
    queryFn: () =>
      campaignManageApi.getBudgetChart(advertId, requestSellerId ?? undefined, requestCabinetId ?? undefined, {
        from: formatBudgetChartPeriodParam(chartPeriod[0]),
        to: formatBudgetChartPeriodParam(chartPeriod[1]),
      }),
    enabled: Number.isFinite(advertId) && cabinetReady,
    staleTime: 3 * 60 * 1000,
  })

  const refreshBalanceMutation = useMutation({
    mutationFn: () =>
      campaignManageApi.refreshBalanceSources(advertId, requestSellerId ?? undefined, requestCabinetId ?? undefined),
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
    queryKey: ['manage-control-capabilities', requestSellerId, requestCabinetId],
    queryFn: () =>
      analyticsApi.getPromotionControlCapabilities(requestSellerId ?? undefined, requestCabinetId ?? undefined),
    enabled: requestCabinetId != null,
  })

  const [autoEnabled, setAutoEnabled] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null)
  const [sourceType, setSourceType] = useState<number | null>(1)
  const [usePromoCashback, setUsePromoCashback] = useState(true)
  const [thresholdRub, setThresholdRub] = useState<number | null>(null)
  const [maxTopUps, setMaxTopUps] = useState<number | null>(null)
  const [autoLocked, setAutoLocked] = useState(false)
  const [manualTopUpOpen, setManualTopUpOpen] = useState(false)
  const [manualTopUpAmount, setManualTopUpAmount] = useState<number | null>(MIN_AUTO_TOP_UP_AMOUNT_RUB)
  const [manualSourceType, setManualSourceType] = useState<number | null>(1)
  const [manualUsePromoCashback, setManualUsePromoCashback] = useState(true)

  useEffect(() => {
    if (!manage?.autoBudget) return
    applyAutoBudgetFormState(manage.autoBudget, {
      setAutoEnabled,
      setTopUpAmount,
      setSourceType,
      setUsePromoCashback,
      setThresholdRub,
      setMaxTopUps,
      setAutoLocked,
    })
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
      campaignManageApi.saveAutoBudget(advertId, body, requestSellerId ?? undefined, requestCabinetId ?? undefined),
    onSuccess: () => {
      message.success('Настройки автопополнения сохранены')
      setAutoLocked(true)
      invalidate()
    },
    onError: (e) => message.error(formatControlError(e)),
  })

  const toggleAutoBudgetMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      campaignManageApi.setAutoBudgetEnabled(
        advertId,
        enabled,
        requestSellerId ?? undefined,
        requestCabinetId ?? undefined,
      ),
    onSuccess: (_data, enabled) => {
      message.success(enabled ? 'Автопополнение включено' : 'Автопополнение выключено')
      invalidate()
    },
    onError: (e, enabled) => {
      setAutoEnabled(!enabled)
      message.error(formatControlError(e))
    },
  })

  const cancelAutoBudgetEdit = useCallback(() => {
    if (manage?.autoBudget) {
      applyAutoBudgetFormState(manage.autoBudget, {
        setAutoEnabled,
        setTopUpAmount,
        setSourceType,
        setUsePromoCashback,
        setThresholdRub,
        setMaxTopUps,
        setAutoLocked,
      })
    } else {
      setAutoLocked(true)
    }
  }, [manage?.autoBudget])

  const manualTopUpMutation = useMutation({
    mutationFn: (body: { topUpAmount: number; sourceType: number; usePromoCashback?: boolean }) =>
      campaignManageApi.manualTopUp(advertId, body, requestSellerId ?? undefined, requestCabinetId ?? undefined),
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
    setManualUsePromoCashback(usePromoCashback)
    setManualTopUpOpen(true)
  }, [topUpAmount, sourceType, usePromoCashback, balanceSources?.sources])

  const createSlotsMutation = useMutation({
    mutationFn: (body: CampaignScheduleSlotRequest) =>
      campaignManageApi.createSlots(advertId, body, requestSellerId ?? undefined, requestCabinetId ?? undefined),
    onSuccess: () => {
      message.success('Слот добавлен')
      setSlotModalOpen(false)
      invalidate()
    },
    onError: (e) => message.error(formatControlError(e)),
  })

  const updateSlotMutation = useMutation({
    mutationFn: ({ slotId, body }: { slotId: number; body: { startTime?: string; endTime?: string; budgetRub?: number } }) =>
      campaignManageApi.updateSlot(advertId, slotId, body, requestSellerId ?? undefined, requestCabinetId ?? undefined),
    onSuccess: () => invalidate(),
    onError: (e) => message.error(formatControlError(e)),
  })

  const deleteSlotMutation = useMutation({
    mutationFn: ({ slotId, deleteAll }: { slotId: number; deleteAll?: boolean }) =>
      campaignManageApi.deleteSlot(advertId, slotId, {
        deleteAll,
        sellerId: requestSellerId ?? undefined,
        cabinetId: requestCabinetId ?? undefined,
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
    mutationFn: () => campaignManageApi.start(advertId, requestSellerId ?? undefined, requestCabinetId ?? undefined),
    onSuccess: (r) => {
      message.success(r.message ?? (r.enqueued ? 'Запуск поставлен в очередь' : 'Запуск выполнен'))
      invalidate()
    },
    onError: (e) => message.error(formatControlError(e)),
  })

  const pauseMutation = useMutation({
    mutationFn: () => campaignManageApi.pause(advertId, requestSellerId ?? undefined, requestCabinetId ?? undefined),
    onSuccess: (r) => {
      message.success(r.message ?? (r.enqueued ? 'Пауза поставлена в очередь' : 'Пауза выполнена'))
      invalidate()
    },
    onError: (e) => message.error(formatControlError(e)),
  })

  const { hasCampaignManageAccess } = useCampaignManagePaywall(requestSellerId ?? selectedSellerId)
  const subscriptionBlocked = !hasCampaignManageAccess

  const controlBlocked = controlCapabilities != null && !controlCapabilities.canControl
  const autoBudgetFieldsDisabled = autoLocked || controlBlocked || subscriptionBlocked
  const autoBudgetToggleDisabled = controlBlocked || subscriptionBlocked

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
    role === 'USER'
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
      title: isNarrow ? 'Дата' : 'Дата и время',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: isNarrow ? 56 : 160,
      className: 'campaign-manage-history-date',
      render: (v: string) => <ChangeLogDateTimeCell value={v} compact={isNarrow} />,
    },
    {
      title: 'Пользователь',
      dataIndex: 'userDisplay',
      key: 'userDisplay',
      width: isNarrow ? 108 : 220,
      className: 'campaign-manage-history-user',
    },
    {
      title: 'Изменения',
      dataIndex: 'message',
      key: 'message',
      className: 'campaign-manage-history-message',
    },
  ]

  if (!Number.isFinite(advertId)) {
    return <div>Некорректный ID кампании</div>
  }

  const manageFailed = cabinetReady && manageFetched && (manageError || !manage)
  const showSpinner = !resolveFailed && !manageFailed && (resolveLoading || isLoading || !manage)

  return (
    <>
      <Header
        workContextCabinetSelect={isAdmin ? workContext.workContextCabinetSelectProps : undefined}
        cabinetSelectProps={cabinetSelectProps}
      />
      <Breadcrumbs />
      <div className="campaign-manage-page" style={{ padding: spacing.lg, backgroundColor: colors.bgGray, minHeight: '100vh' }}>
        {resolveFailed ? (
          <div style={{ ...cardStyle, color: colors.error }}>
            Кампания не найдена или нет доступа к её кабинету
          </div>
        ) : manageFailed ? (
          <div style={{ ...cardStyle, color: colors.error }}>
            Не удалось загрузить управление кампанией
          </div>
        ) : showSpinner || !manage ? (
          <div style={{ textAlign: 'center', padding: spacing.xxl }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div style={cardStyle}>
              <div className="campaign-manage-hero-top" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
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
                <Link
                  className="campaign-manage-stats-link"
                  to={`/advertising/campaigns/${manage.id}`}
                  data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_STATS_LINK}
                  style={{ marginLeft: 'auto', color: colors.primary }}
                >
                  Статистика кампании →
                </Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <div
                  className="campaign-manage-articles"
                  data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_ARTICLES}
                  style={{ display: 'flex', gap: spacing.lg }}
                >
                  {(manage.articles ?? []).map((art) => (
                    <ComboProductItem key={art.nmId} article={art} />
                  ))}
                </div>
              </div>
            </div>

            <CampaignManagePaywallShield active={subscriptionBlocked}>
            <div style={cardStyle}>
              <div className="campaign-manage-auto-row" style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
                <div className="campaign-manage-auto-budget" style={{ flex: '1 1 280px', minWidth: 0 }} data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_AUTO_BUDGET}>
                  <h2 style={{ ...typography.h2, fontSize: 16, margin: '0 0 12px' }}>Автопополнение бюджета</h2>
                  {balanceSources?.fetchedAt && (
                    <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 12px' }}>
                      {balanceSources.stale ? 'Данные из кэша' : 'Обновлено'}: {dayjs(balanceSources.fetchedAt).format('DD.MM.YYYY HH:mm')}
                    </p>
                  )}
                  <Checkbox
                    checked={autoEnabled}
                    disabled={autoBudgetToggleDisabled || toggleAutoBudgetMutation.isPending}
                    onChange={(e) => {
                      const enabled = e.target.checked
                      setAutoEnabled(enabled)
                      toggleAutoBudgetMutation.mutate(enabled)
                    }}
                  >
                    Пополнять бюджет автоматически
                  </Checkbox>
                  <div className="campaign-manage-auto-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>Сумма пополнения, ₽</div>
                      <InputNumber
                        style={{ width: '100%' }}
                        min={MIN_AUTO_TOP_UP_AMOUNT_RUB}
                        step={100}
                        disabled={autoBudgetFieldsDisabled}
                        value={topUpAmount}
                        onChange={setTopUpAmount}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>Источник</div>
                      <Select
                        style={{ width: '100%' }}
                        disabled={autoBudgetFieldsDisabled}
                        value={sourceType}
                        onChange={setSourceType}
                        options={(balanceSources?.sources ?? []).map((s) => ({
                          value: s.type,
                          label: formatBalanceSourceLabel(s),
                        }))}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>Пополнить если ниже, ₽</div>
                      <InputNumber style={{ width: '100%' }} min={0} disabled={autoBudgetFieldsDisabled} value={thresholdRub} onChange={setThresholdRub} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>Макс. пополнений в день</div>
                      <InputNumber style={{ width: '100%' }} min={1} disabled={autoBudgetFieldsDisabled} value={maxTopUps} onChange={setMaxTopUps} />
                    </div>
                    {sourceAllowsPromo((balanceSources?.sources ?? []).find((s) => s.type === sourceType)) && (
                      <div className="campaign-manage-auto-promo" style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1' }}>
                        <Checkbox
                          checked={usePromoCashback}
                          disabled={autoBudgetFieldsDisabled}
                          onChange={(e) => setUsePromoCashback(e.target.checked)}
                        >
                          {formatUsePromoCheckboxLabel(
                            (balanceSources?.sources ?? []).find((s) => s.type === sourceType)!,
                          )}
                        </Checkbox>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="campaign-manage-auto-actions"
                  style={{
                    flex: '0 1 220px',
                    maxWidth: 220,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                    gap: 8,
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.bgGray,
                    border: `1px solid ${colors.borderLight}`,
                  }}
                >
                  <Button
                    icon={<ReloadOutlined />}
                    loading={refreshBalanceMutation.isPending}
                    onClick={() => refreshBalanceMutation.mutate()}
                    style={{
                      ...manageActionButtonStyle,
                      backgroundColor: colors.bgWhite,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    }}
                  >
                    Обновить баланс
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openManualTopUp}
                    disabled={controlBlocked || subscriptionBlocked}
                    style={{
                      ...manageActionButtonStyle,
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                      boxShadow: '0 4px 14px rgba(124, 58, 237, 0.28)',
                    }}
                  >
                    Единоразовое пополнение
                  </Button>
                  {autoLocked ? (
                    <Button
                      icon={<EditOutlined />}
                      data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_AUTO_BUDGET_SAVE}
                      onClick={() => setAutoLocked(false)}
                      disabled={controlBlocked}
                      style={{
                        ...manageActionButtonStyle,
                        backgroundColor: colors.advertisingBg,
                        borderColor: colors.success,
                        color: colors.textPrimary,
                      }}
                    >
                      Редактировать
                    </Button>
                  ) : (
                    <div className="campaign-manage-action-row" style={manageActionButtonRowStyle}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_AUTO_BUDGET_SAVE}
                        loading={saveAutoMutation.isPending}
                        disabled={controlBlocked}
                        onClick={() =>
                          saveAutoMutation.mutate({
                            enabled: autoEnabled,
                            topUpAmount,
                            sourceType,
                            usePromoCashback,
                            thresholdRub,
                            maxTopUpsPerDay: maxTopUps,
                          })
                        }
                        style={{
                          ...manageActionButtonHalfStyle,
                          backgroundColor: colors.success,
                          borderColor: colors.success,
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.24)',
                        }}
                      >
                        Сохранить
                      </Button>
                      <Button
                        disabled={controlBlocked || saveAutoMutation.isPending}
                        onClick={cancelAutoBudgetEdit}
                        style={{
                          ...manageActionButtonHalfStyle,
                          backgroundColor: colors.bgWhite,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
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
              <div className="campaign-manage-schedule-head" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Space align="center" size={12}>
                  <h2 style={{ ...typography.h2, fontSize: 16, margin: 0 }}>Расписание</h2>
                  <Switch
                    data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_SCHEDULE_TOGGLE}
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
              </div>
              <div className="campaign-manage-calendar-wrap">
              <CampaignWeekCalendar
                tourTargetId={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_SCHEDULE_GRID}
                slots={manage.slots}
                disabled={controlBlocked || subscriptionBlocked}
                onCreateRange={openCreateFromRange}
                onUpdateSlot={(slotId, body) => updateSlotMutation.mutate({ slotId, body })}
                onEditSlot={openEditSlot}
                onDeleteSlot={confirmDeleteSlot}
              />
              </div>
            </div>
            </CampaignManagePaywallShield>

            <div style={cardStyle} data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_BUDGET_CHART}>
              <div
                className="campaign-manage-chart-head"
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

            <div className="campaign-manage-history" style={cardStyle}>
              <h2 style={{ ...typography.h2, fontSize: 16, margin: 0, marginBottom: 12 }}>История изменений</h2>
              <Table
                size="small"
                tableLayout="fixed"
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
        className="campaign-manage-modal"
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
                label: formatBalanceSourceLabel(s),
              }))}
            />
          </div>
          {sourceAllowsPromo((balanceSources?.sources ?? []).find((s) => s.type === manualSourceType)) && (
            <Checkbox
              checked={manualUsePromoCashback}
              onChange={(e) => setManualUsePromoCashback(e.target.checked)}
            >
              {formatUsePromoCheckboxLabel(
                (balanceSources?.sources ?? []).find((s) => s.type === manualSourceType)!,
              )}
            </Checkbox>
          )}
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
                usePromoCashback: manualUsePromoCashback,
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
