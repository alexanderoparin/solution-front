import { useState, useMemo, useCallback, useEffect, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Spin, Input, Select, DatePicker, message } from 'antd'
import { SearchOutlined, CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

type SortField = 'createdAt' | 'updatedAt' | 'name' | 'id' | 'type' | 'articlesCount' | 'status'
type SortOrder = 'asc' | 'desc'

const FINISHED_STATUS = 7

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

const tdOverflowStyle = { overflow: 'hidden', wordBreak: 'break-word' as const, boxSizing: 'border-box' as const }

const COL_WIDTHS_PCT = {
  createdAt: 12,
  updatedAt: 12,
  name: 22,
  id: 10,
  type: 14,
  articlesCount: 12,
  status: 18,
} as const

/** Фиксированные ширины и единый вид блока статуса (как плашка «Работает»). */
const STATUS_BADGE_WIDTH = 118
const STATUS_ACTION_WIDTH = 86
const STATUS_CHIP_HEIGHT = 24

const statusChipStyle = (width: number): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width,
  minWidth: width,
  height: STATUS_CHIP_HEIGHT,
  padding: '0 8px',
  borderRadius: borderRadius.sm,
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: `${STATUS_CHIP_HEIGHT}px`,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  flexShrink: 0,
  fontFamily: 'inherit',
})

function formatControlError(err: unknown): string {
  const ax = err as {
    response?: { status?: number; data?: { message?: string; error?: string; nextAvailableInSeconds?: number } }
  }
  if (ax.response?.status === 429) {
    const data = ax.response.data
    if (data?.message) return data.message
    const sec = data?.nextAvailableInSeconds
    if (sec != null) {
      if (sec >= 60) {
        return `Превышен лимит запросов к WB API. Повторите примерно через ${Math.ceil(sec / 60)} мин.`
      }
      return `Превышен лимит запросов к WB API. Повторите через ${sec} сек.`
    }
  }
  return ax.response?.data?.error || ax.response?.data?.message || 'Не удалось выполнить действие'
}

