import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Spin, Tooltip, message } from 'antd'
import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { useWorkContextForAdmin } from '../hooks/useWorkContextForAdmin'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
import { abTestApi } from '../api/abTest'
import { colors, borderRadius } from '../styles/analytics'
import AbTestVariantImage from '../components/AbTestVariantImage'

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
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const isAdmin = role === 'ADMIN'
  const workContext = useWorkContextForAdmin(isAdmin)
  const [sellerSelectedCabinetId, setSellerSelectedCabinetId] = useState<number | null>(() => getStoredCabinetId())

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

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['abTest', testId, selectedSellerId, selectedCabinetId],
    queryFn: () => abTestApi.get(testId, selectedSellerId, selectedCabinetId ?? undefined),
    enabled: Number.isFinite(testId) && selectedCabinetId != null,
  })

  useEffect(() => {
    if (error) {
      message.error('Не удалось загрузить А/Б-тест')
    }
  }, [error])

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
      cabinets: myCabinets.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })),
      selectedCabinetId,
      onCabinetChange: (cid: number | null) => {
        if (cid == null) return
        setSellerSelectedCabinetId(cid)
        setStoredCabinetId(cid)
      },
      loading: false,
    }
  }, [isAdmin, myCabinets, selectedCabinetId])

  const activeUnpausedCount = test?.variants.filter((v) => !v.paused).length ?? 0

  return (
    <div style={{ minHeight: '100vh', background: colors.bgGray }}>
      <Header
        cabinetSelectProps={cabinetSelectProps}
        workContextCabinetSelect={isAdmin ? workContext.workContextCabinetSelectProps : undefined}
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 48px' }}>
        <Breadcrumbs />
        {isLoading || !test ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '16px 0 8px' }}>{test.title ?? `Артикул ${test.nmId}`}</h1>
            <div style={{ color: '#64748B', marginBottom: 24 }}>
              {test.nmId}
              {test.advertIds?.length ? ` · рк ${test.advertIds.join(', ')}` : ''}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(test.variants.length, 5)}, minmax(140px, 1fr))`,
                gap: 16,
              }}
            >
              {(() => {
                const bestCtr = Math.max(...test.variants.map((x) => Number(x.ctr) || 0))
                return test.variants.map((v) => {
                  const isCtrLeader = bestCtr > 0 && Number(v.ctr) === bestCtr
                  const showInColor = v.activeOnWb && !v.paused
                  const canPause = test.status === 'ENABLED' && !v.paused && activeUnpausedCount > 1
                  const canResume = test.status === 'ENABLED' && !!v.paused
                  return (
                    <div
                      key={v.id}
                      style={{
                        background: '#fff',
                        border: `1px solid ${colors.border}`,
                        borderRadius: borderRadius.lg,
                        padding: 12,
                        opacity: v.paused ? 0.7 : v.activeOnWb ? 1 : 0.85,
                      }}
                    >
                      <div style={{ height: 22, marginBottom: 6 }}>
                        {v.activeOnWb && !v.paused ? (
                          <span style={{ color: '#16A34A', fontWeight: 600, fontSize: 13 }}>Сейчас на ВБ</span>
                        ) : null}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <AbTestVariantImage
                          testId={test.id}
                          variantId={v.id}
                          hasLocalImage={v.hasLocalImage}
                          photoUrl={v.photoUrl}
                          previewUrl={v.previewUrl}
                          sellerId={selectedSellerId}
                          cabinetId={selectedCabinetId}
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
                      <div style={{ marginTop: 10, fontWeight: 700, marginBottom: 8 }}>
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
                  )
                })
              })()}
            </div>
          </>
        )}
      </div>
    </div>
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
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
      <span style={{ color: '#64748B' }}>{labelNode}</span>
      <span style={{ fontWeight: 600, color: accent ? '#16A34A' : colors.textPrimary }}>{value}</span>
    </div>
  )
}
