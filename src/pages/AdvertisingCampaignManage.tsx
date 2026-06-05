import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spin, Checkbox, InputNumber, Select, Button, message, Table, Alert } from 'antd'
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
import CampaignWeekCalendar, { type SlotCreateRange } from '../components/campaignManage/CampaignWeekCalendar'
import CampaignSlotModal, { type SlotModalDraft } from '../components/campaignManage/CampaignSlotModal'

const COMBO_PHOTO_SIZE = 80

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

  const { data: balanceSources } = useQuery({
    queryKey: ['campaign-balance-sources', advertId, selectedCabinetId],
    queryFn: () =>
      campaignManageApi.getBalanceSources(advertId, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    enabled: Number.isFinite(advertId) && selectedCabinetId != null,
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: manageKey })

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
    mutationFn: (slotId: number) =>
      campaignManageApi.deleteSlot(advertId, slotId, selectedSellerId ?? undefined, selectedCabinetId ?? undefined),
    onSuccess: () => {
      message.success('Слот удалён')
      invalidate()
    },
    onError: (e) => message.error(formatControlError(e)),
  })

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

  const controlBlocked = controlCapabilities != null && !controlCapabilities.canControl
  const formDisabled = autoLocked || controlBlocked

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

  const running = manage?.operationalStatus === 'RUNNING'
  const statusBg = running ? colors.success : colors.textMuted

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
                  {running ? '▷ Работает' : 'II Остановлена'}
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

            <div style={cardStyle}>
              <h2 style={{ ...typography.h2, fontSize: 16, marginTop: 0 }}>Автопополнение бюджета</h2>
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
                  <InputNumber style={{ width: '100%' }} min={500} step={50} disabled={formDisabled} value={topUpAmount} onChange={setTopUpAmount} />
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
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>Порог, ₽</div>
                  <InputNumber style={{ width: '100%' }} min={0} disabled={formDisabled} value={thresholdRub} onChange={setThresholdRub} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>Макс. пополнений в день</div>
                  <InputNumber style={{ width: '100%' }} min={1} disabled={formDisabled} value={maxTopUps} onChange={setMaxTopUps} />
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                {autoLocked ? (
                  <Button onClick={() => unlockAutoMutation.mutate()} disabled={controlBlocked}>
                    Редактировать
                  </Button>
                ) : (
                  <Button
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
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <h2 style={{ ...typography.h2, fontSize: 16, margin: 0, flex: 1 }}>Расписание</h2>
                <Button
                  type="primary"
                  disabled={controlBlocked}
                  loading={startMutation.isPending}
                  onClick={() => startMutation.mutate()}
                >
                  ▷ Запустить
                </Button>
                <Button
                  danger
                  disabled={controlBlocked}
                  loading={pauseMutation.isPending}
                  onClick={() => pauseMutation.mutate()}
                >
                  II Остановить
                </Button>
                <Button onClick={() => refetch()}>Обновить</Button>
              </div>
              <CampaignWeekCalendar
                slots={manage.slots}
                disabled={controlBlocked}
                onCreateRange={openCreateFromRange}
                onUpdateSlot={(slotId, body) => updateSlotMutation.mutate({ slotId, body })}
                onEditSlot={openEditSlot}
                onDeleteSlot={(slotId) => deleteSlotMutation.mutate(slotId)}
              />
            </div>

            <div style={cardStyle}>
              <h2 style={{ ...typography.h2, fontSize: 16, marginTop: 0 }}>График бюджета</h2>
              <p style={{ color: colors.textSecondary, margin: 0 }}>В разработке</p>
            </div>

            <div style={cardStyle}>
              <h2 style={{ ...typography.h2, fontSize: 16, marginTop: 0 }}>История изменений</h2>
              <Table
                size="small"
                rowKey={(r, i) => `${r.createdAt}-${i}`}
                columns={historyColumns}
                dataSource={manage.recentChangeLog}
                pagination={false}
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
