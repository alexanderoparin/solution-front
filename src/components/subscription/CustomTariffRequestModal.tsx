import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, InputNumber, Modal, message } from 'antd'
import { subscriptionApi } from '../../api/subscription'
import { useAuthStore } from '../../store/authStore'

const accent = '#7C3AED'
const TELEGRAM_PREFIX = '@'

interface CustomTariffRequestModalProps {
  open: boolean
  onClose: () => void
}

interface FormValues {
  cabinetsCount?: number
  telegram?: string
  phone?: string
  message: string
}

function normalizeTelegramInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return TELEGRAM_PREFIX
  }
  const username = trimmed.startsWith(TELEGRAM_PREFIX) ? trimmed.slice(1) : trimmed
  return `${TELEGRAM_PREFIX}${username.replace(/^@+/, '')}`
}

function isTelegramFilled(value: string | undefined): boolean {
  if (!value) return false
  return normalizeTelegramInput(value).length > TELEGRAM_PREFIX.length
}

/**
 * Форма заявки на индивидуальный тариф (свыше 10 кабинетов).
 * Письмо уходит на корпоративную почту.
 */
export default function CustomTariffRequestModal({ open, onClose }: CustomTariffRequestModalProps) {
  const [form] = Form.useForm<FormValues>()
  const email = useAuthStore((s) => s.email)

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        cabinetsCount: undefined,
        telegram: TELEGRAM_PREFIX,
        phone: undefined,
        message: undefined,
      })
    }
  }, [open, form])

  const submitMutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (values.cabinetsCount == null) {
        return Promise.reject(new Error('Укажите количество кабинетов'))
      }
      const telegram = isTelegramFilled(values.telegram)
        ? normalizeTelegramInput(values.telegram!)
        : undefined
      return subscriptionApi.submitCustomTariffRequest({
        cabinetsCount: values.cabinetsCount,
        telegram,
        phone: values.phone?.trim() || undefined,
        message: values.message.trim(),
      })
    },
    onSuccess: (response) => {
      message.success(response.message || 'Заявка отправлена')
      form.resetFields()
      onClose()
    },
    onError: (error: { response?: { data?: { message?: string; error?: string } } }) => {
      const msg =
        error.response?.data?.message ?? error.response?.data?.error ?? 'Не удалось отправить заявку'
      message.error(msg)
    },
  })

  const handleClose = () => {
    if (!submitMutation.isPending) {
      onClose()
    }
  }

  return (
    <Modal
      title="Заявка на тариф свыше 10 кабинетов"
      open={open}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      width={480}
    >
      <p style={{ marginTop: 0, marginBottom: 16, color: '#64748B', lineHeight: 1.5 }}>
        Оставьте заявку — мы рассчитаем индивидуальные условия и свяжемся с вами.
        {email ? (
          <>
            {' '}
            Ответ придёт на <span style={{ color: '#0F172A' }}>{email}</span> или указанный контакт.
          </>
        ) : null}
      </p>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ telegram: TELEGRAM_PREFIX }}
        onFinish={(values) => submitMutation.mutate(values)}
      >
        <Form.Item
          name="cabinetsCount"
          label="Сколько кабинетов нужно"
          rules={[
            { required: true, message: 'Укажите количество' },
            {
              type: 'number',
              min: 11,
              message: 'Минимум 11 кабинетов',
            },
          ]}
        >
          <InputNumber
            min={11}
            max={10000}
            placeholder="Например, 15"
            style={{ width: '100%' }}
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="telegram"
          label="Telegram"
          rules={[{ max: 64, message: 'Telegram слишком длинный' }]}
        >
          <Input
            placeholder="username"
            size="large"
            onChange={(event) => {
              form.setFieldValue('telegram', normalizeTelegramInput(event.target.value))
            }}
          />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Телефон"
          rules={[{ max: 32, message: 'Телефон слишком длинный' }]}
        >
          <Input placeholder="+7…" size="large" />
        </Form.Item>
        <Form.Item
          name="message"
          label="Сообщение"
          rules={[
            { required: true, message: 'Напишите сообщение' },
            { max: 4000, message: 'Сообщение слишком длинное' },
          ]}
        >
          <Input.TextArea
            placeholder="Расскажите о задаче: сроки, маркетплейсы, что важно учесть"
            rows={4}
            maxLength={4000}
            showCount
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitMutation.isPending}
            style={{ background: accent, borderColor: accent, fontWeight: 600, height: 44 }}
          >
            Отправить заявку
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
