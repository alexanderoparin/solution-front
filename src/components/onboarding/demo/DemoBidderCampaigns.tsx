import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { DatePicker, Input, Select, Switch } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { ONBOARDING_DEMO_MANAGE_PATH } from '../../../onboarding/demoPaths'
import {
  DEMO_CAMPAIGNS,
  DEMO_CAMPAIGN_WB_ID,
  type DemoCampaignRow,
} from '../../../onboarding/demoConstants'
import {
  bidderStatusColor,
  bidderStatusIcon,
  bidderStatusLabel,
  type BidderStatus,
} from '../../../utils/bidderStatus'
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../../../styles/analytics'
import { demoPageWrap } from './demoUi'

const FONT = { fontSize: 11 as const }
const DATE_TO = dayjs().subtract(1, 'day')
const DATE_FROM = DATE_TO.subtract(13, 'day')

type BidderStatusFilter = 'all' | 'running' | 'waiting' | 'off'

const COL_WIDTHS_PCT = {
  createdAt: 12,
  updatedAt: 12,
  name: 22,
  id: 10,
  type: 14,
  articlesCount: 12,
  status: 18,
} as const

const STATUS_BADGE_WIDTH = 128
const STATUS_CHIP_HEIGHT = 24

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: `2px solid ${colors.border}`,
  overflow: 'hidden',
  wordBreak: 'break-word',
  whiteSpace: 'normal',
  boxSizing: 'border-box',
}

const tdOverflowStyle: CSSProperties = {
  overflow: 'hidden',
  wordBreak: 'break-word',
  boxSizing: 'border-box',
}

const statusChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: STATUS_BADGE_WIDTH,
  minWidth: STATUS_BADGE_WIDTH,
  height: STATUS_CHIP_HEIGHT,
  padding: '0 8px',
  borderRadius: borderRadius.sm,
  fontSize: 11,
  fontWeight: 600,
  lineHeight: `${STATUS_CHIP_HEIGHT}px`,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  flexShrink: 0,
  color: '#fff',
}

/** Учебный статус автозапуска: без завершённых РК, статусы вперемешку. */
const DEMO_BIDDER_STATUS: Record<string, BidderStatus> = {
  '89012345': 'RUNNING',
  [DEMO_CAMPAIGN_WB_ID]: 'RUNNING',
  '45678901': 'OFF',
  '23456789': 'SLOT_LIMIT',
  '12345678': 'OFF',
  '34567890': 'WAITING',
}

function isScheduleEnabled(status: BidderStatus): boolean {
  return status !== 'OFF'
}

/**
 * Учебный список управления РК: фильтры, статус автозапуска и переход в настройки.
 */
