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
        }
        .landing-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .landing-hero-visuals {
          position: relative;
          min-height: 420px;
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
          width: 92%;
          z-index: 2;
          border-radius: ${landingRadii.lg}px;
          box-shadow: 0 24px 48px rgba(0,0,0,0.45);
        }
        .landing-hero-shot-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 88%;
          z-index: 1;
          border-radius: ${landingRadii.lg}px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.4);
        }
        @media (max-width: 960px) {
          .landing-hero-grid { grid-template-columns: 1fr; gap: 32px; }
          .landing-hero-visuals { min-height: 320px; max-width: 520px; margin: 0 auto; width: 100%; }
          .landing-hero-glow--right { right: -20%; top: 28%; }
        }
      `}</style>
      <section className="landing-hero-section">
        <div className="landing-hero-glow landing-hero-glow--right" aria-hidden />
        <div className="landing-hero-glow landing-hero-glow--left" aria-hidden />
        <div className="landing-hero-glow landing-hero-glow--center" aria-hidden />
        <div className="landing-hero-inner" style={landingContainerStyle()}>
          <div className="landing-hero-grid">
            <div>
              <h1
                style={{
                  margin: '0 0 20px',
                  fontSize: 'clamp(32px, 5vw, 46px)',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                }}
              >
                {landingHero.titleBefore}
                <br />
                {landingHero.titlePreposition}&nbsp;
                <span style={{ color: landingColors.accent }}>{landingHero.titleHighlight}</span>
                {landingHero.titleAfter}
              </h1>
              <p style={{ margin: '0 0 32px', fontSize: 18, lineHeight: 1.65, color: landingColors.textOnDarkMuted, maxWidth: 520 }}>
                {landingHero.subtitle}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate('/register')}
                  style={{
                    backgroundColor: landingColors.accent,
                    borderColor: landingColors.accent,
                    borderRadius: landingRadii.md,
                    height: 48,
                    paddingInline: 24,
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
                    paddingInline: 24,
                    fontWeight: 600,
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(255,255,255,0.35)',
                    color: landingColors.textOnDark,
                  }}
                >
                  Заказать консультацию
                </Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {landingHero.trustBadges.map((badge) => (
                  <div key={badge.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 140 }}>
                    <CheckCircleOutlined style={{ color: landingColors.accent, fontSize: 18, marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{badge.title}</div>
                      <div style={{ fontSize: 13, color: landingColors.textOnDarkMuted, whiteSpace: 'pre-line' }}>{badge.description}</div>
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
