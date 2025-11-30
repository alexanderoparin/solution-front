import { useEffect, useState, useCallback } from 'react'
import { analyticsApi } from '../api/analytics'
import { generateDefaultPeriods, validatePeriods } from '../utils/periodGenerator'
import type { SummaryResponse, MetricGroupResponse, Period } from '../types/analytics'

// Английские ключи метрик (используются в API)
const METRIC_KEYS = [
  'transitions',
  'cart',
  'orders',
  'orders_amount',
  'cart_conversion',
  'order_conversion',
  'views',
  'clicks',
  'costs',
  'cpc',
  'ctr',
  'cpo',
  'drr',
]

// Маппинг английских ключей на русские названия
const METRIC_NAMES_RU: Record<string, string> = {
  transitions: 'Переходы в карточку',
  cart: 'Положили в корзину, шт',
  orders: 'Заказали товаров, шт',
  orders_amount: 'Заказали на сумму, руб',
  cart_conversion: 'Конверсия в корзину, %',
  order_conversion: 'Конверсия в заказ, %',
  views: 'Просмотры',
  clicks: 'Клики',
  costs: 'Затраты, руб',
  cpc: 'СРС, руб',
  ctr: 'CTR, %',
  cpo: 'СРО, руб',
  drr: 'ДРР, %',
}

const FUNNEL_METRICS = [
  'transitions',
  'cart',
  'orders',
  'orders_amount',
  'cart_conversion',
  'order_conversion',
]

const ADVERTISING_METRICS = [
  'views',
  'clicks',
  'costs',
  'cpc',
  'ctr',
  'cpo',
  'drr',
]

