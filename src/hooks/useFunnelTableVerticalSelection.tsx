import { useState, useRef, useEffect, useMemo, useCallback, type MouseEvent as ReactMouseEvent } from 'react'
import { colors, typography, shadows, borderRadius } from '../styles/analytics'

export type FunnelStatSelection = {
  metricKey: string
  startRowIndex: number
  endRowIndex: number
  /** Точка привязки плашки: X — правый или левый край столбца, Y — центр выделения по вертикали */
  clientX: number
  clientY: number
  anchorSide: 'left' | 'right'
}

export type FunnelStatAggregates =
  | { empty: true }
  | { empty: false; sum: number; avg: number; n: number; ratioMode?: boolean }

/** Метрики-отношения: среднее по выделению = пересчёт от сумм базовых величин за период */
export function funnelMetricIsRatioAggregateKey(metricKey: string): boolean {
  return (
    metricKey === 'drr' ||
    metricKey === 'ctr' ||
    metricKey === 'cpo' ||
    metricKey === 'cart_conversion' ||
    metricKey === 'order_conversion'
  )
}

export type FunnelBaseMetrics = {
  transitions: number
  cart: number
  orders: number
  ordersAmount: number
  views: number
  clicks: number
  costs: number
}

export function computeRatioMetricForPeriod(metricKey: string, base: FunnelBaseMetrics): number | null {
  switch (metricKey) {
    case 'drr':
      return base.ordersAmount > 0 ? (base.costs / base.ordersAmount) * 100 : null
    case 'ctr':
      return base.views > 0 ? (base.clicks / base.views) * 100 : null
    case 'cpo':
      return base.orders > 0 ? base.costs / base.orders : null
    case 'cart_conversion':
      return base.transitions > 0 ? (base.cart / base.transitions) * 100 : null
    case 'order_conversion':
      return base.cart > 0 ? (base.orders / base.cart) * 100 : null
    default:
      return null
  }
}

type FunnelDailyBaseRow = {
  transitions?: number | null
  cart?: number | null
  orders?: number | null
  ordersAmount?: number | null
  views?: number | null
  clicks?: number | null
  costs?: number | null
}

/** Суммирует базовые метрики по списку дат для пересчёта отношений за выделенный период. */
export function sumFunnelBaseMetricsForDates(
  dates: string[],
  findDailyRow: (date: string) => FunnelDailyBaseRow | null | undefined,
): FunnelBaseMetrics {
  let transitions = 0
  let cart = 0
  let orders = 0
  let ordersAmount = 0
  let views = 0
  let clicks = 0
  let costs = 0
  for (const date of dates) {
    const row = findDailyRow(date)
    if (!row) continue
    transitions += row.transitions || 0
    cart += row.cart || 0
    orders += row.orders || 0
    ordersAmount += row.ordersAmount || 0
    views += row.views || 0
    clicks += row.clicks || 0
    costs += row.costs || 0
  }
  return { transitions, cart, orders, ordersAmount, views, clicks, costs }
}

const FLOAT_GAP_PX = 12
const FLOAT_EST_WIDTH_PX = 280

function computeFloatAnchor(
  root: HTMLDivElement | null,
  metricKey: string,
  startRowIndex: number,
  endRowIndex: number,
): Pick<FunnelStatSelection, 'clientX' | 'clientY' | 'anchorSide'> {
  const lo = Math.min(startRowIndex, endRowIndex)
  const hi = Math.max(startRowIndex, endRowIndex)
  const fallback = { clientX: window.innerWidth / 2, clientY: 96, anchorSide: 'right' as const }

  if (!root) return fallback

  const rects: DOMRect[] = []
  for (let i = lo; i <= hi; i++) {
    const td = root.querySelector(
      `td[data-funnel-stat-metric="${CSS.escape(metricKey)}"][data-funnel-stat-row="${i}"]`,
    ) as HTMLElement | null
    if (td) rects.push(td.getBoundingClientRect())
  }
  if (rects.length === 0) return fallback

  const top = Math.min(...rects.map((r) => r.top))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  const left = Math.min(...rects.map((r) => r.left))
  const right = Math.max(...rects.map((r) => r.right))
  const centerY = (top + bottom) / 2
  const preferRight = right + FLOAT_GAP_PX + FLOAT_EST_WIDTH_PX < window.innerWidth - 8

  return preferRight
    ? { clientX: right, clientY: centerY, anchorSide: 'right' }
    : { clientX: left, clientY: centerY, anchorSide: 'left' }
}

/** Как в таблицах воронок на страницах аналитики артикула и деталей РК */
export function funnelMetricIsPercentKey(metricKey: string): boolean {
  return (
    metricKey.includes('conversion') ||
    metricKey === 'ctr' ||
    metricKey === 'drr' ||
    metricKey === 'seller_discount' ||
    metricKey === 'wb_club_discount' ||
    metricKey === 'spp_percent'
  )
}

export function funnelMetricIsCurrencyKey(metricKey: string): boolean {
  return (
    metricKey === 'orders_amount' ||
    metricKey === 'costs' ||
    metricKey === 'cpc' ||
    metricKey === 'cpo' ||
    metricKey === 'spp_amount' ||
    metricKey.startsWith('price_')
  )
}

