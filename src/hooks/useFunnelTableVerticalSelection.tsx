import { useState, useRef, useEffect, useMemo, useCallback, type MouseEvent as ReactMouseEvent } from 'react'
import { colors, typography, shadows, borderRadius } from '../styles/analytics'

export type FunnelStatSelection = {
  metricKey: string
  startRowIndex: number
  endRowIndex: number
  clientX: number
  clientY: number
}

export type FunnelStatAggregates = { empty: true } | { empty: false; sum: number; avg: number; n: number }

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
    getColumnTitle,
    formatValue,
    formatPercent,
    formatCurrency,
    resetSelectionKey,
  } = options

  const [funnelStatSelection, setFunnelStatSelection] = useState<FunnelStatSelection | null>(null)
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
    const values: number[] = []
    for (let i = lo; i <= hi; i++) {
      const date = rangeDatesDesc[i]
      const v = getNumericValue(metricKey, date)
      if (v != null && Number.isFinite(v)) values.push(v)
    }
    if (values.length === 0) return { empty: true }
    const sum = values.reduce((a, b) => a + b, 0)
    return { empty: false, sum, avg: sum / values.length, n: values.length }
  }, [funnelStatSelection, rangeDatesDesc, getNumericValue])

  useEffect(() => {
    setFunnelStatSelection(null)
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
        if (prev.endRowIndex === endRowIndex && prev.clientX === e.clientX && prev.clientY === e.clientY) return prev
        return { ...prev, endRowIndex, clientX: e.clientX, clientY: e.clientY }
      })
    }
    const onUp = (e: MouseEvent) => {
      if (!funnelStatDragRef.current) return
      funnelStatDragRef.current = null
      setFunnelStatSelection((prev) => {
        if (!prev) return null
        return { ...prev, clientX: e.clientX, clientY: e.clientY }
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
    if (!funnelStatSelection || funnelStatAggregates === null) return null
    const pad = 8
    const maxW = Math.min(320, window.innerWidth - 2 * pad)
    const estH = 118
    let left = funnelStatSelection.clientX + pad
    let top = funnelStatSelection.clientY + pad
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
      setFunnelStatSelection({
        metricKey,
        startRowIndex: 0,
        endRowIndex: Math.max(0, rangeDatesDesc.length - 1),
        clientX: rect.left + rect.width / 2,
        clientY: rect.bottom + 6,
      })
    },
    [rangeDatesDesc.length],
  )

  const onMetricCellMouseDown = useCallback((metricKey: string, dateIndex: number, e: ReactMouseEvent<HTMLTableCellElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    funnelStatDragRef.current = { metricKey }
    setFunnelStatSelection({
      metricKey,
      startRowIndex: dateIndex,
      endRowIndex: dateIndex,
      clientX: e.clientX,
      clientY: e.clientY,
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
