import { useEffect, useState, useCallback } from 'react'
import { DatePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import locale from 'antd/locale/ru_RU'
import { analyticsApi } from '../api/analytics'
import { generateDefaultPeriods, validatePeriods } from '../utils/periodGenerator'
import type { SummaryResponse, MetricGroupResponse, Period } from '../types/analytics'

dayjs.locale('ru')

interface PeriodItemProps {
  period: Period
  periodsCount: number
  allPeriods: Period[]
  onPeriodChange: (periodId: number, dates: [Dayjs | null, Dayjs | null] | null) => void
  onRemovePeriod: (periodId: number) => void
}

function PeriodItem({ period, periodsCount, allPeriods, onPeriodChange, onRemovePeriod }: PeriodItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedRange, setSelectedRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Проверяет, пересекается ли дата с другими периодами
  const isDateOverlapping = (current: Dayjs): boolean => {
    const otherPeriods = allPeriods.filter(p => p.id !== period.id)
    const currentStart = dayjs(period.dateFrom)
    const currentEnd = dayjs(period.dateTo)
    
    // Определяем потенциальный диапазон
    let potentialStart: Dayjs
    let potentialEnd: Dayjs
    
    if (selectedRange && selectedRange[0] && selectedRange[1]) {
      // Если выбран полный диапазон, используем его
      potentialStart = selectedRange[0]
      potentialEnd = selectedRange[1]
      
      // Корректируем с учетом текущей даты
      if (current.isBefore(potentialStart)) {
        potentialStart = current
      } else if (current.isAfter(potentialEnd)) {
        potentialEnd = current
      }
    } else if (selectedRange && selectedRange[0]) {
      // Выбрана начальная дата
      potentialStart = selectedRange[0]
      potentialEnd = current.isAfter(selectedRange[0]) ? current : currentEnd
    } else if (selectedRange && selectedRange[1]) {
      // Выбрана конечная дата
      potentialEnd = selectedRange[1]
      potentialStart = current.isBefore(selectedRange[1]) ? current : currentStart
    } else {
      // Диапазон не выбран, используем текущее значение периода и проверяем с учетом текущей даты
      // Если текущая дата вне текущего диапазона, расширяем диапазон
      if (current.isBefore(currentStart)) {
        potentialStart = current
        potentialEnd = currentEnd
      } else if (current.isAfter(currentEnd)) {
        potentialStart = currentStart
        potentialEnd = current
      } else {
        potentialStart = currentStart
        potentialEnd = currentEnd
      }
    }
    
    // Проверяем пересечение с другими периодами
    for (const otherPeriod of otherPeriods) {
      const otherStart = dayjs(otherPeriod.dateFrom)
      const otherEnd = dayjs(otherPeriod.dateTo)
      
      // Пересечение: potentialEnd >= otherStart && potentialStart <= otherEnd
      if ((potentialEnd.isAfter(otherStart) || potentialEnd.isSame(otherStart)) &&
          (potentialStart.isBefore(otherEnd) || potentialStart.isSame(otherEnd))) {
        return true
      }
    }
    
    return false
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        maxWidth: '220px',
        position: 'relative'
      }}
    >
      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', textAlign: 'center' }}>{period.name}</div>
      <DatePicker.RangePicker
        locale={locale.DatePicker}
        value={[dayjs(period.dateFrom), dayjs(period.dateTo)]}
        onChange={(dates) => {
          setSelectedRange(dates)
          onPeriodChange(period.id, dates)
          // Закрываем календарь только если выбран полный диапазон
          if (dates && dates[0] && dates[1]) {
            setPickerOpen(false)
          }
        }}
        onCalendarChange={(dates) => {
          setSelectedRange(dates)
        }}
        format="DD.MM.YYYY"
        separator="→"
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open)
          // Если закрываем календарь, но выбрана только одна дата, оставляем открытым
          if (open === false && selectedRange && selectedRange[0] && !selectedRange[1]) {
            setTimeout(() => setPickerOpen(true), 0)
          }
        }}
        disabledDate={(current) => {
          // Запрещаем выбор будущих дат
          if (current && current > dayjs().endOf('day')) {
            return true
          }
          
          // Проверяем пересечение с другими периодами
          return isDateOverlapping(current)
        }}
      />
      {periodsCount > 2 && isHovered && (
        <button
          onClick={() => onRemovePeriod(period.id)}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            lineHeight: '1',
            padding: 0,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
          title="Удалить период"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F1F5F9'
            e.currentTarget.style.color = '#475569'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF'
            e.currentTarget.style.color = '#64748B'
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

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

export default function AnalyticsSummary() {
  const [periods, setPeriods] = useState<Period[]>(() => {
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

  const handlePeriodChange = (periodId: number, dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!dates || !dates[0] || !dates[1]) return
    
    const dateFrom = dates[0]
    const dateTo = dates[1]
    if (!dateFrom || !dateTo) return
    
    const updatedPeriods = periods.map(period => {
      if (period.id === periodId) {
        return {
          ...period,
          dateFrom: dateFrom.format('YYYY-MM-DD'),
          dateTo: dateTo.format('YYYY-MM-DD')
        }
      }
      return period
    })
    
    if (validatePeriods(updatedPeriods)) {
      setPeriods(updatedPeriods)
    }
  }

  const handleAddPeriod = () => {
    if (periods.length >= 5) return
    
    // Находим самую раннюю дату начала среди всех периодов
    const earliestDate = periods.reduce((earliest, period) => {
      const periodDate = dayjs(period.dateFrom)
      return periodDate.isBefore(earliest) ? periodDate : earliest
    }, dayjs(periods[0].dateFrom))
    
    // Создаем новый период на 3 дня раньше самого раннего
    const newPeriodEnd = earliestDate.subtract(1, 'day')
    const newPeriodStart = newPeriodEnd.subtract(2, 'day')
    
    const newPeriod: Period = {
      id: Math.max(...periods.map(p => p.id)) + 1,
      name: `период №${periods.length + 1}`,
      dateFrom: newPeriodStart.format('YYYY-MM-DD'),
      dateTo: newPeriodEnd.format('YYYY-MM-DD')
    }
    
    const updatedPeriods = [...periods, newPeriod]
    // Пересчитываем id и name для всех периодов
    const renumberedPeriods = updatedPeriods.map((period, index) => ({
      ...period,
      id: index + 1,
      name: `период №${index + 1}`
    }))
    
    setPeriods(renumberedPeriods)
  }

  const handleRemovePeriod = (periodId: number) => {
    if (periods.length <= 2) return
    
    const updatedPeriods = periods.filter(period => period.id !== periodId)
    // Пересчитываем id и name для оставшихся периодов
    const renumberedPeriods = updatedPeriods.map((period, index) => ({
      ...period,
      id: index + 1,
      name: `период №${index + 1}`
    }))
    
    setPeriods(renumberedPeriods)
  }
  
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

  const formatPeriodDates = (period: Period): string => {
    const dateFrom = dayjs(period.dateFrom).format('DD.MM')
    const dateTo = dayjs(period.dateTo).format('DD.MM')
    return `${dateFrom} - ${dateTo}`
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

      {/* Периоды */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F1F5F9',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#1E293B', marginBottom: '16px', fontSize: '18px', textAlign: 'center' }}>Укажите желаемые периоды для сравнения данных</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {periods.map((period) => (
            <PeriodItem
              key={period.id}
              period={period}
              periodsCount={periods.length}
              allPeriods={periods}
              onPeriodChange={handlePeriodChange}
              onRemovePeriod={handleRemovePeriod}
            />
          ))}
          {periods.length < 5 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '32px'
            }}>
              <button
                onClick={handleAddPeriod}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '2px dashed #94A3B8',
                  backgroundColor: 'transparent',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  lineHeight: '1',
                  padding: 0,
                  marginTop: '20px'
                }}
                title="Добавить период"
              >
                +
              </button>
            </div>
          )}
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
                    {formatPeriodDates(period)}
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
                                        {formatPeriodDates(period)}
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

