import { useEffect, useState, type CSSProperties } from 'react'
import { abTestApi } from '../api/abTest'

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

  useEffect(() => {
    if (!hasLocalImage) {
      setBlobUrl(null)
      return
    }
    let cancelled = false
    let objectUrl: string | null = null
    abTestApi
      .getVariantImageBlob(testId, variantId, sellerId, cabinetId ?? undefined)
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
  }, [hasLocalImage, testId, variantId, sellerId, cabinetId])

  const src = hasLocalImage ? blobUrl ?? '' : photoUrl ?? previewUrl ?? ''

  return <img src={src} alt={alt} style={style} />
}
