import { Card } from 'antd'
import { LANDING_ANCHORS, landingCases } from '../../content/landingContent'
import { landingColors, landingRadii } from '../../styles/landing'
import { LandingSectionTitle, landingContainerStyle, landingSectionStyle } from './landingShared'

export default function LandingCases() {
  return (
    <>
      <style>{`
        .landing-cases-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 960px) {
          .landing-cases-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <section id={LANDING_ANCHORS.cases} style={{ ...landingSectionStyle(), backgroundColor: landingColors.sectionBg }}>
        <div style={landingContainerStyle()}>
          <LandingSectionTitle title="Кейсы наших клиентов" subtitle="Реальные результаты в разных категориях Wildberries" />
          <div className="landing-cases-grid">
            {landingCases.map((item) => (
              <Card
                key={item.id}
                style={{ borderRadius: landingRadii.lg, border: `1px solid ${landingColors.border}`, overflow: 'hidden' }}
                bodyStyle={{ padding: 24 }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: landingColors.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {item.category}
                </div>
                <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                  {item.metrics.map((metric) => (
                    <div key={metric.label}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: landingColors.textPrimary, letterSpacing: '-0.02em' }}>{metric.value}</div>
                      <div style={{ fontSize: 12, color: landingColors.textSecondary }}>{metric.label}</div>
                    </div>
                  ))}
                </div>
                <img
                  src={item.image}
                  alt={`Динамика: ${item.category}`}
                  style={{
                    width: '100%',
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: landingRadii.md,
                    border: `1px solid ${landingColors.border}`,
                    backgroundColor: landingColors.sectionBg,
                  }}
                />
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
