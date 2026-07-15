import { Link } from 'react-router-dom'
import SiteLogo from '../SiteLogo'
import { LEGAL_OPERATOR } from '../../constants/legalOperator'
import { LANDING_ANCHORS, landingFooterLinks } from '../../content/landingContent'
import { landingColors } from '../../styles/landing'
import { landingContainerStyle } from './landingShared'

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 140 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: landingColors.textOnDarkMuted }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

function FooterLink({ href, to, children }: { href?: string; to?: string; children: React.ReactNode }) {
  const style: React.CSSProperties = { color: landingColors.textOnDarkMuted, textDecoration: 'none', fontSize: 14, lineHeight: 1.4 }
  if (to) {
    return (
      <Link to={to} className="landing-footer-link" style={style}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className="landing-footer-link" style={style}>
      {children}
    </a>
  )
}

export default function LandingFooter() {
  return (
    <>
      <style>{`.landing-footer-link:hover { color: ${landingColors.textOnDark}; }`}</style>
      <footer id={LANDING_ANCHORS.contacts} style={{ backgroundColor: landingColors.footerBg, color: landingColors.textOnDark, paddingTop: 56, paddingBottom: 32 }}>
        <div style={landingContainerStyle()}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr repeat(3, 1fr)',
              gap: 40,
              marginBottom: 40,
            }}
            className="landing-footer-grid"
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <SiteLogo variant="wordmark" size={32} />
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: landingColors.textOnDarkMuted, maxWidth: 280 }}>
                Сервис и агентство для эффективной рекламы и аналитики на Wildberries.
              </p>
            </div>

            <FooterColumn title="Сервисы">
              {landingFooterLinks.services.map((link) => (
                <FooterLink key={link.label} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Компания">
              {landingFooterLinks.company.map((link) => (
                <FooterLink key={link.label} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Поддержка">
              {landingFooterLinks.support.map((link) =>
                'to' in link ? (
                  <FooterLink key={link.label} to={link.to}>
                    {link.label}
                  </FooterLink>
                ) : (
                  <FooterLink key={link.label} href={link.href}>
                    {link.label}
                  </FooterLink>
                )
              )}
            </FooterColumn>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: landingColors.textOnDarkMuted }}>
              © {new Date().getFullYear()} {LEGAL_OPERATOR.siteBrandName}. {LEGAL_OPERATOR.shortName}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: landingColors.textOnDarkMuted, textAlign: 'right' }}>
              <a href={`mailto:${LEGAL_OPERATOR.email}`} className="landing-footer-link" style={{ color: landingColors.textOnDarkMuted, textDecoration: 'none' }}>
                {LEGAL_OPERATOR.email}
              </a>
              <a href={`tel:${LEGAL_OPERATOR.phoneTel}`} className="landing-footer-link" style={{ color: landingColors.textOnDarkMuted, textDecoration: 'none' }}>
                {LEGAL_OPERATOR.phone}
              </a>
            </div>
          </div>
        </div>
      </footer>
      <style>{`
        @media (max-width: 960px) {
          .landing-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 520px) {
          .landing-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
