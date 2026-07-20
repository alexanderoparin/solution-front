import { Button } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { LANDING_ANCHORS, landingCases, landingCasesPresentationUrl } from '../../content/landingContent'
import { landingColors, landingRadii } from '../../styles/landing'
import { LandingSectionTitle, landingContainerStyle, landingSectionStyle } from './landingShared'

export default function LandingCases() {
  return (
    <>
      <style>{`
        .landing-cases-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .landing-case-card {
          display: block;
          border-radius: ${landingRadii.lg}px;
          border: 1px solid ${landingColors.border};
          overflow: hidden;
          background: ${landingColors.cardBg};
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .landing-case-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1);
        }
        .landing-case-card img {
          display: block;
          width: 100%;
          height: auto;
          vertical-align: top;
        }
        @media (max-width: 768px) {
          .landing-cases-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <section id={LANDING_ANCHORS.cases} style={{ ...landingSectionStyle(), backgroundColor: landingColors.sectionBg }}>
        <div style={landingContainerStyle()}>
          <LandingSectionTitle
            title="Кейсы наших клиентов"
            subtitle="Реальные результаты продвижения на Wildberries"
          />
          <div className="landing-cases-grid">
            {landingCases.map((item) => (
              <article key={item.id} className="landing-case-card">
                <img src={item.image} alt={`Кейс: ${item.title}`} loading="lazy" />
              </article>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              href={landingCasesPresentationUrl}
              download="Кейсы Clicki.pdf"
              style={{
                backgroundColor: landingColors.accent,
                borderColor: landingColors.accent,
                borderRadius: landingRadii.md,
                height: 48,
                paddingInline: 28,
                fontWeight: 600,
              }}
            >
              Посмотреть все кейсы
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
