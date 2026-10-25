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
        .svc-header-link:hover { color: ${svc.text} !important; }
        @media (max-width: 960px) {
          .svc-header-nav { display: none !important; }
          .svc-header-cta { display: none !important; }
          .svc-header-burger { display: inline-flex !important; }
          .svc-header-inner { gap: 12px !important; padding-left: 16px !important; padding-right: 16px !important; }
          .svc-header-logo-wrap { gap: 0 !important; }
          .svc-header-logo-wrap img { height: 28px !important; width: auto !important; }
        }
      `}</style>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 72,
          backgroundColor: '#FFFFFF',
          borderBottom: `1px solid ${landingColors.border}`,
        }}
      >
        <div
          className="svc-header-inner"
          style={{
            ...svcContainer(),
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div className="svc-header-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: 36, minWidth: 0 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <SiteLogo variant="wordmarkDark" size={34} />
            </Link>

            <nav className="svc-header-nav" style={{ alignItems: 'center', gap: 28 }}>
              {serviceLandingNav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="svc-header-link"
                  style={{ color: svc.muted, textDecoration: 'none', fontSize: 15, fontWeight: 500 }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="svc-header-cta" style={{ alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Button type="text" onClick={() => navigate('/login')} style={{ color: svc.text, fontWeight: 500 }}>
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
            style={{ color: svc.text }}
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
