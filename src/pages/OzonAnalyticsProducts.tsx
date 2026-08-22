import { useMemo, useState } from 'react'
import { Input, Spin, Alert } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
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
            description="Показаны синхронизированные карточки товаров. Метрики продаж и реклама для Ozon будут добавлены позже."
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
                    <th style={{ ...thBase, width: 120 }}>Product ID</th>
                    <th style={{ ...thBase, width: 160 }}>Offer ID</th>
                    <th style={thBase}>Название</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((a) => (
                    <tr key={a.productId ?? a.nmId}>
                      <td style={{ padding: '8px 10px', borderBottom: `1px solid ${colors.borderLight}` }}>
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
                      <td
                        style={{
                          padding: '8px 10px',
                          borderBottom: `1px solid ${colors.borderLight}`,
                          ...typography.body,
                          fontSize: 12,
                        }}
                      >
                        {a.productId ?? a.nmId}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          borderBottom: `1px solid ${colors.borderLight}`,
                          ...typography.body,
                          fontSize: 12,
                        }}
                      >
                        {a.offerId ?? a.vendorCode ?? '—'}
                      </td>
                      <td
                        style={{
                          padding: '8px 10px',
                          borderBottom: `1px solid ${colors.borderLight}`,
                          ...typography.body,
                          fontSize: 12,
                        }}
                      >
                        {a.title || '—'}
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
