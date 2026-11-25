import { Spin } from 'antd'
import { Link } from 'react-router-dom'
import type { DashboardRankingItem, DashboardRankingsResponse } from '../../types/analytics'
import { colors, borderRadius, shadows, spacing, typography } from '../../styles/analytics'
import { formatChangePercent } from './dashboardConstants'

interface DashboardRankingsBlockProps {
  data: DashboardRankingsResponse | undefined
  loading: boolean
  error: string | null
  moneySuffix?: string
}

/**
 * Три таблицы топ-5: по заказам, рост, падение.
 */
export default function DashboardRankingsBlock({
  data,
  loading,
  error,
  moneySuffix = '₽',
}: DashboardRankingsBlockProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing.xl }}>
        <Spin />
      </div>
    )
  }

  if (error) {
    return <div style={{ color: colors.error, padding: spacing.md }}>{error}</div>
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: spacing.md,
      }}
    >
      <RankingTable
        title="Топ по заказам"
        items={data?.topByOrders ?? []}
        showChange={false}
        moneySuffix={moneySuffix}
      />
      <RankingTable
        title="Максимальный рост"
        items={data?.topGrowth ?? []}
        showChange
        moneySuffix={moneySuffix}
        changeTone="growth"
      />
      <RankingTable
        title="Максимальное падение"
        items={data?.topDecline ?? []}
        showChange
        moneySuffix={moneySuffix}
        changeTone="decline"
      />
    </div>
  )
}

function RankingTable({
  title,
  items,
  showChange,
  moneySuffix,
  changeTone,
}: {
  title: string
  items: DashboardRankingItem[]
  showChange: boolean
  moneySuffix: string
  changeTone?: 'growth' | 'decline'
}) {
  return (
    <div
      style={{
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.sm,
        padding: spacing.md,
        minHeight: 280,
      }}
    >
      <div style={{ ...typography.h3, marginBottom: spacing.md }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ color: colors.textMuted, fontSize: 13 }}>Нет данных</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item) => (
            <RankingRow
              key={`${title}-${item.nmId}`}
              item={item}
              showChange={showChange}
              moneySuffix={moneySuffix}
              changeTone={changeTone}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RankingRow({
  item,
  showChange,
  moneySuffix,
  changeTone,
}: {
  item: DashboardRankingItem
  showChange: boolean
  moneySuffix: string
  changeTone?: 'growth' | 'decline'
}) {
  const changeColor =
    item.changePercent == null
      ? colors.textMuted
      : changeTone === 'decline' || (item.changePercent ?? 0) < 0
        ? colors.error
        : colors.success

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 40px 1fr auto',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>{item.rank}</span>
      {item.photoTm ? (
        <img
          src={item.photoTm}
          alt=""
          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
        />
      ) : (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 4,
            backgroundColor: colors.bgGrayLight,
          }}
        />
      )}
      <div style={{ minWidth: 0 }}>
        <Link
          to={`/analytics/article/${item.nmId}`}
          style={{ color: colors.textPrimary, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
        >
          {item.vendorCode || item.nmId}
        </Link>
        <div
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={item.title ?? undefined}
        >
          {item.title || '—'}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {(item.orders ?? 0).toLocaleString('ru-RU')} шт
        </div>
        <div style={{ fontSize: 11, color: colors.textMuted }}>
          {Number(item.ordersAmount ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}{' '}
          {moneySuffix}
        </div>
        {showChange && (
          <div style={{ fontSize: 12, fontWeight: 600, color: changeColor }}>
            {item.changePercent == null ? 'н/д' : formatChangePercent(Number(item.changePercent))}
          </div>
        )}
      </div>
    </div>
  )
}
