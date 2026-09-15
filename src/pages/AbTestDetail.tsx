import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, InputNumber, Modal, Radio, Select, Spin, Tooltip, message } from 'antd'
import { EditOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { useWorkContextForAdmin } from '../hooks/useWorkContextForAdmin'
import { useStoredCabinet } from '../hooks/useStoredCabinet'
import { cabinetsApi } from '../api/cabinets'
import { abTestApi } from '../api/abTest'
import { colors, borderRadius } from '../styles/analytics'
import { ONBOARDING_TARGETS } from '../onboarding/targets'
import AbTestVariantImage from '../components/AbTestVariantImage'
import {
  formatFinishSummary,
  formatRotationSummary,
  formatStopSummary,
} from '../utils/abTestLabels'
import type {
  AbTest,
  AbTestFinishAction,
  AbTestRotationMode,
  AbTestStopMode,
  UpdateAbTestSettingsRequest,
} from '../types/abTest'
import type { CabinetTokenType } from '../types/api'

/** Минимальный интервал ротации по времени для базового токена (fullstats ≤ 1/час). */
const BASIC_TOKEN_MIN_INTERVAL_MINUTES = 60
const AB_TESTS_LIST_PATH = '/advertising/ab-test'

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

function formatPct(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Number(value).toFixed(2)}%`
}

function formatInt(value: number | null | undefined): string {
  if (value == null) return '—'
  return Number(value).toLocaleString('ru-RU')
}

const METRIC_HINTS: Record<string, string> = {
  CTR: 'Клики / показы × 100 — кликабельность фото',
  'Доля показов': 'Доля показов варианта среди всех вариантов теста',
  CR1: 'Добавления в корзину / клики × 100 — конверсия клика в корзину',
  CR: 'Заказы / клики × 100 — конверсия клика в заказ',
}

export default function AbTestDetail() {
  const { id } = useParams<{ id: string }>()
  const testId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const isAdmin = role === 'ADMIN'
  const workContext = useWorkContextForAdmin(isAdmin)
  const [editOpen, setEditOpen] = useState(false)
  const isNarrow = useIsNarrow(900)

  const { data: myCabinets = [] } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'USER',
  })

  const { cabinetId: sellerCabinetId, setCabinetId: setSellerCabinetId } = useStoredCabinet(myCabinets)

  const selectedCabinetId = isAdmin ? workContext.selectedCabinetId : sellerCabinetId
  const selectedSellerId = isAdmin ? workContext.selectedSellerId : undefined

  const isOzonCabinet = useMemo(() => {
    if (selectedCabinetId == null) return false
    if (isAdmin) {
      return workContext.workContextOptions.find((o) => o.cabinetId === selectedCabinetId)?.marketplaceType === 'OZON'
    }
    return myCabinets.find((c) => c.id === selectedCabinetId)?.marketplaceType === 'OZON'
  }, [isAdmin, selectedCabinetId, workContext.workContextOptions, myCabinets])

  useEffect(() => {
    if (isOzonCabinet) {
      navigate(AB_TESTS_LIST_PATH, { replace: true })
    }
  }, [isOzonCabinet, navigate])

  const selectedTokenType: CabinetTokenType | null | undefined = useMemo(() => {
    if (selectedCabinetId == null) return null
    if (isAdmin) {
      return workContext.workContextOptions.find((o) => o.cabinetId === selectedCabinetId)?.tokenType ?? null
    }
    return myCabinets.find((c) => c.id === selectedCabinetId)?.apiKey?.tokenType ?? null
  }, [isAdmin, selectedCabinetId, workContext.workContextOptions, myCabinets])

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['abTest', testId, selectedSellerId, selectedCabinetId],
    queryFn: () => abTestApi.get(testId, selectedSellerId, selectedCabinetId ?? undefined),
    enabled: Number.isFinite(testId) && selectedCabinetId != null && !isOzonCabinet,
  })

  useEffect(() => {
    if (!error) return
    const status = (error as { response?: { status?: number } })?.response?.status
    message.error('Не удалось загрузить А/Б-тест')
    if (status === 403 || status === 404) {
      navigate(AB_TESTS_LIST_PATH, { replace: true })
    }
  }, [error, navigate])

  const pauseMutation = useMutation({
    mutationFn: ({ variantId, paused }: { variantId: number; paused: boolean }) =>
      abTestApi.setVariantPaused(testId, variantId, paused, selectedSellerId, selectedCabinetId ?? undefined),
    onSuccess: (data, vars) => {
      queryClient.setQueryData(['abTest', testId, selectedSellerId, selectedCabinetId], data)
      queryClient.invalidateQueries({ queryKey: ['abTests'] })
      message.success(vars.paused ? 'Вариант на паузе' : 'Пауза снята')
    },
    onError: (err: { response?: { data?: { error?: string; message?: string } } }) => {
      message.error(err?.response?.data?.error ?? err?.response?.data?.message ?? 'Не удалось изменить паузу')
    },
  })

  const cabinetSelectProps = useMemo(() => {
    if (isAdmin) return undefined
    return {
      cabinets: myCabinets.map((c) => ({ id: c.id, name: c.name, marketplaceType: c.marketplaceType })),
      selectedCabinetId,
      onCabinetChange: (cid: number | null) => {
        if (cid == null) return
        setSellerCabinetId(cid)
        navigate(AB_TESTS_LIST_PATH)
      },
      loading: false,
    }
  }, [isAdmin, myCabinets, selectedCabinetId, navigate, setSellerCabinetId])

  const activeUnpausedCount = test?.variants.filter((v) => !v.paused).length ?? 0
  const canEditSettings = test != null && (test.status === 'ENABLED' || test.status === 'PENDING_START')

  return (
    <div style={{ minHeight: '100vh', background: colors.bgGray }}>
      <style>{`
        @media (max-width: 900px) {
          .ab-test-detail-page {
            padding: 12px 12px 32px !important;
          }
          .ab-test-detail-title {
            font-size: 20px !important;
            line-height: 1.25 !important;
            overflow-wrap: anywhere;
            margin: 12px 0 6px !important;
          }
          .ab-test-detail-settings {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
            margin-bottom: 16px !important;
            font-size: 13px !important;
          }
          .ab-test-detail-variants {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .ab-test-detail-variant {
            display: flex !important;
            flex-wrap: wrap;
            align-items: flex-start;
            gap: 8px 12px;
            padding: 12px !important;
          }
          .ab-test-detail-variant-badge {
            flex: 1 0 100%;
            height: auto !important;
            min-height: 18px;
            margin-bottom: 0 !important;
          }
          .ab-test-detail-variant-photo-wrap {
            flex: 0 0 112px;
            width: 112px;
          }
          .ab-test-detail-variant-photo-wrap img {
            width: 100% !important;
          }
          .ab-test-detail-variant-stats {
            flex: 1 1 0;
            min-width: 0;
          }
          .ab-test-detail-variant-ctr {
            margin-top: 0 !important;
            margin-bottom: 4px !important;
          }
          .ab-test-metric {
            gap: 8px;
          }
          .ab-test-metric-label {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .ab-test-metric-value {
            flex-shrink: 0;
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
          }
        }
      `}</style>
      <Header
        cabinetSelectProps={cabinetSelectProps}
        workContextCabinetSelect={isAdmin ? workContext.workContextCabinetSelectProps : undefined}
      />
      <div className="ab-test-detail-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 48px' }}>
        <Breadcrumbs />
        {isLoading || !test ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : (
          <>
            <h1 className="ab-test-detail-title" style={{ fontSize: 22, fontWeight: 700, margin: '16px 0 8px' }}>{test.title ?? `Артикул ${test.nmId}`}</h1>
            <div style={{ color: '#64748B', marginBottom: 8, overflowWrap: 'anywhere' }}>
              {test.nmId}
              {test.advertIds?.length ? ` · рк ${test.advertIds.join(', ')}` : ''}
            </div>
            <div
              className="ab-test-detail-settings"
              data-tour-id={ONBOARDING_TARGETS.AB_TEST_DETAIL_SETTINGS}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px 24px',
                color: '#64748B',
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              <div>
                <span style={{ color: '#94A3B8' }}>Периодичность ротации: </span>
                {formatRotationSummary(test)}
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>Когда остановить тест: </span>
                {formatStopSummary(test)}
              </div>
              <div>
                <span style={{ color: '#94A3B8' }}>По завершении: </span>
                {formatFinishSummary(test)}
              </div>
              {canEditSettings ? (
                <Button type="link" icon={<EditOutlined />} onClick={() => setEditOpen(true)} style={{ padding: 0 }}>
                  Изменить
                </Button>
              ) : null}
            </div>
            <div
              className="ab-test-detail-variants"
              data-tour-id={ONBOARDING_TARGETS.AB_TEST_DETAIL_VARIANTS}
              style={{
                display: 'grid',
                gridTemplateColumns: isNarrow
                  ? '1fr'
                  : `repeat(${Math.min(test.variants.length, 5)}, minmax(140px, 1fr))`,
                gap: 16,
              }}
            >
              {(() => {
                const activeCtrs = test.variants.filter((x) => !x.paused).map((x) => Number(x.ctr) || 0)
                const bestCtr = activeCtrs.length > 0 ? Math.max(...activeCtrs) : 0
                const activeOnWbId = test.variants.find((x) => x.activeOnWb && !x.paused)?.id
                return test.variants.map((v) => {
                  const isCtrLeader = !!v.winning || (!v.paused && bestCtr > 0 && Number(v.ctr) === bestCtr)
                  const showInColor = v.activeOnWb && !v.paused
                  const canPause = test.status === 'ENABLED' && !v.paused && activeUnpausedCount > 1
                  const canResume = test.status === 'ENABLED' && !!v.paused
                  return (
                    <div
                      key={v.id}
                      className="ab-test-detail-variant"
                      style={{
                        background: '#fff',
                        border: `1px solid ${colors.border}`,
                        borderRadius: borderRadius.lg,
                        padding: 12,
                        opacity: v.paused ? 0.7 : v.activeOnWb ? 1 : 0.85,
                      }}
                    >
                      <div className="ab-test-detail-variant-badge" style={{ height: 22, marginBottom: 6 }}>
                        {v.activeOnWb && !v.paused ? (
                          <span
                            data-tour-id={v.id === activeOnWbId ? ONBOARDING_TARGETS.AB_TEST_DETAIL_ACTIVE_WB : undefined}
                            style={{ color: '#16A34A', fontWeight: 600, fontSize: 13 }}
                          >
                            Сейчас на ВБ
                          </span>
                        ) : null}
                      </div>
                      <div className="ab-test-detail-variant-photo-wrap" style={{ position: 'relative' }}>
                        <AbTestVariantImage
                          testId={test.id}
                          variantId={v.id}
                          hasLocalImage={v.hasLocalImage}
                          photoUrl={v.photoUrl}
                          previewUrl={v.previewUrl}
                          sellerId={selectedSellerId}
                          cabinetId={selectedCabinetId}
                          className="ab-test-detail-variant-photo"
                          style={{
                            width: '100%',
                            aspectRatio: '3/4',
                            objectFit: 'cover',
                            borderRadius: 8,
                            filter: showInColor ? 'none' : 'grayscale(1)',
                            opacity: v.paused ? 0.55 : showInColor ? 1 : 0.9,
                            outline: showInColor ? `2px solid ${colors.primary}` : 'none',
                            outlineOffset: 2,
                            background: '#F1F5F9',
                          }}
                        />
                        {v.paused ? (
                          <div
                            aria-hidden
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 8,
                              pointerEvents: 'none',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                gap: 10,
                                alignItems: 'stretch',
                                height: '18%',
                                minHeight: 36,
                                maxHeight: 56,
                              }}
                            >
                              <span
                                style={{
                                  width: 14,
                                  borderRadius: 4,
                                  background: 'rgba(51, 65, 85, 0.88)',
                                }}
                              />
                              <span
                                style={{
                                  width: 14,
                                  borderRadius: 4,
                                  background: 'rgba(51, 65, 85, 0.88)',
                                }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="ab-test-detail-variant-stats">
                      <div className="ab-test-detail-variant-ctr" style={{ marginTop: 10, fontWeight: 700, marginBottom: 8 }}>
                        <Tooltip title={METRIC_HINTS.CTR}>
                          <span
                            style={{
                              cursor: 'help',
                              borderBottom: '1px dashed #CBD5E1',
                              color: isCtrLeader && !v.paused ? '#16A34A' : undefined,
                            }}
                          >
                            CTR {formatPct(v.ctr)}
                          </span>
                        </Tooltip>
                        {v.winning ? (
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#16A34A', marginTop: 2 }}>выигрывает</div>
                        ) : null}
                        {v.losing ? (
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#DC2626', marginTop: 2 }}>проигрывает</div>
                        ) : null}
                      </div>
                      <MetricRow label="Доля показов" value={formatPct(v.sharePercent)} />
                      <MetricRow label="CR1" value={formatPct(v.cr1)} />
                      <MetricRow label="CR" value={formatPct(v.cr)} />
                      <MetricRow label="Показы" value={formatInt(v.views)} />
                      <MetricRow label="Клики" value={formatInt(v.clicks)} />
                      <MetricRow label="В корзину" value={formatInt(v.atbs)} />
                      <MetricRow label="Заказы" value={formatInt(v.orders)} />
                      {(canPause || canResume) && (
                        <Tooltip
                          title={
                            v.paused
                              ? 'Вернуть вариант в ротацию'
                              : 'Исключить из ротации (отсечь проигрывающий)'
                          }
                        >
                          <Button
                            block
                            size="small"
                            style={{
                              marginTop: 10,
                              ...(v.paused
                                ? { background: '#E2E8F0', borderColor: '#CBD5E1', color: '#475569' }
                                : undefined),
                            }}
                            icon={v.paused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                            loading={
                              pauseMutation.isPending && pauseMutation.variables?.variantId === v.id
                            }
                            onClick={() =>
                              pauseMutation.mutate({ variantId: v.id, paused: !v.paused })
                            }
                          >
                            {v.paused ? 'Снять паузу' : 'На паузу'}
                          </Button>
                        </Tooltip>
                      )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
            <EditAbTestSettingsModal
              open={editOpen}
              test={test}
              tokenType={selectedTokenType}
              sellerId={selectedSellerId}
              cabinetId={selectedCabinetId}
              isNarrow={isNarrow}
              onClose={() => setEditOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Модалка изменения настроек запущенного (или запускающегося) А/Б-теста.
 */
function EditAbTestSettingsModal({
  open,
  test,
  tokenType,
  sellerId,
  cabinetId,
  isNarrow,
  onClose,
}: {
  open: boolean
  test: AbTest
  tokenType?: CabinetTokenType | null
  sellerId?: number
  cabinetId?: number | null
  isNarrow: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isBasicToken = (tokenType ?? 'BASIC') === 'BASIC'
  const [rotationMode, setRotationMode] = useState<AbTestRotationMode>(test.rotationMode)
  const [rotationViewsThreshold, setRotationViewsThreshold] = useState(test.rotationViewsThreshold ?? 1000)
  const [rotationIntervalMinutes, setRotationIntervalMinutes] = useState(test.rotationIntervalMinutes ?? 60)
  const [stopMode, setStopMode] = useState<AbTestStopMode>(test.stopMode)
  const [durationDays, setDurationDays] = useState(test.durationDays ?? 7)
  const [finishAction, setFinishAction] = useState<AbTestFinishAction>(test.finishAction)

  useEffect(() => {
    if (!open) return
    setRotationMode(test.rotationMode)
    setRotationViewsThreshold(test.rotationViewsThreshold ?? 1000)
    setRotationIntervalMinutes(test.rotationIntervalMinutes ?? 60)
    setStopMode(test.stopMode)
    setDurationDays(test.durationDays ?? 7)
    setFinishAction(test.finishAction)
  }, [open, test])

  useEffect(() => {
    if (isBasicToken && rotationIntervalMinutes < BASIC_TOKEN_MIN_INTERVAL_MINUTES) {
      setRotationIntervalMinutes(BASIC_TOKEN_MIN_INTERVAL_MINUTES)
    }
  }, [isBasicToken, rotationIntervalMinutes])

  const intervalOptions = [30, 60, 120, 180, 360, 720, 1440].map((v) => ({
    value: v,
    label: v < 60 ? `${v} мин` : `${v / 60} ч`,
    disabled: isBasicToken && v < BASIC_TOKEN_MIN_INTERVAL_MINUTES,
  }))

  const mutation = useMutation({
    mutationFn: (request: UpdateAbTestSettingsRequest) =>
      abTestApi.updateSettings(test.id, request, sellerId, cabinetId ?? undefined),
    onSuccess: (data) => {
      queryClient.setQueryData(['abTest', test.id, sellerId, cabinetId], data)
      queryClient.invalidateQueries({ queryKey: ['abTests'] })
      message.success('Настройки теста обновлены')
      onClose()
    },
    onError: (err: { response?: { data?: { error?: string; message?: string } } }) => {
      message.error(err?.response?.data?.error ?? err?.response?.data?.message ?? 'Не удалось сохранить настройки')
    },
  })

  const submit = () => {
    if (rotationMode === 'ROTATION_BY_VIEWS' && (rotationViewsThreshold == null || rotationViewsThreshold < 1)) {
      message.warning('Укажите порог показов')
      return
    }
    if (
      isBasicToken
      && rotationMode === 'ROTATION_BY_INTERVAL'
      && rotationIntervalMinutes < BASIC_TOKEN_MIN_INTERVAL_MINUTES
    ) {
      message.warning('Для базового токена интервал ротации не меньше 1 часа')
      return
    }
    const request: UpdateAbTestSettingsRequest = {
      rotationMode,
      rotationViewsThreshold: rotationMode === 'ROTATION_BY_VIEWS' ? rotationViewsThreshold : null,
      rotationIntervalMinutes: rotationMode === 'ROTATION_BY_INTERVAL' ? rotationIntervalMinutes : null,
      stopMode,
      durationDays: stopMode === 'BY_DURATION' ? durationDays : null,
      finishAction,
    }
    mutation.mutate(request)
  }

  return (
    <Modal
      title="Изменить настройки теста"
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={mutation.isPending}
      destroyOnClose
      width={isNarrow ? 'calc(100vw - 24px)' : 480}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Периодичность ротации</div>
          <Radio.Group
            value={rotationMode}
            onChange={(e) => setRotationMode(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <Radio value="ROTATION_BY_VIEWS">По набору показов</Radio>
            <Radio value="ROTATION_BY_INTERVAL">По времени</Radio>
          </Radio.Group>
          {rotationMode === 'ROTATION_BY_VIEWS' ? (
            <InputNumber
              style={{ width: isNarrow ? '100%' : 220, marginTop: 8 }}
              min={1}
              step={100}
              value={rotationViewsThreshold}
              onChange={(v) => setRotationViewsThreshold(typeof v === 'number' ? v : 1000)}
              addonAfter="показов"
            />
          ) : (
            <Select
              style={{ width: isNarrow ? '100%' : 220, marginTop: 8 }}
              value={rotationIntervalMinutes}
              onChange={setRotationIntervalMinutes}
              options={intervalOptions}
            />
          )}
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Когда остановить тест</div>
          <Radio.Group
            value={stopMode}
            onChange={(e) => setStopMode(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <Radio value="TRUST_US" style={{ whiteSpace: 'normal' }}>Доверить Clicki (достаточно данных / есть лидер)</Radio>
            <Radio value="BY_DURATION">По истечении срока</Radio>
          </Radio.Group>
          {stopMode === 'BY_DURATION' ? (
            <Select
              style={{ width: isNarrow ? '100%' : 220, marginTop: 8 }}
              value={durationDays}
              onChange={setDurationDays}
              options={[1, 3, 7, 14].map((d) => ({ value: d, label: `${d} дн.` }))}
            />
          ) : null}
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>По завершении</div>
          <Radio.Group
            value={finishAction}
            onChange={(e) => setFinishAction(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <Radio value="KEEP_WINNER" style={{ whiteSpace: 'normal' }}>Оставить фото-победитель</Radio>
            <Radio value="RESTORE_ORIGINAL" style={{ whiteSpace: 'normal' }}>Просто провести тест (вернуть исходное)</Radio>
          </Radio.Group>
        </div>
      </div>
    </Modal>
  )
}

function MetricRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const hint = METRIC_HINTS[label]
  const labelNode = hint ? (
    <Tooltip title={hint}>
      <span style={{ cursor: 'help', borderBottom: '1px dashed #CBD5E1' }}>{label}</span>
    </Tooltip>
  ) : (
    label
  )
  return (
    <div className="ab-test-metric" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, fontSize: 13, padding: '2px 0' }}>
      <span className="ab-test-metric-label" style={{ color: '#64748B', minWidth: 0 }}>{labelNode}</span>
      <span className="ab-test-metric-value" style={{ fontWeight: 600, color: accent ? '#16A34A' : colors.textPrimary }}>{value}</span>
    </div>
  )
}
