import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Checkbox, Input, Popover, Tooltip } from 'antd'
import {
  CaretDownOutlined,
  CloseOutlined,
  FilterOutlined,
  HolderOutlined,
  SearchOutlined,
  StarFilled,
  UploadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { onboardingDemoArticlePath } from '../../../onboarding/demoPaths'
import { DEMO_ARTICLES, type DemoArticle } from '../../../onboarding/demoConstants'
import { DemoPhotoPlaceholder } from './DemoPhotoPlaceholder'
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  PRODUCT_PHOTO_WIDTH,
  PRODUCT_PHOTO_HEIGHT,
} from '../../../styles/analytics'

const FONT_PAGE_SMALL = { fontSize: '11px' as const }

const thBase = {
  borderBottom: `2px solid ${colors.border}`,
  ...typography.body,
  ...FONT_PAGE_SMALL,
  fontWeight: 600,
  color: colors.textPrimary,
  padding: '8px 10px' as const,
}

const COL_WIDTHS = {
  drag: 32,
  photo: PRODUCT_PHOTO_WIDTH,
  name: 200,
  priority: 72,
  wbCreatedAt: 76,
  rating: 56,
  stock: 72,
  fbsStock: 72,
  sizes: 100,
  date: 44,
  dynamics: 80,
} as const

const TABLE_MIN_WIDTH =
  COL_WIDTHS.drag +
  COL_WIDTHS.photo +
  COL_WIDTHS.name +
  COL_WIDTHS.priority +
  COL_WIDTHS.wbCreatedAt +
  COL_WIDTHS.rating +
  COL_WIDTHS.stock +
  COL_WIDTHS.fbsStock +
  COL_WIDTHS.sizes +
  COL_WIDTHS.date * 7 +
  COL_WIDTHS.dynamics

const cellBorder = `1px solid ${colors.border}`
const thickBorder = `2px solid ${colors.border}`

