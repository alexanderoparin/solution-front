import { Link } from 'react-router-dom'
import { LEGAL_OPERATOR } from '../constants/legalOperator'

const ACCENT = '#7C3AED'
const ACCENT_HOVER = '#6D28D9'

const CONTACT_EMAIL = LEGAL_OPERATOR.email

const linkStyle: React.CSSProperties = {
  color: ACCENT,
  fontSize: 14,
  textDecoration: 'none',
  transition: 'color 0.2s',
}

const FOOTER_DOCUMENT_LINKS = [
  { to: '/privacy', label: 'Политика конфиденциальности' },
  { to: '/user-agreement', label: 'Пользовательское соглашение' },
  { to: '/refund', label: 'Политика возврата' },
  { to: '/oferta', label: 'Публичная оферта' },
] as const

export default function Footer() {
  return (
    <footer
      className="app-footer"
      style={{
        marginTop: 'auto',
        background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
        borderTop: '1px solid #E2E8F0',
        padding: '28px 32px 32px',
      }}
    >
      <style>{`
        .app-footer .footer-link:hover { color: ${ACCENT_HOVER}; opacity: 0.9; }
      `}</style>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 32,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>
            © {new Date().getFullYear()} {LEGAL_OPERATOR.siteBrandName}
          </div>
          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{LEGAL_OPERATOR.name}</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>ИНН: {LEGAL_OPERATOR.inn}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#94A3B8',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            Документы
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(140px, max-content))',
              columnGap: 32,
              rowGap: 8,
            }}
          >
            {FOOTER_DOCUMENT_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className="footer-link" style={linkStyle}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#94A3B8',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            Контакты
          </div>
          <a href={`mailto:${CONTACT_EMAIL}`} className="footer-link" style={linkStyle}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  )
}
