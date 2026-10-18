import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Collapse } from 'antd'
import {
  AimOutlined,
  ApartmentOutlined,
  BarChartOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  EyeOutlined,
  PercentageOutlined,
  PictureOutlined,
  PieChartOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import {
  SERVICE_LANDING_ANCHORS,
  serviceAbout,
  serviceAgencyHelp,
  serviceAnalyticsOverview,
  serviceBlog,
  serviceCampaignDepth,
  serviceCapabilities,
  serviceFaq,
  serviceFinalCta,
  serviceHero,
  serviceLandingAssets,
  serviceLessManual,
  serviceOnboarding,
  servicePricing,
  serviceProblem,
  serviceProducts,
  serviceWhySeparate,
} from '../../content/landingServiceContent'
import type { LandingLeadRequest } from '../../types/landingLead'
import { landingRadii } from '../../styles/landing'
import SiteLogo from '../SiteLogo'
import ServiceLandingHeroVisual from './ServiceLandingHeroVisual'
import {
  svc,
  svcContainer,
  svcSection,
  SvcLead,
  SvcPrimaryButton,
  SvcTitle,
  ToneIconBox,
} from './landingServiceShared'

interface Props {
  onOpenLeadForm: (request: LandingLeadRequest) => void
}

function formatPrice(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`
}

export default function ServiceLandingSections({ onOpenLeadForm }: Props) {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<'twoWeeks' | 'month'>('twoWeeks')

  const goRegister = () => navigate('/register')

  const pricingPeriodLabel = period === 'twoWeeks' ? '/ 2 недели' : '/ 1 месяц'

  const faqItems = useMemo(
    () =>
      serviceFaq.items.map((item, index) => ({
        key: String(index),
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                background: index % 2 === 0 ? svc.accentSoft : svc.greenSoft,
                color: index % 2 === 0 ? svc.accent : svc.greenDark,
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span style={{ fontWeight: 600, color: svc.text }}>{item.q}</span>
          </div>
        ),
        children: <p style={{ margin: 0, color: svc.muted, lineHeight: 1.6 }}>{item.a}</p>,
      })),
    []
  )

  return (
    <>
      <style>{`
        .svc-hero-grid, .svc-two, .svc-compare, .svc-caps, .svc-products, .svc-steps, .svc-price, .svc-help, .svc-blog {
          display: grid; gap: 28px; align-items: center;
        }
        .svc-hero-grid { grid-template-columns: 0.82fr 1.28fr; }
        .svc-two { grid-template-columns: 1.1fr 0.9fr; }
        .svc-analytics-grid { grid-template-columns: 1.15fr 1.05fr; gap: 24px; align-items: center; }
        .svc-compare { grid-template-columns: 1fr 1fr; align-items: stretch; }
        /* Макет: 6 карточек в один ряд */
        .svc-caps {
          grid-template-columns: repeat(6, minmax(0, 1fr));
          align-items: stretch;
          gap: 16px;
        }
        .svc-products { grid-template-columns: repeat(3, 1fr); align-items: stretch; }
        .svc-steps { grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: stretch; gap: 20px; }
        .svc-price { grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: stretch; gap: 18px; }
        .svc-help { grid-template-columns: 1fr 1fr; align-items: stretch; gap: 24px; }
        .svc-blog { grid-template-columns: repeat(4, 1fr); align-items: stretch; }
        .svc-primary-btn:hover { background: ${svc.accentHover} !important; }
        .svc-img { width: 100%; height: auto; display: block; border-radius: 16px; }
        @media (max-width: 1200px) {
          .svc-caps { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 1100px) {
          .svc-products, .svc-price, .svc-blog { grid-template-columns: repeat(2, 1fr) !important; }
          .svc-steps { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .svc-hero-grid, .svc-two, .svc-compare, .svc-help, .svc-analytics-grid { grid-template-columns: 1fr !important; }
          .svc-less-manual-art {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            transform: none !important;
            width: min(420px, 100%) !important;
            margin: 8px auto 0 !important;
            display: block;
          }
          .svc-less-manual-stage { display: flex; flex-direction: column; }
          .svc-less-manual-stage .svc-two { order: 1; }
          .svc-less-manual-art { order: 2; }
        }
        @media (max-width: 560px) {
          .svc-caps, .svc-products, .svc-price, .svc-blog, .svc-steps { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Hero */}
      <section style={svcSection({ paddingTop: 48 })}>
        <div style={svcContainer()}>
          <div className="svc-hero-grid">
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '6px 12px',
                  borderRadius: landingRadii.pill,
                  border: `1px solid ${svc.accent}`,
                  color: svc.accent,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: 18,
                }}
              >
                {serviceHero.badge}
              </div>
              <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.12, fontWeight: 700, color: svc.text }}>
                {serviceHero.titleBefore}{' '}
                <span style={{ color: svc.accent }}>{serviceHero.titleHighlight}</span>
              </h1>
              <p style={{ margin: '0 0 24px', fontSize: 17, lineHeight: 1.6, color: svc.muted, maxWidth: 520 }}>
                {serviceHero.subtitle}
              </p>
              <SvcPrimaryButton onClick={goRegister}>{serviceHero.cta}</SvcPrimaryButton>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 28 }}>
                {serviceHero.perks.map((p) => (
                  <div
                    key={p.title}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 14,
                      color: svc.text,
                      fontWeight: 500,
                      lineHeight: 1.25,
                      maxWidth: 168,
                    }}
                  >
                    <ToneIconBox tone={p.tone}>
                      {p.icon === 'shield' ? (
                        <SafetyCertificateOutlined />
                      ) : p.icon === 'gear' ? (
                        <SettingOutlined />
                      ) : (
                        <BarChartOutlined />
                      )}
                    </ToneIconBox>
                    <span>
                      {p.lines.map((line) => (
                        <span key={line} style={{ display: 'block' }}>
                          {line}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <ServiceLandingHeroVisual />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section style={svcSection()}>
        <div style={svcContainer()}>
          <div className="svc-two">
            <div>
              <h2 style={{ margin: 0, fontSize: 'clamp(28px, 3vw, 38px)', lineHeight: 1.2, fontWeight: 700 }}>
                {serviceProblem.titleLines.map((line) => (
                  <span key={line.text} style={{ display: 'block', color: line.tone === 'accent' ? svc.accent : svc.text }}>
                    {line.text}
                  </span>
                ))}
              </h2>
              {serviceProblem.paragraphs.map((p) => (
                <p key={p.slice(0, 24)} style={{ margin: '14px 0 0', color: svc.muted, lineHeight: 1.65, fontSize: 15 }}>
                  {p}
                </p>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {serviceProblem.items.map((item, i) => (
                <div
                  key={item.title}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    padding: '18px 0',
                    borderBottom: i === serviceProblem.items.length - 1 ? 'none' : `1px solid ${svc.border}`,
                  }}
                >
                  <ToneIconBox tone={item.tone}>
                    {item.tone === 'green' ? <ShoppingCartOutlined /> : <WalletOutlined />}
                  </ToneIconBox>
                  <div>
                    <div style={{ fontWeight: 700, color: svc.text, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ color: svc.muted, fontSize: 14, lineHeight: 1.45 }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Analytics overview */}
      <section className="svc-section-soft" style={svcSection()}>
        <div style={svcContainer()}>
          <div className="svc-two svc-analytics-grid" style={{ alignItems: 'center' }}>
            <div style={{ maxWidth: 580 }}>
              <SvcTitle
                before={serviceAnalyticsOverview.titleBefore}
                after={serviceAnalyticsOverview.titleAfter}
                afterOnNewLine
                highlight={serviceAnalyticsOverview.titleHighlight}
                highlightOnNewLine={serviceAnalyticsOverview.highlightOnNewLine}
                size="lg"
              />
              <SvcLead large>{serviceAnalyticsOverview.subtitle}</SvcLead>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '0.92fr 0.92fr 1.5fr',
                  gap: 10,
                  marginTop: 28,
                }}
              >
                {serviceAnalyticsOverview.badges.map((b) => (
                  <span
                    key={b.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: b.lines.length > 1 ? 'flex-start' : 'center',
                      gap: 10,
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: '#fff',
                      border: `1px solid ${svc.border}`,
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
                      fontSize: b.lines.length > 1 ? 13 : 14,
                      fontWeight: 600,
                      color: svc.text,
                      lineHeight: 1.25,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        color: b.tone === 'green' ? svc.green : svc.accent,
                        fontSize: 18,
                        display: 'inline-flex',
                        flexShrink: 0,
                      }}
                    >
                      {b.icon === 'cart' ? (
                        <ShoppingCartOutlined />
                      ) : b.icon === 'trend' ? (
                        <RiseOutlined />
                      ) : (
                        <BarChartOutlined />
                      )}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      {b.lines.map((line) => (
                        <span key={line} style={{ display: 'block' }}>
                          {line}
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 28 }}>
                <SvcPrimaryButton onClick={goRegister}>{serviceAnalyticsOverview.cta}</SvcPrimaryButton>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              {/* Расплывчатые пятна за стеком — без жёстких граней */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '-6%',
                  right: '-18%',
                  width: 340,
                  height: 340,
                  borderRadius: '50%',
                  background: 'rgba(124, 58, 237, 0.32)',
                  filter: 'blur(72px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '32%',
                  left: '-14%',
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  background: 'rgba(167, 139, 250, 0.28)',
                  filter: 'blur(68px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  bottom: '-4%',
                  right: '-8%',
                  width: 260,
                  height: 260,
                  borderRadius: '50%',
                  background: 'rgba(180, 215, 5, 0.22)',
                  filter: 'blur(64px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
              <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 10 }}>
                {[
                  serviceLandingAssets.analyticsStack1,
                  serviceLandingAssets.analyticsStack2,
                  serviceLandingAssets.analyticsStack3,
                ].map((src) => (
                  <img
                    key={src}
                    className="svc-img"
                    src={src}
                    alt=""
                    onLoad={(e) => {
                      const img = e.currentTarget
                      const naturalRatio = img.naturalHeight / img.naturalWidth
                      // Сжимаем по высоте (~8%), без обрезки — весь кадр остаётся видимым
                      img.style.height = `${img.clientWidth * naturalRatio * 0.92}px`
                      img.style.objectFit = 'fill'
                    }}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      borderRadius: 16,
                      boxShadow: '0 14px 36px rgba(76, 29, 149, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06)',
                      border: '1px solid rgba(226, 232, 240, 0.9)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why separate */}
      <section style={svcSection()}>
        <div style={svcContainer()}>
          <div style={{ maxWidth: 780, marginBottom: 32 }}>
            <SvcTitle before={serviceWhySeparate.titleBefore} highlight={serviceWhySeparate.titleHighlight} />
            <p style={{ margin: '14px 0 0', fontSize: 16, lineHeight: 1.6, color: svc.muted, maxWidth: 720 }}>
              {serviceWhySeparate.subtitleLines.map((line) => (
                <span key={line} style={{ display: 'block' }}>
                  {line}
                </span>
              ))}
            </p>
          </div>
          <div className="svc-compare">
            <div style={{ background: '#fff', border: `1px solid ${svc.border}`, borderRadius: 20, padding: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 18,
                  color: svc.text,
                }}
              >
                <img
                  src="/marketplace/wb.svg"
                  alt="Wildberries"
                  width={40}
                  height={40}
                  style={{ display: 'block', borderRadius: 10, flexShrink: 0 }}
                />
                {serviceWhySeparate.left.title}
              </div>
              {serviceWhySeparate.left.items.map((item, index) => (
                <div key={item.title} style={{ paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <CloseCircleFilled style={{ color: '#EF4444', fontSize: 28, flexShrink: 0, lineHeight: 1 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: svc.text }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: svc.muted }}>{item.description}</div>
                    </div>
                  </div>
                  {index < serviceWhySeparate.left.items.length - 1 ? (
                    <div style={{ marginLeft: 44, marginTop: 14, borderBottom: `1px solid ${svc.border}` }} />
                  ) : null}
                </div>
              ))}
            </div>
            <div
              style={{
                background: 'linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 100%)',
                border: `2px solid ${svc.accent}`,
                borderRadius: 20,
                padding: 24,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <SiteLogo variant="mark" size={40} borderRadius={10} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: svc.text, lineHeight: 1.2 }}>
                    {serviceWhySeparate.right.title}
                  </div>
                  <div style={{ color: svc.muted, fontSize: 13, lineHeight: 1.35, marginTop: 2 }}>
                    {serviceWhySeparate.right.subtitle}
                  </div>
                </div>
              </div>
              {serviceWhySeparate.right.items.map((item, index) => (
                <div key={item.title} style={{ paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <CheckCircleFilled style={{ color: '#22C55E', fontSize: 28, flexShrink: 0, lineHeight: 1 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: svc.text }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: svc.muted }}>{item.description}</div>
                    </div>
                  </div>
                  {index < serviceWhySeparate.right.items.length - 1 ? (
                    <div style={{ marginLeft: 44, marginTop: 14, borderBottom: `1px solid ${svc.border}` }} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Campaign depth */}
      <section style={svcSection({ paddingBottom: 110 })}>
        <div style={svcContainer()}>
          <div
            className="svc-two"
            style={{
              alignItems: 'start',
              gap: 20,
              gridTemplateColumns: '1.05fr 1.2fr',
            }}
          >
            <div style={{ maxWidth: 560, marginTop: -18 }}>
              <SvcTitle
                before={serviceCampaignDepth.titleBefore}
                after={serviceCampaignDepth.titleAfter}
                highlight={serviceCampaignDepth.titleHighlight}
                afterOnNewLine={serviceCampaignDepth.afterOnNewLine}
                highlightOnNewLine={serviceCampaignDepth.highlightOnNewLine}
                size="lg"
                lineHeight={1.05}
              />
              <SvcLead>{serviceCampaignDepth.subtitle}</SvcLead>
              <div style={{ marginTop: 22 }}>
                <SvcPrimaryButton onClick={goRegister}>{serviceCampaignDepth.cta}</SvcPrimaryButton>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: 10,
                  marginTop: 28,
                }}
              >
                {serviceCampaignDepth.metrics.map((m) => (
                  <div
                    key={m.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: '#fff',
                      border: `1px solid ${svc.border}`,
                      borderRadius: 12,
                      padding: '12px 8px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: svc.text,
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <span
                      style={{
                        color: m.tone === 'green' ? svc.green : svc.accent,
                        fontSize: 16,
                        display: 'inline-flex',
                        flexShrink: 0,
                      }}
                    >
                      {m.icon === 'eye' ? (
                        <EyeOutlined />
                      ) : m.icon === 'click' ? (
                        <AimOutlined />
                      ) : m.icon === 'percent' ? (
                        <PercentageOutlined />
                      ) : m.icon === 'ruble' ? (
                        <span style={{ fontWeight: 700, fontSize: 15, lineHeight: 1 }}>₽</span>
                      ) : m.icon === 'wallet' ? (
                        <WalletOutlined />
                      ) : m.icon === 'cart' ? (
                        <ShoppingCartOutlined />
                      ) : m.icon === 'bars' ? (
                        <BarChartOutlined />
                      ) : (
                        <PieChartOutlined />
                      )}
                    </span>
                    <span style={{ whiteSpace: m.label.length > 10 ? 'normal' : 'nowrap', textAlign: 'left', lineHeight: 1.2 }}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', width: '108%', marginRight: '-8%', paddingBottom: 36, overflow: 'visible' }}>
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '-8%',
                  right: '-10%',
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  background: 'rgba(124, 58, 237, 0.2)',
                  filter: 'blur(70px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
              <img
                className="svc-img"
                src={serviceLandingAssets.campaignDetail}
                alt=""
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  borderRadius: 16,
                  boxShadow: '0 18px 48px rgba(15, 23, 42, 0.12)',
                  border: `1px solid ${svc.border}`,
                }}
              />
              {serviceCampaignDepth.callouts.map((c) => {
                const isPurple = c.tone === 'purple'
                const stroke = isPurple ? svc.accent : svc.green
                const markerId = `svc-callout-arrow-${c.place}`
                const placeStyle =
                  c.place === 'topRight'
                    ? { top: '-6%', right: '14%' }
                    : c.place === 'bottom'
                      ? { bottom: '-5%', left: '8%' }
                      : { bottom: '4%', right: '5%' }
                const arrowWrapStyle =
                  c.place === 'topRight'
                    ? { top: '3%', right: '36%', width: 150, height: 48 }
                    : c.place === 'bottom'
                      ? { bottom: '4%', left: '18%', width: 100, height: 70 }
                      : { bottom: '10%', right: '22%', width: 120, height: 56 }
                // topRight — влево к товарам; bottom — снизу вверх в таблицу; bottomRight — влево
                const arrowPath =
                  c.place === 'topRight'
                    ? 'M 142 8 C 100 4, 56 12, 16 24'
                    : c.place === 'bottom'
                      ? 'M 20 62 C 28 40, 40 18, 52 6'
                      : 'M 116 40 C 84 10, 48 8, 8 26'
                return (
                  <div key={c.text}>
                    <div
                      style={{
                        position: 'absolute',
                        zIndex: 3,
                        maxWidth: c.place === 'bottomRight' ? 148 : 190,
                        width: 'max-content',
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: isPurple ? 'rgba(243, 232, 255, 0.96)' : 'rgba(236, 252, 203, 0.96)',
                        border: isPurple
                          ? '1px solid rgba(124, 58, 237, 0.35)'
                          : '1px solid rgba(163, 201, 0, 0.45)',
                        color: isPurple ? svc.accent : '#3F6212',
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: 1.35,
                        boxShadow: isPurple
                          ? '0 8px 20px rgba(124, 58, 237, 0.12)'
                          : '0 8px 20px rgba(63, 98, 18, 0.12)',
                        ...placeStyle,
                      }}
                    >
                      {c.text}
                    </div>
                    <svg
                      aria-hidden
                      viewBox={
                        c.place === 'topRight' ? '0 0 150 36' : c.place === 'bottom' ? '0 0 70 70' : '0 0 120 50'
                      }
                      style={{
                        position: 'absolute',
                        zIndex: 2,
                        pointerEvents: 'none',
                        overflow: 'visible',
                        ...arrowWrapStyle,
                      }}
                    >
                      <defs>
                        <marker
                          id={markerId}
                          markerWidth="7"
                          markerHeight="7"
                          refX="6"
                          refY="3.5"
                          orient="auto"
                        >
                          <path d="M0,0 L7,3.5 L0,7 Z" fill={stroke} />
                        </marker>
                      </defs>
                      <path
                        d={arrowPath}
                        fill="none"
                        stroke={stroke}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        markerEnd={`url(#${markerId})`}
                      />
                    </svg>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Less manual */}
      <section style={svcSection()}>
        <div style={svcContainer()}>
          <div style={{ maxWidth: 720, marginBottom: 28 }}>
            <SvcTitle
              before={serviceLessManual.titleBefore}
              highlight={serviceLessManual.titleHighlight}
              highlightOnNewLine
              size="lg"
              lineHeight={1.1}
            />
            <SvcLead>{serviceLessManual.subtitle}</SvcLead>
          </div>
          <div
            className="svc-less-manual-stage"
            style={{ position: 'relative' }}
          >
            <div
              className="svc-two"
              style={{
                gridTemplateColumns: '0.88fr 1.22fr',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Широкая карточка: текст слева, справа пустота под наезд картинки */}
              <div
                style={{
                  background: '#FCFAFF',
                  border: '1px solid rgba(124, 58, 237, 0.12)',
                  borderRadius: 18,
                  padding: '18px 20px 18px 20px',
                  boxShadow: '0 12px 36px rgba(124, 58, 237, 0.06)',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ maxWidth: 320 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '5px 12px',
                      borderRadius: landingRadii.pill,
                      background: '#E8ECF4',
                      color: svc.text,
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      marginBottom: 10,
                    }}
                  >
                    {serviceLessManual.insteadTitle}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 18,
                      marginBottom: 18,
                      color: svc.text,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {serviceLessManual.insteadSubtitle}
                  </div>
                  {serviceLessManual.steps.map((s, i) => (
                    <div
                      key={s.title}
                      style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: i < serviceLessManual.steps.length - 1 ? 14 : 0,
                      }}
                    >
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: svc.softBg,
                          border: `1px solid ${svc.border}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: svc.muted,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, color: svc.text }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: svc.muted, lineHeight: 1.35, whiteSpace: 'pre-line' }}>
                          {s.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  borderRadius: 16,
                  padding: '10px 10px 6px',
                  boxSizing: 'border-box',
                  border: '1.5px solid rgba(124, 58, 237, 0.45)',
                  background: '#fff',
                  boxShadow: '0 18px 48px rgba(15, 23, 42, 0.12)',
                  lineHeight: 0,
                  overflow: 'hidden',
                  transform: 'translateX(36px) scaleX(0.94) scaleY(1)',
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={serviceLandingAssets.dashboard}
                  alt=""
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    borderRadius: 10,
                    marginBottom: 0,
                  }}
                />
              </div>
            </div>
            {/* Картинка налезает на пустую правую часть карточки */}
            <img
              src={serviceLandingAssets.manualWork}
              alt=""
              className="svc-less-manual-art"
              style={{
                position: 'absolute',
                left: '13%',
                top: '52%',
                transform: 'translateY(-50%) scaleX(0.96)',
                transformOrigin: 'center center',
                width: '38%',
                maxWidth: 480,
                height: 'auto',
                objectFit: 'contain',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          </div>
        </div>
      </section>

      {/* Capabilities — макет: 6 карточек в ряд, иконки из макета 7.png */}
      <section id={SERVICE_LANDING_ANCHORS.features} style={svcSection()}>
        <div style={svcContainer()}>
          <div style={{ maxWidth: 720, marginBottom: 28 }}>
            <SvcTitle
              before={serviceCapabilities.titleBefore}
              highlight={serviceCapabilities.titleHighlight}
              size="lg"
              lineHeight={1.15}
            />
            <SvcLead>{serviceCapabilities.subtitle}</SvcLead>
          </div>
          <div className="svc-caps">
            {serviceCapabilities.items.map((item) => (
              <div
                key={item.title}
                style={{
                  background: '#F8FAFC',
                  border: `1px solid ${svc.border}`,
                  borderRadius: 20,
                  padding: '20px 16px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  minHeight: 220,
                }}
              >
                <img
                  src={item.icon}
                  alt=""
                  style={{
                    width: 56,
                    height: 56,
                    objectFit: 'contain',
                    display: 'block',
                    marginBottom: 14,
                  }}
                />
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 8,
                    color: svc.text,
                    fontSize: 15,
                    lineHeight: 1.3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.title}
                </div>
                <div style={{ color: svc.muted, fontSize: 13, lineHeight: 1.45 }}>{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section style={svcSection()}>
        <div style={svcContainer()}>
          <div className="svc-products">
            {serviceProducts.map((p) => {
              const cardBg =
                p.tone === 'green' ? '#F0FDF4' : p.tone === 'blue' ? '#EFF6FF' : '#F5F3FF'
              return (
              <div
                key={p.id}
                style={{
                  background: cardBg,
                  border: `1px solid ${svc.border}`,
                  borderRadius: 20,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 16,
                  }}
                >
                  <img
                    src={p.icon}
                    alt=""
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: 'contain',
                      flexShrink: 0,
                      display: 'block',
                      borderRadius: 16,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 20, lineHeight: 1.25 }}>{p.title}</div>
                    <div style={{ color: svc.muted, fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>
                      {p.subtitle}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: `1px solid ${svc.border}`,
                    lineHeight: 0,
                    aspectRatio: '455 / 426',
                  }}
                >
                  <img
                    src={p.image}
                    alt={p.title}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      objectFit: p.id === 'ab' ? 'fill' : 'cover',
                      objectPosition: 'top center',
                    }}
                  />
                </div>
                <div style={{ marginTop: 16, flex: 1 }}>
                  {p.bullets.map((b) => (
                    <div
                      key={b}
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginBottom: 8,
                        fontSize: 13,
                        color: svc.text,
                      }}
                    >
                      <CheckCircleFilled style={{ color: p.tone === 'green' ? '#16A34A' : svc.accent, marginTop: 2 }} />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section id={SERVICE_LANDING_ANCHORS.about} className="svc-section-soft" style={svcSection()}>
        <div style={svcContainer()}>
          <div
            className="svc-two"
            style={{ gridTemplateColumns: '0.72fr 1.28fr', alignItems: 'center', gap: 8 }}
          >
            <div style={{ maxWidth: 400, marginLeft: 20 }}>
              <SvcTitle
                before={serviceAbout.titleBefore}
                highlight={serviceAbout.titleHighlight}
                highlightOnNewLine
                size="lg"
                lineHeight={1.12}
              />
              {serviceAbout.paragraphs.map((p, idx) => (
                <p
                  key={p.slice(0, 20)}
                  style={{
                    margin: idx === 0 ? '22px 0 0' : '16px 0 0',
                    color: svc.muted,
                    fontSize: 18,
                    lineHeight: 1.65,
                  }}
                >
                  {p}
                </p>
              ))}
            </div>
            <div
              className="svc-about-visual"
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 780,
                marginLeft: 24,
                padding: '28px 28px 16px 0',
                boxSizing: 'border-box',
              }}
            >
              <img
                src={serviceLandingAssets.team}
                alt="Команда Clicki"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: 0,
                  background: 'transparent',
                }}
              />
              {serviceAbout.floats.map((f) => {
                const placeStyle =
                  f.place === 'topLeft'
                    ? { top: 56, left: 0 }
                    : f.place === 'midRight'
                      ? { top: '38%', right: 0 }
                      : { bottom: 28, left: 4 }
                return (
                  <div
                    key={f.id}
                    style={{
                      position: 'absolute',
                      ...placeStyle,
                      zIndex: 2,
                      background: '#fff',
                      borderRadius: 16,
                      padding: f.kind === 'bars' ? '12px 14px 10px' : '12px 14px 8px',
                      boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
                      border: '1px solid rgba(226, 232, 240, 0.9)',
                      minWidth: f.kind === 'bars' ? 168 : 148,
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: f.kind === 'bars' ? 10 : 6,
                      }}
                    >
                      {f.kind === 'bars' ? (
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: svc.accentSoft,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <BarChartOutlined style={{ color: svc.accent, fontSize: 12 }} />
                        </span>
                      ) : null}
                      {f.kind === 'lineGreen' ? (
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: svc.greenSoft,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <ShoppingCartOutlined style={{ color: '#65A30D', fontSize: 12 }} />
                        </span>
                      ) : null}
                      <span style={{ fontSize: 12, fontWeight: 600, color: svc.text, lineHeight: 1.2 }}>
                        {f.title}
                      </span>
                    </div>
                    {'value' in f && f.value ? (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: svc.text, letterSpacing: '-0.02em' }}>
                          {f.value}
                        </span>
                        {'delta' in f && f.delta ? (
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>{f.delta}</span>
                        ) : null}
                      </div>
                    ) : null}
                    {f.kind === 'bars' ? (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36 }}>
                        {[40, 55, 35, 70, 48, 85, 60].map((h, i) => (
                          <span
                            key={i}
                            style={{
                              flex: 1,
                              height: `${h}%`,
                              borderRadius: 3,
                              background: i % 2 === 0 ? svc.accent : '#C4B5FD',
                              display: 'block',
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <svg width="100%" height="28" viewBox="0 0 120 28" preserveAspectRatio="none">
                        <path
                          d={
                            f.kind === 'lineGreen'
                              ? 'M0 20 C 16 18, 24 8, 40 12 S 64 22, 80 10 S 104 6, 120 14'
                              : 'M0 16 C 18 14, 28 22, 44 18 S 72 6, 88 12 S 108 20, 120 10'
                          }
                          fill="none"
                          stroke={f.kind === 'lineGreen' ? '#84CC16' : svc.accent}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding */}
      <section style={svcSection()}>
        <div style={svcContainer()}>
          <div style={{ maxWidth: 640, marginBottom: 32 }}>
            <SvcTitle
              before={serviceOnboarding.titleBefore}
              highlight={serviceOnboarding.titleHighlight}
              size="lg"
              lineHeight={1.15}
            />
            <SvcLead large>{serviceOnboarding.subtitle}</SvcLead>
          </div>
          <div className="svc-steps">
            {serviceOnboarding.steps.map((s) => (
              <div
                key={s.n}
                style={{
                  background: '#fff',
                  border: `1px solid ${svc.border}`,
                  borderRadius: 18,
                  padding: '22px 20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
                  minHeight: 100,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: 16,
                    background: s.tone === 'green' ? svc.greenSoft : svc.accentSoft,
                    color: s.tone === 'green' ? svc.greenDark : svc.accent,
                    flexShrink: 0,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 19,
                    lineHeight: 1.3,
                    color: svc.text,
                    marginBottom: 10,
                    minHeight: '2.6em',
                  }}
                >
                  {s.title}
                </div>
                <div style={{ color: svc.muted, fontSize: 15, lineHeight: 1.55 }}>{s.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id={SERVICE_LANDING_ANCHORS.pricing} className="svc-section-soft" style={svcSection()}>
        <div style={svcContainer()}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 24,
              marginBottom: 32,
            }}
          >
            <div style={{ maxWidth: 720, minWidth: 0 }}>
              <div style={{ whiteSpace: 'nowrap' }}>
                <SvcTitle
                  before={servicePricing.titleBefore}
                  highlight={servicePricing.titleHighlight}
                  size="lg"
                  lineHeight={1.15}
                />
              </div>
              <SvcLead large>{servicePricing.subtitle}</SvcLead>
            </div>

            {/* Переключатель справа, чуть левее от края */}
            <div style={{ width: 300, maxWidth: '100%', marginRight: 110, marginTop: 4 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  columnGap: 12,
                  marginBottom: 6,
                  minHeight: 70,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: svc.accent,
                      lineHeight: 1.25,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {servicePricing.periodHintTwoWeeks}
                  </div>
                  {/* Сверху вниз и направо → в «2 недели»; кончик через marker */}
                  <svg width="54" height="30" viewBox="0 0 54 30" aria-hidden style={{ display: 'block', marginTop: 2, marginLeft: 28 }}>
                    <defs>
                      <marker
                        id="svc-arr-purple"
                        markerWidth="7"
                        markerHeight="7"
                        refX="5"
                        refY="3.5"
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <path
                          d="M1 1 L5.5 3.5 L1 6"
                          fill="none"
                          stroke={svc.accent}
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </marker>
                    </defs>
                    <path
                      d="M4 2 C 10 10, 24 18, 40 25"
                      fill="none"
                      stroke={svc.accent}
                      strokeWidth="1.55"
                      strokeLinecap="round"
                      markerEnd="url(#svc-arr-purple)"
                    />
                  </svg>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 8, marginLeft: 18, transform: 'translateX(80px)' }}>
                  {/* Стрелка слева, текст правее стрелочки */}
                  <svg width="48" height="40" viewBox="0 0 48 40" aria-hidden style={{ display: 'block', flexShrink: 0, marginTop: 22 }}>
                    <defs>
                      <marker
                        id="svc-arr-green"
                        markerWidth="7"
                        markerHeight="7"
                        refX="5"
                        refY="3.5"
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <path
                          d="M1 1 L5.5 3.5 L1 6"
                          fill="none"
                          stroke="#3D9B1C"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </marker>
                    </defs>
                    <path
                      d="M40 2 C 30 10, 18 20, 8 34"
                      fill="none"
                      stroke="#3D9B1C"
                      strokeWidth="1.55"
                      strokeLinecap="round"
                      markerEnd="url(#svc-arr-green)"
                    />
                  </svg>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#3D9B1C',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div>Выгоднее для</div>
                    <div>постоянной</div>
                    <div>работы</div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  background: '#fff',
                  borderRadius: landingRadii.pill,
                  border: `1px solid ${svc.border}`,
                  padding: 4,
                  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.06)',
                  boxSizing: 'border-box',
                }}
              >
                <button
                  type="button"
                  onClick={() => setPeriod('twoWeeks')}
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: landingRadii.pill,
                    height: 40,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 14,
                    background: period === 'twoWeeks' ? svc.accent : 'transparent',
                    color: period === 'twoWeeks' ? '#fff' : svc.text,
                  }}
                >
                  2 недели
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('month')}
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: landingRadii.pill,
                    height: 40,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 14,
                    background: period === 'month' ? svc.accent : 'transparent',
                    color: period === 'month' ? '#fff' : svc.text,
                  }}
                >
                  1 месяц
                </button>
              </div>
            </div>
          </div>

          <div className="svc-price">
            {servicePricing.plans.map((plan) => {
              const price = period === 'twoWeeks' ? plan.priceTwoWeeks : plan.priceMonth
              const iconTone = plan.icon === 'building' ? 'green' : 'purple'
              const PlanIcon =
                plan.icon === 'user'
                  ? UserOutlined
                  : plan.icon === 'chart'
                    ? BarChartOutlined
                    : plan.icon === 'team'
                      ? TeamOutlined
                      : ApartmentOutlined
              return (
                <div
                  key={plan.id}
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    padding: '24px 22px 22px',
                    border: plan.popular ? `2px solid ${svc.accent}` : `1px solid ${svc.border}`,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: plan.popular
                      ? '0 14px 36px rgba(124, 58, 237, 0.12)'
                      : '0 8px 24px rgba(15, 23, 42, 0.04)',
                    boxSizing: 'border-box',
                  }}
                >
                  {plan.popular ? (
                    <span
                      style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        background: svc.accent,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: 999,
                        padding: '5px 12px',
                      }}
                    >
                      ★ Популярный
                    </span>
                  ) : null}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: iconTone === 'green' ? svc.greenSoft : svc.accentSoft,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <PlanIcon
                      style={{
                        color: iconTone === 'green' ? '#65A30D' : svc.accent,
                        fontSize: 20,
                      }}
                    />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 22, color: svc.text, marginBottom: 4 }}>
                    {plan.name}
                  </div>
                  <div style={{ color: svc.muted, fontSize: 14, marginBottom: 18 }}>{plan.cabinets}</div>
                  {price == null ? (
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: svc.text,
                        lineHeight: 1.25,
                        marginBottom: 28,
                        minHeight: 52,
                      }}
                    >
                      Индивидуальные условия
                    </div>
                  ) : (
                    <div style={{ marginBottom: 28, minHeight: 52 }}>
                      <div style={{ fontSize: 32, fontWeight: 700, color: svc.text, letterSpacing: '-0.02em' }}>
                        {formatPrice(price)}
                      </div>
                      <div style={{ color: svc.muted, fontSize: 14, marginTop: 4 }}>{pricingPeriodLabel}</div>
                    </div>
                  )}
                  <button
                    type="button"
                    className={plan.popular ? 'svc-primary-btn' : undefined}
                    onClick={() => {
                      if ('consultation' in plan && plan.consultation) {
                        onOpenLeadForm({ type: 'consultation', source: 'landing-service-pricing' })
                        return
                      }
                      if ('to' in plan && plan.to) navigate(plan.to)
                    }}
                    style={{
                      marginTop: 'auto',
                      height: 46,
                      borderRadius: 12,
                      border: plan.popular ? 'none' : `1px solid ${svc.border}`,
                      background: plan.popular ? svc.accent : '#fff',
                      color: plan.popular ? '#fff' : svc.text,
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    {plan.cta}
                  </button>
                </div>
              )
            })}
          </div>

          <div
            className="svc-price-included"
            style={{
              marginTop: 24,
              background: '#F5F3FF',
              borderRadius: 18,
              padding: '16px 18px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 14, lineHeight: 1.3, color: svc.accent, flexShrink: 0 }}>
              <div>Во все тарифы</div>
              <div style={{ fontWeight: 700 }}>включены все возможности:</div>
            </div>
            <div
              aria-hidden
              style={{
                width: 1,
                alignSelf: 'stretch',
                minHeight: 44,
                background: 'rgba(124, 58, 237, 0.18)',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
                alignItems: 'center',
                flex: 1,
                minWidth: 0,
              }}
            >
              {servicePricing.includedItems.map((item) => {
                const ItemIcon =
                  item.icon === 'chart'
                    ? BarChartOutlined
                    : item.icon === 'photo'
                      ? PictureOutlined
                      : ClockCircleOutlined
                return (
                  <div
                    key={item.lines.join(' ')}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: '#EDE9FE',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ItemIcon style={{ color: svc.accent, fontSize: 16 }} />
                    </span>
                    <div style={{ fontSize: 13, lineHeight: 1.3, color: svc.text, fontWeight: 600 }}>
                      {item.lines.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <div
              style={{
                background: svc.greenSoft,
                color: svc.greenDark,
                borderRadius: 14,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.3,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#22C55E',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              <div>
                {servicePricing.onlyCabinetsLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agency help */}
      <section style={svcSection()}>
        <div style={svcContainer()}>
          <div style={{ maxWidth: 780, marginBottom: 32 }}>
            <SvcTitle
              before={serviceAgencyHelp.titleBefore}
              highlight={serviceAgencyHelp.titleHighlight}
              highlightOnNewLine
              size="lg"
              lineHeight={1.15}
            />
            <SvcLead large>{serviceAgencyHelp.subtitle}</SvcLead>
          </div>
          <div className="svc-help">
            {serviceAgencyHelp.cards.map((card) => (
              <div
                key={card.id}
                style={{
                  borderRadius: 22,
                  padding: '28px 28px 26px',
                  background: card.tone === 'green' ? '#F0FDF4' : '#F5F3FF',
                  display: 'flex',
                  flexDirection: 'column',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 24,
                    lineHeight: 1.25,
                    color: svc.text,
                    marginBottom: 10,
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    color: svc.muted,
                    marginBottom: 20,
                    lineHeight: 1.55,
                    fontSize: 15,
                    whiteSpace: card.id === 'audit' ? 'nowrap' : 'normal',
                  }}
                >
                  {card.description}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {card.bullets.map((b) => (
                    <div
                      key={b}
                      style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        fontSize: 15,
                        color: svc.text,
                        lineHeight: 1.4,
                      }}
                    >
                      <CheckCircleFilled
                        style={{
                          color: card.tone === 'green' ? '#16A34A' : svc.accent,
                          marginTop: 3,
                          fontSize: 16,
                        }}
                      />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, minHeight: 32 }} aria-hidden />
                <button
                  type="button"
                  className={card.tone === 'purple' ? 'svc-primary-btn' : undefined}
                  onClick={() =>
                    onOpenLeadForm({
                      type: card.formKind === 'agency' ? 'consultation' : 'audit',
                      source: card.id === 'manage' ? 'landing-service-manage' : 'landing-service-audit',
                    })
                  }
                  style={{
                    marginTop: 0,
                    height: 48,
                    border: 'none',
                    borderRadius: 14,
                    background: card.tone === 'green' ? '#0F172A' : svc.accent,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  {card.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id={SERVICE_LANDING_ANCHORS.faq} className="svc-section-soft" style={svcSection()}>
        <div style={svcContainer()}>
          <div className="svc-two" style={{ alignItems: 'start' }}>
            <div>
              <SvcTitle before={serviceFaq.titleBefore} highlight={serviceFaq.titleHighlight} />
              <SvcLead>{serviceFaq.subtitle}</SvcLead>
              <img className="svc-img" src={serviceLandingAssets.faq} alt="" style={{ marginTop: 24, maxWidth: 420 }} />
            </div>
            <Collapse items={faqItems} bordered={false} style={{ background: 'transparent' }} />
          </div>
        </div>
      </section>

      {/* Blog teaser */}
      <section id={SERVICE_LANDING_ANCHORS.blog} style={svcSection()}>
        <div style={svcContainer()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ maxWidth: 640 }}>
              <SvcTitle before={serviceBlog.titleBefore} highlight={serviceBlog.titleHighlight} />
              <SvcLead>{serviceBlog.subtitle}</SvcLead>
            </div>
            <button
              type="button"
              style={{
                height: 40,
                padding: '0 14px',
                borderRadius: 12,
                border: `1px solid ${svc.border}`,
                background: '#fff',
                cursor: 'default',
                fontWeight: 600,
              }}
            >
              {serviceBlog.allLabel} →
            </button>
          </div>
          <div className="svc-blog">
            {serviceBlog.items.map((item) => (
              <div
                key={item.title}
                style={{
                  background: svc.softBg,
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 220,
                }}
              >
                <span
                  style={{
                    alignSelf: 'flex-start',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    marginBottom: 12,
                    background:
                      item.tagTone === 'green'
                        ? svc.greenSoft
                        : item.tagTone === 'blue'
                          ? svc.blueSoft
                          : svc.accentSoft,
                    color:
                      item.tagTone === 'green'
                        ? svc.greenDark
                        : item.tagTone === 'blue'
                          ? '#1D4ED8'
                          : svc.accent,
                  }}
                >
                  {item.tag}
                </span>
                <div style={{ fontSize: 12, color: svc.muted, marginBottom: 8 }}>{item.date}</div>
                <div style={{ fontWeight: 700, marginBottom: 8, lineHeight: 1.35 }}>{item.title}</div>
                <div style={{ color: svc.muted, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{item.description}</div>
                <span style={{ marginTop: 'auto', color: svc.accent, fontWeight: 600, fontSize: 13 }}>Читать →</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={svcSection({ paddingTop: 24, paddingBottom: 40 })}>
        <div style={svcContainer()}>
          <div
            style={{
              borderRadius: 24,
              padding: '36px 32px',
              background: '#fff',
              border: `1px solid ${svc.border}`,
              boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 24,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ maxWidth: 620 }}>
              <h2 style={{ margin: 0, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, lineHeight: 1.2 }}>
                {serviceFinalCta.titleBefore}{' '}
                <span style={{ color: svc.accent }}>{serviceFinalCta.titleHighlight}</span>
              </h2>
              <p style={{ margin: '12px 0 0', color: svc.muted, lineHeight: 1.55 }}>{serviceFinalCta.subtitle}</p>
            </div>
            <SvcPrimaryButton onClick={goRegister}>{serviceFinalCta.cta}</SvcPrimaryButton>
          </div>
        </div>
      </section>
    </>
  )
}