export default function BidderCampaigns() {
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const isManagerOrAdmin = role === 'ADMIN' || role === 'MANAGER'
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused'>('all')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [pollUntil, setPollUntil] = useState<number | null>(null)
  const [loadingAdvertId, setLoadingAdvertId] = useState<number | null>(null)

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

  const queryKey = ['bidder-campaigns', isManagerOrAdmin ? selectedSellerId : null, selectedCabinetId, dateFromStr, dateToStr] as const

  const { data: campaignsRaw = [], isLoading: campaignsLoading, isError: campaignsError, error: campaignsErr } = useQuery({
    queryKey,
    queryFn: () =>
      analyticsApi.getCampaigns(
        isManagerOrAdmin ? selectedSellerId ?? undefined : undefined,
        selectedCabinetId ?? undefined,
        dateFromStr,
        dateToStr
      ),
    enabled: selectedCabinetId != null,
    refetchInterval: pollUntil != null && Date.now() < pollUntil ? 2000 : false,
  })

  const campaigns = useMemo(
    () => campaignsRaw.filter((c) => c.status !== FINISHED_STATUS),
    [campaignsRaw]
  )

  const startMutation = useMutation({
    mutationFn: (advertId: number) =>
      analyticsApi.startCampaign(
        advertId,
        isManagerOrAdmin ? selectedSellerId ?? undefined : undefined,
        selectedCabinetId ?? undefined
      ),
    onMutate: (advertId) => setLoadingAdvertId(advertId),
    onSettled: () => setLoadingAdvertId(null),
    onSuccess: (data) => {
      if (data.enqueued) {
        message.success(data.message ?? 'Запуск поставлен в очередь')
        setPollUntil(Date.now() + 30_000)
        void queryClient.invalidateQueries({ queryKey })
      } else {
        message.info(data.message ?? 'Запуск уже в очереди')
      }
    },
    onError: (err) => message.error(formatControlError(err)),
  })

  const pauseMutation = useMutation({
    mutationFn: (advertId: number) =>
      analyticsApi.pauseCampaign(
        advertId,
        isManagerOrAdmin ? selectedSellerId ?? undefined : undefined,
        selectedCabinetId ?? undefined
      ),
    onMutate: (advertId) => setLoadingAdvertId(advertId),
    onSettled: () => setLoadingAdvertId(null),
    onSuccess: (data) => {
      if (data.enqueued) {
        message.success(data.message ?? 'Пауза поставлена в очередь')
        setPollUntil(Date.now() + 30_000)
        void queryClient.invalidateQueries({ queryKey })
      } else {
        message.info(data.message ?? 'Пауза уже в очереди')
      }
    },
    onError: (err) => message.error(formatControlError(err)),
  })

  const backendErrorMessage =
    (campaignsError && (campaignsErr as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error) ||
    (campaignsError && (campaignsErr as { response?: { data?: { message?: string } } })?.response?.data?.message) ||
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
    [isManagerOrAdmin, workContext.applyWorkContextCabinet]
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
      let aVal: string | number
      let bVal: string | number
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

  const formatCampaignDate = (dateStr: string) => (dateStr ? dayjs(dateStr).format('DD.MM.YYYY') : '-')
  const formatCampaignDateTime = (dateStr: string | null | undefined) =>
    dateStr ? dayjs(dateStr).format('DD.MM.YYYY HH:mm') : '-'
  const formatNum = (v: number | null | undefined) => (v == null ? '-' : v.toLocaleString('ru-RU'))

  const isActive = (c: Campaign) => c.status === 9
  const canStart = (c: Campaign) => c.status === 4 || c.status === 11
  const canPause = (c: Campaign) => c.status === 9

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

  const renderStatusCell = (c: Campaign) => {
    const active = isActive(c)
    const rowLoading = loadingAdvertId === c.id
    const actionBusy = rowLoading && (pauseMutation.isPending || startMutation.isPending)

    const badgeStyle: CSSProperties = {
      ...statusChipStyle(STATUS_BADGE_WIDTH),
      backgroundColor: active ? '#16a34a' : '#94a3b8',
      color: '#fff',
    }

    const actionButtonStyle = (bg: string, disabled: boolean): CSSProperties => ({
      ...statusChipStyle(STATUS_ACTION_WIDTH),
      backgroundColor: bg,
      color: '#fff',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.65 : 1,
    })

    return (
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          <span style={badgeStyle}>{active ? '▷ Работает' : 'II Остановлена'}</span>
          {canPause(c) ? (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => pauseMutation.mutate(c.id)}
              style={actionButtonStyle(colors.warning, actionBusy)}
            >
              II Пауза
            </button>
          ) : canStart(c) ? (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => startMutation.mutate(c.id)}
              style={actionButtonStyle(colors.primary, actionBusy)}
            >
              ▷ Запуск
            </button>
          ) : (
            <span
              style={{ ...statusChipStyle(STATUS_ACTION_WIDTH), visibility: 'hidden' }}
              aria-hidden
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Header
        workContextCabinetSelect={isManagerOrAdmin ? workContext.workContextCabinetSelectProps : undefined}
        cabinetSelectProps={cabinetSelectProps}
      />
      <Breadcrumbs />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
                  { value: 'active', label: 'Работает' },
                  { value: 'paused', label: 'Остановлена' },
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
                {emptyStateMessage}
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto', width: '100%' }}>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 900 }}>
                    <thead>
                      <tr style={{ backgroundColor: colors.bgGray }}>
                        <th
                          style={{ ...thStyle, width: `${COL_WIDTHS_PCT.createdAt}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600 }}
                          onClick={() => handleSort('createdAt')}
                        >
                          Дата создания <SortIcon field="createdAt" />
                        </th>
                        <th
                          style={{ ...thStyle, width: `${COL_WIDTHS_PCT.updatedAt}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600 }}
                          onClick={() => handleSort('updatedAt')}
                        >
                          Дата обновления <SortIcon field="updatedAt" />
                        </th>
                        <th
                          style={{ ...thStyle, width: `${COL_WIDTHS_PCT.name}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600 }}
                          onClick={() => handleSort('name')}
                        >
                          Кампания <SortIcon field="name" />
                        </th>
                        <th
                          style={{ ...thStyle, width: `${COL_WIDTHS_PCT.id}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600 }}
                          onClick={() => handleSort('id')}
                        >
                          ID <SortIcon field="id" />
                        </th>
                        <th
                          style={{ ...thStyle, width: `${COL_WIDTHS_PCT.type}%`, ...typography.body, ...FONT_PAGE_SMALL, fontWeight: 600 }}
                          onClick={() => handleSort('type')}
                        >
                          Тип <SortIcon field="type" />
                        </th>
                        <th
                          style={{
                            ...thStyle,
                            textAlign: 'center',
                            width: `${COL_WIDTHS_PCT.articlesCount}%`,
                            ...typography.body,
                            ...FONT_PAGE_SMALL,
                            fontWeight: 600,
                          }}
                          onClick={() => handleSort('articlesCount')}
                        >
                          Количество артикулов <SortIcon field="articlesCount" />
                        </th>
                        <th
                          style={{
                            ...thStyle,
                            textAlign: 'center',
                            width: `${COL_WIDTHS_PCT.status}%`,
                            ...typography.body,
                            ...FONT_PAGE_SMALL,
                            fontWeight: 600,
                          }}
                          onClick={() => handleSort('status')}
                        >
                          Статус <SortIcon field="status" />
                        </th>
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
                        >
                          <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT_PAGE_SMALL }}>
                            {formatCampaignDate(c.createdAt)}
                          </td>
                          <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT_PAGE_SMALL }}>
                            {formatCampaignDateTime(c.updatedAt)}
                          </td>
                          <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT_PAGE_SMALL }}>
                            <Link to={`/advertising/campaigns/${c.id}`} style={{ fontWeight: 500, color: colors.primary, textDecoration: 'none' }}>
                              {c.name}
                            </Link>
                          </td>
                          <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT_PAGE_SMALL, color: colors.textSecondary }}>
                            <Link to={`/advertising/campaigns/${c.id}`} style={{ color: colors.textSecondary, textDecoration: 'none' }}>
                              {c.id}
                            </Link>
                          </td>
                          <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT_PAGE_SMALL }}>
                            {c.type || '-'}
                          </td>
                          <td style={{ textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...FONT_PAGE_SMALL }}>
                            {formatNum(c.articlesCount)}
                          </td>
                          <td style={{ textAlign: 'center', padding: '8px 10px', borderBottom: `1px solid ${colors.border}` }}>
                            {renderStatusCell(c)}
                          </td>
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
