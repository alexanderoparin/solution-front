import { Link } from 'react-router-dom'
import { Switch } from 'antd'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { ONBOARDING_DEMO_MANAGE_PATH } from '../../../onboarding/demoPaths'
import { DEMO_CAMPAIGN_NAME, DEMO_CAMPAIGN_TYPE, DEMO_CAMPAIGN_WB_ID, DEMO_CAMPAIGN_WB_ID_SECOND } from '../../../onboarding/demoConstants'
import { bidderStatusColor, bidderStatusIcon, bidderStatusLabel } from '../../../utils/bidderStatus'
import { colors, typography, spacing, borderRadius, shadows } from '../../../styles/analytics'
import { demoPageWrap } from './demoUi'

const FONT = { fontSize: 11 as const }

const ROWS = [
  {
    createdAt: '12.03.2026',
    updatedAt: '01.09.2026 09:14',
    name: DEMO_CAMPAIGN_NAME,
    id: DEMO_CAMPAIGN_WB_ID,
    type: DEMO_CAMPAIGN_TYPE,
    articlesCount: 2,
    bidderStatus: 'RUNNING' as const,
    scheduleOn: true,
  },
  {
    createdAt: '04.02.2026',
    updatedAt: '28.08.2026 18:02',
    name: 'Пижама — авто',
    id: DEMO_CAMPAIGN_WB_ID_SECOND,
    type: 'Автоматическая',
    articlesCount: 2,
    bidderStatus: 'OFF' as const,
    scheduleOn: false,
  },
]

/**
 * Учебный список управления РК: статус автозапуска и переход в настройки.
 */
export default function DemoBidderCampaigns() {
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900, tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: colors.bgGray }}>
                {['Дата создания', 'Дата обновления', 'Кампания', 'ID', 'Тип', 'Количество артикулов', 'Статус'].map((label) => (
                  <th key={label} style={{ padding: '8px 10px', textAlign: 'left', ...typography.body, ...FONT, fontWeight: 600 }}>
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
                      to={ONBOARDING_DEMO_MANAGE_PATH}
                      data-tour-id={idx === 0 ? ONBOARDING_TARGETS.BIDDER_CAMPAIGN_NAME : undefined}
                      style={{ fontWeight: 500, color: colors.primary, textDecoration: 'none' }}
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td style={{ padding: '6px 10px', ...FONT, color: colors.textSecondary }}>{row.id}</td>
                  <td style={{ padding: '6px 10px', ...FONT }}>{row.type}</td>
                  <td style={{ padding: '6px 10px', ...FONT, textAlign: 'center' }}>{row.articlesCount}</td>
                  <td
                    data-tour-id={idx === 0 ? ONBOARDING_TARGETS.BIDDER_STATUS : undefined}
                    style={{ padding: '8px 10px', textAlign: 'center' }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 110,
                          padding: '2px 8px',
                          borderRadius: borderRadius.sm,
                          backgroundColor: bidderStatusColor(row.bidderStatus),
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {bidderStatusIcon(row.bidderStatus)}
                        {bidderStatusLabel(row.bidderStatus)}
                      </span>
                      <Switch size="small" defaultChecked={row.scheduleOn} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
