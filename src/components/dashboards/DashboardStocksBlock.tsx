import { useMemo } from 'react'
import { Select, Spin, Segmented } from 'antd'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import dayjs from 'dayjs'
import type { ArticleSummary, DashboardFulfillment, DashboardStocksResponse } from '../../types/analytics'
import { colors, borderRadius, shadows, spacing, typography } from '../../styles/analytics'

interface DashboardStocksBlockProps {
  data: DashboardStocksResponse | undefined
  loading: boolean
  error: string | null
  nmId: number | null
  fulfillment: DashboardFulfillment
  onNmIdChange: (nmId: number | null) => void
  onFulfillmentChange: (value: DashboardFulfillment) => void
}

const FBO_COLOR = '#3B82F6'
const FBS_COLOR = '#10B981'

/**
 * Остатки: donut FBO/FBS, bar по размерам, список размеров, время обновления.
 */
export default function DashboardStocksBlock({
  data,
  loading,
  error,
  nmId,
  fulfillment,
  onNmIdChange,
  onFulfillmentChange,
}: DashboardStocksBlockProps) {
  const donutData = useMemo(() => {
    if (!data) return []
    return [
      { name: 'FBO', value: data.fbo, color: FBO_COLOR },
      { name: 'FBS', value: data.fbs, color: FBS_COLOR },
    ].filter((d) => d.value > 0)
  }, [data])

  const sizeBars = useMemo(() => {
    if (!data?.bySize) return []
    return data.bySize
      .filter((s) => s.total > 0)
      .map((s) => ({
        size: s.size,
        fbo: s.fbo,
        fbs: s.fbs,
        total: s.total,
      }))
  }, [data])

  const maxSizeTotal = useMemo(
    () => sizeBars.reduce((max, s) => Math.max(max, s.total), 0) || 1,
    [sizeBars]
  )

  const articleOptions = useMemo(() => {
    const articles: ArticleSummary[] = data?.articles ?? []
    return [
      { value: 'all', label: 'Все артикулы' },
      ...articles.map((a) => ({
        value: String(a.nmId),
        label: a.vendorCode ? `${a.vendorCode} · ${a.nmId}` : String(a.nmId),
      })),
    ]
  }, [data?.articles])

  return (
    <div
      style={{
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.sm,
        padding: spacing.lg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <div style={{ ...typography.h3 }}>Складские остатки</div>
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            value={nmId == null ? 'all' : String(nmId)}
            onChange={(v) => onNmIdChange(v === 'all' ? null : Number(v))}
            options={articleOptions}
            style={{ minWidth: 200 }}
            showSearch
            optionFilterProp="label"
          />
          <Segmented
            value={fulfillment}
            onChange={(v) => onFulfillmentChange(v as DashboardFulfillment)}
            options={[
              { label: 'Все', value: 'ALL' },
              { label: 'FBO', value: 'FBO' },
              { label: 'FBS', value: 'FBS' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </div>
      ) : error ? (
        <div style={{ color: colors.error }}>{error}</div>
      ) : !data || data.total === 0 ? (
        <div style={{ color: colors.textMuted }}>Нет остатков по выбранным фильтрам</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 260px) 1fr',
              gap: spacing.lg,
              alignItems: 'center',
            }}
          >
            <div style={{ height: 200, position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={donutData.length > 0 ? donutData : [{ name: 'empty', value: 1, color: colors.border }]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {(donutData.length > 0 ? donutData : [{ color: colors.border }]).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number | string) => Number(v).toLocaleString('ru-RU')} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700 }}>{data.total.toLocaleString('ru-RU')}</div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>всего</div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', gap: spacing.lg, marginBottom: spacing.md, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>FBO</div>
                  <div style={{ fontWeight: 700, color: FBO_COLOR }}>
                    {data.fbo.toLocaleString('ru-RU')}
                    <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 6, color: colors.textSecondary }}>
                      {Number(data.fboSharePercent).toLocaleString('ru-RU')}%
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>FBS</div>
                  <div style={{ fontWeight: 700, color: FBS_COLOR }}>
                    {data.fbs.toLocaleString('ru-RU')}
                    <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 6, color: colors.textSecondary }}>
                      {Number(data.fbsSharePercent).toLocaleString('ru-RU')}%
                    </span>
                  </div>
                </div>
              </div>

              {sizeBars.length > 0 && (
                <div style={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer>
                    <BarChart data={sizeBars} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="size" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={40} />
                      <Tooltip />
                      {(fulfillment === 'ALL' || fulfillment === 'FBO') && (
                        <Bar dataKey="fbo" stackId="a" fill={FBO_COLOR} name="FBO" />
                      )}
                      {(fulfillment === 'ALL' || fulfillment === 'FBS') && (
                        <Bar dataKey="fbs" stackId="a" fill={FBS_COLOR} name="FBS" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: spacing.lg }}>
            <div style={{ ...typography.bodySmall, marginBottom: spacing.sm, fontWeight: 600 }}>
              По размерам
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(data.bySize ?? []).map((row) => (
                <div key={row.size} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 48px', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: colors.textSecondary }}>{row.size}</span>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 6,
                      backgroundColor: colors.bgGrayLight,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round((row.total / maxSizeTotal) * 100)}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${FBO_COLOR} 0%, ${FBS_COLOR} 100%)`,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>
                    {row.total.toLocaleString('ru-RU')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: spacing.md, fontSize: 12, color: colors.textMuted }}>
            Обновлено:{' '}
            {data.updatedAt ? dayjs(data.updatedAt).format('DD.MM.YYYY HH:mm') : '—'}
          </div>
        </>
      )}
    </div>
  )
}
