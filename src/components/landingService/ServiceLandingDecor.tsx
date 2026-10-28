import type { ReactElement } from 'react'
import { landingColors } from '../../styles/landing'

/** Пятна чуть насыщеннее/темнее, чем раньше — как на макете. */
const purple = 'rgba(109, 40, 217, 0.42)'
const purpleSoft = 'rgba(124, 58, 237, 0.36)'
const green = landingColors.brandGreen
const greenGlow = 'rgba(163, 201, 0, 0.34)'

/**
 * Непрерывный фоновый декор на весь лендинг: пятна, линии и точки
 * тянутся по всей высоте страницы без обрыва на стыках секций.
 */
export default function ServiceLandingAmbient() {
  return (
    <div
      className="svc-ambient"
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* Hero — фиолетовое пятно правее/ниже уводим, чтобы не заливало угол скрина */}
      <Blob top="0%" right="12%" size={340} color={purple} blur={95} opacity={0.38} />
      <Blob top="6%" left="38%" size={260} color={greenGlow} blur={80} opacity={0.5} />
      <Blob top="14%" left="-6%" size={360} color={purpleSoft} blur={100} opacity={0.48} />
      {/* Ниже hero — насыщеннее, чтобы белые скрины не сливались */}
      <Blob top="22%" right="8%" size={300} color={greenGlow} blur={90} opacity={0.95} />
      {/* Правые пятна в зоне «для кого» приглушены — иначе сливаются с рукописным callout */}
      <Blob top="28%" right="-2%" size={440} color={purple} blur={100} opacity={0.55} />
      <Blob top="32%" left="18%" size={340} color={purple} blur={95} opacity={0.95} />
      <Blob top="38%" right="12%" size={360} color={purpleSoft} blur={90} opacity={0.45} />
      <Blob top="42%" right="-8%" size={380} color={purpleSoft} blur={100} opacity={0.5} />
      <Blob top="52%" left="-4%" size={320} color={greenGlow} blur={90} opacity={0.85} />
      <Blob top="62%" right="22%" size={280} color={purple} blur={85} opacity={0.9} />
      <Blob top="72%" left="30%" size={360} color={purpleSoft} blur={100} opacity={0.95} />
      <Blob top="82%" right="-6%" size={340} color={greenGlow} blur={95} opacity={0.85} />
      <Blob top="90%" left="-8%" size={300} color={purple} blur={90} opacity={0.85} />

      {/* Сетки точек (hero-точки — у скриншота отдельно; у caps слева не ставим) */}
      <DotGrid top="28%" right="6%" cols={5} rows={5} gap={13} opacity={0.45} />
      <DotGrid top="68%" right="12%" cols={5} rows={4} gap={14} opacity={0.45} />
      <DotGrid top="88%" left="40%" cols={4} rows={4} gap={12} opacity={0.38} />

      {/* Длинные зелёные линии на всю высоту */}
      <svg
        viewBox="0 0 1200 4000"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {/* В зоне hero — линия слева у текста, не через скриншот */}
        <path
          d="M 40 120 C 120 200, 160 280, 90 360 S 40 480, 130 560"
          fill="none"
          stroke={green}
          strokeWidth="1.4"
          strokeOpacity="0.32"
          strokeLinecap="round"
        />
        {/* Линию с правой стороны уводим ниже hero */}
        <path
          d="M 1280 720 C 1100 800, 980 680, 820 780 S 560 900, 380 820 S 120 740, -40 860"
          fill="none"
          stroke={green}
          strokeWidth="1.2"
          strokeOpacity="0.24"
          strokeLinecap="round"
        />
        <path
          d="M -40 1100 C 220 980, 400 1220, 620 1080 S 980 940, 1180 1120"
          fill="none"
          stroke={green}
          strokeWidth="1.3"
          strokeOpacity="0.26"
          strokeLinecap="round"
        />
        <path
          d="M 1280 1600 C 1040 1480, 860 1720, 640 1580 S 280 1420, 40 1600"
          fill="none"
          stroke={green}
          strokeWidth="1.2"
          strokeOpacity="0.22"
          strokeLinecap="round"
        />
        <path
          d="M -40 2100 C 200 2220, 380 1980, 580 2140 S 920 2340, 1180 2160"
          fill="none"
          stroke={green}
          strokeWidth="1.4"
          strokeOpacity="0.28"
          strokeLinecap="round"
        />
        <path
          d="M 1280 2600 C 1000 2480, 820 2720, 600 2560 S 240 2400, -40 2580"
          fill="none"
          stroke={green}
          strokeWidth="1.2"
          strokeOpacity="0.22"
          strokeLinecap="round"
        />
        <path
          d="M -40 3100 C 240 2980, 420 3220, 640 3080 S 960 2920, 1240 3140"
          fill="none"
          stroke={green}
          strokeWidth="1.3"
          strokeOpacity="0.25"
          strokeLinecap="round"
        />
        <path
          d="M 1280 3600 C 980 3720, 780 3480, 560 3640 S 220 3840, -40 3660"
          fill="none"
          stroke={green}
          strokeWidth="1.2"
          strokeOpacity="0.22"
          strokeLinecap="round"
        />
        {/* Лёгкая сетка на отдельных участках */}
        {[200, 1400, 2500, 3400].map((y0) =>
          [180, 360, 540, 720, 900].map((x) => (
            <line
              key={`v-${y0}-${x}`}
              x1={x}
              y1={y0}
              x2={x}
              y2={y0 + 280}
              stroke={green}
              strokeWidth="0.8"
              strokeOpacity="0.08"
            />
          ))
        )}
      </svg>
    </div>
  )
}

function Blob({
  top,
  right,
  bottom,
  left,
  size,
  color,
  blur = 80,
  opacity = 0.85,
}: {
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  size: number
  color: string
  blur?: number
  opacity?: number
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        right,
        bottom,
        left,
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: `blur(${blur}px)`,
        opacity,
        transform: 'translateZ(0)',
      }}
    />
  )
}

function DotGrid({
  top,
  right,
  bottom,
  left,
  cols = 5,
  rows = 8,
  gap = 14,
  size = 3,
  opacity = 0.4,
}: {
  top?: number | string
  right?: number | string
  bottom?: number | string
  left?: number | string
  cols?: number
  rows?: number
  gap?: number
  size?: number
  opacity?: number
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
            background: green,
            opacity,
            display: 'block',
          }}
        />
      )
    }
  }
  return (
    <div
      style={{
        position: 'absolute',
        top,
        right,
        bottom,
        left,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gap,
      }}
    >
      {dots}
    </div>
  )
}
