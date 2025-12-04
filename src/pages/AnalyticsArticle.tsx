import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DatePicker, Spin, Tooltip } from 'antd'
import { InfoCircleOutlined, PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import locale from 'antd/locale/ru_RU'
import { analyticsApi } from '../api/analytics'
import { generateDefaultPeriods, validatePeriods } from '../utils/periodGenerator'
import type { ArticleResponse, Period } from '../types/analytics'
import { colors, typography, spacing, shadows, borderRadius, transitions } from '../styles/analytics'
import Header from '../components/Header'

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
        style={{
          borderRadius: borderRadius.md,
          borderColor: colors.border
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
        <Tooltip title="Удалить период">
          <button
            onClick={() => onRemovePeriod(period.id)}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: borderRadius.full,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.bgWhite,
              color: colors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              lineHeight: '1',
              padding: 0,
              boxShadow: shadows.sm,
              transition: transitions.fast
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.errorLight
              e.currentTarget.style.color = colors.error
              e.currentTarget.style.borderColor = colors.error
              e.currentTarget.style.boxShadow = shadows.md
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.bgWhite
              e.currentTarget.style.color = colors.textSecondary
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.boxShadow = shadows.sm
            }}
          >
            <DeleteOutlined />
          </button>
        </Tooltip>
      )}
    </div>
  )
}

