import { useState, useMemo, useCallback, useEffect } from 'react'
import { Spin, Input, Select } from 'antd'
import { SearchOutlined, CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId, getStoredCabinetIdForSeller, setStoredCabinetIdForSeller } from '../api/cabinets'
import { userApi } from '../api/user'
import type { Campaign } from '../types/analytics'
import { colors, typography, spacing, borderRadius, transitions, shadows } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'

dayjs.locale('ru')

const FONT_PAGE_SMALL = { fontSize: '11px' as const }

type SortField = 'createdAt' | 'name' | 'id' | 'type' | 'articlesCount' | 'status' | 'views' | 'clicks' | 'ctr' | 'cpc' | 'costs' | 'cart' | 'orders'
type SortOrder = 'asc' | 'desc'

const thStyle = {
  textAlign: 'left' as const,
  padding: '8px 10px',
  borderBottom: `2px solid ${colors.border}`,
  cursor: 'pointer' as const,
  userSelect: 'none' as const,
  overflow: 'hidden',
  wordBreak: 'break-word' as const,
  whiteSpace: 'normal' as const,
  boxSizing: 'border-box' as const,
}

/** Стиль ячейки таблицы: текст не выходит за границы, не налезает на соседние колонки */
const tdOverflowStyle = { overflow: 'hidden', wordBreak: 'break-word' as const, boxSizing: 'border-box' as const }

/** Ширины колонок таблицы в % (сумма 100), чтобы заполнение было примерно равномерным */
const COL_WIDTHS_PCT = {
  createdAt: 8,
  name: 14,
  id: 6,
  type: 8,
  articlesCount: 8,
  status: 9,
  views: 8,
  clicks: 7,
  ctr: 6,
  cpc: 7,
  costs: 8,
  cart: 6,
  orders: 5,
} as const

