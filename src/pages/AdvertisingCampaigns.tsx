import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Spin, Input, Select, DatePicker, Button, message } from 'antd'
import { SearchOutlined, CaretUpOutlined, CaretDownOutlined, SyncOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { useQuery, useMutation } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
import type { Campaign } from '../types/analytics'
import { colors, typography, spacing, borderRadius, transitions, shadows } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useWorkContextForManagerAdmin } from '../hooks/useWorkContextForManagerAdmin'

dayjs.locale('ru')

const FONT_PAGE_SMALL = { fontSize: '11px' as const }

type SortField =
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'id'
  | 'type'
  | 'articlesCount'
  | 'status'
  | 'views'
  | 'clicks'
  | 'ctr'
  | 'cpc'
  | 'costs'
  | 'cart'
  | 'orders'
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
  updatedAt: 8,
  name: 11,
  id: 6,
  type: 8,
  articlesCount: 8,
  status: 9,
  views: 7,
  clicks: 7,
  ctr: 6,
  cpc: 7,
  costs: 7,
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

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(() => {
    const to = dayjs().subtract(1, 'day')
    return [to.subtract(13, 'day'), to]
  })

  const workContext = useWorkContextForManagerAdmin(isManagerOrAdmin)
  const selectedSellerId = isManagerOrAdmin ? workContext.selectedSellerId : undefined

  const { data: myCabinets = [], isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'SELLER' || role === 'WORKER',
  })

  const cabinets = useMemo(() => {
    if (isManagerOrAdmin) {
      return workContext.workContextOptions.map((o) => ({ id: o.cabinetId, name: o.cabinetName }))
    }
    return myCabinets
  }, [isManagerOrAdmin, workContext.workContextOptions, myCabinets])

  const cabinetsLoadingState = isManagerOrAdmin ? workContext.workContextLoading : cabinetsLoading

  const [sellerSelectedCabinetId, setSellerSelectedCabinetId] = useState<number | null>(() => getStoredCabinetId())

  const selectedCabinetId = isManagerOrAdmin ? workContext.selectedCabinetId : sellerSelectedCabinetId

  const dateFromStr = dateRange[0].format('YYYY-MM-DD')
  const dateToStr = dateRange[1].format('YYYY-MM-DD')

  const promotionSyncMutation = useMutation({
    mutationFn: () =>
      analyticsApi.enqueuePromotionSync(
        isManagerOrAdmin ? selectedSellerId ?? undefined : undefined,
        selectedCabinetId ?? undefined,
        dateFromStr,
        dateToStr
      ),
    onSuccess: (data) => {
      if (data.enqueued) {
        message.success('Обновление РК поставлено в очередь')
      } else {
        message.info('Обновление РК за этот период уже есть в очереди')
      }
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { error?: string; message?: string } } }
      const msg =
        ax.response?.data?.error ||
        ax.response?.data?.message ||
        'Не удалось поставить задачу обновления РК'
      message.error(msg)
    },
  })

  const { data: campaigns = [], isLoading: campaignsLoading, isError: campaignsError, error: campaignsErr } = useQuery({
    queryKey: ['advertising-campaigns', isManagerOrAdmin ? selectedSellerId : null, selectedCabinetId, dateFromStr, dateToStr],
    queryFn: () =>
      analyticsApi.getCampaigns(
        isManagerOrAdmin ? selectedSellerId ?? undefined : undefined,
        selectedCabinetId ?? undefined,
        dateFromStr,
        dateToStr
      ),
    enabled: selectedCabinetId != null,
  })

  const backendErrorMessage =
    (campaignsError && (campaignsErr as any)?.response?.data?.error) ||
    (campaignsError && (campaignsErr as any)?.response?.data?.message) ||
    null

  const emptyStateMessage =
    isManagerOrAdmin && !workContext.workContextLoading && workContext.workContextOptions.length === 0
      ? 'Нет кабинетов с API-ключом'
      : backendErrorMessage ?? 'Нет рекламных кампаний за выбранный период'

  const setSelectedCabinetId = useCallback(
    (id: number | null) => {
      if (isManagerOrAdmin) {
        if (id != null) workContext.applyWorkContextCabinet(id)
      } else {
        setSellerSelectedCabinetId(id)
        setStoredCabinetId(id)
      }
    },
    [isManagerOrAdmin, workContext.applyWorkContextCabinet],
  )

  useEffect(() => {
    if (!isManagerOrAdmin) {
      setSellerSelectedCabinetId(getStoredCabinetId())
    }
  }, [isManagerOrAdmin])

  useEffect(() => {
    if (isManagerOrAdmin) return
    if (myCabinets.length > 0 && sellerSelectedCabinetId === null) {
      const first = myCabinets[0].id
      setSellerSelectedCabinetId(first)
      setStoredCabinetId(first)
    }
  }, [isManagerOrAdmin, myCabinets, sellerSelectedCabinetId])

  const cabinetSelectProps =
    !isManagerOrAdmin && cabinets.length > 0
      ? {
          cabinets: cabinets.map((c) => ({ id: c.id, name: c.name })),
          selectedCabinetId,
          onCabinetChange: setSelectedCabinetId,
          loading: cabinetsLoadingState,
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
        case 'updatedAt':
          aVal = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          bVal = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
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
  const formatCampaignDateTime = (dateStr: string | null | undefined) =>
    dateStr ? dayjs(dateStr).format('DD.MM.YYYY HH:mm') : '-'
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
      <Header
        workContextCabinetSelect={isManagerOrAdmin ? workContext.workContextCabinetSelectProps : undefined}
        cabinetSelectProps={cabinetSelectProps}
      />
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
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: spacing.md,
                alignItems: 'center',
                flex: '1 1 auto',
                minWidth: 0,
              }}
            >
              <DatePicker.RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (dates != null && dates[0] != null && dates[1] != null) {
                    setDateRange([dates[0], dates[1]])
                  }
                }}
                format="DD.MM.YYYY"
                placeholder={['Начало', 'Конец']}
                style={{ width: 220, borderRadius: borderRadius.sm }}
              />
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
            <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <Button
                type="default"
                icon={<SyncOutlined />}
                loading={promotionSyncMutation.isPending}
                disabled={selectedCabinetId == null}
                onClick={() => promotionSyncMutation.mutate()}
                style={{ borderRadius: borderRadius.sm }}
              >
                Обновить все РК
              </Button>
            </div>
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
              {emptyStateMessage}
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 980 }}>
                <thead>
                  <tr style={{ backgroundColor: colors.bgGray }}>
                    <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.createdAt}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('createdAt')}>Дата создания <SortIcon field="createdAt" /></th>
                    <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.updatedAt}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('updatedAt')}>Дата обновления <SortIcon field="updatedAt" /></th>
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
                      <td style={{ width: `${COL_WIDTHS_PCT.updatedAt}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{formatCampaignDateTime(c.updatedAt)}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.name}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>
                        <Link to={`/advertising/campaigns/${c.id}`} style={{ fontWeight: 500, color: colors.primary, textDecoration: 'none' }}>{c.name}</Link>
                      </td>
                      <td style={{ width: `${COL_WIDTHS_PCT.id}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL, color: colors.textSecondary }}>
                        <Link to={`/advertising/campaigns/${c.id}`} style={{ color: colors.textSecondary, textDecoration: 'none' }}>{c.id}</Link>
                      </td>
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
