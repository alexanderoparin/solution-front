import { CustomerServiceOutlined, EyeOutlined, RobotOutlined, TrophyOutlined } from '@ant-design/icons'
import { landingTrustStats } from '../../content/landingContent'
import { landingColors, landingLayout, landingRadii } from '../../styles/landing'
import { LandingSectionTitle, landingContainerStyle, landingSectionStyle } from './landingShared'

const trustIcons = [
  <TrophyOutlined key="expertise" />,
  <RobotOutlined key="tech" />,
  <EyeOutlined key="transparency" />,
  <CustomerServiceOutlined key="support" />,
]

export default function LandingTrust() {
  return (
    <>
      <style>{`
        .landing-trust-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .landing-trust-title {
          font-size: clamp(16px, 1.7vw, 22px) !important;
          white-space: nowrap;
        }
        @media (max-width: 1100px) {
          .landing-trust-title {
            font-size: clamp(15px, 1.6vw, 20px) !important;
          }
          .landing-trust-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 960px) {
          .landing-trust-title { white-space: normal !important; }
        }
        @media (max-width: 640px) {
          .landing-trust-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
        }
      `}</style>
      <section style={landingSectionStyle()}>
        <div style={landingContainerStyle()}>
          <LandingSectionTitle
            title="Мы ежедневно работаем с рекламой Wildberries и объединяем практический опыт, технологии и прозрачный подход к работе"
            contentMaxWidth={landingLayout.maxWidth}
            titleClassName="landing-trust-title"
          />
          <div className="landing-trust-grid">
            {landingTrustStats.map((item, index) => (
              <div
                key={item.title}
                style={{
                  textAlign: 'center',
                  padding: '24px 20px',
                  borderRadius: landingRadii.lg,
                  border: `1px solid ${landingColors.border}`,
                  backgroundColor: landingColors.cardBg,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    margin: '0 auto 12px',
                    borderRadius: landingRadii.md,
                    backgroundColor: landingColors.accentLight,
                    color: landingColors.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {trustIcons[index]}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: landingColors.textPrimary, marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: landingColors.textSecondary, lineHeight: 1.5 }}>{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
