import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Drawer } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import SiteLogo from '../SiteLogo'
import { serviceLandingNav } from '../../content/landingServiceContent'
import { landingColors, landingRadii } from '../../styles/landing'
import { svc, svcContainer } from './landingServiceShared'

export default function ServiceLandingHeader() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{`
        .svc-header-nav { display: flex; }
        .svc-header-cta { display: flex; }
        .svc-header-burger { display: none; }
        .svc-header-link:hover { color: ${landingColors.textOnDark} !important; }
        @media (max-width: 960px) {
          .svc-header-nav { display: none !important; }
          .svc-header-cta { display: none !important; }
          .svc-header-burger { display: inline-flex !important; }
        }
      `}</style>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 72,
          backgroundColor: landingColors.darkBg,
          borderBottom: 'none',
        }}
      >
        <div
          style={{
            ...svcContainer(),
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <SiteLogo variant="wordmark" size={34} />
          </Link>

          <nav className="svc-header-nav" style={{ alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' }}>
            {serviceLandingNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="svc-header-link"
                style={{ color: landingColors.textOnDarkMuted, textDecoration: 'none', fontSize: 15, fontWeight: 500 }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="svc-header-cta" style={{ alignItems: 'center', gap: 8 }}>
            <Button type="text" onClick={() => navigate('/login')} style={{ color: landingColors.textOnDark, fontWeight: 500 }}>
              Войти
            </Button>
            <Button
              type="primary"
              onClick={() => navigate('/register')}
              style={{
                background: svc.accent,
                borderColor: svc.accent,
                borderRadius: landingRadii.md,
                fontWeight: 600,
                height: 40,
              }}
            >
              Регистрация →
            </Button>
          </div>

          <Button
            className="svc-header-burger"
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setOpen(true)}
            style={{ color: landingColors.textOnDark }}
          />
        </div>
      </header>

      <Drawer open={open} onClose={() => setOpen(false)} placement="right" width={280} title="Меню">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {serviceLandingNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{ color: svc.text, textDecoration: 'none', fontSize: 16, fontWeight: 500 }}
            >
              {item.label}
            </a>
          ))}
          <Button onClick={() => { setOpen(false); navigate('/login') }}>Войти</Button>
          <Button type="primary" style={{ background: svc.accent, borderColor: svc.accent }} onClick={() => { setOpen(false); navigate('/register') }}>
            Регистрация
          </Button>
        </div>
      </Drawer>
    </>
  )
}