export default function AnalyticsSummary() {
  const [periods] = useState<Period[]>(() => {
    // Загружаем периоды из localStorage или генерируем по умолчанию
    const saved = localStorage.getItem('analytics_periods')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Period[]
        if (validatePeriods(parsed)) {
          return parsed
        }
      } catch {
        // Если не удалось распарсить, используем дефолтные
      }
    }
    return generateDefaultPeriods()
  })
  
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [excludedNmIds] = useState<Set<number>>(new Set())
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set())
  const [metricGroups, setMetricGroups] = useState<Map<string, MetricGroupResponse>>(new Map())

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const excludedArray = Array.from(excludedNmIds)
      const data = await analyticsApi.getSummary({
        periods,
        excludedNmIds: excludedArray.length > 0 ? excludedArray : undefined,
      })
      setSummary(data)
      // Очищаем загруженные метрики при изменении фильтра или периодов
      setMetricGroups(new Map())
      setExpandedMetrics(new Set())
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }, [excludedNmIds, periods])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  useEffect(() => {
    // Сохраняем периоды в localStorage при изменении
    localStorage.setItem('analytics_periods', JSON.stringify(periods))
  }, [periods])

  const loadMetricGroup = async (metricName: string) => {
    if (metricGroups.has(metricName)) {
      return // Уже загружено
    }

    try {
      const excludedArray = Array.from(excludedNmIds)
      const data = await analyticsApi.getMetricGroup(metricName, {
        periods,
        excludedNmIds: excludedArray.length > 0 ? excludedArray : undefined,
      })
      setMetricGroups(prev => new Map(prev).set(metricName, data))
    } catch (err: any) {
      console.error(`Ошибка при загрузке метрики ${metricName}:`, err)
    }
  }

  const toggleMetric = (metricName: string) => {
    setExpandedMetrics(prev => {
      const newSet = new Set(prev)
      if (newSet.has(metricName)) {
        newSet.delete(metricName)
      } else {
        newSet.add(metricName)
        loadMetricGroup(metricName)
      }
      return newSet
    })
  }

  const formatValue = (value: number | null): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') {
      return value.toLocaleString('ru-RU')
    }
    return String(value)
  }

  const formatPercent = (value: number | null): string => {
    if (value === null || value === undefined) return '-%'
    return `${value.toFixed(2)}%`
  }

  const formatChangePercent = (value: number | null): string => {
    if (value === null || value === undefined) return '-%'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  if (loading && !summary) {
    return <div>Загрузка...</div>
  }

  if (error) {
    return <div>Ошибка: {error}</div>
  }

  if (!summary) {
    return <div>Нет данных</div>
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: '#1E293B', marginBottom: '24px' }}>Сводная аналитика</h1>

      {/* Общая информация */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F1F5F9',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <div style={{ color: '#64748B', fontSize: '14px' }}>Старт работы</div>
            <div style={{ color: '#1E293B', fontWeight: '500' }}>
              {new Date(summary.generalInfo.startOfWork).toLocaleDateString('ru-RU')}
            </div>
          </div>
          <div>
            <div style={{ color: '#64748B', fontSize: '14px' }}>Артикулов в работе</div>
            <div style={{ color: '#1E293B', fontWeight: '500', fontSize: '20px' }}>
              {summary.generalInfo.articlesInWork}
            </div>
          </div>
        </div>
      </div>

      {/* Периоды */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F1F5F9',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#1E293B', marginBottom: '16px', fontSize: '18px' }}>Периоды</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {periods.map(period => (
            <div key={period.id} style={{
              backgroundColor: '#1E293B',
              color: '#FFFFFF',
              padding: '12px',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', marginBottom: '4px' }}>{period.name}</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>
                {new Date(period.dateFrom).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} -{' '}
                {new Date(period.dateTo).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Сводные метрики */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F1F5F9',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#1E293B', marginBottom: '16px', fontSize: '18px' }}>Сводные метрики</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #F1F5F9', color: '#1E293B' }}>
                  Метрика
                </th>
                {periods.map(period => (
                  <th key={period.id} style={{
                    textAlign: 'center',
                    padding: '8px',
                    borderBottom: '1px solid #F1F5F9',
                    color: '#1E293B'
                  }}>
                    {period.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_KEYS.map(metricKey => {
                const metricNameRu = METRIC_NAMES_RU[metricKey]
                const category = FUNNEL_METRICS.includes(metricKey) ? 'funnel' : 'advertising'
                const metrics = summary.aggregatedMetrics
                const getMetricValue = (periodId: number) => {
                  const periodMetrics = metrics[periodId]
                  if (!periodMetrics) return null
                  
                  switch (metricKey) {
                    case 'transitions': return periodMetrics.transitions
                    case 'cart': return periodMetrics.cart
                    case 'orders': return periodMetrics.orders
                    case 'orders_amount': return periodMetrics.ordersAmount
                    case 'cart_conversion': return periodMetrics.cartConversion
                    case 'order_conversion': return periodMetrics.orderConversion
                    case 'views': return periodMetrics.views
                    case 'clicks': return periodMetrics.clicks
                    case 'costs': return periodMetrics.costs
                    case 'cpc': return periodMetrics.cpc
                    case 'ctr': return periodMetrics.ctr
                    case 'cpo': return periodMetrics.cpo
                    case 'drr': return periodMetrics.drr
                    default: return null
                  }
                }

                const isExpanded = expandedMetrics.has(metricKey)
                const metricGroup = metricGroups.get(metricKey)

                return (
                  <>
                    <tr 
                      key={metricKey} 
                      onClick={() => toggleMetric(metricKey)}
                      style={{
                        backgroundColor: category === 'funnel' ? '#E0F2FE' : '#D1FAE5',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{isExpanded ? '▼' : '▶'}</span>
                        {metricNameRu}
                      </td>
                      {periods.map(period => {
                        const value = getMetricValue(period.id)
                        const isPercent = metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr'
                        return (
                          <td key={period.id} style={{
                            textAlign: 'center',
                            padding: '8px',
                            borderBottom: '1px solid #F1F5F9',
                            color: '#1E293B'
                          }}>
                            {isPercent ? formatPercent(value) : formatValue(value)}
                          </td>
                        )
                      })}
                    </tr>
                    {isExpanded && metricGroup && (
                      <tr key={`${metricKey}-detail`}>
                        <td colSpan={periods.length + 1} style={{ padding: '0', borderBottom: '1px solid #F1F5F9' }}>
                          <div style={{ padding: '16px', backgroundColor: '#FFFFFF' }}>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th style={{
                                      textAlign: 'left',
                                      padding: '8px',
                                      borderBottom: '1px solid #F1F5F9',
                                      color: '#1E293B'
                                    }}>
                                      Артикул
                                    </th>
                                    {periods.map(period => (
                                      <th key={period.id} style={{
                                        textAlign: 'center',
                                        padding: '8px',
                                        borderBottom: '1px solid #F1F5F9',
                                        color: '#1E293B'
                                      }}>
                                        {period.name}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {metricGroup.articles.map(article => (
                                    <tr key={article.nmId}>
                                      <td style={{
                                        padding: '8px',
                                        borderBottom: '1px solid #F1F5F9',
                                        color: '#1E293B'
                                      }}>
                                        <a
                                          href={`/analytics/article/${article.nmId}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            color: '#7C3AED',
                                            textDecoration: 'none',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.textDecoration = 'underline'
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.textDecoration = 'none'
                                          }}
                                        >
                                          {article.nmId}
                                        </a>
                                      </td>
                                      {article.periods.map(period => {
                                        const isPercent = metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr'
                                        return (
                                          <td key={period.periodId} style={{
                                            textAlign: 'center',
                                            padding: '8px',
                                            borderBottom: '1px solid #F1F5F9',
                                            color: '#1E293B'
                                          }}>
                                            <div>{isPercent ? formatPercent(period.value as number) : formatValue(period.value as number)}</div>
                                            {period.changePercent !== null && (
                                              <div style={{
                                                fontSize: '12px',
                                                color: period.changePercent >= 0 ? '#10B981' : '#EF4444'
                                              }}>
                                                {formatChangePercent(period.changePercent)}
                                              </div>
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
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

