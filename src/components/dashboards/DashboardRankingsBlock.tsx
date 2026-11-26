import { useMemo, useState, type CSSProperties } from 'react'
import { Select, Spin } from 'antd'
import { AppstoreOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import type { ArticleSummary, DashboardRankingItem, DashboardRankingsResponse } from '../../types/analytics'
import { colors, borderRadius, shadows, spacing, typography } from '../../styles/analytics'
import { formatChangePercent } from './dashboardConstants'

interface DashboardRankingsBlockProps {
  data: DashboardRankingsResponse | undefined
  loading: boolean
  error: string | null
  /** Артикулы из активных фильтров страницы — для селекта «Все товары». */
  articles?: ArticleSummary[]
  moneySuffix?: string
}

type RankingVariant = 'orders' | 'growth' | 'decline'

type ArticleFilterOption = {
  value: string
  label: string
  title?: string
  photoUrl?: string | null
  isAll?: boolean
}

/**
 * Три карточки топ-5 с таблицами по требованиям: место, артикул, фото, название, метрики.
 */
export default function DashboardRankingsBlock({
  data,
  loading,
  error,
  articles = [],
  moneySuffix = 'руб',
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
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: spacing.md,
      }}
    >
      <RankingCard
        title="Топ по заказам"
        items={data?.topByOrders ?? []}
        articles={articles}
        moneySuffix={moneySuffix}
        variant="orders"
      />
      <RankingCard
        title="Максимальный рост"
        items={data?.topGrowth ?? []}
        articles={articles}
        moneySuffix={moneySuffix}
        variant="growth"
      />
      <RankingCard
        title="Максимальное падение"
        items={data?.topDecline ?? []}
        articles={articles}
        moneySuffix={moneySuffix}
        variant="decline"
      />
    </div>
  )
}

