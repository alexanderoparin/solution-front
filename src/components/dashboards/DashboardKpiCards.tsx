import { useMemo, useState } from 'react'
import { Spin, Button } from 'antd'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts'
import type { AggregatedMetrics, Period } from '../../types/analytics'
import { colors, shadows, spacing } from '../../styles/analytics'
import {
  KPI_ICON_TONES,
  KPI_PRIMARY,
  KPI_SECONDARY,
  calcChangePercent,
  formatChangePercent,
  formatKpiSparkValue,
  formatKpiValue,
  periodColor,
  type KpiMetricDef,
} from './dashboardConstants'
import { DashboardKpiIcon } from './DashboardKpiIcons'

interface DashboardKpiCardsProps {
  periods: Period[]
  aggregatedMetrics: Record<number, AggregatedMetrics> | null | undefined
  loading: boolean
  error: string | null
  moneySuffix?: string
}

/**
 * KPI в 2 ряда по макету: 5 сверху + 6 снизу; кастомные иконки.
 */
export default function DashboardKpiCards({
  periods,
  aggregatedMetrics,
  loading,
  error,
  moneySuffix = '₽',
}: DashboardKpiCardsProps) {
  const [expanded, setExpanded] = useState(true)

  const sortedPeriods = useMemo(
    () => [...periods].sort((a, b) => a.dateFrom.localeCompare(b.dateFrom)),
    [periods]
  )

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: colors.textPrimary }}>
          Ключевые показатели
        </h2>
        <Button
          type="link"
          onClick={() => setExpanded((v) => !v)}
          icon={expanded ? <UpOutlined /> : <DownOutlined />}
          style={{ paddingInline: 0 }}
        >
          {expanded ? 'Свернуть дашборды' : 'Развернуть дашборды'}
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: spacing.xl }}>
          <Spin />
        </div>
      ) : error ? (
        <div style={{ color: colors.error, padding: spacing.md }}>{error}</div>
      ) : !aggregatedMetrics || sortedPeriods.length === 0 ? (
        <div style={{ color: colors.textMuted, padding: spacing.md }}>
          Нет данных для выбранных фильтров
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="dashboard-kpi-row dashboard-kpi-row-5">
            {KPI_PRIMARY.map((def) => (
              <KpiCard
                key={def.key}
                def={def}
                periods={sortedPeriods}
                aggregatedMetrics={aggregatedMetrics}
                moneySuffix={moneySuffix}
              />
            ))}
          </div>
          {expanded && (
            <div className="dashboard-kpi-row dashboard-kpi-row-6">
              {KPI_SECONDARY.map((def) => (
                <KpiCard
                  key={def.key}
                  def={def}
                  periods={sortedPeriods}
                  aggregatedMetrics={aggregatedMetrics}
                  moneySuffix={moneySuffix}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .dashboard-kpi-row {
          display: grid;
          gap: 12px;
          align-items: start;
        }
        .dashboard-kpi-row-5 {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        .dashboard-kpi-row-6 {
          grid-template-columns: repeat(6, minmax(0, 1fr));
        }
        @media (max-width: 1200px) {
          .dashboard-kpi-row-5,
          .dashboard-kpi-row-6 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 720px) {
          .dashboard-kpi-row-5,
          .dashboard-kpi-row-6 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  )
}

function KpiCard({
  def,
  periods,
  aggregatedMetrics,
  moneySuffix,
}: {
  def: KpiMetricDef
  periods: Period[]
  aggregatedMetrics: Record<number, AggregatedMetrics>
  moneySuffix: string
}) {
  const last = periods[periods.length - 1]
  const prev = periods.length >= 2 ? periods[periods.length - 2] : null
  const lastMetrics = aggregatedMetrics[last.id]
  const prevMetrics = prev ? aggregatedMetrics[prev.id] : null
  const value = lastMetrics?.[def.field] ?? null
  const prevValue = prevMetrics?.[def.field] ?? null
  const change = calcChangePercent(
    value == null ? null : Number(value),
    prevValue == null ? null : Number(prevValue)
  )
  const changeColor =
    change == null
      ? colors.textMuted
      : def.lowerIsBetter
        ? change <= 0
          ? colors.success
          : colors.error
        : change >= 0
          ? colors.success
          : colors.error

  const sparkData = periods.map((p, index) => ({
    i: index,
    v: Number(aggregatedMetrics[p.id]?.[def.field] ?? 0),
    color: periodColor(index),
  }))

  const tone = KPI_ICON_TONES[def.iconTone]
  const label = def.isMoney ? `${def.label}, ${moneySuffix}` : def.label
  /** Неразрывный пробел перед номером — иначе «2» уезжает на следующую строку. */
  const prevPeriodLabel = prev ? `к периоду\u00A0${prev.id}` : null

  return (
    <div
      style={{
        backgroundColor: tone.cardBg,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.sm,
        padding: '16px 12px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: tone.bg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <DashboardKpiIcon metricKey={def.key} color={tone.fg} size={26} />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Название на всю ширину справа от иконки — без конкуренции со sparkline */}
          <div
            style={{
              height: 18,
              fontSize: 12,
              color: colors.textSecondary,
              lineHeight: '18px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 22,
                fontWeight: 700,
                color: colors.textPrimary,
                lineHeight: 1.15,
              }}
            >
              {formatKpiValue(value == null ? null : Number(value), def)}
            </div>
            <div style={{ width: 64, height: 40, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`kpi-spark-${def.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={periodColor(periods.length - 1)} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={periodColor(periods.length - 1)} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={periodColor(periods.length - 1)}
                    fill={`url(#kpi-spark-${def.key})`}
                    strokeWidth={2}
                    dot={(props: { cx?: number; cy?: number; index?: number }) => {
                      const cx = props.cx ?? 0
                      const cy = props.cy ?? 0
                      const index = props.index ?? 0
                      return (
                        <circle
                          key={`dot-${index}`}
                          cx={cx}
                          cy={cy}
                          r={2.5}
                          fill={periodColor(index)}
                          stroke="#fff"
                          strokeWidth={1}
                        />
                      )
                    }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              lineHeight: 1.3,
              marginTop: 2,
              whiteSpace: 'nowrap',
            }}
          >
            {change != null && prevPeriodLabel ? (
              <>
                <span style={{ color: changeColor, fontWeight: 700 }}>
                  {formatChangePercent(change)}
                </span>
                <span style={{ color: colors.textMuted }}> {prevPeriodLabel}</span>
              </>
            ) : (
              <span style={{ color: colors.textMuted }}>—</span>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(sparkData.length, 1)}, minmax(0, 1fr))`,
          gap: 2,
        }}
      >
        {sparkData.map((p) => (
          <div
            key={p.i}
            style={{
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: p.color,
              lineHeight: 1.2,
            }}
            title={`Период ${periods[p.i]?.id}`}
          >
            {formatKpiSparkValue(p.v, def)}
          </div>
        ))}
      </div>
    </div>
  )
}
