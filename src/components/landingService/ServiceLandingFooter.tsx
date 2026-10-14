import { Link } from 'react-router-dom'
import SiteLogo from '../SiteLogo'
import { LEGAL_OPERATOR } from '../../constants/legalOperator'
import { SERVICE_LANDING_ANCHORS, serviceFooter } from '../../content/landingServiceContent'
import { svc, svcContainer, svcSection } from './landingServiceShared'

export default function ServiceLandingFooter() {
  return (
    <footer id={SERVICE_LANDING_ANCHORS.contacts} style={{ ...svcSection({ paddingTop: 56, paddingBottom: 28 }), background: 'transparent' }}>
      <div style={svcContainer()}>
        <div
          className="svc-footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr repeat(3, 1fr)',
            gap: 32,
            marginBottom: 28,
          }}
        >
          <div>
            <SiteLogo variant="wordmark" size={32} />
            <p style={{ margin: '12px 0 16px', color: svc.muted, fontSize: 14, lineHeight: 1.5, maxWidth: 260 }}>
              {serviceFooter.tagline}
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 12, color: svc.text }}>Продукт</div>
            {serviceFooter.productLinks.map((l) => (
              <a key={l.label} href={l.href} style={{ display: 'block', marginBottom: 8, color: svc.muted, textDecoration: 'none', fontSize: 14 }}>
                {l.label}
              </a>
            ))}
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 12, color: svc.text }}>О компании</div>
            {serviceFooter.companyLinks.map((l) =>
              'to' in l ? (
                <Link key={l.label} to={l.to} style={{ display: 'block', marginBottom: 8, color: svc.muted, textDecoration: 'none', fontSize: 14 }}>
                  {l.label}
                </Link>
              ) : (
                <a key={l.label} href={l.href} style={{ display: 'block', marginBottom: 8, color: svc.muted, textDecoration: 'none', fontSize: 14 }}>
                  {l.label}
                </a>
              )
            )}
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 12, color: svc.text }}>Контакты</div>
            <a href={`mailto:${LEGAL_OPERATOR.email}`} style={{ display: 'block', marginBottom: 8, color: svc.muted, textDecoration: 'none', fontSize: 14 }}>
              {LEGAL_OPERATOR.email}
            </a>
            <a href={serviceFooter.telegramUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', color: svc.muted, textDecoration: 'none', fontSize: 14 }}>
              {serviceFooter.telegram}
            </a>
          </div>
        </div>

        <div
          style={{
            borderTop: `1px solid ${svc.border}`,
            paddingTop: 18,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'space-between',
            alignItems: 'center',
            color: svc.muted,
            fontSize: 13,
          }}
        >
          <div>© {new Date().getFullYear()} {LEGAL_OPERATOR.siteBrandName}. Все права защищены.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {serviceFooter.legalLinks.map((l, i) => (
              <span key={l.to} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {i > 0 ? <span>|</span> : null}
                <Link to={l.to} style={{ color: svc.muted, textDecoration: 'none' }}>
                  {l.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .svc-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .svc-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
