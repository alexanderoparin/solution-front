import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { abTestApi } from '../api/abTest'
import { enqueueAbTestImageLoad } from '../utils/abTestImageQueue'

type AbTestVariantImageProps = {
  testId: number
  variantId: number
  hasLocalImage?: boolean
  photoUrl?: string | null
  previewUrl?: string | null
  sellerId?: number
  cabinetId?: number | null
  alt?: string
  style?: CSSProperties
}

/**
 * Превью варианта: локальный файл через API (blob + Bearer), иначе CDN URL.
 * Загрузка с API — только когда картинка в viewport, и не больше 2 параллельно.
 */
export default function AbTestVariantImage({
  testId,
  variantId,
  hasLocalImage,
  photoUrl,
  previewUrl,
  sellerId,
  cabinetId,
  alt = '',
  style,
}: AbTestVariantImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const rootRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const node = rootRef.current
    if (!node || !hasLocalImage) {
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasLocalImage])

  useEffect(() => {
    if (!hasLocalImage || !visible) {
      setBlobUrl(null)
      return
    }
    let cancelled = false
    let objectUrl: string | null = null
    void enqueueAbTestImageLoad(() =>
      abTestApi.getVariantImageBlob(testId, variantId, sellerId, cabinetId ?? undefined),
    )
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(null)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [hasLocalImage, visible, testId, variantId, sellerId, cabinetId])

  const src = hasLocalImage ? blobUrl ?? '' : photoUrl ?? previewUrl ?? ''

  return (
    <span ref={rootRef} style={{ display: 'inline-block', lineHeight: 0 }}>
      <img src={src} alt={alt} style={style} />
    </span>
  )
}
