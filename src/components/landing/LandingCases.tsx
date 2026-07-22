import { Button } from 'antd'
import { ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined, DownloadOutlined } from '@ant-design/icons'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { LANDING_ANCHORS, landingCases, landingCasesPresentationUrl } from '../../content/landingContent'
import { landingColors, landingRadii } from '../../styles/landing'
import { LandingSectionTitle, landingContainerStyle, landingSectionStyle } from './landingShared'

const chartStroke = landingColors.accent
const successGreen = '#16A34A'

type CaseMetric = (typeof landingCases)[number]['metrics'][number]

function MetricRow({ metric }: { metric: CaseMetric }) {
  const TrendIcon = metric.direction === 'up' ? ArrowUpOutlined : ArrowDownOutlined
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        lineHeight: 1.35,
        color: landingColors.textPrimary,
      }}
    >
      <span style={{ fontWeight: 600, minWidth: 58 }}>{metric.label}:</span>
      <span style={{ color: landingColors.textSecondary }}>{metric.from}</span>
      <ArrowRightOutlined style={{ fontSize: 10, color: landingColors.textMuted }} />
      <span style={{ fontWeight: 700, color: metric.improved ? successGreen : landingColors.textPrimary }}>
        {metric.to}
      </span>
      {metric.improved ? <TrendIcon style={{ fontSize: 12, color: successGreen }} /> : null}
    </div>
  )
}

function CaseSparkline({ values, gradientId }: { values: readonly number[]; gradientId: string }) {
  const data = values.map((value, index) => ({ index, value }))
  return (
    <div style={{ width: '100%', height: 72, marginTop: 12 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartStroke} stopOpacity={0.28} />
              <stop offset="100%" stopColor={chartStroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="linear"
            dataKey="value"
            stroke={chartStroke}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={{ r: 3.5, fill: chartStroke, strokeWidth: 0 }}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Блок кейсов на лендинге: карточки с метриками «было → стало» и sparkline.
 */
export default function LandingCases() {
  return (
    <>
      <style>{`
        .landing-cases-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .landing-case-card {
          display: flex;
          flex-direction: column;
          border-radius: ${landingRadii.lg}px;
          border: 1px solid ${landingColors.border};
          background: ${landingColors.cardBg};
          padding: 16px;
          min-height: 100%;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .landing-case-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1);
        }
        @media (max-width: 1100px) {
          .landing-cases-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .landing-cases-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <section id={LANDING_ANCHORS.cases} style={{ ...landingSectionStyle(), backgroundColor: landingColors.sectionBg }}>
        <div style={landingContainerStyle()}>
          <LandingSectionTitle
            title="Кейсы наших клиентов"
            subtitle="Реальные результаты продвижения на Wildberries"
          />
          <div className="landing-cases-grid">
            {landingCases.map((item) => (
              <article key={item.id} className="landing-case-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <img
                    src={item.thumb}
                    alt={item.title}
                    loading="lazy"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      objectFit: 'cover',
                      border: `1px solid ${landingColors.border}`,
                      backgroundColor: '#FFFFFF',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ fontSize: 16, fontWeight: 700, color: landingColors.textPrimary, lineHeight: 1.25 }}>
                    {item.title}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {item.metrics.map((metric) => (
                    <MetricRow key={`${item.id}-${metric.label}`} metric={metric} />
                  ))}
                </div>
                <CaseSparkline values={item.chart} gradientId={`landing-case-spark-${item.id}`} />
              </article>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              href={landingCasesPresentationUrl}
              download="Кейсы Clicki.pdf"
              style={{
                backgroundColor: landingColors.accent,
                borderColor: landingColors.accent,
                borderRadius: landingRadii.md,
                height: 48,
                paddingInline: 28,
                fontWeight: 600,
              }}
            >
              Посмотреть все кейсы
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
