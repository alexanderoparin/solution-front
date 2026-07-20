import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Drawer } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import SiteLogo from '../SiteLogo'
import { landingNavItems } from '../../content/landingContent'
import { landingColors, landingLayout, landingRadii } from '../../styles/landing'
import { landingContainerStyle } from './landingShared'

export default function LandingHeader() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = (
    <>
      {landingNavItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          className="landing-nav-link"
          style={{
            color: landingColors.textOnDarkMuted,
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {item.label}
        </a>
      ))}
    </>
  )

  return (
    <>
      <style>{`
        .landing-nav-link:hover { color: ${landingColors.textOnDark}; }
        @media (max-width: 960px) {
          .landing-header-nav { display: none !important; }
          .landing-header-burger { display: inline-flex !important; }
        }
      `}</style>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: landingLayout.headerHeight,
          backgroundColor: landingColors.darkBg,
          borderBottom: 'none',
        }}
      >
        <div
          style={{
            ...landingContainerStyle(),
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <SiteLogo variant="wordmark" size={36} />
          </Link>

          <nav className="landing-header-nav" style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' }}>
            {navLinks}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Button type="text" onClick={() => navigate('/login')} style={{ fontWeight: 500, color: landingColors.textOnDark }}>
              Войти
            </Button>
            <Button
              type="primary"
              onClick={() => navigate('/register')}
              style={{
                backgroundColor: landingColors.accent,
                borderColor: landingColors.accent,
                borderRadius: landingRadii.md,
                fontWeight: 600,
                height: 40,
                paddingInline: 18,
              }}
            >
              Попробовать бесплатно
            </Button>
            <Button
              className="landing-header-burger"
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMenuOpen(true)}
              style={{ display: 'none', color: landingColors.textOnDark }}
              aria-label="Меню"
            />
          </div>
        </div>
      </header>

      <Drawer title="Меню" placement="right" onClose={() => setMenuOpen(false)} open={menuOpen} width={280}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {landingNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{ color: landingColors.textPrimary, fontSize: 16, fontWeight: 500, textDecoration: 'none' }}
            >
              {item.label}
            </a>
          ))}
          <Button block onClick={() => { setMenuOpen(false); navigate('/login') }}>
            Войти
          </Button>
          <Button
            block
            type="primary"
            onClick={() => { setMenuOpen(false); navigate('/register') }}
            style={{ backgroundColor: landingColors.accent, borderColor: landingColors.accent }}
          >
            Попробовать бесплатно
          </Button>
        </div>
      </Drawer>
    </>
  )
}
