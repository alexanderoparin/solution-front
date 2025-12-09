import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin, Select } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { analyticsApi } from '../api/analytics'
import type { ArticleResponse } from '../types/analytics'
import { colors, typography, spacing, shadows, borderRadius, transitions } from '../styles/analytics'
import Header from '../components/Header'

dayjs.locale('ru')

// Определение воронок и их метрик
const FUNNELS = {
  general: {
    name: 'Общая воронка',
    metrics: [
      { key: 'transitions', name: 'Переходы\nв карточку' },
      { key: 'cart', name: 'Положили\nв корзину, шт' },
      { key: 'orders', name: 'Заказали\nтоваров, шт' },
      { key: 'orders_amount', name: 'Заказали\nна сумму, руб' },
      { key: 'cart_conversion', name: 'Конверсия\nв корзину, %' },
      { key: 'order_conversion', name: 'Конверсия\nв заказ, %' },
    ]
  },
  advertising: {
    name: 'Рекламная воронка',
    metrics: [
      { key: 'views', name: 'Просмотры' },
      { key: 'clicks', name: 'Клики' },
      { key: 'costs', name: 'Затраты,\nруб' },
      { key: 'cpc', name: 'СРС,\nруб' },
      { key: 'ctr', name: 'CTR, %' },
      { key: 'cpo', name: 'СРО,\nруб' },
      { key: 'drr', name: 'ДРР, %' },
    ]
  },
  pricing: {
    name: 'Ценообразование',
    metrics: [
      { key: 'price_before_discount', name: 'Цена до\nскидки, руб' },
      { key: 'seller_discount', name: 'Скидка\nпродавца, %' },
      { key: 'price_with_discount', name: 'Цена со\nскидкой, руб' },
      { key: 'wb_club_discount', name: 'Скидка\nWB Клуба, %' },
      { key: 'price_with_wb_club', name: 'Цена со скидкой\nWB Клуба, руб' },
      { key: 'price_with_spp', name: 'Цена с СПП,\nруб' },
      { key: 'spp_amount', name: 'СПП,\nруб' },
      { key: 'spp_percent', name: 'СПП, %' },
    ]
  }
}

function getLast14Days(): string[] {
  const days: string[] = []
  const yesterday = dayjs().subtract(1, 'day')
  for (let i = 13; i >= 0; i--) {
    days.push(yesterday.subtract(i, 'day').format('YYYY-MM-DD'))
  }
  return days.reverse() // Разворачиваем, чтобы самые новые были сверху
}

