import { useState } from 'react'
import LandingLeadRequestModal from '../components/landing/LandingLeadRequestModal'
import type { LandingLeadRequest } from '../types/landingLead'
import ServiceLandingHeader from '../components/landingService/ServiceLandingHeader'
import ServiceLandingSections from '../components/landingService/ServiceLandingSections'
import ServiceLandingAmbient from '../components/landingService/ServiceLandingDecor'
import ServiceLandingFooter from '../components/landingService/ServiceLandingFooter'
import { svc } from '../components/landingService/landingServiceShared'

/**
 * Сервисный лендинг на корне `/`. Агентский — `/landing-agency`.
 */
export default function Landing() {
  const [leadRequest, setLeadRequest] = useState<LandingLeadRequest | null>(null)

  return (
    <div
      className="landing-service-page"
      style={{
        position: 'relative',
        minHeight: '100vh',
        maxWidth: '100%',
        overflowX: 'clip',
        backgroundColor: '#FFFFFF',
        color: svc.text,
      }}
    >
      <style>{`
        html { scroll-behavior: smooth; }
        .landing-service-page * { box-sizing: border-box; }
        .landing-service-page .svc-content { position: relative; z-index: 1; max-width: 100%; overflow-x: clip; }
        /* Hero: не клипать точки и тень рамки на мобилке */
        @media (max-width: 900px) {
          .landing-service-page .svc-content { overflow-x: visible; }
          .landing-service-page { overflow-x: clip; }
        }
        /* Мягкие «полосы» секций без жёсткого стыка */
        .landing-service-page .svc-section-soft {
          background: linear-gradient(
            180deg,
            rgba(248, 250, 252, 0) 0%,
            rgba(248, 250, 252, 0.72) 10%,
            rgba(248, 250, 252, 0.72) 90%,
            rgba(248, 250, 252, 0) 100%
          );
        }
        @media (max-width: 960px) {
          .landing-service-page section { padding-top: 36px !important; padding-bottom: 36px !important; }
          .landing-service-page section:first-of-type { padding-top: 28px !important; }
          /* Горизонтальные поля контейнера секций */
          .landing-service-page main > section > div,
          .landing-service-page footer > div {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>
      <ServiceLandingAmbient />
      <div className="svc-content">
        <ServiceLandingHeader />
        <main>
          <ServiceLandingSections onOpenLeadForm={setLeadRequest} />
        </main>
        <ServiceLandingFooter />
      </div>
      <LandingLeadRequestModal request={leadRequest} onClose={() => setLeadRequest(null)} />
    </div>
  )
}
