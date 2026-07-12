import LandingHeader from '../components/landing/LandingHeader'
import LandingHero from '../components/landing/LandingHero'
import LandingMission from '../components/landing/LandingMission'
import LandingServices from '../components/landing/LandingServices'
import LandingFeatures from '../components/landing/LandingFeatures'
import LandingPricing from '../components/landing/LandingPricing'
import LandingTrust from '../components/landing/LandingTrust'
import LandingFaq, { LandingBlogSection } from '../components/landing/LandingFaq'
import LandingFooter from '../components/landing/LandingFooter'
import { landingColors } from '../styles/landing'

export default function Landing() {
  return (
    <div
      className="landing-page"
      style={{
        minHeight: '100vh',
        backgroundColor: landingColors.cardBg,
        color: landingColors.textPrimary,
      }}
    >
      <style>{`
        html { scroll-behavior: smooth; }
        .landing-page * { box-sizing: border-box; }
        @media (max-width: 960px) {
          .landing-page section { padding-top: 48px !important; padding-bottom: 48px !important; }
        }
      `}</style>
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingMission />
        <LandingServices />
        <LandingFeatures />
        <LandingPricing />
        <LandingTrust />
        <LandingFaq />
        <LandingBlogSection />
      </main>
      <LandingFooter />
    </div>
  )
}
