import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Checkbox, InputNumber, Select, Space, Switch } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import CampaignWeekCalendar from '../../campaignManage/CampaignWeekCalendar'
import CampaignBudgetChart from '../../campaignManage/CampaignBudgetChart'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { ONBOARDING_DEMO_CAMPAIGN_PATH } from '../../../onboarding/demoPaths'
import {
  DEMO_ARTICLES,
  DEMO_CAMPAIGN_NAME,
  DEMO_CAMPAIGN_WB_ID,
  DEMO_SCHEDULE_SLOTS,
  buildDemoBudgetChart,
} from '../../../onboarding/demoConstants'
import { colors, typography, spacing, borderRadius } from '../../../styles/analytics'
import { demoCard, demoPageWrap } from './demoUi'
import DemoArticleChip from './DemoArticleChip'

const cardStyle = demoCard

/**
 * Учебное управление РК: автопополнение, расписание и график бюджета.
 */
export default function DemoAdvertisingCampaignManage() {
  const [scheduleEnabled, setScheduleEnabled] = useState(true)
  const [autoEnabled, setAutoEnabled] = useState(true)
  const chartData = useMemo(() => buildDemoBudgetChart(new Date().toISOString()), [])

  return (
    <div style={demoPageWrap}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
          <h1 style={{ ...typography.h2, margin: 0 }}>{DEMO_CAMPAIGN_NAME}</h1>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: borderRadius.sm,
              backgroundColor: colors.success,
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Активна
          </span>
          <span style={{ color: colors.textSecondary }}>ID {DEMO_CAMPAIGN_WB_ID}</span>
          <span style={{ color: colors.textSecondary }}>{DEMO_ARTICLES.length} шт.</span>
          <Link
            to={ONBOARDING_DEMO_CAMPAIGN_PATH}
            data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_STATS_LINK}
            style={{ marginLeft: 'auto', color: colors.primary }}
          >
            Статистика кампании →
          </Link>
        </div>
        <div data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_ARTICLES} style={{ display: 'flex', gap: spacing.lg }}>
          {DEMO_ARTICLES.map((article) => (
            <DemoArticleChip key={article.nmId} nmId={article.nmId} title={article.title} />
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }} data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_AUTO_BUDGET}>
            <h2 style={{ ...typography.h2, fontSize: 16, margin: '0 0 12px' }}>Автопополнение бюджета</h2>
            <Checkbox checked={autoEnabled} onChange={(e) => setAutoEnabled(e.target.checked)}>
              Пополнять бюджет автоматически
            </Checkbox>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>Сумма пополнения, ₽</div>
                <InputNumber style={{ width: '100%' }} defaultValue={2000} min={100} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>Источник</div>
                <Select style={{ width: '100%' }} defaultValue="account" options={[{ value: 'account', label: 'Счёт WB · 14 320 ₽' }]} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>Пополнить если ниже, ₽</div>
                <InputNumber style={{ width: '100%' }} defaultValue={1500} min={0} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>Макс. пополнений в день</div>
                <InputNumber style={{ width: '100%' }} defaultValue={3} min={1} />
              </div>
            </div>
          </div>
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              width: 220,
            }}
          >
            <Button
              type="primary"
              icon={<SaveOutlined />}
              data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_AUTO_BUDGET_SAVE}
              style={{ backgroundColor: colors.success, borderColor: colors.success }}
            >
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Space align="center" size={12} style={{ flex: 1 }}>
            <h2 style={{ ...typography.h2, fontSize: 16, margin: 0 }}>Расписание</h2>
            <Switch
              data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_SCHEDULE_TOGGLE}
              checked={scheduleEnabled}
              onChange={setScheduleEnabled}
            />
            <span style={{ fontSize: 13, color: colors.textSecondary }}>{scheduleEnabled ? 'Вкл' : 'Выкл'}</span>
          </Space>
        </div>
        <CampaignWeekCalendar
          tourTargetId={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_SCHEDULE_GRID}
          slots={DEMO_SCHEDULE_SLOTS}
          disabled
          onCreateRange={() => undefined}
          onUpdateSlot={() => undefined}
          onEditSlot={() => undefined}
          onDeleteSlot={() => undefined}
        />
      </div>

      <div style={cardStyle} data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_MANAGE_BUDGET_CHART}>
        <h2 style={{ ...typography.h2, fontSize: 16, margin: '0 0 12px' }}>График бюджета</h2>
        <CampaignBudgetChart data={chartData} />
      </div>
    </div>
  )
}
