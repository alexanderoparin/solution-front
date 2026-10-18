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
      {/* Подсветка за рамкой — смещена влево/вверх, справа слабее */}
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

      {/* Скрин; точки симметрично: слева сверху и справа снизу по ~2 ряда */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          marginLeft: 0,
          marginRight: 0,
        }}
      >
        <DotGrid top={-28} left={-40} cols={8} rows={8} gap={18} size={3.5} opacity={1} />
        <DotGrid bottom={-28} right={-40} cols={8} rows={8} gap={18} size={3.5} opacity={1} />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 28,
            overflow: 'hidden',
            background: '#fff',
            /* Белая кайма со всех сторон, в т.ч. сверху */
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
              /* Чуть вытянуть по высоте вниз */
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
