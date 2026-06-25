import { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceDot,
} from 'recharts'
import dayjs from 'dayjs'
import type { CampaignBudgetChartData } from '../../types/analytics'
import { colors } from '../../styles/analytics'

/** Лаймовый — линия бюджета и маркер запуска РК. */
const BUDGET_LINE = '#B4D705'
/** Фон активного слота (как в легенде и на графике). */
const ACTIVE_BG = 'rgba(180, 215, 5, 0.15)'
/** Фон неактивного слота. */
const INACTIVE_BG = colors.border
/** Пополнения — фирменный фиолетовый. */
const TOP_UP_COLOR = colors.primary
/** Маркер паузы РК. */
const STOP_COLOR = '#64748B'

/** Половина ширины фиолетового столбца пополнения на оси времени, мс. */
const TOP_UP_BAR_HALF_WIDTH_MS = 18 * 60 * 1000

const CHART_HEIGHT = 280

interface CampaignBudgetChartProps {
  data: CampaignBudgetChartData | undefined
  loading?: boolean
}

interface ChartRow {
  at: string
  budgetRub: number | null
  ts: number
}

interface TopUpMarker {
  at: string
  ts: number
  amount: number
  budgetBefore: number
  budgetAfter: number
}

function formatRub(value: number): string {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`
}

function computeYMax(budgets: number[], topUpBands: TopUpMarker[]): number {
  const topUpTops = topUpBands.map((t) => t.budgetAfter)
  const rawMax = Math.max(100, ...budgets, ...topUpTops, 0)
  return Math.ceil(rawMax * 1.15)
}

function resolveTopUpBand(points: ChartRow[], topUp: { ts: number; amount: number }): {
  budgetBefore: number
  budgetAfter: number
} {
  let budgetBefore = 0
  let budgetAfter = 0
  for (const p of points) {
    if (p.budgetRub == null) continue
    if (p.ts < topUp.ts) {
      budgetBefore = p.budgetRub
    }
    if (p.ts >= topUp.ts) {
      budgetAfter = p.budgetRub
      break
    }
  }
  if (budgetAfter <= budgetBefore) {
    budgetAfter = budgetBefore + topUp.amount
  }
  return { budgetBefore, budgetAfter }
}

function findBudgetAt(points: ChartRow[], at: string): number {
  const ts = dayjs(at).valueOf()
  let budget = 0
  for (const p of points) {
    if (p.ts <= ts && p.budgetRub != null) {
      budget = p.budgetRub
    }
  }
  return budget
}

function buildBudgetRows(data: CampaignBudgetChartData): ChartRow[] {
  const sorted = toChartRows(data)
  if (sorted.length <= 2) return sorted

  const simplified: ChartRow[] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const previous = simplified[simplified.length - 1]
    if (current.budgetRub !== previous.budgetRub) {
      simplified.push(current)
    }
  }
  const lastInput = sorted[sorted.length - 1]
  const lastKept = simplified[simplified.length - 1]
  if (lastKept.ts !== lastInput.ts) {
    simplified.push(lastInput)
  }
  return simplified
}

function toChartRows(data: CampaignBudgetChartData): ChartRow[] {
  return data.budgetPoints
    .map((p) => ({
      at: p.at,
      budgetRub: p.budgetRub,
      ts: dayjs(p.at).valueOf(),
    }))
    .sort((a, b) => a.ts - b.ts)
}

function buildTopUpMarkers(data: CampaignBudgetChartData, rows: ChartRow[]): TopUpMarker[] {
  return data.markers
    .filter((m) => m.type === 'TOP_UP' && m.amount != null && m.amount > 0)
    .map((m) => {
      const ts = dayjs(m.at).valueOf()
      const amount = m.amount!
      const { budgetBefore, budgetAfter } = resolveTopUpBand(rows, { ts, amount })
      return {
        at: m.at,
        ts,
        amount,
        budgetBefore,
        budgetAfter,
      }
    })
    .sort((a, b) => a.ts - b.ts)
}

export default function CampaignBudgetChart({ data, loading }: CampaignBudgetChartProps) {
  const { rows, topUps, xDomain, yMax, startMarkers, stopMarkers } = useMemo(() => {
    if (!data) {
      return {
        rows: [] as ChartRow[],
        topUps: [] as TopUpMarker[],
        xDomain: [0, 1] as [number, number],
        yMax: 100,
        startMarkers: [],
        stopMarkers: [],
      }
    }

    const allRows = toChartRows(data)
    const rows = buildBudgetRows(data)
    const topUps = buildTopUpMarkers(data, allRows)

    const allBudgets = rows.map((r) => r.budgetRub ?? 0)
    const yMax = computeYMax(allBudgets, topUps)

    const xDomain: [number, number] = [
      dayjs(data.periodFrom).valueOf(),
      dayjs(data.periodTo).valueOf(),
    ]

    const startMarkers = data.markers
      .filter((m) => m.type === 'START')
      .map((m) => ({ at: m.at, ts: dayjs(m.at).valueOf(), y: findBudgetAt(rows, m.at) }))
    const stopMarkers = data.markers
      .filter((m) => m.type === 'STOP')
      .map((m) => ({ at: m.at, ts: dayjs(m.at).valueOf(), y: findBudgetAt(rows, m.at) }))

    return { rows, topUps, xDomain, yMax, startMarkers, stopMarkers }
  }, [data])

  if (loading) {
    return <p style={{ color: colors.textSecondary, margin: 0 }}>Загрузка графика…</p>
  }

  if (!data || rows.length === 0) {
    return (
      <p style={{ color: colors.textSecondary, margin: 0 }}>
        Данные графика накапливаются. Первые точки появятся после работы РК по расписанию.
      </p>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 12, fontSize: 12, color: colors.textSecondary }}>
        <LegendItem color={BUDGET_LINE} label="Бюджет" line />
        <LegendItem color={TOP_UP_COLOR} label="Пополнено" bar />
        <LegendItem color={BUDGET_LINE} label="РК запущена" symbol="▷" />
        <LegendItem color={STOP_COLOR} label="РК приостановлена" symbol="Ⅱ" />
        <LegendItem color={ACTIVE_BG} label="Активна (фон)" box />
        <LegendItem color={INACTIVE_BG} label="Не активна (фон)" box />
      </div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ComposedChart data={rows} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
          {data.intervals.map((interval, idx) => (
            <ReferenceArea
              key={`interval-${interval.from}-${idx}`}
              x1={dayjs(interval.from).valueOf()}
              x2={dayjs(interval.to).valueOf()}
              y1={0}
              y2={yMax}
              fill={interval.active ? ACTIVE_BG : INACTIVE_BG}
              fillOpacity={1}
              ifOverflow="extendDomain"
            />
          ))}
          {topUps.map((topUp, idx) => (
            <ReferenceArea
              key={`topup-${topUp.at}-${idx}`}
              x1={topUp.ts - TOP_UP_BAR_HALF_WIDTH_MS}
              x2={topUp.ts + TOP_UP_BAR_HALF_WIDTH_MS}
              y1={topUp.budgetBefore}
              y2={topUp.budgetAfter}
              fill={TOP_UP_COLOR}
              fillOpacity={0.92}
              stroke={TOP_UP_COLOR}
              strokeWidth={1}
              ifOverflow="visible"
            />
          ))}
          <CartesianGrid strokeDasharray="3 3" stroke={colors.borderLight} />
          <XAxis
            dataKey="ts"
            type="number"
            domain={xDomain}
            tickFormatter={(ts) => dayjs(ts).format('DD.MM\nHH:mm')}
            tick={{ fontSize: 10, fill: colors.textSecondary }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatRub}
            allowDecimals={false}
            tick={{ fontSize: 11, fill: colors.textSecondary }}
            width={72}
            domain={[0, yMax]}
          />
          <Tooltip
            labelFormatter={(ts) => dayjs(ts as number).format('DD.MM.YYYY HH:mm')}
            formatter={(value: number, name: string) => {
              if (name === 'budgetRub') return [formatRub(value), 'Бюджет']
              return [value, name]
            }}
            content={({ active, payload, label }) => {
              if (!active || label == null) return null
              const ts = Number(label)
              const budgetRow = payload?.find((p) => p.dataKey === 'budgetRub')
              const budgetVal = budgetRow?.value as number | undefined
              const nearTopUp = topUps.find((t) => Math.abs(t.ts - ts) <= TOP_UP_BAR_HALF_WIDTH_MS)
              return (
                <div
                  style={{
                    background: colors.bgWhite,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 12,
                  }}
                >
                  <div style={{ marginBottom: 4, color: colors.textSecondary }}>
                    {dayjs(ts).format('DD.MM.YYYY HH:mm')}
                  </div>
                  {budgetVal != null && (
                    <div style={{ color: BUDGET_LINE, fontWeight: 600 }}>Бюджет: {formatRub(budgetVal)}</div>
                  )}
                  {nearTopUp && (
                    <div style={{ color: TOP_UP_COLOR, fontWeight: 600, marginTop: 4 }}>
                      Пополнено: +{formatRub(nearTopUp.amount)} ({formatRub(nearTopUp.budgetBefore)} →{' '}
                      {formatRub(nearTopUp.budgetAfter)})
                    </div>
                  )}
                </div>
              )
            }}
          />
          <Line
            type="linear"
            dataKey="budgetRub"
            stroke={BUDGET_LINE}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            dot={rows.length <= 24 ? { r: 2.5, fill: colors.bgWhite, stroke: BUDGET_LINE, strokeWidth: 2 } : false}
            activeDot={{ r: 4, fill: colors.bgWhite, stroke: BUDGET_LINE, strokeWidth: 2 }}
            connectNulls
            isAnimationActive={false}
          />
          {startMarkers.map((m, i) => (
            <ReferenceDot
              key={`start-${i}`}
              x={m.ts}
              y={m.y}
              r={0}
              label={{
                value: '▷',
                position: 'top',
                fill: BUDGET_LINE,
                fontSize: 14,
                fontWeight: 700,
              }}
            />
          ))}
          {stopMarkers.map((m, i) => (
            <ReferenceDot
              key={`stop-${i}`}
              x={m.ts}
              y={m.y}
              r={0}
              label={{
                value: 'Ⅱ',
                position: 'top',
                fill: STOP_COLOR,
                fontSize: 12,
                fontWeight: 700,
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 8, marginBottom: 0 }}>
        По событиям из журнала · {dayjs(data.periodFrom).format('DD.MM HH:mm')} — {dayjs(data.periodTo).format('DD.MM HH:mm')}
      </p>
    </div>
  )
}

function LegendItem({
  color,
  label,
  line,
  bar,
  box,
  symbol,
}: {
  color: string
  label: string
  line?: boolean
  bar?: boolean
  box?: boolean
  symbol?: string
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {line && <span style={{ width: 18, height: 3, backgroundColor: color, borderRadius: 2 }} />}
      {bar && <span style={{ width: 10, height: 14, backgroundColor: color, borderRadius: 2 }} />}
      {box && (
        <span
          style={{
            width: 14,
            height: 10,
            backgroundColor: color,
            borderRadius: 2,
            border: `1px solid ${colors.borderLight}`,
            flexShrink: 0,
          }}
        />
      )}
      {symbol && <span style={{ color, fontWeight: 700, fontSize: 13 }}>{symbol}</span>}
      {label}
    </span>
  )
}
