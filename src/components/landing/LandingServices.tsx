import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from 'antd'
import {
  AimOutlined,
  BarChartOutlined,
  CheckOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { LANDING_ANCHORS, landingServices } from '../../content/landingContent'
import { landingColors, landingRadii } from '../../styles/landing'
import type { LandingLeadRequestType } from './LandingLeadRequestModal'
import { LandingSectionTitle, landingContainerStyle, landingSectionStyle } from './landingShared'

const serviceIcons = {
  analytics: <BarChartOutlined />,
  bidder: <RocketOutlined />,
  agency: <AimOutlined />,
} as const

type ServiceActionVariant = 'solid-purple' | 'outline-purple' | 'outline-green' | 'solid-green'

function serviceActionClassName(variant: ServiceActionVariant): string {
  return `landing-service-btn landing-service-btn--${variant}`
}

function serviceActionStyle(variant: ServiceActionVariant, fullWidth?: boolean): CSSProperties {
  const base: CSSProperties = {
    flex: fullWidth ? '1 1 100%' : '1 1 0',
    minWidth: 0,
    height: 44,
    borderRadius: landingRadii.sm,
    fontWeight: 600,
    fontSize: 14,
    boxShadow: 'none',
  }

  switch (variant) {
    case 'solid-purple':
      return {
        ...base,
        backgroundColor: landingColors.accent,
        borderColor: landingColors.accent,
        color: '#FFFFFF',
      }
    case 'outline-purple':
      return {
        ...base,
        backgroundColor: landingColors.cardBg,
        borderColor: landingColors.accent,
        color: landingColors.accent,
      }
    case 'outline-green':
      return {
        ...base,
        backgroundColor: landingColors.cardBg,
        borderColor: landingColors.brandGreen,
        color: landingColors.brandGreen,
      }
    case 'solid-green':
      return {
        ...base,
        width: fullWidth ? '100%' : undefined,
        backgroundColor: landingColors.brandGreen,
        borderColor: landingColors.brandGreen,
        color: landingColors.textPrimary,
      }
    default:
      return base
  }
}

interface LandingServicesProps {
  onOpenLeadForm: (type: LandingLeadRequestType) => void
}

export default function LandingServices({ onOpenLeadForm }: LandingServicesProps) {
  const navigate = useNavigate()

  return (
    <>
      <style>{`
        .landing-services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .landing-service-card { height: 100%; transition: transform 0.2s, box-shadow 0.2s; }
        .landing-service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(124,58,237,0.12);
        }
        .landing-service-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: auto;
          width: 100%;
        }
        .landing-service-btn--solid-purple:hover,
        .landing-service-btn--solid-purple:focus {
          background: ${landingColors.accentHover} !important;
          border-color: ${landingColors.accentHover} !important;
          color: #fff !important;
        }
        .landing-service-btn--outline-purple:hover,
        .landing-service-btn--outline-purple:focus {
          background: ${landingColors.accentLight} !important;
          border-color: ${landingColors.accent} !important;
          color: ${landingColors.accent} !important;
        }
        .landing-service-btn--outline-green:hover,
        .landing-service-btn--outline-green:focus {
          background: rgba(180, 215, 5, 0.12) !important;
          border-color: ${landingColors.brandGreen} !important;
          color: ${landingColors.brandGreen} !important;
        }
        .landing-service-btn--solid-green:hover,
        .landing-service-btn--solid-green:focus {
          background: ${landingColors.brandGreenHover} !important;
          border-color: ${landingColors.brandGreenHover} !important;
          color: ${landingColors.textPrimary} !important;
        }
        @media (max-width: 960px) {
          .landing-services-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <section id={LANDING_ANCHORS.services} style={{ ...landingSectionStyle({ paddingTop: 32, paddingBottom: 64 }), backgroundColor: landingColors.sectionBg }}>
        <div style={landingContainerStyle()}>
          <LandingSectionTitle title="Наши сервисы" subtitle="Решения, которые помогают зарабатывать больше на Wildberries" />
          <div className="landing-services-grid">
            {landingServices.map((service) => (
              <Card
                key={service.id}
                className="landing-service-card"
                style={{ borderRadius: landingRadii.lg, border: `1px solid ${landingColors.border}` }}
                bodyStyle={{ padding: 28, display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: landingRadii.md,
                        backgroundColor: landingColors.accentLight,
                        color: landingColors.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      {serviceIcons[service.id as keyof typeof serviceIcons]}
                    </div>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: landingColors.textPrimary, lineHeight: 1.3 }}>
                      {service.title}
                    </h3>
                  </div>
                  {service.badge ? (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: landingColors.accent,
                        backgroundColor: landingColors.accentLight,
                        padding: '4px 10px',
                        borderRadius: landingRadii.pill,
                        flexShrink: 0,
                      }}
                    >
                      {service.badge}
                    </span>
                  ) : null}
                </div>
                <p style={{ margin: '0 0 16px', color: landingColors.textSecondary, lineHeight: 1.6 }}>{service.description}</p>
                <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {service.bullets.map((bullet) => (
                    <li key={bullet} style={{ display: 'flex', gap: 8, fontSize: 14, color: landingColors.textSecondary }}>
                      <CheckOutlined style={{ color: landingColors.accent, marginTop: 3 }} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={service.detailLink.href}
                  style={{
                    display: 'inline-block',
                    marginBottom: 16,
                    color: landingColors.accent,
                    fontWeight: 500,
                    fontSize: 14,
                    textDecoration: 'none',
                  }}
                >
                  {service.detailLink.label} →
                </a>
                {service.image ? (
                  <img
                    src={service.image}
                    alt=""
                    style={{
                      width: '100%',
                      borderRadius: landingRadii.md,
                      marginBottom: 20,
                      border: `1px solid ${landingColors.border}`,
                    }}
                  />
                ) : null}
                <div className="landing-service-actions">
                  {service.actions.map((action) => {
                    const className = serviceActionClassName(action.variant)
                    const style = serviceActionStyle(action.variant, 'fullWidth' in action ? action.fullWidth : false)

                    if ('consultationForm' in action && action.consultationForm) {
                      return (
                        <Button
                          key={action.label}
                          className={className}
                          style={style}
                          onClick={() => onOpenLeadForm('consultation')}
                        >
                          {action.label}
                        </Button>
                      )
                    }

                    return (
                      <Button
                        key={action.label}
                        type="primary"
                        className={className}
                        style={style}
                        onClick={() => navigate('to' in action ? action.to : '/register')}
                      >
                        {action.label}
                      </Button>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
