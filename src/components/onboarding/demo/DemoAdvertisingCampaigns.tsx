import { Link } from 'react-router-dom'
import { Button, DatePicker, Input } from 'antd'
import { SearchOutlined, SyncOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { ONBOARDING_DEMO_CAMPAIGN_PATH } from '../../../onboarding/demoPaths'
import { DEMO_CAMPAIGN_NAME, DEMO_CAMPAIGN_TYPE, DEMO_CAMPAIGN_WB_ID, DEMO_CAMPAIGN_WB_ID_SECOND } from '../../../onboarding/demoConstants'
import { colors, typography, spacing, borderRadius, shadows } from '../../../styles/analytics'
import { demoPageWrap } from './demoUi'
import CampaignStatusFilterCheckboxes, {
  DEFAULT_CAMPAIGN_STATUS_FILTERS,
} from '../../CampaignStatusFilterCheckboxes'

const FONT = { fontSize: 11 as const }
const DATE_TO = dayjs().subtract(1, 'day')
const DATE_FROM = DATE_TO.subtract(13, 'day')

const ROWS = [
  {
    createdAt: '12.03.2026',
    updatedAt: '01.09.2026 09:14',
    name: DEMO_CAMPAIGN_NAME,
    id: DEMO_CAMPAIGN_WB_ID,
    type: DEMO_CAMPAIGN_TYPE,
    articlesCount: 2,
    status: 'Активна',
    views: '48 210',
    clicks: '1 518',
    costs: '21 150 ₽',
    cpc: '13,93 ₽',
    ctr: '3,15%',
    cart: '214',
    orders: '96',
  },
  {
    createdAt: '04.02.2026',
    updatedAt: '28.08.2026 18:02',
    name: 'Пижама — авто',
    id: DEMO_CAMPAIGN_WB_ID_SECOND,
    type: 'Автоматическая',
    articlesCount: 2,
    status: 'Приостановлена',
    views: '12 400',
    clicks: '310',
    costs: '4 880 ₽',
    cpc: '15,74 ₽',
    ctr: '2,50%',
    cart: '41',
    orders: '18',
  },
]

const HEADERS = [
  'Дата создания',
  'Дата обновления',
  'Кампания',
  'ID',
  'Тип',
  'Количество артикулов',
  'Статус',
  'Просмотры',
  'Клики',
  'Затраты',
  'CPC',
  'CTR',
  'Положили в корзину',
  'Заказали товаров',
]

/**
 * Учебный список РК: обновление, период и переход в деталку.
 */
export default function DemoAdvertisingCampaigns() {
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
            style={{ maxWidth: 360, borderRadius: borderRadius.sm }}
          />
          <CampaignStatusFilterCheckboxes value={[...DEFAULT_CAMPAIGN_STATUS_FILTERS]} />
          <div style={{ marginLeft: 'auto' }}>
            <Button type="default" icon={<SyncOutlined />} data-tour-id={ONBOARDING_TARGETS.CAMPAIGNS_REFRESH} style={{ borderRadius: borderRadius.sm }}>
              Обновить все РК
            </Button>
          </div>
        </div>
        <p style={{ fontSize: 11, color: colors.textSecondary, margin: `0 0 ${spacing.sm} 0` }}>
          Положили в корзину и заказали товаров — по рекламной статистике WB (fullstats) по артикулам РК.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980, tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: colors.bgGray }}>
                {HEADERS.map((label) => (
                  <th key={label} style={{ padding: '8px 10px', textAlign: 'left', ...typography.body, ...FONT, fontWeight: 600, color: colors.textPrimary, borderBottom: `1px solid ${colors.borderHeader}` }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, idx) => (
                <tr key={row.id} style={{ backgroundColor: idx % 2 === 0 ? colors.bgWhite : colors.bgGrayLight }}>
                  <td style={{ padding: '6px 10px', ...FONT }}>{row.createdAt}</td>
                  <td style={{ padding: '6px 10px', ...FONT }}>{row.updatedAt}</td>
                  <td style={{ padding: '6px 10px', ...FONT }}>
                    <Link
                      to={ONBOARDING_DEMO_CAMPAIGN_PATH}
                      data-tour-id={idx === 0 ? ONBOARDING_TARGETS.CAMPAIGNS_NAME : undefined}
                      style={{ fontWeight: 500, color: colors.primary, textDecoration: 'none' }}
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td style={{ padding: '6px 10px', ...FONT, color: colors.textSecondary }}>{row.id}</td>
                  <td style={{ padding: '6px 10px', ...FONT }}>{row.type}</td>
                  <td style={{ padding: '6px 10px', ...FONT, textAlign: 'center' }}>{row.articlesCount}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: borderRadius.sm,
                        backgroundColor: idx === 0 ? colors.success : colors.textMuted,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '6px 10px', ...FONT, textAlign: 'center' }}>{row.views}</td>
                  <td style={{ padding: '6px 10px', ...FONT, textAlign: 'center' }}>{row.clicks}</td>
                  <td style={{ padding: '6px 10px', ...FONT, textAlign: 'center' }}>{row.costs}</td>
                  <td style={{ padding: '6px 10px', ...FONT, textAlign: 'center' }}>{row.cpc}</td>
                  <td style={{ padding: '6px 10px', ...FONT, textAlign: 'center' }}>{row.ctr}</td>
                  <td style={{ padding: '6px 10px', ...FONT, textAlign: 'center' }}>{row.cart}</td>
                  <td style={{ padding: '6px 10px', ...FONT, textAlign: 'center' }}>{row.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