export default function AnalyticsArticle() {
  const { nmId } = useParams<{ nmId: string }>()
  const navigate = useNavigate()
  const [selectedFunnel1, setSelectedFunnel1] = useState<keyof typeof FUNNELS>('general')
  const [selectedFunnel2, setSelectedFunnel2] = useState<keyof typeof FUNNELS>('advertising')
  const [article, setArticle] = useState<ArticleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [last14Days] = useState<string[]>(getLast14Days())

  useEffect(() => {
    if (!nmId) {
      setError('Артикул не указан')
      setLoading(false)
      return
    }

    loadArticle(Number(nmId))
  }, [nmId])

  const loadArticle = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      // TODO: Обновить API для получения данных за последние 14 дней
      const data = await analyticsApi.getArticle(id, [])
      setArticle(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: number | null): string => {
    if (value === null || value === undefined) return '-'
    return value.toLocaleString('ru-RU')
  }

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`
  }

  const formatCurrency = (value: number): string => {
    return `${value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`
  }

  // Получаем данные метрики для конкретной даты
  const getMetricValueForDate = (metricKey: string, date: string): number | null => {
    if (!article) return null
    
    const dailyData = article.dailyData.find(d => d.date === date)
    if (!dailyData) return null
    
    // Метрики воронки из dailyData
    if (metricKey === 'transitions') return dailyData.transitions
    if (metricKey === 'cart') return dailyData.cart
    if (metricKey === 'orders') return dailyData.orders
    if (metricKey === 'orders_amount') return dailyData.ordersAmount
    if (metricKey === 'cart_conversion') return dailyData.cartConversion
    if (metricKey === 'order_conversion') return dailyData.orderConversion
    
    // Рекламные метрики из dailyData
    if (metricKey === 'views') return dailyData.views
    if (metricKey === 'clicks') return dailyData.clicks
    if (metricKey === 'costs') return dailyData.costs
    if (metricKey === 'cpc') return dailyData.cpc
    if (metricKey === 'ctr') return dailyData.ctr
    if (metricKey === 'cpo') return dailyData.cpo
    if (metricKey === 'drr') return dailyData.drr
    
    // Ценообразование из dailyData
    if (metricKey === 'price_before_discount') return dailyData.priceBeforeDiscount
    if (metricKey === 'seller_discount') return dailyData.sellerDiscount
    if (metricKey === 'price_with_discount') return dailyData.priceWithDiscount
    if (metricKey === 'wb_club_discount') return dailyData.wbClubDiscount
    if (metricKey === 'price_with_wb_club') return dailyData.priceWithWbClub
    if (metricKey === 'price_with_spp') return dailyData.priceWithSpp
    if (metricKey === 'spp_amount') return dailyData.sppAmount
    if (metricKey === 'spp_percent') return dailyData.sppPercent
    
    return null
  }

  if (loading) {
    return (
      <div style={{ 
        padding: spacing.xxl, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        padding: spacing.xxl, 
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ 
          color: colors.error, 
          fontSize: typography.h3.fontSize,
          marginBottom: spacing.md
        }}>
          Ошибка: {error}
        </div>
        <button
          onClick={() => navigate('/analytics')}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: colors.primary,
            color: colors.bgWhite,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            fontSize: typography.body.fontSize,
            fontWeight: 500,
            transition: transitions.normal
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryHover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary
          }}
        >
          Вернуться к сводной
        </button>
      </div>
    )
  }

  if (!article) {
    return (
      <div style={{ 
        padding: spacing.xxl, 
        width: '100%',
        textAlign: 'center',
        color: colors.textSecondary
      }}>
        <InfoCircleOutlined style={{ fontSize: '48px', marginBottom: spacing.md, color: colors.textMuted }} />
        <div style={{ fontSize: typography.h3.fontSize }}>Нет данных</div>
      </div>
    )
  }

  return (
    <>
      <Header articleTitle={article.article.title} />
      <div style={{ 
        padding: `${spacing.lg} ${spacing.md}`, 
        width: '100%',
        backgroundColor: colors.bgGray,
        minHeight: '100vh'
      }}>
      {/* Информация о карточке товара */}
      <div style={{
        backgroundColor: colors.bgWhite,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        boxShadow: shadows.md
      }}>
        <div style={{
          display: 'flex',
          gap: spacing.lg,
          alignItems: 'flex-start'
        }}>
          {article.article.photoTm && (
            <a
              href={article.article.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                flexShrink: 0,
                cursor: 'pointer',
                transition: transitions.fast
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              <img
                src={article.article.photoTm}
                alt={article.article.title}
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '300px',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.borderLight}`,
                  boxShadow: shadows.sm,
                  display: 'block'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </a>
          )}
          
          <div style={{
            display: 'flex',
            gap: spacing.xl,
            flex: 1,
            alignItems: 'flex-start'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: spacing.lg,
              flex: 1,
              alignContent: 'start'
            }}>
              {/* Первая колонка */}
              <div>
                <div style={{ 
                  ...typography.bodySmall, 
                  color: colors.textSecondary,
                  marginBottom: spacing.xs
                }}>
                  Артикул
                </div>
                <div style={{ 
                  ...typography.body, 
                  fontWeight: 600,
                  color: colors.textPrimary,
                  marginBottom: spacing.md
                }}>
                  {article.article.nmId}
                </div>
                {article.article.vendorCode && (
                  <>
                    <div style={{ 
                      ...typography.bodySmall, 
                      color: colors.textSecondary,
                      marginBottom: spacing.xs
                    }}>
                      Артикул продавца
                    </div>
                    <div style={{ 
                      ...typography.body, 
                      fontWeight: 500,
                      color: colors.textPrimary
                    }}>
                      {article.article.vendorCode}
                    </div>
                  </>
                )}
              </div>
              
              {/* Вторая колонка */}
              <div>
                <div style={{ 
                  ...typography.bodySmall, 
                  color: colors.textSecondary,
                  marginBottom: spacing.xs
                }}>
                  Категория
                </div>
                <div style={{ 
                  ...typography.body, 
                  fontWeight: 500,
                  color: colors.textPrimary,
                  marginBottom: spacing.md
                }}>
                  {article.article.subjectName || '-'}
                </div>
                <div style={{ 
                  ...typography.bodySmall, 
                  color: colors.textSecondary,
                  marginBottom: spacing.xs
                }}>
                  Бренд
                </div>
                <div style={{ 
                  ...typography.body, 
                  fontWeight: 500,
                  color: colors.textPrimary
                }}>
                  {article.article.brand || '-'}
                </div>
              </div>
              
              {/* Третья колонка */}
              {article.article.imtId && (
                <div>
                  <div style={{ 
                    ...typography.bodySmall, 
                    color: colors.textSecondary,
                    marginBottom: spacing.xs
                  }}>
                    IMT ID
                  </div>
                  <div style={{ 
                    ...typography.body, 
                    fontWeight: 500,
                    color: colors.textPrimary
                  }}>
                    {article.article.imtId}
                  </div>
                </div>
              )}
              
              {article.article.rating !== null && (
                <div>
                  <div style={{ 
                    ...typography.bodySmall, 
                    color: colors.textSecondary,
                    marginBottom: spacing.xs
                  }}>
                    Рейтинг
                  </div>
                  <div style={{ 
                    ...typography.body, 
                    fontWeight: 500,
                    color: colors.textPrimary
                  }}>
                    {article.article.rating.toFixed(1)} ⭐
                  </div>
                </div>
              )}
              
              {article.article.reviewsCount !== null && (
                <div>
                  <div style={{ 
                    ...typography.bodySmall, 
                    color: colors.textSecondary,
                    marginBottom: spacing.xs
                  }}>
                    Отзывов
                  </div>
                  <div style={{ 
                    ...typography.body, 
                    fontWeight: 500,
                    color: colors.textPrimary
                  }}>
                    {article.article.reviewsCount.toLocaleString('ru-RU')}
                  </div>
                </div>
              )}
            </div>
            
            {article.campaigns.length > 0 && (
              <div style={{
                width: '450px',
                flexShrink: 0
              }}>
                <div style={{
                  ...typography.h3,
                  marginBottom: spacing.md,
                  color: colors.textPrimary
                }}>
                  Рекламные кампании
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: spacing.sm,
                  alignContent: 'start'
                }}>
                  {article.campaigns.map(campaign => (
                    <div
                      key={campaign.id}
                      style={{
                        padding: spacing.sm,
                        border: `1px solid ${colors.borderLight}`,
                        borderRadius: borderRadius.sm,
                        backgroundColor: colors.bgGrayLight,
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{
                        ...typography.body,
                        fontWeight: 500,
                        color: colors.textPrimary,
                        marginBottom: spacing.xs,
                        lineHeight: 1.3
                      }}>
                        {campaign.name}
                      </div>
                      <div style={{
                        ...typography.bodySmall,
                        color: colors.textSecondary,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: spacing.xs,
                        lineHeight: 1.3
                      }}>
                        <span>ID: {campaign.id}</span>
                        {campaign.type && <span>• {campaign.type}</span>}
                        {campaign.statusName && (
                          <span style={{
                            padding: `2px ${spacing.xs}`,
                            backgroundColor: campaign.status === 9 
                              ? colors.successLight 
                              : campaign.status === 11 
                                ? colors.warningLight 
                                : colors.bgWhite,
                            color: campaign.status === 9 
                              ? colors.success 
                              : campaign.status === 11 
                                ? colors.warning 
                                : colors.textSecondary,
                            borderRadius: borderRadius.sm,
                            fontSize: '11px',
                            whiteSpace: 'nowrap'
                          }}>
                            {campaign.statusName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Блоки воронок */}
      <div style={{
        backgroundColor: colors.bgWhite,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xl,
        boxShadow: shadows.md
      }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{
            display: 'flex',
            marginBottom: spacing.md,
            position: 'relative'
          }}>
            <div style={{ width: '120px', flexShrink: 0 }}></div>
            <div style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              minWidth: `${FUNNELS[selectedFunnel1].metrics.length * 120}px`
            }}>
              <Select
                value={selectedFunnel1}
                onChange={(value) => setSelectedFunnel1(value)}
                style={{ width: 200 }}
                options={Object.entries(FUNNELS).map(([key, funnel]) => ({
                  label: funnel.name,
                  value: key
                }))}
              />
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              minWidth: `${FUNNELS[selectedFunnel2].metrics.length * 120}px`
            }}>
              <Select
                value={selectedFunnel2}
                onChange={(value) => setSelectedFunnel2(value)}
                style={{ width: 200 }}
                options={Object.entries(FUNNELS).map(([key, funnel]) => ({
                  label: funnel.name,
                  value: key
                }))}
              />
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: spacing.sm,
                  borderBottom: `2px solid ${colors.border}`,
                  borderRight: `2px solid ${colors.border}`,
                  ...typography.body,
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: colors.bgWhite,
                  zIndex: 2
                }}>
                  Дата
                </th>
                {FUNNELS[selectedFunnel1].metrics.map((metric, index) => (
                  <th key={metric.key} style={{
                    textAlign: 'center',
                    padding: `${spacing.xs} ${spacing.xs}`,
                    borderBottom: `2px solid ${colors.border}`,
                    borderRight: index === FUNNELS[selectedFunnel1].metrics.length - 1 ? `2px solid ${colors.border}` : `1px solid ${colors.borderLight}`,
                    ...typography.bodySmall,
                    fontWeight: 600,
                    whiteSpace: 'pre-line',
                    lineHeight: 1.3,
                    backgroundColor: colors.bgGrayLight,
                    maxWidth: '120px'
                  }}>
                    {metric.name}
                  </th>
                ))}
                {FUNNELS[selectedFunnel2].metrics.map(metric => (
                  <th key={metric.key} style={{
                    textAlign: 'center',
                    padding: `${spacing.xs} ${spacing.xs}`,
                    borderBottom: `2px solid ${colors.border}`,
                    ...typography.bodySmall,
                    fontWeight: 600,
                    whiteSpace: 'pre-line',
                    lineHeight: 1.3,
                    backgroundColor: colors.bgGrayLight,
                    maxWidth: '120px'
                  }}>
                    {metric.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {last14Days.map(date => (
                <tr key={date}>
                  <td style={{
                    padding: spacing.sm,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 500,
                    position: 'sticky',
                    left: 0,
                    backgroundColor: colors.bgWhite,
                    zIndex: 1
                  }}>
                    {dayjs(date).format('DD.MM.YYYY')}
                  </td>
                  {FUNNELS[selectedFunnel1].metrics.map((metric, index) => {
                    const value = getMetricValueForDate(metric.key, date)
                    const isPercent = metric.key.includes('conversion') || metric.key === 'ctr' || metric.key === 'drr' || metric.key === 'seller_discount' || metric.key === 'wb_club_discount' || metric.key === 'spp_percent'
                    const isCurrency = metric.key.includes('price') || metric.key === 'orders_amount' || metric.key === 'costs' || metric.key === 'cpc' || metric.key === 'cpo' || metric.key === 'spp_amount'
                    return (
                      <td key={metric.key} style={{
                        textAlign: 'center',
                        padding: `${spacing.xs} ${spacing.xs}`,
                        borderBottom: `1px solid ${colors.borderLight}`,
                        borderRight: index === FUNNELS[selectedFunnel1].metrics.length - 1 ? `2px solid ${colors.border}` : `1px solid ${colors.borderLight}`,
                        backgroundColor: colors.bgGrayLight,
                        ...typography.bodySmall
                      }}>
                        {value === null ? '-' : (
                          isPercent ? formatPercent(value) :
                          isCurrency ? formatCurrency(value) :
                          formatValue(value)
                        )}
                      </td>
                    )
                  })}
                  {FUNNELS[selectedFunnel2].metrics.map(metric => {
                    const value = getMetricValueForDate(metric.key, date)
                    const isPercent = metric.key.includes('conversion') || metric.key === 'ctr' || metric.key === 'drr' || metric.key === 'seller_discount' || metric.key === 'wb_club_discount' || metric.key === 'spp_percent'
                    const isCurrency = metric.key.includes('price') || metric.key === 'orders_amount' || metric.key === 'costs' || metric.key === 'cpc' || metric.key === 'cpo' || metric.key === 'spp_amount'
                    return (
                      <td key={metric.key} style={{
                        textAlign: 'center',
                        padding: `${spacing.xs} ${spacing.xs}`,
                        borderBottom: `1px solid ${colors.borderLight}`,
                        ...typography.bodySmall
                      }}>
                        {value === null ? '-' : (
                          isPercent ? formatPercent(value) :
                          isCurrency ? formatCurrency(value) :
                          formatValue(value)
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      </div>
    </>
  )
}

