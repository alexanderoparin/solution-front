import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Spin, Input, Select, DatePicker, Button, Tooltip, message, Pagination } from 'antd'
import {
  SearchOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { useQuery, useMutation } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { cabinetsApi } from '../api/cabinets'
import type { Campaign } from '../types/analytics'
import { colors, typography, spacing, borderRadius, transitions, shadows } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import CampaignStatusFilterCheckboxes, {
  DEFAULT_CAMPAIGN_STATUS_FILTERS,
  type CampaignStatusFilter,
} from '../components/CampaignStatusFilterCheckboxes'
import { useWorkContextForAdmin } from '../hooks/useWorkContextForAdmin'
import { useStoredCabinet } from '../hooks/useStoredCabinet'
import { ONBOARDING_TARGETS } from '../onboarding/targets'

dayjs.locale('ru')

const FONT_PAGE_SMALL = { fontSize: '11px' as const }
const DEFAULT_PAGE_SIZE = 20
const PAGE_SIZE_OPTIONS = ['20', '50', '100']

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
  articlesCount: 7,
  status: 8,
  views: 6,
  clicks: 6,
  ctr: 5,
  cpc: 6,
  costs: 6,
  cart: 5,
  orders: 5,
} as const

export default function AdvertisingCampaigns() {
  const role = useAuthStore((state) => state.role)
  const isAdmin = role === 'ADMIN'
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filterStatus, setFilterStatus] = useState<CampaignStatusFilter[]>(DEFAULT_CAMPAIGN_STATUS_FILTERS)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(() => {
    const to = dayjs().subtract(1, 'day')
    return [to.subtract(13, 'day'), to]
  })

  const workContext = useWorkContextForAdmin(isAdmin)
  const selectedSellerId = isAdmin ? workContext.selectedSellerId : undefined

  const { data: myCabinets = [], isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'USER',
  })

  const cabinets = useMemo(() => {
    if (isAdmin) {
      return workContext.workContextOptions.map((o) => ({ id: o.cabinetId, name: o.cabinetName, marketplaceType: o.marketplaceType }))
    }
    return myCabinets
  }, [isAdmin, workContext.workContextOptions, myCabinets])

  const cabinetsLoadingState = isAdmin ? workContext.workContextLoading : cabinetsLoading

  const { cabinetId: sellerCabinetId, setCabinetId: setSellerCabinetId } = useStoredCabinet(myCabinets)

  const selectedCabinetId = isAdmin ? workContext.selectedCabinetId : sellerCabinetId

  const selectedCabinetMarketplace = useMemo(() => {
    const cab = cabinets.find((c) => c.id === selectedCabinetId)
    return cab?.marketplaceType ?? 'WB'
  }, [cabinets, selectedCabinetId])
  const isOzonCabinet = selectedCabinetMarketplace === 'OZON'

  const dateFromStr = dateRange[0].format('YYYY-MM-DD')
  const dateToStr = dateRange[1].format('YYYY-MM-DD')

  const promotionSyncMutation = useMutation({
    mutationFn: () =>
      analyticsApi.enqueuePromotionSync(
        isAdmin ? selectedSellerId ?? undefined : undefined,
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

  const { data: campaignsPage, isLoading: campaignsLoading, isError: campaignsError, error: campaignsErr } = useQuery({
    queryKey: [
      'advertising-campaigns-page',
      isAdmin ? selectedSellerId : null,
      selectedCabinetId,
      dateFromStr,
      dateToStr,
      page,
      pageSize,
      sortField,
      sortOrder,
      filterStatus,
      filterType,
      campaignSearchQuery,
    ],
    queryFn: () =>
      analyticsApi.getCampaignsPage({
        sellerId: isAdmin ? selectedSellerId ?? undefined : undefined,
        cabinetId: selectedCabinetId ?? undefined,
        dateFrom: dateFromStr,
        dateTo: dateToStr,
        page: page - 1,
        size: pageSize,
        sortBy: sortField,
        sortDir: sortOrder,
        search: campaignSearchQuery,
        type: filterType,
        statuses: filterStatus,
      }),
    enabled: selectedCabinetId != null,
    placeholderData: (previous) => previous,
  })

  const campaigns = campaignsPage?.content ?? []
  const campaignsTotal = campaignsPage?.totalElements ?? 0
  const uniqueTypes = campaignsPage?.types ?? []

  const backendErrorMessage =
    (campaignsError && (campaignsErr as any)?.response?.data?.error) ||
    (campaignsError && (campaignsErr as any)?.response?.data?.message) ||
    null

  const emptyStateMessage =
    isAdmin && !workContext.workContextLoading && workContext.workContextOptions.length === 0
      ? 'Нет кабинетов с API-ключом'
      : isOzonCabinet
        ? 'Нет рекламных кампаний. Настройте Performance credentials и нажмите «Синхронизировать».'
        : backendErrorMessage ?? 'Нет рекламных кампаний за выбранный период'

  const setSelectedCabinetId = useCallback(
    (id: number | null) => {
      if (isAdmin) {
        if (id != null) workContext.applyWorkContextCabinet(id)
      } else {
        setSellerCabinetId(id)
      }
    },
    [isAdmin, workContext.applyWorkContextCabinet, setSellerCabinetId],
  )

  const cabinetSelectProps =
    !isAdmin && cabinets.length > 0
      ? {
          cabinets: cabinets.map((c) => ({ id: c.id, name: c.name, marketplaceType: c.marketplaceType })),
          selectedCabinetId,
          onCabinetChange: setSelectedCabinetId,
          loading: cabinetsLoadingState,
        }
      : undefined

  useEffect(() => {
    setPage(1)
  }, [
    selectedCabinetId,
    dateFromStr,
    dateToStr,
    filterStatus,
    filterType,
    campaignSearchQuery,
    sortField,
    sortOrder,
  ])

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
  const statusLabel = (c: Campaign) =>
    c.statusName ?? (c.status === 9 ? 'активна' : c.status === 7 ? 'завершена' : 'приостановлена')
  const statusBg = (c: Campaign) => {
    if (c.status === 9) return colors.success
    if (c.status === 7) return colors.textMuted
    return colors.warning
  }
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
        workContextCabinetSelect={isAdmin ? workContext.workContextCabinetSelectProps : undefined}
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
                data-tour-id={ONBOARDING_TARGETS.CAMPAIGNS_PERIOD}
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
              <CampaignStatusFilterCheckboxes value={filterStatus} onChange={setFilterStatus} />
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
              <Tooltip
                title="Обновление выполняется в фоновом режиме и может занять некоторое время."
              >
                <Button
                  type="default"
                  icon={<SyncOutlined />}
                  data-tour-id={ONBOARDING_TARGETS.CAMPAIGNS_REFRESH}
                  loading={promotionSyncMutation.isPending}
                  disabled={selectedCabinetId == null}
                  onClick={() => promotionSyncMutation.mutate()}
                  style={{ borderRadius: borderRadius.sm }}
                >
                  Обновить все РК
                </Button>
              </Tooltip>
            </div>
          </div>
          {campaignsLoading ? (
            <div style={{ textAlign: 'center', padding: spacing.xxl }}>
              <Spin />
            </div>
          ) : campaignsTotal === 0 ? (
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
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}>
              <p style={{ fontSize: 11, color: colors.textSecondary, margin: `0 0 ${spacing.sm}px 0` }}>
                {isOzonCabinet
                  ? 'Положили в корзину — по product-stats Ozon Performance; заказы и остальные метрики — дневная статистика по кампании.'
                  : 'Положили в корзину и заказали товаров — по рекламной статистике WB (fullstats) по артикулам РК.'}
              </p>
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
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.views}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('views')}>Просмотры <SortIcon field="views" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.clicks}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('clicks')}>Клики <SortIcon field="clicks" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.costs}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('costs')}>Затраты <SortIcon field="costs" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.cpc}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('cpc')}>CPC <SortIcon field="cpc" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.ctr}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('ctr')}>CTR <SortIcon field="ctr" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.cart}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('cart')}>Положили в корзину <SortIcon field="cart" /></th>
                    <th style={{ ...thStyle, textAlign: 'center', width: `${COL_WIDTHS_PCT.orders}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600, color: colors.textPrimary }} onClick={() => handleSort('orders')}>Заказали товаров <SortIcon field="orders" /></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, idx) => (
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
                        <Link
                          to={`/advertising/campaigns/${c.id}`}
                          data-tour-id={idx === 0 ? ONBOARDING_TARGETS.CAMPAIGNS_NAME : undefined}
                          style={{ fontWeight: 500, color: colors.primary, textDecoration: 'none' }}
                        >
                          {c.name}
                        </Link>
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
                      <td style={{ width: `${COL_WIDTHS_PCT.costs}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{c.costs != null ? formatCur(c.costs) : '-'}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.cpc}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{c.cpc != null ? formatCur(c.cpc) : '-'}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.ctr}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{c.ctr != null ? formatPct(c.ctr) : '-'}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.cart}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{formatNum(c.cart)}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.orders}%`, textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...typography.body, ...FONT_PAGE_SMALL }}>{formatNum(c.orders)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingTop: spacing.md,
                  flexShrink: 0,
                }}
              >
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={campaignsTotal}
                  showSizeChanger
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  showTotal={(total, range) => `${range[0]}–${range[1]} из ${total}`}
                  locale={{ items_per_page: '/ стр.' }}
                  onChange={(nextPage, nextSize) => {
                    if (nextSize !== pageSize) {
                      setPageSize(nextSize)
                      setPage(1)
                      return
                    }
                    setPage(nextPage)
                  }}
                />
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  )
}
