import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from 'antd'
import { CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { landingColors, landingRadii } from '../../styles/landing'

interface LandingServiceGalleryModalProps {
  open: boolean
  title: string
  images: readonly string[]
  onClose: () => void
}

/**
 * Галерея скриншотов сервиса.
 * Без Ant Design Modal: у него transform при центрировании размывает картинки.
 */
export default function LandingServiceGalleryModal({
  open,
  title,
  images,
  onClose,
}: LandingServiceGalleryModalProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setIndex(0)
    }
  }, [open, images])

  const goPrev = useCallback(() => {
    setIndex((current) => (current === 0 ? images.length - 1 : current - 1))
  }, [images.length])

  const goNext = useCallback(() => {
    setIndex((current) => (current === images.length - 1 ? 0 : current + 1))
  }, [images.length])

  useEffect(() => {
    if (!open) {
      return undefined
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft') {
        goPrev()
      } else if (event.key === 'ArrowRight') {
        goNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, goPrev, goNext])

  if (!open || images.length === 0 || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(1320px, 96vw)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: landingRadii.lg,
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 16px',
            borderBottom: `1px solid ${landingColors.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: landingColors.textPrimary }}>{title}</div>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} aria-label="Закрыть" />
        </div>

        <div
          style={{
            position: 'relative',
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backgroundColor: landingColors.sectionBg,
          }}
        >
          {/*
            width/height auto + max-limits: без принудительного width:100%,
            чтобы браузер меньше «размывал» скрин при дробном масштабе.
          */}
          <img
            src={images[index]}
            alt={`${title} — слайд ${index + 1}`}
            loading="eager"
            decoding="sync"
            style={{
              display: 'block',
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: 'calc(92vh - 140px)',
              objectFit: 'contain',
              borderRadius: landingRadii.md,
              border: `1px solid ${landingColors.border}`,
              backgroundColor: '#FFFFFF',
            }}
          />

          {images.length > 1 ? (
            <>
              <Button
                type="default"
                shape="circle"
                icon={<LeftOutlined />}
                onClick={goPrev}
                aria-label="Предыдущее фото"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  marginTop: -18,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              />
              <Button
                type="default"
                shape="circle"
                icon={<RightOutlined />}
                onClick={goNext}
                aria-label="Следующее фото"
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  marginTop: -18,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              />
            </>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px 16px',
              borderTop: `1px solid ${landingColors.border}`,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {images.map((src, dotIndex) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setIndex(dotIndex)}
                  aria-label={`Слайд ${dotIndex + 1}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    backgroundColor: dotIndex === index ? landingColors.accent : '#CBD5E1',
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 13, color: landingColors.textSecondary }}>
              {index + 1} / {images.length}
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
