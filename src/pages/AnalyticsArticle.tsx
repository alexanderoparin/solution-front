import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Spin, DatePicker, Input, Button, Upload, Modal, message, Checkbox, Switch, Tooltip } from 'antd'
import { InfoCircleOutlined, DownOutlined, RightOutlined, PlusOutlined, EditOutlined, DeleteOutlined, PaperClipOutlined, DownloadOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/ru'
import locale from 'antd/locale/ru_RU'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId, getStoredCabinetIdForSeller, setStoredCabinetIdForSeller } from '../api/cabinets'
import { userApi } from '../api/user'
import type { ArticleResponse, StockSize, ArticleNote } from '../types/analytics'
import { colors, typography, spacing, shadows, borderRadius, transitions, ARTICLE_HEADER_PHOTO_HEIGHT } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import AnalyticsChart from '../components/AnalyticsChart'
import * as XLSX from 'xlsx'

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

type FunnelKey = keyof typeof FUNNELS
const FUNNEL_ORDER: FunnelKey[] = ['general', 'advertising', 'pricing']

// Размеры шрифта как в блоке воронок (12px — подписи/даты, 11px — данные)
const FONT_PAGE = { fontSize: '12px' as const }
const FONT_PAGE_SMALL = { fontSize: '11px' as const }

/** Даты в диапазоне [from, to] включительно, от старых к новым */
function getDatesInRange(from: Dayjs, to: Dayjs): string[] {
  const days: string[] = []
  let cur = from.startOf('day')
  const end = to.endOf('day')
  while (cur.isBefore(end) || cur.isSame(end, 'day')) {
    days.push(cur.format('YYYY-MM-DD'))
    cur = cur.add(1, 'day')
  }
  return days
}

