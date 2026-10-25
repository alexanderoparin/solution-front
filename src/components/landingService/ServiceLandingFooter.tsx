import { Link } from 'react-router-dom'
import SiteLogo from '../SiteLogo'
import { LEGAL_OPERATOR } from '../../constants/legalOperator'
import { SERVICE_LANDING_ANCHORS, serviceFooter } from '../../content/landingServiceContent'
import { svc, svcContainer, svcSection } from './landingServiceShared'

/** Классический конверт — понятнее, чем chat/message. */
function EmailIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }} aria-hidden>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z" />
    </svg>
  )
}

/** Официальный знак VK в фирменном синем — не наследует фиолетовый currentColor кнопки. */
function VkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#0077FF"
        d="m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z"
      />
    </svg>
  )
}

/** Официальный значок Max (кольцо-облачко на градиенте). */
function MaxIcon() {
  return (
    <img
      src="/landing-service/max-icon.png"
      alt=""
      width={16}
      height={16}
      style={{ display: 'block', borderRadius: 4, objectFit: 'cover' }}
    />
  )
}

/** Официальный значок Telegram. */
function TelegramIcon() {
  return (
    <img
      src="/landing-service/telegram-icon.png"
      alt=""
      width={16}
      height={16}
      style={{ display: 'block', borderRadius: '50%', objectFit: 'cover' }}
    />
  )
}

function SocialButton({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  const style: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#EEF2FF',
    color: '#312E81',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    textDecoration: 'none',
    flexShrink: 0,
  }
  if (!href) {
    return (
      <span aria-label={label} title={`${label} — скоро`} className="svc-footer-social" style={{ ...style, opacity: 0.55, cursor: 'default' }}>
        {children}
      </span>
    )
  }
  const isMail = href.startsWith('mailto:')
  return (
    <a
      href={href}
      target={isMail ? undefined : '_blank'}
      rel={isMail ? undefined : 'noopener noreferrer'}
      aria-label={label}
      className="svc-footer-social"
      style={style}
    >
      {children}
    </a>
  )
}

function FooterLink({
  href,
  to,
  children,
}: {
  href?: string
  to?: string
  children: React.ReactNode
}) {
  const style: React.CSSProperties = {
    display: 'block',
    marginBottom: 10,
    color: svc.muted,
    textDecoration: 'none',
    fontSize: 14,
    lineHeight: 1.4,
  }
  if (to) {
    return (
      <Link to={to} className="svc-footer-link" style={style}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className="svc-footer-link" style={style}>
      {children}
    </a>
  )
}

export default function ServiceLandingFooter() {
  return (
    <>
      <style>{`
        .svc-footer-link:hover { color: ${svc.text} !important; }
        .svc-footer-social:hover { background: #E0E7FF !important; color: ${svc.accent} !important; }
        @media (max-width: 900px) {
          .svc-footer {
            padding-top: 28px !important;
            padding-bottom: 20px !important;
          }
          .svc-footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 18px 16px !important;
            margin-bottom: 18px !important;
          }
          .svc-footer-brand {
            grid-column: 1 / -1;
          }
          .svc-footer-brand p {
            max-width: none !important;
            margin: 8px 0 12px !important;
            font-size: 13px !important;
            line-height: 1.45 !important;
          }
          .svc-footer-socials { gap: 8px !important; }
          .svc-footer-social {
            width: 36px !important;
            height: 36px !important;
          }
          .svc-footer-col-title {
            margin-bottom: 8px !important;
            font-size: 14px !important;
          }
          .svc-footer-link {
            margin-bottom: 6px !important;
            font-size: 13px !important;
          }
          .svc-footer-col-contacts {
            display: none !important;
          }
          .svc-footer-bottom {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
            padding-top: 14px !important;
            font-size: 12px !important;
          }
          .svc-footer-legal {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
          }
          .svc-footer-legal-sep { display: none !important; }
        }
      `}</style>
      <footer
        id={SERVICE_LANDING_ANCHORS.contacts}
        className="svc-footer"
        style={{
          ...svcSection({ paddingTop: 56, paddingBottom: 28 }),
          background: 'transparent',
        }}
      >
        <div style={svcContainer()}>
          <div
            className="svc-footer-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr repeat(3, 1fr)',
              gap: 40,
              marginBottom: 36,
              alignItems: 'start',
            }}
          >
            <div className="svc-footer-brand">
              <Link to="/" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                <SiteLogo variant="wordmarkDark" size={34} />
              </Link>
              <p
                style={{
                  margin: '14px 0 18px',
                  color: svc.muted,
                  fontSize: 14,
                  lineHeight: 1.55,
                  maxWidth: 280,
                }}
              >
                {serviceFooter.tagline}
              </p>
              <div className="svc-footer-socials" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {serviceFooter.socialLinks.map((s) => (
                  <SocialButton key={s.label} href={s.href} label={s.label}>
                    {s.icon === 'telegram' ? (
                      <TelegramIcon />
                    ) : s.icon === 'chat' ? (
                      <EmailIcon size={16} />
                    ) : s.icon === 'max' ? (
                      <MaxIcon />
                    ) : (
                      <VkIcon />
                    )}
                  </SocialButton>
                ))}
              </div>
            </div>

            <div className="svc-footer-col">
              <div className="svc-footer-col-title" style={{ fontWeight: 700, marginBottom: 14, color: svc.text, fontSize: 15 }}>Продукт</div>
              {serviceFooter.productLinks.map((l) => (
                <FooterLink key={l.label} href={l.href}>
                  {l.label}
                </FooterLink>
              ))}
            </div>

            <div className="svc-footer-col">
              <div className="svc-footer-col-title" style={{ fontWeight: 700, marginBottom: 14, color: svc.text, fontSize: 15 }}>О компании</div>
              {serviceFooter.companyLinks.map((l) =>
                'to' in l ? (
                  <FooterLink key={l.label} to={l.to}>
                    {l.label}
                  </FooterLink>
                ) : (
                  <FooterLink key={l.label} href={l.href}>
                    {l.label}
                  </FooterLink>
                )
              )}
            </div>

            <div className="svc-footer-col svc-footer-col-contacts">
              <div className="svc-footer-col-title" style={{ fontWeight: 700, marginBottom: 14, color: svc.text, fontSize: 15 }}>Контакты</div>
              <a
                href={`mailto:${LEGAL_OPERATOR.email}`}
                className="svc-footer-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                  color: svc.muted,
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                <EmailIcon size={16} color={svc.accent} />
                {LEGAL_OPERATOR.email}
              </a>
              <a
                href={serviceFooter.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="svc-footer-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: svc.muted,
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
                <img
                  src="/landing-service/telegram-icon.png"
                  alt=""
                  width={16}
                  height={16}
                  style={{ display: 'block', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
                {serviceFooter.telegram}
              </a>
            </div>
          </div>

          <div
            className="svc-footer-bottom"
            style={{
              borderTop: `1px solid ${svc.border}`,
              paddingTop: 20,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'center',
              color: svc.muted,
              fontSize: 13,
            }}
          >
            <div>
              © {new Date().getFullYear()} {LEGAL_OPERATOR.siteBrandName}. Все права защищены.
            </div>
            <div className="svc-footer-legal" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {serviceFooter.legalLinks.map((l, i) => (
                <span key={l.to} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {i > 0 ? <span className="svc-footer-legal-sep" style={{ color: '#CBD5E1' }}>|</span> : null}
                  <Link to={l.to} className="svc-footer-link" style={{ color: svc.muted, textDecoration: 'none' }}>
                    {l.label}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
