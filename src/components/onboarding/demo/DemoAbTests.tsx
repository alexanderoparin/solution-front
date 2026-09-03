import { Link } from 'react-router-dom'
import { Button, Segmented, Switch, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { DEMO_ARTICLES, DEMO_CAMPAIGN_WB_ID, DEMO_CAMPAIGN_WB_ID_SECOND } from '../../../onboarding/demoConstants'
import { ONBOARDING_TARGETS } from '../../../onboarding/targets'
import { colors, borderRadius } from '../../../styles/analytics'

const accent = '#7C3AED'
const DEMO_AB_TEST_PATH = '/advertising/ab-test/demo'

const PHOTO_PALETTES = [
  { bg: '#EDE9FE', fg: '#6D28D9' },
  { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#D1FAE5', fg: '#047857' },
  { bg: '#E2E8F0', fg: '#475569' },
  { bg: '#FFE4E6', fg: '#E11D48' },
]

interface DemoVariant {
  ctr: string
  winning?: boolean
  losing?: boolean
  views: string
  clicks: string
  atbs: string
  orders: string
  share: string
  cr1: string
  cr: string
  activeOnWb?: boolean
}

const FIRST_VARIANTS: DemoVariant[] = [
  { ctr: '2.14%', views: '8 420', clicks: '180', atbs: '42', orders: '18', share: '17%', cr1: '23.3%', cr: '10.0%' },
  { ctr: '3.41%', winning: true, views: '8 110', clicks: '276', atbs: '71', orders: '31', share: '16%', cr1: '25.7%', cr: '11.2%', activeOnWb: true },
  { ctr: '1.62%', losing: true, views: '7 980', clicks: '129', atbs: '24', orders: '9', share: '16%', cr1: '18.6%', cr: '7.0%' },
  { ctr: '2.80%', views: '7 640', clicks: '214', atbs: '48', orders: '19', share: '15%', cr1: '22.4%', cr: '8.9%' },
  { ctr: '2.05%', views: '7 510', clicks: '154', atbs: '33', orders: '12', share: '15%', cr1: '21.4%', cr: '7.8%' },
  { ctr: '1.90%', views: '7 200', clicks: '137', atbs: '29', orders: '11', share: '11%', cr1: '21.2%', cr: '8.0%' },
  { ctr: '2.44%', views: '6 880', clicks: '168', atbs: '39', orders: '15', share: '10%', cr1: '23.2%', cr: '8.9%' },
]

const SECOND_VARIANTS: DemoVariant[] = [
  { ctr: '2.80%', views: '3 100', clicks: '87', atbs: '19', orders: '8', share: '26%', cr1: '21.8%', cr: '9.2%', activeOnWb: true },
  { ctr: '2.55%', views: '2 940', clicks: '75', atbs: '14', orders: '6', share: '25%', cr1: '18.7%', cr: '8.0%' },
  { ctr: '3.12%', views: '2 880', clicks: '90', atbs: '21', orders: '9', share: '25%', cr1: '23.3%', cr: '10.0%' },
  { ctr: '1.10%', views: '2 710', clicks: '30', atbs: '6', orders: '2', share: '24%', cr1: '20.0%', cr: '6.7%' },
]

function DemoProductThumb({ index, width, height }: { index: number; width: number | string; height: number | string }) {
  const palette = PHOTO_PALETTES[index % PHOTO_PALETTES.length]
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 8,
        background: palette.bg,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 72 96" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect x="0" y="0" width="72" height="96" fill={palette.bg} />
        <ellipse cx="36" cy="22" rx="10" ry="8" fill={palette.fg} opacity="0.22" />
        <path
          d="M16 30 L26 24 L36 32 L46 24 L56 30 L52 42 L52 82 Q36 88 20 82 L20 42 Z"
          fill={palette.fg}
          opacity="0.38"
        />
        <path d="M26 42 H46 V78 H26 Z" fill="#fff" opacity="0.35" />
      </svg>
    </div>
  )
}

function DemoAbTestCard({
  title,
  nmId,
  advertId,
  dateLabel,
  rotation,
  stop,
  finish,
  insight,
  status,
  variants,
  to,
  switchOn,
  tourAnchors,
}: {
  title: string
  nmId: string
  advertId: string
  dateLabel: string
  rotation: string
  stop: string
  finish: string
  insight?: string
  status: { bg: string; color: string; text: string }
  variants: DemoVariant[]
  to?: string
  switchOn: boolean
  tourAnchors?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        padding: 16,
        background: '#fff',
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.lg,
        alignItems: 'flex-start',
      }}
    >
      <div
        data-tour-id={tourAnchors ? ONBOARDING_TARGETS.AB_TEST_VARIANTS : undefined}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 360 }}
      >
        {variants.map((variant, index) => {
          const thumb = (
            <div style={{ width: 72 }}>
              <div style={{ position: 'relative', width: 72, height: 96 }}>
                <DemoProductThumb index={index} width={72} height={96} />
              </div>
              <div style={{ fontSize: 12, marginTop: 4, fontWeight: 600 }}>CTR {variant.ctr}</div>
            </div>
          )
          if (to == null) {
            return <div key={index}>{thumb}</div>
          }
          return (
            <Link key={index} to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
              {thumb}
            </Link>
          )
        })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {to != null ? (
          <Link
            to={to}
            data-tour-id={tourAnchors ? ONBOARDING_TARGETS.AB_TEST_TITLE : undefined}
            style={{ color: colors.textPrimary, fontWeight: 600, fontSize: 15 }}
          >
            {title}
          </Link>
        ) : (
          <div style={{ color: colors.textPrimary, fontWeight: 600, fontSize: 15 }}>{title}</div>
        )}
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
          {nmId} · рк {advertId}
        </div>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>{dateLabel}</div>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>{rotation}</div>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>{stop}</div>
        <div style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>{finish}</div>
        {insight ? (
          <div style={{ marginTop: 8, fontSize: 13, color: '#64748B' }}>{insight}</div>
        ) : null}
      </div>
      <div
        data-tour-id={tourAnchors ? ONBOARDING_TARGETS.AB_TEST_STATUS : undefined}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}
      >
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: status.bg,
            color: status.color,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {status.text}
        </span>
        <Switch defaultChecked={switchOn} />
      </div>
    </div>
  )
}

