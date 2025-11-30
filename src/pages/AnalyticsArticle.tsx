import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { analyticsApi } from '../api/analytics'
import { generateDefaultPeriods, validatePeriods } from '../utils/periodGenerator'
import type { ArticleResponse, Period } from '../types/analytics'

export default function AnalyticsArticle() {
  const { nmId } = useParams<{ nmId: string }>()
  const navigate = useNavigate()
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
    return <div>Загрузка...</div>
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <div>Ошибка: {error}</div>
        <button
          onClick={() => navigate('/analytics')}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Вернуться к сводной
        </button>
      </div>
    )
  }

  if (!article) {
    return <div>Нет данных</div>
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/analytics')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#F1F5F9',
            color: '#1E293B',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          ← Вернуться к сводной
        </button>
        <h1 style={{ color: '#1E293B', marginBottom: '8px' }}>{article.article.title}</h1>
        <div style={{ color: '#64748B', fontSize: '14px' }}>
          Артикул: {article.article.nmId} • {article.article.brand} • {article.article.subjectName}
        </div>
        {article.article.productUrl && (
          <a
            href={article.article.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#7C3AED',
              textDecoration: 'none',
              fontSize: '14px',
              marginTop: '8px',
              display: 'inline-block'
            }}
          >
            Открыть на Wildberries →
          </a>
        )}
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

      {/* Все метрики */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F1F5F9',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: '#1E293B', marginBottom: '16px', fontSize: '18px' }}>Метрики</h2>
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
              {article.metrics.map(metric => {
                const isPercent = metric.metricName.includes('conversion') || metric.metricName === 'ctr' || metric.metricName === 'drr'
                return (
                  <tr key={metric.metricName} style={{
                    backgroundColor: metric.category === 'funnel' ? '#E0F2FE' : '#D1FAE5'
                  }}>
                    <td style={{
                      padding: '8px',
                      borderBottom: '1px solid #F1F5F9',
                      color: '#1E293B'
                    }}>
                      {metric.metricNameRu || metric.metricName}
                    </td>
                    {metric.periods.map(period => (
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
                    ))}
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
              {article.dailyData.map(daily => (
                <tr key={daily.date}>
                  <td style={{
                    padding: '8px',
                    borderBottom: '1px solid #F1F5F9',
                    color: '#1E293B'
                  }}>
                    {new Date(daily.date).toLocaleDateString('ru-RU')}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: '8px',
                    borderBottom: '1px solid #F1F5F9',
                    color: '#1E293B'
                  }}>
                    {formatValue(daily.transitions)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: '8px',
                    borderBottom: '1px solid #F1F5F9',
                    color: '#1E293B'
                  }}>
                    {formatValue(daily.cart)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: '8px',
                    borderBottom: '1px solid #F1F5F9',
                    color: '#1E293B'
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
  )
}

