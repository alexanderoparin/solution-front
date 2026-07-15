import { LANDING_ANCHORS, landingMission } from '../../content/landingContent'
import { landingAssets, landingColors, landingRadii } from '../../styles/landing'
import { landingContainerStyle, landingSectionStyle } from './landingShared'

const MISSION_ACCENT_I = '#DDD6FE'

function MissionBrandName() {
  return (
    <>
      Click<span style={{ color: MISSION_ACCENT_I }}>i</span>
    </>
  )
}

function MissionQuoteMark() {
  return (
    <img
      className="landing-mission-quote-mark"
      src={landingAssets.missionQuotes}
      alt=""
      loading="lazy"
    />
  )
}

export default function LandingMission() {
  const quoteBody = landingMission.quote.replace(/^Clicki\s*/i, '')

  return (
    <>
      <style>{`
        .landing-mission-card {
          display: grid;
          grid-template-columns: minmax(64px, 88px) 1fr;
          gap: 16px 28px;
          align-items: center;
          background: linear-gradient(90deg, #9333EA 0%, #7C3AED 42%, #5B21B6 100%);
          border-radius: ${landingRadii.lg}px;
          padding: 28px 36px;
          color: ${landingColors.textOnDark};
          overflow: hidden;
        }
        .landing-mission-quote-mark {
          display: block;
          width: clamp(48px, 7vw, 64px);
          height: auto;
          user-select: none;
          justify-self: center;
          align-self: center;
          opacity: 0.95;
        }
        .landing-mission-text {
          font-size: clamp(14px, 1.6vw, 16px);
          line-height: 1.55;
          font-weight: 400;
          margin: 0;
        }
        .landing-mission-divider {
          width: 56px;
          height: 1px;
          background: rgba(255, 255, 255, 0.35);
          margin: 16px 0 12px;
          border: none;
        }
        .landing-mission-author {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.92);
        }
        @media (max-width: 640px) {
          .landing-mission-card {
            grid-template-columns: 1fr;
            padding: 22px 20px;
            gap: 12px;
          }
          .landing-mission-quote-mark {
            width: 48px;
            justify-self: start;
          }
        }
      `}</style>
      <section id={LANDING_ANCHORS.about} style={{ ...landingSectionStyle({ paddingTop: 24, paddingBottom: 16 }) }}>
        <div style={landingContainerStyle()}>
          <div className="landing-mission-card">
            <MissionQuoteMark />
            <div>
              <p className="landing-mission-text">
                <MissionBrandName /> {quoteBody}
              </p>
              <hr className="landing-mission-divider" />
              <div className="landing-mission-author">
                Команда <MissionBrandName />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
