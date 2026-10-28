import { useEffect, useState } from 'react'
import { serviceBotWidget, serviceLandingAssets } from '../../content/landingServiceContent'
import { svc } from './landingServiceShared'

/**
 * Стрелка по окружности: старт у пузыря → дуга вверх → наконечник в робота.
 * sweep=1 (по часовой): касательная на конце смотрит вправо, на иконку.
 */
const TIP_ARROW = (
  <svg width="40" height="34" viewBox="0 0 40 34" fill="none" aria-hidden>
    <defs>
      <marker
        id="svc-bot-tip-arrowhead"
        markerWidth="8"
        markerHeight="8"
        refX="6"
        refY="4"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M0 0.8 L7 4 L0 7.2 Z" fill={svc.accent} />
      </marker>
    </defs>
    <path
      d="M 3 28 A 24 24 0 0 1 36 10"
      stroke={svc.accent}
      strokeWidth="2.25"
      strokeLinecap="round"
      fill="none"
      markerEnd="url(#svc-bot-tip-arrowhead)"
    />
  </svg>
)

const SPARKLES = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden style={{ marginLeft: 2, flexShrink: 0 }}>
    <path d="M7 1.2L7.9 5.1L11.8 6L7.9 6.9L7 10.8L6.1 6.9L2.2 6L6.1 5.1L7 1.2Z" fill="#FACC15" />
    <path d="M11.2 8.5L11.55 10L13 10.35L11.55 10.7L11.2 12.2L10.85 10.7L9.4 10.35L10.85 10L11.2 8.5Z" fill="#FDE047" />
  </svg>
)

