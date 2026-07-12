import { CustomerServiceOutlined, EyeOutlined, TeamOutlined } from '@ant-design/icons'
import { landingTrustStats } from '../../content/landingContent'
import { landingColors, landingRadii } from '../../styles/landing'
import { LandingSectionTitle, landingContainerStyle, landingSectionStyle } from './landingShared'

const trustIcons = [<TeamOutlined />, <CustomerServiceOutlined />, <EyeOutlined />]

export default function LandingTrust() {
  return (
    <>
      <style>{`
        .landing-trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 960px) {
          .landing-trust-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
        }
      `}</style>
      <section style={landingSectionStyle()}>
        <div style={landingContainerStyle()}>
          <LandingSectionTitle title="Мы ведем рекламу сами и знаем как получить результат" />
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
