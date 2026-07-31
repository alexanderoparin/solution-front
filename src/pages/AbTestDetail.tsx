import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Spin, Tooltip, message } from 'antd'
import { useQuery } from '@tanstack/react-query'
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
                return (
                <div
                  key={v.id}
                  style={{
                    background: '#fff',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.lg,
                    padding: 12,
                    opacity: v.activeOnWb ? 1 : 0.85,
                  }}
                >
                  {v.activeOnWb ? (
                    <div style={{ color: '#16A34A', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Сейчас на ВБ</div>
                  ) : (
                    <div style={{ height: 22 }} />
                  )}
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
                        filter: v.activeOnWb ? 'none' : 'grayscale(1)',
                        opacity: v.activeOnWb ? 1 : 0.9,
                        outline: v.activeOnWb ? `2px solid ${colors.primary}` : 'none',
                        outlineOffset: 2,
                        background: '#F1F5F9',
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 10, fontWeight: 700, marginBottom: 8 }}>
                    <Tooltip title={METRIC_HINTS.CTR}>
                      <span
                        style={{
                          cursor: 'help',
                          borderBottom: '1px dashed #CBD5E1',
                          color: isCtrLeader ? '#16A34A' : undefined,
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
