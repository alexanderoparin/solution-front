import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Spin, Select, DatePicker } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import locale from 'antd/locale/ru_RU'
import { analyticsApi } from '../api/analytics'
import type { ArticleResponse } from '../types/analytics'
import { colors, typography, spacing, shadows, borderRadius, transitions } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
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
  // 14 дней: вчера и 13 дней до этого
  for (let i = 13; i >= 0; i--) {
    days.push(yesterday.subtract(i, 'day').format('YYYY-MM-DD'))
  }
  return days.reverse() // Разворачиваем, чтобы самые новые были сверху
}

export default function AnalyticsArticle() {
  const { nmId } = useParams<{ nmId: string }>()
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)
  const isManagerOrAdmin = role === 'MANAGER' || role === 'ADMIN'
  
  // Получаем выбранного селлера из localStorage (если есть)
  const getSelectedSellerId = (): number | undefined => {
    if (!isManagerOrAdmin) return undefined
    const saved = localStorage.getItem('analytics_selected_seller_id')
    if (saved) {
      try {
        const sellerId = parseInt(saved, 10)
        if (!isNaN(sellerId)) {
          return sellerId
        }
      } catch {
        // Игнорируем ошибку
      }
    }
    return undefined
  }

  const [selectedFunnel1, setSelectedFunnel1] = useState<keyof typeof FUNNELS>('general')
  const [selectedFunnel2, setSelectedFunnel2] = useState<keyof typeof FUNNELS>('advertising')
  const [article, setArticle] = useState<ArticleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [last14Days] = useState<string[]>(getLast14Days())
  
  // Периоды для сравнения (по умолчанию - две недели, разбитые по неделям)
  const yesterday = dayjs().subtract(1, 'day')
  const [period1, setPeriod1] = useState<[Dayjs, Dayjs]>([
    yesterday.subtract(13, 'day'), // 14 дней назад
    yesterday.subtract(7, 'day')   // 7 дней назад
  ])
  const [period2, setPeriod2] = useState<[Dayjs, Dayjs]>([
    yesterday.subtract(6, 'day'),  // 6 дней назад
    yesterday                       // вчера
  ])

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
      const sellerId = getSelectedSellerId()
      // TODO: Обновить API для получения данных за последние 14 дней
      const data = await analyticsApi.getArticle(id, [], sellerId)
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
    return `${value.toFixed(2).replace('.', ',')}%`
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

  // Агрегирует данные за период
  const aggregatePeriodData = (startDate: Dayjs, endDate: Dayjs) => {
    if (!article) return null
    
    const periodData = article.dailyData.filter(d => {
      const date = dayjs(d.date)
      const start = startDate.startOf('day')
      const end = endDate.endOf('day')
      return (date.isAfter(start) || date.isSame(start, 'day')) && 
             (date.isBefore(end) || date.isSame(end, 'day'))
    })

    if (periodData.length === 0) return null

    // Агрегируем метрики воронки
    const transitions = periodData.reduce((sum, d) => sum + (d.transitions || 0), 0)
    const cart = periodData.reduce((sum, d) => sum + (d.cart || 0), 0)
    const orders = periodData.reduce((sum, d) => sum + (d.orders || 0), 0)
    const ordersAmount = periodData.reduce((sum, d) => sum + (d.ordersAmount || 0), 0)
    const cartConversion = transitions > 0 ? (cart / transitions) * 100 : null
    const orderConversion = cart > 0 ? (orders / cart) * 100 : null

    // Агрегируем рекламные метрики
    const views = periodData.reduce((sum, d) => sum + (d.views || 0), 0)
    const clicks = periodData.reduce((sum, d) => sum + (d.clicks || 0), 0)
    const costs = periodData.reduce((sum, d) => sum + (d.costs || 0), 0)
    const cpc = clicks > 0 ? costs / clicks : null
    const ctr = views > 0 ? (clicks / views) * 100 : null
    const cpo = orders > 0 ? costs / orders : null
    const drr = ordersAmount > 0 ? (costs / ordersAmount) * 100 : null

    return {
      transitions,
      cart,
      orders,
      ordersAmount,
      cartConversion,
      orderConversion,
      views,
      clicks,
      costs,
      cpc,
      ctr,
      cpo,
      drr
    }
  }

  // Вычисляет разницу в процентах
  const calculateDifference = (value1: number | null, value2: number | null): number | null => {
    if (value1 === null || value2 === null || value1 === 0) return null
    return ((value2 - value1) / value1) * 100
  }

  const period1Data = aggregatePeriodData(period1[0], period1[1])
  const period2Data = aggregatePeriodData(period2[0], period2[1])

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
        padding: spacing.xl,
        marginBottom: spacing.xl,
        boxShadow: shadows.md,
        transition: transitions.normal
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = shadows.lg
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = shadows.md
      }}
      >
        <div style={{
          display: 'flex',
          gap: spacing.xl,
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
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'scale(1)'
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
                  boxShadow: shadows.md,
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
              <div style={{
                padding: spacing.md,
                backgroundColor: colors.bgGrayLight,
                borderRadius: borderRadius.sm,
                border: `1px solid ${colors.borderLight}`
              }}>
                <div style={{ 
                  ...typography.bodySmall, 
                  color: colors.textSecondary,
                  marginBottom: spacing.xs,
                  fontWeight: 500
                }}>
                  Категория
                </div>
                <div style={{ 
                  ...typography.body, 
                  fontWeight: 600,
                  color: colors.textPrimary,
                  marginBottom: spacing.md
                }}>
                  {article.article.subjectName || '-'}
                </div>
                <div style={{ 
                  ...typography.bodySmall, 
                  color: colors.textSecondary,
                  marginBottom: spacing.xs,
                  fontWeight: 500
                }}>
                  Бренд
                </div>
                <div style={{ 
                  ...typography.body, 
                  fontWeight: 600,
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
                <div style={{
                  padding: spacing.md,
                  backgroundColor: colors.successLight,
                  borderRadius: borderRadius.sm,
                  border: `1px solid ${colors.success}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    ...typography.bodySmall, 
                    color: colors.textSecondary,
                    marginBottom: spacing.xs,
                    fontWeight: 500
                  }}>
                    Рейтинг
                  </div>
                  <div style={{ 
                    ...typography.h3, 
                    color: colors.success,
                    fontWeight: 700
                  }}>
                    {article.article.rating.toFixed(1)} ⭐
                  </div>
                </div>
              )}
              
              {article.article.reviewsCount !== null && (
                <div style={{
                  padding: spacing.md,
                  backgroundColor: colors.primaryLight,
                  borderRadius: borderRadius.sm,
                  border: `1px solid ${colors.primary}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    ...typography.bodySmall, 
                    color: colors.textSecondary,
                    marginBottom: spacing.xs,
                    fontWeight: 500
                  }}>
                    Отзывов
                  </div>
                  <div style={{ 
                    ...typography.h3, 
                    color: colors.primary,
                    fontWeight: 700
                  }}>
                    {article.article.reviewsCount.toLocaleString('ru-RU')}
                  </div>
                </div>
              )}
            </div>
            
            {article.campaigns.length > 0 && (
              <div style={{
                width: '450px',
                flexShrink: 0,
                padding: spacing.md,
                backgroundColor: colors.bgGrayLight,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.borderLight}`
              }}>
                <div style={{
                  ...typography.h3,
                  marginBottom: spacing.md,
                  color: colors.textPrimary,
                  fontWeight: 600
                }}>
                  Рекламные кампании
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: spacing.md,
                  alignContent: 'start'
                }}>
                  {article.campaigns.map(campaign => (
                    <div
                      key={campaign.id}
                      style={{
                        padding: spacing.md,
                        border: `1px solid ${colors.borderLight}`,
                        borderRadius: borderRadius.sm,
                        backgroundColor: colors.bgWhite,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: transitions.fast,
                        boxShadow: shadows.sm
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = shadows.md
                        e.currentTarget.style.borderColor = colors.primary
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = shadows.sm
                        e.currentTarget.style.borderColor = colors.borderLight
                        e.currentTarget.style.transform = 'translateY(0)'
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
        padding: spacing.lg,
        marginBottom: spacing.xl,
        boxShadow: shadows.md,
        transition: transitions.normal
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = shadows.lg
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = shadows.md
      }}
      >
        <div style={{ overflowX: 'hidden', width: '100%' }}>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '6px 8px',
                  borderBottom: `2px solid ${colors.border}`,
                  borderRight: `2px solid ${colors.border}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: colors.bgWhite,
                  zIndex: 2,
                  width: '90px'
                }}>
                  Дата
                </th>
                {FUNNELS[selectedFunnel1].metrics.map((metric, index) => {
                  const isGeneralFunnel = selectedFunnel1 === 'general'
                  const isAdvertisingFunnel = selectedFunnel1 === 'advertising'
                  return (
                    <th key={metric.key} style={{
                      textAlign: 'center',
                      padding: '4px 6px',
                      borderBottom: `2px solid ${colors.border}`,
                      borderRight: index === FUNNELS[selectedFunnel1].metrics.length - 1 ? `2px solid ${colors.border}` : `1px solid ${colors.borderLight}`,
                      fontSize: '10px',
                      fontWeight: 600,
                      whiteSpace: 'pre-line',
                      lineHeight: 1.2,
                      backgroundColor: isGeneralFunnel ? colors.funnelBg : isAdvertisingFunnel ? colors.advertisingBg : colors.bgGrayLight,
                      width: `${100 / (FUNNELS[selectedFunnel1].metrics.length + FUNNELS[selectedFunnel2].metrics.length)}%`
                    }}>
                      {metric.name}
                    </th>
                  )
                })}
                {FUNNELS[selectedFunnel2].metrics.map(metric => {
                  const isGeneralFunnel = selectedFunnel2 === 'general'
                  const isAdvertisingFunnel = selectedFunnel2 === 'advertising'
                  return (
                    <th key={metric.key} style={{
                      textAlign: 'center',
                      padding: '4px 6px',
                      borderBottom: `2px solid ${colors.border}`,
                      fontSize: '10px',
                      fontWeight: 600,
                      whiteSpace: 'pre-line',
                      lineHeight: 1.2,
                      backgroundColor: isGeneralFunnel ? colors.funnelBg : isAdvertisingFunnel ? colors.advertisingBg : colors.bgGrayLight,
                      width: `${100 / (FUNNELS[selectedFunnel1].metrics.length + FUNNELS[selectedFunnel2].metrics.length)}%`
                    }}>
                      {metric.name}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {last14Days.map((date) => {
                const isGeneralFunnel1 = selectedFunnel1 === 'general'
                const isAdvertisingFunnel1 = selectedFunnel1 === 'advertising'
                const isGeneralFunnel2 = selectedFunnel2 === 'general'
                const isAdvertisingFunnel2 = selectedFunnel2 === 'advertising'
                return (
                  <tr 
                    key={date}
                    style={{
                      transition: transitions.fast
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bgGrayLight
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <td style={{
                      padding: '6px 8px',
                      borderBottom: `1px solid ${colors.borderLight}`,
                      borderRight: `2px solid ${colors.border}`,
                      fontSize: '12px',
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
                          padding: '4px 6px',
                          borderBottom: `1px solid ${colors.borderLight}`,
                          borderRight: index === FUNNELS[selectedFunnel1].metrics.length - 1 ? `2px solid ${colors.border}` : `1px solid ${colors.borderLight}`,
                          backgroundColor: isGeneralFunnel1 ? colors.funnelBg : isAdvertisingFunnel1 ? colors.advertisingBg : colors.bgGrayLight,
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: transitions.fast
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
                          padding: '4px 6px',
                          borderBottom: `1px solid ${colors.borderLight}`,
                          backgroundColor: isGeneralFunnel2 ? colors.funnelBg : isAdvertisingFunnel2 ? colors.advertisingBg : colors.bgGrayLight,
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: transitions.fast
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Сравнение периодов и остатки */}
      {article && period1Data && period2Data && (() => {
        const nonZeroStocks = article?.stocks?.filter(stock => stock.amount > 0) || []
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: spacing.lg,
            marginBottom: spacing.xl,
            alignItems: 'start'
          }}>
            {/* Сравнение периодов */}
            <div style={{
              backgroundColor: colors.bgWhite,
              border: `1px solid ${colors.borderLight}`,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              boxShadow: shadows.md,
              transition: transitions.normal
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = shadows.lg
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = shadows.md
            }}
            >
              <h2 style={{ 
                ...typography.h2, 
                marginBottom: spacing.md,
                textAlign: 'center'
              }}>
                Сравнение периодов
              </h2>

              {/* Выбор периодов */}
              <div style={{
                display: 'flex',
                gap: spacing.lg,
                marginBottom: spacing.xl,
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div>
                  <div style={{ 
                    ...typography.bodySmall, 
                    color: colors.textSecondary,
                    marginBottom: spacing.xs
                  }}>
                    Период 1
                  </div>
                  <DatePicker.RangePicker
                    locale={locale.DatePicker}
                    value={period1}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        setPeriod1([dates[0], dates[1]])
                      }
                    }}
                    format="DD.MM.YYYY"
                    separator="→"
                    style={{ width: 240 }}
                  />
                </div>
                <div>
                  <div style={{ 
                    ...typography.bodySmall, 
                    color: colors.textSecondary,
                    marginBottom: spacing.xs
                  }}>
                    Период 2
                  </div>
                  <DatePicker.RangePicker
                    locale={locale.DatePicker}
                    value={period2}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        setPeriod2([dates[0], dates[1]])
                      }
                    }}
                    format="DD.MM.YYYY"
                    separator="→"
                    style={{ width: 240 }}
                  />
                </div>
              </div>

              {/* Сравнение по общей воронке и рекламе - два блока рядом */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: spacing.lg
              }}>
            {/* Сравнение по общей воронке */}
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.funnelBg }}>
                  <th style={{
                    textAlign: 'left',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 600,
                    width: '30%'
                  }}>
                    ОБЩАЯ ВОРОНКА
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 600,
                    backgroundColor: colors.bgGrayLight
                  }}>
                    {period1[0].format('DD.MM')} - {period1[1].format('DD.MM')}
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 600,
                    backgroundColor: colors.bgGrayLight
                  }}>
                    {period2[0].format('DD.MM')} - {period2[1].format('DD.MM')}
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 600,
                    backgroundColor: colors.bgGrayLight
                  }}>
                    Разница
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Переходы в карточку */}
                <tr>
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body
                  }}>
                    Переходы в карточку
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatValue(period1Data.transitions)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatValue(period2Data.transitions)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body,
                    color: (() => {
                      const diff = calculateDifference(period1Data.transitions, period2Data.transitions)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.transitions, period2Data.transitions) !== null 
                      ? `${calculateDifference(period1Data.transitions, period2Data.transitions)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.transitions, period2Data.transitions)!)}`
                      : '-'}
                  </td>
                </tr>
                {/* Положили в корзину */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.funnelBgHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgWhite
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 500
                  }}>
                    Положили в корзину
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatValue(period1Data.cart)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatValue(period2Data.cart)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body,
                    color: (() => {
                      const diff = calculateDifference(period1Data.cart, period2Data.cart)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.cart, period2Data.cart) !== null 
                      ? `${calculateDifference(period1Data.cart, period2Data.cart)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.cart, period2Data.cart)!)}`
                      : '-'}
                  </td>
                </tr>
                {/* Заказали товаров */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.funnelBgHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgWhite
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 500
                  }}>
                    Заказали товаров
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatValue(period1Data.orders)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatValue(period2Data.orders)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body,
                    color: (() => {
                      const diff = calculateDifference(period1Data.orders, period2Data.orders)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.orders, period2Data.orders) !== null 
                      ? `${calculateDifference(period1Data.orders, period2Data.orders)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.orders, period2Data.orders)!)}`
                      : '-'}
                  </td>
                </tr>
                {/* Заказали на сумму */}
                <tr>
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body
                  }}>
                    Заказали на сумму
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatCurrency(period1Data.ordersAmount)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatCurrency(period2Data.ordersAmount)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body,
                    color: (() => {
                      const diff = calculateDifference(period1Data.ordersAmount, period2Data.ordersAmount)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.ordersAmount, period2Data.ordersAmount) !== null 
                      ? `${calculateDifference(period1Data.ordersAmount, period2Data.ordersAmount)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.ordersAmount, period2Data.ordersAmount)!)}`
                      : '-'}
                  </td>
                </tr>
                {/* Конверсия в корзину */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.funnelBgHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgWhite
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 500
                  }}>
                    Конверсия в корзину
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period1Data.cartConversion !== null ? formatPercent(period1Data.cartConversion) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period2Data.cartConversion !== null ? formatPercent(period2Data.cartConversion) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    -
                  </td>
                </tr>
                {/* Конверсия в заказ */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.funnelBgHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgWhite
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 500
                  }}>
                    Конверсия в заказ
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period1Data.orderConversion !== null ? formatPercent(period1Data.orderConversion) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period2Data.orderConversion !== null ? formatPercent(period2Data.orderConversion) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    -
                  </td>
                </tr>
              </tbody>
              </table>
            </div>

            {/* Сравнение по рекламе */}
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.advertisingBg }}>
                  <th style={{
                    textAlign: 'left',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 600,
                    width: '30%'
                  }}>
                    РЕКЛАМНАЯ ВОРОНКА
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 600,
                    backgroundColor: colors.advertisingBg
                  }}>
                    {period1[0].format('DD.MM')} - {period1[1].format('DD.MM')}
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 600,
                    backgroundColor: colors.advertisingBg
                  }}>
                    {period2[0].format('DD.MM')} - {period2[1].format('DD.MM')}
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 600,
                    backgroundColor: colors.advertisingBg
                  }}>
                    Разница
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Просмотры */}
                <tr>
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body
                  }}>
                    Просмотры
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatValue(period1Data.views)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatValue(period2Data.views)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body,
                    color: (() => {
                      const diff = calculateDifference(period1Data.views, period2Data.views)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.views, period2Data.views) !== null 
                      ? `${calculateDifference(period1Data.views, period2Data.views)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.views, period2Data.views)!)}`
                      : '-'}
                  </td>
                </tr>
                {/* Клики */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.advertisingBgHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgWhite
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 500
                  }}>
                    Клики
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatValue(period1Data.clicks)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {formatValue(period2Data.clicks)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body,
                    color: (() => {
                      const diff = calculateDifference(period1Data.clicks, period2Data.clicks)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.clicks, period2Data.clicks) !== null 
                      ? `${calculateDifference(period1Data.clicks, period2Data.clicks)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.clicks, period2Data.clicks)!)}`
                      : '-'}
                  </td>
                </tr>
                {/* Затраты */}
                <tr>
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body
                  }}>
                    Затраты
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period1Data.costs !== null ? formatCurrency(period1Data.costs) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period2Data.costs !== null ? formatCurrency(period2Data.costs) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    -
                  </td>
                </tr>
                {/* CPC */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.advertisingBgHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgWhite
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 500
                  }}>
                    СРС
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period1Data.cpc !== null ? formatCurrency(period1Data.cpc) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period2Data.cpc !== null ? formatCurrency(period2Data.cpc) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    -
                  </td>
                </tr>
                {/* CTR */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.advertisingBgHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgWhite
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 500
                  }}>
                    CTR
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period1Data.ctr !== null ? formatPercent(period1Data.ctr) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period2Data.ctr !== null ? formatPercent(period2Data.ctr) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    -
                  </td>
                </tr>
                {/* CPO */}
                <tr>
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body
                  }}>
                    СРО
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period1Data.cpo !== null ? formatCurrency(period1Data.cpo) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period2Data.cpo !== null ? formatCurrency(period2Data.cpo) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    -
                  </td>
                </tr>
                {/* ДРР */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.advertisingBgHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bgWhite
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                    fontWeight: 500
                  }}>
                    ДРР
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period1Data.drr !== null ? formatPercent(period1Data.drr) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {period2Data.drr !== null ? formatPercent(period2Data.drr) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    -
                  </td>
                </tr>
              </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Остатки на текущий момент */}
        {nonZeroStocks.length > 0 && (
          <div style={{
            backgroundColor: colors.bgWhite,
            border: `1px solid ${colors.borderLight}`,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            boxShadow: shadows.md
          }}>
            <h2 style={{ 
              ...typography.h2, 
              marginBottom: spacing.md,
              textAlign: 'center',
              color: colors.textPrimary
            }}>
              Остатки на дату
            </h2>
            
            {(() => {
              const latestUpdate = nonZeroStocks
                .map(s => s.updatedAt)
                .filter(d => d !== null)
                .sort()
                .reverse()[0]
              const totalAmount = nonZeroStocks.reduce((sum, stock) => sum + stock.amount, 0)
              
              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: spacing.md,
                  marginBottom: spacing.lg,
                  alignItems: 'center',
                  minHeight: '70px'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    {latestUpdate && (
                      <div style={{
                        ...typography.bodySmall,
                        color: colors.textSecondary
                      }}>
                        Дата обновления {dayjs(latestUpdate).format('DD.MM.YY HH:mm')}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      ...typography.h3,
                      color: colors.bgWhite,
                      backgroundColor: colors.primary,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: borderRadius.sm,
                      fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      Всего {totalAmount.toLocaleString('ru-RU')}
                    </div>
                  </div>
                </div>
              )
            })()}
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.primaryLight }}>
                  <th style={{
                    textAlign: 'left',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.primary}`,
                    ...typography.body,
                    fontWeight: 600,
                    color: colors.primary
                  }}>
                    Склад
                  </th>
                  <th style={{
                    textAlign: 'left',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.primary}`,
                    ...typography.body,
                    fontWeight: 600,
                    backgroundColor: colors.primaryLight,
                    color: colors.primary
                  }}>
                    Кол-во
                  </th>
                </tr>
              </thead>
              <tbody>
                {nonZeroStocks.map((stock, index) => {
                  const isLowStock = stock.amount <= 1
                  return (
                    <tr 
                      key={stock.warehouseName} 
                      style={{
                        backgroundColor: index % 2 === 0 ? colors.bgWhite : colors.bgGrayLight,
                        transition: transitions.fast
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primaryLight
                        e.currentTarget.style.transform = 'scale(1.01)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? colors.bgWhite : colors.bgGrayLight
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      <td style={{
                        padding: spacing.md,
                        borderBottom: `1px solid ${colors.borderLight}`,
                        ...typography.body,
                        fontWeight: 500
                      }}>
                        {stock.warehouseName}
                      </td>
                      <td style={{
                        textAlign: 'center',
                        padding: spacing.md,
                        borderBottom: `1px solid ${colors.borderLight}`,
                        ...typography.body,
                        fontWeight: 600,
                        color: isLowStock ? colors.error : colors.textPrimary
                      }}>
                        {stock.amount.toLocaleString('ru-RU')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
          </div>
        )
      })()}

      </div>
    </>
  )
}
