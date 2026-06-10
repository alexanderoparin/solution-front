import { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  Bar,
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

const BUDGET_LINE = '#B4D705'
const ACTIVE_BG = 'rgba(180, 215, 5, 0.15)'
const INACTIVE_BG = '#E2E8F0'
const TOP_UP_COLOR = '#7C3AED'
const STOP_COLOR = '#64748B'

const CHART_HEIGHT = 280

interface CampaignBudgetChartProps {
  data: CampaignBudgetChartData | undefined
  loading?: boolean
}

interface ChartRow {
  at: string
  label: string
  budgetRub: number | null
  topUpAmount: number | null
  ts: number
}

function formatAxisLabel(iso: string): string {
  return dayjs(iso).format('DD.MM HH:mm')
}

function formatRub(value: number): string {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`
}

/** Верхняя граница оси Y: +15% запас, без float-артефактов. */
function computeYMax(budgets: number[], topUps: number[]): number {
  const rawMax = Math.max(100, ...budgets, ...topUps, 0)
  return Math.ceil(rawMax * 1.15)
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

export default function CampaignBudgetChart({ data, loading }: CampaignBudgetChartProps) {
  const { rows, xDomain, yMax, startMarkers, stopMarkers } = useMemo(() => {
    if (!data) {
      return { rows: [] as ChartRow[], xDomain: [0, 1] as [number, number], yMax: 100, startMarkers: [], stopMarkers: [] }
    }

    const rows: ChartRow[] = data.budgetPoints.map((p) => {
      const ts = dayjs(p.at).valueOf()
      return {
        at: p.at,
        label: formatAxisLabel(p.at),
        budgetRub: p.budgetRub,
        topUpAmount: null as number | null,
        ts,
      }
    })

    for (const m of data.markers) {
      if (m.type !== 'TOP_UP' || m.amount == null || rows.length === 0) continue
      const markerTs = dayjs(m.at).valueOf()
      let nearest = rows[0]
      for (const row of rows) {
        if (Math.abs(row.ts - markerTs) < Math.abs(nearest.ts - markerTs)) {
          nearest = row
        }
      }
      nearest.topUpAmount = m.amount
    }

    const allBudgets = rows.map((r) => r.budgetRub ?? 0)
    const allTopUps = data.markers.filter((m) => m.type === 'TOP_UP').map((m) => m.amount ?? 0)
    const yMax = computeYMax(allBudgets, allTopUps)

    const tsValues = rows.map((r) => r.ts)
    const xDomain: [number, number] =
      tsValues.length >= 2 ? [tsValues[0], tsValues[tsValues.length - 1]] : [dayjs().subtract(48, 'hour').valueOf(), dayjs().valueOf()]

    const startMarkers = data.markers
      .filter((m) => m.type === 'START')
      .map((m) => ({ at: m.at, ts: dayjs(m.at).valueOf(), y: findBudgetAt(rows, m.at) }))
    const stopMarkers = data.markers
      .filter((m) => m.type === 'STOP')
      .map((m) => ({ at: m.at, ts: dayjs(m.at).valueOf(), y: findBudgetAt(rows, m.at) }))

    return { rows, xDomain, yMax, startMarkers, stopMarkers }
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
              key={`${interval.from}-${idx}`}
              x1={dayjs(interval.from).valueOf()}
              x2={dayjs(interval.to).valueOf()}
              fill={interval.active ? ACTIVE_BG : INACTIVE_BG}
              fillOpacity={1}
              ifOverflow="extendDomain"
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
              if (name === 'topUpAmount') return [formatRub(value), 'Пополнено']
              if (name === 'budgetRub') return [formatRub(value), 'Бюджет']
              return [value, name]
            }}
          />
          <Bar dataKey="topUpAmount" fill={TOP_UP_COLOR} barSize={14} radius={[2, 2, 0, 0]} />
          <Line
            type="monotone"
            dataKey="budgetRub"
            stroke={BUDGET_LINE}
            strokeWidth={2}
            dot={{ r: 3, fill: '#fff', stroke: BUDGET_LINE, strokeWidth: 2 }}
            connectNulls
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
        Период {data.stepHours} ч · {dayjs(data.periodFrom).format('DD.MM HH:mm')} — {dayjs(data.periodTo).format('DD.MM HH:mm')}
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
      {box && <span style={{ width: 14, height: 10, backgroundColor: color, borderRadius: 2, border: `1px solid ${colors.borderLight}` }} />}
      {symbol && <span style={{ color, fontWeight: 700, fontSize: 13 }}>{symbol}</span>}
      {label}
    </span>
  )
}