export default function AnalyticsArticle() {
  const { nmId } = useParams<{ nmId: string }>()
  const navigate = useNavigate()
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

  useEffect(() => {
    // Сохраняем периоды в localStorage при изменении
    localStorage.setItem('analytics_periods', JSON.stringify(periods))
  }, [periods])

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
  const [article, setArticle] = useState<ArticleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!nmId) {
      setError('Артикул не указан')
      setLoading(false)
      return
    }

    loadArticle(Number(nmId))
  }, [nmId, periods])

  const loadArticle = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      const data = await analyticsApi.getArticle(id, periods)
      setArticle(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
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
        maxWidth: '1400px', 
        margin: '0 auto',
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
        maxWidth: '1400px', 
        margin: '0 auto',
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
      <Header />
      <div style={{ 
        padding: `${spacing.lg} ${spacing.md}`, 
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: colors.bgGray,
        minHeight: '100vh'
      }}>
      <div style={{ marginBottom: spacing.xl }}>
        <button
          onClick={() => navigate('/analytics')}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: colors.bgWhite,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            marginBottom: spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            fontSize: typography.body.fontSize,
            fontWeight: 500,
            transition: transitions.normal,
            boxShadow: shadows.sm
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.bgGrayLight
            e.currentTarget.style.boxShadow = shadows.md
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.bgWhite
            e.currentTarget.style.boxShadow = shadows.sm
          }}
        >
          <ArrowLeftOutlined /> Вернуться к сводной
        </button>
        <h1 style={{ 
          ...typography.h1, 
          marginBottom: spacing.sm,
          borderBottom: `3px solid ${colors.primary}`,
          paddingBottom: spacing.md
        }}>
          {article.article.title}
        </h1>
        <div style={{ 
          ...typography.body, 
          color: colors.textSecondary,
          marginBottom: spacing.sm
        }}>
          Артикул: <strong style={{ color: colors.textPrimary }}>{article.article.nmId}</strong> • {article.article.brand} • {article.article.subjectName}
        </div>
        {article.article.productUrl && (
          <a
            href={article.article.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: colors.primary,
              textDecoration: 'none',
              fontSize: typography.body.fontSize,
              marginTop: spacing.sm,
              display: 'inline-block',
              fontWeight: 500,
              transition: transitions.fast
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline'
              e.currentTarget.style.color = colors.primaryHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none'
              e.currentTarget.style.color = colors.primary
            }}
          >
            Открыть на Wildberries →
          </a>
        )}
      </div>

      {/* Периоды */}
      <div style={{
        backgroundColor: colors.bgWhite,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xl,
        boxShadow: shadows.md
      }}>
        <h2 style={{ 
          ...typography.h2, 
          marginBottom: spacing.md, 
          textAlign: 'center' 
        }}>
          Укажите желаемые периоды для сравнения данных
        </h2>
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
              <Tooltip title="Добавить период">
                <button
                  onClick={handleAddPeriod}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: borderRadius.full,
                    border: `2px dashed ${colors.border}`,
                    backgroundColor: colors.bgWhite,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    lineHeight: '1',
                    padding: 0,
                    marginTop: '20px',
                    transition: transitions.normal,
                    boxShadow: shadows.sm
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.primary
                    e.currentTarget.style.color = colors.primary
                    e.currentTarget.style.backgroundColor = colors.primaryLight
                    e.currentTarget.style.boxShadow = shadows.md
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.color = colors.textSecondary
                    e.currentTarget.style.backgroundColor = colors.bgWhite
                    e.currentTarget.style.boxShadow = shadows.sm
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <PlusOutlined />
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      {/* Все метрики */}
      <div style={{
        backgroundColor: colors.bgWhite,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xl,
        boxShadow: shadows.md
      }}>
        <h2 style={{ 
          ...typography.h2, 
          marginBottom: spacing.md 
        }}>
          Метрики
        </h2>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: colors.bgGrayLight }}>
                <th style={{
                  textAlign: 'left',
                  padding: spacing.md,
                  borderBottom: `2px solid ${colors.border}`,
                  ...typography.h3,
                  fontWeight: 600
                }}>
                  Метрика
                </th>
                {periods.map(period => (
                  <th key={period.id} style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.border}`,
                    ...typography.h3,
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    {period.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {article.metrics.map((metric) => {
                const isPercent = metric.metricName.includes('conversion') || metric.metricName === 'ctr' || metric.metricName === 'drr'
                return (
                  <tr 
                    key={metric.metricName} 
                    style={{
                      backgroundColor: metric.category === 'funnel' ? colors.funnelBg : colors.advertisingBg,
                      transition: transitions.fast
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = metric.category === 'funnel' ? colors.funnelBgHover : colors.advertisingBgHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = metric.category === 'funnel' ? colors.funnelBg : colors.advertisingBg
                    }}
                  >
                    <td style={{
                      padding: spacing.md,
                      borderBottom: `1px solid ${colors.borderLight}`,
                      ...typography.body,
                      fontWeight: 500
                    }}>
                      {metric.metricNameRu || metric.metricName}
                    </td>
                    {metric.periods.map(period => {
                      const isEmpty = period.value === null || period.value === undefined || period.value === 0
                      const changeColor = period.changePercent !== null 
                        ? (period.changePercent >= 0 ? colors.success : colors.error)
                        : colors.textSecondary
                      return (
                        <td key={period.periodId} style={{
                          textAlign: 'center',
                          padding: spacing.md,
                          borderBottom: `1px solid ${colors.borderLight}`,
                          color: isEmpty ? colors.textMuted : colors.textPrimary
                        }}>
                          <div style={{ ...typography.number }}>
                            {isPercent ? formatPercent(period.value as number) : formatValue(period.value as number)}
                          </div>
                          {period.changePercent !== null && (
                            <div style={{
                              ...typography.bodySmall,
                              color: changeColor,
                              fontWeight: 600,
                              marginTop: spacing.xs
                            }}>
                              {formatChangePercent(period.changePercent)}
                            </div>
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

      {/* Ежедневные данные */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F1F5F9',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#1E293B', marginBottom: '16px', fontSize: '18px' }}>Ежедневные данные</h2>
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
                  Дата
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '8px',
                  borderBottom: '1px solid #F1F5F9',
                  color: '#1E293B'
                }}>
                  Переходы
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '8px',
                  borderBottom: '1px solid #F1F5F9',
                  color: '#1E293B'
                }}>
                  Корзина
                </th>
                <th style={{
                  textAlign: 'center',
                  padding: '8px',
                  borderBottom: '1px solid #F1F5F9',
                  color: '#1E293B'
                }}>
                  Заказы
                </th>
              </tr>
            </thead>
            <tbody>
              {article.dailyData.map((daily, index) => (
                <tr 
                  key={daily.date}
                  style={{
                    backgroundColor: index % 2 === 0 ? colors.bgWhite : colors.bgGrayLight
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.body
                  }}>
                    {new Date(daily.date).toLocaleDateString('ru-RU')}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.number
                  }}>
                    {formatValue(daily.transitions)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.number
                  }}>
                    {formatValue(daily.cart)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.borderLight}`,
                    ...typography.number
                  }}>
                    {formatValue(daily.orders)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Рекламные кампании */}
      {article.campaigns.length > 0 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #F1F5F9',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h2 style={{ color: '#1E293B', marginBottom: '16px', fontSize: '18px' }}>Рекламные кампании</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {article.campaigns.map(campaign => (
              <div
                key={campaign.id}
                style={{
                  padding: '12px',
                  border: '1px solid #F1F5F9',
                  borderRadius: '4px',
                  backgroundColor: '#F8FAFC'
                }}
              >
                <div style={{ color: '#1E293B', fontWeight: '500' }}>{campaign.name}</div>
                <div style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
                  ID: {campaign.id} • Тип: {campaign.type || 'Не указан'} • Создана: {new Date(campaign.createdAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  )
}

