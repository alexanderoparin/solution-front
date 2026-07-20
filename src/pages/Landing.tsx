import { useState } from 'react'
import LandingHeader from '../components/landing/LandingHeader'
import LandingHero from '../components/landing/LandingHero'
import LandingLeadRequestModal from '../components/landing/LandingLeadRequestModal'
import type { LandingLeadRequest } from '../types/landingLead'
import LandingMission from '../components/landing/LandingMission'
import LandingServices from '../components/landing/LandingServices'
import LandingFeatures from '../components/landing/LandingFeatures'
import LandingPricing from '../components/landing/LandingPricing'
import LandingTrust from '../components/landing/LandingTrust'
import LandingCases from '../components/landing/LandingCases'
import LandingFaq, { LandingBlogSection } from '../components/landing/LandingFaq'
import LandingFooter from '../components/landing/LandingFooter'
import { landingColors } from '../styles/landing'

export default function Landing() {
  const [leadRequest, setLeadRequest] = useState<LandingLeadRequest | null>(null)

  const openLeadForm = (request: LandingLeadRequest) => setLeadRequest(request)
  const closeLeadForm = () => setLeadRequest(null)

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
        <LandingHero onOpenLeadForm={openLeadForm} />
        <LandingMission />
        <LandingServices onOpenLeadForm={openLeadForm} />
        <LandingFeatures />
        <LandingPricing onOpenLeadForm={openLeadForm} />
        <LandingTrust />
        <LandingCases />
        <LandingFaq />
        <LandingBlogSection />
      </main>
      <LandingFooter />
      <LandingLeadRequestModal request={leadRequest} onClose={closeLeadForm} />
    </div>
  )
}
