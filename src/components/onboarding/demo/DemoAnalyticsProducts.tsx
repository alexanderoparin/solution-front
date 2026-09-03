import { Button, Checkbox } from 'antd'
import { FilterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { DEMO_ARTICLES } from '../../../onboarding/demoConstants'
import { colors, typography, spacing, PRODUCT_PHOTO_WIDTH, PRODUCT_PHOTO_HEIGHT } from '../../../styles/analytics'
import { demoPageWrap, demoTableCell, demoTableHead } from './demoUi'

const LAST_7_DATES = Array.from({ length: 7 }, (_, index) => dayjs().subtract(6 - index, 'day'))
const DEMO_ORDERS = [4, 6, 3, 8, 5, 7, 9]
const DEMO_ORDERS_B = [2, 3, 1, 4, 2, 5, 3]

/**
 * Учебная таблица товаров с якорями фильтра, заказов по дням и динамики.
 */
export default function DemoAnalyticsProducts() {
  return (
    <div style={{ ...demoPageWrap, padding: spacing.md }}>
      <div
        style={{
          backgroundColor: colors.bgWhite,
          border: `1px solid ${colors.borderLight}`,
          padding: spacing.md,
          marginBottom: spacing.md,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <Button icon={<FilterOutlined />} data-tour-id={ONBOARDING_TARGETS.PRODUCTS_FILTER} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
      </div>
      <div style={{ overflowX: 'auto', backgroundColor: colors.bgWhite, border: `1px solid ${colors.borderLight}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
          <thead>
            <tr>
              <th style={{ ...demoTableHead, textAlign: 'left', minWidth: 220 }}>Товар</th>
              <th style={demoTableHead}>FBO</th>
              <th style={demoTableHead}>FBS</th>
              {LAST_7_DATES.map((date) => (
                <th key={date.format('YYYY-MM-DD')} data-tour-id={ONBOARDING_TARGETS.PRODUCTS_ORDERS_BY_DAY} style={{ ...demoTableHead, padding: '8px 6px' }}>
                  <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(-180deg)', display: 'inline-block' }}>
                    {date.format('DD.MM')}
                  </span>
                </th>
              ))}
              <th data-tour-id={ONBOARDING_TARGETS.PRODUCTS_DYNAMICS} style={{ ...demoTableHead, color: colors.primary }}>
                Динамика
              </th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ARTICLES.map((article, index) => {
              const orders = index === 0 ? DEMO_ORDERS : DEMO_ORDERS_B
              const total = orders.reduce((sum, n) => sum + n, 0)
              return (
                <tr key={article.nmId} style={{ backgroundColor: index % 2 === 0 ? colors.bgWhite : colors.bgGrayLight }}>
                  <td style={{ ...demoTableCell, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <div
                      style={{
                        width: PRODUCT_PHOTO_WIDTH,
                        height: PRODUCT_PHOTO_HEIGHT,
                        borderRadius: 4,
                        background: 'linear-gradient(145deg, #EDE9FE 0%, #C4B5FD 55%, #A78BFA 100%)',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ ...typography.body, fontWeight: 600 }}>{article.nmId}</div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>{article.title}</div>
                    </div>
                  </td>
                  <td style={{ ...demoTableCell, textAlign: 'center' }}>{index === 0 ? 201 : 86}</td>
                  <td style={{ ...demoTableCell, textAlign: 'center' }}>{index === 0 ? 14 : 9}</td>
                  {orders.map((value, dayIndex) => (
                    <td key={`${article.nmId}-${dayIndex}`} style={{ ...demoTableCell, textAlign: 'center' }}>
                      {value}
                    </td>
                  ))}
                  <td style={{ ...demoTableCell, textAlign: 'center', color: colors.success, fontWeight: 600 }}>
                    +{total}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
