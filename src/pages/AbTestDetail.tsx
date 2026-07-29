import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Spin, message } from 'antd'
import { useQuery } from '@tanstack/react-query'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useAuthStore } from '../store/authStore'
import { useWorkContextForAdmin } from '../hooks/useWorkContextForAdmin'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
import { abTestApi } from '../api/abTest'
import { colors, borderRadius } from '../styles/analytics'

function formatPct(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Number(value).toFixed(2)}%`
}

function formatInt(value: number | null | undefined): string {
  if (value == null) return '—'
  return Number(value).toLocaleString('ru-RU')
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
              {test.variants.map((v) => (
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
                    <img
                      src={v.previewUrl ?? v.photoUrl ?? ''}
                      alt=""
                      style={{
                        width: '100%',
                        aspectRatio: '3/4',
                        objectFit: 'cover',
                        borderRadius: 8,
                        filter: v.activeOnWb ? 'none' : 'grayscale(0.85)',
                        background: '#F1F5F9',
                      }}
                    />
                  </div>
                  <div style={{ marginTop: 10, fontWeight: 700 }}>CTR {formatPct(v.ctr)}</div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>{formatPct(v.sharePercent)}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>Реклама</div>
                  <MetricRow label="CTR" value={formatPct(v.ctr)} accent />
                  <MetricRow label="CR1" value={formatPct(v.cr1)} />
                  <MetricRow label="CR" value={formatPct(v.cr)} />
                  <MetricRow label="Показы" value={formatInt(v.views)} />
                  <MetricRow label="Клики" value={formatInt(v.clicks)} />
                  <MetricRow label="В корзину" value={formatInt(v.atbs)} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MetricRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
      <span style={{ color: '#64748B' }}>{label}</span>
      <span style={{ fontWeight: 600, color: accent ? '#16A34A' : colors.textPrimary }}>{value}</span>
    </div>
  )
}