/**
 * Учебный список А/Б-тестов в вёрстке живой страницы.
 */
export default function DemoAbTests() {
  return (
    <div style={{ minHeight: '100vh', background: colors.bgGray }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              data-tour-id={ONBOARDING_TARGETS.AB_TEST_CREATE}
              style={{ background: accent, borderColor: accent }}
            >
              Создать новый тест
            </Button>
            <Typography.Text type="secondary" style={{ fontSize: 14 }}>
              Доступно тестов: 2 из 3
            </Typography.Text>
          </div>
          <span data-tour-id={ONBOARDING_TARGETS.AB_TEST_FILTER}>
            <Segmented defaultValue="active" options={[{ label: 'Активные', value: 'active' }, { label: 'Все', value: 'all' }]} />
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DemoAbTestCard
            to={DEMO_AB_TEST_PATH}
            title={DEMO_ARTICLES[0].title}
            nmId={DEMO_ARTICLES[0].nmId}
            advertId={DEMO_CAMPAIGN_WB_ID}
            dateLabel="Запущен: 01.09.2026 10:14"
            rotation="Ротация: каждые 1 ч"
            stop="Стоп: 7 дн. · до 08.09.2026"
            finish="По завершении: оставить победителя"
            insight="данных мало"
            status={{ bg: '#DCFCE7', color: '#166534', text: 'Включен' }}
            variants={FIRST_VARIANTS}
            switchOn
            tourAnchors
          />
          <DemoAbTestCard
            title={DEMO_ARTICLES[1].title}
            nmId={DEMO_ARTICLES[1].nmId}
            advertId={DEMO_CAMPAIGN_WB_ID_SECOND}
            dateLabel="Запущен: 28.08.2026 18:02"
            rotation="Ротация: каждые 30 мин"
            stop="Стоп: 3 дн. · до 31.08.2026"
            finish="По завершении: оставить победителя"
            insight="данных мало"
            status={{ bg: '#DCFCE7', color: '#166534', text: 'Включен' }}
            variants={SECOND_VARIANTS}
            switchOn
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Учебная карточка одного А/Б-теста с вариантами и метриками.
 */
export function DemoAbTestDetail() {
  const variants = FIRST_VARIANTS.slice(0, 4)
  return (
    <div style={{ minHeight: '100vh', background: colors.bgGray }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 48px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '16px 0 8px' }}>{DEMO_ARTICLES[0].title}</h1>
        <div style={{ color: '#64748B', marginBottom: 8 }}>
          {DEMO_ARTICLES[0].nmId} · рк {DEMO_CAMPAIGN_WB_ID}
        </div>
        <div
          data-tour-id={ONBOARDING_TARGETS.AB_TEST_DETAIL_SETTINGS}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px 24px',
            color: '#64748B',
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          <div>
            <span style={{ color: '#94A3B8' }}>Периодичность ротации: </span>
            каждые 1 ч
          </div>
          <div>
            <span style={{ color: '#94A3B8' }}>Когда остановить тест: </span>
            7 дн. · до 08.09.2026
          </div>
          <div>
            <span style={{ color: '#94A3B8' }}>По завершении: </span>
            оставить победителя
          </div>
        </div>
        <div
          data-tour-id={ONBOARDING_TARGETS.AB_TEST_DETAIL_VARIANTS}
          style={{ display: 'grid', gridTemplateColumns: `repeat(${variants.length}, minmax(140px, 1fr))`, gap: 16 }}
        >
          {variants.map((variant, index) => (
            <div
              key={index}
              style={{
                background: '#fff',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.lg,
                padding: 12,
              }}
            >
              <div style={{ height: 22, marginBottom: 6 }}>
                {variant.activeOnWb ? (
                  <span
                    data-tour-id={ONBOARDING_TARGETS.AB_TEST_DETAIL_ACTIVE_WB}
                    style={{ color: '#16A34A', fontWeight: 600, fontSize: 13 }}
                  >
                    Сейчас на ВБ
                  </span>
                ) : null}
              </div>
              <DemoProductThumb index={index} width="100%" height={220} />
              <div style={{ marginTop: 10, fontWeight: 700, marginBottom: 8, color: variant.winning ? '#16A34A' : undefined }}>
                CTR {variant.ctr}
              </div>
              <MetricLine label="Доля показов" value={variant.share} />
              <MetricLine label="CR1" value={variant.cr1} />
              <MetricLine label="CR" value={variant.cr} />
              <MetricLine label="Показы" value={variant.views} />
              <MetricLine label="Клики" value={variant.clicks} />
              <MetricLine label="В корзину" value={variant.atbs} />
              <MetricLine label="Заказы" value={variant.orders} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
      <span style={{ color: '#64748B' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}
