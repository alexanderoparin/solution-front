import { useMemo, type CSSProperties } from 'react'
import { Spin } from 'antd'
import type { NormQueryClusterRow, NormQueryClustersResponse } from '../types/analytics'
import { colors, spacing, borderRadius } from '../styles/analytics'

interface CampaignNormQueryClustersTableProps {
  data: NormQueryClustersResponse | undefined
  isLoading: boolean
  search: string
  formatNumber: (value: number | null | undefined) => string
  formatCurrency: (value: number) => string
  formatDecimal: (value: number | null | undefined, digits?: number) => string
}

function formatPos(
  value: number | null | undefined,
  formatDecimal: (v: number | null | undefined, d?: number) => string,
): string {
  if (value == null) return '-'
  return formatDecimal(value, 2)
}

export default function CampaignNormQueryClustersTable({
  data,
  isLoading,
  search,
  formatNumber,
  formatCurrency,
  formatDecimal,
}: CampaignNormQueryClustersTableProps) {
  const filteredRows = useMemo(() => {
    const rows = data?.rows ?? []
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.normQuery.toLowerCase().includes(q))
  }, [data?.rows, search])

  const th: CSSProperties = {
    padding: '10px 12px',
    borderBottom: `2px solid ${colors.borderHeader}`,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 600,
    color: colors.textPrimary,
    backgroundColor: colors.bgWhite,
    position: 'sticky',
    top: 0,
    zIndex: 1,
    whiteSpace: 'nowrap',
  }

  const td: CSSProperties = {
    padding: '8px 12px',
    borderBottom: `1px solid ${colors.border}`,
    textAlign: 'right',
    fontSize: 12,
    color: colors.textPrimary,
  }

  const renderRow = (row: NormQueryClusterRow, label: string, isTotal?: boolean) => (
    <tr key={isTotal ? '__total' : row.normQuery} style={{ backgroundColor: isTotal ? colors.primaryLight : undefined }}>
      <td style={{ ...td, textAlign: 'left', fontWeight: isTotal ? 600 : 400, maxWidth: 360, wordBreak: 'break-word' }}>
        {label}
      </td>
      <td style={td}>{formatPos(row.avgPos, formatDecimal)}</td>
      <td style={td}>{formatNumber(row.clicks)}</td>
      <td style={td}>{formatNumber(row.atbs)}</td>
      <td style={td}>{formatNumber(row.orders)}</td>
      <td style={td}>{row.spend != null ? formatCurrency(row.spend) : '-'}</td>
      <td style={td}>{row.cpc != null ? formatDecimal(row.cpc, 2) : '-'}</td>
    </tr>
  )

  return (
    <div>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>
          <Spin />
        </div>
      ) : (
        <div style={{ maxHeight: 520, overflow: 'auto', border: `1px solid ${colors.borderLight}`, borderRadius: borderRadius.sm }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left', minWidth: 200 }}>Кластер</th>
                <th style={th}>Средняя позиция</th>
                <th style={th}>Клики</th>
                <th style={th}>Корзина</th>
                <th style={th}>Заказы, шт</th>
                <th style={th}>Затраты, ₽</th>
                <th style={th}>CPC, ₽</th>
              </tr>
            </thead>
            <tbody>
              {data?.totals && renderRow({ ...data.totals, normQuery: '' }, 'Всего по топ кластерам', true)}
              {filteredRows.map((row) => renderRow(row, row.normQuery))}
              {!isLoading && filteredRows.length === 0 && (data?.totals?.clicks ?? 0) === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...td, textAlign: 'center', color: colors.textSecondary, padding: spacing.xl }}>
                    Нет данных за выбранный период
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