export default function DemoBidderCampaigns() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<BidderStatusFilter>('all')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [bidderById, setBidderById] = useState<Record<string, BidderStatus>>(() => ({ ...DEMO_BIDDER_STATUS }))

  const campaigns = useMemo(
    () => DEMO_CAMPAIGNS.filter((campaign) => campaign.status !== 'finished'),
    [],
  )

  const uniqueTypes = useMemo(
    () => [...new Set(campaigns.map((campaign) => campaign.type))].sort((a, b) => a.localeCompare(b, 'ru')),
    [campaigns],
  )

  const filteredCampaigns = useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase()
    return campaigns.filter((campaign) => {
      const bidderStatus = bidderById[campaign.id] ?? 'OFF'
      if (filterStatus === 'running' && bidderStatus !== 'RUNNING') {
        return false
      }
      if (filterStatus === 'waiting' && bidderStatus !== 'WAITING') {
        return false
      }
      if (filterStatus === 'off' && bidderStatus !== 'OFF') {
        return false
      }
      if (filterType != null && campaign.type !== filterType) {
        return false
      }
      if (searchLower.length === 0) {
        return true
      }
      return campaign.name.toLowerCase().includes(searchLower) || campaign.id.includes(searchQuery.trim())
    })
  }, [bidderById, campaigns, filterStatus, filterType, searchQuery])

  const toggleSchedule = (campaign: DemoCampaignRow, enabled: boolean) => {
    setBidderById((prev) => ({
      ...prev,
      [campaign.id]: enabled ? 'WAITING' : 'OFF',
    }))
  }

  return (
    <div style={{ ...demoPageWrap, padding: 0, backgroundColor: colors.bgGray }}>
      <div
        style={{
          backgroundColor: colors.bgWhite,
          borderTop: `1px solid ${colors.borderLight}`,
          borderBottom: `1px solid ${colors.borderLight}`,
          padding: spacing.lg,
          boxShadow: shadows.md,
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
          <DatePicker.RangePicker
            defaultValue={[DATE_FROM, DATE_TO]}
            format="DD.MM.YYYY"
            placeholder={['Начало', 'Конец']}
            style={{ width: 220, borderRadius: borderRadius.sm }}
          />
          <Input
            placeholder="Поиск по ID кампании или названию"
            prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
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
            onChange={(value) => setFilterType(value === '' || value == null ? null : value)}
            options={[
              { value: '', label: 'Все типы' },
              ...uniqueTypes.map((type) => ({ value: type, label: type })),
            ]}
            style={{ minWidth: 160, borderRadius: borderRadius.sm }}
          />
        </div>
        {filteredCampaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing.xxl, ...typography.body, color: colors.textSecondary }}>
            Нет рекламных кампаний за выбранный период
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900, tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: colors.bgGray }}>
                  <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.createdAt}%`, ...typography.body, ...FONT, fontWeight: 600 }}>Дата создания</th>
                  <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.updatedAt}%`, ...typography.body, ...FONT, fontWeight: 600 }}>Дата обновления</th>
                  <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.name}%`, ...typography.body, ...FONT, fontWeight: 600 }}>Кампания</th>
                  <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.id}%`, ...typography.body, ...FONT, fontWeight: 600 }}>ID</th>
                  <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.type}%`, ...typography.body, ...FONT, fontWeight: 600 }}>Тип</th>
                  <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.articlesCount}%`, textAlign: 'center', ...typography.body, ...FONT, fontWeight: 600 }}>Количество артикулов</th>
                  <th style={{ ...thStyle, width: `${COL_WIDTHS_PCT.status}%`, textAlign: 'center', ...typography.body, ...FONT, fontWeight: 600 }}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((row, idx) => {
                  const bidderStatus = bidderById[row.id] ?? 'OFF'
                  const isTourRow = row.id === DEMO_CAMPAIGN_WB_ID
                  return (
                    <tr
                      key={row.id}
                      style={{
                        backgroundColor:
                          hoveredId === row.id ? colors.bgGray : idx % 2 === 0 ? colors.bgWhite : colors.bgGrayLight,
                        transition: transitions.fast,
                      }}
                      onMouseEnter={() => setHoveredId(row.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <td style={{ width: `${COL_WIDTHS_PCT.createdAt}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT }}>{row.createdAt}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.updatedAt}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT }}>{row.updatedAt}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.name}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT }}>
                        <Link
                          to={ONBOARDING_DEMO_MANAGE_PATH}
                          data-tour-id={isTourRow ? ONBOARDING_TARGETS.BIDDER_CAMPAIGN_NAME : undefined}
                          style={{ fontWeight: 500, color: colors.primary, textDecoration: 'none' }}
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td style={{ width: `${COL_WIDTHS_PCT.id}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT, color: colors.textSecondary }}>{row.id}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.type}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT }}>{row.type}</td>
                      <td style={{ width: `${COL_WIDTHS_PCT.articlesCount}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT, textAlign: 'center' }}>{row.articlesCount}</td>
                      <td
                        data-tour-id={isTourRow ? ONBOARDING_TARGETS.BIDDER_STATUS : undefined}
                        style={{ width: `${COL_WIDTHS_PCT.status}%`, padding: '8px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, textAlign: 'center' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
                            <span style={{ ...statusChipStyle, backgroundColor: bidderStatusColor(bidderStatus) }}>
                              {bidderStatusIcon(bidderStatus)}
                              {bidderStatusLabel(bidderStatus)}
                            </span>
                            <Switch
                              size="small"
                              checked={isScheduleEnabled(bidderStatus)}
                              title={isScheduleEnabled(bidderStatus) ? 'Выключить расписание' : 'Включить расписание'}
                              onChange={(checked) => toggleSchedule(row, checked)}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
