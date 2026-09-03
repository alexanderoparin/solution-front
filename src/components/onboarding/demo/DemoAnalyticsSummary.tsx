import { useState } from 'react'
import { Button, Checkbox, DatePicker } from 'antd'
import { CaretDownOutlined, CaretRightOutlined, FilterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import locale from 'antd/locale/ru_RU'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { DEMO_ARTICLES } from '../../../onboarding/demoConstants'
import { colors, typography, spacing, borderRadius, shadows, transitions } from '../../../styles/analytics'
import { demoCard, demoPageWrap } from './demoUi'

const METRICS: { key: string; name: string; values: (string | number)[]; category: 'funnel' | 'ads' }[] = [
  { key: 'orders', name: 'Заказы', values: [186, 214], category: 'funnel' },
  { key: 'clicks', name: 'Клики', values: [1240, 1518], category: 'ads' },
  { key: 'costs', name: 'Затраты, ₽', values: ['18 400', '21 150'], category: 'ads' },
]

/**
 * Учебная сводная: те же якоря обучалки, что на живой странице.
 */
export default function DemoAnalyticsSummary() {
  const [expanded, setExpanded] = useState(false)
  const period1 = [dayjs().subtract(14, 'day'), dayjs().subtract(8, 'day')] as const
  const period2 = [dayjs().subtract(7, 'day'), dayjs().subtract(1, 'day')] as const

  return (
    <div style={demoPageWrap}>
      <div style={demoCard}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <Button icon={<FilterOutlined />} data-tour-id={ONBOARDING_TARGETS.SUMMARY_FILTER} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Фильтр
            <span
              style={{
                backgroundColor: colors.primary,
                color: 'white',
                borderRadius: 10,
                padding: '0 8px',
                fontSize: 12,
                marginLeft: 4,
              }}
            >
              {DEMO_ARTICLES.length}/{DEMO_ARTICLES.length}
            </span>
          </Button>
          <Checkbox checked>Только с фото</Checkbox>
          <Checkbox>Только приоритетные</Checkbox>
          <Checkbox>Только в рекламе</Checkbox>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
          <div style={{ fontSize: 14, color: colors.textPrimary }}>Выберите периоды для сравнения</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>Период 1</div>
              <DatePicker.RangePicker locale={locale.DatePicker} defaultValue={[period1[0], period1[1]]} format="DD.MM.YYYY" allowClear={false} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>Период 2</div>
              <DatePicker.RangePicker
                locale={locale.DatePicker}
                data-tour-id={ONBOARDING_TARGETS.SUMMARY_PERIOD_DATES}
                defaultValue={[period2[0], period2[1]]}
                format="DD.MM.YYYY"
                allowClear={false}
              />
            </div>
            <button
              type="button"
              data-tour-id={ONBOARDING_TARGETS.SUMMARY_ADD_PERIOD}
              aria-label="Добавить период"
              style={{
                width: 36,
                height: 36,
                borderRadius: borderRadius.full,
                border: `2px dashed ${colors.border}`,
                backgroundColor: colors.bgWhite,
                color: colors.textSecondary,
                cursor: 'pointer',
                marginTop: 20,
                fontSize: 20,
                lineHeight: 1,
                boxShadow: shadows.sm,
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
      <div style={demoCard}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...typography.body, fontWeight: 600, textAlign: 'left', padding: spacing.md, borderBottom: `1px solid ${colors.borderHeader}` }}>Показатель</th>
              <th style={{ ...typography.body, fontWeight: 600, textAlign: 'center', padding: spacing.md, borderBottom: `1px solid ${colors.borderHeader}` }}>Период 1</th>
              <th style={{ ...typography.body, fontWeight: 600, textAlign: 'center', padding: spacing.md, borderBottom: `1px solid ${colors.borderHeader}` }}>Период 2</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric, metricIndex) => {
              const isExpanded = metricIndex === 0 && expanded
              const bg = metric.category === 'funnel' ? colors.funnelBg : colors.advertisingBg
              return (
                <tr
                  key={metric.key}
                  onClick={() => {
                    if (metricIndex === 0) {
                      setExpanded((prev) => !prev)
                    }
                  }}
                  style={{
                    backgroundColor: bg,
                    cursor: metricIndex === 0 ? 'pointer' : 'default',
                    transition: transitions.fast,
                  }}
                >
                  <td style={{ padding: spacing.md, borderBottom: `1px solid ${colors.borderLight}`, ...typography.body, fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <span
                        data-tour-id={metricIndex === 0 ? ONBOARDING_TARGETS.SUMMARY_METRIC_EXPAND : undefined}
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        {isExpanded ? <CaretDownOutlined style={{ fontSize: 12 }} /> : <CaretRightOutlined style={{ fontSize: 12 }} />}
                      </span>
                      {metric.name}
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop: spacing.sm, paddingLeft: 20, fontSize: 12, color: colors.textSecondary }}>
                        {DEMO_ARTICLES.map((article) => (
                          <div key={article.nmId} style={{ marginBottom: 4 }}>
                            {article.nmId} · {article.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  {metric.values.map((value) => (
                    <td
                      key={`${metric.key}-${value}`}
                      style={{ textAlign: 'center', padding: spacing.md, borderBottom: `1px solid ${colors.borderLight}`, ...typography.number }}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