function RankingCard({
  title,
  items,
  articles,
  moneySuffix,
  variant,
}: {
  title: string
  items: DashboardRankingItem[]
  articles: ArticleSummary[]
  moneySuffix: string
  variant: RankingVariant
}) {
  const [filterNmId, setFilterNmId] = useState<string>('all')

  const filterOptions = useMemo((): ArticleFilterOption[] => {
    const source =
      articles.length > 0
        ? articles
        : items.map((item) => ({
            nmId: item.nmId,
            title: item.title,
            vendorCode: item.vendorCode,
            photoTm: item.photoTm,
          }))

    return [
      {
        value: 'all',
        label: 'Все товары',
        title: 'Все товары',
        isAll: true,
      },
      ...source.map((a) => ({
        value: String(a.nmId),
        label: [a.title, a.vendorCode, String(a.nmId)].filter(Boolean).join(' '),
        title: a.title || a.vendorCode || String(a.nmId),
        photoUrl: a.photoTm ?? null,
        isAll: false,
      })),
    ]
  }, [articles, items])

  const visibleItems = useMemo(() => {
    if (filterNmId === 'all') return items
    const nmId = Number(filterNmId)
    return items.filter((item) => item.nmId === nmId)
  }, [items, filterNmId])

  const metricHeaders =
    variant === 'orders'
      ? (
          <>
            <th style={thRightStyle}>
              Заказы,
              <br />
              шт
            </th>
            <th style={thRightStyle}>
              Сумма,
              <br />
              {moneySuffix}
            </th>
          </>
        )
      : (
          <>
            <th style={thRightStyle}>
              {variant === 'growth' ? 'Рост,' : 'Падение,'}
              <br />
              %
            </th>
            <th style={thRightStyle}>
              Заказы,
              <br />
              шт
            </th>
          </>
        )

  return (
    <div
      style={{
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.border}`,
        boxShadow: shadows.sm,
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        }}
      >
        <div style={{ ...typography.h3, margin: 0 }}>{title}</div>
        <Select
          value={filterNmId}
          onChange={setFilterNmId}
          options={filterOptions}
          style={{ minWidth: 140, maxWidth: 180 }}
          showSearch
          optionFilterProp="label"
          popupMatchSelectWidth={300}
          listHeight={320}
          virtual={false}
          optionRender={(option) => {
            const dataOpt = option.data as ArticleFilterOption
            if (dataOpt.isAll) {
              return (
                <div style={{ display: 'flex', alignItems: 'center', padding: '2px 0' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      marginRight: 10,
                      backgroundColor: colors.primaryLight,
                      color: colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AppstoreOutlined />
                  </div>
                  <span>Все товары</span>
                </div>
              )
            }
            return (
              <div style={{ display: 'flex', alignItems: 'center', padding: '2px 0' }}>
                {dataOpt.photoUrl ? (
                  <img
                    src={dataOpt.photoUrl}
                    alt=""
                    style={{
                      width: 32,
                      height: 32,
                      objectFit: 'cover',
                      borderRadius: 4,
                      marginRight: 10,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      marginRight: 10,
                      flexShrink: 0,
                      backgroundColor: colors.bgGrayLight,
                    }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>{option.value}</div>
                  <div
                    style={{
                      fontSize: 13,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {dataOpt.title}
                  </div>
                </div>
              </div>
            )
          }}
          labelRender={(props) => {
            if (props.value === 'all' || props.value == null) {
              return <span>Все товары</span>
            }
            const article = articles.find((a) => String(a.nmId) === String(props.value))
            const item = items.find((i) => String(i.nmId) === String(props.value))
            const text = article?.title || item?.title || article?.vendorCode || String(props.value)
            return (
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  maxWidth: 120,
                }}
              >
                {text}
              </span>
            )
          }}
        />
      </div>

      {visibleItems.length === 0 ? (
        <div style={{ color: colors.textMuted, fontSize: 13 }}>Нет данных</div>
      ) : (
        <div style={{ overflowX: 'auto', flex: 1, minWidth: 0 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: COL.rank }} />
              <col style={{ width: COL.article }} />
              <col style={{ width: COL.photo }} />
              <col />
              <col style={{ width: COL.metric }} />
              <col style={{ width: COL.metric }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}>№</th>
                <th style={thStyle}>Артикул</th>
                <th style={thStyle}>Фото</th>
                <th style={thStyle}>Название</th>
                {metricHeaders}
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <RankingTableRow
                  key={`${title}-${item.nmId}`}
                  item={item}
                  moneySuffix={moneySuffix}
                  variant={variant}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RankingTableRow({
  item,
  moneySuffix,
  variant,
}: {
  item: DashboardRankingItem
  moneySuffix: string
  variant: RankingVariant
}) {
  const changeColor =
    item.changePercent == null
      ? colors.textMuted
      : variant === 'decline' || (item.changePercent ?? 0) < 0
        ? colors.error
        : colors.success

  return (
    <tr>
      <td style={{ ...tdStyle, textAlign: 'center', color: colors.textMuted, fontWeight: 600 }}>
        {item.rank}
      </td>
      <td style={tdStyle}>
        <Link
          to={`/analytics/article/${item.nmId}`}
          style={{
            color: colors.textPrimary,
            textDecoration: 'none',
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 1.3,
          }}
          title={item.vendorCode ? `${item.vendorCode} · ${item.nmId}` : String(item.nmId)}
        >
          {item.nmId}
        </Link>
      </td>
      <td style={tdStyle}>
        {item.photoTm ? (
          <img
            src={item.photoTm}
            alt=""
            style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              backgroundColor: colors.bgGrayLight,
            }}
          />
        )}
      </td>
      <td style={tdStyle}>
        <Link
          to={`/analytics/article/${item.nmId}`}
          style={{
            color: colors.textPrimary,
            fontWeight: 600,
            fontSize: 12,
            textDecoration: 'none',
            lineHeight: 1.3,
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={item.title ?? undefined}
        >
          {item.title || '—'}
        </Link>
      </td>
      {variant === 'orders' ? (
        <>
          <td style={{ ...tdMetricStyle, fontWeight: 600 }}>
            {(item.orders ?? 0).toLocaleString('ru-RU')}
          </td>
          <td style={{ ...tdMetricStyle, color: colors.textSecondary }}>
            {Number(item.ordersAmount ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
          </td>
        </>
      ) : (
        <>
          <td style={{ ...tdMetricStyle, fontWeight: 600, color: changeColor }}>
            {item.changePercent == null ? 'н/д' : formatChangePercent(Number(item.changePercent))}
          </td>
          <td style={{ ...tdMetricStyle, fontWeight: 600 }}>
            {(item.orders ?? 0).toLocaleString('ru-RU')}
          </td>
        </>
      )}
    </tr>
  )
}

/** Фиксированные ширины слева/справа; «Название» забирает остаток ширины карточки. */
const COL = {
  rank: 28,
  article: 86,
  photo: 34,
  metric: 64,
} as const

const thStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: colors.textSecondary,
  textAlign: 'left',
  padding: '5px 4px',
  borderBottom: `1px solid ${colors.borderHeader}`,
  whiteSpace: 'nowrap',
}

const thRightStyle: CSSProperties = {
  ...thStyle,
  textAlign: 'right',
  whiteSpace: 'normal',
  lineHeight: 1.2,
}

const tdStyle: CSSProperties = {
  fontSize: 11,
  padding: '5px 4px',
  borderBottom: `1px solid ${colors.borderLight}`,
  verticalAlign: 'middle',
  lineHeight: 1.3,
}

const tdMetricStyle: CSSProperties = {
  ...tdStyle,
  textAlign: 'right',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
}
