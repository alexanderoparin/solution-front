import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { landingHero } from '../../content/landingContent'
import { landingAssets, landingColors, landingRadii } from '../../styles/landing'
import { landingContainerStyle } from './landingShared'
import type { LandingLeadRequest } from '../../types/landingLead'

interface LandingHeroProps {
  onOpenLeadForm: (request: LandingLeadRequest) => void
}

export default function LandingHero({ onOpenLeadForm }: LandingHeroProps) {
  const navigate = useNavigate()

  return (
    <>
      <style>{`
        .landing-hero-section {
          position: relative;
          overflow: hidden;
          background: ${landingColors.heroBg};
          color: ${landingColors.textOnDark};
          padding-top: 72px;
          padding-bottom: 72px;
        }
        .landing-hero-glow {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
        }
        .landing-hero-glow--right {
          width: min(720px, 70vw);
          height: min(720px, 70vw);
          right: -8%;
          top: 8%;
          background: radial-gradient(circle, ${landingColors.heroGlow} 0%, ${landingColors.heroGlowSoft} 38%, transparent 72%);
          filter: blur(48px);
        }
        .landing-hero-glow--left {
          width: min(480px, 55vw);
          height: min(480px, 55vw);
          left: -12%;
          bottom: -8%;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, rgba(124, 58, 237, 0.06) 45%, transparent 72%);
          filter: blur(56px);
        }
        .landing-hero-glow--center {
          width: min(560px, 60vw);
          height: min(320px, 40vw);
          left: 38%;
          top: 42%;
          transform: translate(-50%, -50%);
          background: radial-gradient(ellipse, rgba(147, 51, 234, 0.18) 0%, transparent 70%);
          filter: blur(64px);
        }
        .landing-hero-inner {
          position: relative;
          z-index: 1;
          min-width: 0;
        }
        .landing-hero-copy {
          min-width: 0;
        }
        .landing-hero-title {
          margin: 0 0 20px;
          font-size: clamp(28px, 5vw, 46px);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          text-align: center;
          overflow-wrap: break-word;
        }
        .landing-hero-subtitle {
          margin: 0 0 32px;
          font-size: 18px;
          line-height: 1.65;
          color: ${landingColors.textOnDarkMuted};
          text-align: center;
          white-space: pre-line;
        }
        .landing-hero-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 40px;
          justify-content: center;
        }
        .landing-hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 16px 20px;
          align-items: flex-start;
          justify-content: center;
        }
        .landing-hero-badge {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          min-width: 0;
        }
        .landing-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 28px;
          align-items: stretch;
        }
        .landing-hero-visuals {
          position: relative;
          height: 100%;
          min-height: 0;
          align-self: stretch;
        }
        .landing-hero-shot-top,
        .landing-hero-shot-bottom {
          display: block;
          height: auto;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .landing-hero-shot-top {
          position: absolute;
          top: 0;
          right: 0;
          width: 78%;
          z-index: 2;
          border-radius: ${landingRadii.lg}px;
          box-shadow: 0 24px 48px rgba(0,0,0,0.45);
        }
        .landing-hero-shot-bottom {
          position: absolute;
          bottom: 0;
          left: 12%;
          width: 78%;
          z-index: 1;
          border-radius: ${landingRadii.lg}px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.4);
        }
        @media (max-width: 960px) {
          .landing-hero-section { padding-top: 48px; padding-bottom: 56px; }
          .landing-hero-grid { grid-template-columns: 1fr; gap: 32px; }
          .landing-hero-visuals { min-height: 320px; max-width: 520px; margin: 0 auto; width: 100%; height: auto; }
          .landing-hero-glow--right { right: -20%; top: 28%; }
        }
        @media (max-width: 640px) {
          .landing-hero-section { padding-top: 32px; padding-bottom: 40px; }
          .landing-hero-title { font-size: clamp(26px, 8vw, 32px); margin-bottom: 16px; }
          .landing-hero-subtitle { font-size: 15px; margin-bottom: 24px; }
          .landing-hero-ctas { flex-direction: column; align-items: stretch; margin-bottom: 28px; }
          .landing-hero-ctas .ant-btn { width: 100%; padding-inline: 16px !important; }
          .landing-hero-badges { flex-direction: column; gap: 12px; align-items: flex-start; }
          .landing-hero-visuals { min-height: 220px; }
        }
      `}</style>
      <section className="landing-hero-section">
        <div className="landing-hero-glow landing-hero-glow--right" aria-hidden />
        <div className="landing-hero-glow landing-hero-glow--left" aria-hidden />
        <div className="landing-hero-glow landing-hero-glow--center" aria-hidden />
        <div className="landing-hero-inner" style={landingContainerStyle()}>
          <div className="landing-hero-grid">
            <div className="landing-hero-copy">
              <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <h1 className="landing-hero-title">
                  {landingHero.titleBefore}
                  <br />
                  {landingHero.titlePreposition}&nbsp;
                  <span style={{ color: landingColors.accent }}>{landingHero.titleHighlight}</span>
                  {landingHero.titleAfter}
                </h1>
                <p className="landing-hero-subtitle">
                  {landingHero.subtitle}
                </p>
                <div className="landing-hero-ctas">
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate('/register')}
                    style={{
                      backgroundColor: landingColors.accent,
                      borderColor: landingColors.accent,
                      borderRadius: landingRadii.md,
                      height: 48,
                      paddingInline: 40,
                      fontWeight: 600,
                    }}
                  >
                    Попробовать бесплатно
                  </Button>
                  <Button
                    size="large"
                    onClick={() => onOpenLeadForm({ type: 'consultation', source: 'hero-consultation' })}
                    style={{
                      borderRadius: landingRadii.md,
                      height: 48,
                      paddingInline: 40,
                      fontWeight: 600,
                      backgroundColor: 'transparent',
                      borderColor: 'rgba(255,255,255,0.35)',
                      color: landingColors.textOnDark,
                    }}
                  >
                    Заказать консультацию
                  </Button>
                </div>
              </div>
              <div className="landing-hero-badges">
                {landingHero.trustBadges.map((badge) => (
                  <div key={badge.title} className="landing-hero-badge">
                    <CheckCircleOutlined style={{ color: landingColors.accent, fontSize: 18, marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{badge.title}</div>
                      <div style={{ fontSize: 13, color: landingColors.textOnDarkMuted }}>
                        {badge.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-hero-visuals">
              <img
                className="landing-hero-shot-top"
                src={landingAssets.heroAnalytics}
                alt="Аналитика рекламы Clicki"
                loading="eager"
              />
              <img
                className="landing-hero-shot-bottom"
                src={landingAssets.heroBidder}
                alt="Автоматический запуск рекламы Clicki"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
