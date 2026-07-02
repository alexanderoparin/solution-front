import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Button, Space, message } from 'antd'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { borderRadius } from '../styles/analytics'

const ZOOM_STEP = 1.15
const ZOOM_MIN = 0.35
const ZOOM_MAX = 5

export type NoteImagePreview = {
  url: string
  fileName: string
}

type NoteImagePreviewModalProps = {
  preview: NoteImagePreview | null
  onClose: () => void
}

/**
 * Просмотр изображения из заметки: по умолчанию «подогнать в окно», +/- для пошагового масштаба.
 */
export function NoteImagePreviewModal({ preview, onClose }: NoteImagePreviewModalProps) {
  const [fitWindow, setFitWindow] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [fitBaseWidth, setFitBaseWidth] = useState<number | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const resetView = useCallback(() => {
    setFitWindow(true)
    setZoom(1)
    setFitBaseWidth(null)
  }, [])

  useEffect(() => {
    if (preview) {
      resetView()
    }
  }, [preview?.url, resetView])

  const captureFitWidth = useCallback(() => {
    const width = imgRef.current?.clientWidth
    if (width && width > 0) {
      setFitBaseWidth(width)
    }
  }, [])

  const handleClose = () => {
    if (preview?.url) {
      window.URL.revokeObjectURL(preview.url)
    }
    resetView()
    onClose()
  }

  const fitToWindow = () => {
    setFitWindow(true)
    setZoom(1)
    setFitBaseWidth(null)
  }

  const zoomIn = () => {
    if (fitWindow) {
      const width = imgRef.current?.clientWidth
      if (width && width > 0) {
        setFitBaseWidth(width)
      }
      setFitWindow(false)
      setZoom(ZOOM_STEP)
      return
    }
    setZoom((current) => Math.min(current * ZOOM_STEP, ZOOM_MAX))
  }

  const zoomOut = () => {
    if (fitWindow) {
      return
    }
    const next = zoom / ZOOM_STEP
    if (next <= 1) {
      fitToWindow()
      return
    }
    setZoom(Math.max(next, ZOOM_MIN))
  }

  const zoomLabel = fitWindow ? 'В окно' : `${Math.round(zoom * 100)}%`

  return (
    <Modal
      title={preview?.fileName || 'Просмотр изображения'}
      open={!!preview}
      onCancel={handleClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button onClick={fitToWindow} disabled={fitWindow}>
            Подогнать в окно
          </Button>
          <Space>
            <Button icon={<MinusOutlined />} onClick={zoomOut} disabled={fitWindow} aria-label="Уменьшить" />
            <span style={{ minWidth: 48, textAlign: 'center', display: 'inline-block', fontSize: 12 }}>{zoomLabel}</span>
            <Button icon={<PlusOutlined />} onClick={zoomIn} aria-label="Увеличить" />
          </Space>
        </div>
      }
      centered
      width="calc(100vw - 16px)"
      styles={{
        content: { maxWidth: 'calc(100vw - 16px)', width: 'calc(100vw - 16px)' },
        body: { paddingTop: 8 },
      }}
    >
      {preview && (
        <div
          style={{
            overflow: 'auto',
            maxHeight: 'min(85vh, 900px)',
            textAlign: 'center',
          }}
        >
          <img
            ref={imgRef}
            src={preview.url}
            alt={preview.fileName}
            onLoad={captureFitWidth}
            style={
              fitWindow
                ? {
                    maxWidth: '100%',
                    maxHeight: 'min(75vh, 820px)',
                    objectFit: 'contain',
                    borderRadius: borderRadius.sm,
                    display: 'inline-block',
                    verticalAlign: 'top',
                  }
                : {
                    width: fitBaseWidth ? fitBaseWidth * zoom : 'auto',
                    height: 'auto',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    borderRadius: borderRadius.sm,
                    display: 'inline-block',
                    verticalAlign: 'top',
                  }
            }
            onError={() => {
              message.error('Ошибка при загрузке изображения')
              handleClose()
            }}
          />
        </div>
      )}
    </Modal>
  )
}
