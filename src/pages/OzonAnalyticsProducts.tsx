import { useMemo, useState } from 'react'
import { Input, Spin, Alert, Tooltip } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { analyticsApi } from '../api/analytics'
import type { ArticleSummary } from '../types/analytics'
import Header, { type CabinetSelectProps, type WorkContextCabinetSelectProps } from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  PRODUCT_PHOTO_WIDTH,
  PRODUCT_PHOTO_HEIGHT,
} from '../styles/analytics'

const FONT_PAGE_SMALL = { fontSize: '11px' as const }
const thBase = {
  borderBottom: `2px solid ${colors.border}`,
  ...typography.body,
  ...FONT_PAGE_SMALL,
  fontWeight: 600,
  color: colors.textPrimary,
  padding: '8px 10px' as const,
}
const tdBase = {
  padding: '8px 10px' as const,
  borderBottom: `1px solid ${colors.borderLight}`,
  ...typography.body,
  fontSize: 12,
}

export interface OzonAnalyticsProductsProps {
  selectedCabinetId: number | null
  selectedSellerId?: number
  isAdmin: boolean
  workContextCabinetSelect?: WorkContextCabinetSelectProps
  cabinetSelectProps?: CabinetSelectProps
}

function filterArticles(articles: ArticleSummary[], query: string): ArticleSummary[] {
  const q = query.trim().toLowerCase()
  if (!q) return articles
  return articles.filter(
    (a) =>
      String(a.productId ?? a.nmId).includes(query.trim()) ||
      a.offerId?.toLowerCase().includes(q) ||
      a.vendorCode?.toLowerCase().includes(q) ||
      a.title?.toLowerCase().includes(q),
  )
}

function formatMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

function formatStock(value: number | null | undefined): string {
  if (value == null) return '—'
  return String(value)
}

export default function OzonAnalyticsProducts({
  selectedCabinetId,
  selectedSellerId,
  isAdmin,
  workContextCabinetSelect,
  cabinetSelectProps,
}: OzonAnalyticsProductsProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['ozon-analytics-articles', selectedCabinetId, selectedSellerId],
    queryFn: () =>
      analyticsApi.getArticleList(
        selectedSellerId,
        selectedCabinetId ?? undefined,
        false,
        false,
        false,
      ),
    enabled: selectedCabinetId != null,
  })

  const filteredArticles = useMemo(
    () => filterArticles(articles, searchQuery),
    [articles, searchQuery],
  )

  const priceDateLabel = useMemo(() => {
    const withDate = articles.find((a) => a.priceDate)
    if (!withDate?.priceDate) return null
    return dayjs(withDate.priceDate).format('DD.MM.YYYY')
  }, [articles])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        workContextCabinetSelect={isAdmin ? workContextCabinetSelect : undefined}
        cabinetSelectProps={cabinetSelectProps}
      />
      <Breadcrumbs />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: `${spacing.lg}px 0`,
          width: '100%',
          backgroundColor: colors.bgGray,
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            backgroundColor: colors.bgWhite,
            borderTop: `1px solid ${colors.borderLight}`,
            borderBottom: `1px solid ${colors.borderLight}`,
            padding: spacing.lg,
            boxShadow: shadows.md,
          }}
        >
          <Alert
            type="info"
            showIcon
            message="Каталог Ozon"
            description={
              priceDateLabel
                ? `Карточки, цены (снимок ${priceDateLabel}), остатки и заказы/выручка за ~14 дней. Сводная и реклама — позже.`
                : 'Карточки, цены, остатки и заказы/выручка после синхронизации. Сводная и реклама — позже.'
            }
            style={{ marginBottom: spacing.md }}
          />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: spacing.md,
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Input
              placeholder="Поиск по product_id, offer_id или названию"
              prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ maxWidth: 420, borderRadius: borderRadius.sm, color: colors.textPrimary }}
            />
            {!isLoading && (
              <span style={{ ...typography.body, color: colors.textSecondary, fontSize: 12 }}>
                {filteredArticles.length} из {articles.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: spacing.xxl }}>
              <Spin />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: spacing.xxl,
                ...typography.body,
                color: colors.textSecondary,
              }}
            >
              {articles.length === 0
                ? 'Нет товаров. Запустите «Обновить данные» для синхронизации каталога Ozon.'
                : 'Ничего не найдено по запросу.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ ...thBase, width: PRODUCT_PHOTO_WIDTH + 20 }}>Фото</th>
                    <th style={{ ...thBase, width: 110 }}>Product ID</th>
                    <th style={{ ...thBase, width: 150 }}>Offer ID</th>
                    <th style={thBase}>Название</th>
                    <th style={{ ...thBase, width: 100, textAlign: 'right' }}>Цена</th>
                    <th style={{ ...thBase, width: 100, textAlign: 'right' }}>Старая</th>
                    <th style={{ ...thBase, width: 72, textAlign: 'center' }}>FBO</th>
                    <th style={{ ...thBase, width: 72, textAlign: 'center' }}>FBS</th>
                    <th style={{ ...thBase, width: 80, textAlign: 'center' }}>Заказы</th>
                    <th style={{ ...thBase, width: 100, textAlign: 'right' }}>Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((a) => (
                    <tr key={a.productId ?? a.nmId}>
                      <td style={tdBase}>
                        {a.photoTm ? (
                          <img
                            src={a.photoTm}
                            alt=""
                            width={PRODUCT_PHOTO_WIDTH}
                            height={PRODUCT_PHOTO_HEIGHT}
                            style={{ objectFit: 'cover', borderRadius: borderRadius.sm, display: 'block' }}
                          />
                        ) : (
                          <span style={{ color: colors.textMuted }}>—</span>
                        )}
                      </td>
                      <td style={tdBase}>{a.productId ?? a.nmId}</td>
                      <td style={tdBase}>{a.offerId ?? a.vendorCode ?? '—'}</td>
                      <td style={tdBase}>{a.title || '—'}</td>
                      <td style={{ ...tdBase, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <Tooltip title={a.priceDate ? `Снимок: ${dayjs(a.priceDate).format('DD.MM.YYYY')}` : undefined}>
                          <span>{formatMoney(a.price)}</span>
                        </Tooltip>
                      </td>
                      <td
                        style={{
                          ...tdBase,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          color: colors.textSecondary,
                        }}
                      >
                        {formatMoney(a.oldPrice)}
                      </td>
                      <td style={{ ...tdBase, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                        {formatStock(a.stockFbo)}
                      </td>
                      <td style={{ ...tdBase, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                        {formatStock(a.stockFbs)}
                      </td>
                      <td style={{ ...tdBase, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                        <Tooltip title="Сумма ordered_units за ~14 дней">
                          <span>{formatStock(a.orderedUnits)}</span>
                        </Tooltip>
                      </td>
                      <td style={{ ...tdBase, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        <Tooltip title="Сумма revenue за ~14 дней">
                          <span>{formatMoney(a.revenue)}</span>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
