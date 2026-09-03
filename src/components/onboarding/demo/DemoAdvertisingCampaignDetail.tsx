import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Checkbox, DatePicker, Select, Switch } from 'antd'
import { CaretDownOutlined, CaretRightOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import locale from 'antd/locale/ru_RU'
import FboFbsStocksSwitch, { type StocksFulfillment } from '../../FboFbsStocksSwitch'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { ONBOARDING_DEMO_MANAGE_PATH } from '../../../onboarding/demoPaths'
import {
  DEMO_ARTICLES,
  DEMO_CAMPAIGN_NAME,
  DEMO_CAMPAIGN_WB_ID,
  DEMO_WAREHOUSE_SIZES,
  DEMO_WAREHOUSES,
} from '../../../onboarding/demoConstants'
import { colors, typography, spacing, borderRadius, shadows } from '../../../styles/analytics'
import { demoCard, demoPageWrap } from './demoUi'
import DemoArticleChip from './DemoArticleChip'

const DATE_TO = dayjs().subtract(1, 'day')
const DATE_FROM = DATE_TO.subtract(6, 'day')
const PERIOD_2_FROM = DATE_TO.subtract(13, 'day')
const PERIOD_2_TO = DATE_TO.subtract(7, 'day')

/**
 * Учебная карточка кампании: артикулы, метрики, график, выгрузка, остатки.
 */
export default function DemoAdvertisingCampaignDetail() {
  const [showChart, setShowChart] = useState(true)
  const [fulfillment, setFulfillment] = useState<StocksFulfillment>('FBO')
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(null)
  const [stockNmId, setStockNmId] = useState(DEMO_ARTICLES[0].nmId)
  const stocks = useMemo(
    () => (fulfillment === 'FBO' ? DEMO_WAREHOUSES : DEMO_WAREHOUSES.map((row) => ({ ...row, amount: Math.max(2, Math.round(row.amount / 8)) }))),
    [fulfillment],
  )
  const totalAmount = stocks.reduce((sum, row) => sum + row.amount, 0)

  return (
    <div style={demoPageWrap}>
      <div style={demoCard}>
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
          <span style={{ ...typography.body, color: colors.textSecondary }}>ID {DEMO_CAMPAIGN_WB_ID}</span>
          <span style={{ ...typography.body, color: colors.textSecondary }}>{DEMO_ARTICLES.length} шт.</span>
          <Link
            to={ONBOARDING_DEMO_MANAGE_PATH}
            data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_MANAGE}
            style={{ marginLeft: 'auto', color: colors.primary, fontSize: 13, textDecoration: 'none' }}
          >
            Управление →
          </Link>
        </div>
        <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div
            style={{
              width: 240,
              flexShrink: 0,
              padding: spacing.sm,
              borderRadius: borderRadius.md,
              backgroundColor: colors.bgGrayLight,
              border: `1px solid ${colors.border}`,
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            Цель на рекламную кампанию:
            <div style={{ marginTop: 6, color: colors.textPrimary, fontSize: 11, lineHeight: 1.45 }}>
              Держать ДРР в пределах 12% и не терять наличие на Коледино.
            </div>
          </div>
          <div data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_ARTICLES} style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
            {DEMO_ARTICLES.map((article) => (
              <DemoArticleChip key={article.nmId} nmId={article.nmId} title={article.title} />
            ))}
          </div>
        </div>
      </div>

      <div style={demoCard}>
        <div style={{ display: 'flex', marginBottom: spacing.md, alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' }}>
            <DatePicker.RangePicker locale={locale.DatePicker} defaultValue={[DATE_FROM, DATE_TO]} format="DD.MM.YYYY" style={{ width: 220 }} />
            <span data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_METRICS} style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' }}>
              <Checkbox defaultChecked>Общая</Checkbox>
              <Checkbox defaultChecked>Реклама</Checkbox>
              <Checkbox>Цены</Checkbox>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
            <span data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_CHART} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, ...typography.body }}>
              <Switch checked={showChart} onChange={setShowChart} size="small" />
              <span>График</span>
            </span>
            <Button type="primary" icon={<DownloadOutlined />} data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_EXPORT}>
              Выгрузить
            </Button>
          </div>
        </div>
        {showChart && (
          <div
            style={{
              height: 120,
              borderRadius: borderRadius.md,
              background: `linear-gradient(180deg, ${colors.primaryLight} 0%, ${colors.bgWhite} 100%)`,
              border: `1px solid ${colors.borderLight}`,
              marginBottom: spacing.md,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <polyline fill="none" stroke={colors.primary} strokeWidth="2.5" points="0,88 60,72 120,78 180,50 240,58 300,34 360,42 400,28" />
            </svg>
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: colors.bgGrayLight }}>
              {['Дата', 'Просмотры', 'Клики', 'CTR', 'Затраты', 'Заказы'].map((label) => (
                <th key={label} style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${colors.borderHeader}` }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['28.08', '29.08', '30.08'].map((date, index) => (
              <tr key={date}>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{date}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{6200 + index * 410}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{180 + index * 22}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>3,{1 + index}%</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{2800 + index * 210} ₽</td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{12 + index * 2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...demoCard, boxShadow: shadows.md }}>
        <h2 style={{ ...typography.h2, margin: '0 0 16px 0', fontSize: 16 }}>Сравнение периодов</h2>
        <div
          data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_COMPARE_PERIODS}
          style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}
        >
          <span style={{ ...typography.body, fontWeight: 600 }}>Период 1</span>
          <DatePicker.RangePicker locale={locale.DatePicker} defaultValue={[DATE_FROM, DATE_TO]} format="DD.MM.YYYY" style={{ width: 220 }} />
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md }}>Заказы 96 · Затраты 21 150 ₽ · ДРР 11,8%</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
          <span style={{ ...typography.body, fontWeight: 600 }}>Период 2</span>
          <DatePicker.RangePicker locale={locale.DatePicker} defaultValue={[PERIOD_2_FROM, PERIOD_2_TO]} format="DD.MM.YYYY" style={{ width: 220 }} />
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary }}>Заказы 84 · Затраты 18 400 ₽ · ДРР 12,4%</div>
      </div>

      <div style={demoCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap', marginBottom: spacing.md }}>
          <h2 style={{ ...typography.h2, margin: 0, fontSize: 16 }}>Остатки</h2>
          <FboFbsStocksSwitch
            value={fulfillment}
            onChange={setFulfillment}
            tourTargetId={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_STOCK_FULFILLMENT}
          />
          <Select
            data-tour-id={ONBOARDING_TARGETS.CAMPAIGN_DETAIL_STOCK_ARTICLE}
            value={stockNmId}
            onChange={setStockNmId}
            style={{ minWidth: 140, marginLeft: 'auto' }}
            options={DEMO_ARTICLES.map((article) => ({ value: article.nmId, label: String(article.nmId) }))}
          />
          <div
            style={{
              ...typography.h3,
              color: colors.bgWhite,
              backgroundColor: colors.primary,
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: borderRadius.sm,
              fontWeight: 600,
            }}
          >
            Всего {totalAmount.toLocaleString('ru-RU')}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: colors.primaryLight }}>
              <th style={{ textAlign: 'left', padding: spacing.md, borderBottom: `2px solid ${colors.primary}`, color: colors.primary }}>Склад</th>
              <th style={{ textAlign: 'left', padding: spacing.md, borderBottom: `2px solid ${colors.primary}`, color: colors.primary }}>Кол-во</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, index) => {
              const isExpanded = expandedWarehouse === stock.warehouseName
              const sizes = DEMO_WAREHOUSE_SIZES[stock.warehouseName] ?? []
              return (
                <tr
                  key={stock.warehouseName}
                  onClick={() => setExpandedWarehouse(isExpanded ? null : stock.warehouseName)}
                  style={{ backgroundColor: index % 2 === 0 ? colors.bgWhite : colors.bgGrayLight, cursor: 'pointer' }}
                >
                  <td style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span
                        data-tour-id={index === 0 ? ONBOARDING_TARGETS.CAMPAIGN_DETAIL_STOCK_EXPAND : undefined}
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        {isExpanded ? <CaretDownOutlined style={{ fontSize: 12, color: colors.primary }} /> : <CaretRightOutlined style={{ fontSize: 12, color: colors.textSecondary }} />}
                      </span>
                      {stock.warehouseName}
                    </span>
                    {isExpanded && sizes.length > 0 && (
                      <div style={{ marginTop: 8, paddingLeft: 20, color: colors.textSecondary }}>
                        {sizes.map((size) => (
                          <div key={size.techSize}>
                            {size.techSize}: {size.amount}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border}`, fontWeight: 600 }}>{stock.amount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