const EXCEL_ICON = (
  <svg width="52" height="58" viewBox="0 0 52 58" fill="none" aria-hidden>
    <rect x="8" y="2" width="36" height="48" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
    <path d="M44 12H36.5C35.7 12 35 11.3 35 10.5V2L44 12Z" fill="#E2E8F0" />
    <rect x="14" y="18" width="24" height="22" rx="2" fill="#107C41" />
    <path
      d="M20 23.5L26 29.5L32 23.5M20 34.5L26 28.5L32 34.5"
      stroke="#FFFFFF"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const FLOW_ARROW = (
  <svg width="36" height="42" viewBox="0 0 36 42" fill="none" aria-hidden>
    <defs>
      <marker
        id="svc-bot-flow-arrowhead"
        markerWidth="7"
        markerHeight="7"
        refX="5.5"
        refY="3.5"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M0 0.6 L6.5 3.5 L0 6.4 Z" fill="#60A5FA" />
      </marker>
    </defs>
    <path
      d="M6 34 A 26 26 0 0 1 30 8"
      stroke="#60A5FA"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      markerEnd="url(#svc-bot-flow-arrowhead)"
    />
  </svg>
)

const COINS_ICON = (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
    <ellipse cx="14" cy="20" rx="9" ry="3.2" fill="#7C3AED" opacity="0.35" />
    <ellipse cx="14" cy="16.5" rx="9" ry="3.2" fill="#8B5CF6" />
    <ellipse cx="14" cy="13" rx="9" ry="3.2" fill="#A78BFA" />
    <ellipse cx="14" cy="9.5" rx="9" ry="3.2" fill="#C4B5FD" />
    <ellipse cx="14" cy="9.5" rx="9" ry="3.2" fill="none" stroke="#7C3AED" strokeWidth="1" />
  </svg>
)

function TipText({ compact }: { compact?: boolean }) {
  const { tipBefore, tipAccent, tipAfter } = serviceBotWidget
  return (
    <span
      style={{
        display: 'block',
        fontSize: compact ? 12 : 14,
        lineHeight: 1.3,
        fontWeight: 600,
        color: svc.text,
      }}
    >
      <span style={{ whiteSpace: 'nowrap' }}>
        {tipBefore}
        <span style={{ color: svc.accent }}>{tipAccent}</span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
        {tipAfter}
        {SPARKLES}
      </span>
    </span>
  )
}

/**
 * Плавающий виджет Telegram-бота: иконка с зелёной точкой,
 * подсказка через 5–7 с, по клику — модалка с CTA в бота.
 */
export default function ServiceLandingBotWidget() {
  const [tipVisible, setTipVisible] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTipVisible(true)
    }, serviceBotWidget.tipDelayMs)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const showFloatingTip = tipVisible && !open

  return (
    <>
      <style>{`
        @keyframes svc-bot-tip-in {
          from { opacity: 0; transform: translateX(8px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes svc-bot-modal-in {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes svc-bot-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45); }
          50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
        }
        .svc-bot-fab:hover { transform: scale(1.06); }
        .svc-bot-cta:hover { filter: brightness(1.06); }
        @media (max-width: 480px) {
          .svc-bot-panel {
            width: calc(100vw - 24px) !important;
            right: 12px !important;
            bottom: 12px !important;
            max-height: min(560px, calc(100vh - 24px)) !important;
          }
          .svc-bot-fab-wrap { right: 14px !important; bottom: 14px !important; }
        }
      `}</style>

      {/* FAB + tip */}
      {!open && (
        <div
          className="svc-bot-fab-wrap"
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 22,
            pointerEvents: 'none',
          }}
        >
          {showFloatingTip && (
            <div
              style={{
                position: 'relative',
                pointerEvents: 'auto',
                animation: 'svc-bot-tip-in 0.45s ease-out both',
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: '10px 14px',
                  boxShadow: '0 8px 28px rgba(15, 23, 42, 0.12)',
                  border: `1px solid ${svc.border}`,
                  maxWidth: 230,
                }}
              >
                <TipText />
              </div>
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  right: -28,
                  top: -12,
                  pointerEvents: 'none',
                  transform: 'rotate(12deg)',
                  transformOrigin: 'left bottom',
                }}
              >
                {TIP_ARROW}
              </div>
            </div>
          )}

          <button
            type="button"
            className="svc-bot-fab"
            aria-label="Открыть бота проверки рекламы"
            onClick={() => setOpen(true)}
            style={{
              position: 'relative',
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: 'transparent',
              boxShadow: '0 10px 28px rgba(109, 40, 217, 0.35)',
              transition: 'transform 0.2s ease',
              pointerEvents: 'auto',
              flexShrink: 0,
            }}
          >
            <img
              src={serviceLandingAssets.botAvatar}
              alt=""
              width={64}
              height={64}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#22C55E',
                border: '2.5px solid #FFFFFF',
                animation: 'svc-bot-pulse 2.2s ease-in-out infinite',
              }}
            />
          </button>
        </div>
      )}

      {/* Modal panel */}
      {open && (
        <>
          <div
            role="presentation"
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1190,
              background: 'rgba(15, 23, 42, 0.18)',
            }}
          />
          <div
            className="svc-bot-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Проверка рекламы на WB"
            style={{
              position: 'fixed',
              right: 24,
              bottom: 24,
              zIndex: 1210,
              width: 320,
              maxHeight: 'min(620px, calc(100vh - 32px))',
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: 20,
              boxShadow: '0 24px 64px rgba(15, 23, 42, 0.22)',
              border: `1px solid ${svc.border}`,
              padding: '18px 18px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              animation: 'svc-bot-modal-in 0.35s ease-out both',
            }}
          >
            <button
              type="button"
              aria-label="Закрыть"
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 28,
                height: 28,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#94A3B8',
                fontSize: 20,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
              }}
            >
              ×
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 28 }}>
              <img
                src={serviceLandingAssets.botAvatar}
                alt=""
                width={64}
                height={64}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  boxShadow: '0 6px 16px rgba(109, 40, 217, 0.28)',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  background: svc.accentSoft,
                  borderRadius: 18,
                  padding: '12px 16px',
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {/* Хвостик пузыря влево — к аватару */}
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: -7,
                    top: '50%',
                    marginTop: -7,
                    width: 0,
                    height: 0,
                    borderTop: '7px solid transparent',
                    borderBottom: '7px solid transparent',
                    borderRight: `8px solid ${svc.accentSoft}`,
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.35,
                    fontWeight: 700,
                    color: svc.accent,
                  }}
                >
                  {serviceBotWidget.modalBadgeLines.map((line) => (
                    <span key={line} style={{ display: 'block' }}>
                      {line}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            <h3
              style={{
                margin: 0,
                fontSize: 22,
                lineHeight: 1.25,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: svc.text,
              }}
            >
              {serviceBotWidget.titleBefore.trimEnd()}
              <span style={{ display: 'block', color: svc.accent }}>
                {serviceBotWidget.titleAccent}
                {serviceBotWidget.titleAfter}
              </span>
            </h3>

            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.45,
                color: svc.muted,
              }}
            >
              {serviceBotWidget.description}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: '#F1F5F9',
                borderRadius: 16,
                padding: '14px 12px 14px 10px',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  width: 72,
                  height: 88,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 8,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #FFFFFF 35%, rgba(255,255,255,0) 72%)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.6)',
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1 }}>{EXCEL_ICON}</div>
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    right: -6,
                    top: 0,
                    zIndex: 2,
                    transform: 'rotate(8deg)',
                  }}
                >
                  {FLOW_ARROW}
                </div>
              </div>

              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {serviceBotWidget.legend.map((item) => (
                  <li
                    key={item.line2}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 7,
                        background: item.soft,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          background: item.color,
                        }}
                      />
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        lineHeight: 1.3,
                        fontWeight: 600,
                        color: svc.text,
                      }}
                    >
                      <span style={{ display: 'block' }}>{item.line1}</span>
                      <span style={{ display: 'block' }}>{item.line2}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {COINS_ICON}
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: svc.text,
                  fontWeight: 500,
                }}
              >
                {serviceBotWidget.note}
              </p>
            </div>

            <a
              className="svc-bot-cta"
              href={serviceBotWidget.botUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 4,
                height: 48,
                borderRadius: 12,
                background: svc.accent,
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'filter 0.15s ease',
              }}
            >
              {serviceBotWidget.cta}
            </a>
          </div>
        </>
      )}
    </>
  )
}