export default function AdvertisingCampaigns() {
  const role = useAuthStore((state) => state.role)
  const isManagerOrAdmin = role === 'ADMIN' || role === 'MANAGER'
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all')
  const [filterType, setFilterType] = useState<string | null>(null)

  const { data: activeSellers = [] } = useQuery({
    queryKey: ['activeSellers'],
    queryFn: () => userApi.getActiveSellers(),
    enabled: isManagerOrAdmin,
  })

  const [selectedSellerId, setSelectedSellerId] = useState<number | undefined>(() => {
    if (!isManagerOrAdmin) return undefined
    const saved = localStorage.getItem('analytics_selected_seller_id')
    if (saved) {
      const id = parseInt(saved, 10)
      if (!Number.isNaN(id)) return id
    }
    return undefined
  })

  const { data: myCabinets = [], isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'SELLER' || role === 'WORKER',
  })

  const { data: sellerCabinets = [], isLoading: sellerCabinetsLoading } = useQuery({
    queryKey: ['sellerCabinets', selectedSellerId],
    queryFn: () => userApi.getSellerCabinets(selectedSellerId!),
    enabled: isManagerOrAdmin && selectedSellerId != null,
  })

  const cabinets = isManagerOrAdmin ? sellerCabinets : myCabinets
  const cabinetsLoadingState = isManagerOrAdmin ? sellerCabinetsLoading : cabinetsLoading

  const storedCabinetId = isManagerOrAdmin && selectedSellerId != null
    ? getStoredCabinetIdForSeller(selectedSellerId)
    : getStoredCabinetId()
  const selectedCabinetId = cabinets.length > 0
    ? (storedCabinetId != null && cabinets.some((c) => c.id === storedCabinetId) ? storedCabinetId : cabinets[0].id)
    : null

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['advertising-campaigns', selectedCabinetId],
    queryFn: () => analyticsApi.getCampaigns(undefined, selectedCabinetId ?? undefined),
    enabled: selectedCabinetId != null,
  })

  const setSelectedCabinetId = useCallback(
    (id: number | null) => {
      if (isManagerOrAdmin && selectedSellerId != null) {
        setStoredCabinetIdForSeller(selectedSellerId, id)
      } else {
        setStoredCabinetId(id)
      }
    },
    [isManagerOrAdmin, selectedSellerId]
  )

  const handleSellerChange = useCallback((sellerId: number) => {
    setSelectedSellerId(sellerId)
    localStorage.setItem('analytics_selected_seller_id', String(sellerId))
  }, [])

  const cabinetSelectProps =
    cabinets.length > 0
      ? {
          cabinets: cabinets.map((c) => ({ id: c.id, name: c.name })),
          selectedCabinetId,
          onCabinetChange: setSelectedCabinetId,
          loading: cabinetsLoadingState,
        }
      : undefined

  useEffect(() => {
    if (isManagerOrAdmin && activeSellers.length > 0 && selectedSellerId == null) {
      const firstId = activeSellers[0].id
      setSelectedSellerId(firstId)
      localStorage.setItem('analytics_selected_seller_id', String(firstId))
    }
  }, [isManagerOrAdmin, activeSellers, selectedSellerId])

  const sellerSelectProps =
    isManagerOrAdmin && activeSellers.length > 0
      ? {
          sellers: activeSellers.map((s) => ({ id: s.id, email: s.email })),
          selectedSellerId: selectedSellerId ?? undefined,
          onSellerChange: handleSellerChange,
        }
      : undefined

  const searchLower = campaignSearchQuery.trim().toLowerCase()
  const uniqueTypes = useMemo(
    () => Array.from(new Set(campaigns.map((c) => c.type).filter((t): t is string => t != null && t !== ''))).sort(),
    [campaigns]
  )

  const filteredCampaigns = useMemo(() => {
    let list = campaigns
    if (filterStatus === 'active') list = list.filter((c) => c.status === 9)
    else if (filterStatus === 'paused') list = list.filter((c) => c.status !== 9)
    if (filterType != null) list = list.filter((c) => c.type === filterType)
    if (searchLower) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          String(c.id).includes(campaignSearchQuery.trim())
      )
    }
    const sorted = [...list].sort((a, b) => {
      let aVal: string | number | null | undefined
      let bVal: string | number | null | undefined
      switch (sortField) {
        case 'createdAt':
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0
          break
        case 'name':
          aVal = (a.name ?? '').toLowerCase()
          bVal = (b.name ?? '').toLowerCase()
          break
        case 'id':
          aVal = a.id
          bVal = b.id
          break
        case 'type':
          aVal = (a.type ?? '').toLowerCase()
          bVal = (b.type ?? '').toLowerCase()
          break
        case 'articlesCount':
          aVal = a.articlesCount ?? 0
          bVal = b.articlesCount ?? 0
          break
        case 'status':
          aVal = a.status ?? -1
          bVal = b.status ?? -1
          break
        case 'views':
          aVal = a.views ?? 0
          bVal = b.views ?? 0
          break
        case 'clicks':
          aVal = a.clicks ?? 0
          bVal = b.clicks ?? 0
          break
        case 'ctr':
          aVal = a.ctr ?? 0
          bVal = b.ctr ?? 0
          break
        case 'cpc':
          aVal = a.cpc ?? 0
          bVal = b.cpc ?? 0
          break
        case 'costs':
          aVal = a.costs ?? 0
          bVal = b.costs ?? 0
          break
        case 'cart':
          aVal = a.cart ?? 0
          bVal = b.cart ?? 0
          break
        case 'orders':
          aVal = a.orders ?? 0
          bVal = b.orders ?? 0
          break
        default:
          return 0
      }
      const aNum = typeof aVal === 'number'
      const bNum = typeof bVal === 'number'
      if (aNum && bNum) {
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
      }
      const sa = String(aVal ?? '')
      const sb = String(bVal ?? '')
      const cmp = sa.localeCompare(sb, 'ru')
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [campaigns, filterStatus, filterType, searchLower, campaignSearchQuery, sortField, sortOrder])

  const formatCampaignDate = (dateStr: string) =>
    dateStr ? dayjs(dateStr).format('DD.MM.YYYY') : '-'
  const formatNum = (v: number | null | undefined) =>
    v == null ? '-' : v.toLocaleString('ru-RU')
  const formatPct = (v: number | null | undefined) =>
    v == null ? '-' : `${Number(v).toFixed(2)}%`
  const formatCur = (v: number | null | undefined) =>
    v == null ? '-' : v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const isActive = (c: Campaign) => c.status === 9
  const statusLabel = (c: Campaign) => (isActive(c) ? 'активна' : 'приостановлена')
  const statusBg = (c: Campaign) => (isActive(c) ? colors.success : colors.error)
  const statusColor = '#fff'

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField !== field ? null : sortOrder === 'asc' ? (
      <CaretUpOutlined style={{ marginLeft: 4, fontSize: 10 }} />
    ) : (
      <CaretDownOutlined style={{ marginLeft: 4, fontSize: 10 }} />
    )

  return (
    <>
      <Header cabinetSelectProps={cabinetSelectProps} sellerSelectProps={sellerSelectProps} />
      <Breadcrumbs />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
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
              transition: transitions.normal,
            }}
          >
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
              placeholder="Поиск по ID кампании или названию"
              prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
              value={campaignSearchQuery}
              onChange={(e) => setCampaignSearchQuery(e.target.value)}
              allowClear
              style={{ maxWidth: 360, borderRadius: borderRadius.sm }}
            />
            <Select
              placeholder="Статус"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'Все' },
                { value: 'active', label: 'Активна' },
                { value: 'paused', label: 'Приостановлена' },
              ]}
              style={{ minWidth: 160, borderRadius: borderRadius.sm }}
            />
            <Select
              placeholder="Тип"
              value={filterType ?? ''}
              onChange={(v) => setFilterType(v === '' || v == null ? null : v)}
              options={[
                { value: '', label: 'Все типы' },
                ...uniqueTypes.map((t) => ({ value: t, label: t })),
              ]}
              style={{ minWidth: 160, borderRadius: borderRadius.sm }}
            />
          </div>
          {campaignsLoading ? (
            <div style={{ textAlign: 'center', padding: spacing.xxl }}>
              <Spin />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: spacing.xxl,
                ...typography.body,
                color: colors.textSecondary,
              }}
            >
              Нет рекламных кампаний за последние 30 дней
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ backgroundColor: colors.bgGray }}>
                    <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.createdAt}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('createdAt')}>Дата создания <SortIcon field="createdAt" /></th>
                    <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.name}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('name')}>Кампания <SortIcon field="name" /></th>
                    <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.id}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('id')}>ID <SortIcon field="id" /></th>
                    <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.type}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('type')}>Тип <SortIcon field="type" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.articlesCount}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('articlesCount')}>Количество артикулов <SortIcon field="articlesCount" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.status}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('status')}>Статус <SortIcon field="status" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.views}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('views')}>Показы <SortIcon field="views" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.clicks}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('clicks')}>Клики <SortIcon field="clicks" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.ctr}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('ctr')}>CTR <SortIcon field="ctr" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.cpc}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('cpc')}>CPC <SortIcon field="cpc" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.costs}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('costs')}>Затраты <SortIcon field="costs" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.cart}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('cart')}>Корзины <SortIcon field="cart" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.orders}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('orders')}>Заказы <SortIcon field="orders" /></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((c, idx) => (
                    <tr
                      key={c.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? colors.bgWhite : colors.bgGrayLight,
                        transition: transitions.fast,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bgGray
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = idx % 2 === 0 ? colors.bgWhite : colors.bgGrayLight
                      }}
                    >
                      <td style={{ width: `${COL_WIDTHS_PCT.createdAt}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{formatCampaignDate(c.createdAt)}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.name}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 500, color: colors.primary }}>{c.name}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.id}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL, color: colors.textSecondary }}>{c.id}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.type}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{c.type || '-'}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.articlesCount}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{formatNum(c.articlesCount)}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.status}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: borderRadius.sm,
                            backgroundColor: statusBg(c),
                            color: statusColor,
                            fontSize: '11px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {statusLabel(c)}
                        </span>
                      </td>
                      <td style={{ width: `${COL_WIDTHS_PCT.views}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{formatNum(c.views)}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.clicks}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{formatNum(c.clicks)}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.ctr}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{c.ctr != null ? formatPct(c.ctr) : '-'}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.cpc}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{c.cpc != null ? formatCur(c.cpc) : '-'}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.costs}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{c.costs != null ? formatCur(c.costs) : '-'}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.cart}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{formatNum(c.cart)}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.orders}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{formatNum(c.orders)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  )
}
