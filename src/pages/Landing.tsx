import { useState } from 'react'
import LandingLeadRequestModal from '../components/landing/LandingLeadRequestModal'
import type { LandingLeadRequest } from '../types/landingLead'
import ServiceLandingHeader from '../components/landingService/ServiceLandingHeader'
import ServiceLandingSections from '../components/landingService/ServiceLandingSections'
import ServiceLandingAmbient from '../components/landingService/ServiceLandingDecor'
import { svc } from '../components/landingService/landingServiceShared'

/**
 * Новый сервисный лендинг (макет «Лендинг Сервис»).
 * Пока на `/landing-service`; на `/` — текущий агентский.
 * После готовности — поменять местами с LandingAgency.
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
        .landing-service-page .svc-content { position: relative; z-index: 1; }
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
          .landing-service-page section { padding-top: 48px !important; padding-bottom: 48px !important; }
        }
      `}</style>
      <ServiceLandingAmbient />
      <div className="svc-content">
        <ServiceLandingHeader />
        <main>
          <ServiceLandingSections onOpenLeadForm={setLeadRequest} />
        </main>
      </div>
      <LandingLeadRequestModal request={leadRequest} onClose={() => setLeadRequest(null)} />
    </div>
  )
}
