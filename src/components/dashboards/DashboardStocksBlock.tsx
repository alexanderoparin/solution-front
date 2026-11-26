import { useMemo } from 'react'
import { Select, Spin, Segmented } from 'antd'
import { AppstoreOutlined } from '@ant-design/icons'
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

type ArticleSelectOption = {
  value: string
  label: string
  title?: string
  vendorCode?: string | null
  photoUrl?: string | null
  isAll?: boolean
}

interface DashboardStocksBlockProps {
  data: DashboardStocksResponse | undefined
  loading: boolean
  error: string | null
  nmId: number | null
  fulfillment: DashboardFulfillment
  onNmIdChange: (nmId: number | null) => void
  onFulfillmentChange: (value: DashboardFulfillment) => void
}

const FBO_COLOR = '#8B5CF6'
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

  const articleOptions = useMemo((): ArticleSelectOption[] => {
    const articles: ArticleSummary[] = data?.articles ?? []
    return [
      {
        value: 'all',
        label: 'Все артикулы',
        title: 'Все артикулы',
        isAll: true,
      },
      ...articles.map((a) => ({
        value: String(a.nmId),
        label: [a.title, a.vendorCode, String(a.nmId)].filter(Boolean).join(' '),
        title: a.title || 'Без названия',
        vendorCode: a.vendorCode,
        photoUrl: a.photoTm ?? a.photoC246x328 ?? null,
        isAll: false,
      })),
    ]
  }, [data?.articles])

  const selectedArticle = useMemo(() => {
    if (nmId == null) return null
    return (data?.articles ?? []).find((a) => a.nmId === nmId) ?? null
  }, [data?.articles, nmId])

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
            style={{ minWidth: 280 }}
            showSearch
            optionFilterProp="label"
            listHeight={360}
            virtual={false}
            popupMatchSelectWidth={360}
            optionRender={(option) => {
              const dataOpt = option.data as ArticleSelectOption
              if (dataOpt.isAll) {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        marginRight: 12,
                        backgroundColor: colors.primaryLight,
                        color: colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 18,
                      }}
                    >
                      <AppstoreOutlined />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>Все</div>
                      <div
                        style={{
                          fontSize: 14,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        Все артикулы
                      </div>
                    </div>
                  </div>
                )
              }
              return (
                <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                  {dataOpt.photoUrl ? (
                    <img
                      src={dataOpt.photoUrl}
                      alt=""
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: 'cover',
                        borderRadius: 4,
                        marginRight: 12,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        marginRight: 12,
                        flexShrink: 0,
                        backgroundColor: colors.bgGray,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>{option.value}</div>
                    <div
                      style={{
                        fontSize: 14,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={dataOpt.title}
                    >
                      {dataOpt.title || '—'}
                    </div>
                  </div>
                </div>
              )
            }}
            labelRender={(props) => {
              if (props.value === 'all' || props.value == null) {
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <AppstoreOutlined style={{ color: colors.primary, flexShrink: 0 }} />
                    <span>Все артикулы</span>
                  </div>
                )
              }
              const photoUrl = selectedArticle?.photoTm ?? selectedArticle?.photoC246x328 ?? null
              const title = selectedArticle?.title || String(props.value)
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt=""
                      style={{
                        width: 22,
                        height: 22,
                        objectFit: 'cover',
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        flexShrink: 0,
                        backgroundColor: colors.bgGray,
                      }}
                    />
                  )}
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {props.value} · {title}
                  </span>
                </div>
              )
            }}
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
              gridTemplateColumns: 'minmax(180px, 220px) minmax(0, 1.8fr) minmax(180px, 0.55fr)',
              gap: spacing.lg,
              alignItems: 'stretch',
            }}
          >
            <div style={{ height: 220, position: 'relative', alignSelf: 'center' }}>
              {/* Подпись «всего» под графиком — иначе перекрывает tooltip */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1,
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
              <div style={{ position: 'relative', zIndex: 2, height: '100%' }}>
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
                    {/* Справа сверху: у крупного FBO якорь иначе в центре и перекрывает «всего» */}
                    <Tooltip
                      position={{ x: 148, y: 8 }}
                      allowEscapeViewBox={{ x: true, y: true }}
                      wrapperStyle={{ zIndex: 20, outline: 'none', pointerEvents: 'none' }}
                      contentStyle={{
                        backgroundColor: colors.bgWhite,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        boxShadow: shadows.sm,
                        padding: '8px 10px',
                      }}
                      formatter={(v: number | string, name: string) => [
                        Number(v).toLocaleString('ru-RU'),
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: spacing.lg, marginBottom: spacing.sm, flexWrap: 'wrap' }}>
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

              {sizeBars.length > 0 ? (
                <div style={{ width: '100%', flex: 1, minHeight: 180 }}>
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
              ) : null}
            </div>

            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ ...typography.bodySmall, marginBottom: spacing.sm, fontWeight: 600 }}>
                По размерам
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  flex: 1,
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {(data.bySize ?? []).map((row) => (
                  <div
                    key={row.size}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '56px 1fr 48px',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
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
