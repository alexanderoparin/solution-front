import { useCallback, type CSSProperties, type UIEvent } from 'react'
import { Spin } from 'antd'
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons'
import type {
  NormQueryClusterRow,
  NormQueryClusterSortDirection,
  NormQueryClusterSortField,
} from '../types/analytics'
import { colors, spacing, borderRadius } from '../styles/analytics'

const COLUMNS: { key: NormQueryClusterSortField; label: string; align: 'left' | 'right' }[] = [
  { key: 'normQuery', label: 'Кластер', align: 'left' },
  { key: 'avgPos', label: 'Средняя позиция', align: 'right' },
  { key: 'clicks', label: 'Клики', align: 'right' },
  { key: 'atbs', label: 'Корзина', align: 'right' },
  { key: 'orders', label: 'Заказы, шт', align: 'right' },
  { key: 'spend', label: 'Затраты, ₽', align: 'right' },
  { key: 'cpc', label: 'CPC, ₽', align: 'right' },
]

interface CampaignNormQueryClustersTableProps {
  rows: NormQueryClusterRow[]
  totals: NormQueryClusterRow | null | undefined
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  sortBy: NormQueryClusterSortField
  sortDir: NormQueryClusterSortDirection
  onSortChange: (field: NormQueryClusterSortField, dir: NormQueryClusterSortDirection) => void
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
  rows,
  totals,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  sortBy,
  sortDir,
  onSortChange,
  formatNumber,
  formatCurrency,
  formatDecimal,
}: CampaignNormQueryClustersTableProps) {
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
    cursor: 'pointer',
    userSelect: 'none',
  }

  const td: CSSProperties = {
    padding: '8px 12px',
    borderBottom: `1px solid ${colors.border}`,
    textAlign: 'right',
    fontSize: 12,
    color: colors.textPrimary,
  }

  const handleSort = (field: NormQueryClusterSortField) => {
    if (sortBy === field) {
      onSortChange(field, sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(field, field === 'normQuery' ? 'asc' : 'desc')
    }
  }

  const renderSortIcon = (field: NormQueryClusterSortField) => {
    if (sortBy !== field) {
      return (
        <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 4, opacity: 0.35, verticalAlign: 'middle' }}>
          <CaretUpOutlined style={{ fontSize: 9, lineHeight: 1, marginBottom: -2 }} />
          <CaretDownOutlined style={{ fontSize: 9, lineHeight: 1 }} />
        </span>
      )
    }
    return sortDir === 'asc'
      ? <CaretUpOutlined style={{ fontSize: 10, marginLeft: 4, color: colors.primary }} />
      : <CaretDownOutlined style={{ fontSize: 10, marginLeft: 4, color: colors.primary }} />
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

  const onScroll = useCallback(
    (e: UIEvent<HTMLDivElement>) => {
      if (!hasNextPage || isFetchingNextPage) return
      const el = e.currentTarget
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  return (
    <div>
      {isLoading && rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: spacing.xl }}>
          <Spin />
        </div>
      ) : (
        <div
          style={{ maxHeight: 520, overflow: 'auto', border: `1px solid ${colors.borderLight}`, borderRadius: borderRadius.sm }}
          onScroll={onScroll}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      ...th,
                      textAlign: col.align,
                      minWidth: col.key === 'normQuery' ? 200 : undefined,
                    }}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {renderSortIcon(col.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {totals && renderRow({ ...totals, normQuery: '' }, 'Всего по топ кластерам', true)}
              {rows.map((row) => renderRow(row, row.normQuery))}
              {!isLoading && rows.length === 0 && (totals?.clicks ?? 0) === 0 && (
                <tr>
                  <td colSpan={7} style={{ ...td, textAlign: 'center', color: colors.textSecondary, padding: spacing.xl }}>
                    Нет данных за выбранный период
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {isFetchingNextPage && (
            <div>
              <div style={{ textAlign: 'center', padding: spacing.sm }}>
                <Spin size="small" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
