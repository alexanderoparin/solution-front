import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, DatePicker, Input, Select } from 'antd'
import { SearchOutlined, SyncOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { ONBOARDING_DEMO_CAMPAIGN_PATH } from '../../../onboarding/demoPaths'
import {
  DEMO_CAMPAIGNS,
  DEMO_CAMPAIGN_WB_ID,
  type DemoCampaignStatus,
} from '../../../onboarding/demoConstants'
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../../../styles/analytics'
import { demoPageWrap } from './demoUi'
import CampaignStatusFilterCheckboxes, {
  ALL_CAMPAIGN_STATUS_FILTERS,
  type CampaignStatusFilter,
} from '../../CampaignStatusFilterCheckboxes'

const FONT = { fontSize: 11 as const }
const DATE_TO = dayjs().subtract(1, 'day')
const DATE_FROM = DATE_TO.subtract(13, 'day')

const STATUS_LABEL: Record<DemoCampaignStatus, string> = {
  active: 'Активна',
  paused: 'Приостановлена',
  finished: 'Завершена',
}

const STATUS_BG: Record<DemoCampaignStatus, string> = {
  active: colors.success,
  paused: colors.warning,
  finished: colors.textMuted,
}

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
  costs: 6,
  cpc: 6,
  ctr: 5,
  cart: 5,
  orders: 5,
} as const

const thStyle = {
  textAlign: 'left' as const,
  padding: '8px 10px',
  borderBottom: `2px solid ${colors.border}`,
  overflow: 'hidden',
  wordBreak: 'break-word' as const,
  whiteSpace: 'normal' as const,
  boxSizing: 'border-box' as const,
}

const tdOverflowStyle = { overflow: 'hidden', wordBreak: 'break-word' as const, boxSizing: 'border-box' as const }

function formatNum(value: number): string {
  return value.toLocaleString('ru-RU')
}

function formatPct(value: number): string {
  return `${value.toFixed(2)}%`
}

function formatCur(value: number): string {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const HEADERS: { key: keyof typeof COL_WIDTHS_PCT; label: string; center?: boolean }[] = [
  { key: 'createdAt', label: 'Дата создания' },
  { key: 'updatedAt', label: 'Дата обновления' },
  { key: 'name', label: 'Кампания' },
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Тип' },
  { key: 'articlesCount', label: 'Количество артикулов', center: true },
  { key: 'status', label: 'Статус', center: true },
  { key: 'views', label: 'Просмотры', center: true },
  { key: 'clicks', label: 'Клики', center: true },
  { key: 'costs', label: 'Затраты', center: true },
  { key: 'cpc', label: 'CPC', center: true },
  { key: 'ctr', label: 'CTR', center: true },
  { key: 'cart', label: 'Положили в корзину', center: true },
  { key: 'orders', label: 'Заказали товаров', center: true },
]

/**
 * Учебный список РК: обновление, период, статусы и переход в деталку.
 */
export default function DemoAdvertisingCampaigns() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<CampaignStatusFilter[]>([...ALL_CAMPAIGN_STATUS_FILTERS])
  const [filterType, setFilterType] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const uniqueTypes = useMemo(
    () => [...new Set(DEMO_CAMPAIGNS.map((campaign) => campaign.type))].sort((a, b) => a.localeCompare(b, 'ru')),
    [],
  )

  const filteredCampaigns = useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase()
    return DEMO_CAMPAIGNS.filter((campaign) => {
      if (!filterStatus.includes(campaign.status)) {
        return false
      }
      if (filterType != null && campaign.type !== filterType) {
        return false
      }
      if (searchLower.length === 0) {
        return true
      }
      return campaign.name.toLowerCase().includes(searchLower) || campaign.id.includes(searchLower)
    })
  }, [filterStatus, filterType, searchQuery])

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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center', marginBottom: spacing.md }}>
          <DatePicker.RangePicker
            data-tour-id={ONBOARDING_TARGETS.CAMPAIGNS_PERIOD}
            defaultValue={[DATE_FROM, DATE_TO]}
            format="DD.MM.YYYY"
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
          <CampaignStatusFilterCheckboxes value={filterStatus} onChange={setFilterStatus} />
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
          <div style={{ marginLeft: 'auto' }}>
            <Button type="default" icon={<SyncOutlined />} data-tour-id={ONBOARDING_TARGETS.CAMPAIGNS_REFRESH} style={{ borderRadius: borderRadius.sm }}>
              Обновить все РК
            </Button>
          </div>
        </div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: `0 0 ${spacing.sm} 0` }}>
          Положили в корзину и заказали товаров — по рекламной статистике WB (fullstats) по артикулам РК.
        </p>
        {filteredCampaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing.xxl, ...typography.body, color: colors.textSecondary }}>
            Нет рекламных кампаний за выбранный период
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980, tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: colors.bgGray }}>
                  {HEADERS.map((column) => (
                    <th
                      key={column.key}
                      style={{
                        ...thStyle,
                        width: `${COL_WIDTHS_PCT[column.key]}%`,
                        textAlign: column.center ? 'center' : 'left',
                        ...typography.body,
                        ...FONT,
                        fontWeight: 600,
                        color: colors.textPrimary,
                      }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((row, idx) => (
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
                        to={ONBOARDING_DEMO_CAMPAIGN_PATH}
                        data-tour-id={row.id === DEMO_CAMPAIGN_WB_ID ? ONBOARDING_TARGETS.CAMPAIGNS_NAME : undefined}
                        style={{ fontWeight: 500, color: colors.primary, textDecoration: 'none' }}
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td style={{ width: `${COL_WIDTHS_PCT.id}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT, color: colors.textSecondary }}>{row.id}</td>
                    <td style={{ width: `${COL_WIDTHS_PCT.type}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT }}>{row.type}</td>
                    <td style={{ width: `${COL_WIDTHS_PCT.articlesCount}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT, textAlign: 'center' }}>{formatNum(row.articlesCount)}</td>
                    <td style={{ width: `${COL_WIDTHS_PCT.status}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: borderRadius.sm,
                          backgroundColor: STATUS_BG[row.status],
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td style={{ width: `${COL_WIDTHS_PCT.views}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT, textAlign: 'center' }}>{formatNum(row.views)}</td>
                    <td style={{ width: `${COL_WIDTHS_PCT.clicks}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT, textAlign: 'center' }}>{formatNum(row.clicks)}</td>
                    <td style={{ width: `${COL_WIDTHS_PCT.costs}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT, textAlign: 'center' }}>{formatCur(row.costs)}</td>
                    <td style={{ width: `${COL_WIDTHS_PCT.cpc}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT, textAlign: 'center' }}>{formatCur(row.cpc)}</td>
                    <td style={{ width: `${COL_WIDTHS_PCT.ctr}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT, textAlign: 'center' }}>{formatPct(row.ctr)}</td>
                    <td style={{ width: `${COL_WIDTHS_PCT.cart}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT, textAlign: 'center' }}>{formatNum(row.cart)}</td>
                    <td style={{ width: `${COL_WIDTHS_PCT.orders}%`, padding: '6px 10px', borderBottom: `1px solid ${colors.border}`, ...tdOverflowStyle, ...FONT, textAlign: 'center' }}>{formatNum(row.orders)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
