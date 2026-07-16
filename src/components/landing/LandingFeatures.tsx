import {
  ApartmentOutlined,
  BarChartOutlined,
  DashboardOutlined,
  FileExcelOutlined,
  FundOutlined,
  RobotOutlined,
  SwapOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { LANDING_ANCHORS, landingFeatures } from '../../content/landingContent'
import { landingColors, landingRadii } from '../../styles/landing'
import { LandingIconCircle, LandingSectionTitle, landingContainerStyle, landingSectionStyle } from './landingShared'

const featureIcons = [
  <DashboardOutlined key="analytics" />,
  <ApartmentOutlined key="cabinets" />,
  <SwapOutlined key="periods" />,
  <BarChartOutlined key="stats" />,
  <FileExcelOutlined key="export" />,
  <FundOutlined key="reports" />,
  <RobotOutlined key="automation" />,
  <TeamOutlined key="team" />,
]

export default function LandingFeatures() {
  return (
    <>
      <style>{`
        .landing-features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 1100px) {
          .landing-features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .landing-features-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <section id={LANDING_ANCHORS.features} style={{ ...landingSectionStyle({ paddingBottom: 56 }) }}>
        <div style={landingContainerStyle()}>
          <LandingSectionTitle title="Возможности сервиса" subtitle="Всё необходимое для управления рекламой на Wildberries" />
          <div className="landing-features-grid">
            {landingFeatures.map((feature, index) => (
              <div
                key={feature.title}
                style={{
                  padding: 24,
                  borderRadius: landingRadii.lg,
                  border: `1px solid ${landingColors.border}`,
                  backgroundColor: landingColors.cardBg,
                  height: '100%',
                }}
              >
                <LandingIconCircle>{featureIcons[index]}</LandingIconCircle>
                <h3 style={{ margin: '16px 0 8px', fontSize: 16, fontWeight: 700, color: landingColors.textPrimary }}>
                  {feature.title}
                </h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: landingColors.textSecondary }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