function MiniChart({ values, height = 32 }: { values: readonly number[]; height?: number }) {
  const max = Math.max(1, ...values)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {values.map((value, index) => (
        <div
          key={index}
          style={{
            width: 6,
            height: `${Math.max(2, (value / max) * 100)}%`,
            minHeight: 2,
            backgroundColor: colors.primary,
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  )
}

function DemoProductsColgroup() {
  return (
    <colgroup>
      <col style={{ width: COL_WIDTHS.drag }} />
      <col style={{ width: COL_WIDTHS.photo }} />
      <col style={{ width: COL_WIDTHS.name }} />
      <col style={{ width: COL_WIDTHS.priority }} />
      <col style={{ width: COL_WIDTHS.wbCreatedAt }} />
      <col style={{ width: COL_WIDTHS.rating }} />
      <col style={{ width: COL_WIDTHS.stock }} />
      <col style={{ width: COL_WIDTHS.fbsStock }} />
      <col style={{ width: COL_WIDTHS.sizes }} />
      {Array.from({ length: 7 }, (_, index) => (
        <col key={index} style={{ width: COL_WIDTHS.date }} />
      ))}
      <col style={{ width: COL_WIDTHS.dynamics }} />
    </colgroup>
  )
}

function StocksHeader({ fulfillment, borderRight }: { fulfillment: 'FBO' | 'FBS'; borderRight: string }) {
  const width = fulfillment === 'FBO' ? COL_WIDTHS.stock : COL_WIDTHS.fbsStock
  return (
    <th
      style={{
        ...thBase,
        textAlign: 'center',
        width,
        maxWidth: width,
        boxSizing: 'border-box',
        padding: '6px 4px',
        lineHeight: 1.2,
        borderRight,
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span>Остатки</span>
        <span>{fulfillment}</span>
      </span>
    </th>
  )
}

function matchesSearch(article: DemoArticle, query: string): boolean {
  if (!query) {
    return true
  }
  const q = query.toLowerCase()
  return (
    article.nmId.includes(q) ||
    article.vendorCode.toLowerCase().includes(q) ||
    article.title.toLowerCase().includes(q)
  )
}

/**
 * Учебная таблица товаров: те же колонки и фильтры, что на живой странице.
 * Фото — заглушки, артикулы вымышленные.
 */
export default function DemoAnalyticsProducts() {
  const last7Dates = useMemo(() => {
    const end = dayjs().subtract(1, 'day')
    return Array.from({ length: 7 }, (_, index) => end.subtract(6 - index, 'day'))
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [selectedNmIds, setSelectedNmIds] = useState<string[]>(() => DEMO_ARTICLES.map((a) => a.nmId))
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(true)
  const [onlyPriority, setOnlyPriority] = useState(false)
  const [onlyInAdvertising, setOnlyInAdvertising] = useState(false)
  const [priorityByNmId, setPriorityByNmId] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(DEMO_ARTICLES.map((a) => [a.nmId, a.priority])),
  )

  const selectedSet = useMemo(() => new Set(selectedNmIds), [selectedNmIds])

  const visibleArticles = useMemo(() => {
    return DEMO_ARTICLES.filter((article) => {
      if (selectedNmIds.length > 0 && !selectedSet.has(article.nmId)) {
        return false
      }
      if (!matchesSearch(article, searchQuery.trim())) {
        return false
      }
      if (onlyPriority && !priorityByNmId[article.nmId]) {
        return false
      }
      if (onlyInAdvertising && !article.inAdvertising) {
        return false
      }
      return true
    })
  }, [selectedNmIds, selectedSet, searchQuery, onlyPriority, onlyInAdvertising, priorityByNmId])

  const filterList = useMemo(() => {
    const q = filterSearch.trim().toLowerCase()
    if (!q) {
      return DEMO_ARTICLES
    }
    return DEMO_ARTICLES.filter(
      (a) =>
        a.nmId.includes(q) ||
        a.vendorCode.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q),
    )
  }, [filterSearch])

  const toggleFilterNmId = (nmId: string, checked: boolean) => {
    setSelectedNmIds((prev) => {
      if (checked) {
        return prev.includes(nmId) ? prev : [...prev, nmId]
      }
      return prev.filter((id) => id !== nmId)
    })
  }

  return (
    <>
      <style>{`
        .demo-products-table-link { color: ${colors.primary}; text-decoration: none; }
        .demo-products-table-link:hover { color: ${colors.primaryHover}; text-decoration: underline; }
        .demo-products-table-wrapper thead th { position: sticky; top: 0; z-index: 2; background: ${colors.bgGray}; }
      `}</style>
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: `${spacing.lg}px 0`,
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
            marginBottom: spacing.sm,
          }}
        >
          <Input
            placeholder="Поиск по артикулу или названию"
            prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ maxWidth: 360, borderRadius: borderRadius.sm, color: colors.textPrimary }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <Popover
              title="Фильтр артикулов"
              trigger="click"
              placement="bottomLeft"
              content={
                <div style={{ width: 400, maxHeight: 'min(520px, calc(100vh - 160px))', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Input
                    placeholder="Поиск по арт. продавца или WB"
                    prefix={<SearchOutlined style={{ color: colors.textMuted }} />}
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    style={{ marginBottom: 12 }}
                    allowClear
                  />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexShrink: 0 }}>
                    <Button size="small" onClick={() => setSelectedNmIds(DEMO_ARTICLES.map((a) => a.nmId))}>
                      Выбрать все
                    </Button>
                    <Button size="small" onClick={() => setSelectedNmIds([])}>
                      Снять все
                    </Button>
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    {filterList.map((article) => (
                      <div
                        key={article.nmId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: `1px solid ${colors.borderLight}`,
                        }}
                      >
                        <Checkbox
                          checked={selectedSet.has(article.nmId)}
                          onChange={(e) => toggleFilterNmId(article.nmId, e.target.checked)}
                          style={{ marginRight: 12 }}
                        />
                        <DemoPhotoPlaceholder width={40} height={40} />
                        <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                          <div style={{ fontWeight: 600, color: colors.textPrimary }}>{article.nmId}</div>
                          <div style={{ fontSize: 12, color: colors.textSecondary }}>{article.title}</div>
                          <div style={{ fontSize: 12, color: colors.textSecondary }}>
                            Артикул продавца: {article.vendorCode}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              }
            >
              <Button
                icon={<FilterOutlined />}
                data-tour-id={ONBOARDING_TARGETS.PRODUCTS_FILTER}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
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
                  {selectedNmIds.length}/{DEMO_ARTICLES.length}
                </span>
              </Button>
            </Popover>
            <Checkbox checked={onlyWithPhoto} onChange={(e) => setOnlyWithPhoto(e.target.checked)}>
              Только с фото
            </Checkbox>
            <Checkbox checked={onlyPriority} onChange={(e) => setOnlyPriority(e.target.checked)}>
              Только приоритетные
            </Checkbox>
            <Tooltip title="Только артикулы, привязанные к незавершённым рекламным кампаниям кабинета">
              <Checkbox checked={onlyInAdvertising} onChange={(e) => setOnlyInAdvertising(e.target.checked)}>
                Только в рекламе
              </Checkbox>
            </Tooltip>
          </div>
          <Tooltip title="Загрузите выгрузку «Воронка продаж» из ЛК WB (лист «Товары»). Импортируются все артикулы кабинета из файла.">
            <Button icon={<UploadOutlined />} aria-label="Импорт воронки из Excel для всех артикулов" style={{ marginLeft: 'auto' }} />
          </Tooltip>
        </div>

        {selectedNmIds.length > 0 && (
          <div style={{ width: '100%', marginBottom: spacing.sm }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {selectedNmIds.map((nmId) => (
                <span
                  key={nmId}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: borderRadius.sm,
                    backgroundColor: '#E0F2FE',
                    color: '#0369A1',
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {nmId}
                  <button
                    type="button"
                    onClick={() => toggleFilterNmId(nmId, false)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'inherit',
                      display: 'flex',
                      lineHeight: 1,
                    }}
                    aria-label="Снять выбор"
                  >
                    <CloseOutlined style={{ fontSize: 10 }} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div
          className="demo-products-table-wrapper"
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            maxHeight: 'calc(100vh - 280px)',
            width: '100%',
            overflow: 'hidden',
            overflowX: 'auto',
          }}
        >
          <table
            className="products-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
              minWidth: TABLE_MIN_WIDTH,
            }}
          >
            <DemoProductsColgroup />
            <thead>
              <tr style={{ backgroundColor: colors.bgGray }}>
                <th style={{ ...thBase, textAlign: 'center', borderRight: cellBorder, padding: '8px 2px' }}>
                  <HolderOutlined style={{ color: colors.textMuted, fontSize: 14 }} />
                </th>
                <th style={{ ...thBase, textAlign: 'left', borderRight: cellBorder, padding: '8px 4px' }}>Фото</th>
                <th style={{ ...thBase, textAlign: 'left', borderRight: cellBorder }}>Название и детали</th>
                <th style={{ ...thBase, textAlign: 'center', borderRight: cellBorder }}>Приоритет</th>
                <th style={{ ...thBase, textAlign: 'center', borderRight: cellBorder }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    Создан
                    <CaretDownOutlined style={{ marginLeft: 4, fontSize: 10 }} />
                  </span>
                </th>
                <th style={{ ...thBase, textAlign: 'center', borderRight: cellBorder }}>Рейтинг</th>
                <StocksHeader fulfillment="FBO" borderRight={cellBorder} />
                <StocksHeader fulfillment="FBS" borderRight={cellBorder} />
                <th style={{ ...thBase, textAlign: 'center', borderRight: thickBorder }}>Размеры</th>
                {last7Dates.map((date, index) => (
                  <th
                    key={date.format('YYYY-MM-DD')}
                    data-tour-id={ONBOARDING_TARGETS.PRODUCTS_ORDERS_BY_DAY}
                    style={{
                      ...thBase,
                      textAlign: 'center',
                      padding: '8px 6px',
                      verticalAlign: 'bottom',
                      borderRight: index === last7Dates.length - 1 ? thickBorder : cellBorder,
                    }}
                  >
                    <span
                      style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        transform: 'rotate(-180deg)',
                        display: 'inline-block',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {date.format('DD.MM')}
                    </span>
                  </th>
                ))}
                <th
                  data-tour-id={ONBOARDING_TARGETS.PRODUCTS_DYNAMICS}
                  style={{ ...thBase, textAlign: 'center', color: colors.primary }}
                >
                  Динамика
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleArticles.map((article, rowIndex) => {
                const created = dayjs(article.createdAt)
                const rowBg = rowIndex % 2 === 0 ? colors.bgWhite : colors.bgGrayLight
                return (
                  <tr
                    key={article.nmId}
                    style={{
                      backgroundColor: rowBg,
                      transition: transitions.fast,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.bgGray
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = rowBg
                    }}
                  >
                    <td
                      style={{
                        padding: '4px 2px',
                        borderBottom: cellBorder,
                        borderRight: cellBorder,
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        cursor: 'grab',
                        userSelect: 'none',
                      }}
                      title="Перетащите строку"
                    >
                      <HolderOutlined style={{ color: colors.textMuted, fontSize: 16, pointerEvents: 'none' }} />
                    </td>
                    <td
                      style={{
                        padding: '6px 0',
                        borderBottom: cellBorder,
                        borderRight: cellBorder,
                        verticalAlign: 'top',
                        position: 'relative',
                        height: PRODUCT_PHOTO_HEIGHT + 12,
                        minHeight: PRODUCT_PHOTO_HEIGHT + 12,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          left: 0,
                          width: PRODUCT_PHOTO_WIDTH,
                          height: PRODUCT_PHOTO_HEIGHT,
                          borderRadius: borderRadius.sm,
                          overflow: 'hidden',
                        }}
                      >
                        <DemoPhotoPlaceholder width={PRODUCT_PHOTO_WIDTH} height={PRODUCT_PHOTO_HEIGHT} />
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '6px 10px',
                        borderBottom: cellBorder,
                        borderRight: cellBorder,
                        ...typography.body,
                        ...FONT_PAGE_SMALL,
                        verticalAlign: 'top',
                      }}
                    >
                      <Link
                        to={onboardingDemoArticlePath(article.nmId)}
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: colors.textPrimary,
                          marginBottom: 4,
                          display: 'inline-block',
                          textDecoration: 'none',
                        }}
                      >
                        {article.title}
                      </Link>
                      <div style={{ color: colors.textSecondary, marginBottom: 2 }}>
                        {[article.subjectName, article.brand].filter(Boolean).join(' · ')}
                      </div>
                      <div style={{ color: colors.textSecondary, marginBottom: 2 }}>
                        Артикул WB:{' '}
                        <Link to={onboardingDemoArticlePath(article.nmId)} className="demo-products-table-link">{article.nmId}</Link>
                      </div>
                      <div style={{ color: colors.textSecondary, marginBottom: 4 }}>
                        Артикул продавца:{' '}
                        <Link to={onboardingDemoArticlePath(article.nmId)} className="demo-products-table-link">{article.vendorCode}</Link>
                      </div>
                    </td>
                    <td style={{ padding: '6px 6px', borderBottom: cellBorder, borderRight: cellBorder, textAlign: 'center', verticalAlign: 'top' }}>
                      <Checkbox
                        checked={priorityByNmId[article.nmId]}
                        onChange={(e) =>
                          setPriorityByNmId((prev) => ({ ...prev, [article.nmId]: e.target.checked }))
                        }
                      />
                    </td>
                    <td
                      style={{
                        padding: '6px 8px',
                        borderBottom: cellBorder,
                        borderRight: cellBorder,
                        ...typography.body,
                        ...FONT_PAGE_SMALL,
                        verticalAlign: 'top',
                        textAlign: 'center',
                      }}
                    >
                      <div>{created.format('DD.MM.YY')}</div>
                      <div style={{ color: colors.textSecondary, fontSize: 10, lineHeight: 1.2, marginTop: 1 }}>
                        {created.format('HH:mm')}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '6px 4px',
                        borderBottom: cellBorder,
                        borderRight: cellBorder,
                        ...typography.body,
                        ...FONT_PAGE_SMALL,
                        verticalAlign: 'top',
                        textAlign: 'center',
                      }}
                    >
                      {article.rating != null ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <StarFilled style={{ color: '#FBBF24', fontSize: 12 }} />
                          <span>{article.rating.toFixed(1)}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td
                      style={{
                        padding: '6px 4px',
                        borderBottom: cellBorder,
                        borderRight: cellBorder,
                        ...typography.body,
                        ...FONT_PAGE_SMALL,
                        verticalAlign: 'top',
                        textAlign: 'center',
                      }}
                    >
                      {article.fbo.toLocaleString('ru-RU')}
                    </td>
                    <td
                      style={{
                        padding: '6px 4px',
                        borderBottom: cellBorder,
                        borderRight: cellBorder,
                        ...typography.body,
                        ...FONT_PAGE_SMALL,
                        verticalAlign: 'top',
                        textAlign: 'center',
                      }}
                    >
                      {article.fbs.toLocaleString('ru-RU')}
                    </td>
                    <td
                      style={{
                        padding: '6px 10px',
                        borderBottom: cellBorder,
                        borderRight: thickBorder,
                        ...typography.body,
                        ...FONT_PAGE_SMALL,
                        verticalAlign: 'top',
                        textAlign: 'center',
                      }}
                    >
                      {article.sizes}
                    </td>
                    {article.orders.map((value, dayIndex) => (
                      <td
                        key={`${article.nmId}-${dayIndex}`}
                        style={{
                          textAlign: 'center',
                          padding: '6px',
                          borderBottom: cellBorder,
                          borderRight: dayIndex === article.orders.length - 1 ? thickBorder : cellBorder,
                          ...typography.body,
                          ...FONT_PAGE_SMALL,
                          verticalAlign: 'top',
                        }}
                      >
                        {value}
                      </td>
                    ))}
                    <td style={{ padding: '6px 10px', borderBottom: cellBorder, verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MiniChart values={article.orders} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  )
}
