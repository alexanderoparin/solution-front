import { Link } from 'react-router-dom'

const ACCENT = '#7C3AED'
const ACCENT_HOVER = '#6D28D9'

const REQUISITES = {
  name: 'Индивидуальный предприниматель Бурцев Даниил Викторович',
  inn: '482619660921',
}
const CONTACT_EMAIL = 'support@wb-solution.ru'
const CONTACT_PHONE = '+7 920 526 5666'
const TELEGRAM_URL = 'https://t.me/buryanexx'
const WHATSAPP_URL = 'https://wa.me/79205265666?text=Добрый%20день!%20Хочу%20узнать%20про%20WB-Solution.'

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
        .app-footer .footer-icon:hover { transform: scale(1.08); background: ${ACCENT} !important; color: #fff !important; }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>
            © {new Date().getFullYear()} WB-Solution
          </div>
          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{REQUISITES.name}</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>ИНН: {REQUISITES.inn}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>Документы</div>
          <Link to="/privacy" className="footer-link" style={{ color: ACCENT, fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}>Политика конфиденциальности</Link>
          <Link to="/refund" className="footer-link" style={{ color: ACCENT, fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}>Политика возврата</Link>
          <Link to="/oferta" className="footer-link" style={{ color: ACCENT, fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}>Публичная оферта</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 64 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>Контакты</div>
            <a href={`mailto:${CONTACT_EMAIL}`} className="footer-link" style={{ color: ACCENT, fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}>{CONTACT_EMAIL}</a>
            <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} className="footer-link" style={{ color: ACCENT, fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}>{CONTACT_PHONE}</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="footer-icon" style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'transform 0.2s, background 0.2s, color 0.2s' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.69 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.09c-.06-.04-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.53 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="footer-icon" style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', transition: 'transform 0.2s, background 0.2s, color 0.2s' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
