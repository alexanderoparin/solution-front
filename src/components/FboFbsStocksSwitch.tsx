import { colors, borderRadius, typography } from '../styles/analytics'

export type StocksFulfillment = 'FBO' | 'FBS'

interface FboFbsStocksSwitchProps {
  value: StocksFulfillment
  onChange: (value: StocksFulfillment) => void
}

const OPTIONS: { id: StocksFulfillment; label: string }[] = [
  { id: 'FBO', label: 'FBO' },
  { id: 'FBS', label: 'FBS' },
]

/**
 * Компактный переключатель остатков FBO / FBS в шапке блока складов.
 */
export default function FboFbsStocksSwitch({ value, onChange }: FboFbsStocksSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Тип остатков"
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
      }}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              ...typography.body,
              margin: 0,
              padding: '2px 8px',
              minHeight: 22,
              lineHeight: 1.2,
              border: 'none',
              backgroundColor: active ? colors.primary : colors.bgWhite,
              color: active ? '#fff' : colors.textSecondary,
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: 0.2,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function stockRowKey(fulfillment: StocksFulfillment, warehouseId: number | undefined, warehouseName: string): string {
  return `${fulfillment}:${warehouseId ?? warehouseName}`
}
