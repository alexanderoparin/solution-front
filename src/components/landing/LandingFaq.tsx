import { Collapse } from 'antd'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import { LANDING_ANCHORS, landingBlogTeaser, landingFaq } from '../../content/landingContent'
import { landingColors, landingRadii } from '../../styles/landing'
import { landingContainerStyle, landingSectionStyle } from './landingShared'

type LandingFaqItem = (typeof landingFaq)[number]

function buildFaqItems(items: readonly LandingFaqItem[]) {
  return items.map((item, index) => ({
    key: String(index),
    label: <span style={{ fontWeight: 600, color: landingColors.textPrimary, fontSize: 15 }}>{item.question}</span>,
    children: <p style={{ margin: 0, color: landingColors.textSecondary, lineHeight: 1.65 }}>{item.answer}</p>,
    style: {
      marginBottom: 12,
      borderRadius: landingRadii.lg,
      border: `1px solid ${landingColors.border}`,
      backgroundColor: landingColors.cardBg,
      overflow: 'hidden',
    },
  }))
}

export default function LandingFaq() {
  const mid = Math.ceil(landingFaq.length / 2)
  const leftColumn = landingFaq.slice(0, mid)
  const rightColumn = landingFaq.slice(mid)

  const collapseProps = {
    bordered: false as const,
    style: { background: 'transparent' },
    expandIconPosition: 'end' as const,
    expandIcon: ({ isActive }: { isActive?: boolean }) =>
      isActive ? <MinusOutlined style={{ fontSize: 14, color: landingColors.textMuted }} /> : <PlusOutlined style={{ fontSize: 14, color: landingColors.textMuted }} />,
  }

  return (
    <>
      <style>{`
        .landing-faq-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
        }
        .landing-faq-grid .ant-collapse-item .ant-collapse-header {
          padding: 16px 20px !important;
          align-items: center !important;
        }
        .landing-faq-grid .ant-collapse-item .ant-collapse-content-box {
          padding: 0 20px 16px !important;
        }
        @media (max-width: 768px) {
          .landing-faq-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <section
        id={LANDING_ANCHORS.faq}
        style={{ ...landingSectionStyle(), backgroundColor: '#F5F3FF' }}
      >
        <div style={landingContainerStyle()}>
          <div style={{ marginBottom: 40 }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: landingColors.accent,
                backgroundColor: landingColors.accentLight,
                padding: '6px 14px',
                borderRadius: landingRadii.pill,
                marginBottom: 16,
              }}
            >
              Вопросы и ответы
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(28px, 4vw, 36px)',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: landingColors.textPrimary,
              }}
            >
              Частые вопросы
            </h2>
          </div>

          <div className="landing-faq-grid">
            <Collapse {...collapseProps} items={buildFaqItems(leftColumn)} />
            <Collapse {...collapseProps} items={buildFaqItems(rightColumn)} />
          </div>
        </div>
      </section>
    </>
  )
}

export function LandingBlogSection() {
  return (
    <section id={LANDING_ANCHORS.blog} style={{ ...landingSectionStyle({ paddingTop: 0 }), backgroundColor: landingColors.sectionBg }}>
      <div style={landingContainerStyle()}>
        <div
          style={{
            borderRadius: landingRadii.lg,
            border: `1px dashed ${landingColors.border}`,
            padding: '32px 28px',
            textAlign: 'center',
            backgroundColor: landingColors.cardBg,
          }}
        >
          <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: landingColors.textPrimary }}>{landingBlogTeaser.title}</h3>
          <p style={{ margin: 0, color: landingColors.textSecondary, lineHeight: 1.6, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
            {landingBlogTeaser.description}
          </p>
        </div>
      </div>
    </section>
  )
}