export default function AnalyticsArticle() {
  const { nmId } = useParams<{ nmId: string }>()
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)
  const userId = useAuthStore((state) => state.userId)
  const isManagerOrAdmin = role === 'MANAGER' || role === 'ADMIN'

  const [selectedSellerId, setSelectedSellerIdState] = useState<number | undefined>(() => {
    if (!isManagerOrAdmin) return undefined
    const saved = localStorage.getItem('analytics_selected_seller_id')
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!Number.isNaN(parsed)) return parsed
    }
    return undefined
  })
  const [cabinetReloadTrigger, setCabinetReloadTrigger] = useState(0)

  const { data: myCabinets = [], isLoading: myCabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'SELLER' || role === 'WORKER',
  })

  const { data: activeSellers = [], isLoading: activeSellersLoading } = useQuery({
    queryKey: ['activeSellers'],
    queryFn: () => userApi.getActiveSellers(),
    enabled: isManagerOrAdmin,
  })

  const { data: sellerCabinets = [], isLoading: sellerCabinetsLoading } = useQuery({
    queryKey: ['sellerCabinets', selectedSellerId],
    queryFn: () => userApi.getSellerCabinets(selectedSellerId!),
    enabled: isManagerOrAdmin && selectedSellerId != null,
  })

  const cabinets = isManagerOrAdmin ? sellerCabinets : myCabinets
  const cabinetsLoading = isManagerOrAdmin
    ? (selectedSellerId == null ? activeSellersLoading : sellerCabinetsLoading)
    : myCabinetsLoading
  const storedCabinetId = isManagerOrAdmin && selectedSellerId != null
    ? getStoredCabinetIdForSeller(selectedSellerId)
    : getStoredCabinetId()
  const selectedCabinetId = cabinets.length > 0
    ? (storedCabinetId != null && cabinets.some((c) => c.id === storedCabinetId) ? storedCabinetId : cabinets[0].id)
    : null

  useEffect(() => {
    if (isManagerOrAdmin && activeSellers.length > 0 && selectedSellerId == null) {
      setSelectedSellerIdState(activeSellers[0].id)
      localStorage.setItem('analytics_selected_seller_id', String(activeSellers[0].id))
    }
  }, [isManagerOrAdmin, activeSellers, selectedSellerId])

  const setSelectedCabinetId = useCallback(
    (cid: number | null) => {
      if (isManagerOrAdmin && selectedSellerId != null) {
        setStoredCabinetIdForSeller(selectedSellerId, cid)
      } else {
        setStoredCabinetId(cid)
      }
      setCabinetReloadTrigger((t) => t + 1)
    },
    [isManagerOrAdmin, selectedSellerId]
  )

  const cabinetSelectProps =
    cabinets.length > 0
      ? {
          cabinets: cabinets.map((c) => ({ id: c.id, name: c.name })),
          selectedCabinetId,
          onCabinetChange: setSelectedCabinetId,
          loading: cabinetsLoading,
        }
      : undefined

  const sellerSelectProps =
    isManagerOrAdmin && activeSellers.length > 0
      ? {
          sellers: activeSellers.map((s) => ({ id: s.id, email: s.email })),
          selectedSellerId: selectedSellerId ?? undefined,
          onSellerChange: (sid: number) => {
            setSelectedSellerIdState(sid)
            localStorage.setItem('analytics_selected_seller_id', String(sid))
          },
          loading: activeSellersLoading,
        }
      : undefined

  const getSelectedSellerId = useCallback((): number | undefined => {
    if (isManagerOrAdmin) return selectedSellerId ?? undefined
    return userId ?? undefined
  }, [isManagerOrAdmin, selectedSellerId, userId])

  const getSelectedCabinetId = useCallback((): number | undefined => {
    const sid = getSelectedSellerId()
    if (isManagerOrAdmin && sid != null) {
      const cid = getStoredCabinetIdForSeller(sid)
      return cid ?? undefined
    }
    const cid = getStoredCabinetId()
    return cid ?? undefined
  }, [isManagerOrAdmin, getSelectedSellerId])

  // Общий диапазон дат для графика и воронок (по умолчанию последние 2 недели)
  const yesterday = dayjs().subtract(1, 'day')
  const defaultDateFrom = yesterday.subtract(13, 'day')
  const defaultDateTo = yesterday
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([defaultDateFrom, defaultDateTo])
  const [showChart, setShowChart] = useState(false)

  const rangeDates = useMemo(() => getDatesInRange(dateRange[0], dateRange[1]), [dateRange])
  /** Даты для блока воронок: сверху «сегодня» (самая новая), далее по нисходящей */
  const rangeDatesDesc = useMemo(() => [...rangeDates].reverse(), [rangeDates])

  // Выбранные воронки (максимум 3), порядок: Общая (1) → Реклама (2) → Цены (3)
  const [selectedFunnelKeys, setSelectedFunnelKeys] = useState<FunnelKey[]>(['general', 'advertising'])
  const sortedFunnelKeys = useMemo(() => [...selectedFunnelKeys].sort((a, b) => FUNNEL_ORDER.indexOf(a) - FUNNEL_ORDER.indexOf(b)), [selectedFunnelKeys])
  const selectedFunnel1 = sortedFunnelKeys[0]
  const selectedFunnel2 = sortedFunnelKeys[1]
  const selectedFunnel3 = sortedFunnelKeys[2]

  const toggleFunnel = (key: FunnelKey) => {
    setSelectedFunnelKeys((prev) => {
      const has = prev.includes(key)
      if (has) {
        return prev.filter((k) => k !== key)
      }
      if (prev.length >= 3) {
        // Убираем воронку с наименьшим порядком
        const sorted = [...prev].sort((a, b) => FUNNEL_ORDER.indexOf(a) - FUNNEL_ORDER.indexOf(b))
        return [sorted[1], sorted[2], key].sort((a, b) => FUNNEL_ORDER.indexOf(a) - FUNNEL_ORDER.indexOf(b))
      }
      return [...prev, key].sort((a, b) => FUNNEL_ORDER.indexOf(a) - FUNNEL_ORDER.indexOf(b))
    })
  }

  const [article, setArticle] = useState<ArticleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedStocks, setExpandedStocks] = useState<Set<string>>(new Set())
  const [stockSizes, setStockSizes] = useState<Record<string, import('../types/analytics').StockSize[]>>({})
  const [loadingSizes, setLoadingSizes] = useState<Record<string, boolean>>({})
  
  // Состояние для заметок
  const [notes, setNotes] = useState<ArticleNote[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<ArticleNote | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [noteFiles, setNoteFiles] = useState<File[]>([])
  const [uploadingNoteFiles, setUploadingNoteFiles] = useState(false)
  const [imagePreview, setImagePreview] = useState<{ url: string; fileName: string } | null>(null)
  
  // Периоды для сравнения (по умолчанию - две недели, разбитые по неделям)
  const [period1, setPeriod1] = useState<[Dayjs, Dayjs]>([
    defaultDateFrom,
    defaultDateFrom.add(6, 'day')
  ])
  const [period2, setPeriod2] = useState<[Dayjs, Dayjs]>([
    defaultDateTo.subtract(6, 'day'),
    defaultDateTo
  ])

  // Блок «Список РК»: поиск и период для метрик (по умолчанию — последняя неделя)
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('')
  const [campaignDateRange, setCampaignDateRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().subtract(6, 'day'), dayjs()])
  const [stocksUpdateLoading, setStocksUpdateLoading] = useState(false)

  useEffect(() => {
    if (!nmId) {
      setError('Артикул не указан')
      setLoading(false)
      return
    }

    loadArticle(Number(nmId), campaignDateRange)
    loadNotes(Number(nmId))
  }, [nmId, selectedSellerId, cabinetReloadTrigger, campaignDateRange])

  const loadArticle = async (id: number, campaignPeriod: [Dayjs, Dayjs] | null) => {
    try {
      setLoading(true)
      setError(null)
      const sellerId = getSelectedSellerId()
      const campaignDateFrom = campaignPeriod ? campaignPeriod[0].format('YYYY-MM-DD') : undefined
      const campaignDateTo = campaignPeriod ? campaignPeriod[1].format('YYYY-MM-DD') : undefined
      const data = await analyticsApi.getArticle(id, [], sellerId, getSelectedCabinetId(), campaignDateFrom, campaignDateTo)
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

  // Функции для работы с заметками
  const loadNotes = async (id: number) => {
    try {
      setLoadingNotes(true)
      const sellerId = getSelectedSellerId()
      const data = await analyticsApi.getNotes(id, sellerId, getSelectedCabinetId())
      setNotes(data)
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Ошибка при загрузке заметок')
    } finally {
      setLoadingNotes(false)
    }
  }

  const openNoteModal = (note?: ArticleNote) => {
    if (note) {
      setEditingNote(note)
      setNoteContent(note.content)
    } else {
      setEditingNote(null)
      setNoteContent('')
    }
    setNoteFiles([])
    setIsNoteModalOpen(true)
  }

  const handleCreateNote = async () => {
    if (!noteContent.trim()) {
      message.warning('Введите текст заметки')
      return
    }

    if (!nmId) return

    try {
      setUploadingNoteFiles(true)
      const sellerId = getSelectedSellerId()
      const createdNote = await analyticsApi.createNote(Number(nmId), { content: noteContent }, sellerId, getSelectedCabinetId())
      message.success('Заметка создана')
      
      // Загружаем файлы, если они были выбраны
      if (noteFiles.length > 0) {
        for (const file of noteFiles) {
          try {
            await analyticsApi.uploadFile(Number(nmId), createdNote.id, file, sellerId, getSelectedCabinetId())
          } catch (err: any) {
            message.error(`Ошибка при загрузке файла ${file.name}: ${err.response?.data?.message || 'Неизвестная ошибка'}`)
          }
        }
        if (noteFiles.length > 0) {
          message.success(`Загружено файлов: ${noteFiles.length}`)
        }
      }
      
      setIsNoteModalOpen(false)
      setNoteContent('')
      setNoteFiles([])
      await loadNotes(Number(nmId))
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Ошибка при создании заметки')
    } finally {
      setUploadingNoteFiles(false)
    }
  }

  const handleUpdateNote = async () => {
    if (!noteContent.trim()) {
      message.warning('Введите текст заметки')
      return
    }

    if (!nmId || !editingNote) return

    try {
      setUploadingNoteFiles(true)
      const sellerId = getSelectedSellerId()
      await analyticsApi.updateNote(Number(nmId), editingNote.id, { content: noteContent }, sellerId, getSelectedCabinetId())
      message.success('Заметка обновлена')
      
      // Загружаем файлы, если они были выбраны
      if (noteFiles.length > 0) {
        for (const file of noteFiles) {
          try {
            await analyticsApi.uploadFile(Number(nmId), editingNote.id, file, sellerId, getSelectedCabinetId())
          } catch (err: any) {
            message.error(`Ошибка при загрузке файла ${file.name}: ${err.response?.data?.message || 'Неизвестная ошибка'}`)
          }
        }
        if (noteFiles.length > 0) {
          message.success(`Загружено файлов: ${noteFiles.length}`)
        }
      }
      
      setIsNoteModalOpen(false)
      setEditingNote(null)
      setNoteContent('')
      setNoteFiles([])
      await loadNotes(Number(nmId))
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Ошибка при обновлении заметки')
    } finally {
      setUploadingNoteFiles(false)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    if (!nmId) return

    Modal.confirm({
      title: 'Удалить заметку?',
      content: 'Это действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          const sellerId = getSelectedSellerId()
          await analyticsApi.deleteNote(Number(nmId), noteId, sellerId, getSelectedCabinetId())
          message.success('Заметка удалена')
          await loadNotes(Number(nmId))
        } catch (err: any) {
          message.error(err.response?.data?.message || 'Ошибка при удалении заметки')
        }
      },
    })
  }

  const handleDownloadFile = async (noteId: number, fileId: number, fileName: string) => {
    if (!nmId) return

    try {
      const sellerId = getSelectedSellerId()
      await analyticsApi.downloadFile(Number(nmId), noteId, fileId, fileName, sellerId, getSelectedCabinetId())
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Ошибка при скачивании файла')
    }
  }

  const handleDeleteFile = async (noteId: number, fileId: number) => {
    if (!nmId) return

    Modal.confirm({
      title: 'Удалить файл?',
      content: 'Это действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          const sellerId = getSelectedSellerId()
          await analyticsApi.deleteFile(Number(nmId), noteId, fileId, sellerId, getSelectedCabinetId())
          message.success('Файл удален')
          await loadNotes(Number(nmId))
        } catch (err: any) {
          message.error(err.response?.data?.message || 'Ошибка при удалении файла')
        }
      },
    })
  }

  // Проверяет, является ли файл изображением
  const isImageFile = (mimeType: string | null): boolean => {
    if (!mimeType) return false
    return mimeType.startsWith('image/')
  }

  // Открывает изображение для просмотра
  const handleViewImage = async (noteId: number, fileId: number, fileName: string) => {
    if (!nmId) return

    try {
      const sellerId = getSelectedSellerId()
      // Получаем файл как blob
      const blob = await analyticsApi.getFileBlob(Number(nmId), noteId, fileId, sellerId, getSelectedCabinetId())
      // Создаем blob URL для просмотра
      const url = window.URL.createObjectURL(blob)
      setImagePreview({ url, fileName })
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Ошибка при загрузке изображения')
    }
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

  // Вычисляет сумму метрики за весь период
  const getMetricTotalForPeriod = (metricKey: string): number | null => {
    if (!article) return null
    
    const values = rangeDates
      .map(date => getMetricValueForDate(metricKey, date))
      .filter((v): v is number => v !== null)
    
    if (values.length === 0) return null
    
    // Для процентных метрик и средних значений - вычисляем среднее
    if (metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr' || 
        metricKey === 'cpc' || metricKey === 'cpo' || metricKey === 'seller_discount' || 
        metricKey === 'wb_club_discount' || metricKey === 'spp_percent') {
      const sum = values.reduce((acc, val) => acc + val, 0)
      return sum / values.length
    }
    
    // Для остальных - сумма
    return values.reduce((acc, val) => acc + val, 0)
  }

  // Метрики, у которых показываем число изменения (остальные — только стрелка)
  const METRICS_WITH_CHANGE_NUMBER = ['transitions', 'cart', 'orders', 'views', 'clicks']

  /** Изменение к хронологически предыдущему дню при отображении дат по убыванию (rangeDatesDesc) */
  const getMetricChangeVsPreviousDayDesc = (dateIndex: number, metricKey: string): number | null => {
    if (dateIndex >= rangeDatesDesc.length - 1) return null
    const currentDate = rangeDatesDesc[dateIndex]
    const prevDate = rangeDatesDesc[dateIndex + 1]
    const current = getMetricValueForDate(metricKey, currentDate)
    const prev = getMetricValueForDate(metricKey, prevDate)
    if (current === null || prev === null) return null
    return current - prev
  }

  // Выгрузка воронок в Excel: столбцы выбранных воронок в том же порядке, что и в таблице
  const handleExportFunnelsExcel = () => {
    if (!article) return
    const headers: string[] = ['Дата']
    const metricKeys: string[] = []
    for (const key of sortedFunnelKeys) {
      for (const m of FUNNELS[key].metrics) {
        headers.push(m.name.replace(/\n/g, ' '))
        metricKeys.push(m.key)
      }
    }
    const rows: (string | number)[][] = [headers]
    for (const date of rangeDatesDesc) {
      const row: (string | number)[] = [dayjs(date).format('DD.MM.YYYY')]
      for (const metricKey of metricKeys) {
        const v = getMetricValueForDate(metricKey, date)
        const isPercent = metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr' || metricKey === 'seller_discount' || metricKey === 'wb_club_discount' || metricKey === 'spp_percent'
        const isCurrency = metricKey.includes('price') || metricKey === 'orders_amount' || metricKey === 'costs' || metricKey === 'cpc' || metricKey === 'cpo' || metricKey === 'spp_amount'
        row.push(v === null ? '' : isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v))
      }
      rows.push(row)
    }
    const totalRow: (string | number)[] = ['Весь период']
    for (const metricKey of metricKeys) {
      const v = getMetricTotalForPeriod(metricKey)
      const isPercent = metricKey.includes('conversion') || metricKey === 'ctr' || metricKey === 'drr' || metricKey === 'seller_discount' || metricKey === 'wb_club_discount' || metricKey === 'spp_percent'
      const isCurrency = metricKey.includes('price') || metricKey === 'orders_amount' || metricKey === 'costs' || metricKey === 'cpc' || metricKey === 'cpo' || metricKey === 'spp_amount'
      totalRow.push(v === null ? '' : isPercent ? formatPercent(v) : isCurrency ? formatCurrency(v) : formatValue(v))
    }
    rows.push(totalRow)
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Воронки')
    const fileName = `${nmId}_воронки_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}.xlsx`
    XLSX.writeFile(wb, fileName)
    message.success('Файл выгружен')
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

  /**
   * Вычисляет разницу между периодами.
   * @param absolutePercentPoints — для процентных полей (конверсия, CTR, ДРР): true = фактическая разница в п.п. (10,35 − 8,94 = +1,41), false = процент от процента
   */
  const calculateDifference = (
    value1: number | null,
    value2: number | null,
    roundToDecimals?: number,
    absolutePercentPoints?: boolean
  ): number | null => {
    if (value1 === null || value2 === null) return null

    if (absolutePercentPoints) {
      // Значения уже в процентах — разница в процентных пунктах (например 10,35 − 8,94 = +1,41)
      const diff = value2 - value1
      if (Math.abs(diff) < 0.01) return null
      return diff
    }

    if (value1 === 0) return null

    let v1 = value1
    let v2 = value2
    if (roundToDecimals !== undefined) {
      const multiplier = Math.pow(10, roundToDecimals)
      v1 = Math.round(value1 * multiplier) / multiplier
      v2 = Math.round(value2 * multiplier) / multiplier
    }
    const absDiff = Math.abs(v2 - v1)
    if (absDiff < 0.001) return null
    const diff = ((v2 - v1) / v1) * 100
    if (Math.abs(diff) < 0.01) return null
    return diff
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
          fontSize: '12px',
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
            fontSize: '12px',
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
        <div style={{ fontSize: '12px' }}>Нет данных</div>
      </div>
    )
  }

  return (
    <>
      <Header cabinetSelectProps={cabinetSelectProps} sellerSelectProps={sellerSelectProps} />
      <Breadcrumbs />
      <div style={{ 
        padding: `${spacing.lg} ${spacing.md}`, 
        width: '100%',
        backgroundColor: colors.bgGray,
        minHeight: '100vh'
      }}>
      {/* Шапка артикула: крупное фото вплотную к границам, название, категория·бренд, артикулы, В акции; справа — товары в связке */}
      <div style={{
        backgroundColor: colors.bgWhite,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
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
                height: ARTICLE_HEADER_PHOTO_HEIGHT,
                borderRadius: borderRadius.sm,
                overflow: 'hidden',
                border: `1px solid ${colors.borderLight}`,
                cursor: 'pointer',
                transition: transitions.fast
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              <img
                src={article.article.photoTm}
                alt={article.article.title}
                style={{
                  display: 'block',
                  height: '100%',
                  width: 'auto',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </a>
          )}
          <div style={{ flex: '0 1 auto', minWidth: 0 }}>
            <div style={{
              ...typography.body,
              ...FONT_PAGE,
              fontWeight: 700,
              color: colors.textPrimary,
              marginBottom: 4
            }}>
              {article.article.title || '-'}
            </div>
            <div style={{ color: colors.textSecondary, marginBottom: 2, fontSize: 12 }}>
              {[article.article.subjectName, article.article.brand].filter(Boolean).join(' · ') || '-'}
            </div>
            <div style={{ color: colors.textSecondary, marginBottom: 2, fontSize: 12 }}>
              Артикул WB:{' '}
              <a
                href={article.article.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: colors.primary, fontWeight: 500 }}
              >
                {article.article.nmId}
              </a>
            </div>
            <div style={{ color: colors.textSecondary, marginBottom: 6, fontSize: 12 }}>
              Артикул продавца:{' '}
              <span style={{ color: colors.primary, fontWeight: 500 }}>
                {article.article.vendorCode ?? '-'}
              </span>
            </div>
            <span
              title={article.inWbPromotion && (article.wbPromotionNames?.length ?? 0) > 0
                ? article.wbPromotionNames!.join('\n')
                : undefined}
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: borderRadius.sm,
                fontSize: 11,
                fontWeight: 500,
                backgroundColor: article.inWbPromotion ? colors.successLight : colors.bgGray,
                color: article.inWbPromotion ? colors.success : colors.textSecondary,
                cursor: article.inWbPromotion && (article.wbPromotionNames?.length ?? 0) > 0 ? 'help' : undefined,
              }}
            >
              {article.inWbPromotion ? 'В акции' : 'Не в акции'}
            </span>
          </div>

          {/* Товары в связке: по схеме — справа от основного, сетка 2 ряда × колонки, скролл влево-вправо; фото в 2 раза меньше основного */}
          {(article.bundleProducts?.length ?? 0) > 0 && (() => {
            const bundlePhotoH = Math.round(ARTICLE_HEADER_PHOTO_HEIGHT / 2)
            const bundlePhotoW = 80
            const rowHeight = Math.floor(ARTICLE_HEADER_PHOTO_HEIGHT / 2)
            const list = article.bundleProducts ?? []
            const pairs: typeof list[] = []
            for (let i = 0; i < list.length; i += 2) pairs.push(list.slice(i, i + 2))
            return (
            <div style={{
              flex: 1,
              minWidth: 0,
              height: ARTICLE_HEADER_PHOTO_HEIGHT,
              display: 'flex',
              alignItems: 'stretch',
              gap: 8
            }}>
              <div style={{
                width: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 11,
                color: colors.textSecondary,
                fontWeight: 500,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                textAlign: 'center'
              }}>
                В связке
              </div>
              <div
                className="hide-scrollbar"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: ARTICLE_HEADER_PHOTO_HEIGHT,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 8,
                  paddingRight: 4
                }}
              >
                {pairs.map((pair, colIndex) => (
                  <div
                    key={colIndex}
                    style={{
                      flexShrink: 0,
                      width: bundlePhotoW + 140,
                      height: ARTICLE_HEADER_PHOTO_HEIGHT,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    {pair.map((item) => (
                      <a
                        key={item.nmId}
                        onClick={(e) => {
                          e.preventDefault()
                          navigate(`/analytics/article/${item.nmId}`)
                        }}
                        href={`/analytics/article/${item.nmId}`}
                        style={{
                          flexShrink: 0,
                          height: rowHeight,
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          padding: '2px 4px',
                          borderRadius: borderRadius.sm,
                          textDecoration: 'none',
                          color: colors.textPrimary,
                          border: `1px solid transparent`,
                          transition: transitions.fast
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.bgGrayLight
                          e.currentTarget.style.borderColor = colors.borderLight
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.borderColor = 'transparent'
                        }}
                      >
                        {item.photoTm ? (
                          <img
                            src={item.photoTm}
                            alt=""
                            style={{
                              width: bundlePhotoW,
                              height: bundlePhotoH,
                              objectFit: 'contain',
                              borderRadius: 4,
                              flexShrink: 0
                            }}
                            onError={(ev) => { ev.currentTarget.style.display = 'none' }}
                          />
                        ) : (
                          <div style={{ width: bundlePhotoW, height: bundlePhotoH, backgroundColor: colors.bgGrayLight, borderRadius: 4, flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title || '-'}
                          </div>
                          <div style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.nmId}
                            {item.vendorCode ? ` · ${item.vendorCode}` : ''}
                          </div>
                        </div>
                      </a>
                    ))}
                    {pair.length < 2 && <div style={{ height: rowHeight, flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>
            )
          })() }
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
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <div style={{
            display: 'flex',
            marginBottom: spacing.md,
            alignItems: 'center',
            gap: spacing.lg,
            flexWrap: 'wrap',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' }}>
              <DatePicker.RangePicker
                locale={locale.DatePicker}
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]])
                  }
                }}
                format="DD.MM.YYYY"
                separator="→"
                style={{ width: 220 }}
              />
              <Checkbox
                checked={selectedFunnelKeys.includes('general')}
                onChange={() => toggleFunnel('general')}
              >
                Общая
              </Checkbox>
              <Checkbox
                checked={selectedFunnelKeys.includes('advertising')}
                onChange={() => toggleFunnel('advertising')}
              >
                Реклама
              </Checkbox>
              <Checkbox
                checked={selectedFunnelKeys.includes('pricing')}
                onChange={() => toggleFunnel('pricing')}
              >
                Цены
              </Checkbox>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, ...typography.body }}>
                <Switch
                  checked={showChart}
                  onChange={setShowChart}
                  size="small"
                />
                <span>График</span>
              </span>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExportFunnelsExcel}
                disabled={!article}
              >
                Выгрузить
              </Button>
            </div>
          </div>
          {selectedFunnel1 ? (
          <div style={{
            maxHeight: 438,
            overflowY: 'auto',
            overflowX: 'auto'
          }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'center',
                  padding: '6px 8px',
                  borderBottom: `1px solid ${colors.border}`,
                  borderRight: `2px solid ${colors.border}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  position: 'sticky',
                  top: 0,
                  left: 0,
                  backgroundColor: colors.bgWhite,
                  zIndex: 2,
                  width: '90px',
                  boxShadow: `0 1px 0 0 ${colors.border}`
                }}>
                  Дата
                </th>
                {FUNNELS[selectedFunnel1].metrics.map((metric, index) => {
                  const isGeneralFunnel = selectedFunnel1 === 'general'
                  const isAdvertisingFunnel = selectedFunnel1 === 'advertising'
                  const len2 = selectedFunnel2 ? FUNNELS[selectedFunnel2].metrics.length : 0
                  const len3 = selectedFunnel3 ? FUNNELS[selectedFunnel3].metrics.length : 0
                  const totalCols = FUNNELS[selectedFunnel1].metrics.length + len2 + len3
                  const isLastInFunnel1 = index === FUNNELS[selectedFunnel1].metrics.length - 1
                  const borderRight = !isLastInFunnel1 ? `1px solid ${colors.border}` : (!selectedFunnel2 && !selectedFunnel3) ? 'none' : `2px solid ${colors.border}`
                  return (
                    <th key={metric.key} style={{
                      textAlign: 'center',
                      padding: '4px 6px',
                      borderBottom: `1px solid ${colors.border}`,
                      boxShadow: `0 1px 0 0 ${colors.border}`,
                      borderRight,
                      fontSize: '10px',
                      fontWeight: 600,
                      whiteSpace: 'pre-line',
                      lineHeight: 1.2,
                      backgroundColor: isGeneralFunnel ? colors.funnelBg : isAdvertisingFunnel ? colors.advertisingBg : colors.pricingBg,
                      width: totalCols ? `${100 / totalCols}%` : undefined,
                      position: 'sticky',
                      top: 0,
                      zIndex: 2
                    }}>
                      {metric.name}
                    </th>
                  )
                })}
                {selectedFunnel2 && FUNNELS[selectedFunnel2].metrics.map((metric, index) => {
                  const isGeneralFunnel = selectedFunnel2 === 'general'
                  const isAdvertisingFunnel = selectedFunnel2 === 'advertising'
                  const len1 = FUNNELS[selectedFunnel1].metrics.length
                  const len3 = selectedFunnel3 ? FUNNELS[selectedFunnel3].metrics.length : 0
                  const totalCols = len1 + FUNNELS[selectedFunnel2].metrics.length + len3
                  const isLastInFunnel2 = index === FUNNELS[selectedFunnel2].metrics.length - 1
                  const borderRight = !isLastInFunnel2 ? `1px solid ${colors.border}` : !selectedFunnel3 ? 'none' : `2px solid ${colors.border}`
                  return (
                    <th key={metric.key} style={{
                      textAlign: 'center',
                      padding: '4px 6px',
                      borderBottom: `1px solid ${colors.border}`,
                      boxShadow: `0 1px 0 0 ${colors.border}`,
                      borderRight,
                      fontSize: '10px',
                      fontWeight: 600,
                      whiteSpace: 'pre-line',
                      lineHeight: 1.2,
                      backgroundColor: isGeneralFunnel ? colors.funnelBg : isAdvertisingFunnel ? colors.advertisingBg : colors.pricingBg,
                      width: `${100 / totalCols}%`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 2
                    }}>
                      {metric.name}
                    </th>
                  )
                })}
                {selectedFunnel3 && FUNNELS[selectedFunnel3].metrics.map((metric, index) => {
                  const isGeneralFunnel = selectedFunnel3 === 'general'
                  const isAdvertisingFunnel = selectedFunnel3 === 'advertising'
                  const len1 = FUNNELS[selectedFunnel1].metrics.length
                  const len2 = FUNNELS[selectedFunnel2].metrics.length
                  const len3 = FUNNELS[selectedFunnel3].metrics.length
                  const totalCols = len1 + len2 + len3
                  const isLastInFunnel3 = index === len3 - 1
                  return (
                    <th key={metric.key} style={{
                      textAlign: 'center',
                      padding: '4px 6px',
                      borderBottom: `1px solid ${colors.border}`,
                      boxShadow: `0 1px 0 0 ${colors.border}`,
                      borderRight: isLastInFunnel3 ? 'none' : `1px solid ${colors.border}`,
                      fontSize: '10px',
                      fontWeight: 600,
                      whiteSpace: 'pre-line',
                      lineHeight: 1.2,
                      backgroundColor: isGeneralFunnel ? colors.funnelBg : isAdvertisingFunnel ? colors.advertisingBg : colors.pricingBg,
                      width: `${100 / totalCols}%`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 2
                    }}>
                      {metric.name}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rangeDatesDesc.map((date, dateIndex) => {
                const isGeneralFunnel1 = selectedFunnel1 === 'general'
                const isAdvertisingFunnel1 = selectedFunnel1 === 'advertising'
                const isGeneralFunnel2 = selectedFunnel2 === 'general'
                const isAdvertisingFunnel2 = selectedFunnel2 === 'advertising'
                const isGeneralFunnel3 = selectedFunnel3 === 'general'
                const isAdvertisingFunnel3 = selectedFunnel3 === 'advertising'
                const len1 = FUNNELS[selectedFunnel1].metrics.length
                const len2 = selectedFunnel2 ? FUNNELS[selectedFunnel2].metrics.length : 0
                const getHoverBg = (funnelKey: FunnelKey) =>
                  funnelKey === 'general' ? colors.funnelBgHover : funnelKey === 'advertising' ? colors.advertisingBgHover : colors.pricingBgHover
                const getBg = (funnelKey: FunnelKey) =>
                  funnelKey === 'general' ? colors.funnelBg : funnelKey === 'advertising' ? colors.advertisingBg : colors.pricingBg
                const getFunnelKey = (cellIndex: number): FunnelKey => {
                  if (cellIndex <= len1) return selectedFunnel1
                  if (cellIndex <= len1 + len2) return selectedFunnel2!
                  return selectedFunnel3!
                }
                return (
                  <tr 
                    key={date}
                    style={{
                      transition: transitions.fast,
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      const row = e.currentTarget
                      row.style.backgroundColor = colors.bgGrayLight
                      Array.from(row.querySelectorAll('td')).forEach((cell: Element, cellIndex: number) => {
                        const td = cell as HTMLElement
                        if (cellIndex === 0) {
                          td.style.backgroundColor = getHoverBg(selectedFunnel1)
                        } else {
                          td.style.backgroundColor = getHoverBg(getFunnelKey(cellIndex))
                        }
                      })
                    }}
                    onMouseLeave={(e) => {
                      const row = e.currentTarget
                      row.style.backgroundColor = 'transparent'
                      Array.from(row.querySelectorAll('td')).forEach((cell: Element, cellIndex: number) => {
                        const td = cell as HTMLElement
                        if (cellIndex === 0) {
                          td.style.backgroundColor = colors.bgWhite
                        } else {
                          td.style.backgroundColor = getBg(getFunnelKey(cellIndex))
                        }
                      })
                    }}
                  >
                    <td style={{
                      padding: '6px 8px',
                      borderTop: dateIndex === 0 ? 'none' : undefined,
                      borderBottom: `1px solid ${colors.border}`,
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
                      const change = getMetricChangeVsPreviousDayDesc(dateIndex, metric.key)
                      const isPercent = metric.key.includes('conversion') || metric.key === 'ctr' || metric.key === 'drr' || metric.key === 'seller_discount' || metric.key === 'wb_club_discount' || metric.key === 'spp_percent'
                      const isCurrency = metric.key.includes('price') || metric.key === 'orders_amount' || metric.key === 'costs' || metric.key === 'cpc' || metric.key === 'cpo' || metric.key === 'spp_amount'
                      const showChangeNumber = METRICS_WITH_CHANGE_NUMBER.includes(metric.key)
                      const changeColor = change !== null && change !== 0 ? (change > 0 ? colors.success : colors.error) : undefined
                      const isLast1 = index === len1 - 1
                      const borderRight1 = !isLast1 ? `1px solid ${colors.border}` : (!selectedFunnel2 && !selectedFunnel3) ? 'none' : `2px solid ${colors.border}`
                      return (
                        <td key={metric.key} style={{
                          textAlign: 'center',
                          padding: '4px 6px',
                          borderTop: dateIndex === 0 ? 'none' : undefined,
                          borderBottom: `1px solid ${colors.border}`,
                          borderRight: borderRight1,
                          backgroundColor: isGeneralFunnel1 ? colors.funnelBg : isAdvertisingFunnel1 ? colors.advertisingBg : colors.pricingBg,
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: transitions.fast,
                          position: 'relative'
                        }}>
                          {value === null ? '-' : (
                            isPercent ? formatPercent(value) :
                            isCurrency ? formatCurrency(value) :
                            formatValue(value)
                          )}
                          {change !== null && change !== 0 && changeColor && (
                            <div style={{
                              position: 'absolute',
                              top: 1,
                              right: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0,
                              fontSize: '9px',
                              fontWeight: 600,
                              color: changeColor,
                              lineHeight: 1
                            }}>
                              {showChangeNumber && (
                                <span>{change > 0 ? '+' : ''}{change}</span>
                              )}
                              {change > 0 ? <ArrowUpOutlined style={{ fontSize: '9px' }} /> : <ArrowDownOutlined style={{ fontSize: '9px' }} />}
                            </div>
                          )}
                        </td>
                      )
                    })}
                    {selectedFunnel2 && FUNNELS[selectedFunnel2].metrics.map((metric, index) => {
                      const value = getMetricValueForDate(metric.key, date)
                      const change = getMetricChangeVsPreviousDayDesc(dateIndex, metric.key)
                      const isPercent = metric.key.includes('conversion') || metric.key === 'ctr' || metric.key === 'drr' || metric.key === 'seller_discount' || metric.key === 'wb_club_discount' || metric.key === 'spp_percent'
                      const isCurrency = metric.key.includes('price') || metric.key === 'orders_amount' || metric.key === 'costs' || metric.key === 'cpc' || metric.key === 'cpo' || metric.key === 'spp_amount'
                      const showChangeNumber = METRICS_WITH_CHANGE_NUMBER.includes(metric.key)
                      const changeColor = change !== null && change !== 0 ? (change > 0 ? colors.success : colors.error) : undefined
                      const isLast2 = index === FUNNELS[selectedFunnel2].metrics.length - 1
                      const borderRight2 = !isLast2 ? `1px solid ${colors.border}` : !selectedFunnel3 ? 'none' : `2px solid ${colors.border}`
                      return (
                        <td key={metric.key} style={{
                          textAlign: 'center',
                          padding: '4px 6px',
                          borderTop: dateIndex === 0 ? 'none' : undefined,
                          borderBottom: `1px solid ${colors.border}`,
                          borderRight: borderRight2,
                          backgroundColor: isGeneralFunnel2 ? colors.funnelBg : isAdvertisingFunnel2 ? colors.advertisingBg : colors.pricingBg,
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: transitions.fast,
                          position: 'relative'
                        }}>
                          {value === null ? '-' : (
                            isPercent ? formatPercent(value) :
                            isCurrency ? formatCurrency(value) :
                            formatValue(value)
                          )}
                          {change !== null && change !== 0 && changeColor && (
                            <div style={{
                              position: 'absolute',
                              top: 1,
                              right: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0,
                              fontSize: '9px',
                              fontWeight: 600,
                              color: changeColor,
                              lineHeight: 1
                            }}>
                              {showChangeNumber && (
                                <span>{change > 0 ? '+' : ''}{change}</span>
                              )}
                              {change > 0 ? <ArrowUpOutlined style={{ fontSize: '9px' }} /> : <ArrowDownOutlined style={{ fontSize: '9px' }} />}
                            </div>
                          )}
                        </td>
                      )
                    })}
                    {selectedFunnel3 && FUNNELS[selectedFunnel3].metrics.map((metric, index) => {
                      const value = getMetricValueForDate(metric.key, date)
                      const change = getMetricChangeVsPreviousDayDesc(dateIndex, metric.key)
                      const isPercent = metric.key.includes('conversion') || metric.key === 'ctr' || metric.key === 'drr' || metric.key === 'seller_discount' || metric.key === 'wb_club_discount' || metric.key === 'spp_percent'
                      const isCurrency = metric.key.includes('price') || metric.key === 'orders_amount' || metric.key === 'costs' || metric.key === 'cpc' || metric.key === 'cpo' || metric.key === 'spp_amount'
                      const showChangeNumber = METRICS_WITH_CHANGE_NUMBER.includes(metric.key)
                      const changeColor = change !== null && change !== 0 ? (change > 0 ? colors.success : colors.error) : undefined
                      return (
                        <td key={metric.key} style={{
                          textAlign: 'center',
                          padding: '4px 6px',
                          borderTop: dateIndex === 0 ? 'none' : undefined,
                          borderBottom: `1px solid ${colors.border}`,
                          borderRight: index === FUNNELS[selectedFunnel3].metrics.length - 1 ? 'none' : `1px solid ${colors.border}`,
                          backgroundColor: isGeneralFunnel3 ? colors.funnelBg : isAdvertisingFunnel3 ? colors.advertisingBg : colors.pricingBg,
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: transitions.fast,
                          position: 'relative'
                        }}>
                          {value === null ? '-' : (
                            isPercent ? formatPercent(value) :
                            isCurrency ? formatCurrency(value) :
                            formatValue(value)
                          )}
                          {change !== null && change !== 0 && changeColor && (
                            <div style={{
                              position: 'absolute',
                              top: 1,
                              right: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0,
                              fontSize: '9px',
                              fontWeight: 600,
                              color: changeColor,
                              lineHeight: 1
                            }}>
                              {showChangeNumber && (
                                <span>{change > 0 ? '+' : ''}{change}</span>
                              )}
                              {change > 0 ? <ArrowUpOutlined style={{ fontSize: '9px' }} /> : <ArrowDownOutlined style={{ fontSize: '9px' }} />}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {/* Строка "Весь период" */}
              <tr style={{
                backgroundColor: colors.bgGray
              }}>
                <td style={{
                  padding: '6px 8px',
                  borderBottom: `1px solid ${colors.border}`,
                  borderRight: `2px solid ${colors.border}`,
                  borderTop: `2px solid ${colors.border}`,
                  fontSize: '12px',
                  fontWeight: 700,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: colors.bgGray,
                  zIndex: 1
                }}>
                  Весь период
                </td>
                {FUNNELS[selectedFunnel1].metrics.map((metric, index) => {
                  const totalValue = getMetricTotalForPeriod(metric.key)
                  const isPercent = metric.key.includes('conversion') || metric.key === 'ctr' || metric.key === 'drr' || metric.key === 'seller_discount' || metric.key === 'wb_club_discount' || metric.key === 'spp_percent'
                  const isCurrency = metric.key.includes('price') || metric.key === 'orders_amount' || metric.key === 'costs' || metric.key === 'cpc' || metric.key === 'cpo' || metric.key === 'spp_amount'
                  const isLast1 = index === FUNNELS[selectedFunnel1].metrics.length - 1
                  const borderRight1 = !isLast1 ? `1px solid ${colors.border}` : (!selectedFunnel2 && !selectedFunnel3) ? 'none' : `2px solid ${colors.border}`
                  return (
                    <td key={metric.key} style={{
                      textAlign: 'center',
                      padding: '4px 6px',
                      borderBottom: `1px solid ${colors.border}`,
                      borderTop: `2px solid ${colors.border}`,
                      borderRight: borderRight1,
                      backgroundColor: colors.bgGray,
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      {totalValue === null ? '-' : (
                        isPercent ? formatPercent(totalValue) :
                        isCurrency ? formatCurrency(totalValue) :
                        formatValue(totalValue)
                      )}
                    </td>
                  )
                })}
                {selectedFunnel2 && FUNNELS[selectedFunnel2].metrics.map((metric, index) => {
                  const totalValue = getMetricTotalForPeriod(metric.key)
                  const isPercent = metric.key.includes('conversion') || metric.key === 'ctr' || metric.key === 'drr' || metric.key === 'seller_discount' || metric.key === 'wb_club_discount' || metric.key === 'spp_percent'
                  const isCurrency = metric.key.includes('price') || metric.key === 'orders_amount' || metric.key === 'costs' || metric.key === 'cpc' || metric.key === 'cpo' || metric.key === 'spp_amount'
                  const isLast2 = index === FUNNELS[selectedFunnel2].metrics.length - 1
                  const borderRight2 = !isLast2 ? `1px solid ${colors.border}` : !selectedFunnel3 ? 'none' : `2px solid ${colors.border}`
                  return (
                    <td key={metric.key} style={{
                      textAlign: 'center',
                      padding: '4px 6px',
                      borderBottom: `1px solid ${colors.border}`,
                      borderTop: `2px solid ${colors.border}`,
                      borderRight: borderRight2,
                      backgroundColor: colors.bgGray,
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      {totalValue === null ? '-' : (
                        isPercent ? formatPercent(totalValue) :
                        isCurrency ? formatCurrency(totalValue) :
                        formatValue(totalValue)
                      )}
                    </td>
                  )
                })}
                {selectedFunnel3 && FUNNELS[selectedFunnel3].metrics.map((metric, index) => {
                  const totalValue = getMetricTotalForPeriod(metric.key)
                  const isPercent = metric.key.includes('conversion') || metric.key === 'ctr' || metric.key === 'drr' || metric.key === 'seller_discount' || metric.key === 'wb_club_discount' || metric.key === 'spp_percent'
                  const isCurrency = metric.key.includes('price') || metric.key === 'orders_amount' || metric.key === 'costs' || metric.key === 'cpc' || metric.key === 'cpo' || metric.key === 'spp_amount'
                  return (
                    <td key={metric.key} style={{
                      textAlign: 'center',
                      padding: '4px 6px',
                      borderBottom: `1px solid ${colors.border}`,
                      borderTop: `2px solid ${colors.border}`,
                      borderRight: index === FUNNELS[selectedFunnel3].metrics.length - 1 ? 'none' : `1px solid ${colors.border}`,
                      backgroundColor: colors.bgGray,
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      {totalValue === null ? '-' : (
                        isPercent ? formatPercent(totalValue) :
                        isCurrency ? formatCurrency(totalValue) :
                        formatValue(totalValue)
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
          </div>
          ) : (
            <div style={{ ...typography.body,
                  ...FONT_PAGE, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl }}>
              Выберите до 3 воронок (Общая, Реклама, Цены)
            </div>
          )}
        </div>
      </div>

      {/* График (виден при включённом тумблере «График») */}
      {showChart && article && article.dailyData && article.dailyData.length > 0 && (
        <AnalyticsChart 
          dailyData={article.dailyData} 
          nmId={Number(nmId)}
          sellerId={getSelectedSellerId()}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      )}

      {/* Сравнение периодов и остатки */}
      {article && period1Data && period2Data && (() => {
        const allStocks = article?.stocks ?? []
        return (
          <div style={{
            backgroundColor: colors.bgWhite,
            border: `1px solid ${colors.borderLight}`,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            marginBottom: spacing.xl,
            boxShadow: shadows.md,
            transition: transitions.normal,
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = shadows.lg
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = shadows.md
          }}
          >
            {/* Внутренний контейнер с двумя колонками */}
            <div style={{
              display: 'flex',
              gap: spacing.lg,
              alignItems: 'stretch'
            }}>
              {/* Левая колонка: Сравнение периодов */}
              <div style={{
                flex: '0 1 75%',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                overflow: 'hidden'
              }}>
              {/* Заголовок и периоды в одной строке */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.sm,
                gap: spacing.lg,
                flexWrap: 'wrap'
              }}>
                <h2 style={{ 
                  ...typography.h2,
                  ...FONT_PAGE, 
                  margin: 0,
                  flex: '0 0 auto',
                  fontSize: '16px',
                  lineHeight: '1.4',
                  color: colors.textPrimary
                }}>
                  Сравнение периодов
                </h2>
                
                {/* Выбор периодов */}
                <div style={{
                  display: 'flex',
                  gap: spacing.lg,
                  alignItems: 'center',
                  flex: '1 1 auto',
                  justifyContent: 'flex-end'
                }}>
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
                gap: spacing.lg,
                alignContent: 'start'
              }}>
            {/* Сравнение по общей воронке */}
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.funnelBg }}>
                  <th style={{
                    textAlign: 'left',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.borderHeader}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    fontWeight: 600,
                    width: '35%'
                  }}>
                    Общая воронка
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.borderHeader}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    fontWeight: 600,
                    backgroundColor: colors.bgGrayLight,
                    width: '22%'
                  }}>
                    {period1[0].format('DD.MM')} - {period1[1].format('DD.MM')}
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.borderHeader}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    fontWeight: 600,
                    backgroundColor: colors.bgGrayLight,
                    width: '22%'
                  }}>
                    {period2[0].format('DD.MM')} - {period2[1].format('DD.MM')}
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.borderHeader}`,
                    borderLeft: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    fontWeight: 600,
                    backgroundColor: colors.bgGrayLight,
                    width: '21%'
                  }}>
                    Разница
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Переходы в карточку */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.funnelBgHover
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = colors.funnelBgHover
                    })
                  }}
                  onMouseLeave={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.bgWhite
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = 'transparent'
                    })
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    Переходы в карточку
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatValue(period1Data.transitions)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatValue(period2Data.transitions)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
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
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    Положили в корзину
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatValue(period1Data.cart)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatValue(period2Data.cart)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
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
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    Заказали товаров
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatValue(period1Data.orders)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatValue(period2Data.orders)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
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
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    Заказали на сумму
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatCurrency(period1Data.ordersAmount)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatCurrency(period2Data.ordersAmount)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    color: (() => {
                      const diff = calculateDifference(period1Data.ordersAmount, period2Data.ordersAmount, 2)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.ordersAmount, period2Data.ordersAmount, 2) !== null 
                      ? `${calculateDifference(period1Data.ordersAmount, period2Data.ordersAmount, 2)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.ordersAmount, period2Data.ordersAmount, 2)!)}`
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
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    Конверсия в корзину
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period1Data.cartConversion !== null ? formatPercent(period1Data.cartConversion) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period2Data.cartConversion !== null ? formatPercent(period2Data.cartConversion) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    color: (() => {
                      const diff = calculateDifference(period1Data.cartConversion, period2Data.cartConversion, undefined, true)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.cartConversion, period2Data.cartConversion, undefined, true) !== null 
                      ? `${calculateDifference(period1Data.cartConversion, period2Data.cartConversion, undefined, true)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.cartConversion, period2Data.cartConversion, undefined, true)!)}`
                      : '-'}
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
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    Конверсия в заказ
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period1Data.orderConversion !== null ? formatPercent(period1Data.orderConversion) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period2Data.orderConversion !== null ? formatPercent(period2Data.orderConversion) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    color: (() => {
                      const diff = calculateDifference(period1Data.orderConversion, period2Data.orderConversion, undefined, true)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.orderConversion, period2Data.orderConversion, undefined, true) !== null 
                      ? `${calculateDifference(period1Data.orderConversion, period2Data.orderConversion, undefined, true)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.orderConversion, period2Data.orderConversion, undefined, true)!)}`
                      : '-'}
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
                    borderBottom: `2px solid ${colors.borderHeader}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    fontWeight: 600,
                    width: '35%'
                  }}>
                    Рекламная воронка
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.borderHeader}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    fontWeight: 600,
                    backgroundColor: colors.advertisingBg,
                    width: '22%'
                  }}>
                    {period1[0].format('DD.MM')} - {period1[1].format('DD.MM')}
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.borderHeader}`,
                    borderLeft: `1px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    fontWeight: 600,
                    backgroundColor: colors.advertisingBg,
                    width: '22%'
                  }}>
                    {period2[0].format('DD.MM')} - {period2[1].format('DD.MM')}
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `2px solid ${colors.borderHeader}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    fontWeight: 600,
                    backgroundColor: colors.advertisingBg,
                    width: '21%'
                  }}>
                    Разница
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Просмотры */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.advertisingBgHover
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = colors.advertisingBgHover
                    })
                  }}
                  onMouseLeave={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.bgWhite
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = 'transparent'
                    })
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    Просмотры
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatValue(period1Data.views)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatValue(period2Data.views)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
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
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.advertisingBgHover
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = colors.advertisingBgHover
                    })
                  }}
                  onMouseLeave={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.bgWhite
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = 'transparent'
                    })
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    Клики
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatValue(period1Data.clicks)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {formatValue(period2Data.clicks)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
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
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.advertisingBgHover
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = colors.advertisingBgHover
                    })
                  }}
                  onMouseLeave={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.bgWhite
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = 'transparent'
                    })
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    Затраты
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period1Data.costs !== null ? formatCurrency(period1Data.costs) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period2Data.costs !== null ? formatCurrency(period2Data.costs) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    color: (() => {
                      const diff = calculateDifference(period1Data.costs, period2Data.costs, 2)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.costs, period2Data.costs, 2) !== null 
                      ? `${calculateDifference(period1Data.costs, period2Data.costs, 2)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.costs, period2Data.costs, 2)!)}`
                      : '-'}
                  </td>
                </tr>
                {/* CPC */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.advertisingBgHover
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = colors.advertisingBgHover
                    })
                  }}
                  onMouseLeave={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.bgWhite
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = 'transparent'
                    })
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    СРС
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period1Data.cpc !== null ? formatCurrency(period1Data.cpc) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period2Data.cpc !== null ? formatCurrency(period2Data.cpc) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    color: (() => {
                      const diff = calculateDifference(period1Data.cpc, period2Data.cpc)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.cpc, period2Data.cpc) !== null 
                      ? `${calculateDifference(period1Data.cpc, period2Data.cpc)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.cpc, period2Data.cpc)!)}`
                      : '-'}
                  </td>
                </tr>
                {/* CTR */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.advertisingBgHover
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = colors.advertisingBgHover
                    })
                  }}
                  onMouseLeave={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.bgWhite
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = 'transparent'
                    })
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    CTR
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period1Data.ctr !== null ? formatPercent(period1Data.ctr) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period2Data.ctr !== null ? formatPercent(period2Data.ctr) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    color: (() => {
                      const diff = calculateDifference(period1Data.ctr, period2Data.ctr, undefined, true)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.ctr, period2Data.ctr, undefined, true) !== null 
                      ? `${calculateDifference(period1Data.ctr, period2Data.ctr, undefined, true)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.ctr, period2Data.ctr, undefined, true)!)}`
                      : '-'}
                  </td>
                </tr>
                {/* CPO */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.advertisingBgHover
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = colors.advertisingBgHover
                    })
                  }}
                  onMouseLeave={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.bgWhite
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = 'transparent'
                    })
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    СРО
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period1Data.cpo !== null ? formatCurrency(period1Data.cpo) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period2Data.cpo !== null ? formatCurrency(period2Data.cpo) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    color: (() => {
                      const diff = calculateDifference(period1Data.cpo, period2Data.cpo, 2)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.cpo, period2Data.cpo, 2) !== null 
                      ? `${calculateDifference(period1Data.cpo, period2Data.cpo, 2)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.cpo, period2Data.cpo, 2)!)}`
                      : '-'}
                  </td>
                </tr>
                {/* ДРР */}
                <tr
                  style={{
                    transition: transitions.fast,
                    backgroundColor: colors.bgWhite
                  }}
                  onMouseEnter={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.advertisingBgHover
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = colors.advertisingBgHover
                    })
                  }}
                  onMouseLeave={(e) => {
                    const row = e.currentTarget
                    row.style.backgroundColor = colors.bgWhite
                    Array.from(row.querySelectorAll('td')).forEach((cell: Element) => {
                      (cell as HTMLElement).style.backgroundColor = 'transparent'
                    })
                  }}
                >
                  <td style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    ДРР
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `2px solid ${colors.border}`,
                    borderRight: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period1Data.drr !== null ? formatPercent(period1Data.drr) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderRight: `2px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE
                  }}>
                    {period2Data.drr !== null ? formatPercent(period2Data.drr) : '-'}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.border}`,
                    borderLeft: `1px solid ${colors.border}`,
                    ...typography.body,
                  ...FONT_PAGE,
                    color: (() => {
                      const diff = calculateDifference(period1Data.drr, period2Data.drr, undefined, true)
                      if (diff === null) return colors.textPrimary
                      return diff > 0 ? colors.success : diff < 0 ? colors.error : colors.textPrimary
                    })(),
                    fontWeight: 600
                  }}>
                    {calculateDifference(period1Data.drr, period2Data.drr, undefined, true) !== null 
                      ? `${calculateDifference(period1Data.drr, period2Data.drr, undefined, true)! > 0 ? '+' : ''}${formatPercent(calculateDifference(period1Data.drr, period2Data.drr, undefined, true)!)}`
                      : '-'}
                  </td>
                </tr>
              </tbody>
              </table>
            </div>
          </div>
              </div>

              {/* Правая колонка: Остатки */}
              <div style={{
                flex: '0 1 25%',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: `1px solid ${colors.borderLight}`,
                paddingLeft: spacing.lg,
                minWidth: '280px'
              }}>
                {(() => {
                  const latestUpdate = allStocks.length > 0
                    ? allStocks
                        .map(s => s.updatedAt)
                        .filter((d): d is string => d !== null)
                        .sort()
                        .reverse()[0]
                    : null
                  const totalAmount = allStocks.reduce((sum, stock) => sum + stock.amount, 0)
                  
                  const cabinetId = selectedCabinetId ?? undefined
                  const stocksTooRecent = (article?.lastStocksUpdateTriggeredAt != null) && dayjs(article.lastStocksUpdateTriggeredAt).isAfter(dayjs().subtract(1, 'hour'))
                  const stocksButtonDisabled = !cabinetId || stocksTooRecent || stocksUpdateLoading
                  const lastStocksTriggeredAt = article?.lastStocksUpdateTriggeredAt ?? null
                  const stocksTooltipTitle = !cabinetId
                    ? 'Выберите кабинет для обновления остатков'
                    : stocksTooRecent && lastStocksTriggeredAt
                      ? (() => {
                          const nextAt = dayjs(lastStocksTriggeredAt).add(1, 'hour')
                          const remainingMin = Math.max(0, nextAt.diff(dayjs(), 'minute', true))
                          const mins = Math.ceil(remainingMin)
                          if (mins >= 60) {
                            const h = Math.ceil(mins / 60)
                            return `Повторное обновление доступно через ${h} ${h === 1 ? 'час' : h < 5 ? 'часа' : 'часов'}`
                          }
                          return `Повторное обновление доступно через ${mins} ${mins === 1 ? 'минуту' : mins < 5 ? 'минуты' : 'минут'}`
                        })()
                      : 'Запустить обновление остатков'
                  return (
                    <>
                      <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    marginBottom: spacing.md,
                    flexWrap: 'nowrap',
                    minWidth: 0
                  }}>
                    <h2 style={{ 
                      ...typography.h2,
                  ...FONT_PAGE, 
                      margin: 0,
                      color: colors.textPrimary,
                      whiteSpace: 'nowrap',
                      fontSize: '16px',
                      lineHeight: '1.4',
                      flexShrink: 0
                    }}>
                      Остатки на {latestUpdate ? dayjs(latestUpdate).format('DD.MM.YY HH:mm') : 'дату'}
                    </h2>
                    <Tooltip title={stocksTooltipTitle}>
                      <Button
                        type="text"
                        size="small"
                        icon={<ReloadOutlined style={{ fontSize: 14 }} />}
                        loading={stocksUpdateLoading}
                        disabled={stocksButtonDisabled}
                        onClick={async () => {
                          if (!cabinetId) return
                          setStocksUpdateLoading(true)
                          try {
                            await userApi.triggerCabinetStocksUpdate(cabinetId)
                            message.success('Обновление остатков запущено. Данные обновятся в течение нескольких минут.')
                            await loadArticle(Number(nmId), campaignDateRange)
                          } catch (err: any) {
                            const msg = err.response?.data?.message ?? 'Не удалось запустить обновление остатков'
                            message.error(msg)
                          } finally {
                            setStocksUpdateLoading(false)
                          }
                        }}
                        style={{ width: 28, height: 28, padding: 0, flexShrink: 0 }}
                      />
                    </Tooltip>
                    {allStocks.length > 0 && (
                      <div 
                        style={{
                          position: 'relative',
                          flexShrink: 0,
                          marginLeft: 'auto'
                        }}
                        title={latestUpdate ? `Дата обновления ${dayjs(latestUpdate).format('DD.MM.YY HH:mm')}` : ''}
                      >
                        <div style={{
                          ...typography.h3,
                  ...FONT_PAGE,
                  ...FONT_PAGE,
                          color: colors.bgWhite,
                          backgroundColor: colors.primary,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          borderRadius: borderRadius.sm,
                          fontWeight: 600,
                          display: 'inline-block',
                          cursor: 'help',
                          whiteSpace: 'nowrap'
                        }}>
                          Всего {totalAmount.toLocaleString('ru-RU')}
                        </div>
                      </div>
                    )}
                  </div>
                  {allStocks.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: spacing.xl,
                      ...typography.body,
                  ...FONT_PAGE,
                      color: colors.textSecondary
                    }}>
                      нет данных
                    </div>
                  ) : (
                    <div style={{
                      flex: '1 1 0',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      minHeight: 0
                    }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.primaryLight }}>
                    <th style={{
                      textAlign: 'left',
                      padding: spacing.md,
                      borderBottom: `2px solid ${colors.primary}`,
                      ...typography.body,
                  ...FONT_PAGE,
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
                  ...FONT_PAGE,
                      fontWeight: 600,
                      backgroundColor: colors.primaryLight,
                      color: colors.primary
                    }}>
                      Кол-во
                    </th>
                  </tr>
                </thead>
                <tbody>
                {allStocks.map((stock, index) => {
                  const isZeroStock = stock.amount === 0
                  const isLowStock = stock.amount > 0 && stock.amount <= 1
                  const isExpanded = expandedStocks.has(stock.warehouseName)
                  const sizes = stockSizes[stock.warehouseName] || []
                  const isLoading = loadingSizes[stock.warehouseName] || false
                  
                  const handleRowClick = async () => {
                    if (isExpanded) {
                      // Сворачиваем строку
                      setExpandedStocks(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(stock.warehouseName)
                        return newSet
                      })
                    } else {
                      // Разворачиваем строку
                      setExpandedStocks(prev => new Set(prev).add(stock.warehouseName))
                      
                      // Загружаем данные по размерам, если еще не загружены
                      if (!stockSizes[stock.warehouseName] && !loadingSizes[stock.warehouseName]) {
                        setLoadingSizes(prev => ({ ...prev, [stock.warehouseName]: true }))
                        try {
                          const sellerId = getSelectedSellerId()
                          const sizesData = await analyticsApi.getStockSizes(Number(nmId), stock.warehouseName, sellerId, getSelectedCabinetId())
                          setStockSizes(prev => ({ ...prev, [stock.warehouseName]: sizesData }))
                        } catch (err) {
                          console.error('Ошибка при загрузке размеров:', err)
                        } finally {
                          setLoadingSizes(prev => ({ ...prev, [stock.warehouseName]: false }))
                        }
                      }
                    }
                  }
                  
                  return (
                    <>
                      <tr 
                        key={stock.warehouseName} 
                        onClick={handleRowClick}
                        style={{
                          backgroundColor: index % 2 === 0 ? colors.bgWhite : colors.bgGrayLight,
                          transition: transitions.fast,
                          cursor: 'pointer'
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
                          borderBottom: `1px solid ${colors.border}`,
                          ...typography.body,
                  ...FONT_PAGE,
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs
                        }}>
                          {isExpanded ? (
                            <DownOutlined style={{ fontSize: '12px', color: colors.primary }} />
                          ) : (
                            <RightOutlined style={{ fontSize: '12px', color: colors.textSecondary }} />
                          )}
                          {stock.warehouseName}
                        </td>
                        <td style={{
                          textAlign: 'center',
                          padding: spacing.md,
                          borderBottom: `1px solid ${colors.border}`,
                          ...typography.body,
                  ...FONT_PAGE,
                          fontWeight: 600,
                          color: isZeroStock ? colors.error : isLowStock ? colors.error : colors.textPrimary
                        }}>
                          {stock.amount.toLocaleString('ru-RU')}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${stock.warehouseName}-expanded`}>
                          <td colSpan={2} style={{
                            padding: spacing.md,
                            backgroundColor: colors.bgGrayLight,
                            borderBottom: `1px solid ${colors.borderLight}`
                          }}>
                            {isLoading ? (
                              <div style={{ textAlign: 'center', padding: spacing.md }}>
                                <Spin size="small" />
                              </div>
                            ) : (() => {
                              const hasSizeBreakdown = sizes.length > 1 || (sizes.length === 1 && sizes[0].techSize != null && String(sizes[0].techSize) !== '0')
                              if (!hasSizeBreakdown && sizes.length > 0) {
                                return (
                                  <div style={{
                                    ...typography.body,
                                    ...FONT_PAGE_SMALL,
                                    color: colors.textSecondary
                                  }}>
                                    Товар без разбивки по размерам
                                  </div>
                                )
                              }
                              return sizes.length > 0 ? (
                              <div style={{ paddingLeft: spacing.lg }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <thead>
                                    <tr>
                                      <th style={{
                                        textAlign: 'left',
                                        padding: `${spacing.xs} ${spacing.sm}`,
                                        borderBottom: `1px solid ${colors.border}`,
                                        ...typography.body,
                  ...FONT_PAGE_SMALL,
                                        fontWeight: 600,
                                        color: colors.textSecondary
                                      }}>
                                        Размер
                                      </th>
                                      <th style={{
                                        textAlign: 'center',
                                        padding: `${spacing.xs} ${spacing.sm}`,
                                        borderBottom: `1px solid ${colors.border}`,
                                        ...typography.body,
                  ...FONT_PAGE_SMALL,
                                        fontWeight: 600,
                                        color: colors.textSecondary
                                      }}>
                                        Кол-во
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sizes.map((size: StockSize, sizeIndex: number) => {
                                      const isZeroSize = size.amount === 0
                                      return (
                                      <tr key={sizeIndex} style={{
                                        backgroundColor: sizeIndex % 2 === 0 ? colors.bgWhite : colors.bgGrayLight
                                      }}>
                                        <td style={{
                                          padding: `${spacing.xs} ${spacing.sm}`,
                                          borderBottom: `1px solid ${colors.border}`,
                                          ...typography.body,
                  ...FONT_PAGE_SMALL
                                        }}>
                                          {size.wbSize || size.techSize || 'Неизвестно'}
                                        </td>
                                        <td style={{
                                          textAlign: 'center',
                                          padding: `${spacing.xs} ${spacing.sm}`,
                                          borderBottom: `1px solid ${colors.border}`,
                                          ...typography.body,
                  ...FONT_PAGE_SMALL,
                                          fontWeight: 500,
                                          color: isZeroSize ? colors.error : undefined
                                        }}>
                                          {size.amount.toLocaleString('ru-RU')}
                                        </td>
                                      </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div style={{
                                textAlign: 'center',
                                padding: spacing.md,
                                ...typography.body,
                  ...FONT_PAGE_SMALL,
                                color: colors.textSecondary
                              }}>
                                Нет данных по размерам
                              </div>
                            )
                            })()}
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
                    </div>
                  )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Список РК */}
      {article && article.campaigns.length > 0 && (() => {
        const searchLower = campaignSearchQuery.trim().toLowerCase()
        const filteredCampaigns = searchLower
          ? article.campaigns.filter(
              (c) =>
                c.name.toLowerCase().includes(searchLower) ||
                String(c.id).includes(campaignSearchQuery.trim())
            )
          : article.campaigns
        const formatCampaignDate = (dateStr: string) =>
          dateStr ? dayjs(dateStr).format('DD.MM.YYYY') : '-'
        const formatNum = (v: number | null | undefined) =>
          v == null ? '-' : v.toLocaleString('ru-RU')
        const formatPct = (v: number | null | undefined) =>
          v == null ? '-' : `${Number(v).toFixed(2)}%`
        const formatCur = (v: number | null | undefined) =>
          v == null ? '-' : v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        const isActive = (c: typeof article.campaigns[0]) => c.status === 9
        const statusLabel = (c: typeof article.campaigns[0]) =>
          isActive(c) ? 'активна' : 'приостановлена'
        const statusBg = (c: typeof article.campaigns[0]) =>
          isActive(c) ? colors.success : colors.error
        const statusColor = '#fff'
        return (
          <div
            style={{
              width: '100%',
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
            <h2
              style={{
                ...typography.h2,
                ...FONT_PAGE,
                margin: 0,
                marginBottom: spacing.md,
                color: colors.textPrimary
              }}
            >
              Список РК
            </h2>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: spacing.md,
                alignItems: 'center',
                marginBottom: spacing.md
              }}
            >
              <Input
                placeholder="Поиск по ID кампании или названию"
                prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
                value={campaignSearchQuery}
                onChange={(e) => setCampaignSearchQuery(e.target.value)}
                allowClear
                style={{
                  maxWidth: 360,
                  borderRadius: borderRadius.sm
                }}
              />
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <span style={{ ...typography.body, fontSize: 12, color: colors.textSecondary }}>Период для метрик:</span>
                <DatePicker.RangePicker
                  locale={locale.DatePicker}
                  value={campaignDateRange}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setCampaignDateRange([dates[0], dates[1]])
                    }
                  }}
                  format="DD.MM.YYYY"
                  separator="→"
                  placeholder={['Дата начала', 'Дата окончания']}
                  style={{ width: 220 }}
                />
              </span>
            </div>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ backgroundColor: colors.bgGray }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>Дата создания</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>Кампания</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>Тип</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>Статус</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>Показы</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>Клики</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>CTR</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>CPC</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>Затраты</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>Корзины</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px', borderBottom: `2px solid ${colors.borderHeader}`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }}>Заказы</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((c, idx) => (
                    <tr
                      key={c.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? colors.bgWhite : colors.bgGrayLight,
                        transition: transitions.fast
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bgGray
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = idx % 2 === 0 ? colors.bgWhite : colors.bgGrayLight
                      }}
                    >
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL }}>{formatCampaignDate(c.createdAt)}</td>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL }}>
                        <Link to={`/advertising/campaigns/${c.id}`} style={{ fontWeight: 500, color: colors.primary, textDecoration: 'none' }}>{c.name}</Link>
                      </td>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL }}>
                        <Link to={`/advertising/campaigns/${c.id}`} style={{ color: colors.primary, textDecoration: 'none' }}>{c.id}</Link>
                      </td>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL }}>{c.type || '-'}</td>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}` }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: borderRadius.sm,
                            backgroundColor: statusBg(c),
                            color: statusColor,
                            fontSize: '11px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {statusLabel(c)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL }}>{formatNum(c.views)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL }}>{formatNum(c.clicks)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL }}>{c.ctr != null ? formatPct(c.ctr) : '-'}</td>
                      <td style={{ textAlign: 'right', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL }}>{c.cpc != null ? formatCur(c.cpc) : '-'}</td>
                      <td style={{ textAlign: 'right', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL }}>{c.costs != null ? formatCur(c.costs) : '-'}</td>
                      <td style={{ textAlign: 'right', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL }}>{formatNum(c.cart)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...typography.body, ...FONT_PAGE_SMALL }}>{formatNum(c.orders)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {/* Заметки */}
        <div style={{
          backgroundColor: colors.bgWhite,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          marginTop: spacing.xl,
          boxShadow: shadows.md
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.md
          }}>
            <h2 style={{ 
              ...typography.h2,
                  ...FONT_PAGE, 
              margin: 0,
              color: colors.textPrimary
            }}>
              Заметки
            </h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openNoteModal()}
            >
              Добавить заметку
            </Button>
          </div>

          {loadingNotes ? (
            <div style={{ textAlign: 'center', padding: spacing.xl }}>
              <Spin />
            </div>
          ) : notes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: spacing.xl,
              fontSize: '12px',
              fontWeight: typography.body.fontWeight,
              lineHeight: typography.body.lineHeight,
              color: colors.textSecondary
            }}>
              Нет заметок. Создайте первую заметку.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.sm,
                    padding: spacing.md,
                    backgroundColor: colors.bgGrayLight
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: spacing.sm
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        ...typography.body,
                  ...FONT_PAGE_SMALL,
                        color: colors.textSecondary,
                        marginBottom: spacing.xs
                      }}>
                        {note.userEmail} • {dayjs(note.createdAt).format('DD.MM.YYYY HH:mm')}
                        {note.updatedAt !== note.createdAt && ' (изменено)'}
                      </div>
                      <div style={{
                        ...typography.body,
                  ...FONT_PAGE,
                        color: colors.textPrimary,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {note.content}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: spacing.xs, marginLeft: spacing.md }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openNoteModal(note)}
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteNote(note.id)}
                      />
                    </div>
                  </div>

                  {/* Файлы */}
                  {note.files && note.files.length > 0 && (
                    <div style={{
                      marginTop: spacing.sm,
                      paddingTop: spacing.sm,
                      borderTop: `1px solid ${colors.border}`
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                        {note.files.map((file) => (
                          <div
                            key={file.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: spacing.xs,
                              backgroundColor: colors.bgWhite,
                              borderRadius: borderRadius.sm,
                              border: `1px solid ${colors.borderLight}`
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, flex: 1 }}>
                              <PaperClipOutlined style={{ color: colors.textSecondary }} />
                              <span style={{ ...typography.body,
                  ...FONT_PAGE_SMALL, color: colors.textPrimary }}>
                                {file.fileName}
                              </span>
                              <span style={{ ...typography.body,
                  ...FONT_PAGE_SMALL, color: colors.textSecondary }}>
                                ({(file.fileSize / 1024).toFixed(2)} КБ)
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: spacing.xs }}>
                              {isImageFile(file.mimeType) && (
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EyeOutlined />}
                                  onClick={() => handleViewImage(note.id, file.id, file.fileName)}
                                  title="Просмотр"
                                />
                              )}
                              <Button
                                type="text"
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownloadFile(note.id, file.id, file.fileName)}
                                title="Скачать"
                              />
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteFile(note.id, file.id)}
                                title="Удалить"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Модальное окно для создания/редактирования заметки */}
      <Modal
        title={editingNote ? 'Редактировать заметку' : 'Создать заметку'}
        open={isNoteModalOpen}
        onOk={editingNote ? handleUpdateNote : handleCreateNote}
        onCancel={() => {
          setIsNoteModalOpen(false)
          setEditingNote(null)
          setNoteContent('')
          setNoteFiles([])
        }}
        okText={editingNote ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        width={600}
        confirmLoading={uploadingNoteFiles}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <Input.TextArea
            rows={6}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Введите текст заметки..."
          />
          <div>
            <div style={{ marginBottom: spacing.xs, ...typography.body,
                  ...FONT_PAGE_SMALL, color: colors.textSecondary }}>
              Прикрепить файлы:
            </div>
            <Upload
              multiple
              beforeUpload={(file) => {
                setNoteFiles(prev => [...prev, file])
                return false // Предотвращаем автоматическую загрузку
              }}
              onRemove={(file) => {
                setNoteFiles(prev => prev.filter(f => f.name !== file.name))
              }}
              fileList={noteFiles.map((file, index) => ({
                uid: `${index}`,
                name: file.name,
                status: 'done' as const,
              }))}
            >
              <Button icon={<PaperClipOutlined />}>Выбрать файлы</Button>
            </Upload>
          </div>
        </div>
      </Modal>

      {/* Модальное окно для просмотра изображения */}
      <Modal
        title={imagePreview?.fileName || 'Просмотр изображения'}
        open={!!imagePreview}
        onCancel={() => {
          if (imagePreview?.url) {
            window.URL.revokeObjectURL(imagePreview.url)
          }
          setImagePreview(null)
        }}
        footer={null}
        width={800}
        centered
      >
        {imagePreview && (
          <div style={{ textAlign: 'center' }}>
            <img
              src={imagePreview.url}
              alt={imagePreview.fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: borderRadius.sm,
              }}
              onError={() => {
                message.error('Ошибка при загрузке изображения')
                if (imagePreview?.url) {
                  window.URL.revokeObjectURL(imagePreview.url)
                }
                setImagePreview(null)
              }}
            />
          </div>
        )}
      </Modal>
    </>
  )
}
