import { useState, useMemo, useCallback, useEffect, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Spin, Input, Select, DatePicker, message, Alert, Switch } from 'antd'
import { SearchOutlined, CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'
import { campaignManageApi } from '../api/campaignManage'
import { cabinetsApi, getStoredCabinetId, setStoredCabinetId } from '../api/cabinets'
import type { Campaign } from '../types/analytics'
import { colors, typography, spacing, borderRadius, transitions, shadows } from '../styles/analytics'
import { useAuthStore } from '../store/authStore'
import Header from '../components/Header'
import Breadcrumbs from '../components/Breadcrumbs'
import { useWorkContextForAdmin } from '../hooks/useWorkContextForAdmin'
import { useCampaignManagePaywall } from '../hooks/useCampaignManagePaywall'
import { bidderStatusColor, bidderStatusIcon, bidderStatusLabel, parseBidderStatus } from '../utils/bidderStatus'

type BidderStatusFilter = 'all' | 'running' | 'waiting' | 'off'

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

/** Фиксированные ширины и единый вид блока статуса. */
const STATUS_BADGE_WIDTH = 128
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
  if (ax.response?.status === 429 || ax.response?.status === 403) {
    const data = ax.response.data
    if (data?.message) return data.message
    const sec = data?.nextAvailableInSeconds
    if (sec != null && sec > 0) {
      if (sec >= 60) {
        return `Повторите примерно через ${Math.ceil(sec / 60)} мин.`
      }
      return `Повторите через ${sec} сек.`
    }
  }
  return ax.response?.data?.error || ax.response?.data?.message || 'Не удалось выполнить действие'
}

function formatRetryHint(seconds: number): string {
  if (seconds >= 60) {
    return `Повторная попытка примерно через ${Math.ceil(seconds / 60)} мин.`
  }
  return `Повторная попытка через ${seconds} сек.`
}