type UseFunnelTableVerticalSelectionOptions = {
  rangeDatesDesc: string[]
  getNumericValue: (metricKey: string, date: string) => number | null
  /** Суммы базовых метрик по датам выделения — для пересчёта ДРР, CTR, CPO, конверсий */
  getBaseMetricsForDates?: (dates: string[]) => FunnelBaseMetrics
  getColumnTitle: (metricKey: string) => string
  formatValue: (value: number | null) => string
  formatPercent: (value: number) => string
  formatCurrency: (value: number) => string
  /** При смене периода / воронок / источника данных — сброс выделения */
  resetSelectionKey: string
}

/**
 * Выделение одного столбца (или вертикального диапазона) в таблице «дата × метрика»,
 * плашка со суммой и средним по числовым ячейкам.
 */
export function useFunnelTableVerticalSelection(options: UseFunnelTableVerticalSelectionOptions) {
  const {
    rangeDatesDesc,
    getNumericValue,
    getBaseMetricsForDates,
    getColumnTitle,
    formatValue,
    formatPercent,
    formatCurrency,
    resetSelectionKey,
  } = options

  const [funnelStatSelection, setFunnelStatSelection] = useState<FunnelStatSelection | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const funnelStatDragRef = useRef<{ metricKey: string } | null>(null)
  const funnelTableWrapRef = useRef<HTMLDivElement>(null)

  const isFunnelStatMetricCellSelected = useCallback(
    (metricKey: string, rowIndex: number) => {
      if (!funnelStatSelection) return false
      if (funnelStatSelection.metricKey !== metricKey) return false
      const lo = Math.min(funnelStatSelection.startRowIndex, funnelStatSelection.endRowIndex)
      const hi = Math.max(funnelStatSelection.startRowIndex, funnelStatSelection.endRowIndex)
      return rowIndex >= lo && rowIndex <= hi
    },
    [funnelStatSelection],
  )

  const funnelStatAggregates = useMemo((): FunnelStatAggregates | null => {
    if (!funnelStatSelection) return null
    const { metricKey, startRowIndex, endRowIndex } = funnelStatSelection
    const lo = Math.min(startRowIndex, endRowIndex)
    const hi = Math.max(startRowIndex, endRowIndex)
    const selectedDates: string[] = []
    const values: number[] = []
    for (let i = lo; i <= hi; i++) {
      const date = rangeDatesDesc[i]
      selectedDates.push(date)
      const v = getNumericValue(metricKey, date)
      if (v != null && Number.isFinite(v)) values.push(v)
    }
    if (values.length === 0) return { empty: true }

    if (funnelMetricIsRatioAggregateKey(metricKey) && getBaseMetricsForDates) {
      const periodValue = computeRatioMetricForPeriod(metricKey, getBaseMetricsForDates(selectedDates))
      if (periodValue == null || !Number.isFinite(periodValue)) return { empty: true }
      return { empty: false, sum: 0, avg: periodValue, n: values.length, ratioMode: true }
    }

    const sum = values.reduce((a, b) => a + b, 0)
    return { empty: false, sum, avg: sum / values.length, n: values.length }
  }, [funnelStatSelection, rangeDatesDesc, getNumericValue, getBaseMetricsForDates])

  useEffect(() => {
    setFunnelStatSelection(null)
    setIsSelecting(false)
    funnelStatDragRef.current = null
  }, [resetSelectionKey])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!funnelStatDragRef.current) return
      const expectedMk = funnelStatDragRef.current.metricKey
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      const td = el?.closest('td[data-funnel-stat-metric]') as HTMLElement | null
      if (!td || td.dataset.funnelStatMetric !== expectedMk) return
      const row = td.dataset.funnelStatRow
      if (row === undefined) return
      const endRowIndex = Number(row)
      setFunnelStatSelection((prev) => {
        if (!prev || prev.metricKey !== expectedMk) return prev
        if (prev.endRowIndex === endRowIndex) return prev
        return { ...prev, endRowIndex }
      })
    }
    const onUp = () => {
      if (!funnelStatDragRef.current) return
      const expectedMk = funnelStatDragRef.current.metricKey
      funnelStatDragRef.current = null
      setIsSelecting(false)
      setFunnelStatSelection((prev) => {
        if (!prev || prev.metricKey !== expectedMk) return prev
        const anchor = computeFloatAnchor(
          funnelTableWrapRef.current,
          expectedMk,
          prev.startRowIndex,
          prev.endRowIndex,
        )
        return { ...prev, ...anchor }
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  useEffect(() => {
    if (!funnelStatSelection) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFunnelStatSelection(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [funnelStatSelection])

  useEffect(() => {
    if (!funnelStatSelection) return
    const onDocMouseDown = (e: MouseEvent) => {
      const root = funnelTableWrapRef.current
      const t = e.target as Node | null
      if (root && t && root.contains(t)) return
      setFunnelStatSelection(null)
    }
    document.addEventListener('mousedown', onDocMouseDown, true)
    return () => document.removeEventListener('mousedown', onDocMouseDown, true)
  }, [funnelStatSelection])

  const renderFunnelStatFloat = useCallback(() => {
    if (isSelecting || !funnelStatSelection || funnelStatAggregates === null) return null
    const pad = 8
    const maxW = Math.min(320, window.innerWidth - 2 * pad)
    const estH = funnelStatAggregates.empty ? 48 : funnelStatAggregates.ratioMode ? 88 : 118
    let left =
      funnelStatSelection.anchorSide === 'right'
        ? funnelStatSelection.clientX + FLOAT_GAP_PX
        : funnelStatSelection.clientX - maxW - FLOAT_GAP_PX
    let top = funnelStatSelection.clientY - estH / 2
    left = Math.max(pad, Math.min(left, window.innerWidth - maxW - pad))
    top = Math.max(pad, Math.min(top, window.innerHeight - estH - pad))
    const mk = funnelStatSelection.metricKey
    const isPercentCol = funnelMetricIsPercentKey(mk)
    const isCurrencyCol = funnelMetricIsCurrencyKey(mk)
    const fmtStat = (n: number) =>
      isPercentCol ? formatPercent(n) : isCurrencyCol ? formatCurrency(n) : formatValue(n)
    const colTitle = getColumnTitle(mk)
    return (
      <div
        role="status"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left,
          top,
          zIndex: 2000,
          width: 'max-content',
          maxWidth: maxW,
          boxSizing: 'border-box',
          backgroundColor: colors.bgWhite,
          border: `1px solid ${colors.border}`,
          borderRadius: borderRadius.sm,
          padding: '6px 10px',
          boxShadow: shadows.lg,
          ...typography.body,
          fontSize: 11,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 6,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: colors.textPrimary,
              lineHeight: 1.25,
              wordBreak: 'break-word',
              paddingRight: 2,
            }}
          >
            {colTitle}
          </div>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setFunnelStatSelection(null)}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '0 2px',
              fontSize: 14,
              lineHeight: 1,
              color: colors.textSecondary,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
        {funnelStatAggregates.empty ? (
          <div style={{ color: colors.textSecondary, fontSize: 11 }}>Нет числовых значений в выделении</div>
        ) : funnelStatAggregates.ratioMode ? (
          <>
            <div style={{ marginBottom: 2, fontSize: 11, whiteSpace: 'nowrap' }}>
              <span style={{ color: colors.textSecondary }}>Среднее за выделенный период: </span>
              <span style={{ fontWeight: 600 }}>{fmtStat(funnelStatAggregates.avg)}</span>
            </div>
            <div style={{ fontSize: 10, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
              Учтено ячеек: {funnelStatAggregates.n}
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 2, fontSize: 11, whiteSpace: 'nowrap' }}>
              <span style={{ color: colors.textSecondary }}>Сумма: </span>
              <span style={{ fontWeight: 600 }}>{fmtStat(funnelStatAggregates.sum)}</span>
            </div>
            <div style={{ marginBottom: 2, fontSize: 11, whiteSpace: 'nowrap' }}>
              <span style={{ color: colors.textSecondary }}>Среднее: </span>
              <span style={{ fontWeight: 600 }}>{fmtStat(funnelStatAggregates.avg)}</span>
            </div>
            <div style={{ fontSize: 10, color: colors.textSecondary, whiteSpace: 'nowrap' }}>
              Учтено ячеек: {funnelStatAggregates.n}
            </div>
          </>
        )}
      </div>
    )
  }, [
    isSelecting,
    funnelStatSelection,
    funnelStatAggregates,
    formatValue,
    formatPercent,
    formatCurrency,
    getColumnTitle,
  ])

  const onMetricHeaderMouseDown = useCallback(
    (metricKey: string, e: ReactMouseEvent<HTMLTableCellElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      funnelStatDragRef.current = null
      const rect = e.currentTarget.getBoundingClientRect()
      const anchor = computeFloatAnchor(
        funnelTableWrapRef.current,
        metricKey,
        0,
        Math.max(0, rangeDatesDesc.length - 1),
      )
      setFunnelStatSelection({
        metricKey,
        startRowIndex: 0,
        endRowIndex: Math.max(0, rangeDatesDesc.length - 1),
        clientX: anchor.clientX || rect.right,
        clientY: anchor.clientY || rect.bottom + 6,
        anchorSide: anchor.anchorSide,
      })
    },
    [rangeDatesDesc.length],
  )

  const onMetricCellMouseDown = useCallback((metricKey: string, dateIndex: number, e: ReactMouseEvent<HTMLTableCellElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    funnelStatDragRef.current = { metricKey }
    setIsSelecting(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setFunnelStatSelection({
      metricKey,
      startRowIndex: dateIndex,
      endRowIndex: dateIndex,
      clientX: rect.right,
      clientY: rect.top + rect.height / 2,
      anchorSide: 'right',
    })
  }, [])

  return {
    funnelTableWrapRef,
    isFunnelStatMetricCellSelected,
    renderFunnelStatFloat,
    onMetricHeaderMouseDown,
    onMetricCellMouseDown,
  }
}
