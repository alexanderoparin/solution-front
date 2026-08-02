import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Modal, Select, Checkbox, Radio, Upload, message, Spin, Segmented, Switch, Alert, InputNumber, Tooltip, Tag, Typography } from 'antd'
import { PlusOutlined, PictureOutlined, CloseOutlined, PauseOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { useWorkContextForAdmin } from '../hooks/useWorkContextForAdmin'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
import { analyticsApi } from '../api/analytics'
import { abTestApi } from '../api/abTest'
import { subscriptionApi } from '../api/subscription'
import type {
  AbTest,
  AbTestFinishAction,
  AbTestRotationMode,
  AbTestStopMode,
  CreateAbTestRequest,
} from '../types/abTest'
import type { CabinetTokenType } from '../types/api'
import { colors, borderRadius } from '../styles/analytics'
import AbTestVariantImage from '../components/AbTestVariantImage'
import AbTestPaywallModal from '../components/subscription/AbTestPaywallModal'
import {
  formatFinishLabel,
  formatRotationLabel,
  formatStopLabel,
} from '../utils/abTestLabels'

const accent = '#7C3AED'
/** Минимальный интервал ротации по времени для базового токена (fullstats ≤ 1/час). */
const BASIC_TOKEN_MIN_INTERVAL_MINUTES = 60
/** Размер превью варианта фото в модалке создания. */
const VARIANT_PREVIEW_W = 128
const VARIANT_PREVIEW_H = 170

function formatCtr(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Number(value).toFixed(2)}%`
}

function isWbRateLimitMessage(message: string | null | undefined): boolean {
  if (!message) return false
  return message.includes('Лимит WB по endpoint')
}

function CreateAbTestModal({
  open,
  onClose,
  sellerId,
  cabinetId,
  tokenType,
  onNeedPaywall,
}: {
  open: boolean
  onClose: () => void
  sellerId?: number
  cabinetId: number | null
  tokenType?: CabinetTokenType | null
  onNeedPaywall?: () => void
}) {
  const queryClient = useQueryClient()
  const isBasicToken = (tokenType ?? 'BASIC') === 'BASIC'
  const [nmId, setNmId] = useState<number | null>(null)
  const [advertIds, setAdvertIds] = useState<number[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [rotationMode, setRotationMode] = useState<AbTestRotationMode>('ROTATION_BY_INTERVAL')
  const [rotationViewsThreshold, setRotationViewsThreshold] = useState(1000)
  const [rotationIntervalMinutes, setRotationIntervalMinutes] = useState(60)
  const [stopMode, setStopMode] = useState<AbTestStopMode>('TRUST_US')
  const [durationDays, setDurationDays] = useState(7)
  const [finishAction, setFinishAction] = useState<AbTestFinishAction>('KEEP_WINNER')

  useEffect(() => {
    if (isBasicToken && rotationIntervalMinutes < BASIC_TOKEN_MIN_INTERVAL_MINUTES) {
      setRotationIntervalMinutes(BASIC_TOKEN_MIN_INTERVAL_MINUTES)
    }
  }, [isBasicToken, rotationIntervalMinutes])

  useEffect(() => {
    setFiles([])
    setAdvertIds([])
  }, [nmId])

  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['abTestArticles', sellerId, cabinetId],
    queryFn: () => analyticsApi.getArticleList(sellerId, cabinetId ?? undefined, true),
    enabled: open && cabinetId != null,
  })

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['abTestCampaigns', sellerId, cabinetId, nmId],
    queryFn: () => analyticsApi.getCampaigns(sellerId, cabinetId ?? undefined, undefined, undefined, nmId ?? undefined),
    enabled: open && cabinetId != null && nmId != null,
  })

  const selectedCampaigns = useMemo(() => {
    const byId = new Map(campaigns.map((c) => [c.id, c]))
    return advertIds
      .map((id) => byId.get(id))
      .filter((c): c is (typeof campaigns)[number] => c != null)
  }, [campaigns, advertIds])

  const removeSelectedCampaign = (id: number) => {
    setAdvertIds((prev) => prev.filter((x) => x !== id))
  }
  const selectedArticle = articles.find((a) => a.nmId === nmId)
  const controlPhotoUrl = selectedArticle?.photoC246x328 ?? selectedArticle?.photoTm ?? null

  const filePreviewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])

  useEffect(() => {
    return () => {
      filePreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [filePreviewUrls])

  const createMutation = useMutation({
    mutationFn: (payload: { request: CreateAbTestRequest; files: File[] }) =>
      abTestApi.create(payload.request, payload.files, sellerId, cabinetId ?? undefined),
    onSuccess: () => {
      message.success('А/Б-тест создан, загрузка фото на WB запущена')
      queryClient.invalidateQueries({ queryKey: ['abTests'] })
      queryClient.invalidateQueries({ queryKey: ['cabinetBilling'] })
      onClose()
    },
    onError: (error: any) => {
      const status = error?.response?.status
      const code = error?.response?.data?.code
      if (status === 402 || code === 'AB_TEST_QUOTA_REQUIRED') {
        onClose()
        onNeedPaywall?.()
        return
      }
      message.error(error?.response?.data?.error ?? error?.response?.data?.message ?? 'Не удалось создать тест')
    },
  })

  const intervalOptions = [30, 60, 120, 180, 360, 720, 1440].map((v) => ({
    value: v,
    label: v < 60 ? `${v} мин` : `${v / 60} ч`,
    disabled: isBasicToken && v < BASIC_TOKEN_MIN_INTERVAL_MINUTES,
  }))

  const submit = () => {
    if (cabinetId == null) {
      message.warning('Выберите кабинет')
      return Promise.reject()
    }
    if (nmId == null) {
      message.warning('Выберите карточку')
      return Promise.reject()
    }
    if (advertIds.length === 0) {
      message.warning('Выберите хотя бы одну РК')
      return Promise.reject()
    }
    if (isBasicToken && advertIds.length > 1) {
      message.warning('При базовом токене можно выбрать только одну РК (лимит fullstats — 1 запрос в час)')
      return Promise.reject()
    }
    if (files.length === 0) {
      message.warning('Загрузите хотя бы один дополнительный вариант фото — иначе нечего тестировать')
      return Promise.reject()
    }
    if (rotationMode === 'ROTATION_BY_VIEWS' && (rotationViewsThreshold == null || rotationViewsThreshold < 1)) {
      message.warning('Укажите порог показов для ротации')
      return Promise.reject()
    }
    if (
      isBasicToken
      && rotationMode === 'ROTATION_BY_INTERVAL'
      && rotationIntervalMinutes < BASIC_TOKEN_MIN_INTERVAL_MINUTES
    ) {
      message.error(
        'Интервал меньше 1 часа недоступен для базового токена WB (лимит статистики РК — 1 запрос в час)',
      )
      return Promise.reject()
    }
    const request: CreateAbTestRequest = {
      nmId,
      advertIds,
      rotationMode,
      rotationViewsThreshold: rotationMode === 'ROTATION_BY_VIEWS' ? rotationViewsThreshold : null,
      rotationIntervalMinutes: rotationMode === 'ROTATION_BY_INTERVAL' ? rotationIntervalMinutes : null,
      stopMode,
      durationDays: stopMode === 'BY_DURATION' ? durationDays : null,
      finishAction,
    }
    return createMutation.mutateAsync({ request, files })
  }

  return (
    <>
    <Modal
      title="Новый А/Б-тест"
      open={open}
      onCancel={onClose}
      width={720}
      destroyOnClose
      confirmLoading={createMutation.isPending}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Отмена</Button>
          <Tooltip
            title={files.length === 0 ? 'Без дополнительного фото тест создать нельзя' : undefined}
          >
            <span>
              <Button
                type="primary"
                disabled={files.length === 0}
                loading={createMutation.isPending}
                onClick={() => {
                  void submit()
                }}
              >
                Создать
              </Button>
            </span>
          </Tooltip>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {isBasicToken ? (
          <Alert
            type="warning"
            showIcon
            message="Базовый токен кабинета"
            description="Статистика РК (fullstats) — не чаще 1 запроса в час. Можно выбрать только одну РК; интервал ротации от 1 часа. Либо смените токен на персональный/сервисный."
          />
        ) : null}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Карточка товара</div>
          <Select
            className="ab-test-article-select"
            showSearch
            optionFilterProp="label"
            placeholder="Выберите карточку"
            style={{ width: '100%' }}
            loading={articlesLoading}
            value={nmId ?? undefined}
            onChange={(v) => setNmId(v)}
            listHeight={360}
            virtual={false}
            options={articles.map((a) => ({
              value: a.nmId,
              label: `${a.title ?? 'Без названия'} ${a.nmId}`,
              title: a.title ?? 'Без названия',
              photoUrl: a.photoTm ?? a.photoC246x328 ?? null,
            }))}
            optionRender={(option) => {
              const title = (option.data as { title?: string }).title ?? 'Без названия'
              const photoUrl = (option.data as { photoUrl?: string | null }).photoUrl
              return (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '2px 0' }}>
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt=""
                      style={{
                        width: 36,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 4,
                        flexShrink: 0,
                        background: '#F1F5F9',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 48,
                        borderRadius: 4,
                        flexShrink: 0,
                        background: '#F1F5F9',
                      }}
                    />
                  )}
                  <div style={{ minWidth: 0, lineHeight: 1.3 }}>
                    <div
                      style={{
                        color: '#0F172A',
                        fontSize: 14,
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                      }}
                    >
                      {title}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{option.value}</div>
                  </div>
                </div>
              )
            }}
            labelRender={(props) => {
              const article = articles.find((a) => a.nmId === props.value)
              const title = article?.title ?? 'Без названия'
              const photoUrl = article?.photoTm ?? article?.photoC246x328 ?? null
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, width: '100%' }}>
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt=""
                      style={{
                        width: 36,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 4,
                        flexShrink: 0,
                        background: '#F1F5F9',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 48,
                        borderRadius: 4,
                        flexShrink: 0,
                        background: '#F1F5F9',
                      }}
                    />
                  )}
                  <div style={{ minWidth: 0, flex: 1, lineHeight: 1.3 }}>
                    <div
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 14,
                        color: '#0F172A',
                      }}
                    >
                      {title}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{props.value}</div>
                  </div>
                </div>
              )
            }}
          />
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Выберите РК в которой идут показы</div>
          {isBasicToken ? (
            <div style={{ color: '#64748B', fontSize: 13, marginBottom: 8 }}>
              Базовый токен: доступна только одна РК
            </div>
          ) : null}
          {nmId == null ? (
            <div
              style={{
                padding: 16,
                color: '#94A3B8',
                textAlign: 'center',
                fontSize: 13,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
              }}
            >
              Сначала выберите карточку товара
            </div>
          ) : (
            <>
          {selectedCampaigns.length > 0 ? (
            <div
              style={{
                marginBottom: 8,
                padding: '8px 10px',
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                background: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedCampaigns.map((c) => (
                  <Tag
                    key={c.id}
                    closable
                    onClose={(e) => {
                      e.preventDefault()
                      removeSelectedCampaign(c.id)
                    }}
                    style={{
                      margin: 0,
                      maxWidth: '100%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: '#EEF2FF',
                      borderColor: '#C7D2FE',
                      color: '#312E81',
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 220,
                      }}
                    >
                      {c.name}
                    </span>
                    <span style={{ color: '#64748B', flexShrink: 0 }}>{c.id}</span>
                  </Tag>
                ))}
              </div>
            </div>
          ) : null}
          <Spin spinning={campaignsLoading}>
            <div
              style={{
                maxHeight: 280,
                overflow: 'auto',
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
              }}
            >
              {campaigns.length === 0 ? (
                <div style={{ padding: 16, color: '#94A3B8', textAlign: 'center', fontSize: 13 }}>
                  Нет РК с этим артикулом
                </div>
              ) : (
              <Checkbox.Group
                className="ab-test-campaign-list"
                style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
                value={advertIds}
                onChange={(vals) => {
                  const visibleIds = new Set(campaigns.map((c) => c.id))
                  const preserved = advertIds.filter((id) => !visibleIds.has(id))
                  let next = [...new Set([...preserved, ...(vals as number[])])]
                  if (isBasicToken && next.length > 1) {
                    const added = (vals as number[]).find((id) => !advertIds.includes(id))
                    next = added != null ? [added] : next.slice(-1)
                  }
                  setAdvertIds(next)
                }}
              >
                {campaigns.map((c, idx) => {
                  const running = c.status === 9
                  const disabledByBasic =
                    isBasicToken && advertIds.length === 1 && !advertIds.includes(c.id)
                  return (
                    <Checkbox
                      key={c.id}
                      value={c.id}
                      disabled={disabledByBasic}
                      className="ab-test-campaign-row"
                      style={{
                        margin: 0,
                        width: '100%',
                        padding: '10px 12px',
                        borderBottom: idx < campaigns.length - 1 ? `1px solid ${colors.border}` : undefined,
                        opacity: disabledByBasic ? 0.55 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          width: '100%',
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontWeight: 600,
                            color: '#0F172A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.name}
                        </span>
                        <span
                          style={{
                            flexShrink: 0,
                            minWidth: 72,
                            color: '#64748B',
                            fontSize: 13,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {c.id}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            flexShrink: 0,
                            padding: '4px 12px',
                            borderRadius: 999,
                            background: running ? '#ECFDF5' : '#F1F5F9',
                            color: running ? '#16A34A' : '#64748B',
                            fontSize: 12,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {running ? (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#16A34A',
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <PauseOutlined style={{ fontSize: 11 }} />
                          )}
                          {running ? 'Работает' : 'Остановлен'}
                        </span>
                      </div>
                    </Checkbox>
                  )
                })}
              </Checkbox.Group>
              )}
            </div>
          </Spin>
            </>
          )}
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Варианты фото</div>
          <div style={{ color: '#64748B', fontSize: 13, marginBottom: 8 }}>
            Вариант 1 — текущее главное фото. Загрузите хотя бы ещё один вариант для теста.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: VARIANT_PREVIEW_W,
                height: VARIANT_PREVIEW_H,
                borderRadius: 8,
                overflow: 'hidden',
                background: '#F1F5F9',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {controlPhotoUrl ? (
                <img
                  src={controlPhotoUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', padding: 8 }}>
                  {nmId == null ? 'Выберите карточку' : 'Нет фото'}
                </span>
              )}
            </div>

            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                style={{
                  position: 'relative',
                  width: VARIANT_PREVIEW_W,
                  height: VARIANT_PREVIEW_H,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#F1F5F9',
                  flexShrink: 0,
                }}
              >
                <img
                  src={filePreviewUrls[index]}
                  alt={file.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  aria-label="Удалить вариант"
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    border: 'none',
                    borderRadius: '50%',
                    background: 'rgba(15, 23, 42, 0.65)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <CloseOutlined style={{ fontSize: 10 }} />
                </button>
              </div>
            ))}

            <Upload.Dragger
              className="ab-test-photo-upload"
              multiple
              accept=".jpg,.jpeg,.png,.bmp,.gif,.webp"
              showUploadList={false}
              beforeUpload={(file) => {
                setFiles((prev) => [...prev, file as unknown as File])
                return false
              }}
              style={{
                width: VARIANT_PREVIEW_W,
                height: VARIANT_PREVIEW_H,
                margin: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '8px 6px',
                  gap: 6,
                  boxSizing: 'border-box',
                }}
              >
                <PictureOutlined style={{ fontSize: 22, color: '#94A3B8' }} />
                <div style={{ fontSize: 11, color: '#0F172A', lineHeight: 1.3, textAlign: 'center' }}>
                  Перетащите сюда файл или кликните
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.3, textAlign: 'center' }}>
                  min 700×900
                  <br />
                  max 32 Мб
                  <br />
                  JPG, PNG, BMP, GIF, WebP
                </div>
              </div>
            </Upload.Dragger>
          </div>
        </div>

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
              style={{ width: 220, marginTop: 8 }}
              min={1}
              step={100}
              value={rotationViewsThreshold}
              onChange={(v) => setRotationViewsThreshold(typeof v === 'number' ? v : 1000)}
              addonAfter="показов"
            />
          ) : (
            <Select
              style={{ width: 220, marginTop: 8 }}
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
            <Radio value="TRUST_US">Доверить Clicki (достаточно данных / есть лидер)</Radio>
            <Radio value="BY_DURATION">По истечении срока</Radio>
          </Radio.Group>
          {stopMode === 'BY_DURATION' ? (
            <Select
              style={{ width: 220, marginTop: 8 }}
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
            <Radio value="KEEP_WINNER">Оставить фото-победитель</Radio>
            <Radio value="RESTORE_ORIGINAL">Просто провести тест (вернуть исходное)</Radio>
          </Radio.Group>
        </div>
      </div>
    </Modal>
    </>
  )
}

function AbTestCard({
  item,
  onToggle,
  toggling,
  sellerId,
  cabinetId,
}: {
  item: AbTest
  onToggle: (enabled: boolean) => void
  toggling: boolean
  sellerId?: number
  cabinetId?: number | null
}) {
  const advertLabel =
    item.advertIds?.length ? `рк ${item.advertIds.join(', ')}` : 'рк —'
  const dateLabel =
    item.status === 'PENDING_START'
      ? `Создан: ${item.startedAt ? dayjs(item.startedAt).format('DD.MM.YYYY HH:mm') : '—'}`
      : item.status === 'ENABLED'
        ? `Запущен: ${item.startedAt ? dayjs(item.startedAt).format('DD.MM.YYYY HH:mm') : '—'}`
        : `Работал: ${item.startedAt ? dayjs(item.startedAt).format('DD.MM.YYYY HH:mm') : '—'} — ${
            item.finishedAt ? dayjs(item.finishedAt).format('DD.MM.YYYY HH:mm') : '—'
          }`

  const statusBadge =
    item.status === 'PENDING_START'
      ? { bg: '#FEF3C7', color: '#92400E', text: 'Запускается' }
      : item.status === 'ENABLED'
        ? { bg: '#DCFCE7', color: '#166534', text: 'Включен' }
        : { bg: '#F1F5F9', color: '#64748B', text: 'Отключен' }

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        padding: 16,
        background: '#fff',
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.lg,
        alignItems: 'flex-start',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 360 }}>
        {item.variants.map((v) => (
          <Link key={v.id} to={`/advertising/ab-test/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: 72 }}>
              <div style={{ position: 'relative', width: 72, height: 96 }}>
                <AbTestVariantImage
                  testId={item.id}
                  variantId={v.id}
                  hasLocalImage={v.hasLocalImage}
                  photoUrl={v.photoUrl}
                  previewUrl={v.previewUrl}
                  sellerId={sellerId}
                  cabinetId={cabinetId}
                  style={{
                    width: 72,
                    height: 96,
                    objectFit: 'cover',
                    borderRadius: 8,
                    background: '#F1F5F9',
                    filter: v.paused ? 'grayscale(1)' : 'none',
                    opacity: v.paused ? 0.55 : 1,
                    display: 'block',
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
                        gap: 5,
                        alignItems: 'stretch',
                        height: 22,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          borderRadius: 2,
                          background: 'rgba(51, 65, 85, 0.88)',
                        }}
                      />
                      <span
                        style={{
                          width: 6,
                          borderRadius: 2,
                          background: 'rgba(51, 65, 85, 0.88)',
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              <div style={{ fontSize: 12, marginTop: 4, fontWeight: 600 }}>CTR {formatCtr(v.ctr)}</div>
              {v.paused ? <div style={{ fontSize: 11, color: '#64748B' }}>на паузе</div> : null}
              {v.winning ? <div style={{ fontSize: 11, color: '#16A34A' }}>выигрывает</div> : null}
              {v.losing ? <div style={{ fontSize: 11, color: '#DC2626' }}>проигрывает</div> : null}
            </div>
          </Link>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link to={`/advertising/ab-test/${item.id}`} style={{ color: colors.textPrimary, fontWeight: 600, fontSize: 15 }}>
          {item.title ?? `Артикул ${item.nmId}`}
        </Link>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
          {item.nmId} · {advertLabel}
        </div>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>{dateLabel}</div>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>{formatRotationLabel(item)}</div>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>{formatStopLabel(item)}</div>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>{formatFinishLabel(item)}</div>
        {item.insightLabel ? (
          <div style={{ marginTop: 8, fontSize: 13, color: '#64748B' }}>{item.insightLabel}</div>
        ) : null}
        {item.lastWbError && !isWbRateLimitMessage(item.lastWbError) ? (
          <div style={{ marginTop: 6, fontSize: 12, color: '#DC2626' }}>{item.lastWbError}</div>
        ) : null}
        {item.status === 'PENDING_START' && item.lastWbError && isWbRateLimitMessage(item.lastWbError) ? (
          <div style={{ marginTop: 6, fontSize: 12, color: '#64748B' }}>
            Ожидание лимита WB, повтор запуска…
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: statusBadge.bg,
            color: statusBadge.color,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {statusBadge.text}
        </span>
        <Switch
          checked={item.status === 'ENABLED' || item.status === 'PENDING_START'}
          loading={toggling}
          onChange={onToggle}
          disabled={item.status === 'DISABLED' || item.status === 'PENDING_START'}
        />
      </div>
    </div>
  )
}

export default function AbTests() {
  const role = useAuthStore((state) => state.role)
  const isAdmin = role === 'ADMIN'
  const workContext = useWorkContextForAdmin(isAdmin)
  const queryClient = useQueryClient()
  const [sellerSelectedCabinetId, setSellerSelectedCabinetId] = useState<number | null>(() => getStoredCabinetId())
  const [filter, setFilter] = useState<'active' | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)

  const selectedCabinetId = isAdmin ? workContext.selectedCabinetId : sellerSelectedCabinetId
  const selectedSellerId = isAdmin ? workContext.selectedSellerId : undefined

  const { data: myCabinets = [] } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'USER',
  })

  useEffect(() => {
    if (!isAdmin && myCabinets.length > 0 && sellerSelectedCabinetId === null) {
      setSellerSelectedCabinetId(myCabinets[0].id)
      setStoredCabinetId(myCabinets[0].id)
    }
  }, [isAdmin, myCabinets, sellerSelectedCabinetId])

  const selectedTokenType: CabinetTokenType | null | undefined = useMemo(() => {
    if (selectedCabinetId == null) return null
    if (isAdmin) {
      return workContext.workContextOptions.find((o) => o.cabinetId === selectedCabinetId)?.tokenType ?? null
    }
    return myCabinets.find((c) => c.id === selectedCabinetId)?.apiKey?.tokenType ?? null
  }, [isAdmin, selectedCabinetId, workContext.workContextOptions, myCabinets])

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['abTests', selectedSellerId, selectedCabinetId, filter],
    queryFn: () => abTestApi.list(selectedSellerId, selectedCabinetId ?? undefined, filter === 'active'),
    enabled: selectedCabinetId != null,
    refetchInterval: (query) => {
      const data = query.state.data
      return Array.isArray(data) && data.some((t) => t.status === 'PENDING_START') ? 5000 : false
    },
  })

  const { data: billing } = useQuery({
    queryKey: ['cabinetBilling', selectedCabinetId],
    queryFn: () => subscriptionApi.getCabinetBillingStatus(selectedCabinetId!),
    enabled: selectedCabinetId != null,
  })

  const abQuota = billing?.abTestQuota
  const abServiceReady = Boolean(abQuota?.unlimited || abQuota?.activated)
  const quotaLabel = useMemo(() => {
    if (!abQuota || !abServiceReady) return null
    if (abQuota.unlimited) return 'А/Б безлимит (PRO)'
    const remaining = abQuota.remaining ?? 0
    const used = abQuota.usedStarts ?? 0
    const total = remaining + used
    return `Доступно тестов: ${remaining} из ${total || (abQuota.includedFree ?? 3)}`
  }, [abQuota, abServiceReady])

  const openCreate = () => {
    if (selectedCabinetId == null) return
    if (!abServiceReady) {
      setPaywallOpen(true)
      return
    }
    if (!abQuota?.unlimited && (abQuota?.remaining ?? 0) <= 0) {
      setPaywallOpen(true)
      return
    }
    setCreateOpen(true)
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) =>
      abTestApi.updateStatus(id, enabled ? 'ENABLED' : 'DISABLED', selectedSellerId, selectedCabinetId ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abTests'] })
      queryClient.invalidateQueries({ queryKey: ['cabinetBilling', selectedCabinetId] })
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error ?? 'Не удалось изменить статус')
    },
  })

  const cabinetSelectProps = useMemo(() => {
    if (isAdmin) return undefined
    return {
      cabinets: myCabinets.map((c) => ({ id: c.id, name: c.name })),
      selectedCabinetId,
      onCabinetChange: (id: number | null) => {
        if (id == null) return
        setSellerSelectedCabinetId(id)
        setStoredCabinetId(id)
      },
      loading: false,
    }
  }, [isAdmin, myCabinets, selectedCabinetId])

  return (
    <div style={{ minHeight: '100vh', background: colors.bgGray }}>
      <Header
        cabinetSelectProps={cabinetSelectProps}
        workContextCabinetSelect={isAdmin ? workContext.workContextCabinetSelectProps : undefined}
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 48px' }}>
        <Breadcrumbs />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: accent, borderColor: accent }}
              onClick={openCreate}
              disabled={selectedCabinetId == null}
            >
              Создать новый тест
            </Button>
            {quotaLabel ? (
              <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                {quotaLabel}
              </Typography.Text>
            ) : null}
          </div>
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as 'active' | 'all')}
            options={[
              { label: 'Активные', value: 'active' },
              { label: 'Все', value: 'all' },
            ]}
          />
        </div>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : tests.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748B', padding: 48 }}>Нет А/Б-тестов</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tests.map((item) => (
              <AbTestCard
                key={item.id}
                item={item}
                sellerId={selectedSellerId}
                cabinetId={selectedCabinetId}
                toggling={statusMutation.isPending && statusMutation.variables?.id === item.id}
                onToggle={(enabled) => {
                  if (!enabled) {
                    statusMutation.mutate({ id: item.id, enabled: false })
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
      <CreateAbTestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        sellerId={selectedSellerId}
        cabinetId={selectedCabinetId}
        tokenType={selectedTokenType}
        onNeedPaywall={() => setPaywallOpen(true)}
      />
      <AbTestPaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  )
}
