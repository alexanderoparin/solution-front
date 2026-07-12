import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { LANDING_ANCHORS, landingPricing, landingPricingNote } from '../../content/landingContent'
import { landingColors, landingRadii } from '../../styles/landing'
import type { LandingLeadRequestType } from './LandingLeadRequestModal'
import { LandingSectionTitle, landingContainerStyle, landingSectionStyle } from './landingShared'

interface LandingPricingProps {
  onOpenLeadForm: (type: LandingLeadRequestType) => void
}

type PricingPlanId = (typeof landingPricing)[number]['id']

function pricingBadgeStyle(): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: landingRadii.sm,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    color: landingColors.textPrimary,
    backgroundColor: landingColors.brandGreen,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }
}

function pricingCheckColor(planId: PricingPlanId): string {
  return planId === 'analytics' || planId === 'bidder' ? landingColors.accent : landingColors.brandGreen
}

function pricingButtonStyle(planId: PricingPlanId): CSSProperties {
  const base: CSSProperties = {
    borderRadius: landingRadii.md,
    fontWeight: 600,
    height: 44,
  }

  if (planId === 'agency' || planId === 'audit') {
    return {
      ...base,
      backgroundColor: landingColors.brandGreen,
      borderColor: landingColors.brandGreen,
      color: landingColors.textPrimary,
    }
  }

  return {
    ...base,
    backgroundColor: landingColors.accent,
    borderColor: landingColors.accent,
    color: '#FFFFFF',
  }
}

function isGreenPricingButton(planId: PricingPlanId): boolean {
  return planId === 'agency' || planId === 'audit'
}

export default function LandingPricing({ onOpenLeadForm }: LandingPricingProps) {
  const navigate = useNavigate()

  return (
    <>
      <style>{`
        .landing-pricing-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          align-items: stretch;
        }
        .landing-pricing-btn--purple:hover,
        .landing-pricing-btn--purple:focus {
          background: ${landingColors.accentHover} !important;
          border-color: ${landingColors.accentHover} !important;
          color: #fff !important;
        }
        .landing-pricing-btn--green:hover,
        .landing-pricing-btn--green:focus {
          background: ${landingColors.brandGreenHover} !important;
          border-color: ${landingColors.brandGreenHover} !important;
          color: ${landingColors.textPrimary} !important;
        }
        @media (max-width: 1200px) {
          .landing-pricing-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .landing-pricing-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
          .landing-pricing-note { white-space: normal; }
        }
        .landing-pricing-note {
          margin: 32px 0 0;
          text-align: center;
          font-size: 15px;
          line-height: 1.6;
          color: ${landingColors.textSecondary};
          white-space: nowrap;
        }
      `}</style>
      <section id={LANDING_ANCHORS.pricing} style={{ ...landingSectionStyle({ paddingTop: 56 }), backgroundColor: landingColors.sectionBg }}>
        <div style={landingContainerStyle()}>
          <LandingSectionTitle title="Тарифы и условия" subtitle="Выберите подходящий формат работы с рекламой" />
          <div className="landing-pricing-grid">
            {landingPricing.map((plan) => (
              <Card
                key={plan.id}
                style={{
                  borderRadius: landingRadii.lg,
                  border: plan.popular ? `2px solid ${landingColors.accent}` : `1px solid ${landingColors.border}`,
                  boxShadow: plan.popular ? '0 12px 32px rgba(124,58,237,0.12)' : undefined,
                  height: '100%',
                }}
                bodyStyle={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: landingColors.textPrimary, lineHeight: 1.3 }}>
                    {plan.name}
                  </h3>
                  {plan.badge ? <span style={pricingBadgeStyle()}>{plan.badge}</span> : null}
                </div>
                <p style={{ margin: '0 0 20px', fontSize: 14, color: landingColors.textSecondary, lineHeight: 1.5 }}>{plan.description}</p>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: landingColors.accent, letterSpacing: '-0.02em' }}>{plan.priceLabel}</span>
                  <span style={{ fontSize: 15, color: landingColors.textMuted }}>{plan.period}</span>
                </div>
                <ul style={{ margin: '0 0 28px', padding: 0, listStyle: 'none', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{ display: 'flex', gap: 8, fontSize: 14, color: landingColors.textSecondary }}>
                      <CheckOutlined style={{ color: pricingCheckColor(plan.id), marginTop: 3 }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {'auditForm' in plan.cta && plan.cta.auditForm ? (
                  <Button
                    block
                    size="large"
                    className="landing-pricing-btn--green"
                    onClick={() => onOpenLeadForm('audit')}
                    style={pricingButtonStyle(plan.id)}
                  >
                    {plan.cta.label}
                  </Button>
                ) : 'consultationForm' in plan.cta && plan.cta.consultationForm ? (
                  <Button
                    block
                    size="large"
                    className="landing-pricing-btn--green"
                    onClick={() => onOpenLeadForm('consultation')}
                    style={pricingButtonStyle(plan.id)}
                  >
                    {plan.cta.label}
                  </Button>
                ) : (
                  <Button
                    block
                    type="primary"
                    size="large"
                    className={isGreenPricingButton(plan.id) ? 'landing-pricing-btn--green' : 'landing-pricing-btn--purple'}
                    onClick={() => navigate('to' in plan.cta ? plan.cta.to : '/register')}
                    style={pricingButtonStyle(plan.id)}
                  >
                    {plan.cta.label}
                  </Button>
                )}
              </Card>
            ))}
          </div>
          <p className="landing-pricing-note">{landingPricingNote}</p>
        </div>
      </section>
    </>
  )
}
