import { useCallback, useRef, useState, type ReactElement } from 'react'
import { landingColors } from '../../styles/landing'
import { serviceLandingAssets } from '../../content/landingServiceContent'

const lime = landingColors.brandGreen

/**
 * Hero-видео в скруглённой рамке с мягким фиолетовым свечением
 * и сетки лаймовых точек за углами. Старт — по кнопке Play поверх постера.
 */
export default function ServiceLandingHeroVisual() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)

  const handlePlayClick = useCallback(() => {
    const video = videoRef.current
    if (!video) {
      return
    }
    setStarted(true)
    const playPromise = video.play()
    if (playPromise != null) {
      playPromise
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false)
        })
    } else {
      setPlaying(true)
    }
  }, [])

  return (
    <div
      className="svc-hero-visual"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 'none',
        marginLeft: '0%',
        marginRight: '-4%',
        marginTop: 72,
        padding: '40px 48px 48px 40px',
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
          .svc-hero-visual .svc-hero-media {
            border-radius: 10px !important;
            aspect-ratio: auto !important;
            object-fit: contain !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
          }
          .svc-hero-visual .svc-hero-play {
            width: clamp(72px, 16vw, 96px) !important;
            height: clamp(72px, 16vw, 96px) !important;
          }
          .svc-hero-visual .svc-hero-play svg {
            width: 30px !important;
            height: 30px !important;
          }
          .svc-hero-visual .svc-hero-dots-tl {
            top: -18px !important;
            left: -14px !important;
            z-index: 0 !important;
            gap: 10px !important;
            grid-template-columns: repeat(6, 3.5px) !important;
          }
          .svc-hero-visual .svc-hero-dots-br {
            bottom: -22px !important;
            right: -22px !important;
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
          width: '108%',
          marginLeft: 0,
          marginRight: 0,
        }}
      >
        <DotGrid
          className="svc-hero-dots svc-hero-dots-tl"
          top={-42}
          left={-42}
          cols={8}
          rows={8}
          gap={18}
          size={3.5}
          opacity={1}
        />
        <DotGrid
          className="svc-hero-dots svc-hero-dots-br"
          bottom={-42}
          right={-42}
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
          <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', background: '#0F172A' }}>
            <video
              ref={videoRef}
              className="svc-hero-media"
              src={serviceLandingAssets.heroVideo}
              poster={serviceLandingAssets.heroPoster}
              playsInline
              preload="metadata"
              controls={started}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                aspectRatio: '1774 / 887',
                objectFit: 'cover',
                borderRadius: 22,
                background: '#0F172A',
              }}
            />

            {!playing ? (
              <button
                type="button"
                onClick={handlePlayClick}
                aria-label="Смотреть видео"
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 0,
                  padding: 0,
                  border: 'none',
                  cursor: 'pointer',
                  background: started
                    ? 'rgba(15, 23, 42, 0.28)'
                    : 'linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(15,23,42,0.28) 100%)',
                }}
              >
                <span
                  className="svc-hero-play"
                  style={{
                    width: 'clamp(88px, 10.5%, 130px)',
                    height: 'clamp(88px, 10.5%, 130px)',
                    aspectRatio: '1',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 55%, #6D28D9 100%)',
                    boxShadow:
                      '0 12px 32px rgba(124, 58, 237, 0.45), 0 0 0 10px rgba(255, 255, 255, 0.22)',
                    transition: 'transform 0.18s ease',
                    pointerEvents: 'none',
                  }}
                >
                  <svg width={40} height={40} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M9 7.5v9l8-4.5-8-4.5z" fill="#fff" />
                  </svg>
                </span>
              </button>
            ) : null}
          </div>
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
        />,
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
