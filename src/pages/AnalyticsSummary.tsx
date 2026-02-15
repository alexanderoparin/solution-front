import { useEffect, useState, useCallback, useMemo } from 'react'
import { DatePicker, Spin, Tooltip, Popover, Button, Input, Checkbox, Select, message } from 'antd'
import { InfoCircleOutlined, PlusOutlined, DeleteOutlined, CaretRightOutlined, CaretDownOutlined, FilterOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import locale from 'antd/locale/ru_RU'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { userApi } from '../api/user'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId, getStoredCabinetIdForSeller, setStoredCabinetIdForSeller } from '../api/cabinets'
import { generateDefaultPeriods, validatePeriods } from '../utils/periodGenerator'
import { analyticsRequestQueue } from '../utils/requestQueue'
import type { SummaryResponse, MetricGroupResponse, Period, ArticleSummary } from '../types/analytics'
import { colors, typography, spacing, shadows, borderRadius, transitions } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'

dayjs.locale('ru')

interface PeriodItemProps {
  period: Period
  periodsCount: number
  onPeriodChange: (periodId: number, dates: [Dayjs | null, Dayjs | null] | null) => void
  onRemovePeriod: (periodId: number) => void
}

function PeriodItem({ period, periodsCount, onPeriodChange, onRemovePeriod }: PeriodItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

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
          if (dates && dates[0] && dates[1]) {
            onPeriodChange(period.id, dates)
            setPickerOpen(false)
          }
        }}
        allowClear={false}
        format="DD.MM.YYYY"
        separator="→"
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open)
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
  const role = useAuthStore((state) => state.role)
  const isManagerOrAdmin = role === 'ADMIN' || role === 'MANAGER'
  
  // Загрузка списка активных селлеров (только для админов и менеджеров)
  const { data: activeSellers = [], isLoading: sellersLoading } = useQuery({
    queryKey: ['activeSellers'],
    queryFn: () => userApi.getActiveSellers(),
    enabled: isManagerOrAdmin,
  })
  
  // Выбранный селлер (только для админов и менеджеров)
  const [selectedSellerId, setSelectedSellerId] = useState<number | undefined>(() => {
    if (!isManagerOrAdmin) return undefined
    const saved = localStorage.getItem('analytics_selected_seller_id')
    if (saved) {
      try {
        const sellerId = parseInt(saved, 10)
        if (!isNaN(sellerId)) return sellerId
      } catch {
        // Игнорируем
      }
    }
    return undefined
  })

  // Кабинеты: для SELLER/WORKER — свои, для MANAGER/ADMIN — кабинеты выбранного селлера
  const { data: myCabinets = [], isLoading: myCabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: !isManagerOrAdmin,
  })

  const { data: sellerCabinets = [], isLoading: sellerCabinetsLoading } = useQuery({
    queryKey: ['sellerCabinets', selectedSellerId],
    queryFn: () => userApi.getSellerCabinets(selectedSellerId!),
    enabled: isManagerOrAdmin && selectedSellerId != null,
  })

  const cabinets = isManagerOrAdmin ? sellerCabinets : myCabinets
  const cabinetsLoading = isManagerOrAdmin ? sellerCabinetsLoading : myCabinetsLoading

  // Выбранный кабинет
  const [selectedCabinetId, setSelectedCabinetIdState] = useState<number | null>(() => {
    if (isManagerOrAdmin && selectedSellerId != null) {
      return getStoredCabinetIdForSeller(selectedSellerId)
    }
    return getStoredCabinetId()
  })

  const setSelectedCabinetId = useCallback((id: number | null) => {
    setSelectedCabinetIdState(id)
    if (isManagerOrAdmin && selectedSellerId != null) {
      setStoredCabinetIdForSeller(selectedSellerId, id)
    } else {
      setStoredCabinetId(id)
    }
  }, [isManagerOrAdmin, selectedSellerId])

  // Синхронизируем selectedCabinetId с хранилищем при смене селлера (manager)
  useEffect(() => {
    if (isManagerOrAdmin && selectedSellerId != null) {
      const stored = getStoredCabinetIdForSeller(selectedSellerId)
      setSelectedCabinetIdState(stored)
    } else if (!isManagerOrAdmin) {
      setSelectedCabinetIdState(getStoredCabinetId())
    }
  }, [selectedSellerId, isManagerOrAdmin])

  // По умолчанию — первый кабинет в списке (последний созданный)
  useEffect(() => {
    if (cabinets.length > 0 && selectedCabinetId === null) {
      setSelectedCabinetId(cabinets[0].id)
    }
  }, [cabinets, selectedCabinetId])

  // Устанавливаем первого селлера по умолчанию
  useEffect(() => {
    if (isManagerOrAdmin && activeSellers.length > 0 && !selectedSellerId) {
      const lastSeller = activeSellers[activeSellers.length - 1]
      setSelectedSellerId(lastSeller.id)
      localStorage.setItem('analytics_selected_seller_id', lastSeller.id.toString())
    }
  }, [activeSellers, isManagerOrAdmin, selectedSellerId])

  // Сохраняем выбранного селлера в localStorage
  useEffect(() => {
    if (isManagerOrAdmin && selectedSellerId) {
      localStorage.setItem('analytics_selected_seller_id', selectedSellerId.toString())
    }
  }, [selectedSellerId, isManagerOrAdmin])

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
    
    let dateFrom = dates[0]
    let dateTo = dates[1]
    if (!dateFrom || !dateTo) return
    
    // Если дата начала позже даты окончания, делаем начало равным концу
    if (dateFrom.isAfter(dateTo)) {
      dateFrom = dateTo
    }
    
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
    
    setPeriods(updatedPeriods)
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
  // Инициализируем фильтр из localStorage, если selectedSellerId уже определен
  const [excludedNmIds, setExcludedNmIds] = useState<Set<number>>(() => {
    if (isManagerOrAdmin && selectedSellerId !== undefined) {
      const saved = localStorage.getItem(`analytics_excluded_nm_ids_${selectedSellerId}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as number[]
          return new Set(parsed)
        } catch {
          return new Set()
        }
      }
    }
    return new Set()
  })
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set())
  const [metricGroups, setMetricGroups] = useState<Map<string, MetricGroupResponse>>(new Map())
  const [loadingMetrics, setLoadingMetrics] = useState<Set<string>>(new Set())
  const [articleSearchText, setArticleSearchText] = useState<string>('')
  const [originalArticles, setOriginalArticles] = useState<ArticleSummary[]>([])

  // Загружаем исходный список артикулов без фильтрации
  const loadOriginalArticles = useCallback(async () => {
    if (isManagerOrAdmin && selectedSellerId === undefined) return
    try {
      const data = await analyticsApi.getSummary({
        periods,
        excludedNmIds: undefined,
        sellerId: selectedSellerId,
        cabinetId: selectedCabinetId ?? undefined,
      })
      if (data && data.articles) {
        setOriginalArticles(data.articles)
      } else {
        setOriginalArticles([])
      }
    } catch (err) {
      console.error('Ошибка при загрузке исходного списка артикулов:', err)
      setOriginalArticles([])
    }
  }, [periods, selectedSellerId, selectedCabinetId, isManagerOrAdmin])

  const loadSummary = useCallback(async () => {
    // Для менеджера/админа нужен выбранный селлер
    if (isManagerOrAdmin && selectedSellerId === undefined) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      const excludedArray = Array.from(excludedNmIds)
      
      // Загружаем исходный список артикулов параллельно, если он еще не загружен
      if (originalArticles.length === 0) {
        loadOriginalArticles()
      }
      
      const data = await analyticsApi.getSummary({
        periods,
        excludedNmIds: excludedArray.length > 0 ? excludedArray : undefined,
        sellerId: selectedSellerId,
        cabinetId: selectedCabinetId ?? undefined,
      })
      setSummary(data)
      // Очищаем загруженные метрики при изменении фильтра или периодов
      setMetricGroups(new Map())
      setExpandedMetrics(new Set())
      setLoadingMetrics(new Set())
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }, [excludedNmIds, periods, selectedSellerId, selectedCabinetId, originalArticles.length, loadOriginalArticles, isManagerOrAdmin])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const queryClient = useQueryClient()
  const selectedSeller = useMemo(
    () => (selectedSellerId != null ? activeSellers.find((s) => s.id === selectedSellerId) : undefined),
    [selectedSellerId, activeSellers]
  )
  const selectedCabinet = useMemo(
    () => (selectedCabinetId != null ? cabinets.find((c) => c.id === selectedCabinetId) : undefined),
    [cabinets, selectedCabinetId]
  )
  const MIN_UPDATE_INTERVAL_HOURS = 6
  const getLastUpdateOrRequested = (): string | null => {
    if (selectedCabinet != null) {
      const a = selectedCabinet.lastDataUpdateAt ?? selectedCabinet.apiKey?.lastDataUpdateAt ?? null
      const b = selectedCabinet.lastDataUpdateRequestedAt ?? selectedCabinet.apiKey?.lastDataUpdateRequestedAt ?? null
      if (a != null || b != null) {
        if (a == null) return b!
        if (b == null) return a
        return dayjs(a).isAfter(dayjs(b)) ? a : b
      }
    }
    if (!selectedSeller) return null
    const a = selectedSeller.lastDataUpdateAt ?? null
    const b = selectedSeller.lastDataUpdateRequestedAt ?? null
    if (!a && !b) return null
    if (!a) return b
    if (!b) return a
    return dayjs(a).isAfter(dayjs(b)) ? a : b
  }
  const canUpdateSellerData = (): boolean => {
    const lastAt = getLastUpdateOrRequested()
    if (!lastAt) return true
    return dayjs().diff(dayjs(lastAt), 'hour') >= MIN_UPDATE_INTERVAL_HOURS
  }
  const getHoursWord = (h: number) => (h % 10 === 1 && h % 100 !== 11 ? 'час' : h % 10 >= 2 && h % 10 <= 4 && (h % 100 < 10 || h % 100 >= 20) ? 'часа' : 'часов')
  const getMinutesWord = (m: number) => (m % 10 === 1 && m % 100 !== 11 ? 'минута' : m % 10 >= 2 && m % 10 <= 4 && (m % 100 < 10 || m % 100 >= 20) ? 'минуты' : 'минут')
  const getRemainingTime = (): string | null => {
    const lastAt = getLastUpdateOrRequested()
    if (!lastAt) return null
    const lastUpdate = dayjs(lastAt)
    const mins = MIN_UPDATE_INTERVAL_HOURS * 60 - dayjs().diff(lastUpdate, 'minute')
    if (mins <= 0) return null
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h} ${getHoursWord(h)}${m > 0 ? ` и ${m} ${getMinutesWord(m)}` : ''}` : `${m} ${getMinutesWord(m)}`
  }
  const triggerUpdateMutation = useMutation({
    mutationFn: (payload: { sellerId: number; cabinetId?: number | null }) =>
      payload.cabinetId != null ? userApi.triggerCabinetDataUpdate(payload.cabinetId) : userApi.triggerSellerDataUpdate(payload.sellerId),
    onSuccess: (data, variables) => {
      message.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['activeSellers'] })
      if (variables.sellerId != null) {
        queryClient.invalidateQueries({ queryKey: ['sellerCabinets', variables.sellerId] })
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Ошибка запуска обновления'
      if (err.response?.status === 429) message.warning(msg)
      else message.error(msg)
    },
  })

  // Порядок периодов слева направо: старый → новый (для таблицы)
  const periodsSorted = useMemo(
    () => [...periods].sort((a, b) => a.dateFrom.localeCompare(b.dateFrom)),
    [periods]
  )

  useEffect(() => {
    // Сохраняем периоды в localStorage при изменении
    localStorage.setItem('analytics_periods', JSON.stringify(periods))
  }, [periods])
  
  // Сохраняем фильтр артикулов в localStorage при изменении
  useEffect(() => {
    if (selectedSellerId !== undefined) {
      const excludedArray = Array.from(excludedNmIds)
      localStorage.setItem(
        `analytics_excluded_nm_ids_${selectedSellerId}`,
        JSON.stringify(excludedArray)
      )
    }
  }, [excludedNmIds, selectedSellerId])

  // Загружаем сохраненный фильтр и исходный список при смене селлера
  useEffect(() => {
    if (selectedSellerId !== undefined) {
      const saved = localStorage.getItem(`analytics_excluded_nm_ids_${selectedSellerId}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as number[]
          setExcludedNmIds(new Set(parsed))
        } catch {
          setExcludedNmIds(new Set())
        }
      } else {
        setExcludedNmIds(new Set())
      }
      setOriginalArticles([])
      loadOriginalArticles()
    }
  }, [selectedSellerId, loadOriginalArticles])

  const loadMetricGroup = async (metricName: string) => {
    if (metricGroups.has(metricName)) {
      return // Уже загружено
    }

    // Помечаем метрику как загружаемую
    setLoadingMetrics(prev => new Set(prev).add(metricName))

    // Добавляем запрос в очередь для ограничения параллелизма
    try {
      const excludedArray = Array.from(excludedNmIds)
      const data = await analyticsRequestQueue.add(() =>
        analyticsApi.getMetricGroup(metricName, {
          periods,
          excludedNmIds: excludedArray.length > 0 ? excludedArray : undefined,
          sellerId: selectedSellerId,
          cabinetId: selectedCabinetId ?? undefined,
        })
      )
      setMetricGroups(prev => new Map(prev).set(metricName, data))
    } catch (err: any) {
      console.error(`Ошибка при загрузке метрики ${metricName}:`, err)
      // Удаляем метрику из expandedMetrics при ошибке
      setExpandedMetrics(prev => {
        const newSet = new Set(prev)
        newSet.delete(metricName)
        return newSet
      })
    } finally {
      setLoadingMetrics(prev => {
        const newSet = new Set(prev)
        newSet.delete(metricName)
        return newSet
      })
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

  if ((loading || sellersLoading) && !summary) {
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

  // Менеджер/админ без селлеров
  if (isManagerOrAdmin && !sellersLoading && activeSellers.length === 0) {
    return (
      <>
        <Header />
        <div style={{ 
          padding: spacing.xxl, 
          width: '100%',
          textAlign: 'center'
        }}>
          <InfoCircleOutlined style={{ fontSize: '48px', marginBottom: spacing.md, color: colors.textMuted }} />
          <div style={{ fontSize: typography.h3.fontSize, color: colors.textSecondary }}>
            У вас пока нет селлеров
          </div>
          <div style={{ fontSize: typography.body.fontSize, color: colors.textMuted, marginTop: spacing.sm }}>
            Добавьте селлеров, нажав на кнопку "Селлеры"
          </div>
        </div>
      </>
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
          onClick={() => window.location.reload()}
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
          Обновить страницу
        </button>
      </div>
    )
  }

  if (!summary) {
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
      <Header
        cabinetSelectProps={
          (isManagerOrAdmin && selectedSellerId != null) || !isManagerOrAdmin
            ? {
                cabinets: cabinets.map((c) => ({ id: c.id, name: c.name })),
                selectedCabinetId,
                onCabinetChange: setSelectedCabinetId,
                loading: cabinetsLoading,
              }
            : undefined
        }
      />
      <Breadcrumbs />
      <div style={{ 
        padding: `${spacing.lg} ${spacing.md}`, 
        width: '100%',
        backgroundColor: colors.bgGray,
        minHeight: '100vh'
      }}>
      {/* Выбор селлера и синхронизация (для менеджера/админа) */}
      {isManagerOrAdmin && activeSellers.length > 0 && (
        <div style={{ marginBottom: spacing.lg, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Select
            value={selectedSellerId}
            onChange={setSelectedSellerId}
            style={{ minWidth: 250 }}
            placeholder="Выберите селлера"
            options={activeSellers.map((s) => ({ label: s.email, value: s.id }))}
          />
          {selectedSellerId != null && (
            <Tooltip
              title={
                canUpdateSellerData()
                  ? 'Запускает обновление карточек, кампаний и аналитики.'
                  : `Обновление не чаще раза в ${MIN_UPDATE_INTERVAL_HOURS} ч. Через ${getRemainingTime() || '…'}`
              }
            >
              <Button
                type="default"
                icon={<SyncOutlined spin={triggerUpdateMutation.isPending} />}
                onClick={() => triggerUpdateMutation.mutate({ sellerId: selectedSellerId, cabinetId: selectedCabinetId ?? undefined })}
                loading={triggerUpdateMutation.isPending}
                disabled={!canUpdateSellerData() || triggerUpdateMutation.isPending}
                style={{ color: '#7C3AED', borderColor: '#7C3AED' }}
              />
            </Tooltip>
          )}
        </div>
      )}

      {/* Периоды */}
      <div style={{
        backgroundColor: colors.bgWhite,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xl,
        boxShadow: shadows.md
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md }}>
          <h2 style={{ ...typography.h2, margin: 0 }}>
            Укажите желаемые периоды для сравнения данных
          </h2>
          {originalArticles.length > 0 && (
            <Popover
              content={
                <div style={{ width: '400px', maxHeight: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Input
                    placeholder="Поиск по артикулу или названию"
                    prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                    value={articleSearchText}
                    onChange={(e) => setArticleSearchText(e.target.value)}
                    style={{ marginBottom: '12px' }}
                    allowClear
                  />
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <Button size="small" onClick={() => setExcludedNmIds(new Set())}>
                      Выбрать все
                    </Button>
                    <Button size="small" onClick={() => setExcludedNmIds(new Set(originalArticles.map((a) => a.nmId)))}>
                      Снять все
                    </Button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px' }}>
                    {originalArticles
                      .filter((article) => {
                        const searchLower = articleSearchText.toLowerCase()
                        return article.nmId.toString().includes(searchLower) || article.title.toLowerCase().includes(searchLower)
                      })
                      .map((article) => (
                        <div
                          key={article.nmId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: '1px solid #F1F5F9',
                          }}
                        >
                          <Checkbox
                            checked={!excludedNmIds.has(article.nmId)}
                            onChange={(e) => {
                              const next = new Set(excludedNmIds)
                              if (e.target.checked) next.delete(article.nmId)
                              else next.add(article.nmId)
                              setExcludedNmIds(next)
                            }}
                            style={{ marginRight: '12px' }}
                          />
                          {article.photoTm && (
                            <img
                              src={article.photoTm}
                              alt=""
                              style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                marginRight: '12px',
                              }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', color: '#64748B' }}>{article.nmId}</div>
                            <div style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {article.title}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              }
              title="Фильтр артикулов"
              trigger="click"
              placement="bottomRight"
              overlayStyle={{ maxWidth: '450px' }}
            >
              <Button icon={<FilterOutlined />} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Фильтр
                <span
                  style={{
                    backgroundColor: '#7C3AED',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '0 8px',
                    fontSize: '12px',
                    marginLeft: '4px',
                  }}
                >
                  {originalArticles.length - excludedNmIds.size}/{originalArticles.length}
                </span>
              </Button>
            </Popover>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {periods.map((period) => (
            <PeriodItem
              key={period.id}
              period={period}
              periodsCount={periods.length}
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

      {/* Сводные метрики */}
      {originalArticles.length > 0 && excludedNmIds.size === originalArticles.length ? (
        <div style={{
          backgroundColor: colors.bgWhite,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: borderRadius.md,
          padding: spacing.xxl,
          marginBottom: spacing.xl,
          boxShadow: shadows.md,
          textAlign: 'center'
        }}>
          <InfoCircleOutlined style={{ fontSize: '48px', marginBottom: spacing.md, color: colors.textMuted }} />
          <div style={{ fontSize: typography.h3.fontSize, color: colors.textSecondary }}>
            Нет данных для отображения
          </div>
          <div style={{ fontSize: typography.body.fontSize, color: colors.textMuted, marginTop: spacing.sm }}>
            Выберите хотя бы один артикул в фильтре
          </div>
        </div>
      ) : (
      <div style={{
        backgroundColor: colors.bgWhite,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xl,
        boxShadow: shadows.md
      }}>
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
                {periodsSorted.map(period => (
                  <th key={period.id} style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.border}`,
                    ...typography.h3,
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
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
                const isLoading = loadingMetrics.has(metricKey)

                return (
                  <>
                    <tr 
                      key={metricKey} 
                      onClick={() => toggleMetric(metricKey)}
                      style={{
                        backgroundColor: category === 'funnel' ? colors.funnelBg : colors.advertisingBg,
                        cursor: isLoading ? 'wait' : 'pointer',
                        transition: transitions.fast,
                        opacity: isLoading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.backgroundColor = category === 'funnel' ? colors.funnelBgHover : colors.advertisingBgHover
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = category === 'funnel' ? colors.funnelBg : colors.advertisingBg
                      }}
                    >
                      <td style={{ 
                        padding: spacing.md, 
                        borderBottom: `1px solid ${colors.borderLight}`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: spacing.sm,
                        ...typography.body,
                        fontWeight: 500,
                        color: colors.textPrimary
                      }}>
                        {isLoading ? (
                          <Spin size="small" style={{ fontSize: '12px' }} />
                        ) : isExpanded ? (
                          <CaretDownOutlined style={{ fontSize: '12px' }} />
                        ) : (
                          <CaretRightOutlined style={{ fontSize: '12px' }} />
                        )}
                        {metricNameRu}
                      </td>
                      {periodsSorted.map(period => {
                        const value = getMetricValue(period.id)
                        const isPercent = metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr'
                        const isEmpty = value === null || value === undefined || value === 0
                        return (
                          <td key={period.id} style={{
                            textAlign: 'center',
                            padding: spacing.md,
                            borderBottom: `1px solid ${colors.borderLight}`,
                            color: isEmpty ? colors.textMuted : colors.textPrimary,
                            ...typography.number
                          }}>
                            {isPercent ? formatPercent(value) : formatValue(value)}
                          </td>
                        )
                      })}
                    </tr>
                    {isExpanded && metricGroup && (
                      <tr key={`${metricKey}-detail`}>
                        <td colSpan={periods.length + 1} style={{ padding: '0', borderBottom: `1px solid ${colors.borderLight}` }}>
                          <div style={{ padding: spacing.md, backgroundColor: colors.bgWhite }}>
                            {category === 'advertising' ? (
                              // Отображение для рекламных метрик - по кампаниям
                              metricGroup.campaigns && metricGroup.campaigns.length > 0 ? (
                                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ backgroundColor: colors.bgGray }}>
                                        <th style={{
                                          textAlign: 'left',
                                          padding: spacing.md,
                                          borderBottom: `1px solid ${colors.borderLight}`,
                                          ...typography.body,
                                          fontWeight: 600
                                        }}>
                                          Артикул
                                        </th>
                                        <th style={{
                                          textAlign: 'left',
                                          padding: spacing.md,
                                          borderBottom: `1px solid ${colors.borderLight}`,
                                          ...typography.body,
                                          fontWeight: 600
                                        }}>
                                          Рекламная кампания
                                        </th>
                                        {periods.map(period => (
                                          <th key={period.id} style={{
                                            textAlign: 'center',
                                            padding: spacing.md,
                                            borderBottom: `1px solid ${colors.borderLight}`,
                                            ...typography.body,
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {formatPeriodDates(period)}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {metricGroup.campaigns.flatMap((campaign, campaignIndex) => 
                                        campaign.articles.map((nmId, articleIndex) => (
                                          <tr 
                                            key={`${campaign.campaignId}-${nmId}`}
                                            style={{
                                              backgroundColor: campaignIndex % 2 === 0 ? colors.bgWhite : colors.bgGrayLight
                                            }}
                                          >
                                            <td style={{
                                              padding: spacing.md,
                                              borderBottom: `1px solid ${colors.borderLight}`,
                                              ...typography.body,
                                              fontWeight: 500
                                            }}>
                                              <a
                                                href={`/analytics/article/${nmId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                  color: colors.primary,
                                                  textDecoration: 'none',
                                                  fontWeight: 500,
                                                  cursor: 'pointer',
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
                                                {nmId}
                                              </a>
                                            </td>
                                            <td style={{
                                              padding: spacing.md,
                                              borderBottom: `1px solid ${colors.borderLight}`,
                                              ...typography.body,
                                              fontWeight: articleIndex === 0 ? 600 : 400
                                            }}>
                                              {articleIndex === 0 && (
                                                <span>
                                                  {campaign.campaignName} ({campaign.campaignId})
                                                </span>
                                              )}
                                            </td>
                                            {periodsSorted.map(period => {
                                              const periodData = campaign.periods.find(p => p.periodId === period.id)
                                              const value = periodData?.value ?? null
                                              const changePercent = periodData?.changePercent ?? null
                                              const isPercent = metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr'
                                              const isEmpty = value === null || value === undefined || value === 0
                                              const changeColor = changePercent !== null
                                                ? (changePercent >= 0 ? colors.success : colors.error)
                                                : colors.textSecondary
                                              return (
                                                <td key={period.id} style={{
                                                  textAlign: 'center',
                                                  padding: spacing.md,
                                                  borderBottom: `1px solid ${colors.borderLight}`,
                                                  color: isEmpty ? colors.textMuted : colors.textPrimary
                                                }}>
                                                  <div style={{ ...typography.number }}>
                                                    {isEmpty ? '-' : (isPercent ? formatPercent(value as number) : formatValue(value as number))}
                                                  </div>
                                                  {changePercent !== null && (
                                                    <div style={{
                                                      ...typography.bodySmall,
                                                      color: changeColor,
                                                      fontWeight: 600,
                                                      marginTop: spacing.xs
                                                    }}>
                                                      {formatChangePercent(changePercent)}
                                                    </div>
                                                  )}
                                                </td>
                                              )
                                            })}
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div style={{ 
                                  textAlign: 'center', 
                                  padding: spacing.xl,
                                  color: colors.textMuted
                                }}>
                                  Нет данных
                                </div>
                              )
                            ) : (
                              // Отображение для метрик воронки - по артикулам
                              metricGroup.articles && metricGroup.articles.length > 0 ? (
                                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr style={{ backgroundColor: colors.bgGray }}>
                                        <th style={{
                                          textAlign: 'left',
                                          padding: spacing.md,
                                          borderBottom: `1px solid ${colors.borderLight}`,
                                          ...typography.body,
                                          fontWeight: 600
                                        }}>
                                          Артикул
                                        </th>
                                        {periodsSorted.map(period => (
                                          <th key={period.id} style={{
                                            textAlign: 'center',
                                            padding: spacing.md,
                                            borderBottom: `1px solid ${colors.borderLight}`,
                                            ...typography.body,
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {formatPeriodDates(period)}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {metricGroup.articles.map((article, index) => (
                                        <tr 
                                          key={article.nmId}
                                          style={{
                                            backgroundColor: index % 2 === 0 ? colors.bgWhite : colors.bgGrayLight
                                          }}
                                        >
                                          <td style={{
                                            padding: spacing.md,
                                            borderBottom: `1px solid ${colors.borderLight}`,
                                            ...typography.body,
                                            fontWeight: 500
                                          }}>
                                            <div style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: spacing.md
                                            }}>
                                              {article.photoTm && (
                                                <a
                                                  href={`https://www.wildberries.ru/catalog/${article.nmId}/detail.aspx`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  style={{
                                                    display: 'inline-block',
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
                                                    src={article.photoTm}
                                                    alt={`Товар ${article.nmId}`}
                                                    style={{
                                                      width: '50px',
                                                      height: '50px',
                                                      objectFit: 'cover',
                                                      borderRadius: borderRadius.sm,
                                                      border: `1px solid ${colors.borderLight}`
                                                    }}
                                                    onError={(e) => {
                                                      e.currentTarget.style.display = 'none'
                                                    }}
                                                  />
                                                </a>
                                              )}
                                              <a
                                                href={`/analytics/article/${article.nmId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                  color: colors.primary,
                                                  textDecoration: 'none',
                                                  fontWeight: 500,
                                                  cursor: 'pointer',
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
                                                {article.nmId}
                                              </a>
                                            </div>
                                          </td>
                                          {periodsSorted.map(period => {
                                            const periodData = article.periods.find(p => p.periodId === period.id)
                                            const value = periodData?.value ?? null
                                            const changePercent = periodData?.changePercent ?? null
                                            const isPercent = metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr'
                                            const isEmpty = value === null || value === undefined || value === 0
                                            const changeColor = changePercent !== null
                                              ? (changePercent >= 0 ? colors.success : colors.error)
                                              : colors.textSecondary
                                            return (
                                              <td key={period.id} style={{
                                                textAlign: 'center',
                                                padding: spacing.md,
                                                borderBottom: `1px solid ${colors.borderLight}`,
                                                color: isEmpty ? colors.textMuted : colors.textPrimary
                                              }}>
                                                <div style={{ ...typography.number }}>
                                                  {isEmpty ? '-' : (isPercent ? formatPercent(value as number) : formatValue(value as number))}
                                                </div>
                                                {changePercent !== null && (
                                                  <div style={{
                                                    ...typography.bodySmall,
                                                    color: changeColor,
                                                    fontWeight: 600,
                                                    marginTop: spacing.xs
                                                  }}>
                                                    {formatChangePercent(changePercent)}
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
                              ) : (
                                <div style={{ 
                                  textAlign: 'center', 
                                  padding: spacing.xl,
                                  color: colors.textMuted
                                }}>
                                  Нет данных
                                </div>
                              )
                            )}
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
      )}
      </div>
    </>
  )
}

