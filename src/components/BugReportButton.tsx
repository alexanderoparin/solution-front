import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClipboardEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, Modal, Tooltip, Upload, message } from 'antd'
import { BugOutlined, PaperClipOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { userApi } from '../api/user'
import { getFilesFromClipboardData, renameGenericClipboardFile } from '../utils/clipboardFiles'

interface BugReportFormValues {
  message: string
}

interface AttachedImage {
  uid: string
  file: File
  previewUrl: string
}

const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'])

function isAllowedImage(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  if (ALLOWED_IMAGE_TYPES.has(type)) {
    return true
  }
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name || '')
}

export default function BugReportButton() {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<AttachedImage[]>([])
  const imagesRef = useRef<AttachedImage[]>([])
  const [form] = Form.useForm<BugReportFormValues>()
  imagesRef.current = images

  const resetForm = () => {
    form.resetFields()
    setImages((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      return []
    })
  }

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [])

  const addImages = useCallback((files: File[]) => {
    const accepted: AttachedImage[] = []
    for (const file of files) {
      if (!isAllowedImage(file)) {
        message.error('Можно прикрепить только изображения (JPG, PNG, GIF, WebP, BMP)')
        continue
      }
      if (file.size > MAX_IMAGE_BYTES) {
        message.error(`«${file.name}» больше 5 МБ`)
        continue
      }
      accepted.push({
        uid: `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })
    }
    if (accepted.length === 0) {
      return
    }
    setImages((prev) => {
      const room = MAX_IMAGES - prev.length
      if (room <= 0) {
        accepted.forEach((item) => URL.revokeObjectURL(item.previewUrl))
        message.warning('Можно прикрепить не больше 5 изображений')
        return prev
      }
      if (accepted.length > room) {
        accepted.slice(room).forEach((item) => URL.revokeObjectURL(item.previewUrl))
        message.warning('Можно прикрепить не больше 5 изображений')
      }
      return [...prev, ...accepted.slice(0, room)]
    })
  }, [])

  const submitMutation = useMutation({
    mutationFn: (values: BugReportFormValues) =>
      userApi.submitBugReport({
        message: values.message.trim(),
        pageUrl: window.location.href,
        files: images.map((item) => item.file),
      }),
    onSuccess: (response) => {
      message.success(response.message || 'Сообщение отправлено. Спасибо!')
      resetForm()
      setOpen(false)
    },
    onError: (error: { response?: { data?: { message?: string; error?: string } } }) => {
      const msg =
        error.response?.data?.message ?? error.response?.data?.error ?? 'Не удалось отправить сообщение'
      message.error(msg)
    },
  })

  const handleClose = () => {
    if (!submitMutation.isPending) {
      setOpen(false)
      resetForm()
    }
  }

  const handlePaste = (event: ClipboardEvent) => {
    const files = getFilesFromClipboardData(event.clipboardData)
      .map(renameGenericClipboardFile)
      .filter(isAllowedImage)
    if (files.length === 0) {
      return
    }
    event.preventDefault()
    addImages(files)
    message.success(files.length === 1 ? 'Скриншот добавлен из буфера обмена' : `Добавлено изображений: ${files.length}`)
  }

  const uploadFileList: UploadFile[] = images.map((item) => ({
    uid: item.uid,
    name: item.file.name,
    status: 'done',
    url: item.previewUrl,
  }))

  return (
    <>
      <Tooltip title="Найден баг? Напиши">
        <Button
          type="text"
          aria-label="Найден баг? Напиши"
          icon={<BugOutlined style={{ fontSize: 18 }} />}
          onClick={() => setOpen(true)}
          style={{
            color: '#CBD5E1',
            width: 36,
            height: 36,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Tooltip>
      <Modal
        title="Найден баг?"
        open={open}
        onCancel={handleClose}
        footer={null}
        destroyOnClose
        width={520}
      >
        <div onPaste={handlePaste}>
          <p style={{ marginTop: 0, marginBottom: 16, lineHeight: 1.5 }}>
            Спасибо, что помогаете тестировать сервис! Будем рады вашей обратной связи: замечания, баги,
            предложения
          </p>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={(values) => submitMutation.mutate(values)}
          >
            <Form.Item
              name="message"
              rules={[
                { required: true, message: 'Напишите сообщение' },
                { max: 4000, message: 'Сообщение слишком длинное' },
              ]}
            >
              <Input.TextArea
                placeholder="Опишите, что произошло или что можно улучшить"
                rows={5}
                maxLength={4000}
                showCount
              />
            </Form.Item>
            <Form.Item label="Скриншоты" style={{ marginBottom: 16 }}>
              <Upload
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,.jpg,.jpeg,.png,.gif,.webp,.bmp"
                listType="picture"
                fileList={uploadFileList}
                beforeUpload={(file) => {
                  addImages([file])
                  return false
                }}
                onRemove={(file) => {
                  setImages((prev) => {
                    const removed = prev.find((item) => item.uid === file.uid)
                    if (removed) {
                      URL.revokeObjectURL(removed.previewUrl)
                    }
                    return prev.filter((item) => item.uid !== file.uid)
                  })
                }}
                disabled={submitMutation.isPending}
              >
                <Button icon={<PaperClipOutlined />} disabled={images.length >= MAX_IMAGES || submitMutation.isPending}>
                  Прикрепить изображение
                </Button>
              </Upload>
              <div style={{ marginTop: 8, color: '#64748B', fontSize: 13 }}>
                До 5 файлов, до 5 МБ каждый. Можно вставить скриншот из буфера (Ctrl+V).
              </div>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block loading={submitMutation.isPending}>
                Отправить
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  )
}