export default function BidderCampaigns() {
  const queryClient = useQueryClient()
  const role = useAuthStore((state) => state.role)
  const isAdmin = role === 'ADMIN'
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filterStatus, setFilterStatus] = useState<BidderStatusFilter>('all')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [pollUntil, setPollUntil] = useState<number | null>(null)
  const [loadingAdvertId, setLoadingAdvertId] = useState<number | null>(null)

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(() => {
    const to = dayjs().subtract(1, 'day')
    return [to.subtract(13, 'day'), to]
  })

  const workContext = useWorkContextForAdmin(isAdmin)
  const selectedSellerId = isAdmin ? workContext.selectedSellerId : undefined
  const { guardAction, guardClick } = useCampaignManagePaywall(selectedSellerId)

  const { data: myCabinets = [], isLoading: cabinetsLoading } = useQuery({
    queryKey: ['cabinets'],
    queryFn: () => cabinetsApi.list(),
    enabled: role === 'USER',
  })

  const cabinets = useMemo(() => {
    if (isAdmin) {
      return workContext.workContextOptions.map((o) => ({ id: o.cabinetId, name: o.cabinetName }))
    }
    return myCabinets
  }, [isAdmin, workContext.workContextOptions, myCabinets])

  const cabinetsLoadingState = isAdmin ? workContext.workContextLoading : cabinetsLoading

  const [sellerSelectedCabinetId, setSellerSelectedCabinetId] = useState<number | null>(() => getStoredCabinetId())

  const selectedCabinetId = isAdmin ? workContext.selectedCabinetId : sellerSelectedCabinetId

  const dateFromStr = dateRange[0].format('YYYY-MM-DD')
  const dateToStr = dateRange[1].format('YYYY-MM-DD')

  const queryKey = ['bidder-campaigns', isAdmin ? selectedSellerId : null, selectedCabinetId, dateFromStr, dateToStr] as const
  const capabilitiesQueryKey = [
    'bidder-control-capabilities',
    isAdmin ? selectedSellerId : null,
    selectedCabinetId,
  ] as const

  const { data: controlCapabilities, refetch: refetchCapabilities } = useQuery({
    queryKey: capabilitiesQueryKey,
    queryFn: () =>
      analyticsApi.getPromotionControlCapabilities(
        isAdmin ? selectedSellerId ?? undefined : undefined,
        selectedCabinetId ?? undefined
      ),
    enabled: selectedCabinetId != null,
    refetchInterval: (query) => {
      const caps = query.state.data
      if (caps != null && !caps.canControl && caps.nextAvailableInSeconds > 0) {
        return 30_000
      }
      return false
    },
  })

  const controlBlocked = controlCapabilities != null && !controlCapabilities.canControl

  const { data: campaignsRaw = [], isLoading: campaignsLoading, isError: campaignsError, error: campaignsErr } = useQuery({
    queryKey,
    queryFn: () =>
      analyticsApi.getCampaigns(
        isAdmin ? selectedSellerId ?? undefined : undefined,
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

  const patchCampaignScheduleInCache = useCallback(
    (advertId: number, enabled: boolean) => {
      queryClient.setQueryData<Campaign[]>(queryKey, (old) =>
        old?.map((c) => {
          if (c.id !== advertId) return c
          if (!enabled) {
            return { ...c, bidderStatus: 'OFF' }
          }
          const status = parseBidderStatus(c.bidderStatus)
          if (status === 'OFF' || status === null) {
            return { ...c, bidderStatus: 'WAITING' }
          }
          return c
        }),
      )
    },
    [queryClient, queryKey],
  )

  const startMutation = useMutation({
    mutationFn: (advertId: number) =>
      campaignManageApi.start(
        advertId,
        isAdmin ? selectedSellerId ?? undefined : undefined,
        selectedCabinetId ?? undefined
      ),
    onMutate: async (advertId) => {
      setLoadingAdvertId(advertId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Campaign[]>(queryKey)
      patchCampaignScheduleInCache(advertId, true)
      return { previous }
    },
    onSettled: () => setLoadingAdvertId(null),
    onSuccess: (data) => {
      message.success(data.message ?? 'Расписание включено')
      if (data.enqueued) {
        setPollUntil(Date.now() + 30_000)
      }
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (err, _advertId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      message.error(formatControlError(err))
      void refetchCapabilities()
    },
  })

  const pauseMutation = useMutation({
    mutationFn: (advertId: number) =>
      campaignManageApi.pause(
        advertId,
        isAdmin ? selectedSellerId ?? undefined : undefined,
        selectedCabinetId ?? undefined
      ),
    onMutate: async (advertId) => {
      setLoadingAdvertId(advertId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Campaign[]>(queryKey)
      patchCampaignScheduleInCache(advertId, false)
      return { previous }
    },
    onSettled: () => setLoadingAdvertId(null),
    onSuccess: (data) => {
      message.success(data.message ?? 'Расписание выключено')
      if (data.enqueued) {
        setPollUntil(Date.now() + 30_000)
      }
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (err, _advertId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
      message.error(formatControlError(err))
      void refetchCapabilities()
    },
  })

  const backendErrorMessage =
    (campaignsError && (campaignsErr as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error) ||
    (campaignsError && (campaignsErr as { response?: { data?: { message?: string } } })?.response?.data?.message) ||
    null

  const emptyStateMessage =
    isAdmin && !workContext.workContextLoading && workContext.workContextOptions.length === 0
      ? 'Нет кабинетов с API-ключом'
      : backendErrorMessage ?? 'Нет рекламных кампаний за выбранный период'

  const setSelectedCabinetId = useCallback(
    (id: number | null) => {
      if (isAdmin) {
        if (id != null) workContext.applyWorkContextCabinet(id)
      } else {
        setSellerSelectedCabinetId(id)
        setStoredCabinetId(id)
      }
    },
    [isAdmin, workContext.applyWorkContextCabinet]
  )

  useEffect(() => {
    if (!isAdmin) {
      setSellerSelectedCabinetId(getStoredCabinetId())
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) return
    if (myCabinets.length > 0 && sellerSelectedCabinetId === null) {
      const first = myCabinets[0].id
      setSellerSelectedCabinetId(first)
      setStoredCabinetId(first)
    }
  }, [isAdmin, myCabinets, sellerSelectedCabinetId])

  const cabinetSelectProps =
    !isAdmin && cabinets.length > 0
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
    if (filterStatus === 'running') list = list.filter((c) => parseBidderStatus(c.bidderStatus) === 'RUNNING')
    else if (filterStatus === 'waiting') list = list.filter((c) => parseBidderStatus(c.bidderStatus) === 'WAITING')
    else if (filterStatus === 'off') list = list.filter((c) => parseBidderStatus(c.bidderStatus) === 'OFF')
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
          aVal = a.bidderStatus ?? ''
          bVal = b.bidderStatus ?? ''
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

  const isScheduleEnabled = (c: Campaign) => {
    const status = parseBidderStatus(c.bidderStatus)
    return status != null && status !== 'OFF'
  }

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
    const rowLoading = loadingAdvertId === c.id
    const actionBusy = rowLoading && (pauseMutation.isPending || startMutation.isPending)
    const actionsDisabled = actionBusy

    const badgeStyle: CSSProperties = {
      ...statusChipStyle(STATUS_BADGE_WIDTH),
      backgroundColor: bidderStatusColor(c.bidderStatus),
      color: '#fff',
    }

    const scheduleOn = isScheduleEnabled(c)

    return (
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          <span style={badgeStyle}>
            {bidderStatusIcon(c.bidderStatus)}
            {bidderStatusLabel(c.bidderStatus)}
          </span>
          <Switch
            size="small"
            checked={scheduleOn}
            loading={rowLoading && actionBusy}
            disabled={actionsDisabled}
            title={scheduleOn ? 'Выключить расписание' : 'Включить расписание'}
            onChange={(checked) =>
              guardAction(() => {
                if (checked) {
                  startMutation.mutate(c.id)
                } else {
                  pauseMutation.mutate(c.id)
                }
              })
            }
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <Header
        workContextCabinetSelect={isAdmin ? workContext.workContextCabinetSelectProps : undefined}
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
                  { value: 'running', label: 'Работает' },
                  { value: 'waiting', label: 'Ожидает слот' },
                  { value: 'off', label: 'Выкл' },
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

            {controlBlocked && controlCapabilities?.message && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: spacing.md }}
                message="Управление РК недоступно"
                description={
                  <>
                    <div>{controlCapabilities.message}</div>
                    {controlCapabilities.nextAvailableInSeconds > 0 && (
                      <div style={{ marginTop: 6 }}>{formatRetryHint(controlCapabilities.nextAvailableInSeconds)}</div>
                    )}
                  </>
                }
              />
            )}

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
                            <Link
                              to={`/advertising/campaigns/${c.id}/manage`}
                              onClick={guardClick}
                              style={{ fontWeight: 500, color: colors.primary, textDecoration: 'none' }}
                            >
                              {c.name}
                            </Link>
                          </td>
                          <td style={{ padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT_PAGE_SMALL, color: colors.textSecondary }}>
                            <Link
                              to={`/advertising/campaigns/${c.id}/manage`}
                              onClick={guardClick}
                              style={{ color: colors.textSecondary, textDecoration: 'none' }}
                            >
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
