import type { ReactElement } from 'react'
import { landingColors } from '../../styles/landing'
import { serviceLandingAssets } from '../../content/landingServiceContent'

const lime = landingColors.brandGreen

/**
 * Hero-скриншот как в макете: скруглённая рамка с мягким фиолетовым свечением
 * и сетки лаймовых точек за углами скрина.
 */
export default function ServiceLandingHeroVisual() {
  return (
    <div
      className="svc-hero-visual"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 'none',
        marginLeft: '4%',
        marginRight: '-4%',
        marginTop: 64,
        padding: '12px 44px 40px 8px',
        overflow: 'visible',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .svc-hero-visual {
            margin-left: 0 !important;
            margin-right: 0 !important;
            margin-top: 12px !important;
            /* Поля под точки и тень — всё внутри, без clip по краю экрана */
            padding: 28px 18px 36px !important;
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .svc-hero-visual .svc-hero-shot {
            width: 100% !important;
            max-width: 100% !important;
          }
          .svc-hero-visual .svc-hero-frame {
            border-radius: 12px !important;
            padding: 3px !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            box-shadow:
              0 0 0 3px rgba(255, 255, 255, 0.95),
              0 0 0 4px rgba(196, 181, 253, 0.45),
              0 12px 28px rgba(124, 58, 237, 0.14) !important;
          }
          .svc-hero-visual .svc-hero-frame img {
            border-radius: 10px !important;
            aspect-ratio: auto !important;
            object-fit: contain !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
          }
          /* Точки за скрином, выглядывают из углов */
          .svc-hero-visual .svc-hero-dots-tl {
            top: -18px !important;
            left: -14px !important;
            z-index: 0 !important;
            gap: 10px !important;
            grid-template-columns: repeat(6, 3.5px) !important;
          }
          .svc-hero-visual .svc-hero-dots-br {
            bottom: -18px !important;
            right: -14px !important;
            z-index: 0 !important;
            gap: 10px !important;
            grid-template-columns: repeat(6, 3.5px) !important;
          }
          .svc-hero-visual .svc-hero-dots-tl span,
          .svc-hero-visual .svc-hero-dots-br span {
            width: 3.5px !important;
            height: 3.5px !important;
            background: ${lime} !important;
            opacity: 1 !important;
          }
        }
      `}</style>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '0%',
          left: '8%',
          right: '18%',
          bottom: '18%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 40% 45%, rgba(124,58,237,0.18) 0%, rgba(180,215,5,0.1) 40%, transparent 68%)',
          filter: 'blur(28px)',
          zIndex: 0,
        }}
      />

      <div
        className="svc-hero-shot"
        style={{
          position: 'relative',
          width: '100%',
          marginLeft: 0,
          marginRight: 0,
        }}
      >
        <DotGrid
          className="svc-hero-dots svc-hero-dots-tl"
          top={-28}
          left={-40}
          cols={8}
          rows={8}
          gap={18}
          size={3.5}
          opacity={1}
        />
        <DotGrid
          className="svc-hero-dots svc-hero-dots-br"
          bottom={-28}
          right={-40}
          cols={8}
          rows={8}
          gap={18}
          size={3.5}
          opacity={1}
        />

        <div
          className="svc-hero-frame"
          style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 28,
            overflow: 'hidden',
            background: '#fff',
            padding: 5,
            border: '1px solid rgba(167, 139, 250, 0.55)',
            boxShadow: `
              0 0 0 5px rgba(255, 255, 255, 0.95),
              0 0 0 6px rgba(196, 181, 253, 0.55),
              0 28px 64px rgba(124, 58, 237, 0.18),
              0 12px 28px rgba(15, 23, 42, 0.08)
            `,
          }}
        >
          <img
            src={serviceLandingAssets.hero}
            alt="Интерфейс Clicki"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              aspectRatio: '1532 / 760',
              objectFit: 'fill',
              borderRadius: 22,
            }}
          />
        </div>
      </div>
    </div>
  )
}

function DotGrid({
  className,
  top,
  right,
  bottom,
  left,
  cols,
  rows,
  gap,
  size,
  opacity,
}: {
  className?: string
  top?: number
  right?: number
  bottom?: number
  left?: number
  cols: number
  rows: number
  gap: number
  size: number
  opacity: number
}) {
  const dots: ReactElement[] = []
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      dots.push(
        <span
          key={`${r}-${c}`}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: lime,
            opacity,
            display: 'block',
          }}
        />
      )
    }
  }
  return (
    <div
      className={className}
      aria-hidden
      style={{
        position: 'absolute',
        top,
        right,
        bottom,
        left,
        zIndex: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gap,
        pointerEvents: 'none',
      }}
    >
      {dots}
    </div>
  )
}
